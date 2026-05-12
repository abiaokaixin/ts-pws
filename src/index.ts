import express from 'express';
import { config } from './config.js';
import { errorHandler } from './middleware/error-handler.js';
import routes from './routes/index.js';

const app = express();

// ---------------------------------------------------------------------------
// Middleware
// ---------------------------------------------------------------------------
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
  const start = Date.now();
  const originalEnd = res.end.bind(res);
  res.end = function (...args: any[]) {
    const duration = Date.now() - start;
    console.log(`[${req.method}] ${req.originalUrl} ${res.statusCode} ${duration}ms`);
    return originalEnd(...args);
  } as typeof originalEnd;
  next();
});

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------
app.use(routes);

// ---------------------------------------------------------------------------
// Error handling
// ---------------------------------------------------------------------------
app.use(errorHandler);

// ---------------------------------------------------------------------------
// Start server
// ---------------------------------------------------------------------------
app.listen(config.port, () => {
  console.log(`\n  🛡️  WebService — Stealth Browser REST API`);
  console.log(`  ────────────────────────────────────────`);
  console.log(`  Server    : http://localhost:${config.port}`);
  console.log(`  Health    : http://localhost:${config.port}/api/health`);
  console.log(`  Binary    : http://localhost:${config.port}/api/binary/status`);
  console.log(`  Max browsers: ${config.maxBrowsers}`);
  console.log(`  Timeout   : ${config.defaultTimeout}ms\n`);
});

export default app;