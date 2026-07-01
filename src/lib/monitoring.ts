/**
 * Monitoring Library
 * Initializer for Sentry with safe failure modes
 * @version 1.1 - Fixed Sentry v8+ API, removed LogRocket
 */

import { logger } from './utils/logger';

interface MonitoringConfig {
  sentryDsn?: string;
  environment: string;
  release?: string;
}

/**
 * Initialize all monitoring services
 */
export async function initMonitoring(config: MonitoringConfig) {
  const { environment, release, sentryDsn } = config;

  if (sentryDsn) {
    try {
      const Sentry = await import('@sentry/react');
      
      Sentry.init({
        dsn: sentryDsn,
        environment,
        release,
        integrations: [
          Sentry.browserTracingIntegration(),
          Sentry.replayIntegration(),
        ],
        tracesSampleRate: 0.1,
        replaysSessionSampleRate: 0.1,
        replaysOnErrorSampleRate: 1.0,
      });
      
      logger.info('Monitoring: Sentry initialized');
    } catch (error) {
      logger.error('Monitoring: Failed to initialize Sentry', error);
    }
  }
}

/**
 * Identify user in monitoring services after successful login
 */
export async function identifyUser(userId: string, traits?: Record<string, any>) {
  try {
    const Sentry = await import('@sentry/react');
    Sentry.setUser({ id: userId, ...traits });
  } catch (_err) {
    // Silent fail
  }
}
