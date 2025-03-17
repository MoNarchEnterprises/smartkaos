import DOMPurify from 'dompurify';
import xss from 'xss';
import crypto from 'crypto';

export class SecurityService {
  private static instance: SecurityService;

  private constructor() {}

  public static getInstance(): SecurityService {
    if (!SecurityService.instance) {
      SecurityService.instance = new SecurityService();
    }
    return SecurityService.instance;
  }

  public sanitizeInput(input: string): string {
    // First use DOMPurify to clean HTML
    const cleanHtml = DOMPurify.sanitize(input, {
      ALLOWED_TAGS: ['b', 'i', 'em', 'strong'],
      ALLOWED_ATTR: []
    });
    
    // Then use XSS to further sanitize
    return xss(cleanHtml);
  }

  public validatePhoneNumber(phone: string): boolean {
    // E.164 format validation
    const phoneRegex = /^\+[1-9]\d{1,14}$/;
    return phoneRegex.test(phone);
  }

  public validateEmail(email: string): boolean {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email);
  }

  public validatePassword(password: string): { valid: boolean; message: string } {
    if (password.length < 8) {
      return { valid: false, message: 'Password must be at least 8 characters long' };
    }

    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    if (!hasUpperCase || !hasLowerCase || !hasNumbers || !hasSpecialChar) {
      return {
        valid: false,
        message: 'Password must include uppercase, lowercase, numbers, and special characters'
      };
    }

    return { valid: true, message: '' };
  }

  public generateSecureToken(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }

  public hashData(data: string, salt?: string): { hash: string; salt: string } {
    const useSalt = salt || crypto.randomBytes(16).toString('hex');
    const hash = crypto
      .pbkdf2Sync(data, useSalt, 10000, 64, 'sha512')
      .toString('hex');
    
    return { hash, salt: useSalt };
  }

  public verifyHash(data: string, hash: string, salt: string): boolean {
    const verifyHash = crypto
      .pbkdf2Sync(data, salt, 10000, 64, 'sha512')
      .toString('hex');
    
    return hash === verifyHash;
  }

  public sanitizeFilename(filename: string): string {
    // Remove any path traversal attempts and dangerous characters
    return filename
      .replace(/\.\./g, '')
      .replace(/[/\\]/g, '')
      .replace(/[^a-zA-Z0-9.-]/g, '_');
  }

  public validateWebhookUrl(url: string): boolean {
    try {
      const parsedUrl = new URL(url);
      return parsedUrl.protocol === 'https:';
    } catch {
      return false;
    }
  }
}

export const securityService = SecurityService.getInstance();