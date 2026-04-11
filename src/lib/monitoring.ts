/**
 * Monitoring Library
 * Initializer for Sentry and LogRocket with safe failure modes
 * @version 1.0 - Initial hardening implementation
 */

import { logger } from './utils/logger';

interface MonitoringConfig {
  sentryDsn?: string;
  logrocketId?: string;
  environment: string;
  release?: string;
}

/**
 * Initialize all monitoring services
 */
export async function initMonitoring(config: MonitoringConfig) {
  const { environment, release, sentryDsn, logrocketId } = config;

  // 1. Initialize Sentry if DSN is provided
  if (sentryDsn) {
    try {
      // Dynamic import to keep bundle size small for those not using it
      const Sentry = await import('@sentry/react');
      
      Sentry.init({
        dsn: sentryDsn,
        environment,
        release,
        integrations: [
          new Sentry.BrowserTracing(),
          new Sentry.Replay(),
        ],
        // Performance Monitoring
        tracesSampleRate: 0.1,
        // Session Replay
        replaysSessionSampleRate: 0.1,
        replaysOnErrorSampleRate: 1.0,
      });
      
      logger.info('Monitoring: Sentry initialized');
    } catch (error) {
      logger.error('Monitoring: Failed to initialize Sentry', error);
    }
  }

  // 2. Initialize LogRocket if ID is provided
  if (logrocketId) {
    try {
      const LogRocket = (await import('logrocket')).default;
      LogRocket.init(logrocketId, {
        release,
        shouldCaptureIP: false, // GDPR compliance
      });
      logger.info('Monitoring: LogRocket initialized');
    } catch (error) {
      logger.error('Monitoring: Failed to initialize LogRocket', error);
    }
  }
}

/**
 * Identify user in monitoring services after successful login
 */
export async function identifyUser(userId: string, traits?: Record<string, any>) {
  try {
    // Identify in Sentry
    const Sentry = await import('@sentry/react');
    Sentry.setUser({ id: userId, ...traits });

    // Identify in LogRocket
    const LogRocket = (await import('logrocket')).default;
    LogRocket.identify(userId, traits);
  } catch (err) {
    // Silent fail
  }
}
