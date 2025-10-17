import React from 'react';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ValidationError {
  field: string;
  message: string;
}

export interface FormValidationProps {
  errors: ValidationError[];
}

export const FormValidation: React.FC<FormValidationProps> = ({ errors }) => {
  if (errors.length === 0) return null;

  return (
    <Alert variant="destructive" className="mb-4">
      <AlertCircle className="h-4 w-4" />
      <AlertDescription>
        <ul className="list-disc list-inside space-y-1">
          {errors.map((error, index) => (
            <li key={index}>{error.message}</li>
          ))}
        </ul>
      </AlertDescription>
    </Alert>
  );
};

// Utility functions for validation
export const validateEmail = (email: string): ValidationError[] => {
  const errors: ValidationError[] = [];
  
  if (!email) {
    errors.push({ field: 'email', message: 'Email is required' });
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.push({ field: 'email', message: 'Please enter a valid email address' });
  }
  
  return errors;
};

export const validatePassword = (password: string): ValidationError[] => {
  const errors: ValidationError[] = [];
  
  if (!password) {
    errors.push({ field: 'password', message: 'Password is required' });
  } else if (password.length < 8) {
    errors.push({ field: 'password', message: 'Password must be at least 8 characters long' });
  } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
    errors.push({ field: 'password', message: 'Password must contain at least one uppercase letter, one lowercase letter, and one number' });
  }
  
  return errors;
};

export const validateUsername = (username: string): ValidationError[] => {
  const errors: ValidationError[] = [];
  
  if (!username) {
    errors.push({ field: 'username', message: 'Username is required' });
  } else if (username.length < 3) {
    errors.push({ field: 'username', message: 'Username must be at least 3 characters long' });
  } else if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    errors.push({ field: 'username', message: 'Username can only contain letters, numbers, and underscores' });
  }
  
  return errors;
};

export const validateRequired = (value: string, fieldName: string): ValidationError[] => {
  const errors: ValidationError[] = [];
  
  if (!value || value.trim().length === 0) {
    errors.push({ field: fieldName, message: `${fieldName} is required` });
  }
  
  return errors;
};

export const sanitizeInput = (input: string): string => {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .slice(0, 1000); // Limit input length
};