// Update User interface
export interface User {
  id: string;
  email: string;
  businessName: string;
  subscription: 'trial' | 'starter' | 'pro' | 'enterprise';
  trial_used: boolean;
  trial_calls_remaining: number;
  subscription_status: 'trial' | 'active' | 'expired';
  subscription_start_date?: string;
  subscription_end_date?: string;
  language: string;
  timezone: string;
  notifications: {
    callSummaries: boolean;
    weeklyReports: boolean;
    systemAlerts: boolean;
  };
}

// Add subscription types
export type SubscriptionTier = 'trial' | 'starter' | 'pro' | 'enterprise';
export type SubscriptionStatus = 'trial' | 'active' | 'expired';