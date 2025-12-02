# Progressive Web App (PWA) Implementation for Next.js

## Introduction

Progressive Web Apps (PWAs) combine the reach and accessibility of web applications with the features and user experience of native mobile apps. For GigPro, implementing PWA functionality will enable gig workers to install the app on their home screens, work offline, and receive push notifications—all without requiring app store approval or multiple codebases. This document provides a comprehensive guide to implementing PWA features in Next.js 14, leveraging the latest 2024-2025 best practices.

## Current State of Next.js PWA (2024-2025)

### Native Next.js Support

In fall 2024, the official Next.js documentation introduced built-in PWA support without requiring external dependencies. This represents a significant shift in the Next.js PWA ecosystem, making it easier to create web app manifests and configure PWA features natively.

### Package Ecosystem Status

The PWA package landscape has evolved:

- **shadowwalker/next-pwa**: Original package, no longer maintained (last update July 2024)
- **@ducanh2912/next-pwa**: A maintained fork of next-pwa
- **Serwist**: The modern successor to next-pwa, providing tools for service workers based on Google's Workbox

**Recommendation for GigPro**: Start with native Next.js support for basic PWA features (manifest, icons). Add Serwist if advanced offline functionality and caching strategies are needed.

## Implementation Approaches

### Approach 1: Native Next.js Support (Recommended for New Projects)

**Pros:**
- No external dependencies
- Official support and documentation
- Simpler configuration
- Better long-term maintenance

**Cons:**
- May require custom service worker for advanced features
- Less abstraction for complex offline scenarios

### Approach 2: Serwist (For Advanced Offline Features)

**Pros:**
- Built on proven Workbox patterns
- Advanced caching strategies out of the box
- Comprehensive offline support
- Background sync capabilities

**Cons:**
- Additional dependency
- More configuration complexity
- May be overkill for basic PWA features

## Core PWA Components

### 1. Web App Manifest

The manifest file defines how your PWA appears and behaves when installed.

#### Creating a Manifest with Next.js App Router

**Static Manifest (manifest.json):**
```json
// public/manifest.json
{
  "name": "GigPro - Gig Worker Tracker",
  "short_name": "GigPro",
  "description": "Track income, expenses, and profits across multiple gig platforms",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#0f172a",
  "theme_color": "#0ea5e9",
  "orientation": "portrait-primary",
  "icons": [
    {
      "src": "/icons/icon-72x72.png",
      "sizes": "72x72",
      "type": "image/png",
      "purpose": "maskable any"
    },
    {
      "src": "/icons/icon-96x96.png",
      "sizes": "96x96",
      "type": "image/png",
      "purpose": "maskable any"
    },
    {
      "src": "/icons/icon-128x128.png",
      "sizes": "128x128",
      "type": "image/png",
      "purpose": "maskable any"
    },
    {
      "src": "/icons/icon-144x144.png",
      "sizes": "144x144",
      "type": "image/png",
      "purpose": "maskable any"
    },
    {
      "src": "/icons/icon-152x152.png",
      "sizes": "152x152",
      "type": "image/png",
      "purpose": "maskable any"
    },
    {
      "src": "/icons/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "maskable any"
    },
    {
      "src": "/icons/icon-384x384.png",
      "sizes": "384x384",
      "type": "image/png",
      "purpose": "maskable any"
    },
    {
      "src": "/icons/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "maskable any"
    }
  ],
  "screenshots": [
    {
      "src": "/screenshots/home-light.png",
      "sizes": "1280x720",
      "type": "image/png",
      "label": "Calendar view showing daily profits"
    },
    {
      "src": "/screenshots/day-view.png",
      "sizes": "1280x720",
      "type": "image/png",
      "label": "Daily income and expense tracking"
    }
  ],
  "categories": ["finance", "productivity", "utilities"],
  "shortcuts": [
    {
      "name": "Add Income",
      "short_name": "Add Income",
      "description": "Quickly add a new income entry",
      "url": "/",
      "icons": [{ "src": "/icons/add-income.png", "sizes": "96x96" }]
    },
    {
      "name": "Today",
      "short_name": "Today",
      "description": "View today's earnings",
      "url": "/day/today",
      "icons": [{ "src": "/icons/today.png", "sizes": "96x96" }]
    }
  ]
}
```

