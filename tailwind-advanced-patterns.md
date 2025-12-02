# Tailwind CSS Advanced Patterns and Theming

## Introduction

Tailwind CSS has revolutionized modern web development with its utility-first approach, enabling rapid UI development while maintaining design consistency. For GigPro, Tailwind provides the foundation for a responsive, themeable interface that adapts to light and dark modes while supporting multiple gig platforms with distinct visual identities. This document covers advanced Tailwind patterns, theming strategies, and component architecture best practices for 2024-2025.

## Dark Mode Implementation

### Configuration Strategies

Tailwind provides two main dark mode strategies:

#### 1. Media Strategy (System Preference)

Automatically applies dark styles based on the user's OS or browser preference using the `prefers-color-scheme` media query.

```javascript
// tailwind.config.js
export default {
  darkMode: 'media', // Uses system preference
  // rest of config
}
```

**Pros:**
- Automatic based on system settings
- No JavaScript required
- Respects user's global preference

**Cons:**
- No manual toggle
- Can't override user's system preference
- Less control for application-specific themes

#### 2. Class Strategy (Manual Control) - Recommended

Applies dark mode via a class on a root element (typically `<html>` or `<body>`), enabling manual toggling and localStorage persistence.

```javascript
// tailwind.config.js
export default {
  darkMode: 'class', // Manual control via class
  // rest of config
}
```

```typescript
// components/ThemeToggle.tsx
'use client'

import { useEffect, useState } from 'react'
import { MoonIcon, SunIcon } from '@heroicons/react/24/outline'

export function ThemeToggle() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light')

  useEffect(() => {
    // Load theme from localStorage
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark'
    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light'

    const initialTheme = savedTheme || systemTheme
    setTheme(initialTheme)
    document.documentElement.classList.toggle('dark', initialTheme === 'dark')
  }, [])

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light'
    setTheme(newTheme)
    localStorage.setItem('theme', newTheme)
    document.documentElement.classList.toggle('dark', newTheme === 'dark')
  }

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
      aria-label="Toggle theme"
    >
      {theme === 'light' ? (
        <MoonIcon className="w-5 h-5" />
      ) : (
        <SunIcon className="w-5 h-5" />
      )}
    </button>
  )
}
```

**Pros:**
- Full manual control
- Can store user preference
- Works with SSR (Next.js)
- Application-specific theming

**Cons:**
- Requires JavaScript
- Need to implement toggle UI
- Must handle flash of unstyled content (FOUC)

### Preventing Flash of Unstyled Content (FOUC)

Load theme detection early in the document head to prevent the flash of incorrect theme:

```typescript
// app/layout.tsx
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                const theme = localStorage.getItem('theme') ||
                  (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
                document.documentElement.classList.toggle('dark', theme === 'dark');
              })();
            `,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  )
}
```

### Using next-themes (Recommended for Next.js)

For perfect SSR support and automatic FOUC prevention:

```bash
npm install next-themes
```

```typescript
// app/providers.tsx
'use client'

import { ThemeProvider } from 'next-themes'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      {children}
    </ThemeProvider>
  )
}

// app/layout.tsx
import { Providers } from './providers'

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}

// components/ThemeToggle.tsx
'use client'

import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'

