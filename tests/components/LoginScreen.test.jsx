import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import LoginScreen from '../../src/components/auth/LoginScreen.jsx';

describe('LoginScreen', () => {
  it('renders the login form by default', () => {
    render(<LoginScreen onLogin={vi.fn()} />);

    expect(screen.getByText('Welcome Back')).toBeDefined();
    expect(screen.getByPlaceholderText('you@example.com')).toBeDefined();
    expect(screen.getByPlaceholderText('••••••••')).toBeDefined();
    expect(screen.getByText('Sign In')).toBeDefined();
  });

  it('toggles password visibility when eye icon is clicked', () => {
    render(<LoginScreen onLogin={vi.fn()} />);

    const passwordInput = screen.getByPlaceholderText('••••••••');
    expect(passwordInput.type).toBe('password');

    const toggleButton = passwordInput.parentElement.querySelector('button');
    fireEvent.click(toggleButton);
    expect(passwordInput.type).toBe('text');

    fireEvent.click(toggleButton);
    expect(passwordInput.type).toBe('password');
  });

  it('navigates to forgot password view when link is clicked', () => {
    render(<LoginScreen onLogin={vi.fn()} />);

    fireEvent.click(screen.getByText('Forgot Password?'));

    expect(screen.getByText('Reset Password')).toBeDefined();
    expect(screen.getByText('Send Reset Link')).toBeDefined();
  });

  it('navigates back to login from forgot password view', () => {
    render(<LoginScreen onLogin={vi.fn()} />);

    fireEvent.click(screen.getByText('Forgot Password?'));
    expect(screen.getByText('Reset Password')).toBeDefined();

    fireEvent.click(screen.getByText('Back to Login'));
    expect(screen.getByText('Welcome Back')).toBeDefined();
  });

  it('calls onLogin with email after submit on login view', async () => {
    vi.useFakeTimers();
    const onLogin = vi.fn();
    render(<LoginScreen onLogin={onLogin} />);

    fireEvent.change(screen.getByPlaceholderText('you@example.com'), {
      target: { value: 'user@test.com' },
    });
    fireEvent.change(screen.getByPlaceholderText('••••••••'), {
      target: { value: 'password123' },
    });

    fireEvent.submit(screen.getByRole('button', { name: /sign in/i }).closest('form'));

    await act(async () => {
      vi.advanceTimersByTime(1500);
    });

    expect(onLogin).toHaveBeenCalledWith('user@test.com');

    vi.useRealTimers();
  });

  it('shows reset sent confirmation on forgot password submit', async () => {
    vi.useFakeTimers();
    render(<LoginScreen onLogin={vi.fn()} />);

    fireEvent.click(screen.getByText('Forgot Password?'));
    fireEvent.change(screen.getByPlaceholderText('you@example.com'), {
      target: { value: 'user@test.com' },
    });

    fireEvent.submit(screen.getByText('Send Reset Link').closest('form'));

    await act(async () => {
      vi.advanceTimersByTime(1500);
    });

    expect(screen.getByText('Check your email')).toBeDefined();

    vi.useRealTimers();
  });

  it('returns to login from reset-sent confirmation screen', async () => {
    vi.useFakeTimers();
    render(<LoginScreen onLogin={vi.fn()} />);

    fireEvent.click(screen.getByText('Forgot Password?'));
    fireEvent.change(screen.getByPlaceholderText('you@example.com'), {
      target: { value: 'user@test.com' },
    });
    fireEvent.submit(screen.getByText('Send Reset Link').closest('form'));

    await act(async () => {
      vi.advanceTimersByTime(1500);
    });

    expect(screen.getByText('Check your email')).toBeDefined();
    fireEvent.click(screen.getByText('Return to Login'));
    expect(screen.getByText('Welcome Back')).toBeDefined();

    vi.useRealTimers();
  });
});
