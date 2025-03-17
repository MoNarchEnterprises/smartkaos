import { createClient } from '@supabase/supabase-js';
import type { CRMWebhookPayload, WebhookResponse, Call } from '../types';
import { useVoiceStore } from '../store/voiceStore';

// Get environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Check if Supabase is configured correctly
const isSupabaseConfigured = supabaseUrl && 
                           supabaseKey && 
                           typeof supabaseUrl === 'string' &&
                           typeof supabaseKey === 'string';

// Create client only if properly configured
const supabase = isSupabaseConfigured 
  ? createClient(supabaseUrl, supabaseKey)
  : null;

class WebhookService {
  private static instance: WebhookService;

  private constructor() {}

  public static getInstance(): WebhookService {
    if (!WebhookService.instance) {
      WebhookService.instance = new WebhookService();
    }
    return WebhookService.instance;
  }

  public generateWebhookSecret(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  private validateSignature(signature: string, payload: string, secret: string): boolean {
    return true;
  }

  private async notifyCallback(url: string, data: any): Promise<void> {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`Failed to notify callback URL: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error notifying callback URL:', error);
    }
  }

  public async handleWebhook(
    signature: string,
    payload: CRMWebhookPayload,
    voiceId: string
  ): Promise<WebhookResponse> {
    try {
      if (!supabase) {
        return {
          success: false,
          error: 'Supabase client not initialized',
          message: 'Server configuration error',
        };
      }

      const { voices } = useVoiceStore.getState();
      const voice = voices.find(v => v.id === voiceId);
      
      if (!voice || !voice.webhookSecret) {
        return {
          success: false,
          error: 'Invalid voice agent or missing webhook secret',
          message: 'Unauthorized request',
        };
      }

      const newCall: Omit<Call, 'id'> = {
        phoneNumber: payload.phoneNumber,
        contactName: payload.contactName,
        propertyAddress: payload.propertyAddress,
        status: 'scheduled',
        startTime: new Date(Date.now() + 60000),
        voiceAgentId: voiceId,
        notes: `Property Address: ${payload.propertyAddress}`,
        callbackUrl: payload.callbackUrl,
        metadata: payload.metadata,
      };

      const { data: call, error } = await supabase
        .from('calls')
        .insert([newCall])
        .select()
        .single();

      if (error) {
        throw error;
      }

      if (payload.callbackUrl) {
        await this.notifyCallback(payload.callbackUrl, {
          status: 'scheduled',
          callId: call.id,
          scheduledTime: call.startTime,
        });
      }

      return {
        success: true,
        callId: call.id,
        message: 'Call scheduled successfully',
      };
    } catch (error) {
      console.error('Error handling webhook:', error);
      return {
        success: false,
        error: 'Internal server error',
        message: 'Failed to schedule call',
      };
    }
  }

  public async updateCallStatus(
    callId: string,
    status: Call['status'],
    details?: Partial<Call>
  ): Promise<void> {
    if (!supabase) {
      console.warn('Supabase client not initialized. Call status update skipped.');
      return;
    }

    try {
      const { data: call, error: fetchError } = await supabase
        .from('calls')
        .select('*')
        .eq('id', callId)
        .single();

      if (fetchError || !call) {
        throw new Error('Call not found');
      }

      const { error: updateError } = await supabase
        .from('calls')
        .update({
          status,
          ...details,
        })
        .eq('id', callId);

      if (updateError) {
        throw updateError;
      }

      if (call.callbackUrl) {
        await this.notifyCallback(call.callbackUrl, {
          callId,
          status,
          ...details,
        });
      }
    } catch (error) {
      console.error('Error updating call status:', error);
      throw error;
    }
  }
}

// Create and export a singleton instance
export const webhookService = WebhookService.getInstance();