export function ThemeToggle() {
  const [mounted, setMounted] = useState(false)
  const { theme, setTheme } = useTheme()

  useEffect(() => setMounted(true), [])

  if (!mounted) return null // Avoid hydration mismatch

  return (
    <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
      {theme === 'dark' ? '☀️' : '🌙'}
    </button>
  )
}
```

## CSS Variables & Design Tokens

Using CSS variables allows you to build dark-mode supporting sites without applying tons of `dark:` classes across your codebase.

### Defining Theme Variables

```css
/* app/globals.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    /* Light mode colors (HSL format) */
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;

    --primary: 199.89 89.13% 48.04%; /* Sky blue */
    --primary-foreground: 0 0% 100%;

    --secondary: 210 40% 96.1%;
    --secondary-foreground: 222.2 47.4% 11.2%;

    --accent: 210 40% 96.1%;
    --accent-foreground: 222.2 47.4% 11.2%;

    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 0 0% 98%;

    --success: 142.1 76.2% 36.3%; /* Emerald */
    --success-foreground: 0 0% 100%;

    --card: 0 0% 100%;
    --card-foreground: 222.2 84% 4.9%;

    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 199.89 89.13% 48.04%;
  }

  .dark {
    /* Dark mode colors */
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;

    --primary: 199.89 89.13% 48.04%; /* Same sky blue */
    --primary-foreground: 222.2 47.4% 11.2%;

    --secondary: 217.2 32.6% 17.5%;
    --secondary-foreground: 210 40% 98%;

    --accent: 217.2 32.6% 17.5%;
    --accent-foreground: 210 40% 98%;

    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 210 40% 98%;

    --success: 142.1 70.6% 45.3%;
    --success-foreground: 144.9 80.4% 10%;

    --card: 222.2 84% 4.9%;
    --card-foreground: 210 40% 98%;

    --border: 217.2 32.6% 17.5%;
    --input: 217.2 32.6% 17.5%;
    --ring: 199.89 89.13% 48.04%;
  }
}
```

### Extending Tailwind Config with Variables

```javascript
// tailwind.config.js
export default {
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        success: {
          DEFAULT: 'hsl(var(--success))',
          foreground: 'hsl(var(--success-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
      },
    },
  },
}
```

### Using Design Tokens

```typescript
// Now use semantic color names
<div className="bg-background text-foreground">
  <button className="bg-primary text-primary-foreground hover:bg-primary/90">
    Submit
  </button>

  <div className="bg-card text-card-foreground border border-border">
    Card content
  </div>

  <span className="text-success">Profit: $150</span>
  <span className="text-destructive">Loss: -$50</span>
</div>
```

**Benefits:**
- Theme changes in one place (CSS variables)
- No need for `dark:` prefix on every element
- Semantic naming (background, foreground, primary)
- Automatic theme switching

## GigPro-Specific Theming

### Platform-Specific Colors

```javascript
// tailwind.config.js
export default {
  theme: {
    extend: {
      colors: {
        // Platform colors
        amazon: {
          DEFAULT: '#FF9900',
          dark: '#FF9900',
        },
        doordash: {
          DEFAULT: '#FF3008',
          dark: '#FF5038',
        },
        walmart: {
          DEFAULT: '#0071CE',
          dark: '#1E90FF',
        },
      },
    },
  },
}
```

```css
/* app/globals.css */
@layer base {
  :root {
    --amazon: 39 100% 50%; /* Orange */
    --doordash: 6 100% 51%; /* Red */
    --walmart: 207 100% 40%; /* Blue */
  }

  .dark {
    --amazon: 39 100% 50%; /* Same in dark mode */
    --doordash: 6 100% 59%; /* Slightly lighter */
    --walmart: 207 100% 56%; /* Lighter blue */
  }
}
```

### Using Platform Colors

```typescript
// Platform badge component
export function PlatformBadge({ platform }: { platform: string }) {
  const colorMap = {
    AmazonFlex: 'bg-amazon dark:bg-amazon text-white',
    DoorDash: 'bg-doordash dark:bg-doordash text-white',
    WalmartSpark: 'bg-walmart dark:bg-walmart text-white',
  }

  return (
    <span className={`px-2 py-1 rounded text-sm font-semibold ${colorMap[platform]}`}>
      {platform}
    </span>
  )
}
```

## Responsive Design Patterns

### Mobile-First Breakpoints

Tailwind uses a mobile-first breakpoint system where unprefixed utilities apply to all screen sizes, and prefixed utilities take effect at the specified breakpoint and above.

**Default Breakpoints:**
- `sm`: 640px (Small tablets)
- `md`: 768px (Tablets)
- `lg`: 1024px (Laptops)
- `xl`: 1280px (Desktops)
- `2xl`: 1536px (Large desktops)

### Custom Breakpoints

```javascript
// tailwind.config.js
export default {
  theme: {
    screens: {
      'xs': '475px',
      'sm': '640px',
      'md': '768px',
      'lg': '1024px',
      'xl': '1280px',
      '2xl': '1536px',
      '3xl': '1920px',
    },
  },
}
```

### Responsive Component Example

```typescript
// Responsive calendar grid
<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-4">
  {days.map(day => (
    <div key={day} className="aspect-square">
      {day}
    </div>
  ))}
</div>

// Responsive navigation
<nav className="flex flex-col md:flex-row gap-2 md:gap-4">
  <a href="/">Home</a>
  <a href="/expenses">Expenses</a>
  <a href="/settings">Settings</a>
</nav>

// Hide/show elements by screen size
<div className="hidden md:block">
  Desktop sidebar
</div>
<div className="block md:hidden">
  Mobile menu
