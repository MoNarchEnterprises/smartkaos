import { ElevenLabsService } from './elevenlabs';
import { GeminiService } from './gemini';
import { supabase } from './supabase';
import type { Call } from '../types';
import { useVoiceStore } from '../store/voiceStore';
import { ELEVENLABS_CONFIG } from '../config/elevenlabs';
import { GEMINI_CONFIG } from '../config/gemini';

class CallExecutor {
  private static instance: CallExecutor;
  private elevenlabs: ElevenLabsService;
  private gemini: GeminiService;
  private activeCallStreams: Map<string, AbortController>;

  private constructor() {
    this.elevenlabs = new ElevenLabsService(ELEVENLABS_CONFIG.API_KEY);
    this.gemini = new GeminiService(GEMINI_CONFIG.API_KEY);
    this.activeCallStreams = new Map();
  }

  public static getInstance(): CallExecutor {
    if (!CallExecutor.instance) {
      CallExecutor.instance = new CallExecutor();
    }
    return CallExecutor.instance;
  }

  private async updateCallStatus(call: Call, status: Call['status'], additionalData: Partial<Call> = {}) {
    if (!supabase) return;

    try {
      const { error } = await supabase
        .from('calls')
        .update({
          status,
          updated_at: new Date().toISOString(),
          ...additionalData
        })
        .eq('id', call.id);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating call status:', error);
      throw error;
    }
  }

  public async startCall(call: Call): Promise<void> {
    if (!supabase) return;

    try {
      // Update call status to in-progress
      await this.updateCallStatus(call, 'in-progress');

      // Get voice profile
      const { voices } = useVoiceStore.getState();
      const voice = voices.find(v => v.id === call.voice_agent_id);
      if (!voice || !voice.voiceId) {
        throw new Error('Voice profile not found or invalid');
      }

      // Create abort controller for this call
      const abortController = new AbortController();
      this.activeCallStreams.set(call.id, abortController);

      // Initial greeting
      const greeting = await this.gemini.generateResponse(
        'Introduce yourself and ask how you can help',
        voice,
        call.contact_name
      );

      // Convert greeting to speech and play
      await this.elevenlabs.previewVoice(
        greeting,
        voice.voiceId,
        voice.settings
      );

      // Record call duration and update status
      const duration = Math.floor((Date.now() - new Date(call.start_time).getTime()) / 1000);
      await this.updateCallStatus(call, 'completed', {
        duration,
        end_time: new Date().toISOString(),
        notes: `${call.notes || ''}\n\nCall completed successfully. Duration: ${duration} seconds`,
        transcription: greeting // Store initial greeting as transcription
      });

    } catch (error) {
      console.error('Error executing call:', error);
      
      // Update call status to missed/failed
      await this.updateCallStatus(call, 'missed', {
        notes: `${call.notes || ''}\n\nCall failed: ${error.message}`
      });

      throw error;
    } finally {
      this.activeCallStreams.delete(call.id);
    }
  }

  public stopCall(callId: string): void {
    const controller = this.activeCallStreams.get(callId);
    if (controller) {
      controller.abort();
      this.activeCallStreams.delete(callId);
    }
  }

  public isCallActive(callId: string): boolean {
    return this.activeCallStreams.has(callId);
  }
}

export const callExecutor = CallExecutor.getInstance();