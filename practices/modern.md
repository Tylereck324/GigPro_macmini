# Modern Web Standards: Comprehensive Guide 2024-2025

## Core Modern CSS Features

Modern CSS has evolved significantly, providing powerful layout systems, improved styling capabilities, and enhanced developer experience. This guide covers the essential features every web developer should master in 2024-2025.

## CSS Grid: Two-Dimensional Layout Mastery

### Overview

CSS Grid is a two-dimensional layout system that allows manipulation of both columns and rows simultaneously. With 96%+ browser support, it has become the foundation for modern web layouts.

### Key Advantages

- **Two-dimensional control:** Manage both rows and columns in a single container
- **Responsive by design:** Automatically adjusts and reorganizes content based on screen size
- **Overlapping capabilities:** Overlap grid items without complex hacks
- **Simplified complex layouts:** Create sophisticated layouts with minimal code

### Basic Grid Setup

```css
.grid-container {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: auto;
  gap: 1.5rem;
}
```

### Auto-Fit and Auto-Fill

```css
/* Automatically creates columns based on available space */
.responsive-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
}

/* auto-fill creates empty tracks, auto-fit collapses them */
.dense-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1rem;
}
```

### Grid Areas for Named Layouts

```css
.layout {
  display: grid;
  grid-template-areas:
    "header header header"
    "sidebar content aside"
    "footer footer footer";
  grid-template-columns: 200px 1fr 200px;
  grid-template-rows: auto 1fr auto;
  gap: 1rem;
  min-height: 100vh;
}

.header { grid-area: header; }
.sidebar { grid-area: sidebar; }
.content { grid-area: content; }
.aside { grid-area: aside; }
.footer { grid-area: footer; }

@media (max-width: 768px) {
  .layout {
    grid-template-areas:
      "header"
      "content"
      "sidebar"
      "aside"
      "footer";
    grid-template-columns: 1fr;
  }
}
```

### Subgrid for Nested Control

```css
.parent-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
}

.child-grid {
  display: grid;
  grid-template-columns: subgrid;
  grid-column: span 3;
}
```

Subgrid allows nested grids to inherit their parent's track sizing, ensuring perfect alignment across nested structures.

### Advanced Grid Techniques

**Asymmetric Layouts:**
```css
.magazine-layout {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  grid-auto-rows: 200px;
  gap: 1rem;
}

.featured {
  grid-column: span 4;
  grid-row: span 2;
}

.standard {
  grid-column: span 2;
}
```

**Grid with Minimum and Maximum Tracks:**
```css
.flexible-grid {
  display: grid;
  grid-template-columns: minmax(200px, 1fr) minmax(300px, 2fr) minmax(200px, 1fr);
  gap: 1.5rem;
}
```

## Flexbox: One-Dimensional Layout Power

### Overview

Flexbox excels at laying out items in a single direction (row or column). It remains the go-to solution for navigation bars, toolbars, card layouts, and component alignment.

### When to Use Flexbox vs Grid

**Use Flexbox when:**
- Working with a single dimension (row or column)
- Content size should determine layout
- You need to align items along one axis
- Building navigation, toolbars, or card rows

**Use Grid when:**
- Working with two dimensions (rows and columns)
- Layout should determine content size
- You need precise placement control
- Building page layouts or complex grids

### Flexbox Fundamentals

```css
.flex-container {
  display: flex;
  flex-direction: row; /* or column */
  justify-content: space-between; /* main axis alignment */
  align-items: center; /* cross axis alignment */
  gap: 1rem;
}

.flex-item {
  flex: 1; /* flex-grow: 1, flex-shrink: 1, flex-basis: 0 */
}
```

### Responsive Navigation Pattern

```css
.navbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  flex-wrap: wrap;
}

.nav-links {
  display: flex;
  gap: 2rem;
  list-style: none;
}

@media (max-width: 768px) {
  .navbar {
    flex-direction: column;
  }

  .nav-links {
    flex-direction: column;
    width: 100%;
    text-align: center;
  }
}
```

### Advanced Flexbox Patterns

**The Media Object:**
```css
.media-object {
  display: flex;
  gap: 1rem;
}

.media-image {
  flex-shrink: 0;
  width: 150px;
}

.media-content {
  flex: 1;
  min-width: 0; /* Prevents overflow */
}
```

**Equal Height Cards:**
```css
.card-container {
  display: flex;
  gap: 1.5rem;
  flex-wrap: wrap;
}

.card {
  display: flex;
  flex-direction: column;
  flex: 1 1 300px;
}

.card-content {
  flex: 1;
}

.card-footer {
  margin-top: auto;
}
```

## Container Queries: The Future of Responsive Design

### Overview

Container queries allow elements to respond to their parent container's size instead of the viewport, enabling truly modular and reusable components.

### Browser Support (2025)

Container queries achieved widespread support in 2023 and are now standard in modern browsers (Chrome 105+, Safari 16+, Firefox 110+, Edge 105+).

### Basic Implementation

