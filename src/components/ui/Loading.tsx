import clsx from 'clsx';

interface LoadingProps {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'spinner' | 'dots' | 'pulse';
  className?: string;
}

export function Loading({ size = 'md', variant = 'spinner', className }: LoadingProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  if (variant === 'spinner') {
    return (
      <div className={clsx('flex items-center justify-center', className)} role="status" aria-live="polite">
        <svg
          className={clsx('animate-spin text-primary', sizeClasses[size])}
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
        <span className="sr-only">Loading...</span>
      </div>
    );
  }

  if (variant === 'dots') {
    const dotSize = {
      sm: 'w-1.5 h-1.5',
      md: 'w-2.5 h-2.5',
      lg: 'w-4 h-4',
    };

    return (
      <div className={clsx('flex items-center gap-1.5', className)} role="status" aria-live="polite">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className={clsx(
              'rounded-full bg-primary animate-pulse',
              dotSize[size]
            )}
            style={{
              animationDelay: `${i * 150}ms`,
              animationDuration: '1s',
            }}
            aria-hidden="true"
          />
        ))}
        <span className="sr-only">Loading...</span>
      </div>
    );
  }

  if (variant === 'pulse') {
    return (
      <div className={clsx('flex items-center justify-center', className)} role="status" aria-live="polite">
        <div
          className={clsx(
            'rounded-full bg-gradient-to-r from-blue-500 to-purple-600 animate-pulse',
            sizeClasses[size]
          )}
          aria-hidden="true"
        />
        <span className="sr-only">Loading...</span>
      </div>
    );
  }

  return null;
}