**Dynamic Manifest (manifest.ts):**
```typescript
// app/manifest.ts
import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'GigPro - Gig Worker Tracker',
    short_name: 'GigPro',
    description: 'Track income, expenses, and profits across multiple gig platforms',
    start_url: '/',
    display: 'standalone',
    background_color: '#0f172a',
    theme_color: '#0ea5e9',
    icons: [
      {
        src: '/icons/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable any',
      },
      {
        src: '/icons/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable any',
      },
    ],
  }
}
```

**Link Manifest in Layout:**
```typescript
// app/layout.tsx
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'GigPro',
  description: 'Track your gig work income and expenses',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'GigPro',
  },
  formatDetection: {
    telephone: false,
  },
}
```

#### Manifest Field Explanations

- **name**: Full application name (appears in installation dialog)
- **short_name**: Abbreviated name (appears under icon on home screen)
- **description**: Used in enhanced Android installation prompts
- **start_url**: URL loaded when app is launched from home screen
- **display**:
  - `standalone`: Looks like a native app (no browser UI)
  - `fullscreen`: Uses entire screen
  - `minimal-ui`: Minimal browser UI
  - `browser`: Regular browser tab
- **background_color**: Splash screen background color
- **theme_color**: Browser toolbar color
- **orientation**: Preferred screen orientation
- **icons**: Array of icon objects for different sizes
- **screenshots**: Enhanced installation prompts on Android
- **categories**: App store categorization
- **shortcuts**: Quick actions from home screen icon

### 2. App Icons

#### Icon Requirements

**Essential Sizes:**
- 72x72 (iOS)
- 96x96 (Android)
- 128x128 (Android, Desktop)
- 144x144 (iOS, Windows)
- 152x152 (iOS)
- 192x192 (Android, Chrome)
- 384x384 (Android)
- 512x512 (Android, Chrome, Splash screens)

**Icon Formats:**
- PNG (required, widely supported)
- WebP (optional, better compression)
- SVG (optional, scalable)

**Purpose Field:**
- `any`: Default icon, can be used in any context
- `maskable`: Icon designed for adaptive icon support (Android)
- `monochrome`: Single-color icon for themed environments

#### Creating Maskable Icons

Maskable icons ensure your icon looks good on all Android devices with different shapes:

```json
{
  "src": "/icons/icon-maskable-512x512.png",
  "sizes": "512x512",
  "type": "image/png",
  "purpose": "maskable"
}
```

**Design Guidelines:**
- Put important content in the center 80% of the icon
- Use 20% padding around edges (safe zone)
- Test at https://maskable.app/

#### Icon Generation Tools

- **PWA Asset Generator**: `npx pwa-asset-generator logo.svg public/icons`
- **RealFaviconGenerator**: https://realfavicongenerator.net/
- **Favicon.io**: https://favicon.io/

### 3. Service Worker

Service workers run in the background and intercept network requests, enabling offline functionality and advanced caching strategies.

#### Essential Requirements

1. **HTTPS is Mandatory**: Service workers require a secure context and can only be registered over HTTPS (localhost is exempt for development)
2. **Separate JavaScript File**: Must be a separate file, cannot be inline
3. **Scope**: Controls which pages the service worker can intercept

#### Basic Service Worker Implementation

**Register Service Worker:**
```typescript
// app/layout.tsx or components/ServiceWorkerRegistration.tsx
'use client'

import { useEffect } from 'react'

export function ServiceWorkerRegistration() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('Service Worker registered:', registration)
        })
        .catch((error) => {
          console.error('Service Worker registration failed:', error)
        })
    }
  }, [])

  return null
}
```

**Basic Service Worker (public/sw.js):**
```javascript
const CACHE_NAME = 'gigpro-v1'
const urlsToCache = [
  '/',
  '/offline',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
]

// Install event - cache essential resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache)
    })
  )
  // Activate immediately
  self.skipWaiting()
})

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName)
          }
        })
      )
    })
  )
  // Take control immediately
  self.clients.claim()
})

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      // Cache hit - return response
      if (response) {
        return response
      }

      // Clone the request
      const fetchRequest = event.request.clone()

      return fetch(fetchRequest).then((response) => {
        // Check if valid response
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response
        }

        // Clone the response
        const responseToCache = response.clone()

        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache)
        })

        return response
      }).catch(() => {
        // Offline and not in cache - return offline page
        return caches.match('/offline')
      })
    })
  )
})
```