```css
/* Define a container */
.card-wrapper {
  container-type: inline-size;
  container-name: card;
}

/* Query the container */
@container card (min-width: 400px) {
  .card {
    display: grid;
    grid-template-columns: 200px 1fr;
  }
}

@container card (min-width: 600px) {
  .card {
    grid-template-columns: 250px 1fr;
    padding: 2rem;
  }
}
```

### Container Types

```css
/* inline-size: queries container's width (most common) */
.container {
  container-type: inline-size;
}

/* size: queries both width and height */
.container {
  container-type: size;
}

/* normal: no container queries */
.container {
  container-type: normal;
}
```

### Practical Example: Responsive Card Component

```css
.product-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
}

.product-card {
  container-type: inline-size;
  container-name: product;
  border: 1px solid #ddd;
  border-radius: 8px;
  overflow: hidden;
}

/* Default layout for narrow containers */
.product-info {
  padding: 1rem;
}

/* Switch to horizontal layout when container is wide */
@container product (min-width: 400px) {
  .product-card {
    display: grid;
    grid-template-columns: 40% 60%;
  }
}

/* Larger text and spacing in bigger containers */
@container product (min-width: 500px) {
  .product-title {
    font-size: 1.5rem;
  }

  .product-info {
    padding: 2rem;
  }
}
```

### Container Query Units

```css
.container {
  container-type: inline-size;
}

.element {
  /* cqw: 1% of container's width */
  font-size: clamp(1rem, 2cqw, 2rem);

  /* cqh: 1% of container's height */
  padding: 2cqh;

  /* cqi: 1% of container's inline size */
  margin: 1cqi;

  /* cqb: 1% of container's block size */
  /* cqmin, cqmax: min/max of width and height */
}
```

## Modern CSS Nesting

### Native CSS Nesting (2024+)

CSS now supports native nesting, making stylesheets more intuitive and maintainable:

```css
.card {
  padding: 1rem;
  border: 1px solid #ddd;

  & .title {
    font-size: 1.5rem;
    font-weight: bold;
  }

  & .description {
    color: #666;
    margin-top: 0.5rem;
  }

  &:hover {
    border-color: #0066cc;

    & .title {
      color: #0066cc;
    }
  }

  @media (min-width: 768px) {
    & {
      padding: 2rem;
    }
  }
}
```

### Nesting Without Ampersand

```css
.navigation {
  ul {
    list-style: none;

    li {
      display: inline-block;

      a {
        text-decoration: none;
        padding: 0.5rem 1rem;

        &:hover {
          background: #f0f0f0;
        }
      }
    }
  }
}
```

## The :has() Pseudo-Class (Parent Selector)

### Overview

The `:has()` pseudo-class allows styling based on the presence of child or descendant elements, often called the "parent selector."

### Practical Applications

```css
/* Style a card that contains an image */
.card:has(img) {
  display: grid;
  grid-template-columns: 200px 1fr;
}

/* Style a form that has invalid inputs */
form:has(input:invalid) {
  border: 2px solid red;
}

/* Style parent when child is focused */
.form-group:has(input:focus) {
  background: #f0f8ff;
}

/* Conditional layouts */
.container:has(.sidebar) {
  display: grid;
  grid-template-columns: 250px 1fr;
}

.container:not(:has(.sidebar)) {
  max-width: 800px;
  margin: 0 auto;
}
```

### Advanced :has() Patterns

```css
/* Next sibling selector alternative */
li:has(+ li.active) {
  border-bottom: none;
}

/* Quantity queries */
ul:has(> li:nth-child(6)) li {
  /* Styles when list has 6+ items */
  font-size: 0.9rem;
}

/* Empty state handling */
.list:not(:has(li)) {
  &::after {
    content: "No items to display";
    display: block;
    padding: 2rem;
    text-align: center;
    color: #999;
  }
}
```

## Progressive Enhancement and Graceful Degradation

### Progressive Enhancement (Recommended)

Progressive enhancement builds a baseline experience first, then enhances for capable browsers:

```css
/* Layer 1: Baseline - Works everywhere */
.layout {
  padding: 1rem;
}

/* Layer 2: Enhanced styling for modern browsers */
@supports (display: grid) {
  .layout {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 1.5rem;
  }
}

/* Layer 3: Advanced features */
@supports (container-type: inline-size) {
  .card {
    container-type: inline-size;
  }

  @container (min-width: 400px) {
    .card-content {
      display: flex;
    }
  }
}
```

### Feature Detection with @supports

```css
/* Check for Grid support */
@supports (display: grid) {
  .container {
    display: grid;
  }
}

/* Check for multiple properties */
@supports (display: grid) and (gap: 1rem) {
  .container {
    display: grid;
    gap: 1rem;
  }
}

/* Fallback for older browsers */
@supports not (display: grid) {
  .container {
    display: flex;
    flex-wrap: wrap;
  }

  .item {
    flex: 0 0 calc(33.333% - 1rem);
    margin: 0.5rem;
  }
}
```

### Progressive Enhancement Strategy

