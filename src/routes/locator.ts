import { Router, Request, Response, NextFunction } from 'express';
import * as manager from '../browser/manager.js';
import { AppError } from '../middleware/error-handler.js';
import type { ApiResponse } from '../browser/types.js';

const router = Router();

// ---------------------------------------------------------------------------
// Helper: resolve page from request body
// ---------------------------------------------------------------------------
function resolveIds(req: Request): { browserId: string; pageId: string } {
  const browserId = req.body.browserId || req.params.browserId;
  const pageId = req.body.pageId || req.params.pageId;
  if (!browserId) throw new AppError('browserId is required', 400, 'MISSING_BROWSER_ID');
  if (!pageId) throw new AppError('pageId is required', 400, 'MISSING_PAGE_ID');
  return { browserId, pageId };
}

// ---------------------------------------------------------------------------
// POST /api/locator/exists — Check if element exists
// ---------------------------------------------------------------------------
router.post('/exists', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { browserId, pageId } = resolveIds(req);
    const { selector } = req.body;
    if (!selector) throw new AppError('selector is required', 400, 'MISSING_SELECTOR');

    const exists = await manager.elementExists(browserId, pageId, selector);
    const body: ApiResponse<{ exists: boolean }> = {
      success: true,
      data: { exists },
    };
    res.json(body);
  } catch (err) {
    next(err);
  }
});

// ---------------------------------------------------------------------------
// POST /api/locator/text — Get element inner text
// ---------------------------------------------------------------------------
router.post('/text', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { browserId, pageId } = resolveIds(req);
    const { selector } = req.body;
    if (!selector) throw new AppError('selector is required', 400, 'MISSING_SELECTOR');

    const text = await manager.getElementText(browserId, pageId, selector);
    const body: ApiResponse<{ text: string | null }> = {
      success: true,
      data: { text },
    };
    res.json(body);
  } catch (err) {
    next(err);
  }
});

// ---------------------------------------------------------------------------
// POST /api/locator/all/texts — Get all matching elements inner texts
// ---------------------------------------------------------------------------
router.post('/all/texts', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { browserId, pageId } = resolveIds(req);
    const { selector } = req.body;
    if (!selector) throw new AppError('selector is required', 400, 'MISSING_SELECTOR');

    const texts = await manager.getAllTexts(browserId, pageId, selector);
    const body: ApiResponse<{ texts: string[] }> = {
      success: true,
      data: { texts },
    };
    res.json(body);
  } catch (err) {
    next(err);
  }
});

// ---------------------------------------------------------------------------
// POST /api/locator/attribute — Get element attribute
// ---------------------------------------------------------------------------
router.post('/attribute', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { browserId, pageId } = resolveIds(req);
    const { selector, attribute } = req.body;
    if (!selector) throw new AppError('selector is required', 400, 'MISSING_SELECTOR');
    if (!attribute) throw new AppError('attribute is required', 400, 'MISSING_ATTRIBUTE');

    const value = await manager.getAttribute(browserId, pageId, selector, attribute);
    const body: ApiResponse<{ attribute: string; value: string | null }> = {
      success: true,
      data: { attribute, value },
    };
    res.json(body);
  } catch (err) {
    next(err);
  }
});

// ---------------------------------------------------------------------------
// POST /api/locator/all/attributes — Get all matching elements attribute values
// ---------------------------------------------------------------------------
router.post('/all/attributes', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { browserId, pageId } = resolveIds(req);
    const { selector, attribute } = req.body;
    if (!selector) throw new AppError('selector is required', 400, 'MISSING_SELECTOR');
    if (!attribute) throw new AppError('attribute is required', 400, 'MISSING_ATTRIBUTE');

    const values = await manager.getAllAttributes(browserId, pageId, selector, attribute);
    const body: ApiResponse<{ attribute: string; values: Array<string | null> }> = {
      success: true,
      data: { attribute, values },
    };
    res.json(body);
  } catch (err) {
    next(err);
  }
});

// ---------------------------------------------------------------------------
// POST /api/locator/has-class — Check if element has a CSS class
// ---------------------------------------------------------------------------
router.post('/has-class', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { browserId, pageId } = resolveIds(req);
    const { selector, className } = req.body;
    if (!selector) throw new AppError('selector is required', 400, 'MISSING_SELECTOR');
    if (!className) throw new AppError('className is required', 400, 'MISSING_CLASS_NAME');

    const has = await manager.hasClass(browserId, pageId, selector, className);
    const body: ApiResponse<{ hasClass: boolean }> = {
      success: true,
      data: { hasClass: has },
    };
    res.json(body);
  } catch (err) {
    next(err);
  }
});

export default router;