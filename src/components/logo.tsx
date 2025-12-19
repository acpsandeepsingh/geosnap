'use client';

import Image from 'next/image';
import { cn } from '@/lib/utils';

export function GeoSnapLogo({ className }: { className?: string }) {
  return (
    <div className={cn('relative h-8 w-auto', className)}>
      <Image
        src="/logo.png"
        alt="GeoSnap Logo"
        width={120}
        height={32}
        priority
      />
    </div>
  );
}
