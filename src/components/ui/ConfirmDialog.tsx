'use client';

import { useEffect, useRef } from 'react';
import { Button } from './Button';
import clsx from 'clsx';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'primary';
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * ConfirmDialog Component
 *
 * Accessible modal dialog for confirmation actions.
 * Replaces window.confirm() with proper ARIA attributes and focus management.
 *
 * Features:
 * - Focus trap (focus stays within dialog)
 * - Escape key to cancel
 * - Enter key to confirm
 * - ARIA attributes for screen readers
 * - Backdrop click to cancel
 */
export function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'primary',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const confirmButtonRef = useRef<HTMLButtonElement>(null);

  // Focus management and keyboard handlers
  useEffect(() => {
    if (!isOpen) return;

    // Focus the confirm button when dialog opens
    confirmButtonRef.current?.focus();

    // Handle keyboard events
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onCancel();
      } else if (e.key === 'Enter' && e.target === confirmButtonRef.current) {
        e.preventDefault();
        onConfirm();
      }
    };

    // Trap focus within dialog
    const handleFocusTrap = (e: FocusEvent) => {
      if (!dialogRef.current) return;

      const focusableElements = dialogRef.current.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );

      const firstElement = focusableElements[0] as HTMLElement;

      // If focus moves outside dialog, bring it back
      if (!dialogRef.current.contains(e.target as Node)) {
        firstElement?.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('focusin', handleFocusTrap);

    // Prevent body scroll when dialog is open
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('focusin', handleFocusTrap);
      document.body.style.overflow = '';
    };
  }, [isOpen, onCancel, onConfirm]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center"
      role="presentation"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in"
        onClick={onCancel}
        aria-hidden="true"
      />

      {/* Dialog */}
      <div
        ref={dialogRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-description"
        className={clsx(
          'relative z-10 bg-surface rounded-2xl shadow-2xl',
          'p-6 max-w-md w-full mx-4',
          'border-2 border-border',
          'animate-scale-in'
        )}
      >
        {/* Title */}
        <h2
          id="confirm-dialog-title"
          className="text-xl font-bold text-text mb-3"
        >
          {title}
        </h2>

        {/* Message */}
        <p
          id="confirm-dialog-description"
          className="text-base text-textSecondary mb-6"
        >
          {message}
        </p>

        {/* Actions */}
        <div className="flex gap-3 justify-end">
          <Button
            variant="ghost"
            onClick={onCancel}
            size="md"
          >
            {cancelLabel}
          </Button>
          <Button
            ref={confirmButtonRef}
            variant={variant}
            onClick={onConfirm}
            size="md"
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
