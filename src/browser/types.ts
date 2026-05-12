import { Browser, BrowserContext, BrowserType, Page } from 'playwright';

/** Proxy configuration */
export interface ProxySettings {
  server: string;
  bypass?: string;
  username?: string;
  password?: string;
}

/** Options for launching a browser instance */
export interface LaunchOptions {
  /** Run in headless mode (default: false) */
  headless?: boolean;
  /** Proxy configuration */
  proxy?: string | ProxySettings;
  /** Additional Chrome arguments */
  args?: string[];
  /** Use default stealth arguments (default: true) */
  stealthArgs?: boolean;
  /** IANA timezone (e.g. 'America/New_York') */
  timezone?: string;
  /** BCP 47 locale (e.g. 'en-US') */
  locale?: string;
  /** User agent override */
  userAgent?: string;
  /** Viewport size (null to disable emulation) */
  viewport?: { width: number; height: number } | null;
  /** Color scheme: 'light' | 'dark' | 'no-preference' */
  colorScheme?: 'light' | 'dark' | 'no-preference';
  /** Enable human-like behavior (default: false) */
  humanize?: boolean;
  /** Human behavior preset: 'default' | 'careful' */
  humanPreset?: string;
  /** Additional Playwright launch options */
  [key: string]: unknown;
}

/** Options for creating a new browser context */
export interface ContextOptions {
  userAgent?: string;
  viewport?: { width: number; height: number } | null;
  colorScheme?: 'light' | 'dark' | 'no-preference';
  timezone?: string;
  locale?: string;
  proxy?: string | ProxySettings;
  storageState?: string;
  /** Additional Playwright context options */
  [key: string]: unknown;
}

/** Navigation options */
export interface NavigateOptions {
  url: string;
  waitUntil?: 'load' | 'domcontentloaded' | 'networkidle' | 'commit';
  timeout?: number;
  referer?: string;
}

/** Click options */
export interface ClickOptions {
  /** CSS selector */
  selector: string;
  /** Human-like click (default: false) */
  humanize?: boolean;
  /** Mouse speed (0.0-1.0, default: 0.9) */
  mouseSpeed?: number;
  /** Click button */
  button?: 'left' | 'right' | 'middle';
  /** Click count */
  clickCount?: number;
  /** Delay between mousedown and mouseup (ms) */
  delay?: number;
  /** Force click bypassing actionability checks */
  force?: boolean;
  /** Wait time before click (ms) */
  timeout?: number;
  /** Modifier keys */
  modifiers?: ('Alt' | 'Control' | 'Meta' | 'Shift')[];
}

/** Type options */
export interface TypeOptions {
  /** CSS selector */
  selector: string;
  /** Text to type */
  text: string;
  /** Human-like typing with delays (default: false) */
  humanize?: boolean;
  /** Typing delay between chars (ms, default: 70) */
  typingDelay?: number;
  /** Chance of mistype (0-1, default: 0.02) */
  mistypeChance?: number;
  /** Clear field before typing */
  clearFirst?: boolean;
  /** Delay before typing (ms) */
  delay?: number;
  /** Wait time for selector (ms) */
  timeout?: number;
}

/** Scroll options */
export interface ScrollOptions {
  /** CSS selector to scroll to */
  selector: string;
  /** Human-like scroll (default: false) */
  humanize?: boolean;
  /** Scroll behavior */
  behavior?: 'auto' | 'smooth';
  /** Block alignment */
  block?: 'start' | 'center' | 'end' | 'nearest';
}

/** Screenshot options */
export interface ScreenshotOptions {
  /** Full page screenshot */
  fullPage?: boolean;
  /** Image type */
  type?: 'png' | 'jpeg';
  /** Quality (0-100, jpeg only) */
  quality?: number;
  /** Clip region */
  clip?: { x: number; y: number; width: number; height: number };
  /** Element selector to screenshot */
  selector?: string;
}

/** Evaluate options */
export interface EvaluateOptions {
  /** JavaScript expression or function body */
  expression: string;
  /** Arguments to pass */
  arg?: unknown;
}

/** Wait options */
export interface WaitOptions {
  /** CSS selector to wait for */
  selector?: string;
  /** Wait state */
  state?: 'attached' | 'detached' | 'visible' | 'hidden';
  /** Timeout (ms) */
  timeout?: number;
  /** Wait milliseconds */
  millis?: number;
  /** Wait for navigation */
  waitForNavigation?: boolean;
}

/** Locator query options */
export interface LocatorOptions {
  /** Page ID */
  pageId: string;
  /** CSS selector chain (applied sequentially) */
  selectors: string[];
  /** Text filter */
  hasText?: string;
  /** Element filter */
  has?: string;
}

/** Response wrapper */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  errorCode?: string;
}

/** Status info */
export interface BrowserStatus {
  browserId: string;
  contextCount: number;
  pageCount: number;
  uptime: number;
  headless: boolean;
}

export interface ContextStatus {
  contextId: string;
  browserId: string;
  pageCount: number;
}

export interface PageStatus {
  pageId: string;
  browserId: string;
  contextId: string;
  url: string;
  title: string;
  locked: boolean;
  suspended: boolean;
}