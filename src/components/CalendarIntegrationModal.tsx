import React, { useState } from 'react';
import { X, Save } from 'lucide-react';

interface CalendarIntegrationModalProps {
  onClose: () => void;
  onSave: (data: {
    provider: string;
    config: {
      apiKey?: string;
      calendarId?: string;
      syncEnabled: boolean;
      syncDirection: 'one-way' | 'two-way';
    };
  }) => void;
}

const CalendarIntegrationModal: React.FC<CalendarIntegrationModalProps> = ({
  onClose,
  onSave
}) => {
  const [formData, setFormData] = useState({
    provider: 'google',
    config: {
      apiKey: '',
      calendarId: '',
      syncEnabled: true,
      syncDirection: 'two-way' as const
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-lg">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-semibold">Calendar Integration</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">Calendar Provider</label>
            <select
              value={formData.provider}
              onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="google">Google Calendar</option>
              <option value="outlook">Microsoft Outlook</option>
              <option value="ical">iCalendar</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">API Key</label>
            <input
              type="password"
              value={formData.config.apiKey}
              onChange={(e) => setFormData({
                ...formData,
                config: { ...formData.config, apiKey: e.target.value }
              })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Calendar ID</label>
            <input
              type="text"
              value={formData.config.calendarId}
              onChange={(e) => setFormData({
                ...formData,
                config: { ...formData.config, calendarId: e.target.value }
              })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="primary or calendar ID"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Sync Settings</label>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.config.syncEnabled}
                  onChange={(e) => setFormData({
                    ...formData,
                    config: { ...formData.config, syncEnabled: e.target.checked }
                  })}
                  className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="ml-2 text-sm text-gray-700">Enable Calendar Sync</span>
              </label>

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700">Sync Direction</label>
                <select
                  value={formData.config.syncDirection}
                  onChange={(e) => setFormData({
                    ...formData,
                    config: {
                      ...formData.config,
                      syncDirection: e.target.value as 'one-way' | 'two-way'
                    }
                  })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="one-way">One-way (AI Calls → Calendar)</option>
                  <option value="two-way">Two-way Sync</option>
                </select>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 flex items-center space-x-2"
            >
              <Save className="w-4 h-4" />
              <span>Save Configuration</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CalendarIntegrationModal;