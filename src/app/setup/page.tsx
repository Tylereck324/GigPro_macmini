'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import { Button, Card, Input } from '@/components/ui';

export default function SetupPage() {
  const [setupToken, setSetupToken] = useState('');
  const [pin, setPin] = useState('');
  const [isSettingUp, setIsSettingUp] = useState(false);

  const [resetToken, setResetToken] = useState('');
  const [newPin, setNewPin] = useState('');
  const [isResetting, setIsResetting] = useState(false);

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

  return (
    <div className="max-w-2xl mx-auto px-4 py-10 space-y-6">
      <Card>
        <h1 className="text-2xl font-bold text-text mb-2">Setup</h1>
        <p className="text-textSecondary mb-6">
          Use your setup token to initialize GigPro and set your PIN.
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

      <Card>
        <h2 className="text-xl font-semibold text-text mb-2">Reset PIN</h2>
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
          <Button type="submit" variant="secondary" disabled={isResetting} fullWidth>
            {isResetting ? 'Resetting…' : 'Reset PIN'}
          </Button>
        </form>
      </Card>
    </div>
  );
}

