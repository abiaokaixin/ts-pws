import {
  Browser,
  BrowserContext,
  Page,
} from 'playwright-core';
import { v4 as uuidv4 } from 'uuid';
import { launch as cbLaunch } from 'cloakbrowser';
import { config } from '../config.js';
import type {
  LaunchOptions,
  ContextOptions,
  NavigateOptions,
  ClickOptions,
  TypeOptions,
  ScrollOptions,
  ScreenshotOptions,
  EvaluateOptions,
  WaitOptions,
  BrowserStatus,
  PageStatus,
} from './types.js';

// ---------------------------------------------------------------------------
// Internal state
// ---------------------------------------------------------------------------
interface BrowserRecord {
  browser: Browser;
  contexts: Map<string, ContextRecord>;
  createdAt: number;
  lastUsedAt: number;
  launchOptions: LaunchOptions;
}

interface ContextRecord {
  context: BrowserContext;
  pages: Map<string, PageRecord>;
  createdAt: number;
  options: ContextOptions;
}

interface PageRecord {
  page: Page;
  createdAt: number;
  lastUsedAt: number;
  locked: boolean;
  suspended: boolean;
}

const browsers = new Map<string, BrowserRecord>();

// ---------------------------------------------------------------------------
// Browser lifecycle
// ---------------------------------------------------------------------------

/**
 * Launch a new stealth browser instance.
 */
export async function launchBrowser(options: LaunchOptions = {}): Promise<string> {
  if (browsers.size >= config.maxBrowsers) {
    throw new Error(`Max browser instances reached (${config.maxBrowsers})`);
  }

  const headless = options.headless ?? true;

  // Build launch options — most stealth/humanize details
  // are handled internally by the npm package.
  const cbOpts: Record<string, unknown> = {
    headless,
    stealthArgs: options.stealthArgs ?? true,
    humanize: options.humanize ?? false,
    humanPreset: (options.humanPreset as 'default' | 'careful') || undefined,
  };

  // Proxy
  if (options.proxy) {
    cbOpts.proxy = options.proxy as string | { server: string; bypass?: string; username?: string; password?: string };
  }

  // Timezone & Locale
  if (options.timezone) cbOpts.timezone = options.timezone;
  if (options.locale) cbOpts.locale = options.locale;

  // Additional raw launch options
  if (options.args) cbOpts.args = options.args;

  // Extra launchOptions passthrough
  const extraLaunchOpts: Record<string, unknown> = {};
  if (options.userAgent) extraLaunchOpts.userAgent = options.userAgent;
  if (options.viewport !== undefined) extraLaunchOpts.viewport = options.viewport;
  if (options.colorScheme) extraLaunchOpts.colorScheme = options.colorScheme;
  if (Object.keys(extraLaunchOpts).length > 0) {
    cbOpts.launchOptions = extraLaunchOpts;
  }

  // Launch — this gives us:
  // - stealth Chromium binary with C++ fingerprint patches
  // - random fingerprint seed per session
  // - platform-specific fingerprint profile
  // - human-like behavior (if humanize: true)
  const browser = await cbLaunch(cbOpts);

  // Create a default context with viewport/user-agent
  const contextOpts: Record<string, unknown> = {};
  contextOpts.viewport = options.viewport ?? { width: 1920, height: 947 };
  if (options.userAgent) contextOpts.userAgent = options.userAgent;
  if (options.colorScheme) contextOpts.colorScheme = options.colorScheme;
  if (options.locale) contextOpts.locale = options.locale;

  const defaultContext = await browser.newContext(contextOpts);

  const browserId = uuidv4();
  const contextId = uuidv4();
  const defaultPage = await defaultContext.newPage();

  const pageId = uuidv4();
  const ctxRecord: ContextRecord = {
    context: defaultContext,
    pages: new Map([[pageId, {
      page: defaultPage,
      createdAt: Date.now(),
      lastUsedAt: Date.now(),
      locked: false,
      suspended: false,
    }]]),
    createdAt: Date.now(),
    options: contextOpts as ContextOptions,
  };

  const record: BrowserRecord = {
    browser,
    contexts: new Map([[contextId, ctxRecord]]),
    createdAt: Date.now(),
    lastUsedAt: Date.now(),
    launchOptions: options,
  };

  browsers.set(browserId, record);

  return browserId;
}

/**
 * Close a browser instance and all its contexts/pages.
 */
