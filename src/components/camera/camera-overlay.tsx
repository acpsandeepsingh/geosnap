'use client';

import { GeoSnapLogo } from '@/components/logo';
import { format } from 'date-fns';
import { Clock, Home, MapPin } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

interface CameraOverlayProps {
  timestamp: number;
  location: { latitude: number; longitude: number } | null;
  address: string | null;
}

export default function CameraOverlay({
  timestamp,
  location,
  address,
}: CameraOverlayProps) {
  return (
    <div className="absolute bottom-0 inset-x-0 z-10 p-4 text-white pointer-events-none">
      <div className="mx-auto max-w-lg rounded-xl bg-black/50 p-4 backdrop-blur-sm">
        <div className="flex flex-col text-left gap-3">
          {/* Top Section: Time, Location, and Logo */}
          <div className="flex justify-between items-start">
            <div className="flex flex-col space-y-1.5">
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-accent flex-shrink-0" />
                <span>
                  {format(new Date(timestamp), 'yyyy-MM-dd HH:mm:ss')}
                </span>
              </div>
              {location && (
                <div className="flex items-center gap-2 font-medium text-sm">
                  <MapPin className="h-4 w-4 text-accent flex-shrink-0" />
                  <span>
                    {location.latitude.toFixed(6)},{' '}
                    {location.longitude.toFixed(6)}
                  </span>
                </div>
              )}
            </div>
            <GeoSnapLogo className="h-8 w-auto" />
          </div>

          {/* Separator */}
          <Separator className="bg-white/20" />

          {/* Bottom Section: Address */}
          <div className="flex items-start gap-2 text-sm">
            <Home className="h-4 w-4 text-accent flex-shrink-0 mt-0.5" />
            <span className="break-words">{address || 'Locating...'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