</div>
```

## Component Patterns

### Reusable Button Component

```typescript
import { cva, type VariantProps } from 'class-variance-authority'
import { forwardRef, ButtonHTMLAttributes } from 'react'

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-lg font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none',
  {
    variants: {
      variant: {
        primary: 'bg-primary text-primary-foreground hover:bg-primary/90 focus:ring-primary',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80 focus:ring-secondary',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90 focus:ring-destructive',
        outline: 'border border-border bg-background hover:bg-accent focus:ring-primary',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
      },
      size: {
        sm: 'px-3 py-1.5 text-sm',
        md: 'px-4 py-2 text-base',
        lg: 'px-6 py-3 text-lg',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
)

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={buttonVariants({ variant, size, className })}
        {...props}
      />
    )
  }
)

Button.displayName = 'Button'

// Usage
<Button variant="primary" size="lg">
  Add Income
</Button>
<Button variant="destructive">
  Delete
</Button>
<Button variant="outline" size="sm">
  Cancel
</Button>
```

### Card Component

```typescript
import { HTMLAttributes, forwardRef } from 'react'
import { cn } from '@/lib/utils'

export const Card = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'rounded-lg border border-border bg-card text-card-foreground shadow-sm',
        className
      )}
      {...props}
    />
  )
)

export const CardHeader = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('flex flex-col space-y-1.5 p-6', className)}
      {...props}
    />
  )
)

export const CardTitle = forwardRef<HTMLHeadingElement, HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn('text-2xl font-semibold leading-none tracking-tight', className)}
      {...props}
    />
  )
)

export const CardContent = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('p-6 pt-0', className)} {...props} />
  )
)

// Usage
<Card>
  <CardHeader>
    <CardTitle>Daily Summary</CardTitle>
  </CardHeader>
  <CardContent>
    <p>Income: $150</p>
    <p>Expenses: $30</p>
    <p>Profit: $120</p>
  </CardContent>
