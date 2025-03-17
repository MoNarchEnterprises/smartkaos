import { loadStripe } from '@stripe/stripe-js';
import { supabase } from './supabase';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

export class StripeService {
  private static instance: StripeService;

  private constructor() {}

  public static getInstance(): StripeService {
    if (!StripeService.instance) {
      StripeService.instance = new StripeService();
    }
    return StripeService.instance;
  }

  async createSubscription(priceId: string, autoRenew: boolean = true) {
    if (!supabase) {
      throw new Error('Supabase client not initialized');
    }

    try {
      // Create subscription in Supabase
      const { data: subscription, error } = await supabase
        .functions.invoke('create-subscription', {
          body: { priceId, autoRenew }
        });

      if (error) throw error;

      // Load Stripe
      const stripe = await stripePromise;
      if (!stripe) throw new Error('Stripe failed to load');

      // Redirect to Stripe Checkout
      const { error: stripeError } = await stripe.redirectToCheckout({
        sessionId: subscription.sessionId
      });

      if (stripeError) throw stripeError;

    } catch (error) {
      console.error('Error creating subscription:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to create subscription');
    }
  }

  async updateAutoRenew(subscriptionId: string, autoRenew: boolean) {
    if (!supabase) {
      throw new Error('Supabase client not initialized');
    }

    if (!subscriptionId) {
      throw new Error('Subscription ID is required');
    }

    try {
      const { data, error } = await supabase
        .functions.invoke('update-subscription', {
          body: { 
            subscriptionId, 
            autoRenew,
            action: autoRenew ? 'enable_auto_renew' : 'disable_auto_renew'
          }
        });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating auto-renew:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to update auto-renewal settings');
    }
  }

  async cancelSubscription(subscriptionId: string) {
    if (!supabase) {
      throw new Error('Supabase client not initialized');
    }

    if (!subscriptionId) {
      throw new Error('Subscription ID is required');
    }

    try {
      const { data, error } = await supabase
        .functions.invoke('cancel-subscription', {
          body: { subscriptionId }
        });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to cancel subscription');
    }
  }

  async getSubscriptionStatus(subscriptionId: string) {
    if (!supabase) {
      throw new Error('Supabase client not initialized');
    }

    if (!subscriptionId) {
      throw new Error('Subscription ID is required');
    }

    try {
      const { data, error } = await supabase
        .functions.invoke('get-subscription', {
          body: { subscriptionId }
        });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error getting subscription status:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to get subscription status');
    }
  }
}

export const stripeService = StripeService.getInstance();