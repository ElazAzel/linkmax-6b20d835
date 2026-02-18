/**
 * Centralized logging utility
 * - Suppresses debug/info logs in production
 * - Provides consistent error tracking
 * - Performance monitoring support
 * - Sentry integration for production error tracking
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

// ====== Sentry-like lightweight error reporter ======
// Sends errors to a configurable endpoint (Sentry DSN or custom collector)
// Set VITE_SENTRY_DSN in .env to enable

const SENTRY_DSN = import.meta.env?.VITE_SENTRY_DSN as string | undefined;

interface ErrorReport {
  message: string;
  level: 'warning' | 'error' | 'fatal';
  timestamp: string;
  context?: string;
  data?: unknown;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
  environment: string;
  url: string;
  userAgent: string;
}

/**
 * Send error report to Sentry-compatible endpoint.
 * Uses sendBeacon for reliability (fires even during page unload).
 * Falls back to fetch if sendBeacon unavailable.
 */
function reportToSentry(report: ErrorReport): void {
  if (!SENTRY_DSN) return;

  const payload = JSON.stringify({
    exception: report.error ? {
      values: [{
        type: report.error.name,
        value: report.error.message,
        stacktrace: report.error.stack ? {
          frames: report.error.stack.split('\n').slice(1, 10).map(line => ({
            filename: line.trim(),
          })),
        } : undefined,
      }],
    } : undefined,
    message: report.message,
    level: report.level,
    timestamp: report.timestamp,
    tags: { context: report.context },
    extra: report.data ? { data: report.data } : undefined,
    environment: report.environment,
    request: {
      url: report.url,
      headers: { 'User-Agent': report.userAgent },
    },
  });

  // Prefer sendBeacon for reliability
  if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
    const blob = new Blob([payload], { type: 'application/json' });
    navigator.sendBeacon(SENTRY_DSN, blob);
  } else if (typeof fetch !== 'undefined') {
    fetch(SENTRY_DSN, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: payload,
      keepalive: true,
    }).catch(() => { /* silent fail — don't recurse into logger */ });
  }
}

function buildErrorInfo(error: unknown): ErrorReport['error'] | undefined {
  if (!error) return undefined;
  if (error instanceof Error) {
    return { name: error.name, message: error.message, stack: error.stack };
  }
  return { name: 'Unknown', message: String(error) };
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
   * Warning logs - shown in all environments, reported to Sentry in prod
   */
  warn(message: string, options?: LogOptions): void {
    console.warn(formatMessage('warn', message, options), options?.data ?? '');

    if (isProd) {
      reportToSentry({
        message,
        level: 'warning',
        timestamp: new Date().toISOString(),
        context: options?.context,
        data: options?.data,
        environment: 'production',
        url: typeof window !== 'undefined' ? window.location.href : '',
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
      });
    }
  },

  /**
   * Error logs - shown in all environments, reported to Sentry in prod
   */
  error(message: string, error?: unknown, options?: LogOptions): void {
    console.error(formatMessage('error', message, options), error ?? '');

    if (isProd) {
      reportToSentry({
        message,
        level: 'error',
        timestamp: new Date().toISOString(),
        context: options?.context,
        data: options?.data,
        error: buildErrorInfo(error),
        environment: 'production',
        url: typeof window !== 'undefined' ? window.location.href : '',
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
      });
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
      if (start !== undefined) {
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
