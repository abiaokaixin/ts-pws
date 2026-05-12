import { Router, Request, Response, NextFunction } from 'express';
import { binaryInfo } from '../cloakbrowser/index.js';
import type { ApiResponse } from '../browser/types.js';
import browserRoutes from './browser.js';
import pageRoutes from './page.js';
import locatorRoutes from './locator.js';

const router = Router();

// ---------------------------------------------------------------------------
// GET /api/binary/status — Browser binary status
// ---------------------------------------------------------------------------
router.get('/api/binary/status', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const info = await binaryInfo();
    const body: ApiResponse = { success: true, data: info };
    res.json(body);
  } catch (err) {
    next(err);
  }
});

// ---------------------------------------------------------------------------
// Sub-routers
// ---------------------------------------------------------------------------
router.use('/api/browser', browserRoutes);
router.use('/api/page', pageRoutes);
router.use('/api/locator', locatorRoutes);

// Health check
router.get('/api/health', (_req, res) => {
  res.json({
    success: true,
    data: {
      status: 'ok',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    },
  });
});

export default router;