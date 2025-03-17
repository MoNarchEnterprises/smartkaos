import type { Request, Response } from 'express';
import { webhookService } from '../services/webhook';

export async function handleScheduleCall(req: Request, res: Response) {
  try {
    const signature = req.headers['x-webhook-signature'] as string;
    if (!signature) {
      return res.status(401).json({
        success: false,
        error: 'Missing webhook signature',
        message: 'Unauthorized request'
      });
    }

    const voiceId = req.params.voiceId;
    if (!voiceId) {
      return res.status(400).json({
        success: false,
        error: 'Missing voice agent ID',
        message: 'Voice agent ID is required'
      });
    }

    const response = await webhookService.handleWebhook(
      signature,
      req.body,
      voiceId
    );

    if (!response.success) {
      return res.status(400).json(response);
    }

    return res.status(200).json(response);
  } catch (error) {
    console.error('Error handling webhook:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to process webhook'
    });
  }
}