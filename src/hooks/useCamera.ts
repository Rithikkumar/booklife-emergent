import { useState } from 'react';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { toast } from '@/hooks/use-toast';

export const useCamera = () => {
  const [isLoading, setIsLoading] = useState(false);

  const takePicture = async (source: CameraSource = CameraSource.Camera) => {
    setIsLoading(true);
    try {
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: true,
        resultType: CameraResultType.DataUrl,
        source: source,
        width: 1200,
        height: 1200
      });

      setIsLoading(false);
      return image.dataUrl;
    } catch (error) {
      setIsLoading(false);
      console.error('Error taking picture:', error);
      toast({
        title: "Camera Error",
        description: "Failed to take picture. Please try again.",
        variant: "destructive"
      });
      return null;
    }
  };

  const checkPermissions = async () => {
    try {
      const permissions = await Camera.checkPermissions();
      return permissions.camera === 'granted';
    } catch (error) {
      console.error('Error checking camera permissions:', error);
      return false;
    }
  };

  const requestPermissions = async () => {
    try {
      const permissions = await Camera.requestPermissions();
      return permissions.camera === 'granted';
    } catch (error) {
      console.error('Error requesting camera permissions:', error);
      toast({
        title: "Permission Denied",
        description: "Camera access is required to take photos.",
        variant: "destructive"
      });
      return false;
    }
  };

  return {
    takePicture,
    checkPermissions,
    requestPermissions,
    isLoading
  };
};
