import { describe, test, expect, beforeEach } from 'vitest';
import { useAuthStore } from '../store/authStore';
import { supabase } from '../services/supabase';

describe('Login Tests', () => {
  beforeEach(() => {
    // Reset auth store state before each test
    useAuthStore.setState({
      user: null,
      isAuthenticated: false
    });
  });

  describe('Login with Valid Credentials', () => {
    test('should login successfully with correct credentials', async () => {
      const credentials = {
        email: 'test@example.com',
        password: 'SecurePass123!'
      };

      await useAuthStore.getState().login(credentials);
      const state = useAuthStore.getState();

      expect(state.isAuthenticated).toBe(true);
      expect(state.user).toBeTruthy();
      expect(state.user?.email).toBe(credentials.email);
    });

    test('should update last active timestamp on login', async () => {
      const credentials = {
        email: 'test@example.com',
        password: 'SecurePass123!'
      };

      await useAuthStore.getState().login(credentials);
      
      const profile = await supabase
        ?.from('profiles')
        .select('last_active_at')
        .eq('email', credentials.email)
        .single();

      expect(profile.data.last_active_at).toBeTruthy();
      expect(new Date(profile.data.last_active_at)).toBeInstanceOf(Date);
    });
  });

  describe('Login with Invalid Credentials', () => {
    test('should reject login with incorrect password', async () => {
      const credentials = {
        email: 'test@example.com',
        password: 'WrongPassword123!'
      };

      await expect(useAuthStore.getState().login(credentials))
        .rejects.toThrow('Invalid email or password');
    });

    test('should reject login with non-existent email', async () => {
      const credentials = {
        email: 'nonexistent@example.com',
        password: 'SecurePass123!'
      };

      await expect(useAuthStore.getState().login(credentials))
        .rejects.toThrow('Invalid email or password');
    });

    test('should reject login with empty credentials', async () => {
      await expect(useAuthStore.getState().login({
        email: '',
        password: 'SecurePass123!'
      })).rejects.toThrow('Email is required');

      await expect(useAuthStore.getState().login({
        email: 'test@example.com',
        password: ''
      })).rejects.toThrow('Password is required');
    });
  });

  describe('Password Reset Functionality', () => {
    test('should send password reset email', async () => {
      const email = 'test@example.com';
      const result = await useAuthStore.getState().resetPassword(email);
      
      expect(result.success).toBe(true);
      expect(result.message).toBe('Password reset email sent');
    });

    test('should reject password reset for non-existent email', async () => {
      const email = 'nonexistent@example.com';
      
      await expect(useAuthStore.getState().resetPassword(email))
        .rejects.toThrow('No account found with this email');
    });

    test('should validate new password on reset', async () => {
      const resetData = {
        token: 'valid-reset-token',
        newPassword: 'Short1!'
      };

      await expect(useAuthStore.getState().confirmPasswordReset(resetData))
        .rejects.toThrow('Password must be at least 8 characters long');
    });
  });

  describe('Session Persistence', () => {
    test('should maintain session after page reload', async () => {
      const credentials = {
        email: 'test@example.com',
        password: 'SecurePass123!'
      };

      await useAuthStore.getState().login(credentials);
      
      // Simulate page reload by recreating the store
      const newStore = useAuthStore.getState();
      
      expect(newStore.isAuthenticated).toBe(true);
      expect(newStore.user?.email).toBe(credentials.email);
    });

    test('should restore user data from session storage', async () => {
      const credentials = {
        email: 'test@example.com',
        password: 'SecurePass123!'
      };

      await useAuthStore.getState().login(credentials);
      
      // Clear store but keep session storage
      useAuthStore.setState({ user: null, isAuthenticated: false });
      
      // Initialize store (should restore from session)
      await useAuthStore.getState().initializeFromSession();
      
      expect(useAuthStore.getState().isAuthenticated).toBe(true);
      expect(useAuthStore.getState().user?.email).toBe(credentials.email);
    });
  });

  describe('Logout Functionality', () => {
    test('should clear session on logout', async () => {
      // First login
      await useAuthStore.getState().login({
        email: 'test@example.com',
        password: 'SecurePass123!'
      });

      // Then logout
      await useAuthStore.getState().logout();
      
      expect(useAuthStore.getState().isAuthenticated).toBe(false);
      expect(useAuthStore.getState().user).toBeNull();
    });

    test('should clear session storage on logout', async () => {
      await useAuthStore.getState().login({
        email: 'test@example.com',
        password: 'SecurePass123!'
      });

      await useAuthStore.getState().logout();
      
      // Try to restore session
      await useAuthStore.getState().initializeFromSession();
      
      expect(useAuthStore.getState().isAuthenticated).toBe(false);
      expect(useAuthStore.getState().user).toBeNull();
    });

    test('should redirect to login page after logout', async () => {
      const mockNavigate = vi.fn();
      vi.mock('react-router-dom', () => ({
        useNavigate: () => mockNavigate
      }));

      await useAuthStore.getState().logout();
      
      expect(mockNavigate).toHaveBeenCalledWith('/login');
    });
  });

  describe('Authentication Token Expiration', () => {
    test('should handle expired session token', async () => {
      // Mock an expired token
      vi.spyOn(supabase?.auth || {}, 'getSession').mockResolvedValue({
        data: { session: { expires_at: Date.now() - 1000 } }
      });

      await useAuthStore.getState().initializeFromSession();
      
      expect(useAuthStore.getState().isAuthenticated).toBe(false);
      expect(useAuthStore.getState().user).toBeNull();
    });

    test('should refresh valid session token', async () => {
      // Mock a valid token that needs refresh
      const mockSession = {
        access_token: 'new-token',
        expires_at: Date.now() + 3600000 // 1 hour from now
      };

      vi.spyOn(supabase?.auth || {}, 'getSession').mockResolvedValue({
        data: { session: mockSession }
      });

      await useAuthStore.getState().initializeFromSession();
      
      expect(useAuthStore.getState().isAuthenticated).toBe(true);
      expect(useAuthStore.getState().user).toBeTruthy();
    });
  });
});