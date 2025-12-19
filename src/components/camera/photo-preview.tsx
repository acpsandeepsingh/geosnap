'use client';

import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { X, Check, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface PhotoPreviewProps {
  imageSrc: string;
  timestamp: number;
  onSave: () => void;
  onDiscard: () => void;
}

export default function PhotoPreview({
  imageSrc,
  timestamp,
  onSave,
  onDiscard,
}: PhotoPreviewProps) {
  const { toast } = useToast();

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = imageSrc;
    link.download = `geosnap-${timestamp}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({ title: 'Downloading photo...' });
  };

  return (
    <div className="relative h-full w-full bg-black">
      <div className="absolute inset-0 flex items-center justify-center">
        <Image
          src={imageSrc}
          alt="Visible photo preview"
          fill
          className="object-contain"
          priority
          sizes="100vw"
        />
      </div>

      {/* --- UI Controls --- */}
      <div className="absolute top-4 left-4 z-20">
        <Button
          variant="ghost"
          size="icon"
          className="h-12 w-12 rounded-full bg-black/50 text-white hover:bg-black/70 hover:text-white"
          onClick={onDiscard}
          aria-label="Discard photo"
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
        <Button
          size="icon"
          className="h-12 w-12 rounded-full bg-accent text-accent-foreground shadow-lg hover:bg-accent/90"
          onClick={onSave}
          aria-label="Save photo"
        >
          <Check className="h-6 w-6" />
        </Button>
      </div>
    </div>
  );
}
