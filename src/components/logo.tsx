'use client';

import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';

export function GeoSnapLogo({ className }: { className?: string }) {
  const [logoSrc, setLogoSrc] = useState('/logo.png');

  useEffect(() => {
    // Add a timestamp to bypass browser cache.
    // This is a debugging step to ensure the latest image is fetched.
    setLogoSrc(`/logo.png?t=${new Date().getTime()}`);
  }, []);

  return (
    <div className={cn('flex items-center', className)}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={logoSrc}
        alt="GeoSnap Logo"
        className="object-contain rounded-lg"
        style={{ width: '120px', height: '32px' }}
        key={logoSrc} // Re-render if src changes
      />
    </div>
  );
}