</Card>
```

### Input Component

```typescript
import { forwardRef, InputHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, ...props }, ref) => {
    return (
      <div className="space-y-2">
        {label && (
          <label htmlFor={props.id} className="block text-sm font-medium">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={cn(
            'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm',
            'placeholder:text-muted-foreground',
            'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
            'disabled:cursor-not-allowed disabled:opacity-50',
            error && 'border-destructive focus:ring-destructive',
            className
          )}
          {...props}
        />
        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'

// Usage
<Input
  label="Amount"
  type="number"
  placeholder="0.00"
  error={errors.amount?.message}
/>
```

## Custom Utilities and Plugins

### Creating Custom Utilities

```javascript
// tailwind.config.js
import plugin from 'tailwindcss/plugin'

export default {
  plugins: [
    plugin(function({ addUtilities }) {
      addUtilities({
        '.scrollbar-hide': {
          /* IE and Edge */
          '-ms-overflow-style': 'none',
          /* Firefox */
          'scrollbar-width': 'none',
          /* Safari and Chrome */
          '&::-webkit-scrollbar': {
            display: 'none'
          }
        }
      })
    }),
    plugin(function({ addUtilities }) {
      addUtilities({
        '.text-balance': {
          'text-wrap': 'balance',
        },
      })
    }),
  ],
}

// Usage
<div className="overflow-y-auto scrollbar-hide">
  Scrollable content without scrollbar
</div>
```

### Custom Component Plugin

```javascript
// tailwind.config.js
import plugin from 'tailwindcss/plugin'

export default {
  plugins: [
    plugin(function({ addComponents, theme }) {
      addComponents({
        '.btn': {
          padding: `${theme('spacing.2')} ${theme('spacing.4')}`,
          borderRadius: theme('borderRadius.lg'),
          fontWeight: theme('fontWeight.semibold'),
          transition: 'all 0.2s',
          '&:hover': {
            opacity: 0.9,
          },
        },
        '.btn-primary': {
          backgroundColor: theme('colors.primary.DEFAULT'),
          color: theme('colors.primary.foreground'),
        },
        '.btn-secondary': {
          backgroundColor: theme('colors.secondary.DEFAULT'),
          color: theme('colors.secondary.foreground'),
        },
      })
    }),
  ],
}

// Usage (without CVA)
<button className="btn btn-primary">Submit</button>
```

## Animation Patterns

### Transition Utilities

```typescript
// Smooth hover effects
<button className="transition-colors duration-200 hover:bg-primary/90">
  Hover me
</button>

// Transform on hover
<div className="transition-transform duration-300 hover:scale-105">
  Scale on hover
</div>

// Multiple transitions
<div className="transition-all duration-300 ease-in-out hover:shadow-lg hover:-translate-y-1">
  Lift and shadow
</div>
```

### Custom Animations

```javascript
// tailwind.config.js
export default {
  theme: {
    extend: {
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in',
        'slide-in': 'slideIn 0.3s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideIn: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
}

// Usage
<div className="animate-fade-in">
  Fades in on mount
</div>
```

## Performance Optimization

### PurgeCSS Configuration

```javascript
// tailwind.config.js
export default {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  // Tailwind automatically purges unused classes
}
```

### Dynamic Class Names

```typescript
// Bad - class won't be detected
const color = 'blue'
<div className={`text-${color}-500`}>Text</div>

// Good - complete class name
const colorClass = color === 'blue' ? 'text-blue-500' : 'text-red-500'
<div className={colorClass}>Text</div>

// Good - safelist if absolutely necessary
// tailwind.config.js
export default {
  safelist: [
    'text-amazon',
    'text-doordash',
    'text-walmart',
    'bg-amazon',
    'bg-doordash',
    'bg-walmart',
  ],
}
```

## Best Practices

### 1. Use Semantic Class Names with CSS Variables

Instead of `bg-blue-500`, use `bg-primary` with CSS variables for easier theming.

### 2. Mobile-First Approach

Always start with mobile styles, then enhance for larger screens:

```typescript
// Good
<div className="flex flex-col md:flex-row">

// Bad
<div className="flex-row sm:flex-col">
```

### 3. Avoid @apply Overuse

Use `@apply` sparingly, only for frequently repeated patterns:

```css
/* Good use case */
@layer components {
  .card {
    @apply rounded-lg border border-border bg-card p-6;
  }
}

/* Bad - just use utility classes directly */
@layer components {
  .my-button {
    @apply px-4 py-2 bg-blue-500 text-white rounded;
  }
}
```

### 4. Component-First Architecture

Create reusable components with TypeScript for type safety:

```typescript
// Good
<Button variant="primary" size="lg" onClick={handleClick}>
  Submit
</Button>

// Bad
<button className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
  Submit
</button>
```

### 5. Consistent Spacing Scale

Stick to Tailwind's spacing scale (4px increments):

```typescript
// Good
<div className="p-4 mt-6 mb-8">

// Bad
<div style={{ padding: '15px', marginTop: '23px' }}>
```

## Key Takeaways

1. **Use Class Strategy**: Enable manual theme control with `darkMode: 'class'`
2. **CSS Variables**: Define design tokens for theme-independent components
3. **Prevent FOUC**: Load theme detection script early or use next-themes
4. **Mobile-First**: Always start with mobile styles, enhance for desktop
5. **Component Library**: Build reusable components with CVA for variant management
6. **Custom Utilities**: Create plugins for frequently used patterns
7. **Semantic Colors**: Use `bg-primary`, not `bg-blue-500` for easier theming
8. **Performance**: Let Tailwind's purge remove unused classes automatically
9. **Type Safety**: Use TypeScript with CVA for component prop types
10. **Responsive Design**: Leverage Tailwind's breakpoint system for all screen sizes

## References

- [Dark Mode - Tailwind CSS Documentation](https://tailwindcss.com/docs/dark-mode)
- [TailwindCSS Best Practices - James Shopland](https://www.jamesshopland.com/blog/tailwind-css-best-practices/)
- [The Ultimate Guide to Dark Mode Layouts in 2025 - Bootcamp](https://medium.com/design-bootcamp/the-ultimate-guide-to-implementing-dark-mode-in-2025-bbf2938d2526)
- [Tailwind CSS Dark Mode - Flowbite](https://flowbite.com/docs/customize/dark-mode/)
- [Dark Mode with Design Tokens in Tailwind CSS](https://www.richinfante.com/2024/10/21/tailwind-dark-mode-design-tokens-themes-css)
- [Responsive Design - Tailwind CSS](https://tailwindcss.com/docs/responsive-design)
- [Configuration - Tailwind CSS](https://tailwindcss.com/docs/configuration)
- [Plugins - Tailwind CSS](https://tailwindcss.com/docs/plugins)
- [Creating a Scalable Design System with Tailwind - Bomberbot](https://www.bomberbot.com/design-systems/creating-a-scalable-design-system-in-next-js-with-tailwind-css-and-class-variance-authority/)
- [Building Reusable React Components with Tailwind - LogRocket](https://blog.logrocket.com/building-reusable-react-components-using-tailwind-css/)
- [Tailwind Best Practices 2024 - UXPin](https://www.uxpin.com/studio/blog/tailwind-best-practices/)
