import React, { useState } from 'react';
import { X, CreditCard, Check, AlertCircle, ToggleLeft, ToggleRight } from 'lucide-react';
import type { User } from '../types';
import { stripeService } from '../services/stripe';

interface BillingSettingsModalProps {
  user: User;
  onClose: () => void;
  onUpgrade: (plan: string) => Promise<void>;
}

interface Plan {
  id: string;
  name: string;
  price: number;
  features: string[];
  limits: {
    calls: number;
    voices: number;
    integrations: number;
  };
}

const plans: Plan[] = [
  {
    id: 'trial',
    name: 'Free Trial',
    price: 0,
    features: [
      'First 50 calls free',
      '2 voice agents',
      'Basic analytics',
      'Email support'
    ],
    limits: {
      calls: 50,
      voices: 2,
      integrations: 1
    }
  },
  {
    id: 'starter',
    name: 'Starter',
    price: 10,
    features: [
      'Up to 100 calls per month',
      'Unused calls roll over for 2 months',
      '2 voice agents',
      'Basic analytics',
      'Email support'
    ],
    limits: {
      calls: 100,
      voices: 2,
      integrations: 1
    }
  },
  {
    id: 'pro',
    name: 'Professional',
    price: 49,
    features: [
      'Up to 1,000 calls per month',
      'Unused calls roll over for 2 months',
      '10 voice agents',
      'Advanced analytics',
      'Priority support',
      'CRM integrations'
    ],
    limits: {
      calls: 1000,
      voices: 10,
      integrations: 5
    }
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 199,
    features: [
      'Unlimited calls',
      'Unlimited voice agents',
      'Enterprise analytics',
      'Dedicated support',
      'Custom integrations',
      'SLA guarantee',
      'On-premise deployment'
    ],
    limits: {
      calls: -1, // unlimited
      voices: -1, // unlimited
      integrations: -1 // unlimited
    }
  }
];