**Layer 1: HTML Foundation**
```html
<!-- Semantic, accessible HTML that works without CSS/JS -->
<article class="product">
  <img src="product.jpg" alt="Product name">
  <h2>Product Title</h2>
  <p>Description of the product...</p>
  <a href="/product/123">View Details</a>
</article>
```

**Layer 2: CSS Enhancement**
```css
/* Basic styling for all browsers */
.product {
  border: 1px solid #ddd;
  padding: 1rem;
}

/* Enhanced for Grid-capable browsers */
@supports (display: grid) {
  .products {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 1.5rem;
  }
}

/* Advanced features for modern browsers */
@supports (container-type: inline-size) {
  .product {
    container-type: inline-size;
  }

  @container (min-width: 400px) {
    .product {
      display: grid;
      grid-template-columns: 150px 1fr;
    }
  }
}
```

**Layer 3: JavaScript Enhancement**
```javascript
// Feature detection before enhancement
if ('IntersectionObserver' in window) {
  // Lazy loading with Intersection Observer
  const images = document.querySelectorAll('img[data-src]');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.src = entry.target.dataset.src;
        observer.unobserve(entry.target);
      }
    });
  });

  images.forEach(img => observer.observe(img));
}
```

## Modern Performance Techniques

### 1. Critical CSS

```html
<!DOCTYPE html>
<html>
<head>
  <style>
    /* Inline critical CSS for above-the-fold content */
    .header { display: flex; justify-content: space-between; }
    .hero { min-height: 400px; background: #0066cc; }
  </style>

  <!-- Async load remaining CSS -->
  <link rel="preload" href="/css/main.css" as="style" onload="this.rel='stylesheet'">
  <noscript><link rel="stylesheet" href="/css/main.css"></noscript>
</head>
```

### 2. CSS Containment

```css
.card {
  contain: layout style paint;
  /* Tells browser this element's contents don't affect outside layout */
}

.independent-section {
  contain: content;
  /* Layout + style + paint containment */
}
```

### 3. will-change Optimization

```css
.animated-element {
  will-change: transform, opacity;
  /* Hints to browser about upcoming changes */
}

/* Remove after animation completes */
.animated-element.animation-done {
  will-change: auto;
}
```

### 4. content-visibility

```css
.long-article section {
  content-visibility: auto;
  contain-intrinsic-size: 0 500px;
  /* Defers rendering of off-screen content */
}
```

## Modern JavaScript Framework Integration

### React with Modern CSS

```jsx
// CSS Modules with modern features
import styles from './Card.module.css';

function Card({ title, description, image }) {
  return (
    <div className={styles.card}>
      {image && <img src={image} alt="" />}
      <div className={styles.content}>
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
    </div>
  );
}
```

```css
/* Card.module.css */
.card {
  container-type: inline-size;
  border-radius: 8px;
  overflow: hidden;
}

@container (min-width: 400px) {
  .card {
    display: grid;
    grid-template-columns: 40% 60%;
  }
}
```

### Vue with Scoped Styles

```vue
<template>
  <div class="product-grid">
    <div class="product" v-for="product in products" :key="product.id">
      <img :src="product.image" :alt="product.name">
      <h3>{{ product.name }}</h3>
      <p>{{ product.description }}</p>
    </div>
  </div>
</template>

<style scoped>
.product-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
}

.product {
  container-type: inline-size;
}

@container (min-width: 350px) {
  .product {
    display: flex;
    gap: 1rem;
  }
}
</style>
```

### Responsive Hooks and Utilities

```javascript
// Modern matchMedia API usage
function useMediaQuery(query) {
  const [matches, setMatches] = React.useState(
    window.matchMedia(query).matches
  );

  React.useEffect(() => {
    const media = window.matchMedia(query);
    const listener = (e) => setMatches(e.matches);

    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  }, [query]);

  return matches;
}

// Usage
function ResponsiveComponent() {
  const isMobile = useMediaQuery('(max-width: 768px)');
  const isDesktop = useMediaQuery('(min-width: 1024px)');

  return (
    <div>
      {isMobile && <MobileLayout />}
      {isDesktop && <DesktopLayout />}
    </div>
  );
}
```

## Modern CSS Custom Properties (Variables)

### Dynamic Theming

```css
:root {
  --primary-color: #0066cc;
  --secondary-color: #ff6600;
  --spacing-unit: 8px;
  --container-max-width: 1200px;
}

.card {
  padding: calc(var(--spacing-unit) * 2);
  border: 2px solid var(--primary-color);
}

/* Dark mode support */
@media (prefers-color-scheme: dark) {
  :root {
    --primary-color: #4da6ff;
    --background: #1a1a1a;
    --text: #ffffff;
  }
}
```

### Responsive Custom Properties

```css
:root {
  --font-size-base: 16px;
  --spacing: 1rem;
}

@media (min-width: 768px) {
  :root {
    --font-size-base: 18px;
    --spacing: 1.5rem;
  }
}

@media (min-width: 1024px) {
  :root {
    --font-size-base: 20px;
    --spacing: 2rem;
  }
}

body {
  font-size: var(--font-size-base);
}

.container {
  padding: var(--spacing);
}
```

