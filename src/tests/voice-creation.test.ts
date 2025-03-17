import { describe, test, expect, beforeEach } from 'vitest';
import { useVoiceStore } from '../store/voiceStore';
import { useAuthStore } from '../store/authStore';
import { ElevenLabsService } from '../services/elevenlabs';
import type { VoiceProfile } from '../types';

describe('Voice Creation Tests', () => {
  let mockElevenLabs: ElevenLabsService;

  beforeEach(() => {
    // Reset voice store state
    useVoiceStore.setState({ voices: [] });
    
    // Mock ElevenLabs service
    mockElevenLabs = new ElevenLabsService('mock-api-key');
    vi.spyOn(mockElevenLabs, 'getAvailableVoices').mockResolvedValue([
      { voice_id: 'voice1', name: 'Voice 1' },
      { voice_id: 'voice2', name: 'Voice 2' }
    ]);
  });

  describe('Creating New Voice Agent', () => {
    test('should create voice agent with valid data', async () => {
      const newVoice: Omit<VoiceProfile, 'id'> = {
        name: 'Test Voice',
        source: 'elevenlabs',
        settings: {
          speed: 1.0,
          pitch: 1.0,
          stability: 0.8
        },
        voiceId: 'voice1',
        personality: 'Professional and friendly',
        context: 'Sales representative',
        webhookSecret: 'test-secret'
      };

      useVoiceStore.getState().addVoice({ ...newVoice, id: '1' });
      const voices = useVoiceStore.getState().voices;

      expect(voices).toHaveLength(1);
      expect(voices[0]).toMatchObject(newVoice);
    });

    test('should generate unique ID for each voice', () => {
      const baseVoice: Omit<VoiceProfile, 'id'> = {
        name: 'Test Voice',
        source: 'elevenlabs',
        settings: {
          speed: 1.0,
          pitch: 1.0,
          stability: 0.8
        },
        voiceId: 'voice1'
      };

      useVoiceStore.getState().addVoice({ ...baseVoice, id: '1', name: 'Voice 1' });
      useVoiceStore.getState().addVoice({ ...baseVoice, id: '2', name: 'Voice 2' });

      const voices = useVoiceStore.getState().voices;
      expect(voices[0].id).not.toBe(voices[1].id);
    });
  });

  describe('Voice Settings Validation', () => {
    test('should validate speed settings', () => {
      const invalidSpeeds = [-1, 0, 2.5, 3];
      const validSpeeds = [0.5, 1.0, 1.5, 2.0];

      invalidSpeeds.forEach(speed => {
        expect(() => useVoiceStore.getState().addVoice({
          id: '1',
          name: 'Test Voice',
          source: 'elevenlabs',
          settings: {
            speed,
            pitch: 1.0,
            stability: 0.8
          },
          voiceId: 'voice1'
        })).toThrow('Speed must be between 0.5 and 2.0');
      });

      validSpeeds.forEach(speed => {
        expect(() => useVoiceStore.getState().addVoice({
          id: '1',
          name: 'Test Voice',
          source: 'elevenlabs',
          settings: {
            speed,
            pitch: 1.0,
            stability: 0.8
          },
          voiceId: 'voice1'
        })).not.toThrow();
      });
    });

    test('should validate pitch settings', () => {
      const invalidPitches = [-1, 0, 2.5, 3];
      const validPitches = [0.5, 1.0, 1.5, 2.0];

      invalidPitches.forEach(pitch => {
        expect(() => useVoiceStore.getState().addVoice({
          id: '1',
          name: 'Test Voice',
          source: 'elevenlabs',
          settings: {
            speed: 1.0,
            pitch,
            stability: 0.8
          },
          voiceId: 'voice1'
        })).toThrow('Pitch must be between 0.5 and 2.0');
      });

      validPitches.forEach(pitch => {
        expect(() => useVoiceStore.getState().addVoice({
          id: '1',
          name: 'Test Voice',
          source: 'elevenlabs',
          settings: {
            speed: 1.0,
            pitch,
            stability: 0.8
          },
          voiceId: 'voice1'
        })).not.toThrow();
      });
    });

    test('should validate stability settings', () => {
      const invalidStability = [-1, 1.5, 2];
      const validStability = [0, 0.5, 1];

      invalidStability.forEach(stability => {
        expect(() => useVoiceStore.getState().addVoice({
          id: '1',
          name: 'Test Voice',
          source: 'elevenlabs',
          settings: {
            speed: 1.0,
            pitch: 1.0,
            stability
          },
          voiceId: 'voice1'
        })).toThrow('Stability must be between 0 and 1');
      });

      validStability.forEach(stability => {
        expect(() => useVoiceStore.getState().addVoice({
          id: '1',
          name: 'Test Voice',
          source: 'elevenlabs',
          settings: {
            speed: 1.0,
            pitch: 1.0,
            stability
          },
          voiceId: 'voice1'
        })).not.toThrow();
      });
    });
  });

  describe('Voice Preview Functionality', () => {
    test('should preview voice with current settings', async () => {
      const previewSpy = vi.spyOn(mockElevenLabs, 'previewVoice');
      
      await mockElevenLabs.previewVoice(
        'Test preview text',
        'voice1',
        {
          speed: 1.0,
          pitch: 1.0,
          stability: 0.8
        }
      );

      expect(previewSpy).toHaveBeenCalledWith(
        'Test preview text',
        'voice1',
        {
          speed: 1.0,
          pitch: 1.0,
          stability: 0.8
        }
      );
    });

    test('should handle preview errors', async () => {
      vi.spyOn(mockElevenLabs, 'previewVoice').mockRejectedValue(new Error('Preview failed'));

      await expect(mockElevenLabs.previewVoice(
        'Test preview text',
        'voice1',
        {
          speed: 1.0,
          pitch: 1.0,
          stability: 0.8
        }
      )).rejects.toThrow('Preview failed');
    });
  });

  describe('Voice Model Selection', () => {
    test('should load available voice models', async () => {
      const voices = await mockElevenLabs.getAvailableVoices();
      
      expect(voices).toHaveLength(2);
      expect(voices[0]).toHaveProperty('voice_id');
      expect(voices[0]).toHaveProperty('name');
    });

    test('should handle voice model loading errors', async () => {
      vi.spyOn(mockElevenLabs, 'getAvailableVoices').mockRejectedValue(new Error('Failed to load voices'));

      await expect(mockElevenLabs.getAvailableVoices()).rejects.toThrow('Failed to load voices');
    });
  });

  describe('Voice Agent Limits', () => {
    test('should enforce voice agent limits based on subscription', () => {
      const baseVoice: Omit<VoiceProfile, 'id'> = {
        name: 'Test Voice',
        source: 'elevenlabs',
        settings: {
          speed: 1.0,
          pitch: 1.0,
          stability: 0.8
        },
        voiceId: 'voice1'
      };

      // Set trial subscription
      useAuthStore.setState({
        user: {
          ...useAuthStore.getState().user!,
          subscription: 'trial'
        }
      });

      // Add maximum allowed voices for trial (2)
      useVoiceStore.getState().addVoice({ ...baseVoice, id: '1', name: 'Voice 1' });
      useVoiceStore.getState().addVoice({ ...baseVoice, id: '2', name: 'Voice 2' });

      // Attempt to add one more voice
      expect(() => useVoiceStore.getState().addVoice({
        ...baseVoice,
        id: '3',
        name: 'Voice 3'
      })).toThrow('Voice agent limit reached for trial subscription');
    });

    test('should update limits when subscription changes', () => {
      const baseVoice: Omit<VoiceProfile, 'id'> = {
        name: 'Test Voice',
        source: 'elevenlabs',
        settings: {
          speed: 1.0,
          pitch: 1.0,
          stability: 0.8
        },
        voiceId: 'voice1'
      };

      // Start with trial subscription
      useAuthStore.setState({
        user: {
          ...useAuthStore.getState().user!,
          subscription: 'trial'
        }
      });

      // Add maximum trial voices
      useVoiceStore.getState().addVoice({ ...baseVoice, id: '1', name: 'Voice 1' });
      useVoiceStore.getState().addVoice({ ...baseVoice, id: '2', name: 'Voice 2' });

      // Upgrade to professional
      useAuthStore.setState({
        user: {
          ...useAuthStore.getState().user!,
          subscription: 'pro'
        }
      });

      // Should now be able to add more voices
      for (let i = 3; i <= 10; i++) {
        expect(() => useVoiceStore.getState().addVoice({
          ...baseVoice,
          id: i.toString(),
          name: `Voice ${i}`
        })).not.toThrow();
      }
    });
  });
});