#### Service Worker Lifecycle

1. **Install**: Cache static assets
2. **Activate**: Clean up old caches
3. **Fetch**: Intercept network requests

**Lifecycle Management:**
```javascript
// Skip waiting to activate immediately
self.addEventListener('install', (event) => {
  self.skipWaiting()
})

// Claim clients immediately
self.addEventListener('activate', (event) => {
  self.clients.claim()
})
```

### 4. Offline Page

Every PWA should provide a custom offline page instead of the generic browser error.

**Create Offline Page (app/offline/page.tsx):**
```typescript
export default function OfflinePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-8">
      <h1 className="text-4xl font-bold mb-4">You're Offline</h1>
      <p className="text-lg text-gray-600 mb-8 text-center max-w-md">
        GigPro works offline, but this page hasn't been cached yet.
        Try visiting the home page or a previously viewed day.
      </p>
      <a
        href="/"
        className="px-6 py-3 bg-sky-500 text-white rounded-lg hover:bg-sky-600"
      >
        Go to Home
      </a>
    </div>
  )
}
```

## Advanced Service Worker Patterns

### Caching Strategies

Different caching strategies optimize for different scenarios:

#### 1. Cache First (Best for Static Assets)

```javascript
// Good for: Images, fonts, CSS, JS
self.addEventListener('fetch', (event) => {
  if (event.request.destination === 'image') {
    event.respondWith(
      caches.match(event.request).then((response) => {
        return response || fetch(event.request).then((response) => {
          return caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, response.clone())
            return response
          })
        })
      })
    )
  }
})
```

#### 2. Network First (Best for Dynamic Content)

```javascript
// Good for: API calls, user-specific data
self.addEventListener('fetch', (event) => {
  if (event.request.url.includes('/api/')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Update cache with fresh data
          const responseClone = response.clone()
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone)
          })
          return response
        })
        .catch(() => {
          // Fallback to cache if offline
          return caches.match(event.request)
        })
    )
  }
})
```

#### 3. Stale While Revalidate

```javascript
// Good for: Semi-dynamic content that can show stale data
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request).then((networkResponse) => {
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, networkResponse.clone())
        })
        return networkResponse
      })

      // Return cached response immediately, update in background
      return cachedResponse || fetchPromise
    })
  )
})
```

### GigPro-Specific Caching Strategy

```javascript
const CACHE_NAME = 'gigpro-v1'
const STATIC_CACHE = 'gigpro-static-v1'
const DYNAMIC_CACHE = 'gigpro-dynamic-v1'

const STATIC_ASSETS = [
  '/',
  '/offline',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll(STATIC_ASSETS)
    })
  )
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((key) => key !== STATIC_CACHE && key !== DYNAMIC_CACHE)
          .map((key) => caches.delete(key))
      )
    })
  )
  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Skip cross-origin requests
  if (url.origin !== location.origin) {
    return
  }

  // Static assets - cache first
  if (STATIC_ASSETS.some(asset => url.pathname === asset)) {
    event.respondWith(
      caches.match(request).then((response) => {
        return response || fetch(request)
      })
    )
    return
  }

  // App routes - network first, fallback to cache
  if (url.pathname.startsWith('/day/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const responseClone = response.clone()
          caches.open(DYNAMIC_CACHE).then((cache) => {
            cache.put(request, responseClone)
          })
          return response
        })
        .catch(() => {
          return caches.match(request).then((response) => {
            return response || caches.match('/offline')
          })
        })
    )
    return
  }

  // Default - network first
  event.respondWith(
    fetch(request).catch(() => {
      return caches.match(request).then((response) => {
        return response || caches.match('/offline')
      })
    })
  )
})
```

## Implementation with Serwist

For advanced offline features, Serwist provides a comprehensive solution:

### Installation

```bash
npm install serwist
```

### Configuration

