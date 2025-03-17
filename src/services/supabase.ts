import { createClient } from '@supabase/supabase-js';
import type { VoiceProfile, User } from '../types';

// Get environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Create client only if properly configured
export const supabase = supabaseUrl && supabaseKey 
  ? createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        flowType: 'implicit'
      },
      db: {
        schema: 'public'
      },
      global: {
        headers: {
          'x-application-name': 'smartkaos-ai'
        }
      },
      realtime: {
        params: {
          eventsPerSecond: 10
        }
      }
    })
  : null;

// Log configuration status
if (!supabase) {
  console.warn('Supabase is not configured. Using demo mode.');
}

// Initialize demo user profile in Supabase
export const initializeDemoProfile = async (user: User) => {
  if (!supabase) {
    console.warn('Supabase is not configured. Demo profile initialization skipped.');
    return;
  }

  try {
    const { error } = await supabase
      .from('profiles')
      .upsert({
        id: user.id,
        email: user.email,
        business_name: user.businessName,
        subscription: user.subscription,
        last_active_at: new Date().toISOString()
      }, {
        onConflict: 'id'
      });

    if (error) {
      console.warn('Error initializing demo profile:', error);
    }
  } catch (error) {
    console.warn('Error initializing demo profile:', error);
  }
};

export const syncVoices = async (userId: string, voices: VoiceProfile[]) => {
  if (!supabase) {
    console.warn('Supabase is not configured. Voice syncing is disabled.');
    return;
  }

  try {
    const { error } = await supabase
      .from('user_voices')
      .upsert({
        user_id: userId,
        voices: voices,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      });

    if (error) {
      console.warn('Error syncing voices:', error);
    }
  } catch (error) {
    console.warn('Error syncing voices:', error);
  }
};

export const fetchVoices = async (userId: string): Promise<VoiceProfile[]> => {
  if (!supabase) {
    console.warn('Supabase is not configured. Using local storage only.');
    return [];
  }

  try {
    const { data, error } = await supabase
      .from('user_voices')
      .select('voices')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      console.warn('Error fetching voices:', error);
      return [];
    }
    
    return data?.voices || [];
  } catch (error) {
    console.warn('Error fetching voices:', error);
    return [];
  }
};