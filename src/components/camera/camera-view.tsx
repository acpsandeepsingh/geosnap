'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import type { CapturedData } from '@/app/page';
import type { LocationData } from '@/lib/types';
import { getAddressFromCoordinates } from '@/lib/location';
import { Camera, Loader2, VideoOff, SwitchCamera } from 'lucide-react';
import { cn } from '@/lib/utils';
import CameraOverlay from './camera-overlay';

interface CameraViewProps {
  onCapture: (data: Omit<CapturedData, 'location'> & { location: LocationData }) => void;
}

export default function CameraView({ onCapture }: CameraViewProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [location, setLocation] = useState<LocationData | null>(null);
  const [address, setAddress] = useState<string | null>('Locating...');
  const [currentTime, setCurrentTime] = useState(Date.now());
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>(
    'environment'
  );
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);

  const { toast } = useToast();

  const handleSwitchCamera = useCallback(() => {
    setFacingMode((prev) => (prev === 'user' ? 'environment' : 'user'));
  }, []);

  useEffect(() => {
    let stream: MediaStream;
    const enableCamera = async () => {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setError('Camera API is not supported by your browser.');
        return;
      }
      try {
        // Enumerate devices to check for multiple cameras
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoInputs = devices.filter(
          (device) => device.kind === 'videoinput'
        );
        setVideoDevices(videoInputs);

        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: facingMode,
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          },
          audio: false,
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error('Error accessing camera:', err);
        setError(
          'Could not access the camera. Please check permissions and try again.'
        );
      }
    };
    enableCamera();
    return () => {
      stream?.getTracks().forEach((track) => track.stop());
    };
  }, [facingMode]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!navigator.geolocation) {
      toast({
        variant: 'destructive',
        title: 'Location Error',
        description: 'Geolocation is not supported by your browser.',
      });
      setAddress('Geolocation not supported');
      return;
    }

    let isMounted = true;

    const watchId = navigator.geolocation.watchPosition(
      async (position) => {
        if (!isMounted) return;

        const newLocation = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };
        setLocation(newLocation);

        if (isMounted) {
          setAddress('Fetching address...');
        }
        try {
          const fetchedAddress = await getAddressFromCoordinates(
            newLocation.latitude,
            newLocation.longitude
          );
          if (isMounted) {
            setAddress(fetchedAddress);
          }
        } catch (e) {
          if (isMounted) {
            setAddress('Address not available');
          }
          console.error(e);
        }
      },
      (err) => {
        console.error('Error getting location:', err);
        toast({
          variant: 'destructive',
          title: 'Location Error',
          description: 'Could not get GPS location.',
        });
        setLocation({ latitude: 0, longitude: 0 }); // Set default/error location
        setAddress('Could not get location');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );

    return () => {
      isMounted = false;
      navigator.geolocation.clearWatch(watchId);
    };
  }, [toast]);

  const capturePhoto = useCallback(async () => {
    setIsCapturing(true);
    setError(null);

    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || !isCameraReady) {
      setError('Camera not ready.');
      setIsCapturing(false);
      return;
    }

    const videoWidth = video.videoWidth;
    const videoHeight = video.videoHeight;
    
    canvas.width = videoWidth;
    canvas.height = videoHeight;
    const context = canvas.getContext('2d');
    if (!context) {
      setError('Could not process image.');
      setIsCapturing(false);
      return;
    }
    // Flip the image if it's from the front-facing camera
    if (facingMode === 'user') {
      context.translate(videoWidth, 0);
      context.scale(-1, 1);
    }
    context.drawImage(video, 0, 0, videoWidth, videoHeight);
    const imageSrc = canvas.toDataURL('image/jpeg');

    const finalLocation = location || { latitude: 0, longitude: 0 };
    onCapture({ imageSrc, location: finalLocation, timestamp: Date.now(), width: videoWidth, height: videoHeight });

    setIsCapturing(false);
  }, [isCameraReady, onCapture, location, facingMode]);

  return (
    <div className="relative h-full w-full bg-black">
      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-background p-4 text-center">
          <VideoOff className="h-12 w-12 text-destructive" />
          <p className="mt-4 text-lg font-semibold">Camera Error</p>
          <p className="text-muted-foreground">{error}</p>
        </div>
      )}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        className={cn(
          'h-full w-full object-cover',
          !isCameraReady && 'hidden',
          facingMode === 'user' && 'transform -scale-x-100'
        )}
        onCanPlay={() => setIsCameraReady(true)}
        onLoadedMetadata={() => setIsCameraReady(true)}
      />
      {!isCameraReady && !error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black">
          <Loader2 className="h-12 w-12 animate-spin text-white" />
        </div>
      )}
      <canvas ref={canvasRef} className="hidden" />

      {isCameraReady && (
        <CameraOverlay
          timestamp={currentTime}
          location={location}
          address={address}
        />
      )}

      {isCameraReady && videoDevices.length > 1 && (
        <div className="absolute top-4 right-4 z-20">
          <Button
            type="button"
            onClick={handleSwitchCamera}
            variant="ghost"
            size="icon"
            className="h-12 w-12 rounded-full bg-black/50 text-white hover:bg-black/70"
            aria-label="Switch camera"
          >
            <SwitchCamera className="h-6 w-6" />
          </Button>
        </div>
      )}

      <div className="absolute bottom-0 left-0 right-0 z-20 flex justify-center p-6">
        <Button
          type="button"
          onClick={capturePhoto}
          disabled={!isCameraReady || isCapturing}
          className="h-20 w-20 rounded-full border-4 border-white bg-primary/50 shadow-lg backdrop-blur-sm transition-all hover:bg-primary/70 active:scale-95 disabled:cursor-not-allowed disabled:bg-gray-500/50"
          aria-label="Capture photo"
        >
          {isCapturing ? (
            <Loader2 className="h-8 w-8 animate-spin text-white" />
          ) : (
            <Camera className="h-8 w-8 text-white" />
          )}
        </Button>
      </div>
    </div>
  );
}