## Accessibility in Modern Web Standards

### WCAG 2.2 Compliance (2024)

```css
/* Sufficient color contrast (4.5:1 for normal text) */
.button {
  background: #0066cc;
  color: #ffffff;
}

/* Visible focus indicators */
a:focus, button:focus {
  outline: 2px solid #0066cc;
  outline-offset: 2px;
}

/* Respect user motion preferences */
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}

/* Support for forced colors (high contrast mode) */
@media (forced-colors: active) {
  .button {
    border: 2px solid currentColor;
  }
}
```

### ARIA and Modern HTML

```html
<!-- Proper semantic HTML with ARIA enhancements -->
<nav aria-label="Main navigation">
  <ul role="list">
    <li><a href="/" aria-current="page">Home</a></li>
    <li><a href="/about">About</a></li>
    <li><a href="/contact">Contact</a></li>
  </ul>
</nav>

<!-- Accessible responsive images -->
<picture>
  <source media="(min-width: 1024px)" srcset="large.jpg">
  <source media="(min-width: 768px)" srcset="medium.jpg">
  <img src="small.jpg" alt="Descriptive alt text" loading="lazy">
</picture>

<!-- Skip links for keyboard navigation -->
<a href="#main-content" class="skip-link">Skip to main content</a>
```

## Key Takeaways

1. **CSS Grid for Layouts:** Use Grid for two-dimensional layouts with precise control over rows and columns
2. **Flexbox for Components:** Use Flexbox for one-dimensional layouts and component-level alignment
3. **Container Queries:** Implement container queries for truly modular, reusable components
4. **Progressive Enhancement:** Build a solid baseline and layer modern features on top
5. **Native Nesting:** Use CSS nesting to organize stylesheets more intuitively
6. **:has() Selector:** Leverage parent selectors for powerful conditional styling
7. **Performance First:** Use containment, content-visibility, and critical CSS for optimal performance
8. **Accessibility Always:** Ensure WCAG 2.2 compliance with proper focus indicators and motion preferences
9. **Modern Features Detection:** Use @supports to provide fallbacks for older browsers
10. **Custom Properties:** Utilize CSS variables for theming and responsive design systems

## Resources

