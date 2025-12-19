'use client';

import { useState, useCallback, useRef } from 'react';
import CameraView from '@/components/camera/camera-view';
import PhotoPreview from '@/components/camera/photo-preview';
import { savePhoto } from '@/lib/storage';
import { useToast } from '@/hooks/use-toast';
import type { LocationData } from '@/lib/types';
import { getAddressFromCoordinates } from '@/lib/location';
import { drawOverlayOnCanvas } from '@/lib/canvas';
import { Loader2 } from 'lucide-react';

export interface CapturedData {
  imageSrc: string;
  location: LocationData;
  timestamp: number;
  width: number;
  height: number;
}

export default function CameraPage() {
  const [stampedData, setStampedData] = useState<CapturedData | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast, dismiss } = useToast();
  const processingToastId = useRef<string | null>(null);

  const handleCapture = useCallback(
    async (data: CapturedData) => {
      setIsProcessing(true);
      const { id } = toast({
        title: 'Processing Photo...',
        description: 'Applying location and timestamp.',
      });
      processingToastId.current = id;

      try {
        // 1. Fetch address
        const address = await getAddressFromCoordinates(
          data.location.latitude,
          data.location.longitude
        );

        // 2. Draw overlay on canvas to create the stamped image
        const stampedDataUrl = await drawOverlayOnCanvas({
          ...data,
          address,
        });

        // 3. Set the stamped data for preview
        setStampedData({
          imageSrc: stampedDataUrl,
          location: data.location,
          timestamp: data.timestamp,
          width: data.width,
          height: data.height,
        });
      } catch (error) {
        toast({
          variant: 'destructive',
          title: 'Processing Failed',
          description:
            error instanceof Error
              ? error.message
              : 'Could not process the photo.',
        });
        console.error(error);
      } finally {
        setIsProcessing(false);
        if (processingToastId.current) {
          dismiss(processingToastId.current);
          processingToastId.current = null;
        }
      }
    },
    [toast, dismiss]
  );

  const handleDiscard = () => {
    setStampedData(null);
  };

  const handleSave = useCallback(async () => {
    if (!stampedData) {
      toast({
        variant: 'destructive',
        title: 'Save Failed',
        description: 'No photo data to save.',
      });
      return;
    }
    setIsProcessing(true);
    try {
      savePhoto({
        dataUrl: stampedData.imageSrc,
        location: stampedData.location,
        timestamp: stampedData.timestamp,
        width: stampedData.width,
        height: stampedData.height,
      });

      toast({
        title: 'Photo Saved',
        description: 'Your photo has been saved to the gallery.',
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Save Failed',
        description:
          error instanceof Error ? error.message : 'Could not save the photo.',
      });
      console.error(error);
    } finally {
      setIsProcessing(false);
      setStampedData(null);
    }
  }, [stampedData, toast]);

  if (isProcessing) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-4 bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="text-lg text-muted-foreground">Processing photo...</p>
      </div>
    );
  }

  if (stampedData) {
    return (
      <PhotoPreview
        imageSrc={stampedData.imageSrc}
        timestamp={stampedData.timestamp}
        onSave={handleSave}
        onDiscard={handleDiscard}
      />
    );
  }

  return <CameraView onCapture={handleCapture} />;
}
