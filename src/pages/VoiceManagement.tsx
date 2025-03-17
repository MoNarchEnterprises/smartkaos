import React, { useState, useEffect } from 'react';
import { Mic2, Plus, Play, Trash2, Settings2, MessageCircle } from 'lucide-react';
import { VoiceProfile } from '../types';
import VoiceSettingsModal from '../components/VoiceSettingsModal';
import ChatInterface from '../components/ChatInterface';
import { ElevenLabsService } from '../services/elevenlabs';
import { ELEVENLABS_CONFIG } from '../config/elevenlabs';
import { useVoiceStore } from '../store/voiceStore';
import { useAuthStore } from '../store/authStore';
import { syncVoices, fetchVoices } from '../services/supabase';

const elevenlabs = new ElevenLabsService(ELEVENLABS_CONFIG.API_KEY);

const VoiceManagement: React.FC = () => {
  const { user } = useAuthStore();
  const { voices, addVoice, updateVoice, deleteVoice, setVoices } = useVoiceStore();
  const [selectedVoice, setSelectedVoice] = useState<VoiceProfile | null>(null);
  const [chatVoice, setChatVoice] = useState<VoiceProfile | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [previewText, setPreviewText] = useState('Hello, this is a test of the voice profile.');
  const [isPreviewPlaying, setIsPreviewPlaying] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load voices from backend when component mounts
  useEffect(() => {
    const loadVoices = async () => {
      if (!user) return;
      
      try {
        const serverVoices = await fetchVoices(user.id);
        if (serverVoices.length > 0) {
          setVoices(serverVoices);
        }
      } catch (error) {
        console.error('Failed to load voices:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadVoices();
  }, [user, setVoices]);

  // Sync voices to backend whenever they change
  useEffect(() => {
    const syncToServer = async () => {
      if (!user) return;
      
      try {
        await syncVoices(user.id, voices);
      } catch (error) {
        console.error('Failed to sync voices:', error);
      }
    };

    if (!isLoading) {
      syncToServer();
    }
  }, [voices, user, isLoading]);

  const handlePreview = async (voice: VoiceProfile) => {
    if (isPreviewPlaying === voice.id || !voice.voiceId) return;
    
    setIsPreviewPlaying(voice.id);
    try {
      await elevenlabs.previewVoice(previewText, voice.voiceId, voice.settings);
    } catch (error) {
      console.error('Failed to preview voice:', error);
    } finally {
      setIsPreviewPlaying(null);
    }
  };

  const handleDelete = (voiceId: string) => {
    deleteVoice(voiceId);
  };

  const handleSaveVoice = (voiceData: Omit<VoiceProfile, 'id'>) => {
    if (selectedVoice) {
      updateVoice(selectedVoice.id, voiceData);
    } else {
      const newVoice: VoiceProfile = {
        ...voiceData,
        id: Math.random().toString(36).substr(2, 9)
      };
      addVoice(newVoice);
    }
    setSelectedVoice(null);
  };

  const handleCloseModal = () => {
    setIsSettingsOpen(false);
    setSelectedVoice(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading voices...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Agent Management</h1>
        <button
          onClick={() => setIsSettingsOpen(true)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>New Agent</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {voices.map((voice) => (
          <div
            key={voice.id}
            className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:border-indigo-100 transition-colors"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                  <Mic2 className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{voice.name}</h3>
                  <p className="text-sm text-gray-500 capitalize">{voice.source} Voice</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setChatVoice(voice)}
                  className="p-2 text-gray-400 hover:text-indigo-600 transition-colors"
                  title="Chat with agent"
                >
                  <MessageCircle className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    setSelectedVoice(voice);
                    setIsSettingsOpen(true);
                  }}
                  className="p-2 text-gray-400 hover:text-indigo-600 transition-colors"
                >
                  <Settings2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(voice.id)}
                  className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Speed</span>
                <span className="text-gray-900">{voice.settings.speed}x</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Pitch</span>
                <span className="text-gray-900">{voice.settings.pitch}x</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Stability</span>
                <span className="text-gray-900">{voice.settings.stability}</span>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={previewText}
                  onChange={(e) => setPreviewText(e.target.value)}
                  className="flex-1 text-sm border-gray-200 rounded-md"
                  placeholder="Enter text to preview..."
                />
                <button
                  onClick={() => handlePreview(voice)}
                  disabled={isPreviewPlaying === voice.id || !voice.voiceId}
                  className={`p-2 ${
                    isPreviewPlaying === voice.id || !voice.voiceId
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100'
                  } rounded-md`}
                >
                  <Play className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {isSettingsOpen && (
        <VoiceSettingsModal
          voice={selectedVoice || undefined}
          isOpen={isSettingsOpen}
          onClose={handleCloseModal}
          onSave={handleSaveVoice}
        />
      )}

      {chatVoice && (
        <ChatInterface
          voice={chatVoice}
          onClose={() => setChatVoice(null)}
        />
      )}
    </div>
  );
};

export default VoiceManagement;