export async function closeBrowser(browserId: string): Promise<void> {
  const record = getBrowserRecord(browserId);
  try {
    await record.browser.close();
  } finally {
    browsers.delete(browserId);
  }
}

/**
 * Get browser status summary.
 */
export function getBrowserStatus(browserId: string): BrowserStatus {
  const record = getBrowserRecord(browserId);
  let totalPages = 0;
  for (const ctx of record.contexts.values()) {
    totalPages += ctx.pages.size;
  }
  return {
    browserId,
    contextCount: record.contexts.size,
    pageCount: totalPages,
    uptime: Date.now() - record.createdAt,
    headless: record.launchOptions.headless ?? true,
  };
}

/**
 * List all pages in a browser, grouped by context.
 */
export function listPages(browserId: string): Array<{ contextId: string; pageId: string; url: string }> {
  const record = getBrowserRecord(browserId);
  const result: Array<{ contextId: string; pageId: string; url: string }> = [];
  for (const [ctxId, ctxRecord] of record.contexts) {
    for (const [pageId, pageRecord] of ctxRecord.pages) {
      result.push({ contextId: ctxId, pageId, url: pageRecord.page.url() });
    }
  }
  return result;
}

/**
 * List all active browser IDs.
 */
export function listBrowsers(): string[] {
  return Array.from(browsers.keys());
}

// ---------------------------------------------------------------------------
// Context lifecycle
// ---------------------------------------------------------------------------

/**
 * Create a new context in an existing browser.
 */
export async function createContext(
  browserId: string,
  options: ContextOptions = {}
): Promise<string> {
  const record = getBrowserRecord(browserId);

  const ctxOpts: Record<string, unknown> = {};
  ctxOpts.viewport = options.viewport ?? { width: 1920, height: 947 };
  if (options.userAgent) ctxOpts.userAgent = options.userAgent;
  if (options.colorScheme) ctxOpts.colorScheme = options.colorScheme;
  if (options.locale) ctxOpts.locale = options.locale;
  if (options.timezone) ctxOpts.timezone = options.timezone;
  if (options.proxy) {
    ctxOpts.proxy = typeof options.proxy === 'string'
      ? { server: options.proxy }
      : options.proxy;
  }
  if (options.storageState) ctxOpts.storageState = options.storageState;

  const context = await record.browser.newContext(ctxOpts);

  const contextId = uuidv4();
  record.contexts.set(contextId, {
    context,
    pages: new Map(),
    createdAt: Date.now(),
    options,
  });

  return contextId;
}

/**
 * Close a context.
 */
export async function closeContext(browserId: string, contextId: string): Promise<void> {
  const record = getBrowserRecord(browserId);
  const ctxRecord = record.contexts.get(contextId);
  if (!ctxRecord) {
    throw new Error(`Context not found: ${contextId}`);
  }
  try {
    await ctxRecord.context.close();
  } finally {
    record.contexts.delete(contextId);
  }
}

// ---------------------------------------------------------------------------
// Page lifecycle
// ---------------------------------------------------------------------------

/**
 * Create a new page in a context. If contextId is omitted, uses the default context.
 */
export async function createPage(
  browserId: string,
  contextId?: string
): Promise<{ pageId: string; contextId: string }> {
  const record = getBrowserRecord(browserId);
  const actualContextId = contextId || record.contexts.keys().next().value;
  if (!actualContextId) {
    return createPage(browserId, await createContext(browserId));
  }

  const ctxRecord = record.contexts.get(actualContextId);
  if (!ctxRecord) {
    throw new Error(`Context not found: ${actualContextId}`);
  }

  const page = await ctxRecord.context.newPage();
  const pageId = uuidv4();
  ctxRecord.pages.set(pageId, {
    page,
    createdAt: Date.now(),
    lastUsedAt: Date.now(),
    locked: false,
    suspended: false,
  });

  return { pageId, contextId: actualContextId };
}

/**
 * Close a page.
 */
export async function closePage(browserId: string, pageId: string): Promise<void> {
  const { ctxRecord, pageRecord } = resolvePage(browserId, pageId);
  try {
    await pageRecord.page.close();
  } finally {
    ctxRecord.pages.delete(pageId);
  }
}

/**
 * Get page status.
 */
export function getPageStatus(browserId: string, pageId: string): PageStatus {
  const { pageRecord, contextId } = resolvePage(browserId, pageId);
  return {
    pageId,
    browserId,
    contextId,
    url: pageRecord.page.url(),
    title: '',
    locked: pageRecord.locked,
    suspended: pageRecord.suspended,
  };
}

