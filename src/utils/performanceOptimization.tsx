import { ComponentType, lazy, LazyExoticComponent } from 'react';

export function lazyWithPreload<T extends ComponentType<any>>(
  factory: () => Promise<{ default: T }>
): LazyExoticComponent<T> & { preload: () => void } {
  const Component = lazy(factory);
  let factoryPromise: Promise<{ default: T }> | undefined;

  const preload = () => {
    if (!factoryPromise) {
      factoryPromise = factory();
    }
    return factoryPromise;
  };

  return Object.assign(Component, { preload });
}

export const preloadOnHover = (preloadFn: () => void) => ({
  onMouseEnter: preloadFn,
  onTouchStart: preloadFn,
});

export const preloadOnVisible = (
  element: HTMLElement | null,
  preloadFn: () => void
) => {
  if (!element || !('IntersectionObserver' in window)) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          preloadFn();
          observer.disconnect();
        }
      });
    },
    { rootMargin: '50px' }
  );

  observer.observe(element);

  return () => observer.disconnect();
};

export const preloadAfterInteractive = (preloadFn: () => void) => {
  if (typeof window !== 'undefined') {
    if (document.readyState === 'complete') {
      setTimeout(preloadFn, 1);
    } else {
      window.addEventListener('load', () => {
        setTimeout(preloadFn, 1);
      });
    }
  }
};

export const preloadCritical = (...preloadFns: Array<() => void>) => {
  if (typeof window !== 'undefined') {
    requestIdleCallback(
      () => {
        preloadFns.forEach((fn) => fn());
      },
      { timeout: 2000 }
    );
  }
};
