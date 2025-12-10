import { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';

export const useSafeArea = () => {
  const [safeAreaInsets, setSafeAreaInsets] = useState({
    top: 0,
    bottom: 0,
    left: 0,
    right: 0
  });

  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      // Get safe area from CSS env() variables or use platform defaults
      const computedStyle = getComputedStyle(document.documentElement);
      const top = parseInt(computedStyle.getPropertyValue('--sat').replace('px', '') || '0');
      const bottom = parseInt(computedStyle.getPropertyValue('--sab').replace('px', '') || '0');
      const left = parseInt(computedStyle.getPropertyValue('--sal').replace('px', '') || '0');
      const right = parseInt(computedStyle.getPropertyValue('--sar').replace('px', '') || '0');
      
      // Use defaults if CSS env() isn't working
      setSafeAreaInsets({
        top: top || (Capacitor.getPlatform() === 'ios' ? 44 : 0),
        bottom: bottom || (Capacitor.getPlatform() === 'ios' ? 34 : 0),
        left: left || 0,
        right: right || 0
      });
    }
  }, []);

  return safeAreaInsets;
};
