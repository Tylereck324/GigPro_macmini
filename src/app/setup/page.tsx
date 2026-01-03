'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { Button, Card, Input } from '@/components/ui';

export default function SetupPage() {
  const router = useRouter();
  const [setupToken, setSetupToken] = useState('');
  const [pin, setPin] = useState('');
  const [isSettingUp, setIsSettingUp] = useState(false);

  const [resetToken, setResetToken] = useState('');
  const [newPin, setNewPin] = useState('');
  const [isResetting, setIsResetting] = useState(false);

  const [isChecking, setIsChecking] = useState(true);
  const [ownerConfigured, setOwnerConfigured] = useState(false);

  // Check if owner is already configured on mount
  useEffect(() => {
    const checkOwnerStatus = async () => {
      try {
        const res = await fetch('/api/auth/status');
        if (res.ok) {
          const data = await res.json();
          setOwnerConfigured(data.ownerConfigured);
        }
      } catch {
        // If check fails, allow setup
      }
      setIsChecking(false);
    };
    checkOwnerStatus();
  }, []);

  const postJson = async (url: string, body: unknown) => {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      throw new Error(data?.error || 'Request failed');
    }
  };

  const onSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSettingUp(true);
    try {
      await postJson('/api/auth/setup', { setupToken, pin });
      window.location.href = '/';
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Setup failed';
      toast.error(message);
    } finally {
      setIsSettingUp(false);
    }
  };

  const onResetPin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsResetting(true);
    try {
      await postJson('/api/auth/reset-pin', { setupToken: resetToken, pin: newPin });
      window.location.href = '/';
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Reset failed';
      toast.error(message);
    } finally {
      setIsResetting(false);
    }
  };

  if (isChecking) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-10">
        <Card>
          <div className="text-center text-textSecondary py-8">
            Loading...
          </div>
        </Card>
      </div>
    );
  }

  // If owner is already configured, show only the reset PIN form
  if (ownerConfigured) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-10 space-y-6">
        <Card>
          <h1 className="text-2xl font-bold text-text mb-2">Reset PIN</h1>
          <p className="text-textSecondary mb-6">
            Forgot your PIN? Use the setup token to reset it.
          </p>

          <form onSubmit={onResetPin} className="space-y-4">
            <Input
              label="Setup Token"
              type="password"
              value={resetToken}
              onChange={(e) => setResetToken(e.target.value)}
              required
              fullWidth
            />
            <Input
              label="New PIN"
              type="tel"
              inputMode="numeric"
              autoComplete="one-time-code"
              value={newPin}
              onChange={(e) => setNewPin(e.target.value)}
              maxLength={6}
              pattern="\\d{6}"
              required
              fullWidth
            />
            <Button type="submit" variant="primary" disabled={isResetting} fullWidth>
              {isResetting ? 'Resetting…' : 'Reset PIN'}
            </Button>
          </form>

          <div className="mt-6 text-sm text-textSecondary">
            Remember your PIN?{' '}
            <button
              type="button"
              onClick={() => router.push('/login')}
              className="text-primary font-semibold hover:underline"
            >
              Go to Login
            </button>
          </div>
        </Card>
      </div>
    );
  }

  // First-time setup - owner not yet configured
  return (
    <div className="max-w-2xl mx-auto px-4 py-10 space-y-6">
      <Card>
        <h1 className="text-2xl font-bold text-text mb-2">Welcome to GigPro</h1>
        <p className="text-textSecondary mb-6">
          Set up your account by entering your setup token and creating a 6-digit PIN.
        </p>

        <form onSubmit={onSetup} className="space-y-4">
          <Input
            label="Setup Token"
            type="password"
            value={setupToken}
            onChange={(e) => setSetupToken(e.target.value)}
            required
            fullWidth
          />
          <Input
            label="PIN"
            type="tel"
            inputMode="numeric"
            autoComplete="one-time-code"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            maxLength={6}
            pattern="\\d{6}"
            required
            fullWidth
          />
          <Button type="submit" variant="primary" disabled={isSettingUp} fullWidth>
            {isSettingUp ? 'Setting up…' : 'Complete Setup'}
          </Button>
        </form>
      </Card>
    </div>
  );
}

