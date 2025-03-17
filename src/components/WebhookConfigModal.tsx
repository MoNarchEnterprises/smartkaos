import React, { useState } from 'react';
import { X, Save, Copy, Check } from 'lucide-react';

interface WebhookConfigModalProps {
  onClose: () => void;
  onSave: (data: {
    endpoints: Array<{
      url: string;
      events: string[];
      secret: string;
      active: boolean;
    }>;
  }) => void;
}

const WebhookConfigModal: React.FC<WebhookConfigModalProps> = ({
  onClose,
  onSave
}) => {
  const [endpoints, setEndpoints] = useState([{
    url: '',
    events: ['call.completed', 'call.scheduled'],
    secret: crypto.randomUUID(),
    active: true
  }]);
  const [copied, setCopied] = useState<string | null>(null);

  const availableEvents = [
    'call.completed',
    'call.scheduled',
    'call.started',
    'call.failed',
    'appointment.created',
    'appointment.updated',
    'appointment.cancelled'
  ];

  const handleAddEndpoint = () => {
    setEndpoints([...endpoints, {
      url: '',
      events: ['call.completed'],
      secret: crypto.randomUUID(),
      active: true
    }]);
  };

  const handleRemoveEndpoint = (index: number) => {
    setEndpoints(endpoints.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ endpoints });
    onClose();
  };

  const handleCopySecret = async (secret: string) => {
    try {
      await navigator.clipboard.writeText(secret);
      setCopied(secret);
      setTimeout(() => setCopied(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-white">
          <h2 className="text-xl font-semibold">Webhook Configuration</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="space-y-6">
            {endpoints.map((endpoint, index) => (
              <div key={index} className="border rounded-lg p-4 space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium">Endpoint {index + 1}</h3>
                  {endpoints.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveEndpoint(index)}
                      className="text-red-600 hover:text-red-700 text-sm"
                    >
                      Remove
                    </button>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Webhook URL</label>
                  <input
                    type="url"
                    value={endpoint.url}
                    onChange={(e) => {
                      const newEndpoints = [...endpoints];
                      newEndpoints[index].url = e.target.value;
                      setEndpoints(newEndpoints);
                    }}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Events</label>
                  <div className="grid grid-cols-2 gap-2">
                    {availableEvents.map((event) => (
                      <label key={event} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={endpoint.events.includes(event)}
                          onChange={(e) => {
                            const newEndpoints = [...endpoints];
                            if (e.target.checked) {
                              newEndpoints[index].events.push(event);
                            } else {
                              newEndpoints[index].events = newEndpoints[index].events
                                .filter(e => e !== event);
                            }
                            setEndpoints(newEndpoints);
                          }}
                          className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <span className="ml-2 text-sm text-gray-700">{event}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Webhook Secret</label>
                  <div className="mt-1 flex rounded-md shadow-sm">
                    <input
                      type="text"
                      value={endpoint.secret}
                      readOnly
                      className="flex-1 rounded-l-md border-gray-300 bg-gray-50 focus:ring-0 focus:border-gray-300"
                    />
                    <button
                      type="button"
                      onClick={() => handleCopySecret(endpoint.secret)}
                      className="relative inline-flex items-center space-x-2 px-4 py-2 border border-l-0 border-gray-300 text-sm font-medium rounded-r-md text-gray-700 bg-gray-50 hover:bg-gray-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      {copied === endpoint.secret ? (
                        <>
                          <Check className="h-4 w-4 text-green-500" />
                          <span>Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-4 w-4" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={endpoint.active}
                      onChange={(e) => {
                        const newEndpoints = [...endpoints];
                        newEndpoints[index].active = e.target.checked;
                        setEndpoints(newEndpoints);
                      }}
                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Endpoint Active</span>
                  </label>
                </div>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={handleAddEndpoint}
            className="text-indigo-600 hover:text-indigo-700 text-sm font-medium"
          >
            + Add Another Endpoint
          </button>

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

export default WebhookConfigModal;