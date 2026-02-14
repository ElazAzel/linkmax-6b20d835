/**
 * Centralized logging utility
 * - Suppresses logs in production
 * - Provides consistent error tracking
 * - Performance monitoring support
 * - Ready for Sentry/LogRocket integration
 */

const isDev = import.meta.env.DEV;
const isProd = import.meta.env.PROD;

type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'trace';

interface LogOptions {
  context?: string;
  data?: unknown;
  timestamp?: boolean;
}

function formatMessage(level: LogLevel, message: string, options?: LogOptions): string {
  const parts: string[] = [];

  if (options?.timestamp !== false) {
    parts.push(`[${new Date().toISOString().slice(11, 23)}]`);
  }

  parts.push(`[${level.toUpperCase()}]`);

  if (options?.context) {
    parts.push(`[${options.context}]`);
  }

  parts.push(message);

  return parts.join(' ');
}

// Performance timing utilities
const timers = new Map<string, number>();

export const logger = {
  /**
   * Debug logs - only in development
   */
  debug(message: string, options?: LogOptions): void {
    if (isDev) {
      console.log(formatMessage('debug', message, options), options?.data ?? '');
    }
  },

  /**
   * Info logs - only in development
   */
  info(message: string, options?: LogOptions): void {
    if (isDev) {
      console.info(formatMessage('info', message, options), options?.data ?? '');
    }
  },

  /**
   * Warning logs - shown in all environments
   */
  warn(message: string, options?: LogOptions): void {
    console.warn(formatMessage('warn', message, options), options?.data ?? '');

    // In production, consider sending to monitoring service
    if (isProd) {
      // TODO: Send to Sentry/LogRocket
      // Sentry.captureMessage(message, 'warning');
    }
  },

  /**
   * Error logs - shown in all environments
   */
  error(message: string, error?: unknown, options?: LogOptions): void {
    console.error(formatMessage('error', message, options), error ?? '');

    // In production, send to error tracking service
    if (isProd) {
      // TODO: Integrate Sentry
      // Sentry.captureException(error, {
      //   tags: { context: options?.context },
      //   extra: { data: options?.data }
      // });
    }
  },

  /**
   * Trace logs - detailed debugging
   */
  trace(message: string, options?: LogOptions): void {
    if (isDev) {
      console.trace(formatMessage('trace', message, options), options?.data ?? '');
    }
  },

  /**
   * Start performance timer
   */
  time(label: string): void {
    if (isDev) {
      timers.set(label, performance.now());
    }
  },

  /**
   * End performance timer and log duration
   */
  timeEnd(label: string): void {
    if (isDev) {
      const start = timers.get(label);
      if (start) {
        const duration = performance.now() - start;
        console.log(formatMessage('debug', `${label}: ${duration.toFixed(2)}ms`));
        timers.delete(label);
      } else {
        console.warn(`Timer '${label}' does not exist`);
      }
    }
  },

  /**
   * Group related logs
   */
  group(label: string): void {
    if (isDev) {
      console.group(label);
    }
  },

  /**
   * End log group
   */
  groupEnd(): void {
    if (isDev) {
      console.groupEnd();
    }
  },
};

export default logger;
