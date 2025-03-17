import { describe, test, expect, beforeEach } from 'vitest';
import { useAuthStore } from '../store/authStore';
import { supabase } from '../services/supabase';

describe('Subscription & Billing Tests', () => {
  beforeEach(() => {
    // Reset auth store state
    useAuthStore.setState({
      user: {
        id: 'test-user',
        email: 'test@example.com',
        businessName: 'Test Business',
        subscription: 'trial',
        trial_used: false,
        trial_calls_remaining: 50,
        subscription_status: 'trial'
      }
    });
  });

  describe('Plan Management', () => {
    test('should upgrade plan successfully', async () => {
      const user = useAuthStore.getState().user!;
      const upgradePlan = 'pro';

      await useAuthStore.getState().updateProfile({
        subscription: upgradePlan,
        subscription_status: 'active',
        subscription_start_date: new Date().toISOString()
      });

      const { data: profile } = await supabase
        ?.from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      expect(profile.subscription).toBe(upgradePlan);
      expect(profile.subscription_status).toBe('active');
      expect(profile.calls_remaining).toBe(1000); // Pro plan allocation
    });

    test('should handle plan downgrade', async () => {
      // First set up pro subscription
      await useAuthStore.getState().updateProfile({
        subscription: 'pro',
        calls_remaining: 500,
        rollover_calls: 200
      });

      // Then downgrade
      await useAuthStore.getState().updateProfile({
        subscription: 'starter'
      });

      const { data: profile } = await supabase
        ?.from('profiles')
        .select('*')
        .eq('id', useAuthStore.getState().user!.id)
        .single();

      expect(profile.subscription).toBe('starter');
      expect(profile.calls_remaining).toBe(100); // Starter plan allocation
      expect(profile.rollover_calls).toBe(0); // Should lose rollover calls
    });

    test('should verify feature access by plan', async () => {
      const planFeatures = {
        trial: {
          maxVoices: 2,
          maxCalls: 50,
          analytics: 'basic'
        },
        starter: {
          maxVoices: 2,
          maxCalls: 100,
          analytics: 'basic'
        },
        pro: {
          maxVoices: 10,
          maxCalls: 1000,
          analytics: 'advanced'
        },
        enterprise: {
          maxVoices: -1, // unlimited
          maxCalls: -1, // unlimited
          analytics: 'enterprise'
        }
      };

      for (const [plan, features] of Object.entries(planFeatures)) {
        await useAuthStore.getState().updateProfile({
          subscription: plan as any
        });

        const { data: profile } = await supabase
          ?.from('profiles')
          .select('*')
          .eq('id', useAuthStore.getState().user!.id)
          .single();

        expect(profile.subscription).toBe(plan);
        // Verify feature access based on plan
        if (plan === 'enterprise') {
          expect(profile.voice_limit).toBe(-1);
          expect(profile.call_limit).toBe(-1);
        } else {
          expect(profile.voice_limit).toBe(features.maxVoices);
          expect(profile.call_limit).toBe(features.maxCalls);
        }
      }
    });

    test('should handle trial expiration', async () => {
      const user = useAuthStore.getState().user!;
      
      // Set trial as expired
      await supabase?.from('profiles').update({
        trial_used: true,
        trial_calls_remaining: 0,
        subscription_status: 'expired'
      }).eq('id', user.id);

      // Attempt to make a call
      await expect(supabase?.from('calls').insert([{
        phoneNumber: '+1234567890',
        status: 'scheduled',
        startTime: new Date()
      }])).rejects.toThrow('Trial expired');

      // Verify user is prompted to upgrade
      const { data: profile } = await supabase
        ?.from('profiles')
        .select('subscription_status, needs_upgrade')
        .eq('id', user.id)
        .single();

      expect(profile.subscription_status).toBe('expired');
      expect(profile.needs_upgrade).toBe(true);
    });
  });

  describe('Payment Management', () => {
    test('should process payment successfully', async () => {
      const paymentData = {
        cardNumber: '4242424242424242',
        expiry: '12/25',
        cvc: '123',
        name: 'Test User'
      };

      const { data: subscription } = await supabase?.functions.invoke('process-payment', {
        body: {
          plan: 'pro',
          payment: paymentData
        }
      });

      expect(subscription.status).toBe('active');
      expect(subscription.current_period_end).toBeTruthy();
    });

    test('should handle payment failures', async () => {
      const invalidPaymentData = {
        cardNumber: '4242424242424241', // Invalid card
        expiry: '12/25',
        cvc: '123',
        name: 'Test User'
      };

      await expect(supabase?.functions.invoke('process-payment', {
        body: {
          plan: 'pro',
          payment: invalidPaymentData
        }
      })).rejects.toThrow('Payment failed: Invalid card number');
    });

    test('should update billing information', async () => {
      const newBillingInfo = {
        cardNumber: '5555555555554444',
        expiry: '12/25',
        cvc: '123',
        name: 'New User Name'
      };

      const { error } = await supabase?.functions.invoke('update-billing', {
        body: { billing: newBillingInfo }
      });

      expect(error).toBeNull();

      const { data: profile } = await supabase
        ?.from('profiles')
        .select('billing_info_updated_at')
        .eq('id', useAuthStore.getState().user!.id)
        .single();

      expect(profile.billing_info_updated_at).toBeTruthy();
    });

    test('should generate and download invoices', async () => {
      const { data: invoices } = await supabase
        ?.from('invoices')
        .select('*')
        .eq('user_id', useAuthStore.getState().user!.id);

      expect(invoices).toBeTruthy();
      
      // Test invoice download
      const { data: invoice } = await supabase?.functions.invoke('generate-invoice', {
        body: { invoice_id: invoices![0].id }
      });

      expect(invoice).toBeTruthy();
      expect(invoice.url).toMatch(/^https:\/\//);
    });
  });

  describe('Call Credit System', () => {
    test('should verify initial credit allocation', async () => {
      const plans = {
        trial: 50,
        starter: 100,
        pro: 1000,
        enterprise: -1 // unlimited
      };

      for (const [plan, credits] of Object.entries(plans)) {
        await useAuthStore.getState().updateProfile({
          subscription: plan as any
        });

        const { data: profile } = await supabase
          ?.from('profiles')
          .select('calls_remaining')
          .eq('id', useAuthStore.getState().user!.id)
          .single();

        expect(profile.calls_remaining).toBe(credits);
      }
    });

    test('should calculate rollover correctly', async () => {
      const user = useAuthStore.getState().user!;
      
      // Set up initial state
      await supabase?.from('profiles').update({
        subscription: 'pro',
        calls_remaining: 200,
        current_period_end: new Date(Date.now() - 86400000) // Yesterday
      }).eq('id', user.id);

      // Trigger period rollover
      await supabase?.from('profiles').update({
        current_period_start: new Date(),
        current_period_end: new Date(Date.now() + 30 * 86400000)
      }).eq('id', user.id);

      const { data: profile } = await supabase
        ?.from('profiles')
        .select('calls_remaining, rollover_calls')
        .eq('id', user.id)
        .single();

      expect(profile.rollover_calls).toBe(200); // Previous remaining calls
      expect(profile.calls_remaining).toBe(1000); // New period allocation
    });

    test('should enforce rollover expiration', async () => {
      const user = useAuthStore.getState().user!;
      
      // Set up rollover credits expiring soon
      await supabase?.from('profiles').update({
        rollover_calls: 100,
        rollover_expiry_date: new Date(Date.now() - 86400000) // Yesterday
      }).eq('id', user.id);

      // Trigger check
      await supabase?.from('profiles').update({
        checked_at: new Date()
      }).eq('id', user.id);

      const { data: profile } = await supabase
        ?.from('profiles')
        .select('rollover_calls')
        .eq('id', user.id)
        .single();

      expect(profile.rollover_calls).toBe(0); // Rollover credits should be expired
    });

    test('should handle credit updates on plan change', async () => {
      const user = useAuthStore.getState().user!;
      
      // Start with starter plan
      await useAuthStore.getState().updateProfile({
        subscription: 'starter',
        calls_remaining: 50,
        rollover_calls: 30
      });

      // Upgrade to pro
      await useAuthStore.getState().updateProfile({
        subscription: 'pro'
      });

      const { data: profile } = await supabase
        ?.from('profiles')
        .select('calls_remaining, rollover_calls')
        .eq('id', user.id)
        .single();

      expect(profile.calls_remaining).toBe(1000); // Pro plan allocation
      expect(profile.rollover_calls).toBe(80); // Previous remaining + rollover
    });
  });

  describe('Usage Reporting', () => {
    test('should track monthly usage', async () => {
      const user = useAuthStore.getState().user!;
      const startDate = new Date();
      startDate.setDate(1); // Start of month
      
      // Add some calls
      await supabase?.from('calls').insert([
        {
          user_id: user.id,
          status: 'completed',
          start_time: startDate
        },
        {
          user_id: user.id,
          status: 'completed',
          start_time: startDate
        }
      ]);

      const { data: usage } = await supabase?.functions.invoke('get-usage', {
        body: { month: startDate.getMonth() + 1, year: startDate.getFullYear() }
      });

      expect(usage.total_calls).toBe(2);
      expect(usage.period_start).toBe(startDate.toISOString());
    });

    test('should generate usage reports', async () => {
      const { data: report } = await supabase?.functions.invoke('generate-usage-report', {
        body: { 
          user_id: useAuthStore.getState().user!.id,
          start_date: new Date(Date.now() - 30 * 86400000).toISOString(),
          end_date: new Date().toISOString()
        }
      });

      expect(report).toBeTruthy();
      expect(report.usage_by_day).toBeTruthy();
      expect(report.total_calls).toBeGreaterThanOrEqual(0);
    });

    test('should notify on usage thresholds', async () => {
      const user = useAuthStore.getState().user!;
      
      // Set up near limit
      await supabase?.from('profiles').update({
        calls_remaining: 5, // 95% used
        subscription: 'starter'
      }).eq('id', user.id);

      // Make a call
      await supabase?.from('calls').insert([{
        user_id: user.id,
        status: 'completed',
        start_time: new Date()
      }]);

      const { data: notifications } = await supabase
        ?.from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1);

      expect(notifications![0].type).toBe('usage_warning');
      expect(notifications![0].message).toContain('95% of your monthly calls');
    });
  });
});