'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Calculator, Bell, Settings, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';

export function NavBar() {
  const pathname = usePathname();

  // Hide nav on home and onboarding
  if (pathname === '/' || pathname === '/onboarding') {
    return null;
  }

  const navItems = [
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { label: 'Simulate', href: '/simulate', icon: Calculator },
    { label: 'Nudges', href: '/nudges', icon: Bell },
    { label: 'Settings', href: '/settings', icon: Settings },
  ];

  return (
    <>
      {/* Desktop Header */}
      <header className="sticky top-0 z-40 w-full border-b border-white/60 bg-white/70 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto flex h-14 items-center justify-between px-4 sm:px-8">
          <Link href="/dashboard" className="flex items-center gap-2 font-bold text-sm sm:text-base">
            <div className="rounded-xl bg-gradient-to-br from-blue-600 to-sky-500 p-1.5 text-primary-foreground shadow-lg shadow-blue-500/25">
              <Shield className="h-4 w-4" />
            </div>
            <span>
              Financial Health <span className="gradient-text">Copilot</span>
            </span>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-1 text-sm font-medium">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all duration-200',
                    isActive
                      ? 'bg-blue-100 text-blue-800 font-semibold shadow-sm'
                      : 'text-muted-foreground hover:text-foreground hover:bg-blue-50'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2">
            <span className="text-xs bg-emerald-500/10 text-emerald-700 font-medium px-2.5 py-1 rounded-full border border-emerald-500/20">
              Live demo
            </span>
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 border-t bg-background/95 backdrop-blur px-2 py-1.5 flex justify-around items-center">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center gap-0.5 py-1 px-3 rounded-lg text-[10px] font-medium transition-colors',
                isActive
                  ? 'text-primary font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Icon className="h-4 w-4" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
