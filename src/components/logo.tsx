'use client';

import Image from 'next/image';
import { cn } from '@/lib/utils';

export function GeoSnapLogo({ className }: { className?: string }) {
  const basePath = '/geosnap';
  return (
    <div className={cn('relative h-8 w-auto', className)}>
      <Image
        src={`${basePath}/logo.png`}
        alt="GeoSnap Logo"
        width={120}
        height={32}
        priority
      />
    </div>
  );
}
