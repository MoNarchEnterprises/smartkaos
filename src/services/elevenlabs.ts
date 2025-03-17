import { VoiceProfile, ElevenLabsVoice } from '../types';

const ELEVENLABS_API_URL = 'https://api.elevenlabs.io/v1';

export class ElevenLabsService {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  private async fetchWithAuth(endpoint: string, options: RequestInit = {}) {
    if (!this.apiKey) {
      throw new Error('ElevenLabs API key not configured');
    }

    try {
      const response = await fetch(`${ELEVENLABS_API_URL}${endpoint}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          'xi-api-key': this.apiKey,
          ...options.headers,
        },
      });

      if (!response.ok) {
        throw new Error(`ElevenLabs API error: ${response.status} ${response.statusText}`);
      }

      return response;
    } catch (error) {
      console.error('ElevenLabs API error:', error);
      throw error;
    }
  }

  async previewVoice(text: string, voiceId: string, settings: VoiceProfile['settings']) {
    if (!this.apiKey) {
      console.error('ElevenLabs API key not configured');
      return;
    }

    try {
      const response = await this.fetchWithAuth(`/text-to-speech/${voiceId}/stream`, {
        method: 'POST',
        body: JSON.stringify({
          text,
          voice_settings: {
            stability: settings.stability,
            similarity_boost: 0.75,
            style: 0.0,
            use_speaker_boost: true,
            speed: settings.speed,
          },
          model_id: 'eleven_monolingual_v1',
        }),
      });

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      
      await audio.play();
      
      // Clean up the URL after playback
      audio.onended = () => URL.revokeObjectURL(audioUrl);
    } catch (error) {
      console.error('Error previewing voice:', error);
      throw error;
    }
  }

  async getAvailableVoices(): Promise<ElevenLabsVoice[]> {
    if (!this.apiKey) {
      console.error('ElevenLabs API key not configured');
      return [];
    }

    try {
      const response = await this.fetchWithAuth('/voices');
      const data = await response.json();
      
      if (!data.voices || !Array.isArray(data.voices)) {
        throw new Error('Invalid response format from ElevenLabs API');
      }
      
      return data.voices;
    } catch (error) {
      console.error('Failed to load voices:', error);
      return [];
    }
  }

  async getDefaultVoiceSettings() {
    if (!this.apiKey) {
      console.error('ElevenLabs API key not configured');
      return null;
    }

    try {
      const response = await this.fetchWithAuth('/voices/settings/default');
      return response.json();
    } catch (error) {
      console.error('Error getting default voice settings:', error);
      return null;
    }
  }
}