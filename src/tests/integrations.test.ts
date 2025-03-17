import { describe, test, expect, beforeEach } from 'vitest';
import { IntegrationsService } from '../services/integrations';
import { useAuthStore } from '../store/authStore';
import { supabase } from '../services/supabase';
import type { CRMIntegration } from '../types';

describe('Integration Tests', () => {
  let integrationService: IntegrationsService;

  beforeEach(() => {
    integrationService = IntegrationsService.getInstance();
    useAuthStore.setState({
      user: {
        id: 'test-user',
        email: 'test@example.com',
        businessName: 'Test Business',
        subscription: 'pro'
      }
    });
  });

  describe('CRM Integration', () => {
    test('should configure CRM connection setup', async () => {
      const crmConfig: Omit<CRMIntegration, 'id' | 'createdAt' | 'updatedAt'> = {
        name: 'Test CRM',
        type: 'highlevel',
        config: {
          webhookUrl: 'https://api.test-crm.com/webhook',
          apiKey: 'test-api-key',
          locationId: 'test-location',
          callbackFields: {
            transcript: true,
            sentiment: true,
            appointments: true,
            summary: true,
            recording: true
          }
        },
        status: 'active'
      };

      await integrationService.saveIntegration(
        useAuthStore.getState().user!.id,
        crmConfig
      );

      const { data: integration } = await supabase
        ?.from('integrations')
        .select('*')
        .eq('user_id', useAuthStore.getState().user!.id)
        .single();

      expect(integration).toMatchObject(crmConfig);
    });

    test('should verify data synchronization', async () => {
      const testData = {
        contactName: 'John Doe',
        phoneNumber: '+1234567890',
        callData: {
          duration: 300,
          transcript: 'Test call transcript',
          sentiment: 'positive'
        }
      };

      const { data: syncResult } = await supabase?.functions.invoke('sync-crm-data', {
        body: testData
      });

      expect(syncResult.success).toBe(true);
      expect(syncResult.synced_fields).toContain('contact');
      expect(syncResult.synced_fields).toContain('call');
    });

    test('should handle webhook delivery', async () => {
      const webhookData = {
        event: 'call.completed',
        data: {
          callId: 'test-call-1',
          duration: 300,
          transcript: 'Test transcript'
        }
      };

      const { data: delivery } = await supabase?.functions.invoke('deliver-webhook', {
        body: webhookData
      });

      expect(delivery.status).toBe('delivered');
      expect(delivery.timestamp).toBeTruthy();
    });

    test('should validate error handling', async () => {
      // Test invalid API key
      const invalidConfig: Omit<CRMIntegration, 'id' | 'createdAt' | 'updatedAt'> = {
        name: 'Invalid CRM',
        type: 'highlevel',
        config: {
          webhookUrl: 'https://api.test-crm.com/webhook',
          apiKey: 'invalid-key',
          locationId: 'test-location',
          callbackFields: {
            transcript: true,
            sentiment: true,
            appointments: true,
            summary: true,
            recording: true
          }
        },
        status: 'active'
      };

      await expect(integrationService.saveIntegration(
        useAuthStore.getState().user!.id,
        invalidConfig
      )).rejects.toThrow('Invalid API key');

      // Test invalid webhook URL
      const invalidWebhook: Omit<CRMIntegration, 'id' | 'createdAt' | 'updatedAt'> = {
        name: 'Invalid Webhook',
        type: 'highlevel',
        config: {
          webhookUrl: 'not-a-url',
          apiKey: 'test-key',
          locationId: 'test-location',
          callbackFields: {
            transcript: true,
            sentiment: true,
            appointments: true,
            summary: true,
            recording: true
          }
        },
        status: 'active'
      };

      await expect(integrationService.saveIntegration(
        useAuthStore.getState().user!.id,
        invalidWebhook
      )).rejects.toThrow('Invalid webhook URL');
    });
  });

  describe('Calendar Integration', () => {
    test('should connect to calendar provider', async () => {
      const calendarConfig = {
        provider: 'google',
        config: {
          apiKey: 'test-calendar-key',
          calendarId: 'primary',
          syncEnabled: true,
          syncDirection: 'two-way' as const
        }
      };

      const { data: connection } = await supabase?.functions.invoke('connect-calendar', {
        body: calendarConfig
      });

      expect(connection.status).toBe('connected');
      expect(connection.provider).toBe('google');
    });

    test('should sync event data', async () => {
      const eventData = {
        title: 'Test Call',
        startTime: new Date().toISOString(),
        duration: 30,
        attendees: ['contact@example.com']
      };

      const { data: syncResult } = await supabase?.functions.invoke('sync-calendar-event', {
        body: eventData
      });

      expect(syncResult.success).toBe(true);
      expect(syncResult.event_id).toBeTruthy();
    });

    test('should handle timezone differences', async () => {
      const userTimezone = 'America/New_York';
      const eventTime = '2024-02-01T10:00:00';

      const { data: event } = await supabase?.functions.invoke('create-calendar-event', {
        body: {
          time: eventTime,
          timezone: userTimezone
        }
      });

      expect(event.start_time).toBeTruthy();
      expect(event.timezone).toBe(userTimezone);
    });

    test('should resolve scheduling conflicts', async () => {
      const conflictingTime = new Date();
      
      // Create first event
      await supabase?.functions.invoke('create-calendar-event', {
        body: {
          time: conflictingTime.toISOString(),
          duration: 30
        }
      });

      // Try to create second event at same time
      const { data: conflict } = await supabase?.functions.invoke('create-calendar-event', {
        body: {
          time: conflictingTime.toISOString(),
          duration: 30
        }
      });

      expect(conflict.status).toBe('conflict');
      expect(conflict.suggested_times).toBeTruthy();
      expect(conflict.suggested_times.length).toBeGreaterThan(0);
    });
  });

  describe('Webhook System', () => {
    test('should configure webhook endpoints', async () => {
      const webhookConfig = {
        url: 'https://api.test-webhook.com/endpoint',
        events: ['call.completed', 'call.scheduled'],
        secret: 'test-webhook-secret'
      };

      const { data: webhook } = await supabase?.functions.invoke('create-webhook', {
        body: webhookConfig
      });

      expect(webhook.id).toBeTruthy();
      expect(webhook.status).toBe('active');
    });

    test('should verify event triggering', async () => {
      const testEvent = {
        type: 'call.completed',
        data: {
          callId: 'test-call-1',
          duration: 300
        }
      };

      const { data: delivery } = await supabase?.functions.invoke('trigger-webhook', {
        body: testEvent
      });

      expect(delivery.success).toBe(true);
      expect(delivery.delivered_to).toBeGreaterThan(0);
    });

    test('should validate payload signatures', async () => {
      const payload = {
        event: 'call.completed',
        data: { callId: 'test-call-1' }
      };
      const secret = 'test-webhook-secret';

      const { data: validation } = await supabase?.functions.invoke('validate-webhook', {
        body: {
          payload,
          secret,
          signature: 'invalid-signature'
        }
      });

      expect(validation.valid).toBe(false);
      expect(validation.error).toBe('Invalid signature');
    });

    test('should implement retry mechanism', async () => {
      const failingEndpoint = {
        url: 'https://failing-endpoint.test/webhook',
        maxRetries: 3,
        retryDelay: 1000
      };

      const { data: retryResult } = await supabase?.functions.invoke('test-webhook-retry', {
        body: failingEndpoint
      });

      expect(retryResult.attempts).toBe(3);
      expect(retryResult.success).toBe(false);
      expect(retryResult.error).toBe('Max retries exceeded');
    });
  });

  describe('Security Testing', () => {
    test('should enforce authentication security', async () => {
      const invalidAuth = {
        apiKey: 'invalid-key',
        endpoint: '/api/secure'
      };

      await expect(supabase?.functions.invoke('test-auth-security', {
        body: invalidAuth
      })).rejects.toThrow('Unauthorized');
    });

    test('should prevent XSS attacks', async () => {
      const maliciousData = {
        name: '<script>alert("xss")</script>',
        callback: 'javascript:alert("xss")'
      };

      const { data: sanitized } = await supabase?.functions.invoke('sanitize-input', {
        body: maliciousData
      });

      expect(sanitized.name).not.toContain('<script>');
      expect(sanitized.callback).not.toContain('javascript:');
    });

    test('should implement CSRF protection', async () => {
      const csrfTest = {
        token: 'invalid-csrf-token',
        action: 'update'
      };

      await expect(supabase?.functions.invoke('test-csrf-protection', {
        body: csrfTest
      })).rejects.toThrow('Invalid CSRF token');
    });

    test('should verify rate limiting', async () => {
      const requests = Array(10).fill({
        endpoint: '/api/test',
        method: 'POST'
      });

      const results = await Promise.all(
        requests.map(() => supabase?.functions.invoke('test-rate-limit', {
          body: { timestamp: Date.now() }
        }))
      );

      const rateLimited = results.some(result => 
        result?.error?.message === 'Rate limit exceeded'
      );

      expect(rateLimited).toBe(true);
    });
  });

  describe('Cross-browser Testing', () => {
    test('should verify Chrome compatibility', async () => {
      const chromeTest = {
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        features: ['WebRTC', 'WebSocket', 'IndexedDB']
      };

      const { data: compatibility } = await supabase?.functions.invoke('test-browser-compatibility', {
        body: chromeTest
      });

      expect(compatibility.supported).toBe(true);
      expect(compatibility.features_available).toEqual(expect.arrayContaining(chromeTest.features));
    });

    test('should verify Firefox compatibility', async () => {
      const firefoxTest = {
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:120.0) Gecko/20100101 Firefox/120.0',
        features: ['WebRTC', 'WebSocket', 'IndexedDB']
      };

      const { data: compatibility } = await supabase?.functions.invoke('test-browser-compatibility', {
        body: firefoxTest
      });

      expect(compatibility.supported).toBe(true);
      expect(compatibility.features_available).toEqual(expect.arrayContaining(firefoxTest.features));
    });

    test('should verify Safari compatibility', async () => {
      const safariTest = {
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15',
        features: ['WebRTC', 'WebSocket', 'IndexedDB']
      };

      const { data: compatibility } = await supabase?.functions.invoke('test-browser-compatibility', {
        body: safariTest
      });

      expect(compatibility.supported).toBe(true);
      expect(compatibility.features_available).toEqual(expect.arrayContaining(safariTest.features));
    });

    test('should handle unsupported browsers', async () => {
      const oldBrowserTest = {
        userAgent: 'Mozilla/4.0 (compatible; MSIE 8.0; Windows NT 6.1; Trident/4.0)',
        features: ['WebRTC', 'WebSocket', 'IndexedDB']
      };

      const { data: compatibility } = await supabase?.functions.invoke('test-browser-compatibility', {
        body: oldBrowserTest
      });

      expect(compatibility.supported).toBe(false);
      expect(compatibility.missing_features).toBeTruthy();
      expect(compatibility.upgrade_message).toBeTruthy();
    });
  });
});