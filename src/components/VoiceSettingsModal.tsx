import React, { useState, useEffect } from 'react';
import { X, Play, Link } from 'lucide-react';
import type { VoiceProfile, ElevenLabsVoice } from '../types';
import { ElevenLabsService } from '../services/elevenlabs';
import { webhookService } from '../services/webhook';
import { ELEVENLABS_CONFIG } from '../config/elevenlabs';

interface VoiceSettingsModalProps {
  voice?: VoiceProfile;
  isOpen: boolean;
  onClose: () => void;
  onSave: (voice: Omit<VoiceProfile, 'id'>) => void;
}

const elevenlabs = new ElevenLabsService(ELEVENLABS_CONFIG.API_KEY);

const VoiceSettingsModal: React.FC<VoiceSettingsModalProps> = ({
  voice,
  isOpen,
  onClose,
  onSave,
}) => {
  const [formData, setFormData] = useState<Omit<VoiceProfile, 'id'>>({
    name: '',
    source: 'elevenlabs',
    settings: {
      speed: 1.0,
      pitch: 1.0,
      stability: 0.8,
    },
    voiceId: '',
    personality: '',
    context: '',
    webhookSecret: '',
  });
  const [previewText, setPreviewText] = useState('Hello, this is a test of the voice settings.');
  const [isPreviewPlaying, setIsPreviewPlaying] = useState(false);
  const [availableVoices, setAvailableVoices] = useState<ElevenLabsVoice[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  useEffect(() => {
    if (voice) {
      setFormData({
        name: voice.name,
        source: voice.source,
        settings: { ...voice.settings },
        voiceId: voice.voiceId || '',
        personality: voice.personality || '',
        context: voice.context || '',
        webhookSecret: voice.webhookSecret || '',
      });
    } else {
      setFormData({
        name: '',
        source: 'elevenlabs',
        settings: {
          speed: 1.0,
          pitch: 1.0,
          stability: 0.8,
        },
        voiceId: '',
        personality: '',
        context: '',
        webhookSecret: '',
      });
    }
  }, [voice]);

  useEffect(() => {
    if (!voice && !formData.webhookSecret) {
      setFormData(prev => ({
        ...prev,
        webhookSecret: webhookService.generateWebhookSecret()
      }));
    }
  }, [voice]);

  useEffect(() => {
    if (copySuccess) {
      const timer = setTimeout(() => setCopySuccess(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [copySuccess]);

  useEffect(() => {
    const loadVoices = async () => {
      if (!isOpen) return;
      
      setIsLoading(true);
      try {
        const voices = await elevenlabs.getAvailableVoices();
        setAvailableVoices(voices);
        
        if (!voice && !formData.voiceId && voices.length > 0) {
          setFormData(prev => ({
            ...prev,
            voiceId: voices[0].voice_id
          }));
        }
      } catch (error) {
        console.error('Failed to load voices:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadVoices();
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  const handlePreview = async () => {
    if (isPreviewPlaying || !formData.voiceId) return;
    
    setIsPreviewPlaying(true);
    try {
      await elevenlabs.previewVoice(previewText, formData.voiceId, formData.settings);
    } catch (error) {
      console.error('Failed to preview voice:', error);
    } finally {
      setIsPreviewPlaying(false);
    }
  };

  const handleCopyWebhook = async () => {
    const webhookInfo = {
      endpoint: `${window.location.origin}/api/webhook/schedule-call`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Signature': '{{Signature generated using secret: ' + (voice?.webhookSecret || formData.webhookSecret) + '}}',
      },
      body: {
        contactName: '{{contact.name}}',
        phoneNumber: '{{contact.phone}}',
        propertyAddress: '{{contact.address}}',
        callbackUrl: '{{workflow.callback_url}}',
        voiceAgentId: voice?.id || 'default',
        metadata: {
          leadId: '{{contact.id}}',
          source: '{{lead.source}}',
        },
      },
      documentation: {
        signatureGeneration: `
// Generate signature in your CRM's workflow
const secret = '${voice?.webhookSecret || formData.webhookSecret}';
const payload = JSON.stringify(requestBody);
const signature = crypto
  .createHmac('sha256', secret)
  .update(payload)
  .digest('hex');
`
      }
    };

    try {
      await navigator.clipboard.writeText(JSON.stringify(webhookInfo, null, 2));
      setCopySuccess(true);
    } catch (err) {
      console.error('Failed to copy webhook info:', err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {voice ? 'Edit Agent' : 'Create New Agent'}
          </h2>
          <div className="flex items-center space-x-2">
            {voice && (
              <button
                onClick={handleCopyWebhook}
                className={`flex items-center space-x-1 px-3 py-1 rounded-md text-sm ${
                  copySuccess
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Link className="w-4 h-4" />
                <span>{copySuccess ? 'Copied!' : 'Copy Webhook'}</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          <form onSubmit={handleSubmit} className="p-4 space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Agent Name
              </label>
              <input
                type="text"
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                required
              />
            </div>

            <div>
              <label htmlFor="source" className="block text-sm font-medium text-gray-700 mb-1">
                Voice Source
              </label>
              <select
                id="source"
                value={formData.source}
                onChange={(e) => setFormData({ ...formData, source: e.target.value as 'elevenlabs' | 'custom' })}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              >
                <option value="elevenlabs">ElevenLabs</option>
                <option value="custom">Custom</option>
              </select>
            </div>

            {formData.source === 'elevenlabs' && (
              <div>
                <label htmlFor="voiceId" className="block text-sm font-medium text-gray-700 mb-1">
                  Voice Model
                </label>
                <select
                  id="voiceId"
                  value={formData.voiceId}
                  onChange={(e) => setFormData({ ...formData, voiceId: e.target.value })}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  disabled={isLoading}
                >
                  <option value="">Select a voice model</option>
                  {isLoading ? (
                    <option disabled>Loading voices...</option>
                  ) : (
                    availableVoices.map((voice) => (
                      <option key={voice.voice_id} value={voice.voice_id}>
                        {voice.name}
                      </option>
                    ))
                  )}
                </select>
              </div>
            )}

            <div>
              <label htmlFor="personality" className="block text-sm font-medium text-gray-700 mb-1">
                Personality Description
              </label>
              <textarea
                id="personality"
                value={formData.personality}
                onChange={(e) => setFormData({ ...formData, personality: e.target.value })}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                rows={2}
                placeholder="Describe the personality of this voice agent (e.g., friendly and professional sales representative)"
              />
            </div>

            <div>
              <label htmlFor="context" className="block text-sm font-medium text-gray-700 mb-1">
                Context & Knowledge
              </label>
              <textarea
                id="context"
                value={formData.context}
                onChange={(e) => setFormData({ ...formData, context: e.target.value })}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                rows={2}
                placeholder="Provide context and knowledge for the agent (e.g., product details, company information)"
              />
            </div>

            <div>
              <label htmlFor="speed" className="block text-sm font-medium text-gray-700 mb-1">
                Speed ({formData.settings.speed}x)
              </label>
              <input
                type="range"
                id="speed"
                min="0.5"
                max="2.0"
                step="0.1"
                value={formData.settings.speed}
                onChange={(e) => setFormData({
                  ...formData,
                  settings: {
                    ...formData.settings,
                    speed: parseFloat(e.target.value),
                  },
                })}
                className="w-full"
              />
            </div>

            <div>
              <label htmlFor="pitch" className="block text-sm font-medium text-gray-700 mb-1">
                Pitch ({formData.settings.pitch}x)
              </label>
              <input
                type="range"
                id="pitch"
                min="0.5"
                max="2.0"
                step="0.1"
                value={formData.settings.pitch}
                onChange={(e) => setFormData({
                  ...formData,
                  settings: {
                    ...formData.settings,
                    pitch: parseFloat(e.target.value),
                  },
                })}
                className="w-full"
              />
            </div>

            <div>
              <label htmlFor="stability" className="block text-sm font-medium text-gray-700 mb-1">
                Stability ({formData.settings.stability})
              </label>
              <input
                type="range"
                id="stability"
                min="0"
                max="1"
                step="0.1"
                value={formData.settings.stability}
                onChange={(e) => setFormData({
                  ...formData,
                  settings: {
                    ...formData.settings,
                    stability: parseFloat(e.target.value),
                  },
                })}
                className="w-full"
              />
            </div>

            <div className="pt-4 border-t border-gray-200">
              <label htmlFor="previewText" className="block text-sm font-medium text-gray-700 mb-2">
                Preview Voice
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  id="previewText"
                  value={previewText}
                  onChange={(e) => setPreviewText(e.target.value)}
                  className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  placeholder="Enter text to preview..."
                />
                <button
                  type="button"
                  onClick={handlePreview}
                  disabled={isPreviewPlaying || !formData.voiceId}
                  className={`p-2 ${
                    isPreviewPlaying || !formData.voiceId
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                      : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100'
                  } rounded-md flex items-center justify-center`}
                >
                  <Play className="w-4 h-4" />
                </button>
              </div>
            </div>
          </form>
        </div>

        <div className="border-t border-gray-200 p-4 bg-gray-50 rounded-b-lg">
          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 hover:text-gray-900 font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium"
            >
              Save Agent
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VoiceSettingsModal;