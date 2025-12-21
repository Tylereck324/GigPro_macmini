import { SelectHTMLAttributes, forwardRef } from 'react';
import clsx from 'clsx';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  fullWidth?: boolean;
  options: Array<{ value: string; label: string; disabled?: boolean }>;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, fullWidth = false, options, ...props }, ref) => {
    return (
      <div className={clsx('flex flex-col gap-2', { 'w-full': fullWidth })}>
        {label && (
          <label className="text-sm font-semibold text-text">
            {label}
            {props.required && <span className="text-danger ml-1">*</span>}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            className={clsx(
              'w-full px-4 py-3 rounded-xl border-2 border-border bg-surface text-text',
              'focus:outline-none focus:ring-4 focus:ring-primary/20 focus:border-primary focus:ring-offset-2',
              'disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-surface/50',
              'transition-all duration-200 ease-out',
              'shadow-sm hover:shadow-md',
              'appearance-none cursor-pointer',
              'pr-10',
              {
                'border-danger focus:ring-danger/20 focus:border-danger': error,
              },
              className
            )}
            {...props}
          >
            {options.map((option) => (
              <option key={option.value} value={option.value} disabled={option.disabled}>
                {option.label}
              </option>
            ))}
          </select>
          {/* Custom dropdown arrow */}
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-textSecondary">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
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

Select.displayName = 'Select';
