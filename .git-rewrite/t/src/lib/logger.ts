/**
 * Centralized logging utility
 * - Suppresses logs in production
 * - Provides consistent error tracking
 */

const isDev = import.meta.env.DEV;

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogOptions {
  context?: string;
  data?: unknown;
}

function formatMessage(level: LogLevel, message: string, options?: LogOptions): string {
  const timestamp = new Date().toISOString().slice(11, 23);
  const prefix = options?.context ? `[${options.context}]` : '';
  return `${timestamp} ${level.toUpperCase()} ${prefix} ${message}`;
}

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
  },

  error(message: string, error?: unknown, options?: LogOptions): void {
    console.error(formatMessage('error', message, options), error ?? '');
    
    // In production, you could send to error tracking service here
    // e.g., Sentry.captureException(error);
  },
};

export default logger;
