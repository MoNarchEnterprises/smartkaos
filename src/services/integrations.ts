import { CRMIntegration, Call, CallAnalysis } from '../types';
import { supabase } from './supabase';

export class IntegrationsService {
  private static instance: IntegrationsService;

  private constructor() {}

  public static getInstance(): IntegrationsService {
    if (!IntegrationsService.instance) {
      IntegrationsService.instance = new IntegrationsService();
    }
    return IntegrationsService.instance;
  }

  public async saveIntegration(userId: string, data: Omit<CRMIntegration, 'id' | 'createdAt' | 'updatedAt'>): Promise<void> {
    if (!supabase) return;

    try {
      const { error } = await supabase
        .from('integrations')
        .insert([{
          user_id: userId,
          ...data,
          created_at: new Date(),
          updated_at: new Date()
        }]);

      if (error) throw error;
    } catch (error) {
      console.error('Error saving integration:', error);
      throw error;
    }
  }

  public async analyzeCall(transcript: string): Promise<CallAnalysis> {
    // Mock analysis for demo
    return {
      sentiment: 'positive',
      summary: 'Call was successful and the customer showed interest.',
      appointments: [{
        date: new Date().toISOString(),
        type: 'Follow-up',
        notes: 'Customer requested additional information'
      }],
      keyPoints: [
        'Customer expressed interest in the product',
        'Requested pricing information',
        'Mentioned budget constraints'
      ],
      nextSteps: [
        'Send follow-up email with pricing',
        'Schedule product demo',
        'Prepare customized proposal'
      ]
    };
  }

  public async sendCallbackData(call: Call, analysis: CallAnalysis): Promise<void> {
    if (!call.callbackUrl) return;

    try {
      const response = await fetch(call.callbackUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          callId: call.id,
          status: call.status,
          duration: call.duration,
          transcription: call.transcription,
          analysis,
          metadata: call.metadata
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to send callback: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error sending callback:', error);
      throw error;
    }
  }
}