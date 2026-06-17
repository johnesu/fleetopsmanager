import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import useFormErrors from './useFormErrors';

describe('useFormErrors', () => {
  let hook: { result: { current: ReturnType<typeof useFormErrors> } };

  beforeEach(() => {
    hook = renderHook(() => useFormErrors());
  });

  it('returns true when all rules pass', () => {
    const rules = {
      name: { required: true },
      age: { min: 18, max: 99 },
    };
    const form = { name: 'Alice', age: 30 };

    let valid: boolean;
    act(() => { valid = hook.result.current.validate(rules, form); });

    expect(valid!).toBe(true);
    expect(hook.result.current.errors).toEqual({});
  });

  it('returns false when a required field is empty', () => {
    const rules = { name: { required: true } };
    const form = { name: '' };

    let valid: boolean;
    act(() => { valid = hook.result.current.validate(rules, form); });

    expect(valid!).toBe(false);
    expect(hook.result.current.errors).toEqual({ name: 'Required' });
  });

  it('returns false when a number is below minimum', () => {
    const rules = { age: { min: 18, label: 'Age' } };
    const form = { age: 15 };

    let valid: boolean;
    act(() => { valid = hook.result.current.validate(rules, form); });

    expect(valid!).toBe(false);
    expect(hook.result.current.errors).toEqual({ age: 'Age must be at least 18' });
  });

  it('returns false when a number is above maximum', () => {
    const rules = { age: { max: 100, label: 'Age' } };
    const form = { age: 200 };

    let valid: boolean;
    act(() => { valid = hook.result.current.validate(rules, form); });

    expect(valid!).toBe(false);
    expect(hook.result.current.errors).toEqual({ age: 'Age must be at most 100' });
  });

  it('returns false when pattern does not match', () => {
    const rules = { code: { pattern: /^[A-Z]{3}$/, patternMessage: 'Code must be 3 uppercase letters' } };
    const form = { code: 'abc' };

    let valid: boolean;
    act(() => { valid = hook.result.current.validate(rules, form); });

    expect(valid!).toBe(false);
    expect(hook.result.current.errors).toEqual({ code: 'Code must be 3 uppercase letters' });
  });

  it('returns false for invalid email', () => {
    const rules = { email: { email: true } };
    const form = { email: 'not-an-email' };

    let valid: boolean;
    act(() => { valid = hook.result.current.validate(rules, form); });

    expect(valid!).toBe(false);
    expect(hook.result.current.errors).toEqual({ email: 'Invalid email address' });
  });

  it('returns false when positive number is 0', () => {
    const rules = { count: { positive: true, label: 'Count' } };
    const form = { count: 0 };

    let valid: boolean;
    act(() => { valid = hook.result.current.validate(rules, form); });

    expect(valid!).toBe(false);
    expect(hook.result.current.errors).toEqual({ count: 'Count must be positive' });
  });

  it('clearErrors resets all errors', () => {
    const rules = { name: { required: true } };
    const form = { name: '' };

    act(() => { hook.result.current.validate(rules, form); });
    expect(hook.result.current.errors).toEqual({ name: 'Required' });

    act(() => { hook.result.current.clearErrors(); });

    expect(hook.result.current.errors).toEqual({});
  });

  it('setFieldError sets error for a specific field', () => {
    act(() => { hook.result.current.setFieldError('username', 'Already taken'); });

    expect(hook.result.current.errors).toEqual({ username: 'Already taken' });
  });

  it('reports multiple validation errors at once', () => {
    const rules = {
      name: { required: true },
      age: { min: 18, label: 'Age' },
      email: { email: true },
    };
    const form = { name: '', age: 10, email: 'bad' };

    let valid: boolean;
    act(() => { valid = hook.result.current.validate(rules, form); });

    expect(valid!).toBe(false);
    expect(hook.result.current.errors).toEqual({
      name: 'Required',
      age: 'Age must be at least 18',
      email: 'Invalid email address',
    });
  });
});
