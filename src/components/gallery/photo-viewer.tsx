'use client';

import Image from 'next/image';
import { format } from 'date-fns';
import {
  X,
  MapPin,
  Clock,
  Download,
  Trash2,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { PhotoData } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useState, useEffect, useRef, useCallback } from 'react';
import { deletePhoto } from '@/lib/storage';
import { cn } from '@/lib/utils';

interface PhotoViewerProps {
  photos: PhotoData[];
  startIndex: number;
  onClose: () => void;
  onDelete: (photoId: string) => void;
}

const MIN_SCALE = 1;
const MAX_SCALE = 5;

export default function PhotoViewer({
  photos,
  startIndex,
  onClose,
  onDelete,
}: PhotoViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(startIndex);
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();
  
  // Zoom & Pan state
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isPanning = useRef(false);
  const startPanPoint = useRef({ x: 0, y: 0 });
  const lastTap = useRef(0);

  const photo = photos[currentIndex];
  const isZoomed = scale > 1;

  const resetZoom = useCallback(() => {
    setScale(1);
    setOffset({ x: 0, y: 0 });
  }, []);

  const changePhoto = useCallback((newIndex: number) => {
    resetZoom();
    setCurrentIndex(newIndex);
  }, [resetZoom]);

  const goToNext = useCallback(() => {
    changePhoto((currentIndex + 1) % photos.length);
  }, [changePhoto, currentIndex, photos.length]);

  const goToPrevious = useCallback(() => {
    changePhoto((currentIndex - 1 + photos.length) % photos.length);
  }, [changePhoto, currentIndex, photos.length]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') goToNext();
      else if (e.key === 'ArrowLeft') goToPrevious();
      else if (e.key === 'Escape') onClose();
    },
    [goToNext, goToPrevious, onClose]
  );
  
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);


  // --- Event Handlers ---

  const onPointerDown = (e: React.PointerEvent) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return; // Only main button
    if (!isZoomed) return;
    
    e.preventDefault();
    isPanning.current = true;
    startPanPoint.current = { x: e.clientX - offset.x, y: e.clientY - offset.y };
    if (containerRef.current) containerRef.current.style.cursor = 'grabbing';
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!isPanning.current) return;
    e.preventDefault();
    
    const newOffsetX = e.clientX - startPanPoint.current.x;
    const newOffsetY = e.clientY - startPanPoint.current.y;
    
    setOffset({ x: newOffsetX, y: newOffsetY });
  };
  
  const onPointerUp = (e: React.PointerEvent) => {
    if (isPanning.current) {
      isPanning.current = false;
      if (containerRef.current) containerRef.current.style.cursor = 'grab';
    }
  };
  
  const onWheel = (e: React.WheelEvent) => {
    if (!containerRef.current) return;
    e.preventDefault();
    const delta = e.deltaY * -0.01;
    const newScale = Math.min(Math.max(scale + delta, MIN_SCALE), MAX_SCALE);
    
    const rect = containerRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const newOffsetX = mouseX - (mouseX - offset.x) * (newScale / scale);
    const newOffsetY = mouseY - (mouseY - offset.y) * (newScale / scale);

    setScale(newScale);

    if (newScale <= 1) {
      resetZoom();
    } else {
      setOffset({ x: newOffsetX, y: newOffsetY });
    }
  };
  
  const handleDoubleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!containerRef.current) return;
    if (scale > 1) {
      resetZoom();
    } else {
      const rect = containerRef.current.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      
      const zoomInScale = 2.5;
      
      setScale(zoomInScale);
      setOffset({
        x: mouseX - (mouseX - 0) * (zoomInScale / 1),
        y: mouseY - (mouseY - 0) * (zoomInScale / 1)
      });
    }
  };


  if (!photo) {
    onClose();
    return null;
  }

  const { dataUrl, location, timestamp, id, width, height } = photo;
  const date = new Date(timestamp);
  
  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = `geosnap-${timestamp}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({ title: 'Downloading photo...' });
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDeleting(true);
    try {
      deletePhoto(id);
      toast({
        title: 'Photo Deleted',
        description: 'The photo has been removed from your gallery.',
      });
      onDelete(id);
      if (photos.length <= 1) {
        onClose();
      } else {
        // Go to the next photo, or previous if it was the last one
        const newIndex = currentIndex >= photos.length - 1 ? currentIndex -1 : currentIndex;
        changePhoto(newIndex);
      }
    } catch (error) {
      console.error('Failed to delete photo', error);
      toast({
        variant: 'destructive',
        title: 'Delete Failed',
        description: 'Could not delete the photo.',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-black/90 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      onClick={(e) => {
        // Close only if the click is on the background and not zoomed
        if (e.target === e.currentTarget && !isZoomed) {
          onClose();
        }
      }}
    >
      <div 
        ref={containerRef}
        className="relative flex-1 overflow-hidden touch-none"
        style={{ cursor: isZoomed ? 'grab' : 'auto' }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
        onWheel={onWheel}
        onDoubleClick={handleDoubleClick}
        onClick={(e) => {
          // Prevent background click-to-close when clicking on the image container
          if (isZoomed) e.stopPropagation();
        }}
      >
        {/* Previous Button */}
        {!isZoomed && photos.length > 1 && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute left-2 top-1/2 z-30 h-12 w-12 -translate-y-1/2 rounded-full bg-black/30 text-white hover:bg-black/50 hover:text-white"
            onClick={(e) => {
              e.stopPropagation();
              goToPrevious();
            }}
            aria-label="Previous photo"
          >
            <ChevronLeft className="h-8 w-8" />
          </Button>
        )}

        {/* Image */}
        <div 
          className="absolute inset-0 flex items-center justify-center"
          onClick={(e) => {
            if (e.target === e.currentTarget && !isZoomed) {
              onClose();
            }
          }}
        >
            <Image
              ref={imageRef}
              src={dataUrl}
              alt={`Photo taken on ${date.toLocaleDateString()}`}
              width={width}
              height={height}
              className='max-h-full max-w-full object-contain transition-transform duration-200'
              style={{
                transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
                touchAction: 'none'
              }}
              draggable={false}
              priority
              key={id}
            />
        </div>

        {/* Next Button */}
        {!isZoomed && photos.length > 1 && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-2 top-1/2 z-30 h-12 w-12 -translate-y-1/2 rounded-full bg-black/30 text-white hover:bg-black/50 hover:text-white"
            onClick={(e) => {
              e.stopPropagation();
              goToNext();
            }}
            aria-label="Next photo"
          >
            <ChevronRight className="h-8 w-8" />
          </Button>
        )}
      </div>

      {/* --- UI OVERLAYS --- */}
      <div className="absolute top-4 left-4 z-20">
        <Button
          variant="ghost"
          size="icon"
          className="h-12 w-12 rounded-full bg-black/50 text-white hover:bg-black/70 hover:text-white"
          onClick={onClose}
          aria-label="Close photo viewer"
        >
          <X className="h-6 w-6" />
        </Button>
      </div>

      <div className="absolute top-4 right-4 z-20 flex gap-2">
        <Button
          variant="secondary"
          size="icon"
          className="h-12 w-12 rounded-full bg-black/50 text-white shadow-lg hover:bg-black/70"
          onClick={handleDownload}
          aria-label="Download photo"
        >
          <Download className="h-6 w-6" />
        </Button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="destructive"
              size="icon"
              className="h-12 w-12 rounded-full bg-destructive/80 text-destructive-foreground shadow-lg hover:bg-destructive"
              onClick={(e) => e.stopPropagation()}
              aria-label="Delete photo"
            >
              {isDeleting ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                <Trash2 className="h-6 w-6" />
              )}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent onClick={(e) => e.stopPropagation()}>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the
                photo.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete}>
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      <div
        className="pointer-events-none absolute bottom-0 left-0 right-0 z-10 flex items-center justify-between gap-2 bg-gradient-to-t from-black/60 to-transparent p-4 pt-16 text-white"
      >
        <div className="flex items-center gap-2 rounded-full bg-black/40 px-3 py-1.5 text-xs font-medium backdrop-blur-sm">
          <MapPin className="h-4 w-4" />
          <span>
            {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
          </span>
        </div>
        <div className="flex items-center gap-2 rounded-full bg-black/40 px-3 py-1.5 text-xs font-medium backdrop-blur-sm">
          <Clock className="h-4 w-4" />
          <span>{format(date, 'yyyy-MM-dd HH:mm:ss')}</span>
        </div>
      </div>
    </div>
  );
}
