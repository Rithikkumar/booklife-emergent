import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

type Options = {
  key?: string;
  ready?: boolean;
};

export const useScrollRestoration = (options: Options = {}) => {
  const location = useLocation();
  const { key } = options;
  const storageKey = `scroll:${key ?? location.pathname}`;
  const hasRestoredRef = useRef(false);

  // Save scroll position on scroll (debounced) and on unmount
  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;
    
    const save = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        try {
          sessionStorage.setItem(storageKey, String(window.scrollY));
        } catch {}
      }, 100); // Debounce saves to avoid excessive writes
    };

    window.addEventListener('scroll', save, { passive: true });

    return () => {
      clearTimeout(timeoutId);
      // Save final position immediately on unmount (before navigating away)
      try {
        sessionStorage.setItem(storageKey, String(window.scrollY));
      } catch {}
      window.removeEventListener('scroll', save);
    };
  }, [storageKey]);

  // Restore scroll position immediately on mount
  useEffect(() => {
    // Only restore once per mount
    if (hasRestoredRef.current) return;
    hasRestoredRef.current = true;

    const saved = sessionStorage.getItem(storageKey);
    const y = saved ? parseInt(saved, 10) : 0;
    
    // Small delay to ensure DOM is ready after React renders
    const timeoutId = setTimeout(() => {
      window.scrollTo({ top: y, behavior: 'instant' as ScrollBehavior });
    }, 0);

    return () => clearTimeout(timeoutId);
  }, [storageKey]);

  return {
    saveScrollPosition: () => {
      try {
        sessionStorage.setItem(storageKey, String(window.scrollY));
      } catch {}
    },
    getScrollPosition: () => {
      const saved = sessionStorage.getItem(storageKey);
      return saved ? parseInt(saved, 10) : 0;
    },
  };
};