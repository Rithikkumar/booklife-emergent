import React, { useRef, useState } from 'react';
import { Camera, Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useCamera } from '@/hooks/useCamera';
import { useNativeFeatures } from '@/hooks/useNativeFeatures';
import { CameraSource } from '@capacitor/camera';
import { supabase } from '@/integrations/supabase/client';

interface ImageUploadProps {
  label?: string;
  value?: string;
  onChange: (file: File | null, url: string) => void;
  accept?: string;
  maxSize?: number; // in MB
  className?: string;
  variant?: 'profile' | 'cover' | 'default';
  preview?: boolean;
  userId?: string;
  imageType?: 'avatar' | 'cover';
  uploadToStorage?: boolean;
}

const ImageUpload: React.FC<ImageUploadProps> = ({
  label = "Upload Image",
  value = "",
  onChange,
  accept = "image/*",
  maxSize = 5, // 5MB default
  className,
  variant = 'default',
  preview = true,
  userId,
  imageType = 'avatar',
  uploadToStorage = false,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const { takePicture, isLoading: cameraLoading } = useCamera();
  const { isNative } = useNativeFeatures();

  const validateFile = (file: File): boolean => {
    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file');
      return false;
    }

    if (file.size > maxSize * 1024 * 1024) {
      toast.error(`File size must be less than ${maxSize}MB`);
      return false;
    }

    return true;
  };

  const uploadToSupabase = async (file: File): Promise<string> => {
    if (!userId) {
      throw new Error('User ID is required for storage upload');
    }

    const fileExt = file.name.split('.').pop() || 'jpg';
    const fileName = `${userId}/${imageType}-${Date.now()}.${fileExt}`;

    // Delete old files if they exist (for updating)
    try {
      const { data: existingFiles } = await supabase.storage
        .from('profile-images')
        .list(userId, { search: imageType });
      
      if (existingFiles && existingFiles.length > 0) {
        const filesToDelete = existingFiles
          .filter(f => f.name.startsWith(imageType))
          .map(f => `${userId}/${f.name}`);
        
        if (filesToDelete.length > 0) {
          await supabase.storage
            .from('profile-images')
            .remove(filesToDelete);
        }
      }
    } catch (error) {
      console.warn('Could not clean up old files:', error);
    }

    const { error } = await supabase.storage
      .from('profile-images')
      .upload(fileName, file, { 
        upsert: true,
        contentType: file.type 
      });

    if (error) {
      throw error;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('profile-images')
      .getPublicUrl(fileName);

    return publicUrl;
  };

  const handleFileSelect = async (file: File) => {
    if (!validateFile(file)) return;

    setUploading(true);
    try {
      if (uploadToStorage && userId) {
        const publicUrl = await uploadToSupabase(file);
        onChange(file, publicUrl);
        toast.success('Image uploaded successfully');
      } else {
        // Create a preview URL for non-storage uploads
        const url = URL.createObjectURL(file);
        onChange(file, url);
        toast.success('Image selected');
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Error uploading image. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const openFileDialog = () => {
    if (!uploading) {
      fileInputRef.current?.click();
    }
  };

  const removeImage = async () => {
    // If using storage and there's a value, try to delete from storage
    if (uploadToStorage && userId && value && value.includes('profile-images')) {
      try {
        const urlPath = new URL(value).pathname;
        const filePath = urlPath.split('/profile-images/')[1];
        if (filePath) {
          await supabase.storage
            .from('profile-images')
            .remove([decodeURIComponent(filePath)]);
        }
      } catch (error) {
        console.error('Error deleting image from storage:', error);
      }
    }
    onChange(null, "");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleNativeCamera = async (source: CameraSource) => {
    if (uploading) return;
    
    const dataUrl = await takePicture(source);
    if (dataUrl) {
      // Convert data URL to File object
      const response = await fetch(dataUrl);
      const blob = await response.blob();
      const file = new File([blob], `${imageType}-${Date.now()}.jpg`, { type: 'image/jpeg' });
      await handleFileSelect(file);
    }
  };

  const getVariantStyles = () => {
    switch (variant) {
      case 'profile':
        return "w-24 h-24 rounded-full";
      case 'cover':
        return "w-full h-32 rounded-lg";
      default:
        return "w-32 h-32 rounded-lg";
    }
  };

  const isLoading = uploading || cameraLoading;

  return (
    <div className={cn("space-y-2", className)}>
      {label && <Label>{label}</Label>}
      
      <div className="space-y-3">
        {/* Preview */}
        {preview && value && (
          <div className="relative inline-block">
            <div className={cn("overflow-hidden bg-muted", getVariantStyles())}>
              <img
                src={value}
                alt="Preview"
                className="w-full h-full object-cover"
              />
            </div>
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
              onClick={removeImage}
              disabled={isLoading}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        )}

        {/* Upload Area */}
        <div
          className={cn(
            "border-2 border-dashed rounded-lg p-6 text-center transition-colors",
            dragOver ? "border-primary bg-primary/5" : "border-muted-foreground/25",
            isLoading ? "pointer-events-none opacity-50" : "cursor-pointer hover:border-primary hover:bg-primary/5"
          )}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={openFileDialog}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={accept}
            onChange={handleFileInput}
            className="hidden"
            disabled={isLoading}
          />
          
          <div className="flex flex-col items-center gap-2">
            {isLoading ? (
              <>
                <Loader2 className="h-8 w-8 text-primary animate-spin" />
                <span className="text-sm text-muted-foreground">Uploading...</span>
              </>
            ) : (
              <>
                <div className="p-2 bg-muted rounded-full">
                  {variant === 'profile' ? (
                    <Camera className="h-6 w-6 text-muted-foreground" />
                  ) : (
                    <ImageIcon className="h-6 w-6 text-muted-foreground" />
                  )}
                </div>
                <div className="text-sm">
                  <span className="font-medium text-primary">Click to upload</span>
                  <span className="text-muted-foreground"> or drag and drop</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  PNG, JPG, GIF up to {maxSize}MB
                </p>
              </>
            )}
          </div>
        </div>

        {/* Upload Button Alternative */}
        <div className="flex gap-2">
          {isNative && (
            <>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleNativeCamera(CameraSource.Camera)}
                disabled={isLoading}
                className="flex-1"
              >
                <Camera className="h-4 w-4 mr-2" />
                Camera
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleNativeCamera(CameraSource.Photos)}
                disabled={isLoading}
                className="flex-1"
              >
                <ImageIcon className="h-4 w-4 mr-2" />
                Gallery
              </Button>
            </>
          )}
          {!isNative && (
            <Button
              type="button"
              variant="outline"
              onClick={openFileDialog}
              disabled={isLoading}
              className="flex-1"
            >
              <Upload className="h-4 w-4 mr-2" />
              Choose File
            </Button>
          )}
          
          {value && (
            <Button
              type="button"
              variant="outline"
              onClick={removeImage}
              disabled={isLoading}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImageUpload;
