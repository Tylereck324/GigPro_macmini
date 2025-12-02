# Quick Reference Guide - Responsive Design

## New CSS Utilities Available

### Responsive Typography
Use fluid typography that scales with viewport:

```css
/* In your components/CSS */
font-size: var(--font-size-xs);    /* clamp(0.75rem, 2vw, 0.875rem) */
font-size: var(--font-size-sm);    /* clamp(0.875rem, 2.5vw, 1rem) */
font-size: var(--font-size-base);  /* clamp(1rem, 2.5vw, 1.125rem) */
font-size: var(--font-size-lg);    /* clamp(1.125rem, 3vw, 1.25rem) */
font-size: var(--font-size-xl);    /* clamp(1.25rem, 3.5vw, 1.5rem) */
font-size: var(--font-size-2xl);   /* clamp(1.5rem, 4vw, 2rem) */
font-size: var(--font-size-3xl);   /* clamp(2rem, 5vw, 3rem) */
```

### Responsive Spacing
Use fluid spacing that adapts to screen size:

```css
padding: var(--spacing-xs);   /* clamp(0.25rem, 1vw, 0.5rem) */
padding: var(--spacing-sm);   /* clamp(0.5rem, 1.5vw, 0.75rem) */
padding: var(--spacing-md);   /* clamp(0.75rem, 2vw, 1rem) */
padding: var(--spacing-lg);   /* clamp(1rem, 2.5vw, 1.5rem) */
padding: var(--spacing-xl);   /* clamp(1.5rem, 3vw, 2rem) */
padding: var(--spacing-2xl);  /* clamp(2rem, 4vw, 3rem) */
```

### Modern Grid Layouts
Create responsive grids without media queries:

```html
<!-- Auto-fit grid - columns automatically adjust -->
<div class="grid-responsive">
  <!-- Items automatically fit, minimum 250px per column -->
</div>

<!-- Auto-fill grid - fills all available space -->
<div class="grid-auto-fill">
  <!-- Items fill space, minimum 200px per column -->
</div>
```

### Container Queries
Make components respond to their container size:

```tsx
// In your React component
<Card containerQuery>
  <div className="content">
    {/* Content adapts to card size, not viewport */}
  </div>
</Card>
```

Or with plain HTML:

```html
<div class="container-query">
  <!-- This div's children can respond to its size -->
  <div class="content">...</div>
</div>
```

### Flexbox Utilities

```html
<div class="flex-responsive">
  <!-- Items wrap and have gap spacing -->
</div>
```

## Tailwind Classes - Updated Breakpoints

Mobile-first breakpoints now available:

```tsx
// Extra small devices (large phones)
className="xs:text-lg"

// Small devices (tablets)
className="sm:grid-cols-2"

// Medium devices (small laptops)
className="md:grid-cols-3 md:flex-row"

// Large devices (desktops)
className="lg:grid-cols-4"

// Extra large devices
className="xl:grid-cols-5"

// 2X large devices
className="2xl:grid-cols-6"
```

## Accessibility Classes

### Focus Indicators
All interactive elements automatically have focus indicators. For enhanced focus:

```tsx
<button className="focus-ring">
  Enhanced Focus Button
</button>
```

### Touch Targets
All buttons and interactive elements automatically meet the 44x44px minimum. No additional classes needed!

### Reduced Motion
Users with motion sensitivity preferences are automatically accommodated. Animations will be disabled for them.

## Image Best Practices

### Responsive Images

```tsx
// Basic responsive image
<img src="photo.jpg" alt="Description" />
// Automatically: max-width: 100%, height: auto

// With aspect ratio container
<div className="image-container" style={{ aspectRatio: '16/9' }}>
  <img src="photo.jpg" alt="Description" />
</div>
```

### Preventing Layout Shift

```tsx
// Always specify width/height or aspect ratio
<div style={{ aspectRatio: '4/3', width: '100%' }}>
  <img src="image.jpg" alt="Description" />
</div>
```

## Component Patterns

### Responsive Card

```tsx
import { Card } from '@/components/ui/Card';

// Standard responsive card
<Card padding="md">
  <h2>Card Title</h2>
  <p>Card content</p>
</Card>

// Card with container queries
<Card containerQuery padding="lg">
  {/* This card adapts based on its container size */}
</Card>
```

### Responsive Layout Example

```tsx
export function MyComponent() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
        <Card>Content 1</Card>
        <Card>Content 2</Card>
        <Card>Content 3</Card>
      </div>
    </div>
  );
}
```

## Common Patterns

### Mobile-First Navigation

```tsx
// Mobile: Stacked menu
// Desktop: Horizontal menu
<nav className="flex flex-col md:flex-row gap-2 md:gap-4">
  <a href="/">Home</a>
  <a href="/about">About</a>
  <a href="/contact">Contact</a>
</nav>
```

### Responsive Grid

```tsx
// 1 column on mobile, 2 on tablet, 3 on desktop, 4 on large screens
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
  {items.map(item => <Card key={item.id}>{item.content}</Card>)}
</div>
```

### Responsive Typography

```tsx
// Mobile: smaller, Desktop: larger
<h1 className="text-2xl md:text-3xl lg:text-4xl font-bold">
  Responsive Heading
</h1>

// Or use fluid typography
<h1 style={{ fontSize: 'var(--font-size-3xl)' }}>
  Fluid Heading
</h1>
```

## Performance Tips

1. **Use Fluid Typography**: Reduces the number of media queries needed
2. **Container Queries**: Better for component reusability
3. **Mobile-First**: Write base styles for mobile, enhance for desktop
4. **Lazy Load Images**: Use `loading="lazy"` for below-fold images
5. **Aspect Ratios**: Always set to prevent layout shift

## Testing Checklist

- [ ] Test on Chrome DevTools responsive mode (Cmd/Ctrl + Shift + M)
- [ ] Test all breakpoints: 320px, 480px, 768px, 1024px, 1280px
- [ ] Tab through page to verify focus indicators
- [ ] Enable "Reduce motion" in OS settings to test animations
- [ ] Test with screen reader
- [ ] Check touch target sizes on mobile device
- [ ] Verify no horizontal scrolling on any viewport

## Common Gotchas

1. **Don't mix px and rem unnecessarily** - Use relative units
2. **Test real devices** - Simulators don't catch everything
3. **Check touch targets** - Should be minimum 44x44px
4. **Verify focus indicators** - Ensure they're visible on all backgrounds
5. **Test with actual content** - Lorem ipsum hides real issues

## Need Help?

- Check `/RESPONSIVE_IMPROVEMENTS.md` for detailed documentation
- Review `/practices/responsive.md` for responsive design principles
- Review `/practices/modern.md` for modern CSS standards
- Look at existing components in `/src/components/ui/` for examples

---

Last Updated: 2025-11-30
