import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

type Options = {
  key?: string;
  ready?: boolean;
};

export const useScrollRestoration = (options: Options = {}) => {
  const location = useLocation();
  const { key, ready = true } = options;
  const storageKey = `scroll:${key ?? location.pathname}`;
  const restoredRef = useRef(false);

  // Save scroll position on scroll and before unload
  useEffect(() => {
    const save = () => {
      try {
        sessionStorage.setItem(storageKey, String(window.scrollY));
      } catch {}
    };

    window.addEventListener('scroll', save, { passive: true });
    window.addEventListener('beforeunload', save);

    return () => {
      save();
      window.removeEventListener('scroll', save);
      window.removeEventListener('beforeunload', save);
    };
  }, [storageKey]);

  // Restore when content is ready
  useEffect(() => {
    if (!ready || restoredRef.current) return;

    const saved = sessionStorage.getItem(storageKey);
    const y = saved ? parseInt(saved, 10) : 0;

    requestAnimationFrame(() => {
      window.scrollTo(0, y);
      restoredRef.current = true;
    });
  }, [ready, storageKey]);

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