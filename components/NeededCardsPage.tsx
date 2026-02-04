'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { signOut } from 'next-auth/react';
import type { CardSet } from '@/types/tcgdex';
import { getNeededCardsSets, saveNeededCardsSets } from '@/lib/storage';
import NeededCardsSetSection from './NeededCardsSetSection';

interface NeededCardsPageProps {
  sets: CardSet[];
}

export default function NeededCardsPage({ sets }: NeededCardsPageProps) {
  const [selectedSets, setSelectedSets] = useState<Set<string>>(new Set());
  const [isLoaded, setIsLoaded] = useState(false);
  const [isSelectorOpen, setIsSelectorOpen] = useState(false);

  useEffect(() => {
    loadWishlistSets();
  }, []);

  const loadWishlistSets = async () => {
    try {
      const savedSets = await getNeededCardsSets();
      setSelectedSets(new Set(savedSets));
    } catch (error) {
      console.error('Error loading wishlist sets:', error);
    } finally {
      setIsLoaded(true);
    }
  };

  const toggleSet = async (setId: string) => {
    // Optimistic update
    const newSet = new Set(selectedSets);
    if (newSet.has(setId)) {
      newSet.delete(setId);
    } else {
      newSet.add(setId);
    }
    setSelectedSets(newSet);

    // Save to database
    try {
      await saveNeededCardsSets(Array.from(newSet));
    } catch (error) {
      console.error('Error saving wishlist sets:', error);
      // Revert on error
      await loadWishlistSets();
    }
  };

  const clearAllSets = async () => {
    // Optimistic update
    setSelectedSets(new Set());

    // Save to database
    try {
      await saveNeededCardsSets([]);
    } catch (error) {
      console.error('Error clearing wishlist sets:', error);
      // Revert on error
      await loadWishlistSets();
    }
  };

  const selectedSetsArray = Array.from(selectedSets)
    .map(setId => sets.find(s => s.id === setId))
    .filter(Boolean) as CardSet[];

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-gray-600 dark:text-gray-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <header className="bg-white dark:bg-gray-800 shadow-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Top row: Title and Navigation */}
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center gap-6 flex-1">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  Pokemon Card Collection Tracker
                </h1>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                  View uncollected cards across multiple sets
                </p>
              </div>

              {/* Navigation Buttons */}
              <nav className="flex items-center gap-1">
                <Link
                  href="/"
                  className="px-4 py-2 text-base font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  Sets
                </Link>
                <Link
                  href="/explore"
                  className="px-4 py-2 text-base font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  Explore
                </Link>
                <Link
                  href="/needed-cards"
                  className="px-4 py-2 text-base font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                >
                  Wishlist
                </Link>
              </nav>
            </div>

            {/* Logout Button */}
            <button
              onClick={() => signOut({ callbackUrl: '/auth/signin' })}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              Logout
            </button>
          </div>

          {/* Set Selector */}
          <div className="py-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <button
                onClick={() => setIsSelectorOpen(!isSelectorOpen)}
                className="w-full px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors flex items-center justify-between"
              >
                <span>
                  {selectedSets.size === 0
                    ? 'Select sets to view needed cards'
                    : `${selectedSets.size} set${selectedSets.size !== 1 ? 's' : ''} selected`}
                </span>
                <svg
                  className={`w-5 h-5 transition-transform ${isSelectorOpen ? 'rotate-180' : ''}`}
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path d="M19 9l-7 7-7-7"></path>
                </svg>
              </button>

              {isSelectorOpen && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-50 max-h-96 overflow-y-auto">
                  <div className="p-2">
                    <div className="px-3 py-2 text-sm font-semibold text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                      <span>Select Sets ({selectedSets.size} selected)</span>
                      {selectedSets.size > 0 && (
                        <button
                          onClick={clearAllSets}
                          className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          Clear all
                        </button>
                      )}
                    </div>
                    {sets.map((set) => (
                      <button
                        key={set.id}
                        onClick={() => toggleSet(set.id)}
                        className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors flex items-center gap-2 ${
                          selectedSets.has(set.id)
                            ? 'bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100 font-medium'
                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                        }`}
                      >
                        <div
                          className={`w-4 h-4 border-2 rounded flex items-center justify-center flex-shrink-0 ${
                            selectedSets.has(set.id)
                              ? 'border-blue-600 bg-blue-600'
                              : 'border-gray-300 dark:border-gray-600'
                          }`}
                        >
                          {selectedSets.has(set.id) && (
                            <svg
                              className="w-3 h-3 text-white"
                              fill="none"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path d="M5 13l4 4L19 7"></path>
                            </svg>
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="font-medium">{set.name}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {set.seriesName} • {set.cardCount.total} cards
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {selectedSets.size > 0 && (
              <button
                onClick={clearAllSets}
                className="px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
              >
                Clear All
              </button>
            )}
          </div>

          {/* Selected Sets Badges */}
          {selectedSets.size > 0 && (
            <div className="mt-4 flex items-center gap-2 flex-wrap">
              {selectedSetsArray.map((set) => (
                <span
                  key={set.id}
                  className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-100"
                >
                  {set.name}
                  <button
                    onClick={() => toggleSet(set.id)}
                    className="ml-1 hover:text-blue-900 dark:hover:text-blue-50"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {selectedSets.size === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📋</div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              No Sets Selected
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Select one or more sets above to view the cards you need
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {selectedSetsArray.map((set) => (
              <NeededCardsSetSection key={set.id} set={set} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
