'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import type { Card } from '@/types/tcgdex';
import { isCardCollected, toggleCard, getSetProgress, getCollection, type CollectionData } from '@/lib/storage';
import { formatImageUrl } from '@/lib/image';

interface ChecklistGridProps {
  cards: Card[];
  setId: string;
}

export default function ChecklistGrid({ cards, setId }: ChecklistGridProps) {
  const [collection, setCollection] = useState<CollectionData>({});
  const [uncollectedCards, setUncollectedCards] = useState<Card[]>([]);
  const [progress, setProgress] = useState({ collected: 0, total: 0, percentage: 0 });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadCollectionData();
  }, [cards, setId]);

  const loadCollectionData = async () => {
    setIsLoading(true);
    try {
      const collectionData = await getCollection();
      setCollection(collectionData);

      // Filter uncollected cards
      const uncollected = cards.filter(card => !isCardCollected(collectionData, setId, card.id));
      setUncollectedCards(uncollected);

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

      // Update collection data
      const updatedCollection = { ...collection };
      if (!updatedCollection[setId]) {
        updatedCollection[setId] = {};
      }
      updatedCollection[setId][cardId] = isCollected;
      setCollection(updatedCollection);

      // Update uncollected cards list
      const uncollected = cards.filter(card => !isCardCollected(updatedCollection, setId, card.id));
      setUncollectedCards(uncollected);

      // Update progress
      const prog = getSetProgress(updatedCollection, setId, cards.length);
      setProgress(prog);
    } catch (error) {
      console.error('Error toggling card:', error);
      // Reload data on error
      await loadCollectionData();
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-600 dark:text-gray-400">Loading collection...</div>
      </div>
    );
  }

  if (uncollectedCards.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-12 text-center">
        <div className="text-6xl mb-4">🎉</div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Collection Complete!
        </h2>
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          You've collected all cards in this set!
        </p>
        <div className="text-4xl font-bold text-green-600 dark:text-green-400">
          {progress.collected}/{progress.total}
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Progress indicator */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-lg font-semibold text-gray-900 dark:text-white">
            Cards Remaining
          </span>
          <span className="text-lg font-bold text-orange-600 dark:text-orange-400">
            {uncollectedCards.length} cards to collect
          </span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
          <div
            className="bg-gradient-to-r from-blue-500 to-indigo-600 h-3 rounded-full transition-all duration-500"
            style={{ width: `${progress.percentage}%` }}
          ></div>
        </div>
        <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          {progress.collected}/{progress.total} collected ({progress.percentage}%)
        </div>
      </div>

      {/* Cards grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {uncollectedCards.map((card) => (
          <div
            key={card.id}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden transition-all duration-300 hover:shadow-xl"
          >
            <div className="relative aspect-[2.5/3.5] bg-gray-100 dark:bg-gray-700">
              <Image
                src={formatImageUrl(card.image)}
                alt={card.name}
                fill
                className="object-contain"
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
              <div className="flex items-center gap-2 mb-2 flex-wrap">
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
                className="w-full py-2 px-3 rounded-md text-sm font-medium bg-green-500 hover:bg-green-600 text-white transition-colors duration-200"
              >
                Mark as Collected ✓
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