- [Building a Responsive Layout in 2025: CSS Grid vs Flexbox vs Container Queries](https://dev.to/smriti_webdev/building-a-responsive-layout-in-2025-css-grid-vs-flexbox-vs-container-queries-234m)
- [New CSS Features You Need to Know in 2025](https://www.geeksforgeeks.org/css/modern-css-features-you-need-to-know-in-2024/)
- [Container Query Solutions with CSS Grid and Flexbox](https://moderncss.dev/container-query-solutions-with-css-grid-and-flexbox/)
- [Progressive Enhancement - MDN Web Docs](https://developer.mozilla.org/en-US/docs/Glossary/Progressive_Enhancement)
- [Graceful Degradation vs Progressive Enhancement - W3C](https://www.w3.org/wiki/Graceful_degradation_versus_progressive_enhancement)
- [ARIA - Accessibility - MDN Web Docs](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA)

---

## Tailwind CSS v4.0 - 2024/2025 Features (Updated: December-2024-15:25)

Tailwind CSS v4.0 represents a complete rewrite with dramatic performance improvements and modern CSS features.

### Performance Improvements

**Build Speed:**
- Full rebuilds: 3.5x faster
- Incremental builds: 8x faster
- Incremental builds without new CSS: 100x faster

These improvements are critical for Next.js development, where fast feedback loops improve developer experience.

### New Utilities

**1. Inset Shadow & Ring Utilities:**

```html
<!-- Stack box shadows with inset variants -->
<div class="shadow-lg inset-shadow-sm inset-ring-1 inset-ring-gray-200">
  Card with multiple shadow layers
</div>
```

**2. Field Sizing Utilities:**

Auto-resizing textareas based on content:

```html
<textarea class="field-sizing-content resize-none">
  Automatically grows with content
</textarea>
```

**3. Font Stretch Utilities (Variable Fonts):**

```html
<h1 class="font-stretch-expanded font-variable">
  Stretched heading with variable font
</h1>
```

**4. Color Scheme Utilities:**

Control scrollbar appearance in light/dark mode:

```html
<div class="color-scheme-dark overflow-auto">
  Content with dark scrollbars
</div>
```

**5. 3D Transform Utilities:**

Direct 3D transformations in HTML:

```html
<div class="rotate-x-45 rotate-y-30 perspective-1000">
  3D transformed card
</div>
```

**6. Extended Gradient APIs:**

```html
<!-- Radial gradients -->
<div class="bg-gradient-radial from-blue-500 to-purple-600">
  Radial gradient background
</div>

<!-- Conic gradients -->
<div class="bg-gradient-conic from-red-500 via-yellow-500 to-green-500">
  Color wheel effect
</div>
```

### OKLCH Color Space

Tailwind v4 introduces a modernized color palette using OKLCH, providing more vivid colors on displays with P3 color gamut support.

**Benefits:**
- Perceptually uniform colors
- Better color consistency across hues
- Supports P3 wide color gamut
- More vibrant blues, greens, and cyans

```css
/* Tailwind v4 generates OKLCH by default */
.bg-blue-500 {
  background-color: oklch(0.6 0.2 250);
}
```

### New Variants

**1. `inert` Variant:**

Style non-interactive elements:

```html
<dialog class="inert:opacity-50 inert:pointer-events-none">
  Modal content
</dialog>
```

**2. `nth-*` Variants:**

Advanced nth-child styling:

```html
<ul>
  <li class="nth-[odd]:bg-gray-100 nth-[3n]:font-bold">
    Advanced list styling
  </li>
</ul>
```

**3. `in-*` Variant:**

Similar to `group-*` but without requiring a wrapper:

```html
<div class="in-modal:p-4 in-sidebar:text-sm">
  Context-aware styling
</div>
```

**4. Descendant Variant:**

Style descendants based on parent state:

```html
<div class="hover:descendant-button:bg-blue-600">
  <button>Styled on parent hover</button>
</div>
```

### CSS-First Configuration

Tailwind v4 moves to CSS-based configuration using CSS variables:

```css
/* app/globals.css */
@import "tailwindcss";

@theme {
  /* Custom breakpoints */
  --breakpoint-3xl: 1920px;

  /* Custom colors */
  --color-brand: oklch(0.6 0.3 230);

  /* Custom spacing */
  --spacing-huge: 128px;

  /* Custom fonts */
  --font-brand: "Inter", sans-serif;
}
```

**All design tokens are available as CSS variables by default:**

```css
.custom-component {
  color: var(--color-blue-500);
  padding: var(--spacing-4);
  font-family: var(--font-sans);
}
```

### Tailwind v4 Responsive Patterns for GigPro

```tsx
// Next.js 14 + Tailwind v4 component
export function IncomeCard({ amount, date }) {
  return (
    <div className="
      /* Mobile-first base styles */
      p-4 rounded-lg
      bg-gradient-radial from-green-50 to-white
      inset-shadow-sm inset-ring-1 inset-ring-green-200

      /* Tablet breakpoint */
      md:p-6 md:rounded-xl

      /* Desktop breakpoint */
      lg:p-8

      /* Custom 3xl breakpoint */
      3xl:p-10

      /* Container query variant */
      @container-md:flex-row @container-md:items-center

      /* Interaction states */
      hover:inset-shadow-md
      active:scale-98

      /* Accessibility */
      focus-visible:ring-2 focus-visible:ring-green-500
      focus-visible:ring-offset-2

      /* Dark mode */
      dark:from-green-950 dark:to-gray-900
      dark:inset-ring-green-800
    ">
      <span className="text-2xl font-stretch-condensed font-bold">
        ${amount}
      </span>
      <time className="text-sm color-scheme-dark">{date}</time>
    </div>
  )
}
```

---

## Advanced Accessibility Features (WCAG 2.4.13 & Beyond)

### Focus-Visible and Advanced Focus Indicators

**WCAG Success Criteria:**

- **2.4.7 Focus Visible (Level AA):** Any keyboard operable interface must have a visible focus indicator
- **2.4.13 Focus Appearance (Level AAA):** Focus indicator must be:
  - At least 2 CSS pixels thick
  - Have 3:1 contrast ratio between focused and unfocused states
  - At least as large as a 2px perimeter of the unfocused component

**Modern CSS Implementation:**

```css
/* Two-color focus indicator for guaranteed contrast */
/* Uses two colors with 9:1 contrast to ensure 3:1 against any background */
:focus-visible {
  outline: 2px solid white;
  outline-offset: 2px;
  box-shadow: 0 0 0 4px black;
}

/* Alternative: use Tailwind v4 utilities */
.focus-visible:outline-2 .focus-visible:outline-white
.focus-visible:outline-offset-2 .focus-visible:ring-4
.focus-visible:ring-black
```

**Advanced focus-visible patterns:**

```css
/* Only show focus on keyboard navigation, not mouse clicks */
button:focus-visible {
  outline: 2px solid var(--color-blue-500);
  outline-offset: 2px;
}

/* Remove default focus styles for mouse users */
button:focus:not(:focus-visible) {
  outline: none;
}

/* Skip link with focus-visible */
.skip-link:focus-visible {
  position: absolute;
  top: 1rem;
  left: 1rem;
  z-index: 9999;
  padding: 1rem;
  background: black;
  color: white;
}
```

### prefers-contrast Media Query

Adapt to user's high contrast preferences:

```css
/* Base styles */
button {
  background: oklch(0.6 0.3 230);
  color: white;
  border: 1px solid transparent;
}

/* High contrast mode */
@media (prefers-contrast: more) {
  button {
    border: 2px solid currentColor;
    outline: 2px solid transparent;
    outline-offset: 2px;
  }

  button:hover {
    outline-color: currentColor;
  }

  /* Ensure focus indicators are always visible */
  button:focus-visible {
    outline: 3px solid currentColor;
    outline-offset: 3px;
  }
}

/* Low contrast mode (user preference) */
@media (prefers-contrast: less) {
  button {
    border-color: transparent;
  }
}
```

**Tailwind CSS Implementation:**

```tsx
<button className="
  bg-blue-600 text-white
  contrast-more:border-2 contrast-more:border-current
  contrast-more:outline-offset-2
  focus-visible:outline-2 focus-visible:outline-white
  focus-visible:ring-4 focus-visible:ring-black
  contrast-more:focus-visible:outline-3
">
  Accessible button
</button>
```

### Complete Accessibility Stack for GigPro

```tsx
// components/AccessibleButton.tsx
'use client'

import { ButtonHTMLAttributes } from 'react'

interface AccessibleButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean
}

export function AccessibleButton({
  children,
  loading,
  disabled,
  ...props
}: AccessibleButtonProps) {
  return (
    <button
      {...props}
      disabled={disabled || loading}
      aria-busy={loading}
      aria-disabled={disabled || loading}
      className="
        /* Base styles */
        px-4 py-2 rounded-lg
        bg-blue-600 text-white
        min-h-[44px] min-w-[44px]

        /* Typography */
        font-medium text-base

        /* Focus indicators (WCAG 2.4.13) */
        focus-visible:outline-2
        focus-visible:outline-white
        focus-visible:outline-offset-2
        focus-visible:ring-4
        focus-visible:ring-black

        /* High contrast mode */
        contrast-more:border-2
        contrast-more:border-white
        contrast-more:focus-visible:outline-3

        /* Disabled state */
        disabled:opacity-50
        disabled:cursor-not-allowed

        /* Motion preferences */
        motion-safe:transition-all
        motion-safe:duration-200
        motion-reduce:transition-none

        /* Dark mode */
        dark:bg-blue-500
        dark:focus-visible:ring-white
      "
    >
      {loading && (
        <span className="mr-2" aria-hidden="true">
          <span className="inline-block animate-spin">⏳</span>
        </span>
      )}
      {children}
    </button>
  )
}
```

---

## Advanced Container Query Patterns with CSS Grid

Container queries enable truly component-based responsive design by styling based on a container's size, not the viewport.

### Container Query with CSS Grid Auto-Fill

```css
/* Responsive card grid that adapts to container size */
.card-grid {
  container-type: inline-size;
  container-name: card-grid;

  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 1rem;
}

/* Style cards based on how many columns fit */
@container card-grid (min-width: 800px) {
  .card {
    display: grid;
    grid-template-columns: 200px 1fr;
    gap: 1.5rem;
  }

  .card-image {
    aspect-ratio: 1;
  }
}

@container card-grid (max-width: 799px) {
  .card {
    display: flex;
    flex-direction: column;
  }

  .card-image {
    aspect-ratio: 16 / 9;
  }
}
```

### Container Query Units

```css
.responsive-text {
  /* Font size scales with container width */
  font-size: clamp(1rem, 5cqw, 2rem);

  /* Padding based on container height */
  padding-block: 2cqh;

  /* Margin based on container inline size */
  margin-inline: 3cqi;
}

/* Container query units:
 * cqw  - 1% of container width
 * cqh  - 1% of container height
 * cqi  - 1% of container inline size
 * cqb  - 1% of container block size
 * cqmin - smaller of cqi or cqb
 * cqmax - larger of cqi or cqb
 */
```

### Practical GigPro Example: Income Dashboard

```tsx
// app/components/IncomeDashboard.tsx
export function IncomeDashboard({ transactions }) {
  return (
    <section className="@container">
      {/* Grid adapts based on container size, not viewport */}
      <div className="
        grid gap-4
        grid-cols-1
        @md:grid-cols-2
        @lg:grid-cols-3
        @2xl:grid-cols-4
      ">
        {transactions.map(transaction => (
          <TransactionCard
            key={transaction.id}
            transaction={transaction}
            className="
              /* Card layout changes based on container */
              @container
              flex flex-col
              @sm:flex-row @sm:items-center
            "
          />
        ))}
      </div>

      {/* Summary changes layout at container breakpoints */}
      <div className="
        mt-6 p-4
        @lg:sticky @lg:top-4
        @lg:col-span-full
      ">
        <ProfitSummary />
      </div>
    </section>
  )
}
```

### Container Queries + CSS Grid Subgrid

```css
/* Parent defines container and grid */
.transaction-list {
  container-type: inline-size;
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 1rem;
}

/* Children use subgrid and respond to container */
.transaction-item {
  display: grid;
  grid-column: 1 / -1;
  grid-template-columns: subgrid;
  padding: 1rem;
}

@container (min-width: 600px) {
  .transaction-item {
    grid-template-columns: subgrid;
    /* Inherits parent's 3-column layout */
  }

  .transaction-amount {
    font-size: 1.5rem;
  }
}

@container (max-width: 599px) {
  .transaction-item {
    grid-template-columns: 1fr;
    /* Collapses to single column */
  }

  .transaction-amount {
    font-size: 1.125rem;
  }
}
```

---

## Modern Animation Patterns

### CSS Scroll-Driven Animations

Native CSS scroll-driven animations run on the compositor thread, providing smooth 60fps animations without JavaScript overhead.

**Basic Patterns:**

```css
/* Fade in on scroll into view */
.fade-in-on-scroll {
  animation: fade-in linear;
  animation-timeline: view();
  animation-range: entry 0% cover 30%;
}

@keyframes fade-in {
  from {
    opacity: 0;
    transform: translateY(2rem);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Scale on scroll */
.scale-on-scroll {
  animation: scale-up linear;
  animation-timeline: view();
  animation-range: entry 0% cover 50%;
}

@keyframes scale-up {
  from {
    transform: scale(0.8);
  }
  to {
    transform: scale(1);
  }
}

/* Horizontal scroll progress indicator */
.scroll-progress {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(to right, #4ade80, #3b82f6);
  transform-origin: left;
  animation: scroll-watcher linear;
  animation-timeline: scroll(root);
}

@keyframes scroll-watcher {
  from {
    transform: scaleX(0);
  }
  to {
    transform: scaleX(1);
  }
}
```

**Timeline Options:**

```css
/* scroll() - based on scroll container position */
animation-timeline: scroll();
animation-timeline: scroll(root);  /* Document scroll */
animation-timeline: scroll(nearest);  /* Nearest scrollable ancestor */
animation-timeline: scroll(self);  /* Element's own scroll */

/* view() - based on element's position in viewport */
animation-timeline: view();
animation-timeline: view(block);  /* Vertical scroll */
animation-timeline: view(inline);  /* Horizontal scroll */
```

**Animation Range:**

```css
/* Control when animation starts and ends */
animation-range: entry 0% cover 100%;
animation-range: contain 0% contain 100%;
animation-range: exit 0% exit 100%;

/* Named ranges:
 * entry - element entering the view
 * cover - element covering the view
 * contain - element contained in view
 * exit - element exiting the view
 */
```

### Intersection Observer Patterns (Progressive Enhancement)

For browsers without scroll-driven animation support:

```typescript
// hooks/useIntersectionAnimation.ts
'use client'

import { useEffect, useRef, useState } from 'react'

interface IntersectionOptions {
  threshold?: number
  rootMargin?: string
  triggerOnce?: boolean
}

export function useIntersectionAnimation({
  threshold = 0.1,
  rootMargin = '0px',
  triggerOnce = true,
}: IntersectionOptions = {}) {
  const ref = useRef<HTMLElement>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const element = ref.current
    if (!element) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          if (triggerOnce) {
            observer.unobserve(element)
          }
        } else if (!triggerOnce) {
          setIsVisible(false)
        }
      },
      { threshold, rootMargin }
    )

    observer.observe(element)

    return () => observer.disconnect()
  }, [threshold, rootMargin, triggerOnce])

  return { ref, isVisible }
}

// Usage
export function AnimatedCard({ children }) {
  const { ref, isVisible } = useIntersectionAnimation({
    threshold: 0.2,
    triggerOnce: true,
  })

  return (
    <div
      ref={ref}
      className={`
        transition-all duration-700
        ${isVisible
          ? 'opacity-100 translate-y-0'
          : 'opacity-0 translate-y-8'
        }
      `}
    >
      {children}
    </div>
  )
}
```

### Staggered Animations

```typescript
// components/StaggeredList.tsx
'use client'

import { useIntersectionAnimation } from '@/hooks/useIntersectionAnimation'

export function StaggeredList({ items }) {
  const { ref, isVisible } = useIntersectionAnimation()

  return (
    <ul ref={ref} className="space-y-4">
      {items.map((item, index) => (
        <li
          key={item.id}
          className={`
            transition-all duration-500
            ${isVisible
              ? 'opacity-100 translate-x-0'
              : 'opacity-0 -translate-x-8'
            }
          `}
          style={{
            transitionDelay: isVisible ? `${index * 100}ms` : '0ms',
          }}
        >
          {item.content}
        </li>
      ))}
    </ul>
  )
}
```

### Respecting Motion Preferences

```css
/* Disable animations for users who prefer reduced motion */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }

  /* Preserve essential animations (loading spinners) */
  [aria-busy="true"],
  [aria-live] {
    animation: none !important;
  }
}

/* Tailwind utilities */
.motion-safe:animate-fade-in {
  /* Only animates if user allows motion */
}

.motion-reduce:animate-none {
  /* No animation for reduced motion preference */
}
```

---

## View Transitions API (Production Ready 2024)

The View Transitions API enables smooth, native transitions between pages/states in SPAs and MPAs.

### Next.js 14 Implementation

```typescript
// lib/view-transitions.ts
export function transitionNavigate(callback: () => void) {
  if (!document.startViewTransition) {
    callback()
    return
  }

  document.startViewTransition(() => {
    callback()
  })
}

// hooks/useViewTransition.ts
'use client'

import { useRouter } from 'next/navigation'
import { transitionNavigate } from '@/lib/view-transitions'

export function useViewTransition() {
  const router = useRouter()

  const navigate = (href: string) => {
    transitionNavigate(() => {
      router.push(href)
    })
  }

  return { navigate }
}

// components/Link.tsx
'use client'

import { useViewTransition } from '@/hooks/useViewTransition'

export function TransitionLink({ href, children }) {
  const { navigate } = useViewTransition()

  return (
    <a
      href={href}
      onClick={(e) => {
        e.preventDefault()
        navigate(href)
      }}
    >
      {children}
    </a>
  )
}
```

### CSS Customization

```css
/* Default transition for all elements */
::view-transition-old(root),
::view-transition-new(root) {
  animation-duration: 0.3s;
}

/* Named transitions for specific elements */
.transaction-card {
  view-transition-name: transaction-card;
}

.profit-header {
  view-transition-name: profit-header;
}

/* Custom animations for specific transitions */
::view-transition-old(transaction-card) {
  animation: fade-out 0.2s ease-out;
}

::view-transition-new(transaction-card) {
  animation: fade-in-scale 0.3s ease-in;
}

@keyframes fade-out {
  to {
    opacity: 0;
    transform: scale(0.95);
  }
}

@keyframes fade-in-scale {
  from {
    opacity: 0;
    transform: scale(1.05);
  }
}

/* Different transitions for different directions */
:root {
  view-transition-name: none;
}

.page-forward::view-transition-old(root) {
  animation: slide-out-left 0.3s ease-out;
}

.page-forward::view-transition-new(root) {
  animation: slide-in-right 0.3s ease-in;
}

.page-back::view-transition-old(root) {
  animation: slide-out-right 0.3s ease-out;
}

.page-back::view-transition-new(root) {
  animation: slide-in-left 0.3s ease-in;
}

/* Accessibility: respect motion preferences */
@media (prefers-reduced-motion: reduce) {
  ::view-transition-group(*),
  ::view-transition-old(*),
  ::view-transition-new(*) {
    animation: none !important;
  }
}
```

### Shared Element Transitions

Perfect for card-to-detail page transitions:

```tsx
// app/transactions/[id]/page.tsx
export default function TransactionDetailPage({ params }) {
  return (
    <div
      className="transaction-detail"
      style={{ viewTransitionName: `transaction-${params.id}` }}
    >
      <h1>{transaction.title}</h1>
      <p>{transaction.description}</p>
    </div>
  )
}

// app/transactions/page.tsx
export default function TransactionsListPage() {
  return (
    <ul>
      {transactions.map(transaction => (
        <li
          key={transaction.id}
          style={{ viewTransitionName: `transaction-${transaction.id}` }}
        >
          <TransitionLink href={`/transactions/${transaction.id}`}>
            {transaction.title}
          </TransitionLink>
        </li>
      ))}
    </ul>
  )
}
```

**Result:** The card smoothly morphs into the detail page header.

### Additional Resources (December 2024)

- [Tailwind CSS v4.0 Official Release](https://tailwindcss.com/blog/tailwindcss-v4)
- [Daily.dev: Tailwind CSS 4.0 Everything You Need to Know](https://daily.dev/blog/tailwind-css-40-everything-you-need-to-know-in-one-place)
- [Medium: What's New in Tailwind CSS 4.0](https://khushil21.medium.com/tailwind-css-v4-is-here-all-the-updates-you-need-to-know-394645b53755)
- [WebAIM: Contrast and Accessibility](https://webaim.org/articles/contrast/)
- [Sara Soueidan: Accessible Focus Indicators](https://www.sarasoueidan.com/blog/focus-indicators/)
- [W3C: WCAG 2.4.13 Focus Appearance](https://www.w3.org/WAI/WCAG22/Understanding/focus-appearance.html)
- [DubBot: Focus on Style 2024](https://dubbot.com/dubblog/2024/focus-indicators.html)
- [Medium: CSS in 2025 - Container Queries](https://medium.com/@ignatovich.dm/css-in-2025-new-selectors-container-queries-and-ai-generated-styles-3ebf705f880f)
- [CSS-Tricks: Smart Layouts with Container Queries](https://css-tricks.com/smart-layouts-with-container-queries/)
- [Ishadeed: Interactive Guide to CSS Container Queries](https://ishadeed.com/article/css-container-query-guide/)
- [MDN: CSS Container Queries](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Containment/Container_queries)
- [CSS-Tricks: Unleash Power of Scroll-Driven Animations](https://css-tricks.com/unleash-the-power-of-scroll-driven-animations/)
- [Codrops: Practical Introduction to Scroll-Driven Animations](https://tympanus.net/codrops/2024/01/17/a-practical-introduction-to-scroll-driven-animations-with-css-scroll-and-view/)
- [MDN: View Transition API](https://developer.mozilla.org/en-US/docs/Web/API/View_Transition_API)
- [Chrome for Developers: View Transitions](https://developer.chrome.com/docs/web-platform/view-transitions)
- [Smashing Magazine: View Transitions API Part 2](https://www.smashingmagazine.com/2024/01/view-transitions-api-ui-animations-part2/)