// ---------------------------------------------------------------------------
// Page operations
// ---------------------------------------------------------------------------

export async function navigate(browserId: string, pageId: string, opts: NavigateOptions): Promise<void> {
  const { pageRecord } = resolvePage(browserId, pageId);
  await pageRecord.page.goto(opts.url, {
    waitUntil: opts.waitUntil || 'load',
    timeout: opts.timeout || config.navigationTimeout,
    referer: opts.referer,
  });
  touchPage(pageRecord);
}

export async function getPageContent(browserId: string, pageId: string): Promise<string> {
  const { pageRecord } = resolvePage(browserId, pageId);
  touchPage(pageRecord);
  return pageRecord.page.content();
}

export async function getPageTitle(browserId: string, pageId: string): Promise<string> {
  const { pageRecord } = resolvePage(browserId, pageId);
  touchPage(pageRecord);
  return pageRecord.page.title();
}

export async function getPageUrl(browserId: string, pageId: string): Promise<string> {
  const { pageRecord } = resolvePage(browserId, pageId);
  touchPage(pageRecord);
  return pageRecord.page.url();
}

export async function takeScreenshot(
  browserId: string,
  pageId: string,
  opts: ScreenshotOptions = {}
): Promise<Buffer> {
  const { pageRecord } = resolvePage(browserId, pageId);
  touchPage(pageRecord);

  const screenshotOpts: Record<string, unknown> = {};
  if (opts.fullPage !== undefined) screenshotOpts.fullPage = opts.fullPage;
  if (opts.type) screenshotOpts.type = opts.type;
  if (opts.quality !== undefined) screenshotOpts.quality = opts.quality;
  if (opts.clip) screenshotOpts.clip = opts.clip;

  if (opts.selector) {
    const el = pageRecord.page.locator(opts.selector);
    return el.screenshot(screenshotOpts);
  }

  return pageRecord.page.screenshot(screenshotOpts);
}

export async function evaluate(
  browserId: string,
  pageId: string,
  opts: EvaluateOptions
): Promise<unknown> {
  const { pageRecord } = resolvePage(browserId, pageId);
  touchPage(pageRecord);

  try {
    const fn = new Function(`return (${opts.expression})`)();
    if (typeof fn === 'function') {
      return pageRecord.page.evaluate(fn, opts.arg);
    }
  } catch {
    // Not a valid function, evaluate as expression
  }
  return pageRecord.page.evaluate(opts.expression);
}

export async function click(
  browserId: string,
  pageId: string,
  opts: ClickOptions
): Promise<void> {
  const { pageRecord } = resolvePage(browserId, pageId);
  touchPage(pageRecord);

  // If humanize: true was set at browser launch, the npm package's monkey-patching
  // handles Bezier curve mouse movements automatically.
  await pageRecord.page.click(opts.selector, {
    button: opts.button,
    clickCount: opts.clickCount,
    delay: opts.delay,
    force: opts.force,
    timeout: opts.timeout || config.defaultTimeout,
    modifiers: opts.modifiers as Array<'Alt' | 'Control' | 'Meta' | 'Shift'> | undefined,
  });
}

export async function type(
  browserId: string,
  pageId: string,
  opts: TypeOptions
): Promise<void> {
  const { pageRecord } = resolvePage(browserId, pageId);
  touchPage(pageRecord);

  if (opts.clearFirst) {
    await pageRecord.page.locator(opts.selector).fill('');
  }

  // If humanize: true was set at browser launch, the npm package's monkey-patching
  // handles per-character typing with delays and mistake simulation automatically.
  await pageRecord.page.locator(opts.selector).fill(opts.text);
}

export async function scrollTo(
  browserId: string,
  pageId: string,
  opts: ScrollOptions
): Promise<void> {
  const { pageRecord } = resolvePage(browserId, pageId);
  touchPage(pageRecord);

  await pageRecord.page.locator(opts.selector).scrollIntoViewIfNeeded();
}

export async function hover(
  browserId: string,
  pageId: string,
  selector: string
): Promise<void> {
  const { pageRecord } = resolvePage(browserId, pageId);
  touchPage(pageRecord);

  await pageRecord.page.locator(selector).hover();
}

