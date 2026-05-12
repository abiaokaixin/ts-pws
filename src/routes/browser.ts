import { Router, Request, Response, NextFunction } from 'express';
import * as manager from '../browser/manager.js';
import { AppError } from '../middleware/error-handler.js';
import type { ApiResponse, LaunchOptions, ContextOptions } from '../browser/types.js';

const router = Router();

/** Extract a single string param from Express v5 route params (string | string[]) */
function param(req: Request, name: string): string {
  const p = req.params[name];
  return Array.isArray(p) ? p[0] : p;
}

// ---------------------------------------------------------------------------
// POST /api/browser/launch — Launch a new browser instance
// ---------------------------------------------------------------------------
router.post('/launch', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const options: LaunchOptions = req.body || {};
    const browserId = await manager.launchBrowser(options);
    const status = manager.getBrowserStatus(browserId);

    const body: ApiResponse<{ browserId: string; status: typeof status }> = {
      success: true,
      data: { browserId, status },
    };
    res.status(201).json(body);
  } catch (err) {
    next(err);
  }
});

// ---------------------------------------------------------------------------
// POST /api/browser/:browserId/close — Close a browser
// ---------------------------------------------------------------------------
router.post('/:browserId/close', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await manager.closeBrowser(param(req, 'browserId'));
    const body: ApiResponse = { success: true };
    res.json(body);
  } catch (err) {
    next(err);
  }
});

// ---------------------------------------------------------------------------
// GET /api/browser/:browserId/status — Get browser status
// ---------------------------------------------------------------------------
router.get('/:browserId/status', (req: Request, res: Response, next: NextFunction) => {
  try {
    const status = manager.getBrowserStatus(param(req, 'browserId'));
    const body: ApiResponse = { success: true, data: status };
    res.json(body);
  } catch (err) {
    next(err);
  }
});

// ---------------------------------------------------------------------------
// GET /api/browser — List all browsers
// ---------------------------------------------------------------------------
router.get('/', (_req: Request, res: Response) => {
  const ids = manager.listBrowsers();
  const statuses = ids.map(id => {
    try {
      return manager.getBrowserStatus(id);
    } catch {
      return null;
    }
  }).filter(Boolean);

  const body: ApiResponse = { success: true, data: statuses };
  res.json(body);
});

// ---------------------------------------------------------------------------
// GET /api/browser/:browserId/pages — List all pages in a browser
// ---------------------------------------------------------------------------
router.get('/:browserId/pages', (req: Request, res: Response, next: NextFunction) => {
  try {
    const pages = manager.listPages(param(req, 'browserId'));
    const body: ApiResponse = { success: true, data: pages };
    res.json(body);
  } catch (err) {
    next(err);
  }
});

// ---------------------------------------------------------------------------
// POST /api/browser/:browserId/context — Create a new context
// ---------------------------------------------------------------------------
router.post('/:browserId/context', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const options: ContextOptions = req.body || {};
    const contextId = await manager.createContext(param(req, 'browserId'), options);
    const body: ApiResponse<{ contextId: string }> = {
      success: true,
      data: { contextId },
    };
    res.status(201).json(body);
  } catch (err) {
    next(err);
  }
});

// ---------------------------------------------------------------------------
// POST /api/browser/:browserId/context/:contextId/close — Close context
// ---------------------------------------------------------------------------
router.post('/:browserId/context/:contextId/close', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await manager.closeContext(param(req, 'browserId'), param(req, 'contextId'));
    const body: ApiResponse = { success: true };
    res.json(body);
  } catch (err) {
    next(err);
  }
});

// ---------------------------------------------------------------------------
// POST /api/browser/:browserId/page — Create a new page
// ---------------------------------------------------------------------------
router.post('/:browserId/page', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { contextId } = req.body || {};
    const result = await manager.createPage(param(req, 'browserId'), contextId);
    const body: ApiResponse<typeof result> = {
      success: true,
      data: result,
    };
    res.status(201).json(body);
  } catch (err) {
    next(err);
  }
});

export default router;