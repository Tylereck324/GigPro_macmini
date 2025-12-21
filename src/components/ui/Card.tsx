import { HTMLAttributes, forwardRef } from 'react';
import clsx from 'clsx';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
  padding?: 'sm' | 'md' | 'lg' | 'none';
  variant?: 'default' | 'gradient' | 'bordered';
  elevated?: boolean;
  containerQuery?: boolean; // Enable container query support
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({
    className,
    hover = false,
    padding = 'md',
    variant = 'default',
    elevated = false,
    containerQuery = false,
    children,
    ...props
  }, ref) => {
    return (
      <div
        ref={ref}
        className={clsx(
          'rounded-2xl transition-all duration-300 ease-out',
          {
            // Variants
            'bg-surface/80 backdrop-blur-md border border-white/20': variant === 'default',
            'bg-gradient-to-br from-surface to-background border border-white/20 backdrop-blur-md': variant === 'gradient',
            'bg-surface/50 border-2 border-primary/20 backdrop-blur-md': variant === 'bordered',

            // Elevation / Shadows
            'shadow-md': !elevated,
            'shadow-xl': elevated,

            // Hover effects
            'hover:shadow-2xl hover:-translate-y-1 cursor-pointer': hover,
            'hover:border-primary/30': hover && variant === 'bordered',

            // Padding - responsive using CSS variables
            'p-3 sm:p-4': padding === 'sm',
            'p-5 sm:p-6': padding === 'md',
            'p-7 sm:p-8': padding === 'lg',
            'p-0': padding === 'none',

            // Container query support
            'container-query': containerQuery,
          },
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';
