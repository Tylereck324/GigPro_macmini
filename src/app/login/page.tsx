'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { Button, Card, Input } from '@/components/ui';

export default function LoginPage() {
  const router = useRouter();
  const [pin, setPin] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  // Check if owner is configured on mount - redirect to setup if not
  useEffect(() => {
    const checkOwnerStatus = async () => {
      try {
        const res = await fetch('/api/auth/status');
        const data = await res.json();
        // If not configured OR if there was an error (table doesn't exist), go to setup
        if (!data.ownerConfigured || data.error) {
          router.replace('/setup');
          return;
        }
      } catch {
        // If check completely fails, redirect to setup (likely first run)
        router.replace('/setup');
        return;
      }
      setIsChecking(false);
    };
    checkOwnerStatus();
  }, [router]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || 'Login failed');
      }

      window.location.href = '/';
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Login failed';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isChecking) {
    return (
      <div className="max-w-md mx-auto px-4 py-10">
        <Card>
          <div className="text-center text-textSecondary py-8">
            Loading...
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto px-4 py-10">
      <Card>
        <h1 className="text-2xl font-bold text-text mb-2">Log in</h1>
        <p className="text-textSecondary mb-6">
          Enter your 6-digit PIN to access GigPro.
        </p>

        <form onSubmit={onSubmit} className="space-y-4">
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

          <Button type="submit" variant="primary" disabled={isSubmitting} fullWidth>
            {isSubmitting ? 'Logging in…' : 'Log In'}
          </Button>
        </form>

        <div className="mt-6 text-sm text-textSecondary">
          Need to set up or reset your PIN?{' '}
          <Link href="/setup" className="text-primary font-semibold hover:underline">
            Go to Setup
          </Link>
        </div>
      </Card>
    </div>
  );
}

