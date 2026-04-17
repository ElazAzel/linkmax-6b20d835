import { PushNotifications } from '@capacitor/push-notifications';
import { Capacitor } from '@capacitor/core';
import { supabase } from '@/platform/supabase/client';

export class PushService {
  private static isInitialized = false;

  static async init() {
    if (!Capacitor.isNativePlatform()) {
      console.log('[PushService] Non-native platform, skipping initialization');
      return;
    }

    if (this.isInitialized) return;

    try {
      await this.addListeners();
      await this.registerNotifications();
      this.isInitialized = true;
      console.log('[PushService] Initialized');
    } catch (error) {
      console.error('[PushService] Initialization failed', error);
    }
  }

  private static async addListeners() {
    await PushNotifications.addListener('registration', async ({ value: token }) => {
      console.log('[PushService] Registration success, token:', token);
      await this.saveToken(token);
    });

    await PushNotifications.addListener('registrationError', (err: any) => {
      console.error('[PushService] Registration error:', err.error);
    });

    await PushNotifications.addListener('pushNotificationReceived', (notification) => {
      console.log('[PushService] Notification received:', notification);
      // You can show a custom UI toast here if the app is in foreground
    });

    await PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
      console.log('[PushService] Notification action performed:', notification);
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
      console.error('[PushService] Failed to save token to Supabase', error);
    } else {
      console.log('[PushService] Token saved to profile');
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
