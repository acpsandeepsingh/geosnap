'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { getAllPhotos, deletePhoto } from '@/lib/storage';
import type { PhotoData } from '@/lib/types';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { ImageIcon, Download, Trash2, Loader2, Clock } from 'lucide-react';
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
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import PhotoViewer from './photo-viewer';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

export default function PhotoGrid() {
  const [photos, setPhotos] = useState<PhotoData[]>([]);
  const [isClient, setIsClient] = useState(false);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(
    null
  );
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const { toast } = useToast();

  const refreshPhotos = () => {
    setPhotos(getAllPhotos());
  };

  useEffect(() => {
    setIsClient(true);
    refreshPhotos();
  }, []);

  const handleDownload = (e: React.MouseEvent, photo: PhotoData) => {
    e.stopPropagation(); // Prevent opening the viewer
    const link = document.createElement('a');
    link.href = photo.dataUrl;
    link.download = `geosnap-${photo.timestamp}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({ title: 'Downloading photo...' });
  };

  const handleDelete = (e: React.MouseEvent, photoId: string) => {
    e.stopPropagation(); // Prevent opening the viewer
    setIsDeleting(photoId);
    try {
      deletePhoto(photoId);
      toast({
        title: 'Photo Deleted',
        description: 'The photo has been removed from your gallery.',
      });
      refreshPhotos();
    } catch (error) {
      console.error('Failed to delete photo', error);
      toast({
        variant: 'destructive',
        title: 'Delete Failed',
        description: 'Could not delete the photo.',
      });
    } finally {
      setIsDeleting(null);
    }
  };

  const handlePhotoDeletedInViewer = (photoId: string) => {
    refreshPhotos();
  };

  if (!isClient) {
    return null;
  }

  if (photos.length === 0) {
    return (
      <div className="flex h-64 flex-col items-center justify-center rounded-lg border-2 border-dashed bg-card p-8 text-center text-muted-foreground">
        <ImageIcon className="mb-4 h-12 w-12" />
        <p className="text-lg font-medium">No Photos Yet</p>
        <p>Your captured photos will appear here.</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {photos.map((photo, index) => (
          <Card
            key={photo.id}
            className="group relative cursor-pointer overflow-hidden"
            onClick={() => setSelectedPhotoIndex(index)}
          >
            <CardContent className="p-0">
              <div
                className="relative w-full"
                style={{
                  aspectRatio: `${photo.width || 1} / ${photo.height || 1}`,
                }}
              >
                <Image
                  src={photo.dataUrl}
                  alt={`Photo from ${new Date(
                    photo.timestamp
                  ).toLocaleDateString()}`}
                  fill
                  className="object-cover transition-transform group-hover:scale-105"
                  sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 15vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                <div className="absolute top-2 right-2 z-10 hidden flex-col gap-2 group-hover:flex">
                  <Button
                    variant="secondary"
                    size="icon"
                    className="h-8 w-8 rounded-full bg-black/50 text-white shadow-lg hover:bg-black/70"
                    onClick={(e) => handleDownload(e, photo)}
                    aria-label="Download photo"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="destructive"
                        size="icon"
                        className="h-8 w-8 rounded-full bg-destructive/80 text-destructive-foreground shadow-lg hover:bg-destructive"
                        onClick={(e) => e.stopPropagation()}
                        aria-label="Delete photo"
                      >
                        {isDeleting === photo.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. This will permanently
                          delete the photo.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={(e) => handleDelete(e, photo.id)}
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </CardContent>
            <CardFooter className="absolute bottom-0 w-full justify-between items-center bg-card/80 p-2 backdrop-blur-sm">
              <div className="flex items-center gap-1.5 text-xs text-foreground">
                <Clock className="h-3 w-3" />
                <p className="font-semibold">
                  {format(new Date(photo.timestamp), 'HH:mm:ss')}
                </p>
              </div>
              <p className="text-xs text-muted-foreground">
                {format(new Date(photo.timestamp), 'yyyy-MM-dd')}
              </p>
            </CardFooter>
          </Card>
        ))}
      </div>
      {selectedPhotoIndex !== null && (
        <PhotoViewer
          photos={photos}
          startIndex={selectedPhotoIndex}
          onClose={() => setSelectedPhotoIndex(null)}
          onDelete={handlePhotoDeletedInViewer}
        />
      )}
    </>
  );
}
