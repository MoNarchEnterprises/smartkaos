import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { VoiceProfile } from '../types';

interface VoiceState {
  voices: VoiceProfile[];
  addVoice: (voice: VoiceProfile) => void;
  updateVoice: (id: string, voice: Omit<VoiceProfile, 'id'>) => void;
  deleteVoice: (id: string) => void;
  setVoices: (voices: VoiceProfile[]) => void;
}

export const useVoiceStore = create<VoiceState>()(
  persist(
    (set) => ({
      voices: [
        {
          id: '1',
          name: 'Sales Agent',
          source: 'elevenlabs',
          settings: {
            speed: 1.0,
            pitch: 1.0,
            stability: 0.8
          },
          voiceId: 'EXAVITQu4vr4xnSDxMaL',
          personality: 'Professional and friendly sales representative',
          context: 'Knowledgeable about our products and services'
        },
        {
          id: '2',
          name: 'Customer Support',
          source: 'elevenlabs',
          settings: {
            speed: 1.1,
            pitch: 0.9,
            stability: 0.7
          },
          voiceId: '21m00Tcm4TlvDq8ikWAM',
          personality: 'Patient and helpful customer support agent',
          context: 'Expert in troubleshooting and customer service'
        }
      ],
      addVoice: (voice) => set((state) => ({
        voices: [...state.voices, voice]
      })),
      updateVoice: (id, voiceData) => set((state) => ({
        voices: state.voices.map(voice =>
          voice.id === id
            ? { ...voice, ...voiceData }  // Changed to properly merge all properties
            : voice
        )
      })),
      deleteVoice: (id) => set((state) => ({
        voices: state.voices.filter(voice => voice.id !== id)
      })),
      setVoices: (voices) => set({ voices })
    }),
    {
      name: 'voice-storage',
      onRehydrateStorage: () => (state) => {
        console.log('Voice state hydrated:', state);
      }
    }
  )
);