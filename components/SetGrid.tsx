'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import type { CardSet } from '@/types/tcgdex';
import { getSetProgress, getCollection, type CollectionData } from '@/lib/storage';
import { formatImageUrl } from '@/lib/image';
import { formatReleaseDate } from '@/lib/utils';

interface SetGridProps {
  sets: CardSet[];
}

export default function SetGrid({ sets }: SetGridProps) {
  const [progress, setProgress] = useState<Record<string, { collected: number; total: number; percentage: number }>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadProgress();
  }, [sets]);

  const loadProgress = async () => {
    setIsLoading(true);
    try {
      const collection = await getCollection();
      const newProgress: Record<string, { collected: number; total: number; percentage: number }> = {};
      sets.forEach(set => {
        newProgress[set.id] = getSetProgress(collection, set.id, set.cardCount.total);
      });
      setProgress(newProgress);
    } catch (error) {
      console.error('Error loading progress:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {sets.map((set) => {
        const setProgress = progress[set.id] || { collected: 0, total: set.cardCount.total, percentage: 0 };

        return (
          <Link
            key={set.id}
            href={`/set/${set.id}`}
            className="group bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden"
          >
            <div className="relative aspect-w-16 aspect-h-9 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 flex items-center justify-center p-4">
              <div className="relative w-full h-32">
                {set.logo || set.symbol ? (
                  <Image
                    src={formatImageUrl(set.logo || set.symbol || '')}
                    alt={set.name}
                    fill
                    className="object-contain group-hover:scale-110 transition-transform duration-300"
                    sizes="true"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="text-4xl font-bold text-gray-400 dark:text-gray-500">
                      {set.name.charAt(0)}
                    </div>
                  </div>
                )}
                {set.releaseDate && (
                  <div className="absolute top-0 right-0 bg-gray-500/80 dark:bg-gray-600/80 text-white text-xs font-medium px-2 py-1 rounded backdrop-blur-sm z-10">
                    {formatReleaseDate(set.releaseDate)}
                  </div>
                )}
              </div>
            </div>

            <div className="p-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                {set.name}
              </h3>

              <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-300 mb-2">
                <span>{set.cardCount.total} cards</span>
                <span className="font-medium">{setProgress.collected}/{setProgress.total}</span>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-blue-500 to-indigo-600 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${setProgress.percentage}%` }}
                ></div>
              </div>

              <div className="mt-2 text-right text-xs text-gray-500 dark:text-gray-400">
                {setProgress.percentage}% complete
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