export async function waitFor(
  browserId: string,
  pageId: string,
  opts: WaitOptions
): Promise<void> {
  const { pageRecord } = resolvePage(browserId, pageId);
  touchPage(pageRecord);

  if (opts.millis) {
    await pageRecord.page.waitForTimeout(opts.millis);
    return;
  }

  if (opts.selector) {
    await pageRecord.page.waitForSelector(opts.selector, {
      state: opts.state || 'visible',
      timeout: opts.timeout || config.defaultTimeout,
    });
  }

  if (opts.waitForNavigation) {
    await pageRecord.page.waitForLoadState('networkidle');
  }
}

export async function getCookies(
  browserId: string,
  pageId: string
): Promise<Array<{ name: string; value: string; domain: string; path: string }>> {
  const { ctxRecord, pageRecord } = resolvePage(browserId, pageId);
  touchPage(pageRecord);
  return ctxRecord.context.cookies();
}

export async function elementExists(
  browserId: string,
  pageId: string,
  selector: string
): Promise<boolean> {
  const { pageRecord } = resolvePage(browserId, pageId);
  touchPage(pageRecord);

  try {
    const count = await pageRecord.page.locator(selector).count();
    return count > 0;
  } catch {
    return false;
  }
}

export async function getElementText(
  browserId: string,
  pageId: string,
  selector: string
): Promise<string | null> {
  const { pageRecord } = resolvePage(browserId, pageId);
  touchPage(pageRecord);

  try {
    const el = pageRecord.page.locator(selector);
    if (await el.count() === 0) return null;
    return (await el.innerText()).trim() || null;
  } catch {
    return null;
  }
}

export async function getAllTexts(
  browserId: string,
  pageId: string,
  selector: string
): Promise<string[]> {
  const { pageRecord } = resolvePage(browserId, pageId);
  touchPage(pageRecord);

  const els = pageRecord.page.locator(selector);
  return els.allInnerTexts();
}

export async function getAttribute(
  browserId: string,
  pageId: string,
  selector: string,
  attribute: string
): Promise<string | null> {
  const { pageRecord } = resolvePage(browserId, pageId);
  touchPage(pageRecord);

  try {
    const el = pageRecord.page.locator(selector);
    if (await el.count() === 0) return null;
    return await el.getAttribute(attribute);
  } catch {
    return null;
  }
}

export async function getAllAttributes(
  browserId: string,
  pageId: string,
  selector: string,
  attribute: string
): Promise<Array<string | null>> {
  const { pageRecord } = resolvePage(browserId, pageId);
  touchPage(pageRecord);

  const els = pageRecord.page.locator(selector);
  return els.evaluateAll(
    (elements: any[], attr: string) => elements.map((el: any) => el.getAttribute ? el.getAttribute(attr) : null),
    attribute
  );
}

export async function hasClass(
  browserId: string,
  pageId: string,
  selector: string,
  className: string
): Promise<boolean> {
  const { pageRecord } = resolvePage(browserId, pageId);
  touchPage(pageRecord);

  try {
    const el = pageRecord.page.locator(selector);
    if (await el.count() === 0) return false;
    const classes = await el.getAttribute('class');
    return classes?.split(/\s+/).includes(className) ?? false;
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function getBrowserRecord(browserId: string): BrowserRecord {
  const record = browsers.get(browserId);
  if (!record) {
    throw new Error(`Browser not found: ${browserId}`);
  }
  return record;
}

function resolvePage(browserId: string, pageId: string): {
  record: BrowserRecord;
  ctxRecord: ContextRecord;
  pageRecord: PageRecord;
  contextId: string;
} {
  const record = getBrowserRecord(browserId);
  for (const [ctxId, ctxRecord] of record.contexts) {
    const found = ctxRecord.pages.get(pageId);
    if (found) {
      return { record, ctxRecord, pageRecord: found, contextId: ctxId };
    }
  }
  throw new Error(`Page not found: ${pageId} in browser ${browserId}`);
}

function touchPage(record: PageRecord): void {
  record.lastUsedAt = Date.now();
}

// Export page & context for direct access
export function getPage(browserId: string, pageId: string): Page {
  return resolvePage(browserId, pageId).pageRecord.page;
}

export function getContext(browserId: string, contextId: string): BrowserContext {
  const record = getBrowserRecord(browserId);
  const ctxRecord = record.contexts.get(contextId);
  if (!ctxRecord) throw new Error(`Context not found: ${contextId}`);
  return ctxRecord.context;
}

export function getRawBrowser(browserId: string): Browser {
  return getBrowserRecord(browserId).browser;
}