import React, { useState } from 'react';
import { Bell, CreditCard, Globe, Lock, User, Check, AlertCircle } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import BillingSettingsModal from '../components/BillingSettingsModal';
import CalendarIntegrationModal from '../components/CalendarIntegrationModal';
import IntegrationModal from '../components/IntegrationModal';
import WebhookConfigModal from '../components/WebhookConfigModal';

const Settings: React.FC = () => {
  const { user, updateProfile, updatePassword } = useAuthStore();
  const [activeTab, setActiveTab] = useState('profile');
  const [showBillingModal, setShowBillingModal] = useState(false);
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [showIntegrationModal, setShowIntegrationModal] = useState(false);
  const [showWebhookModal, setShowWebhookModal] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    businessName: user?.businessName || '',
    email: user?.email || '',
    language: user?.language || 'en',
    timezone: user?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
    notifications: user?.notifications || {
      callSummaries: true,
      weeklyReports: true,
      systemAlerts: true
    },
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'billing', label: 'Billing', icon: CreditCard },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Lock },
    { id: 'integrations', label: 'Integrations', icon: Globe }
  ];

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateProfile({
        businessName: formData.businessName,
        language: formData.language,
        timezone: formData.timezone,
        notifications: formData.notifications
      });
      setSuccess('Profile updated successfully');
    } catch (err) {
      setError('Failed to update profile');
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.newPassword !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    try {
      await updatePassword(formData.currentPassword, formData.newPassword);
      setSuccess('Password updated successfully');
      setFormData(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      }));
    } catch (err) {
      setError('Failed to update password');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Settings</h1>
      </div>

      {success && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-center text-green-700">
          <Check className="w-5 h-5 mr-2" />
          {success}
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center text-red-700">
          <AlertCircle className="w-5 h-5 mr-2" />
          {error}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-4" aria-label="Tabs">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-indigo-600 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'profile' && (
            <form onSubmit={handleProfileSubmit} className="space-y-6 max-w-lg">
              <div>
                <label className="block text-sm font-medium text-gray-700">Business Name</label>
                <input
                  type="text"
                  value={formData.businessName}
                  onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  disabled
                  className="mt-1 block w-full rounded-md border-gray-300 bg-gray-50 shadow-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Language</label>
                <select
                  value={formData.language}
                  onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="en">English</option>
                  <option value="es">Spanish</option>
                  <option value="fr">French</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Timezone</label>
                <select
                  value={formData.timezone}
                  onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                >
                  {Intl.supportedValuesOf('timeZone').map((tz) => (
                    <option key={tz} value={tz}>{tz}</option>
                  ))}
                </select>
              </div>

              <div>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                >
                  Save Changes
                </button>
              </div>
            </form>
          )}

          {activeTab === 'billing' && (
            <div className="space-y-6">
              <div className="bg-gray-50 p-6 rounded-lg">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h3 className="text-lg font-medium">Current Plan</h3>
                    <p className="text-sm text-gray-500">
                      You are currently on the {user?.subscription.charAt(0).toUpperCase() + user?.subscription.slice(1)} plan
                    </p>
                  </div>
                  <button
                    onClick={() => setShowBillingModal(true)}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                  >
                    Upgrade Plan
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <form className="space-y-6 max-w-lg">
              <div className="space-y-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.notifications.callSummaries}
                    onChange={(e) => setFormData({
                      ...formData,
                      notifications: {
                        ...formData.notifications,
                        callSummaries: e.target.checked
                      }
                    })}
                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Call Summaries</span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.notifications.weeklyReports}
                    onChange={(e) => setFormData({
                      ...formData,
                      notifications: {
                        ...formData.notifications,
                        weeklyReports: e.target.checked
                      }
                    })}
                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Weekly Reports</span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.notifications.systemAlerts}
                    onChange={(e) => setFormData({
                      ...formData,
                      notifications: {
                        ...formData.notifications,
                        systemAlerts: e.target.checked
                      }
                    })}
                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">System Alerts</span>
                </label>
              </div>

              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
              >
                Save Preferences
              </button>
            </form>
          )}

          {activeTab === 'security' && (
            <form onSubmit={handlePasswordSubmit} className="space-y-6 max-w-lg">
              <div>
                <label className="block text-sm font-medium text-gray-700">Current Password</label>
                <input
                  type="password"
                  value={formData.currentPassword}
                  onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">New Password</label>
                <input
                  type="password"
                  value={formData.newPassword}
                  onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Confirm New Password</label>
                <input
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
              >
                Update Password
              </button>
            </form>
          )}

          {activeTab === 'integrations' && (
            <div className="space-y-6">
              <div className="border rounded-lg divide-y">
                <div className="p-4">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium">CRM Integration</h3>
                    <button
                      onClick={() => setShowIntegrationModal(true)}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700"
                    >
                      Configure CRM
                    </button>
                  </div>
                  <p className="text-sm text-gray-500">Connect your CRM system to sync contacts and call data.</p>
                </div>

                <div className="p-4">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium">Calendar Integration</h3>
                    <button
                      onClick={() => setShowCalendarModal(true)}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700"
                    >
                      Configure Calendar
                    </button>
                  </div>
                  <p className="text-sm text-gray-500">Sync your calendar for automated call scheduling.</p>
                </div>

                <div className="p-4">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium">Webhook Configuration</h3>
                    <button
                      onClick={() => setShowWebhookModal(true)}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700"
                    >
                      Configure Webhooks
                    </button>
                  </div>
                  <p className="text-sm text-gray-500">Set up webhooks to receive real-time updates.</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {showBillingModal && (
        <BillingSettingsModal
          user={user!}
          onClose={() => setShowBillingModal(false)}
          onUpgrade={async (plan) => {
            try {
              await updateProfile({ subscription: plan });
              setSuccess('Successfully upgraded plan');
            } catch (err) {
              setError('Failed to upgrade plan');
              throw err;
            }
          }}
        />
      )}

      {showCalendarModal && (
        <CalendarIntegrationModal
          onClose={() => setShowCalendarModal(false)}
          onSave={async (data) => {
            console.log('Calendar integration data:', data);
            setShowCalendarModal(false);
          }}
        />
      )}

      {showIntegrationModal && (
        <IntegrationModal
          onClose={() => setShowIntegrationModal(false)}
          onSave={async (data) => {
            console.log('Integration data:', data);
            setShowIntegrationModal(false);
          }}
        />
      )}

      {showWebhookModal && (
        <WebhookConfigModal
          onClose={() => setShowWebhookModal(false)}
          onSave={async (data) => {
            console.log('Webhook config:', data);
            setShowWebhookModal(false);
          }}
        />
      )}
    </div>
  );
};

export default Settings;