'use client';

import { cn } from '@/lib/utils';

export function GeoSnapLogo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 120 32"
      className={cn('h-8 w-auto', className)}
      aria-label="GeoSnap Logo"
    >
      <defs>
        <linearGradient id="logo-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" style={{ stopColor: '#5885AF' }} />
          <stop offset="100%" style={{ stopColor: '#374785' }} />
        </linearGradient>
      </defs>
      <rect width="120" height="32" rx="6" fill="url(#logo-gradient)" />
      <text
        x="50%"
        y="50%"
        dominantBaseline="middle"
        textAnchor="middle"
        fill="white"
        fontSize="16"
        fontFamily="Inter, sans-serif"
        fontWeight="600"
        letterSpacing="0.5"
      >
        GeoSnap
      </text>
    </svg>
  );
}
