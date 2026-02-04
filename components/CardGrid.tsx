'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import type { Card } from '@/types/tcgdex';
import type { CollectionData } from '@/types/tcgdex';
import { getCollection, isCardCollected, toggleCard, getSetProgress } from '@/lib/storage';
import { formatImageUrl } from '@/lib/image';

interface CardGridProps {
  cards: Card[];
  setId: string;
}

export default function CardGrid({ cards, setId }: CardGridProps) {
  const [collection, setCollection] = useState<CollectionData>({});
  const [collected, setCollected] = useState<Record<string, boolean>>({});
  const [progress, setProgress] = useState({ collected: 0, total: 0, percentage: 0 });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadCollection();
  }, [cards, setId]);

  const loadCollection = async () => {
    setIsLoading(true);
    try {
      const collectionData = await getCollection();
      setCollection(collectionData);

      // Load collection status for all cards
      const collectedStatus: Record<string, boolean> = {};
      cards.forEach(card => {
        collectedStatus[card.id] = isCardCollected(collectionData, setId, card.id);
      });
      setCollected(collectedStatus);

      // Update progress
      const prog = getSetProgress(collectionData, setId, cards.length);
      setProgress(prog);
    } catch (error) {
      console.error('Error loading collection:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggle = async (cardId: string) => {
    try {
      const isCollected = await toggleCard(setId, cardId);

      // Update local state
      setCollected(prev => ({
        ...prev,
        [cardId]: isCollected
      }));

      // Update collection data
      const updatedCollection = { ...collection };
      if (!updatedCollection[setId]) {
        updatedCollection[setId] = {};
      }
      updatedCollection[setId][cardId] = isCollected;
      setCollection(updatedCollection);

      // Update progress
      const prog = getSetProgress(updatedCollection, setId, cards.length);
      setProgress(prog);
    } catch (error) {
      console.error('Error toggling card:', error);
      // Revert optimistic update on error
      await loadCollection();
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-600 dark:text-gray-400">Loading collection...</div>
      </div>
    );
  }

  return (
    <div>
      {/* Progress indicator */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-lg font-semibold text-gray-900 dark:text-white">
            Collection Progress
          </span>
          <span className="text-lg font-bold text-indigo-600 dark:text-indigo-400">
            {progress.collected}/{progress.total} ({progress.percentage}%)
          </span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
          <div
            className="bg-gradient-to-r from-blue-500 to-indigo-600 h-3 rounded-full transition-all duration-500"
            style={{ width: `${progress.percentage}%` }}
          ></div>
        </div>
      </div>

      {/* Cards grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {cards.map((card) => (
          <div
            key={card.id}
            className={`bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden transition-all duration-300 ${
              collected[card.id] ? 'ring-2 ring-green-500' : ''
            }`}
          >
            <div className="relative aspect-[2.5/3.5] bg-gray-100 dark:bg-gray-700">
              <Image
                src={formatImageUrl(card.image)}
                alt={card.name}
                fill
                className={`object-contain transition-all duration-300 ${
                  collected[card.id] ? 'grayscale opacity-50' : ''
                }`}
                sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 16vw"
              />
            </div>

            <div className="p-3">
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                #{card.localId}
              </div>
              <h3 className="font-semibold text-sm text-gray-900 dark:text-white mb-1 line-clamp-1">
                {card.name}
              </h3>
              <div className="flex items-center gap-2 mb-2">
                {card.types && card.types.map((type) => (
                  <span
                    key={type}
                    className="text-xs px-2 py-0.5 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                  >
                    {type}
                  </span>
                ))}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                {card.rarity}
              </div>
              <button
                onClick={() => handleToggle(card.id)}
                className={`w-full py-2 px-3 rounded-md text-sm font-medium transition-colors duration-200 ${
                  collected[card.id]
                    ? 'bg-green-500 hover:bg-green-600 text-white'
                    : 'bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300'
                }`}
              >
                {collected[card.id] ? 'Collected ✓' : 'Uncollected'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
