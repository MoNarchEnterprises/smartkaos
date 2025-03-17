import React, { useState } from 'react';
import { X, Save } from 'lucide-react';
import type { CRMIntegration } from '../types';

interface IntegrationModalProps {
  integration?: CRMIntegration;
  onClose: () => void;
  onSave: (data: Omit<CRMIntegration, 'id' | 'createdAt' | 'updatedAt'>) => void;
}

const IntegrationModal: React.FC<IntegrationModalProps> = ({
  integration,
  onClose,
  onSave
}) => {
  const [formData, setFormData] = useState({
    name: integration?.name || '',
    type: integration?.type || 'highlevel',
    config: {
      webhookUrl: integration?.config.webhookUrl || '',
      apiKey: integration?.config.apiKey || '',
      locationId: integration?.config.locationId || '',
      callbackFields: integration?.config.callbackFields || {
        transcript: true,
        sentiment: true,
        appointments: true,
        summary: true,
        recording: true
      }
    },
    status: integration?.status || 'active'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-2xl">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-semibold">
            {integration ? 'Edit Integration' : 'New Integration'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">Integration Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Integration Type</label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as CRMIntegration['type'] })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="highlevel">GoHighLevel</option>
              <option value="custom">Custom Webhook</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Webhook URL</label>
            <input
              type="url"
              value={formData.config.webhookUrl}
              onChange={(e) => setFormData({
                ...formData,
                config: { ...formData.config, webhookUrl: e.target.value }
              })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
              required
            />
          </div>

          {formData.type === 'highlevel' && (
            <>
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
                <label className="block text-sm font-medium text-gray-700">Location ID</label>
                <input
                  type="text"
                  value={formData.config.locationId}
                  onChange={(e) => setFormData({
                    ...formData,
                    config: { ...formData.config, locationId: e.target.value }
                  })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Callback Data</label>
            <div className="space-y-2">
              {Object.entries(formData.config.callbackFields || {}).map(([field, enabled]) => (
                <label key={field} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={enabled}
                    onChange={(e) => setFormData({
                      ...formData,
                      config: {
                        ...formData.config,
                        callbackFields: {
                          ...formData.config.callbackFields,
                          [field]: e.target.checked
                        }
                      }
                    })}
                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="ml-2 text-sm text-gray-700 capitalize">
                    {field.replace(/([A-Z])/g, ' $1').toLowerCase()}
                  </span>
                </label>
              ))}
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
              <span>Save Integration</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default IntegrationModal;