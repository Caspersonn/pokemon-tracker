'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { signOut } from 'next-auth/react';
import type { CardSet } from '@/types/tcgdex';
import SetGrid from './SetGrid';
import { getFilterSeries, saveFilterSeries } from '@/lib/storage';

interface MainPageProps {
  sets: CardSet[];
}

export default function MainPage({ sets }: MainPageProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [selectedSeries, setSelectedSeries] = useState<Set<string>>(new Set());
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load filter from database on mount
  useEffect(() => {
    loadFilterSeries();
  }, []);

  const loadFilterSeries = async () => {
    try {
      const series = await getFilterSeries();
      setSelectedSeries(new Set(series));
    } catch (error) {
      console.error('Error loading filter series:', error);
    } finally {
      setIsLoaded(true);
    }
  };

  // Save filter to database whenever it changes
  useEffect(() => {
    if (isLoaded) {
      saveFilterToDatabase();
    }
  }, [selectedSeries, isLoaded]);

  const saveFilterToDatabase = async () => {
    try {
      await saveFilterSeries(Array.from(selectedSeries));
    } catch (error) {
      console.error('Error saving filter series:', error);
    }
  };

  // Get unique series from all sets
  const series = useMemo(() => {
    const seriesMap = new Map<string, string>();
    sets.forEach(set => {
      if (set.seriesId && set.seriesName) {
        seriesMap.set(set.seriesId, set.seriesName);
      }
    });
    return Array.from(seriesMap.entries()).sort((a, b) => a[1].localeCompare(b[1]));
  }, [sets]);

  const toggleSeries = (seriesId: string) => {
    setSelectedSeries(prev => {
      const newSet = new Set(prev);
      if (newSet.has(seriesId)) {
        newSet.delete(seriesId);
      } else {
        newSet.add(seriesId);
      }
      return newSet;
    });
  };

  // Filter and sort sets based on search query and selected series
  const filteredSets = sets
    .filter(set => {
      const matchesSearch = set.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        set.id.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesSeries = selectedSeries.size === 0 || selectedSeries.has(set.seriesId);
      return matchesSearch && matchesSeries;
    })
    .sort((a, b) => {
      // Sort by release date (newest first)
      // Sets without release dates go to the end
      if (!a.releaseDate && !b.releaseDate) return 0;
      if (!a.releaseDate) return 1;
      if (!b.releaseDate) return -1;

      // Compare dates in descending order (newest first)
      return new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime();
    });

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <header className="bg-white dark:bg-gray-800 shadow-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          {/* Top row: Title and controls */}
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center gap-6 flex-1">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  Pokemon Card Collection Tracker
                </h1>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                  Track your Pokemon TCG collection across all sets
                </p>
              </div>

              {/* Navigation Buttons */}
              <nav className="flex items-center gap-1">
                <Link
                  href="/"
                  className="px-4 py-2 text-base font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                >
                  Sets
                </Link>
                <Link
                  href="/needed-cards"
                  className="px-4 py-2 text-base font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  Wishlist
                </Link>
              </nav>
            </div>

            {/* Search, Filter and Logout Section */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => signOut({ callbackUrl: '/auth/signin' })}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                Logout
              </button>
              {isSearchOpen && (
                <input
                  type="text"
                  placeholder="Search sets..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white w-64 transition-all duration-200"
                  autoFocus
                />
              )}

              {/* Filter Button with Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setIsFilterOpen(!isFilterOpen)}
                  className={`p-2 rounded-lg transition-colors duration-200 ${
                    selectedSeries.size > 0
                      ? 'bg-green-600 hover:bg-green-700'
                      : 'bg-indigo-600 hover:bg-indigo-700'
                  } text-white`}
                  aria-label="Filter by series"
                >
                  <svg className="w-6 h-6" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                    <path d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"></path>
                  </svg>
                  {selectedSeries.size > 0 && (
                    <span className="absolute -top-1 -right-1 bg-green-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                      {selectedSeries.size}
                    </span>
                  )}
                </button>

                {/* Dropdown Menu */}
                {isFilterOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-50 max-h-96 overflow-y-auto">
                    <div className="p-2">
                      <div className="px-3 py-2 text-sm font-semibold text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                        <span>Filter by Generation</span>
                        {selectedSeries.size > 0 && (
                          <button
                            onClick={() => setSelectedSeries(new Set())}
                            className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                          >
                            Clear all
                          </button>
                        )}
                      </div>
                      {series.map(([seriesId, seriesName]) => (
                        <button
                          key={seriesId}
                          onClick={() => toggleSeries(seriesId)}
                          className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors flex items-center gap-2 ${
                            selectedSeries.has(seriesId)
                              ? 'bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100 font-medium'
                              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                          }`}
                        >
                          <div className={`w-4 h-4 border-2 rounded flex items-center justify-center flex-shrink-0 ${
                            selectedSeries.has(seriesId)
                              ? 'border-blue-600 bg-blue-600'
                              : 'border-gray-300 dark:border-gray-600'
                          }`}>
                            {selectedSeries.has(seriesId) && (
                              <svg className="w-3 h-3 text-white" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                                <path d="M5 13l4 4L19 7"></path>
                              </svg>
                            )}
                          </div>
                          <span>{seriesName}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <button
                onClick={() => {
                  setIsSearchOpen(!isSearchOpen);
                  if (isSearchOpen) {
                    setSearchQuery('');
                  }
                }}
                className="p-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors duration-200"
                aria-label="Search"
              >
                {isSearchOpen ? (
                  <svg className="w-6 h-6" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                    <path d="M6 18L18 6M6 6l12 12"></path>
                  </svg>
                ) : (
                  <svg className="w-6 h-6" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                    <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Filter/Search Status */}
          {(searchQuery || selectedSeries.size > 0) && (
            <div className="mt-4 flex items-center gap-2 flex-wrap">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Found {filteredSets.length} set{filteredSets.length !== 1 ? 's' : ''}
              </span>
              {Array.from(selectedSeries).map(seriesId => (
                <span key={seriesId} className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100">
                  {series.find(([id]) => id === seriesId)?.[1] || seriesId}
                  <button
                    onClick={() => toggleSeries(seriesId)}
                    className="ml-1 hover:text-green-900 dark:hover:text-green-50"
                  >
                    ×
                  </button>
                </span>
              ))}
              {searchQuery && (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-100">
                  Search: "{searchQuery}"
                  <button
                    onClick={() => setSearchQuery('')}
                    className="ml-1 hover:text-blue-900 dark:hover:text-blue-50"
                  >
                    ×
                  </button>
                </span>
              )}
            </div>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {filteredSets.length > 0 ? (
          <SetGrid sets={filteredSets} />
        ) : (
          <div className="text-center py-12">
            <p className="text-xl text-gray-600 dark:text-gray-400">
              No sets found
              {searchQuery && ` matching "${searchQuery}"`}
              {selectedSeries.size > 0 && ` in selected series`}
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedSeries(new Set());
              }}
              className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              Clear filters
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
