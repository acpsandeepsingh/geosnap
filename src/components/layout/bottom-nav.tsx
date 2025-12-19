'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Camera, Folder } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/gallery', icon: Folder, label: 'Gallery' },
  { href: '/', icon: Camera, label: 'Camera' },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="border-t bg-card/95 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-md items-center justify-around">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center gap-1 rounded-md p-2 text-muted-foreground transition-colors hover:text-primary focus:text-primary focus:outline-none"
            >
              <item.icon
                className={cn('h-6 w-6', isActive && 'text-primary')}
              />
              <span
                className={cn(
                  'text-xs font-medium',
                  isActive && 'text-primary'
                )}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
