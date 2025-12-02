'use client';

import { useEffect, useRef, useState } from 'react';

interface IntersectionOptions {
  threshold?: number;
  rootMargin?: string;
  triggerOnce?: boolean;
}

/**
 * useIntersectionAnimation Hook
 *
 * Progressive enhancement hook for scroll-driven animations.
 * Falls back to Intersection Observer for browsers without CSS scroll-driven animations.
 *
 * @param options - Configuration for intersection observer
 * @returns ref and isVisible state
 *
 * @example
 * ```tsx
 * const { ref, isVisible } = useIntersectionAnimation({
 *   threshold: 0.2,
 *   triggerOnce: true,
 * });
 *
 * return (
 *   <div
 *     ref={ref}
 *     className={`transition-all duration-700 ${
 *       isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
 *     }`}
 *   >
 *     Content
 *   </div>
 * );
 * ```
 */
export function useIntersectionAnimation({
  threshold = 0.1,
  rootMargin = '0px 0px -100px 0px',
  triggerOnce = true,
}: IntersectionOptions = {}) {
  const ref = useRef<HTMLElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    // Check if browser supports CSS scroll-driven animations
    // If so, skip Intersection Observer (CSS will handle it)
    if (CSS.supports('animation-timeline', 'view()')) {
      setIsVisible(true); // CSS animation will handle the reveal
      return;
    }

    // Fallback to Intersection Observer for older browsers
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          if (triggerOnce) {
            observer.unobserve(element);
          }
        } else if (!triggerOnce) {
          setIsVisible(false);
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, [threshold, rootMargin, triggerOnce]);

  return { ref, isVisible };
}
