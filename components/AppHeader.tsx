'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { signOut } from 'next-auth/react';

interface AppHeaderProps {
  subtitle: string;
  activePage: 'sets' | 'explore' | 'wishlist' | 'scan';
  children?: ReactNode;
}

const NAV_LINKS = [
  { key: 'sets', label: 'Sets', href: '/' },
  { key: 'explore', label: 'Explore', href: '/explore' },
  { key: 'wishlist', label: 'Wishlist', href: '/needed-cards' },
  { key: 'scan', label: 'Scan', href: '/scan' },
] as const;

export default function AppHeader({ subtitle, activePage, children }: AppHeaderProps) {
  return (
    <header className="bg-white dark:bg-gray-800 shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex items-center justify-between py-4">
          <div className="flex items-center gap-6 flex-1">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Pokemon Card Collection Tracker
              </h1>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                {subtitle}
              </p>
            </div>

            <nav className="flex items-center gap-1">
              {NAV_LINKS.map(({ key, label, href }) => (
                <Link
                  key={key}
                  href={href}
                  className={`px-4 py-2 text-base font-medium rounded-lg transition-colors ${
                    activePage === key
                      ? 'text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20'
                      : 'text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  {label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-2">
            {children}
            <button
              onClick={() => signOut({ callbackUrl: '/auth/signin' })}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
