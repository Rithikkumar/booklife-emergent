import { useEffect, useState } from 'react';
import {
  PushNotifications,
  Token,
  PushNotificationSchema,
  ActionPerformed
} from '@capacitor/push-notifications';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export const usePushNotifications = () => {
  const [pushToken, setPushToken] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    // Check if we're on a native platform (Capacitor provides a way to check this)
    const isNativePlatform = typeof (window as any).Capacitor !== 'undefined' && 
                             (window as any).Capacitor.isNativePlatform();
    
    if (!isNativePlatform) {
      // Skip push notification setup on web
      setIsSupported(false);
      return;
    }

    // Check if push notifications are supported
    PushNotifications.checkPermissions().then(result => {
      setIsSupported(result.receive !== 'prompt-with-rationale');
    }).catch(() => {
      setIsSupported(false);
    });

    initializePushNotifications();

    return () => {
      // Cleanup listeners
      PushNotifications.removeAllListeners().catch(() => {});
    };
  }, []);

  const initializePushNotifications = async () => {
    // Skip on web platform
    const isNativePlatform = typeof (window as any).Capacitor !== 'undefined' && 
                             (window as any).Capacitor.isNativePlatform();
    if (!isNativePlatform) return;

    try {
      // Request permission
      let permStatus = await PushNotifications.checkPermissions();

      if (permStatus.receive === 'prompt') {
        permStatus = await PushNotifications.requestPermissions();
      }

      if (permStatus.receive !== 'granted') {
        toast({
          title: "Notifications Disabled",
          description: "You won't receive push notifications. You can enable them in settings.",
          variant: "destructive"
        });
        return;
      }

      // Register with Apple / Google to receive push via APNS/FCM
      await PushNotifications.register();

      // Listeners
      await PushNotifications.addListener('registration', async (token: Token) => {
        console.log('Push registration success, token: ' + token.value);
        setPushToken(token.value);
        
        // Save token to database
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase
            .from('profiles')
            .update({ push_notification_token: token.value } as any)
            .eq('user_id', user.id);
        }
      });

      await PushNotifications.addListener('registrationError', (error: any) => {
        console.error('Error on registration: ' + JSON.stringify(error));
      });

      await PushNotifications.addListener(
        'pushNotificationReceived',
        (notification: PushNotificationSchema) => {
          console.log('Push notification received: ' + JSON.stringify(notification));
          toast({
            title: notification.title || "New Notification",
            description: notification.body || "",
          });
        }
      );

      await PushNotifications.addListener(
        'pushNotificationActionPerformed',
        (notification: ActionPerformed) => {
          console.log('Push notification action performed', notification);
          // Handle notification tap - navigate to relevant screen
          const data = notification.notification.data;
          if (data.url) {
            window.location.href = data.url;
          }
        }
      );
    } catch (error) {
      console.error('Error initializing push notifications:', error);
    }
  };

  const getDeliveredNotifications = async () => {
    const notificationList = await PushNotifications.getDeliveredNotifications();
    return notificationList.notifications;
  };

  return {
    pushToken,
    isSupported,
    getDeliveredNotifications
  };
};
