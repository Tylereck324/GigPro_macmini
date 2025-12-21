/**
 * Environment-aware logging utility
 *
 * In production, console.error statements should be replaced with proper
 * error tracking services (e.g., Sentry, LogRocket) or suppressed.
 *
 * This utility provides a consistent interface for logging throughout the app
 * and can be easily extended to integrate with error tracking services.
 */

const isDevelopment = process.env.NODE_ENV === 'development';
const isProduction = process.env.NODE_ENV === 'production';

interface LogContext {
  component?: string;
  action?: string;
  [key: string]: unknown;
}

class Logger {
  error(message: string, error?: Error | unknown, context?: LogContext): void {
    const errorInfo = error instanceof Error ? error : new Error(String(error));

    // In production, this would send to error tracking service.
    // For now, we only include structured context in development.
    if (isDevelopment) {
      console.error('[ERROR]', message, {
        error: errorInfo,
        context,
        stack: errorInfo.stack,
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // In production: keep minimal logging unless/until error tracking is wired up.
    if (isProduction) {
      console.error('[ERROR]', message);
      return;
    }

    console.error('[ERROR]', message);
  }
}

// Export a singleton instance
export const logger = new Logger();

// Convenience exports
export const logError = (message: string, error?: Error | unknown, context?: LogContext) => {
  logger.error(message, error, context);
};
