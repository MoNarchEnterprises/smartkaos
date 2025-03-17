import { create } from 'zustand';
import type { User } from '../types';
import { supabase, initializeDemoProfile } from '../services/supabase';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  login: (credentials: { email: string; password: string }) => Promise<void>;
  register: (data: { email: string; password: string; businessName: string }) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
  updatePassword: (oldPassword: string, newPassword: string) => Promise<void>;
  setDemoUser: (type: 'admin' | 'customer') => void;
}

// Create demo users with UUID format
const DEMO_ADMIN: User = {
  id: '123e4567-e89b-12d3-a456-426614174000',
  email: 'demo@example.com',
  businessName: 'Demo Admin',
  subscription: 'enterprise',
  language: 'en',
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  min_schedule_time: 15,
  notifications: {
    callSummaries: true,
    weeklyReports: true,
    systemAlerts: true
  }
};

const DEMO_CUSTOMER: User = {
  id: '123e4567-e89b-12d3-a456-426614174001',
  email: 'customer@example.com',
  businessName: 'Demo Customer',
  subscription: 'trial',
  language: 'en',
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  min_schedule_time: 15,
  notifications: {
    callSummaries: true,
    weeklyReports: true,
    systemAlerts: true
  }
};

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  
  login: async (credentials) => {
    try {
      // For demo, use hardcoded users
      const demoUser = credentials.email === 'demo@example.com' ? DEMO_ADMIN : DEMO_CUSTOMER;
      
      set({
        user: demoUser,
        isAuthenticated: true
      });

      // Initialize demo profile in background
      await initializeDemoProfile(demoUser).catch(error => {
        // Log but don't throw - allow login to succeed even if profile sync fails
        console.warn('Error initializing demo profile:', error);
      });
    } catch (error) {
      console.error('Login error:', error);
      throw new Error('Invalid email or password');
    }
  },
  
  register: async (data) => {
    try {
      // For demo, always create customer account
      const demoUser = {
        ...DEMO_CUSTOMER,
        businessName: data.businessName
      };

      set({
        user: demoUser,
        isAuthenticated: true
      });

      // Initialize demo profile in background
      await initializeDemoProfile(demoUser).catch(error => {
        // Log but don't throw - allow registration to succeed even if profile sync fails
        console.warn('Error initializing demo profile:', error);
      });
    } catch (error) {
      console.error('Registration error:', error);
      throw new Error('Registration failed');
    }
  },
  
  logout: async () => {
    try {
      // Clear Supabase session if it exists
      if (supabase?.auth) {
        await supabase.auth.signOut();
      }
      
      // Reset to initial state
      set({
        user: null,
        isAuthenticated: false
      });
    } catch (error) {
      console.error('Logout error:', error);
      // Still clear local state even if Supabase logout fails
      set({
        user: null,
        isAuthenticated: false
      });
    }
  },

  setDemoUser: (type: 'admin' | 'customer') => {
    const user = type === 'admin' ? DEMO_ADMIN : DEMO_CUSTOMER;
    set({
      user,
      isAuthenticated: true
    });
    
    // Initialize demo profile in background
    initializeDemoProfile(user).catch(error => {
      console.warn('Error initializing demo profile:', error);
    });
  },

  updateProfile: async (data) => {
    if (!supabase) {
      // For demo, just update the local state
      const currentUser = get().user;
      if (currentUser) {
        const updatedUser = {
          ...currentUser,
          ...data
        };
        set({ user: updatedUser });
        
        // Update profile in background
        await initializeDemoProfile(updatedUser).catch(error => {
          console.warn('Error updating demo profile:', error);
        });
      }
      return;
    }

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          ...data,
          updated_at: new Date().toISOString()
        })
        .eq('id', get().user?.id);

      if (error) throw error;

      const currentUser = get().user;
      if (currentUser) {
        set({
          user: {
            ...currentUser,
            ...data
          }
        });
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  },

  updatePassword: async (oldPassword: string, newPassword: string) => {
    if (!supabase) {
      // For demo, just simulate success
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;
    } catch (error) {
      console.error('Error updating password:', error);
      throw error;
    }
  }
}));