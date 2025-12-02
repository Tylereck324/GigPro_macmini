import { ButtonHTMLAttributes, forwardRef } from 'react';
import clsx from 'clsx';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  isLoading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', fullWidth = false, isLoading = false, children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        aria-busy={isLoading}
        aria-disabled={disabled || isLoading}
        className={clsx(
          'inline-flex items-center justify-center',
          'font-semibold rounded-xl transition-all duration-300 ease-out',
          'min-h-[44px] min-w-[44px]', // WCAG 2.5.5 touch target minimum
          'disabled:opacity-50 disabled:cursor-not-allowed',
          'focus-visible:outline-2 focus-visible:outline-white focus-visible:outline-offset-2',
          'focus-visible:ring-4 focus-visible:ring-offset-0',
          'focus:outline-none', // Hide outline for mouse users
          'motion-safe:transform motion-safe:active:scale-95',
          'motion-reduce:transition-none', // Respect prefers-reduced-motion
          'contrast-more:border-2', // High contrast mode support
          'relative overflow-hidden',
          {
            // Variants with modern gradients and shadows
            'bg-gradient-primary hover:opacity-90': variant === 'primary',
            'text-white shadow-lg hover:shadow-xl focus-visible:ring-primary': variant === 'primary',

            'bg-gradient-to-r from-purple-500 to-pink-600 hover:opacity-90': variant === 'secondary',
            'text-white shadow-lg hover:shadow-xl focus-visible:ring-purple-500': variant === 'secondary',

            'bg-gradient-danger hover:opacity-90': variant === 'danger',
            'text-white shadow-lg hover:shadow-xl focus-visible:ring-danger': variant === 'danger',

            'bg-gradient-success hover:opacity-90': variant === 'success',
            'text-white shadow-lg hover:shadow-xl focus-visible:ring-success': variant === 'success',

            'border-2 border-primary text-primary hover:bg-primary hover:text-white': variant === 'outline',
            'shadow-md hover:shadow-lg focus-visible:ring-primary': variant === 'outline',

            'bg-transparent hover:bg-surfaceHover text-text': variant === 'ghost',
            'focus-visible:ring-border': variant === 'ghost',

            // High contrast support for gradient variants
            'contrast-more:border-white contrast-more:focus-visible:outline-3':
              variant === 'primary' || variant === 'secondary' || variant === 'danger' || variant === 'success',
            'contrast-more:border-current': variant === 'outline',

            // Sizes
            'px-3 py-2 text-sm': size === 'sm',
            'px-5 py-2.5 text-base': size === 'md',
            'px-7 py-3.5 text-lg': size === 'lg',

            // Full width
            'w-full': fullWidth,
          },
          className
        )}
        {...props}
      >
        {isLoading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>Loading...</span>
          </span>
        ) : (
          children
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';
