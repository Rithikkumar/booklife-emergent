import { toast } from 'sonner';

export interface ErrorInfo {
  message: string;
  code?: string;
  details?: any;
}

export class AppError extends Error {
  public readonly code: string;
  public readonly details?: any;
  public readonly isOperational: boolean;

  constructor(message: string, code: string = 'UNKNOWN_ERROR', details?: any) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.details = details;
    this.isOperational = true;
    
    Error.captureStackTrace(this, this.constructor);
  }
}

export const handleAuthError = (error: any): ErrorInfo => {
  console.error('Authentication error:', error);
  
  // Map common Supabase auth errors to user-friendly messages
  const errorMap: Record<string, string> = {
    'Invalid login credentials': 'Invalid email or password. Please check your credentials and try again.',
    'User already registered': 'An account with this email already exists. Please sign in instead.',
    'Email not confirmed': 'Please check your email and click the confirmation link before signing in.',
    'Signup is disabled': 'Account registration is currently disabled. Please contact support.',
    'Password should be at least 6 characters': 'Password must be at least 6 characters long.',
    'Unable to validate email address: invalid format': 'Please enter a valid email address.',
    'Rate limit exceeded': 'Too many attempts. Please wait a few minutes before trying again.',
  };

  const message = error?.message || 'An authentication error occurred';
  const userMessage = errorMap[message] || 'Authentication failed. Please try again.';
  
  return {
    message: userMessage,
    code: error?.code || 'AUTH_ERROR',
    details: { originalMessage: message }
  };
};

export const handleDatabaseError = (error: any): ErrorInfo => {
  console.error('Database error:', error);
  
  // Don't expose sensitive database information
  const genericMessage = 'A database error occurred. Please try again later.';
  
  // Map specific database errors that are safe to show
  if (error?.code === '23505') {
    return {
      message: 'This item already exists.',
      code: 'DUPLICATE_ERROR'
    };
  }
  
  if (error?.code === '23503') {
    return {
      message: 'Cannot complete this action due to existing dependencies.',
      code: 'CONSTRAINT_ERROR'
    };
  }
  
  return {
    message: genericMessage,
    code: 'DATABASE_ERROR',
    details: { code: error?.code }
  };
};

export const handleNetworkError = (error: any): ErrorInfo => {
  console.error('Network error:', error);
  
  if (!navigator.onLine) {
    return {
      message: 'No internet connection. Please check your connection and try again.',
      code: 'NETWORK_OFFLINE'
    };
  }
  
  return {
    message: 'Network error. Please check your connection and try again.',
    code: 'NETWORK_ERROR'
  };
};

export const handleGeneralError = (error: any): ErrorInfo => {
  console.error('General error:', error);
  
  if (error instanceof AppError) {
    return {
      message: error.message,
      code: error.code,
      details: error.details
    };
  }
  
  // For unknown errors, provide a generic message
  return {
    message: 'An unexpected error occurred. Please try again later.',
    code: 'UNKNOWN_ERROR',
    details: { originalError: error?.message }
  };
};

export const showErrorToast = (errorInfo: ErrorInfo) => {
  toast.error(errorInfo.message, {
    duration: 5000,
    action: errorInfo.code === 'NETWORK_ERROR' ? {
      label: 'Retry',
      onClick: () => window.location.reload(),
    } : undefined,
  });
};

export interface SecurityEventContext {
  userId?: string;
  userAgent?: string;
  ipAddress?: string;
  sessionId?: string;
  route?: string;
  timestamp: Date;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export const logSecurityEvent = (event: string, details?: any, severity: 'low' | 'medium' | 'high' | 'critical' = 'medium') => {
  const context: SecurityEventContext = {
    timestamp: new Date(),
    severity,
    userAgent: navigator?.userAgent,
    route: window?.location?.pathname,
    ...details
  };
  
  // Enhanced logging with structured data
  console.warn(`🔒 Security Event [${severity.toUpperCase()}]: ${event}`, context);
  
  // Rate limit security events to prevent flooding
  const eventKey = `security_event_${event}`;
  if (rateLimiter.isRateLimited(eventKey, 10, 60000)) {
    console.warn('Security event rate limited:', event);
    return;
  }
  
  // Store in session storage for admin dashboard (in production, send to monitoring service)
  try {
    const securityLogs = JSON.parse(sessionStorage.getItem('securityLogs') || '[]');
    securityLogs.push({ event, context, id: crypto.randomUUID() });
    // Keep only last 100 events
    if (securityLogs.length > 100) {
      securityLogs.splice(0, securityLogs.length - 100);
    }
    sessionStorage.setItem('securityLogs', JSON.stringify(securityLogs));
  } catch (error) {
    console.error('Failed to store security log:', error);
  }
  
  // In production, implement:
  // - Send to security monitoring service (e.g., Sentry, LogRocket, DataDog)
  // - Alert on critical events
  // - Store in secure audit log database
  // - Integrate with SIEM tools
};

// Rate limiting utility
class RateLimiter {
  private attempts: Map<string, number[]> = new Map();
  
  isRateLimited(key: string, maxAttempts: number = 5, windowMs: number = 300000): boolean {
    const now = Date.now();
    const windowStart = now - windowMs;
    
    const userAttempts = this.attempts.get(key) || [];
    const recentAttempts = userAttempts.filter(timestamp => timestamp > windowStart);
    
    if (recentAttempts.length >= maxAttempts) {
      return true;
    }
    
    recentAttempts.push(now);
    this.attempts.set(key, recentAttempts);
    
    return false;
  }
  
  reset(key: string) {
    this.attempts.delete(key);
  }
}

export const rateLimiter = new RateLimiter();