**next.config.mjs:**
```javascript
import withSerwistInit from '@serwist/next'

const withSerwist = withSerwistInit({
  swSrc: 'app/sw.ts',
  swDest: 'public/sw.js',
  cacheOnNavigation: true,
  reloadOnOnline: true,
  disable: process.env.NODE_ENV === 'development',
})

export default withSerwist({
  // Your Next.js config
})
```

**app/sw.ts:**
```typescript
import { defaultCache } from '@serwist/next/worker'
import type { PrecacheEntry, SerwistGlobalConfig } from 'serwist'
import { Serwist } from 'serwist'

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined
  }
}

declare const self: ServiceWorkerGlobalScope

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: defaultCache,
})

serwist.addEventListeners()
```

**Register Service Worker:**
```typescript
// app/layout.tsx
'use client'

import { useEffect } from 'react'

export default function RootLayout({ children }) {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
    }
  }, [])

  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
```

## Installation Prompts

### Detecting Install Capability

```typescript
'use client'

import { useEffect, useState } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export function useInstallPrompt() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isInstallable, setIsInstallable] = useState(false)

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault()
      setInstallPrompt(e as BeforeInstallPromptEvent)
      setIsInstallable(true)
    }

    window.addEventListener('beforeinstallprompt', handler)

    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstallable(false)
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handler)
    }
  }, [])

  const promptInstall = async () => {
    if (!installPrompt) return false

    installPrompt.prompt()
    const { outcome } = await installPrompt.userChoice

    if (outcome === 'accepted') {
      setInstallPrompt(null)
      setIsInstallable(false)
      return true
    }

    return false
  }

  return { isInstallable, promptInstall }
}
```

### Install Prompt Component

```typescript
'use client'

import { useState } from 'react'
import { useInstallPrompt } from '@/hooks/useInstallPrompt'
import { XMarkIcon } from '@heroicons/react/24/outline'

export function InstallPromptBanner() {
  const { isInstallable, promptInstall } = useInstallPrompt()
  const [dismissed, setDismissed] = useState(false)

  if (!isInstallable || dismissed) return null

  const handleInstall = async () => {
    const installed = await promptInstall()
    if (installed) {
      console.log('App installed successfully')
    }
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-sky-500 text-white p-4 shadow-lg z-50">
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex-1">
          <h3 className="font-semibold">Install GigPro</h3>
          <p className="text-sm opacity-90">
            Install GigPro for quick access and offline functionality
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleInstall}
            className="px-4 py-2 bg-white text-sky-500 rounded-lg font-semibold hover:bg-gray-100"
          >
            Install
          </button>
          <button
            onClick={() => setDismissed(true)}
            className="p-2 hover:bg-sky-600 rounded-lg"
            aria-label="Dismiss"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  )
}
```

### Best Practices for Installation Prompts

**When to Show Prompts:**
- After user completes a critical journey (adds first income entry)
- After sign-up or onboarding
- In settings or help sections
- After demonstrating app value (not immediately on first visit)

**Where to Place Prompts:**
- Banner at top or bottom of screen
- In-app promotional card
- Settings page
- After completing a transaction

