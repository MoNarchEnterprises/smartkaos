import { supabase } from './supabase';

export class NotificationService {
  private static instance: NotificationService;

  private constructor() {}

  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  async sendRenewalReminder(userId: string, type: 'email' | 'sms') {
    if (!supabase) return;

    try {
      const { error } = await supabase
        .functions.invoke('send-renewal-reminder', {
          body: { userId, type }
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error sending renewal reminder:', error);
      throw error;
    }
  }

  async updateNotificationPreferences(userId: string, preferences: {
    email_reminders: boolean;
    sms_reminders: boolean;
    reminder_days_before: number;
  }) {
    if (!supabase) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          notification_preferences: preferences
        })
        .eq('id', userId);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating notification preferences:', error);
      throw error;
    }
  }
}

export const notificationService = NotificationService.getInstance();