/**
 * Centralized logging utility
 * - Suppresses debug/info logs in production
 * - Provides consistent error tracking
 * - Performance monitoring support
 * - Sentry integration for production error tracking via @sentry/react (lazy-loaded)
 */

const isDev = import.meta.env?.DEV ?? (typeof process !== 'undefined' && process.env?.NODE_ENV === 'development');
const isProd = !isDev;

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

/**
 * Lazily load Sentry and report. Only called in production for warn/error.
 */
function reportToSentry(message: string, level: 'warning' | 'error', error?: unknown, options?: LogOptions): void {
  import('@/lib/utils/sentry').then(({ Sentry, isSentryEnabled }) => {
    if (!isSentryEnabled) return;
    Sentry.withScope((scope) => {
      if (options?.context) scope.setTag('context', options.context);
      if (options?.data) scope.setExtra('data', options.data);
      if (level === 'error') {
        scope.setExtra('message', message);
        if (error instanceof Error) {
          Sentry.captureException(error);
        } else {
          Sentry.captureMessage(message, 'error');
        }
      } else {
        Sentry.captureMessage(message, 'warning');
      }
    });
  });
}

// Performance timing utilities
const timers = new Map<string, number>();

export const logger = {
  debug(message: string, options?: LogOptions): void {
    if (isDev) {
      console.log(formatMessage('debug', message, options), options?.data ?? '');
    }
  },

  info(message: string, options?: LogOptions): void {
    if (isDev) {
      console.info(formatMessage('info', message, options), options?.data ?? '');
    }
  },

  warn(message: string, options?: LogOptions): void {
    console.warn(formatMessage('warn', message, options), options?.data ?? '');
    if (isProd) reportToSentry(message, 'warning', undefined, options);
  },

  error(message: string, error?: unknown, options?: LogOptions): void {
    console.error(formatMessage('error', message, options), error ?? '');
    if (isProd) reportToSentry(message, 'error', error, options);
  },

  trace(message: string, options?: LogOptions): void {
    if (isDev) {
      console.trace(formatMessage('trace', message, options), options?.data ?? '');
    }
  },

  time(label: string): void {
    if (isDev) {
      timers.set(label, performance.now());
    }
  },

  timeEnd(label: string): void {
    if (isDev) {
      const start = timers.get(label);
      if (start !== undefined) {
        const duration = performance.now() - start;
        console.log(formatMessage('debug', `${label}: ${duration.toFixed(2)}ms`));
        timers.delete(label);
      } else {
        console.warn(`Timer '${label}' does not exist`);
      }
    }
  },

  group(label: string): void {
    if (isDev) {
      console.group(label);
    }
  },

  groupEnd(): void {
    if (isDev) {
      console.groupEnd();
    }
  },
};

export default logger;
