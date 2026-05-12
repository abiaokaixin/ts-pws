/**
 * WebService configuration.
 */

export const config = {
  /** Express server port */
  port: parseInt(process.env.WS_PORT || '3000', 10),

  /** Default timeout for browser operations (ms) */
  defaultTimeout: parseInt(process.env.WS_DEFAULT_TIMEOUT || '30000', 10),

  /** Navigation timeout (ms) */
  navigationTimeout: parseInt(process.env.WS_NAVIGATION_TIMEOUT || '60000', 10),

  /** Max concurrent browser instances */
  maxBrowsers: parseInt(process.env.WS_MAX_BROWSERS || '10', 10),

  /** Browser idle timeout — auto-close after this many ms of inactivity */
  browserIdleTimeout: parseInt(process.env.WS_BROWSER_IDLE_TIMEOUT || '300000', 10),

  /** Log level */
  logLevel: process.env.WS_LOG_LEVEL || 'info',
};