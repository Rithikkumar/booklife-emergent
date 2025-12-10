import { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';

export const useNativeFeatures = () => {
  const [isNative, setIsNative] = useState(false);
  const [platform, setPlatform] = useState<'ios' | 'android' | 'web'>('web');

  useEffect(() => {
    const native = Capacitor.isNativePlatform();
    const plat = Capacitor.getPlatform() as 'ios' | 'android' | 'web';
    
    setIsNative(native);
    setPlatform(plat);

    // Configure status bar for native apps
    if (native) {
      configureStatusBar();
    }
  }, []);

  const configureStatusBar = async () => {
    try {
      // Configure before content loads for better performance
      if (Capacitor.getPlatform() === 'ios') {
        // Do not overlay: let iOS place content below the status bar
        await StatusBar.setOverlaysWebView({ overlay: false });
        // Don't set style - let iOS respect system appearance (dark/light mode)
      } else if (Capacitor.getPlatform() === 'android') {
        await StatusBar.setStyle({ style: Style.Light });
        await StatusBar.setBackgroundColor({ color: '#000000' });
      }
    } catch (error) {
      console.error('Error configuring status bar:', error);
    }
  };

  const hapticFeedback = async (style: ImpactStyle = ImpactStyle.Medium) => {
    if (isNative) {
      try {
        await Haptics.impact({ style });
      } catch (error) {
        console.error('Error with haptic feedback:', error);
      }
    }
  };

  const hapticNotification = async (type: NotificationType = NotificationType.Success) => {
    if (isNative) {
      try {
        await Haptics.notification({ type });
      } catch (error) {
        console.error('Error with haptic notification:', error);
      }
    }
  };

  return {
    isNative,
    platform,
    hapticFeedback,
    hapticNotification
  };
};
