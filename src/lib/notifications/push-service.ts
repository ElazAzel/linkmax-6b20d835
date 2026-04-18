import { PushNotifications } from '@capacitor/push-notifications';
import { Capacitor } from '@capacitor/core';
import { supabase } from '@/platform/supabase/client';
import { logger } from '@/lib/utils/logger';

export class PushService {
  private static isInitialized = false;

  static async init() {
    if (!Capacitor.isNativePlatform()) {
      logger.debug('Non-native platform, skipping initialization', { context: 'push-service' });
      return;
    }

    if (this.isInitialized) return;

    try {
      await this.addListeners();
      await this.registerNotifications();
      this.isInitialized = true;
      logger.info('Push service initialized', { context: 'push-service' });
    } catch (error) {
      logger.error('Push service initialization failed', error, { context: 'push-service' });
    }
  }

  private static async addListeners() {
    await PushNotifications.addListener('registration', async ({ value: token }) => {
      logger.info('Push registration success', { context: 'push-service', data: { token } });
      await this.saveToken(token);
    });

    await PushNotifications.addListener('registrationError', (err: any) => {
      logger.error('Push registration error', err.error, { context: 'push-service' });
    });

    await PushNotifications.addListener('pushNotificationReceived', (notification) => {
      logger.debug('Push notification received', { context: 'push-service', data: notification });
      // You can show a custom UI toast here if the app is in foreground
    });

    await PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
      logger.debug('Push notification action performed', { context: 'push-service', data: notification });
      const data = notification.notification.data;
      if (data?.url) {
        window.location.href = data.url;
      }
    });
  }

  private static async registerNotifications() {
    let permStatus = await PushNotifications.checkPermissions();

    if (permStatus.receive === 'prompt') {
      permStatus = await PushNotifications.requestPermissions();
    }

    if (permStatus.receive !== 'granted') {
      console.warn('[PushService] User denied permissions');
      return;
    }

    await PushNotifications.register();
  }

  private static async saveToken(token: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from('user_profiles' as any)
      .update({ fcm_token: token } as any)
      .eq('id', user.id);

    if (error) {
      logger.error('Failed to save token to Supabase', error, { context: 'push-service' });
    } else {
      logger.info('Token saved to profile', { context: 'push-service' });
    }
  }

  static async clearToken() {
    if (!Capacitor.isNativePlatform()) return;
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
      .from('user_profiles' as any)
      .update({ fcm_token: null } as any)
      .eq('id', user.id);
  }
}
