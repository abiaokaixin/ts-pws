import { Router, Request, Response, NextFunction } from 'express';
import * as manager from '../browser/manager.js';
import { AppError } from '../middleware/error-handler.js';
import { requireBody, validUrl } from '../middleware/validation.js';
import type { ApiResponse } from '../browser/types.js';

const router = Router();

// Helper: extract browserId and pageId from route params body or query
function getIds(req: Request): { browserId: string; pageId: string } {
  const rawBrowserId = req.params.browserId || req.body.browserId || req.query.browserId;
  const rawPageId = req.params.pageId || req.body.pageId || req.query.pageId;
  const browserId = Array.isArray(rawBrowserId) ? rawBrowserId[0] : rawBrowserId as string;
  const pageId = Array.isArray(rawPageId) ? rawPageId[0] : rawPageId as string;
  if (!browserId) throw new AppError('browserId is required', 400, 'MISSING_BROWSER_ID');
  if (!pageId) throw new AppError('pageId is required', 400, 'MISSING_PAGE_ID');
  return { browserId, pageId };
}

// ---------------------------------------------------------------------------
// POST /api/page/:browserId/:pageId/navigate — Navigate to URL
// ---------------------------------------------------------------------------
router.post('/:browserId/:pageId/navigate', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { browserId, pageId } = getIds(req);
    const { url, waitUntil, timeout } = req.body;
    if (!url) throw new AppError('url is required', 400, 'MISSING_URL');

    await manager.navigate(browserId, pageId, { url, waitUntil, timeout });
    const title = await manager.getPageTitle(browserId, pageId);
    const currentUrl = await manager.getPageUrl(browserId, pageId);

    const body: ApiResponse<{ title: string; url: string }> = {
      success: true,
      data: { title, url: currentUrl },
    };
    res.json(body);
  } catch (err) {
    next(err);
  }
});

// ---------------------------------------------------------------------------
// GET /api/page/:browserId/:pageId/content — Get page HTML content
// ---------------------------------------------------------------------------
router.get('/:browserId/:pageId/content', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { browserId, pageId } = getIds(req);
    const content = await manager.getPageContent(browserId, pageId);
    const body: ApiResponse<{ html: string }> = {
      success: true,
      data: { html: content },
    };
    res.json(body);
  } catch (err) {
    next(err);
  }
});

// ---------------------------------------------------------------------------
// GET /api/page/:browserId/:pageId/title — Get page title
// ---------------------------------------------------------------------------
router.get('/:browserId/:pageId/title', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { browserId, pageId } = getIds(req);
    const title = await manager.getPageTitle(browserId, pageId);
    const url = await manager.getPageUrl(browserId, pageId);
    const body: ApiResponse<{ title: string; url: string }> = {
      success: true,
      data: { title, url },
    };
    res.json(body);
  } catch (err) {
    next(err);
  }
});

// ---------------------------------------------------------------------------
// POST /api/page/:browserId/:pageId/screenshot — Take screenshot
// ---------------------------------------------------------------------------
router.post('/:browserId/:pageId/screenshot', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { browserId, pageId } = getIds(req);
    const { fullPage, type, quality, selector } = req.body || {};
    const buffer = await manager.takeScreenshot(browserId, pageId, {
      fullPage,
      type: type || 'png',
      quality,
      selector,
    });

    res.setHeader('Content-Type', type === 'jpeg' ? 'image/jpeg' : 'image/png');
    res.setHeader('Content-Length', buffer.length);
    res.send(buffer);
  } catch (err) {
    next(err);
  }
});

// ---------------------------------------------------------------------------
// POST /api/page/:browserId/:pageId/evaluate — Execute JavaScript
// ---------------------------------------------------------------------------
router.post('/:browserId/:pageId/evaluate', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { browserId, pageId } = getIds(req);
    const { expression, arg } = req.body;
    if (!expression) throw new AppError('expression is required', 400, 'MISSING_EXPRESSION');

    const result = await manager.evaluate(browserId, pageId, { expression, arg });
    const body: ApiResponse<{ result: unknown }> = {
      success: true,
      data: { result },
    };
    res.json(body);
  } catch (err) {
    next(err);
  }
});

