import { describe, test, expect, beforeEach } from 'vitest';
import { useAuthStore } from '../store/authStore';
import { supabase } from '../services/supabase';

describe('Admin Dashboard Tests', () => {
  beforeEach(() => {
    // Set up admin user
    useAuthStore.setState({
      user: {
        id: 'admin-user',
        email: 'admin@example.com',
        businessName: 'Admin',
        subscription: 'enterprise',
        isAdmin: true
      }
    });
  });

  describe('User Management', () => {
    test('should fetch all registered users', async () => {
      const { data: users } = await supabase
        ?.from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      expect(users).toBeTruthy();
      expect(Array.isArray(users)).toBe(true);
      users?.forEach(user => {
        expect(user).toHaveProperty('id');
        expect(user).toHaveProperty('email');
        expect(user).toHaveProperty('business_name');
        expect(user).toHaveProperty('subscription');
      });
    });

    test('should monitor user activity status', async () => {
      const { data: users } = await supabase
        ?.from('profiles')
        .select('id, last_active_at')
        .order('last_active_at', { ascending: false });

      expect(users).toBeTruthy();
      users?.forEach(user => {
        expect(user.last_active_at).toBeTruthy();
        const lastActive = new Date(user.last_active_at);
        expect(lastActive).toBeInstanceOf(Date);
      });
    });

    test('should track subscription levels', async () => {
      const { data: subscriptionStats } = await supabase?.functions.invoke('get-subscription-stats');

      expect(subscriptionStats).toHaveProperty('trial');
      expect(subscriptionStats).toHaveProperty('starter');
      expect(subscriptionStats).toHaveProperty('pro');
      expect(subscriptionStats).toHaveProperty('enterprise');
      expect(subscriptionStats.total).toBeGreaterThan(0);
    });

    test('should access user statistics', async () => {
      const userId = 'test-user-id';
      const { data: userStats } = await supabase?.functions.invoke('get-user-stats', {
        body: { userId }
      });

      expect(userStats).toHaveProperty('total_calls');
      expect(userStats).toHaveProperty('avg_call_duration');
      expect(userStats).toHaveProperty('success_rate');
      expect(userStats).toHaveProperty('voice_agents_count');
    });
  });

  describe('Statistics & Analytics', () => {
    test('should track user metrics', async () => {
      const { data: metrics } = await supabase?.functions.invoke('get-user-metrics');

      expect(metrics).toHaveProperty('total_users');
      expect(metrics).toHaveProperty('active_users_30d');
      expect(metrics).toHaveProperty('user_growth_rate');
      expect(metrics).toHaveProperty('geographic_distribution');
    });

    test('should calculate financial metrics', async () => {
      const { data: financials } = await supabase?.functions.invoke('get-financial-metrics');

      expect(financials).toHaveProperty('mrr');
      expect(financials).toHaveProperty('revenue_by_tier');
      expect(financials).toHaveProperty('trial_conversion_rate');
      expect(financials).toHaveProperty('subscription_changes');
      expect(financials.mrr).toBeGreaterThanOrEqual(0);
    });

    test('should monitor system usage', async () => {
      const { data: usage } = await supabase?.functions.invoke('get-system-usage');

      expect(usage).toHaveProperty('total_calls');
      expect(usage).toHaveProperty('avg_call_duration');
      expect(usage).toHaveProperty('system_load');
      expect(usage).toHaveProperty('resource_utilization');
      expect(usage.total_calls).toBeGreaterThanOrEqual(0);
    });

    test('should track user growth trends', async () => {
      const { data: trends } = await supabase?.functions.invoke('get-growth-trends');

      expect(trends).toHaveProperty('daily_signups');
      expect(trends).toHaveProperty('weekly_growth');
      expect(trends).toHaveProperty('monthly_growth');
      expect(trends).toHaveProperty('churn_rate');
      expect(Array.isArray(trends.daily_signups)).toBe(true);
    });
  });

  describe('System Health', () => {
    test('should monitor service status', async () => {
      const { data: status } = await supabase?.functions.invoke('get-service-status');

      expect(status).toHaveProperty('api');
      expect(status).toHaveProperty('database');
      expect(status).toHaveProperty('voice_service');
      expect(status).toHaveProperty('last_checked');
      
      Object.values(status).forEach(service => {
        if (service !== status.last_checked) {
          expect(service).toHaveProperty('status');
          expect(service).toHaveProperty('uptime');
          expect(service).toHaveProperty('latency');
        }
      });
    });

    test('should track error rates', async () => {
      const { data: errors } = await supabase?.functions.invoke('get-error-metrics');

      expect(errors).toHaveProperty('error_rate');
      expect(errors).toHaveProperty('error_types');
      expect(errors).toHaveProperty('affected_services');
      expect(errors).toHaveProperty('trend');
      expect(errors.error_rate).toBeGreaterThanOrEqual(0);
    });

    test('should monitor performance metrics', async () => {
      const { data: performance } = await supabase?.functions.invoke('get-performance-metrics');

      expect(performance).toHaveProperty('api_response_time');
      expect(performance).toHaveProperty('database_queries');
      expect(performance).toHaveProperty('voice_processing');
      expect(performance).toHaveProperty('resource_usage');
      
      expect(performance.api_response_time).toBeGreaterThan(0);
      expect(performance.database_queries.avg_time).toBeGreaterThan(0);
    });

    test('should track API usage statistics', async () => {
      const { data: apiStats } = await supabase?.functions.invoke('get-api-stats');

      expect(apiStats).toHaveProperty('total_requests');
      expect(apiStats).toHaveProperty('requests_by_endpoint');
      expect(apiStats).toHaveProperty('error_rate');
      expect(apiStats).toHaveProperty('average_response_time');
      expect(apiStats.total_requests).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Security Monitoring', () => {
    test('should track failed login attempts', async () => {
      const { data: loginAttempts } = await supabase?.functions.invoke('get-failed-logins');

      expect(loginAttempts).toHaveProperty('total_attempts');
      expect(loginAttempts).toHaveProperty('by_ip');
      expect(loginAttempts).toHaveProperty('by_email');
      expect(loginAttempts).toHaveProperty('timestamp');
      expect(Array.isArray(loginAttempts.by_ip)).toBe(true);
    });

    test('should detect suspicious activity', async () => {
      const { data: suspicious } = await supabase?.functions.invoke('get-suspicious-activity');

      expect(suspicious).toHaveProperty('alerts');
      expect(suspicious).toHaveProperty('severity_levels');
      expect(suspicious).toHaveProperty('affected_users');
      expect(Array.isArray(suspicious.alerts)).toBe(true);
      suspicious.alerts.forEach(alert => {
        expect(alert).toHaveProperty('type');
        expect(alert).toHaveProperty('severity');
        expect(alert).toHaveProperty('timestamp');
      });
    });

    test('should monitor API key usage', async () => {
      const { data: apiUsage } = await supabase?.functions.invoke('get-api-key-usage');

      expect(apiUsage).toHaveProperty('total_requests');
      expect(apiUsage).toHaveProperty('by_key');
      expect(apiUsage).toHaveProperty('suspicious_patterns');
      expect(Array.isArray(apiUsage.by_key)).toBe(true);
    });

    test('should track rate limit violations', async () => {
      const { data: rateLimit } = await supabase?.functions.invoke('get-rate-limit-violations');

      expect(rateLimit).toHaveProperty('total_violations');
      expect(rateLimit).toHaveProperty('by_endpoint');
      expect(rateLimit).toHaveProperty('by_ip');
      expect(rateLimit).toHaveProperty('timestamp');
      expect(rateLimit.total_violations).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Reporting', () => {
    test('should generate user growth reports', async () => {
      const { data: report } = await supabase?.functions.invoke('generate-growth-report', {
        body: {
          start_date: new Date(Date.now() - 30 * 86400000).toISOString(),
          end_date: new Date().toISOString()
        }
      });

      expect(report).toHaveProperty('new_users');
      expect(report).toHaveProperty('active_users');
      expect(report).toHaveProperty('churned_users');
      expect(report).toHaveProperty('growth_rate');
      expect(Array.isArray(report.new_users)).toBe(true);
    });

    test('should analyze revenue metrics', async () => {
      const { data: revenue } = await supabase?.functions.invoke('generate-revenue-report', {
        body: { month: new Date().getMonth() + 1, year: new Date().getFullYear() }
      });

      expect(revenue).toHaveProperty('total_revenue');
      expect(revenue).toHaveProperty('by_subscription');
      expect(revenue).toHaveProperty('mrr_change');
      expect(revenue).toHaveProperty('projections');
      expect(revenue.total_revenue).toBeGreaterThanOrEqual(0);
    });

    test('should compile system usage statistics', async () => {
      const { data: usage } = await supabase?.functions.invoke('generate-usage-report', {
        body: { days: 30 }
      });

      expect(usage).toHaveProperty('total_calls');
      expect(usage).toHaveProperty('avg_duration');
      expect(usage).toHaveProperty('success_rate');
      expect(usage).toHaveProperty('peak_times');
      expect(usage.total_calls).toBeGreaterThanOrEqual(0);
    });

    test('should maintain error and incident logs', async () => {
      const { data: logs } = await supabase?.functions.invoke('get-incident-logs', {
        body: { 
          severity: ['high', 'medium'],
          start_date: new Date(Date.now() - 7 * 86400000).toISOString()
        }
      });

      expect(logs).toHaveProperty('incidents');
      expect(logs).toHaveProperty('resolution_times');
      expect(logs).toHaveProperty('affected_services');
      expect(Array.isArray(logs.incidents)).toBe(true);
      logs.incidents.forEach(incident => {
        expect(incident).toHaveProperty('id');
        expect(incident).toHaveProperty('severity');
        expect(incident).toHaveProperty('timestamp');
        expect(incident).toHaveProperty('status');
      });
    });
  });

  describe('Access Control', () => {
    test('should restrict access to admin users only', async () => {
      // Set non-admin user
      useAuthStore.setState({
        user: {
          id: 'regular-user',
          email: 'user@example.com',
          businessName: 'Regular User',
          subscription: 'pro',
          isAdmin: false
        }
      });

      await expect(supabase?.functions.invoke('get-admin-stats'))
        .rejects.toThrow('Unauthorized: Admin access required');
    });

    test('should validate admin permissions', async () => {
      const { data: permissions } = await supabase?.functions.invoke('verify-admin-permissions', {
        body: { userId: useAuthStore.getState().user!.id }
      });

      expect(permissions.isAdmin).toBe(true);
      expect(permissions.capabilities).toContain('user_management');
      expect(permissions.capabilities).toContain('system_monitoring');
    });

    test('should log admin actions', async () => {
      const action = {
        type: 'user_update',
        target_id: 'test-user-id',
        changes: { subscription: 'pro' }
      };

      const { data: log } = await supabase?.functions.invoke('log-admin-action', {
        body: action
      });

      expect(log).toHaveProperty('id');
      expect(log).toHaveProperty('admin_id');
      expect(log).toHaveProperty('action_type');
      expect(log).toHaveProperty('timestamp');
      expect(log.admin_id).toBe(useAuthStore.getState().user!.id);
    });

    test('should enforce role-based access control', async () => {
      const actions = [
        'view_users',
        'modify_users',
        'view_billing',
        'modify_system_settings'
      ];

      const { data: permissions } = await supabase?.functions.invoke('check-admin-permissions', {
        body: { actions }
      });

      expect(permissions).toHaveProperty('allowed');
      expect(permissions).toHaveProperty('denied');
      expect(Array.isArray(permissions.allowed)).toBe(true);
      expect(Array.isArray(permissions.denied)).toBe(true);
    });
  });
});