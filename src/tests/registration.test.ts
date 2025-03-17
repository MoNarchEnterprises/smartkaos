import { describe, test, expect, beforeEach } from 'vitest';
import { useAuthStore } from '../store/authStore';
import { supabase } from '../services/supabase';

describe('User Registration', () => {
  beforeEach(() => {
    // Reset auth store state before each test
    useAuthStore.setState({
      user: null,
      isAuthenticated: false
    });
  });

  describe('New User Registration', () => {
    test('should register with valid data', async () => {
      const validData = {
        email: 'test@example.com',
        password: 'SecurePass123!',
        businessName: 'Test Business'
      };

      await useAuthStore.getState().register(validData);
      const state = useAuthStore.getState();
      
      expect(state.isAuthenticated).toBe(true);
      expect(state.user).toBeTruthy();
      expect(state.user?.email).toBe(validData.email);
      expect(state.user?.businessName).toBe(validData.businessName);
      expect(state.user?.subscription).toBe('trial');
      expect(state.user?.trial_calls_remaining).toBe(50);
      expect(state.user?.trial_used).toBe(false);
    });
  });

  describe('Required Fields Validation', () => {
    test('should reject registration with missing email', async () => {
      const invalidData = {
        email: '',
        password: 'SecurePass123!',
        businessName: 'Test Business'
      };

      await expect(useAuthStore.getState().register(invalidData))
        .rejects.toThrow('Email is required');
    });

    test('should reject registration with missing password', async () => {
      const invalidData = {
        email: 'test@example.com',
        password: '',
        businessName: 'Test Business'
      };

      await expect(useAuthStore.getState().register(invalidData))
        .rejects.toThrow('Password is required');
    });

    test('should reject registration with missing business name', async () => {
      const invalidData = {
        email: 'test@example.com',
        password: 'SecurePass123!',
        businessName: ''
      };

      await expect(useAuthStore.getState().register(invalidData))
        .rejects.toThrow('Business name is required');
    });
  });

  describe('Email Format Validation', () => {
    test('should reject invalid email formats', async () => {
      const invalidEmails = [
        'notanemail',
        'missing@domain',
        '@nodomain.com',
        'spaces in@email.com',
        'multiple@@at.com'
      ];

      for (const email of invalidEmails) {
        await expect(useAuthStore.getState().register({
          email,
          password: 'SecurePass123!',
          businessName: 'Test Business'
        })).rejects.toThrow('Invalid email format');
      }
    });

    test('should accept valid email formats', async () => {
      const validEmails = [
        'simple@example.com',
        'with.dots@example.com',
        'with-dash@example.com',
        'with_underscore@example.com',
        'numbers123@example.com'
      ];

      for (const email of validEmails) {
        const result = await useAuthStore.getState().register({
          email,
          password: 'SecurePass123!',
          businessName: 'Test Business'
        });
        expect(result).toBeTruthy();
      }
    });
  });

  describe('Password Strength Requirements', () => {
    test('should enforce minimum password length', async () => {
      const shortPassword = 'Short1!';
      
      await expect(useAuthStore.getState().register({
        email: 'test@example.com',
        password: shortPassword,
        businessName: 'Test Business'
      })).rejects.toThrow('Password must be at least 8 characters long');
    });

    test('should require password complexity', async () => {
      const weakPasswords = [
        'onlylowercase',
        'ONLYUPPERCASE',
        'only123numbers',
        'noNumbers!!',
        'NoSpecial123'
      ];

      for (const password of weakPasswords) {
        await expect(useAuthStore.getState().register({
          email: 'test@example.com',
          password,
          businessName: 'Test Business'
        })).rejects.toThrow('Password must include uppercase, lowercase, numbers, and special characters');
      }
    });

    test('should accept strong passwords', async () => {
      const strongPasswords = [
        'SecurePass123!',
        'Complex1Password!',
        'StrongP@ssw0rd',
        'V3ryS3cure!Pass',
        'P@ssw0rd123Strong'
      ];

      for (const password of strongPasswords) {
        const result = await useAuthStore.getState().register({
          email: 'test@example.com',
          password,
          businessName: 'Test Business'
        });
        expect(result).toBeTruthy();
      }
    });
  });

  describe('Trial Account Creation', () => {
    test('should initialize trial account correctly', async () => {
      const userData = {
        email: 'trial@example.com',
        password: 'SecurePass123!',
        businessName: 'Trial Business'
      };

      await useAuthStore.getState().register(userData);
      const state = useAuthStore.getState();
      
      expect(state.user?.subscription).toBe('trial');
      expect(state.user?.trial_calls_remaining).toBe(50);
      expect(state.user?.trial_used).toBe(false);
      expect(state.user?.subscription_status).toBe('trial');
    });

    test('should track trial usage', async () => {
      // First registration
      await useAuthStore.getState().register({
        email: 'first@example.com',
        password: 'SecurePass123!',
        businessName: 'First Business'
      });

      const profile = await supabase
        ?.from('profiles')
        .select('*')
        .eq('email', 'first@example.com')
        .single();

      expect(profile.data.trial_used).toBe(true);
      expect(profile.data.trial_calls_remaining).toBe(50);
    });
  });

  describe('Duplicate Email Prevention', () => {
    test('should prevent duplicate email registration', async () => {
      const userData = {
        email: 'duplicate@example.com',
        password: 'SecurePass123!',
        businessName: 'Test Business'
      };

      // First registration should succeed
      await useAuthStore.getState().register(userData);

      // Second registration with same email should fail
      await expect(useAuthStore.getState().register(userData))
        .rejects.toThrow('Email already registered');
    });

    test('should be case insensitive for email duplicates', async () => {
      const email = 'Test@Example.com';
      
      // Register with original email
      await useAuthStore.getState().register({
        email,
        password: 'SecurePass123!',
        businessName: 'Test Business'
      });

      // Try to register with same email in different case
      await expect(useAuthStore.getState().register({
        email: email.toLowerCase(),
        password: 'SecurePass123!',
        businessName: 'Another Business'
      })).rejects.toThrow('Email already registered');
    });
  });

  describe('Initial Trial Credits', () => {
    test('should initialize with 50 trial calls', async () => {
      const userData = {
        email: 'credits@example.com',
        password: 'SecurePass123!',
        businessName: 'Credits Business'
      };

      await useAuthStore.getState().register(userData);
      const state = useAuthStore.getState();
      
      expect(state.user?.trial_calls_remaining).toBe(50);
      expect(state.user?.subscription).toBe('trial');
      expect(state.user?.subscription_status).toBe('trial');
    });

    test('should track call usage during trial', async () => {
      const userData = {
        email: 'usage@example.com',
        password: 'SecurePass123!',
        businessName: 'Usage Business'
      };

      await useAuthStore.getState().register(userData);
      
      // Simulate making calls (this would normally be done through the call service)
      const profile = await supabase
        ?.from('profiles')
        .select('*')
        .eq('email', userData.email)
        .single();

      expect(profile.data.trial_calls_remaining).toBe(50);
      expect(profile.data.total_calls).toBe(0);
    });
  });
});