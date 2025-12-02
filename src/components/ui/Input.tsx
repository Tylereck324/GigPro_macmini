import { InputHTMLAttributes, forwardRef, useMemo } from 'react';
import clsx from 'clsx';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  fullWidth?: boolean;
  icon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, fullWidth = false, icon, type, ...props }, ref) => {
    // Auto-detect optimal inputMode for mobile keyboards based on type
    const inputMode = useMemo(() => {
      // Don't override if user explicitly provided inputMode
      if (props.inputMode) return props.inputMode;

      // Optimize for mobile keyboards
      if (type === 'number') return 'decimal';
      if (type === 'tel') return 'tel';
      if (type === 'email') return 'email';
      if (type === 'url') return 'url';
      if (type === 'search') return 'search';

      return undefined;
    }, [type, props.inputMode]);

    return (
      <div className={clsx('flex flex-col gap-2', { 'w-full': fullWidth })}>
        {label && (
          <label className="text-sm font-semibold text-text">
            {label}
            {props.required && <span className="text-danger ml-1">*</span>}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-textSecondary">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            type={type}
            inputMode={inputMode}
            className={clsx(
              'w-full px-4 py-3 rounded-xl border-2 border-border bg-surface text-text',
              'min-h-[44px]', // WCAG 2.5.5 touch target minimum
              'focus:outline-none focus:ring-4 focus:ring-primary/20 focus:border-primary focus:ring-offset-2',
              'placeholder:text-textSecondary',
              'disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-surface/50',
              'transition-all duration-200 ease-out',
              'shadow-sm hover:shadow-md',
              {
                'border-danger focus:ring-danger/20 focus:border-danger': error,
                'pl-10': icon,
              },
              className
            )}
            {...props}
          />
        </div>
        {error && (
          <span className="text-sm text-danger font-medium flex items-center gap-1">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {error}
          </span>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