const BillingSettingsModal: React.FC<BillingSettingsModalProps> = ({
  user,
  onClose,
  onUpgrade
}) => {
  const [selectedPlan, setSelectedPlan] = useState<string>(user.subscription);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [autoRenew, setAutoRenew] = useState(user.auto_renew || false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [paymentData, setPaymentData] = useState({
    cardNumber: '',
    expiry: '',
    cvc: '',
    name: ''
  });

  const getTrialStatus = () => {
    if (user.subscription === 'trial') {
      return (
        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="text-lg font-medium text-blue-800">Free Trial Status</h3>
          <p className="text-sm text-blue-600 mt-1">
            {user.trial_calls_remaining} calls remaining in your trial
          </p>
          <p className="text-sm text-blue-600 mt-1">
            Upgrade now to continue using SmartKaos.AI after your trial ends
          </p>
        </div>
      );
    }
    return null;
  };

  const getUsageStatus = () => {
    if (!user.calls_remaining && !user.rollover_calls) return null;

    return (
      <div className="mb-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
        <h3 className="text-lg font-medium text-gray-800">Call Usage</h3>
        <div className="mt-2 space-y-2">
          <p className="text-sm text-gray-600">
            Current period calls remaining: <span className="font-medium">{user.calls_remaining}</span>
          </p>
          {user.rollover_calls > 0 && (
            <p className="text-sm text-gray-600">
              Rollover calls: <span className="font-medium">{user.rollover_calls}</span>
              <span className="text-gray-500 text-xs ml-2">
                (expires {new Date(user.rollover_expiry_date).toLocaleDateString()})
              </span>
            </p>
          )}
          <p className="text-sm text-gray-600">
            Current period ends: <span className="font-medium">
              {new Date(user.current_period_end).toLocaleDateString()}
            </span>
          </p>
        </div>
      </div>
    );
  };

  const handleUpgrade = async () => {
    if (selectedPlan === user.subscription) {
      onClose();
      return;
    }

    setError(null);
    setIsProcessing(true);

    try {
      // Get price ID for selected plan
      const priceId = getPriceId(selectedPlan);
      
      // Create Stripe subscription
      await stripeService.createSubscription(priceId, autoRenew);
      
      // Update local state
      await onUpgrade(selectedPlan);
      onClose();
    } catch (err) {
      setError('Failed to upgrade plan. Please try again.');
      setIsProcessing(false);
    }
  };

  const handleAutoRenewToggle = async () => {
    if (!user.stripe_subscription_id) {
      setError('No active subscription found');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      await stripeService.updateAutoRenew(user.stripe_subscription_id, !autoRenew);
      setAutoRenew(!autoRenew);
    } catch (err) {
      setError('Failed to update auto-renewal settings. Please try again.');
      console.error('Error updating auto-renew:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    // Reset form state before closing
    setSelectedPlan(user.subscription);
    setShowPaymentForm(false);
    setError(null);
    setPaymentData({
      cardNumber: '',
      expiry: '',
      cvc: '',
      name: ''
    });
    onClose();
  };

  const formatPrice = (price: number) => {
    return price === 0 ? 'Free' : `$${price}/month`;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-white">
          <h2 className="text-xl font-semibold">Billing Settings</h2>
          <button onClick={handleClose} className="text-gray-400 hover:text-gray-500">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="m-4 p-4 bg-red-50 border border-red-200 rounded-md flex items-center text-red-700">
            <AlertCircle className="w-5 h-5 mr-2" />
            {error}
          </div>
        )}

        <div className="p-6">
          {getTrialStatus()}
          {getUsageStatus()}

          {user.subscription !== 'trial' && (
            <div className="mb-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium text-gray-800">Auto-Renewal</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {autoRenew 
                      ? 'Your subscription will automatically renew each month' 
                      : 'Your subscription will need to be manually renewed'}
                  </p>
                </div>
                <button
                  onClick={handleAutoRenewToggle}
                  className="text-indigo-600 hover:text-indigo-700"
                  disabled={isProcessing}
                >
                  {autoRenew ? (
                    <ToggleRight className="w-10 h-10" />
                  ) : (
                    <ToggleLeft className="w-10 h-10" />
                  )}
                </button>
              </div>
            </div>
          )}

          {!showPaymentForm ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {plans.map((plan) => (
                <div
                  key={plan.id}
                  className={`border rounded-lg p-6 ${
                    selectedPlan === plan.id
                      ? 'border-indigo-600 ring-2 ring-indigo-600 ring-opacity-50'
                      : 'border-gray-200 hover:border-indigo-200'
                  }`}
                >
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold">{plan.name}</h3>
                    {user.subscription === plan.id && (
                      <span className="bg-indigo-100 text-indigo-700 text-sm px-2 py-1 rounded-full">
                        Current
                      </span>
                    )}
                  </div>
                  <p className="text-3xl font-bold mb-6">{formatPrice(plan.price)}</p>
                  <ul className="space-y-3 mb-6">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-center text-sm text-gray-600">
                        <Check className="w-4 h-4 text-green-500 mr-2" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <button
                    onClick={() => {
                      setSelectedPlan(plan.id);
                      if (plan.price > 0 && plan.id !== user.subscription) {
                        setShowPaymentForm(true);
                      } else {
                        handleUpgrade();
                      }
                    }}
                    disabled={isProcessing}
                    className={`w-full py-2 px-4 rounded-md ${
                      user.subscription === plan.id
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-indigo-600 text-white hover:bg-indigo-700'
                    }`}
                  >
                    {user.subscription === plan.id ? 'Current Plan' : 'Select Plan'}
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="max-w-md mx-auto">
              <h3 className="text-lg font-medium mb-4">Payment Information</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Card Number</label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <CreditCard className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      value={paymentData.cardNumber}
                      onChange={(e) => setPaymentData({ ...paymentData, cardNumber: e.target.value })}
                      placeholder="4242 4242 4242 4242"
                      className="block w-full pl-10 sm:text-sm border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Expiry Date</label>
                    <input
                      type="text"
                      value={paymentData.expiry}
                      onChange={(e) => setPaymentData({ ...paymentData, expiry: e.target.value })}
                      placeholder="MM/YY"
                      className="mt-1 block w-full sm:text-sm border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">CVC</label>
                    <input
                      type="text"
                      value={paymentData.cvc}
                      onChange={(e) => setPaymentData({ ...paymentData, cvc: e.target.value })}
                      placeholder="123"
                      className="mt-1 block w-full sm:text-sm border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Name on Card</label>
                  <input
                    type="text"
                    value={paymentData.name}
                    onChange={(e) => setPaymentData({ ...paymentData, name: e.target.value })}
                    placeholder="John Smith"
                    className="mt-1 block w-full sm:text-sm border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowPaymentForm(false);
                    setSelectedPlan(user.subscription);
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpgrade}
                  disabled={isProcessing}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 flex items-center space-x-2"
                >
                  {isProcessing ? 'Processing...' : 'Confirm Upgrade'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BillingSettingsModal;