// ---------------------------------------------------------------------------
// POST /api/page/:browserId/:pageId/click — Click element
// ---------------------------------------------------------------------------
router.post('/:browserId/:pageId/click', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { browserId, pageId } = getIds(req);
    const { selector, humanize, mouseSpeed, button, clickCount, delay, force, timeout, modifiers } = req.body;
    if (!selector) throw new AppError('selector is required', 400, 'MISSING_SELECTOR');

    await manager.click(browserId, pageId, {
      selector,
      humanize,
      mouseSpeed,
      button,
      clickCount,
      delay,
      force,
      timeout,
      modifiers,
    });

    const body: ApiResponse = { success: true };
    res.json(body);
  } catch (err) {
    next(err);
  }
});

// ---------------------------------------------------------------------------
// POST /api/page/:browserId/:pageId/type — Type text
// ---------------------------------------------------------------------------
router.post('/:browserId/:pageId/type', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { browserId, pageId } = getIds(req);
    const { selector, text, humanize, typingDelay, mistypeChance, clearFirst, delay, timeout } = req.body;
    if (!selector) throw new AppError('selector is required', 400, 'MISSING_SELECTOR');
    if (text === undefined || text === null) throw new AppError('text is required', 400, 'MISSING_TEXT');

    await manager.type(browserId, pageId, {
      selector,
      text: String(text),
      humanize,
      typingDelay,
      mistypeChance,
      clearFirst,
      delay,
      timeout,
    });

    const body: ApiResponse = { success: true };
    res.json(body);
  } catch (err) {
    next(err);
  }
});

// ---------------------------------------------------------------------------
// POST /api/page/:browserId/:pageId/scroll — Scroll to element
// ---------------------------------------------------------------------------
router.post('/:browserId/:pageId/scroll', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { browserId, pageId } = getIds(req);
    const { selector, humanize, behavior, block } = req.body;
    if (!selector) throw new AppError('selector is required', 400, 'MISSING_SELECTOR');

    await manager.scrollTo(browserId, pageId, { selector, humanize, behavior, block });
    const body: ApiResponse = { success: true };
    res.json(body);
  } catch (err) {
    next(err);
  }
});

// ---------------------------------------------------------------------------
// POST /api/page/:browserId/:pageId/hover — Hover over element
// ---------------------------------------------------------------------------
router.post('/:browserId/:pageId/hover', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { browserId, pageId } = getIds(req);
    const { selector } = req.body;
    if (!selector) throw new AppError('selector is required', 400, 'MISSING_SELECTOR');

    await manager.hover(browserId, pageId, selector);
    const body: ApiResponse = { success: true };
    res.json(body);
  } catch (err) {
    next(err);
  }
});

// ---------------------------------------------------------------------------
// POST /api/page/:browserId/:pageId/wait — Wait for selector/condition
// ---------------------------------------------------------------------------
router.post('/:browserId/:pageId/wait', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { browserId, pageId } = getIds(req);
    const { selector, state, timeout, millis, waitForNavigation } = req.body;

    await manager.waitFor(browserId, pageId, {
      selector,
      state,
      timeout,
      millis,
      waitForNavigation,
    });

    const body: ApiResponse = { success: true };
    res.json(body);
  } catch (err) {
    next(err);
  }
});

// ---------------------------------------------------------------------------
// GET /api/page/:browserId/:pageId/cookies — Get cookies
// ---------------------------------------------------------------------------
router.get('/:browserId/:pageId/cookies', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { browserId, pageId } = getIds(req);
    const cookies = await manager.getCookies(browserId, pageId);
    const body: ApiResponse<{ cookies: typeof cookies }> = {
      success: true,
      data: { cookies },
    };
    res.json(body);
  } catch (err) {
    next(err);
  }
});

// ---------------------------------------------------------------------------
// POST /api/page/:browserId/:pageId/close — Close page
// ---------------------------------------------------------------------------
router.post('/:browserId/:pageId/close', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { browserId, pageId } = getIds(req);
    await manager.closePage(browserId, pageId);
    const body: ApiResponse = { success: true };
    res.json(body);
  } catch (err) {
    next(err);
  }
});

// ---------------------------------------------------------------------------
// GET /api/page/:browserId/:pageId/status — Page status
// ---------------------------------------------------------------------------
router.get('/:browserId/:pageId/status', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { browserId, pageId } = getIds(req);
    const status = manager.getPageStatus(browserId, pageId);
    const body: ApiResponse = { success: true, data: status };
    res.json(body);
  } catch (err) {
    next(err);
  }
});

export default router;