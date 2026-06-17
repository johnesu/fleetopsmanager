import { useState } from 'react';
import type { ValidationRule, ValidationErrors } from '../types';

export default function useFormErrors(): {
  errors: ValidationErrors;
  validate: (rules: Record<string, ValidationRule>, form: Record<string, unknown>) => boolean;
  clearErrors: () => void;
  setFieldError: (field: string, message: string) => void;
} {
  const [errors, setErrors] = useState<ValidationErrors>({});

  function validate(rules: Record<string, ValidationRule>, form: Record<string, unknown>): boolean {
    const newErrors: ValidationErrors = {};
    for (const [field, rule] of Object.entries(rules)) {
      const value = form[field] as string | number | undefined | null;
      const isEmpty = value === '' || value === null || value === undefined || (typeof value === 'string' && !value.trim());
      if (rule.required && isEmpty) {
        newErrors[field] = rule.label ? `${rule.label} is required` : 'Required';
      }
      if (!isEmpty) {
        const numVal = Number(value);
        if (!isNaN(numVal)) {
          if (rule.min !== undefined && numVal < rule.min) newErrors[field] = `${rule.label || field} must be at least ${rule.min}`;
          if (rule.max !== undefined && numVal > rule.max) newErrors[field] = `${rule.label || field} must be at most ${rule.max}`;
        }
        if (rule.pattern && !rule.pattern.test(String(value))) {
          newErrors[field] = rule.patternMessage || 'Invalid format';
        }
        if (rule.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value))) {
          newErrors[field] = 'Invalid email address';
        }
        if (rule.positive && numVal <= 0) {
          newErrors[field] = `${rule.label || field} must be positive`;
        }
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function clearErrors() {
    setErrors({});
  }

  function setFieldError(field: string, message: string) {
    setErrors(prev => ({ ...prev, [field]: message }));
  }

  return { errors, validate, clearErrors, setFieldError };
}