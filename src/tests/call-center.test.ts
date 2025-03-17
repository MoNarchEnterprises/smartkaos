import { describe, test, expect, beforeEach } from 'vitest';
import { useVoiceStore } from '../store/voiceStore';
import { useAuthStore } from '../store/authStore';
import { callExecutor } from '../services/callExecutor';
import { supabase } from '../services/supabase';
import type { Call, VoiceProfile } from '../types';

describe('Call Center Tests', () => {
  let mockVoice: VoiceProfile;

  beforeEach(() => {
    // Reset stores and setup mock voice
    mockVoice = {
      id: 'test-voice-1',
      name: 'Test Voice',
      source: 'elevenlabs',
      settings: {
        speed: 1.0,
        pitch: 1.0,
        stability: 0.8
      },
      voiceId: 'voice1'
    };
    useVoiceStore.setState({ voices: [mockVoice] });
  });

  describe('Call Scheduling', () => {
    test('should schedule call with valid data', async () => {
      const callData = {
        phoneNumber: '+1234567890',
        contactName: 'John Doe',
        voiceAgentId: mockVoice.id,
        startTime: new Date(Date.now() + 3600000), // 1 hour from now
        notes: 'Test call'
      };

      const { data: call, error } = await supabase
        ?.from('calls')
        .insert([{
          ...callData,
          status: 'scheduled'
        }])
        .select()
        .single();

      expect(error).toBeNull();
      expect(call).toMatchObject({
        ...callData,
        status: 'scheduled'
      });
    });

    test('should validate date/time', async () => {
      const pastDate = new Date(Date.now() - 3600000); // 1 hour ago
      
      const callData = {
        phoneNumber: '+1234567890',
        contactName: 'John Doe',
        voiceAgentId: mockVoice.id,
        startTime: pastDate,
        notes: 'Test call'
      };

      await expect(supabase
        ?.from('calls')
        .insert([callData])
      ).rejects.toThrow('Call cannot be scheduled in the past');
    });

    test('should validate contact information', async () => {
      const invalidPhoneNumbers = [
        '',
        'not-a-number',
        '123',
        '+1'
      ];

      for (const phoneNumber of invalidPhoneNumbers) {
        const callData = {
          phoneNumber,
          contactName: 'John Doe',
          voiceAgentId: mockVoice.id,
          startTime: new Date(Date.now() + 3600000),
          notes: 'Test call'
        };

        await expect(supabase
          ?.from('calls')
          .insert([callData])
        ).rejects.toThrow('Invalid phone number format');
      }
    });

    test('should validate voice agent selection', async () => {
      const callData = {
        phoneNumber: '+1234567890',
        contactName: 'John Doe',
        voiceAgentId: 'non-existent-voice',
        startTime: new Date(Date.now() + 3600000),
        notes: 'Test call'
      };

      await expect(supabase
        ?.from('calls')
        .insert([callData])
      ).rejects.toThrow('Invalid voice agent ID');
    });
  });

  describe('Active Call Management', () => {
    test('should initiate call successfully', async () => {
      const call: Call = {
        id: 'test-call-1',
        phoneNumber: '+1234567890',
        contactName: 'John Doe',
        voiceAgentId: mockVoice.id,
        status: 'scheduled',
        startTime: new Date(),
      };

      await callExecutor.startCall(call);
      
      const { data: updatedCall } = await supabase
        ?.from('calls')
        .select('*')
        .eq('id', call.id)
        .single();

      expect(updatedCall.status).toBe('in-progress');
    });

    test('should update real-time status', async () => {
      const call: Call = {
        id: 'test-call-2',
        phoneNumber: '+1234567890',
        contactName: 'John Doe',
        voiceAgentId: mockVoice.id,
        status: 'scheduled',
        startTime: new Date(),
      };

      const statusUpdates: string[] = [];
      const subscription = supabase
        ?.channel('calls')
        .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'calls' },
          (payload) => {
            if (payload.new.id === call.id) {
              statusUpdates.push(payload.new.status);
            }
          }
        )
        .subscribe();

      await callExecutor.startCall(call);
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(statusUpdates).toContain('in-progress');
      subscription?.unsubscribe();
    });

    test('should handle call termination', async () => {
      const call: Call = {
        id: 'test-call-3',
        phoneNumber: '+1234567890',
        contactName: 'John Doe',
        voiceAgentId: mockVoice.id,
        status: 'in-progress',
        startTime: new Date(),
      };

      await callExecutor.stopCall(call.id);
      
      const { data: updatedCall } = await supabase
        ?.from('calls')
        .select('*')
        .eq('id', call.id)
        .single();

      expect(updatedCall.status).toBe('completed');
      expect(updatedCall.endTime).toBeTruthy();
      expect(updatedCall.duration).toBeGreaterThan(0);
    });
  });

  describe('Call History', () => {
    test('should create call record', async () => {
      const call: Omit<Call, 'id'> = {
        phoneNumber: '+1234567890',
        contactName: 'John Doe',
        voiceAgentId: mockVoice.id,
        status: 'completed',
        startTime: new Date(Date.now() - 3600000),
        endTime: new Date(),
        duration: 3600,
        notes: 'Test call'
      };

      const { data: newCall, error } = await supabase
        ?.from('calls')
        .insert([call])
        .select()
        .single();

      expect(error).toBeNull();
      expect(newCall).toMatchObject(call);
    });

    test('should update call status', async () => {
      const { data: call } = await supabase
        ?.from('calls')
        .insert([{
          phoneNumber: '+1234567890',
          contactName: 'John Doe',
          voiceAgentId: mockVoice.id,
          status: 'scheduled',
          startTime: new Date()
        }])
        .select()
        .single();

      const { error } = await supabase
        ?.from('calls')
        .update({ status: 'completed' })
        .eq('id', call.id);

      expect(error).toBeNull();
      
      const { data: updatedCall } = await supabase
        ?.from('calls')
        .select('*')
        .eq('id', call.id)
        .single();

      expect(updatedCall.status).toBe('completed');
    });

    test('should store transcription', async () => {
      const { data: call } = await supabase
        ?.from('calls')
        .insert([{
          phoneNumber: '+1234567890',
          contactName: 'John Doe',
          voiceAgentId: mockVoice.id,
          status: 'completed',
          startTime: new Date(Date.now() - 3600000),
          endTime: new Date(),
          duration: 3600
        }])
        .select()
        .single();

      const transcription = 'This is a test transcription';
      const { error } = await supabase
        ?.from('calls')
        .update({ transcription })
        .eq('id', call.id);

      expect(error).toBeNull();
      
      const { data: updatedCall } = await supabase
        ?.from('calls')
        .select('*')
        .eq('id', call.id)
        .single();

      expect(updatedCall.transcription).toBe(transcription);
    });
  });

  describe('Call Analytics', () => {
    test('should track call duration', async () => {
      const startTime = new Date(Date.now() - 3600000);
      const endTime = new Date();
      const duration = Math.floor((endTime.getTime() - startTime.getTime()) / 1000);

      const { data: call } = await supabase
        ?.from('calls')
        .insert([{
          phoneNumber: '+1234567890',
          contactName: 'John Doe',
          voiceAgentId: mockVoice.id,
          status: 'completed',
          startTime,
          endTime,
          duration
        }])
        .select()
        .single();

      expect(call.duration).toBe(duration);
    });

    test('should calculate success rate', async () => {
      // Insert test calls
      await supabase?.from('calls').insert([
        {
          phoneNumber: '+1234567890',
          voiceAgentId: mockVoice.id,
          status: 'completed',
          startTime: new Date()
        },
        {
          phoneNumber: '+1234567891',
          voiceAgentId: mockVoice.id,
          status: 'completed',
          startTime: new Date()
        },
        {
          phoneNumber: '+1234567892',
          voiceAgentId: mockVoice.id,
          status: 'missed',
          startTime: new Date()
        }
      ]);

      const { data: calls } = await supabase
        ?.from('calls')
        .select('status');

      const totalCalls = calls?.length || 0;
      const completedCalls = calls?.filter(c => c.status === 'completed').length || 0;
      const successRate = (completedCalls / totalCalls) * 100;

      expect(successRate).toBe(66.67); // 2 out of 3 calls successful
    });

    test('should track call status changes', async () => {
      const { data: call } = await supabase
        ?.from('calls')
        .insert([{
          phoneNumber: '+1234567890',
          voiceAgentId: mockVoice.id,
          status: 'scheduled',
          startTime: new Date()
        }])
        .select()
        .single();

      const statusChanges = ['in-progress', 'completed'];
      const statusTimestamps: Date[] = [];

      for (const status of statusChanges) {
        await supabase
          ?.from('calls')
          .update({ 
            status,
            updated_at: new Date()
          })
          .eq('id', call.id);

        statusTimestamps.push(new Date());
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      const { data: updatedCall } = await supabase
        ?.from('calls')
        .select('*')
        .eq('id', call.id)
        .single();

      expect(updatedCall.status).toBe('completed');
      expect(new Date(updatedCall.updated_at)).toBeGreaterThan(statusTimestamps[0]);
    });
  });

  describe('Call Credit System', () => {
    test('should deduct credits for completed calls', async () => {
      const user = useAuthStore.getState().user!;
      const initialCredits = user.trial_calls_remaining;

      await supabase?.from('calls').insert([{
        phoneNumber: '+1234567890',
        voiceAgentId: mockVoice.id,
        status: 'completed',
        startTime: new Date()
      }]);

      const { data: profile } = await supabase
        ?.from('profiles')
        .select('trial_calls_remaining')
        .eq('id', user.id)
        .single();

      expect(profile.trial_calls_remaining).toBe(initialCredits - 1);
    });

    test('should handle rollover credits', async () => {
      const user = useAuthStore.getState().user!;
      
      // Set pro subscription with unused calls
      await supabase?.from('profiles').update({
        subscription: 'pro',
        calls_remaining: 50,
        current_period_end: new Date(Date.now() - 86400000) // Yesterday
      }).eq('id', user.id);

      // Trigger period rollover
      await supabase?.from('profiles').update({
        current_period_start: new Date(),
        current_period_end: new Date(Date.now() + 30 * 86400000)
      }).eq('id', user.id);

      const { data: profile } = await supabase
        ?.from('profiles')
        .select('calls_remaining, rollover_calls')
        .eq('id', user.id)
        .single();

      expect(profile.rollover_calls).toBe(50); // Previous unused calls
      expect(profile.calls_remaining).toBe(1000); // New period allocation
    });

    test('should enforce call limits', async () => {
      const user = useAuthStore.getState().user!;
      
      // Set trial subscription with no remaining calls
      await supabase?.from('profiles').update({
        subscription: 'trial',
        trial_calls_remaining: 0
      }).eq('id', user.id);

      await expect(supabase?.from('calls').insert([{
        phoneNumber: '+1234567890',
        voiceAgentId: mockVoice.id,
        status: 'scheduled',
        startTime: new Date()
      }])).rejects.toThrow('No remaining call credits');
    });
  });
});