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
  private shouldLog(level: 'error' | 'warn' | 'info' | 'debug'): boolean {
    // In production, only log errors (and only if error tracking is configured)
    if (isProduction) {
      return level === 'error';
    }
    // In development, log everything
    return true;
  }

  error(message: string, error?: Error | unknown, context?: LogContext): void {
    if (this.shouldLog('error')) {
      const errorInfo = error instanceof Error ? error : new Error(String(error));

      // In production, this would send to error tracking service
      // For now, we'll use console.error only in development
      if (isDevelopment) {
        console.error('[ERROR]', message, {
          error: errorInfo,
          context,
          stack: errorInfo.stack,
          timestamp: new Date().toISOString(),
        });
      } else {
        // In production: send to error tracking service
        // Example: Sentry.captureException(errorInfo, { extra: { message, context } });

        // For now, silently fail in production or you can implement
        // a lightweight error reporting mechanism
        console.error('[ERROR]', message);
      }
    }
  }

  warn(message: string, context?: LogContext): void {
    if (this.shouldLog('warn')) {
      if (isDevelopment) {
        console.warn('[WARN]', message, context);
      }
      // In production, warnings are typically not logged
    }
  }

  info(message: string, context?: LogContext): void {
    if (this.shouldLog('info')) {
      if (isDevelopment) {
        console.info('[INFO]', message, context);
      }
      // In production, info logs are typically not needed
    }
  }

  debug(message: string, context?: LogContext): void {
    if (this.shouldLog('debug')) {
      if (isDevelopment) {
        console.debug('[DEBUG]', message, context);
      }
      // Debug logs only in development
    }
  }
}

// Export a singleton instance
export const logger = new Logger();

// Convenience exports
export const logError = (message: string, error?: Error | unknown, context?: LogContext) => {
  logger.error(message, error, context);
};

export const logWarn = (message: string, context?: LogContext) => {
  logger.warn(message, context);
};

export const logInfo = (message: string, context?: LogContext) => {
  logger.info(message, context);
};

export const logDebug = (message: string, context?: LogContext) => {
  logger.debug(message, context);
};
