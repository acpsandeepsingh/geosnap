'use client';

import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';

export function GeoSnapLogo({ className }: { className?: string }) {
  const [logoSrc, setLogoSrc] = useState(`${basePath}/logo.png`);

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
