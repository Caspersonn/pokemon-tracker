'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import type { CardSet, Card } from '@/types/tcgdex';
import { fetchSetCards } from '@/lib/api';
import { isCardCollected, toggleCard, getSetProgress, getCollection, type CollectionData } from '@/lib/storage';
import { formatImageUrl } from '@/lib/image';

interface NeededCardsSetSectionProps {
  set: CardSet;
}

export default function NeededCardsSetSection({ set }: NeededCardsSetSectionProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [cards, setCards] = useState<Card[]>([]);
  const [collection, setCollection] = useState<CollectionData>({});
  const [uncollectedCards, setUncollectedCards] = useState<Card[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [progress, setProgress] = useState({ collected: 0, total: 0, percentage: 0 });

  useEffect(() => {
    loadCards();
  }, [set.id]);

  const loadCards = async () => {
    setIsLoading(true);
    try {
      const [fetchedCards, collectionData] = await Promise.all([
        fetchSetCards(set.id),
        getCollection()
      ]);
      setCards(fetchedCards);
      setCollection(collectionData);
      updateUncollectedCards(fetchedCards, collectionData);
      updateProgress(fetchedCards.length, collectionData);
    } catch (error) {
      console.error('Error loading cards:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateUncollectedCards = (allCards: Card[], collectionData: CollectionData) => {
    const uncollected = allCards.filter(card => !isCardCollected(collectionData, set.id, card.id));
    setUncollectedCards(uncollected);
  };

  const updateProgress = (totalCards: number, collectionData: CollectionData) => {
    const prog = getSetProgress(collectionData, set.id, totalCards);
    setProgress(prog);
  };

  const handleToggle = async (cardId: string) => {
    try {
      const isCollected = await toggleCard(set.id, cardId);

      // Update collection data
      const updatedCollection = { ...collection };
      if (!updatedCollection[set.id]) {
        updatedCollection[set.id] = {};
      }
      updatedCollection[set.id][cardId] = isCollected;
      setCollection(updatedCollection);

      // Update uncollected cards list
      updateUncollectedCards(cards, updatedCollection);
      updateProgress(cards.length, updatedCollection);
    } catch (error) {
      console.error('Error toggling card:', error);
      // Reload data on error
      await loadCards();
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
      {/* Set Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors"
      >
        <div className="flex items-center gap-4 flex-1">
          <svg
            className={`w-5 h-5 text-gray-500 dark:text-gray-400 transition-transform ${
              isExpanded ? 'rotate-90' : ''
            }`}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path d="M9 5l7 7-7 7"></path>
          </svg>
          <div className="text-left flex-1">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              {set.name}
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              {set.seriesName}
            </p>
          </div>
          <div className="text-right">
            {isLoading ? (
              <span className="text-sm text-gray-500 dark:text-gray-400">Loading...</span>
            ) : (
              <>
                <div className="text-lg font-bold text-orange-600 dark:text-orange-400">
                  {uncollectedCards.length} cards needed
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {progress.collected}/{progress.total} collected ({progress.percentage}%)
                </div>
              </>
            )}
          </div>
        </div>
      </button>

      {/* Cards Grid */}
      {isExpanded && (
        <div className="px-6 pb-6">
          {isLoading ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              Loading cards...
            </div>
          ) : uncollectedCards.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-2">✓</div>
              <p className="text-gray-600 dark:text-gray-300">
                All cards collected for this set!
              </p>
            </div>
          ) : (
            <>
              {/* Progress Bar */}
              <div className="mb-4">
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-indigo-600 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${progress.percentage}%` }}
                  ></div>
                </div>
              </div>

              {/* Cards Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {uncollectedCards.map((card) => (
                  <div
                    key={card.id}
                    className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden transition-all duration-300 hover:shadow-xl border border-gray-200 dark:border-gray-700"
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
            </>
          )}
        </div>
      )}
    </div>
  );
}