**Timing:**
- Wait for `beforeinstallprompt` event (don't show before it fires)
- Don't interrupt user workflows
- Consider showing after 2-3 visits
- Remember dismissal (don't spam users)

### iOS Installation Instructions

iOS doesn't support automatic installation prompts. Provide manual instructions:

```typescript
'use client'

import { useState, useEffect } from 'react'

export function IOSInstallPrompt() {
  const [isIOS, setIsIOS] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)

  useEffect(() => {
    const userAgent = window.navigator.userAgent.toLowerCase()
    const isIOSDevice = /iphone|ipad|ipod/.test(userAgent)
    const isInStandaloneMode = window.matchMedia('(display-mode: standalone)').matches

    setIsIOS(isIOSDevice)
    setIsStandalone(isInStandaloneMode)
  }, [])

  if (!isIOS || isStandalone) return null

  return (
    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
      <h3 className="font-semibold mb-2">Install GigPro on iOS</h3>
      <ol className="text-sm space-y-1 list-decimal list-inside">
        <li>Tap the Share button (square with arrow pointing up)</li>
        <li>Scroll down and tap "Add to Home Screen"</li>
        <li>Tap "Add" in the top right corner</li>
      </ol>
    </div>
  )
}
```

## Background Sync

Background sync enables the app to defer actions until the user has stable connectivity.

### Basic Background Sync Implementation

```javascript
// Service Worker (sw.js)
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-income-entries') {
    event.waitUntil(syncIncomeEntries())
  }
})

async function syncIncomeEntries() {
  // Get pending entries from IndexedDB
  const db = await openDB('GigProDB')
  const pendingEntries = await db.getAll('pending_sync')

  for (const entry of pendingEntries) {
    try {
      // Attempt to sync
      await fetch('/api/sync', {
        method: 'POST',
        body: JSON.stringify(entry),
      })

      // Remove from pending if successful
      await db.delete('pending_sync', entry.id)
    } catch (error) {
      console.error('Sync failed:', error)
    }
  }
}
```

### Requesting Background Sync

```typescript
// Client-side component
async function addIncomeOffline(entry) {
  // Save to local IndexedDB
  await db.income_entries.add(entry)

  // Register for background sync
  if ('serviceWorker' in navigator && 'sync' in ServiceWorkerRegistration.prototype) {
    const registration = await navigator.serviceWorker.ready
    await registration.sync.register('sync-income-entries')
  }
}
```

## Push Notifications

Web Push Notifications are supported in all modern browsers, including iOS 16.4+ for home screen apps.

### Requesting Permission

```typescript
'use client'

import { useState } from 'react'

export function usePushNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>('default')

  const requestPermission = async () => {
    if (!('Notification' in window)) {
      console.error('This browser does not support notifications')
      return false
    }

    const result = await Notification.requestPermission()
    setPermission(result)
    return result === 'granted'
  }

  const subscribeToPush = async () => {
    if (permission !== 'granted') {
      const granted = await requestPermission()
      if (!granted) return null
    }

    const registration = await navigator.serviceWorker.ready

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_KEY!),
    })

    return subscription
  }

  return { permission, requestPermission, subscribeToPush }
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')

  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}
```

### Handling Push Events

```javascript
// Service Worker
self.addEventListener('push', (event) => {
  const data = event.data?.json() ?? {}

  const options = {
    body: data.body,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    data: data.url,
  }

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  event.waitUntil(
    clients.openWindow(event.notification.data)
  )
})
```

## Testing PWA Features

### Lighthouse Audit

Chrome DevTools includes Lighthouse, which audits PWA compliance:

```bash
# Run Lighthouse from command line
npx lighthouse https://localhost:3000 --view
```

**Key Metrics:**
- Progressive Web App score
- Performance
- Accessibility
- Best Practices
- SEO

### PWA Checklist

- [ ] HTTPS enabled (or localhost for development)
- [ ] Web app manifest with required fields
- [ ] Icons in multiple sizes (at least 192x192 and 512x512)
- [ ] Service worker registered
- [ ] Offline page available
- [ ] Custom install prompt (optional)
- [ ] Passes Lighthouse PWA audit
- [ ] Works offline
- [ ] Fast load time (< 3 seconds)
- [ ] Responsive design
- [ ] Theme color matches app design

### Browser Testing

Test on multiple platforms:

**Desktop:**
- Chrome/Edge (best PWA support)
- Firefox (good support)
- Safari (limited support)

**Mobile:**
- Android Chrome (excellent support)
- iOS Safari 16.4+ (requires home screen installation)
- Samsung Internet (good support)

## GigPro-Specific Implementation Plan

### Phase 1: Basic PWA Setup

1. **Create Manifest**
   - Define app metadata
   - Generate icons in required sizes
   - Add screenshots for Android

2. **Add Basic Service Worker**
   - Cache static assets
   - Implement offline page
   - Register service worker

3. **Update Layout**
   - Add manifest link
   - Add service worker registration
   - Add theme-color meta tags

### Phase 2: Enhanced Offline Support

1. **Implement Caching Strategies**
   - Cache-first for static assets
   - Network-first for day views
   - Offline fallback for all routes

2. **IndexedDB Integration**
   - Ensure all CRUD operations work offline
   - Queue sync operations when offline
   - Implement conflict resolution

### Phase 3: Installation Prompts

1. **Custom Install Banner**
   - Detect installability
   - Show prompt after user adds first entry
   - Remember dismissal

2. **iOS Instructions**
   - Detect iOS devices
   - Show manual installation guide
   - Include visual walkthrough

### Phase 4: Advanced Features

1. **Background Sync**
   - Queue failed operations
   - Retry when online
   - Notify user of sync status

2. **Push Notifications** (Optional)
   - Daily earnings summary
   - Reminder to log income
   - Amazon Flex hours warnings

## Security Best Practices

### Service Worker Security

1. **Serve over HTTPS**: Service workers require secure context
2. **Validate Sources**: Check origin of push messages
3. **Content Security Policy**: Restrict service worker sources
4. **Regular Updates**: Keep service worker and dependencies updated

```typescript
// next.config.js
const ContentSecurityPolicy = `
  default-src 'self';
  script-src 'self' 'unsafe-eval' 'unsafe-inline';
  style-src 'self' 'unsafe-inline';
  img-src 'self' blob: data:;
  font-src 'self';
  connect-src 'self';
  worker-src 'self';
`

const securityHeaders = [
  {
    key: 'Content-Security-Policy',
    value: ContentSecurityPolicy.replace(/\s{2,}/g, ' ').trim()
  }
]
```

### Permissions and Privacy

- Request permissions at appropriate times
- Explain why permissions are needed
- Respect user decisions
- Provide way to revoke permissions

## Performance Optimization

### Lazy Loading Service Worker

```typescript
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
  })
}
```

### Precaching Critical Resources

Only precache essential resources to minimize install time:

```javascript
const CRITICAL_ASSETS = [
  '/',
  '/offline',
  '/icons/icon-192x192.png',
]
```

### Cache Size Management

Limit cache size to prevent storage issues:

```javascript
async function limitCacheSize(cacheName, maxItems) {
  const cache = await caches.open(cacheName)
  const keys = await cache.keys()

  if (keys.length > maxItems) {
    await cache.delete(keys[0])
    limitCacheSize(cacheName, maxItems)
  }
}
```

## Key Takeaways

1. **Native Support First**: Use Next.js built-in manifest support for basic PWA features
2. **Progressive Enhancement**: Start with basic offline support, add advanced features incrementally
3. **HTTPS Required**: Service workers only work over HTTPS (localhost exempt)
4. **Strategic Caching**: Different strategies for static vs. dynamic content
5. **Custom Install Prompts**: Show prompts at meaningful moments, not immediately
6. **iOS Manual Install**: Provide clear instructions for iOS users
7. **Offline Fallback**: Always provide custom offline page
8. **Test Thoroughly**: Test on multiple browsers and devices
9. **Monitor Performance**: Use Lighthouse to track PWA score
10. **Security First**: Implement CSP, validate sources, use HTTPS

## References

- [Building a PWA with Serwist in Next.js - JavaScript in Plain English](https://javascript.plainenglish.io/building-a-progressive-web-app-pwa-in-next-js-with-serwist-next-pwa-successor-94e05cb418d7)
- [PWAs Guide - Next.js Official Docs](https://nextjs.org/docs/app/guides/progressive-web-apps)
- [Creating a PWA Using Next.js - Fishtank](https://www.getfishtank.com/insights/creating-a-progressive-web-app-using-nextjs)
- [How to Build a Next.js PWA in 2025 - Medium](https://medium.com/@jakobwgnr/how-to-build-a-next-js-pwa-in-2025-f334cd9755df)
- [How To Create a PWA Using Next.js - freeCodeCamp](https://www.freecodecamp.org/news/how-to-create-a-nextjs-pwa/)
- [Making PWAs Work Offline with Service Workers - MDN](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Tutorials/js13kGames/Offline_Service_workers)
- [Offline and Background Operation - MDN](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Offline_and_background_operation)
- [Best Practices for PWAs - MDN](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Best_practices)
- [Making PWAs Installable - MDN](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Making_PWAs_installable)
- [Installation Prompt - web.dev](https://web.dev/learn/pwa/installation-prompt)
- [PWA Add to Home Screen Guide - GoMage](https://www.gomage.com/blog/pwa-add-to-home-screen/)
