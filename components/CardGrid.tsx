'use client';

import { useState, useEffect } from 'react';
import type { Card, CollectionData, CardStatusData } from '@/types/tcgdex';
import { getCollection, getSetProgress, incrementCard, decrementCard, getNeedCards, isCardNeeded, toggleNeedCard, getWantCards, isCardWanted, toggleWantCard } from '@/lib/storage';
import CardItem from '@/components/CardItem';

interface CardGridProps {
  cards: Card[];
  setId: string;
  setName?: string;
}

export default function CardGrid({ cards, setId, setName }: CardGridProps) {
  const [collection, setCollection] = useState<CollectionData>({});
  const [progress, setProgress] = useState({ collected: 0, total: 0, percentage: 0 });
  const [isLoading, setIsLoading] = useState(true);

  const [needData, setNeedData] = useState<CardStatusData>({});
  const [wantData, setWantData] = useState<CardStatusData>({});

  const displaySetName = setName || cards[0]?.set?.name || setId;

  useEffect(() => {
    loadData();
  }, [cards, setId]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [collectionData, needCardsData, wantCardsData] = await Promise.all([
        getCollection(),
        getNeedCards(),
        getWantCards(),
      ]);
      setCollection(collectionData);
      setNeedData(needCardsData);
      setWantData(wantCardsData);

      const prog = getSetProgress(collectionData, setId, cards.length);
      setProgress(prog);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateCollectionState = (cardId: string, result: { collected: boolean; amount: number }) => {
    const updatedCollection = { ...collection };
    if (!updatedCollection[setId]) {
      updatedCollection[setId] = {};
    }
    if (result.amount > 0) {
      updatedCollection[setId][cardId] = result.amount;
    } else {
      delete updatedCollection[setId][cardId];
    }
    setCollection(updatedCollection);

    const prog = getSetProgress(updatedCollection, setId, cards.length);
    setProgress(prog);
  };

  const handleIncrement = async (cardId: string) => {
    try {
      const result = await incrementCard(setId, cardId);
      updateCollectionState(cardId, result);
    } catch (error) {
      console.error('Error incrementing card:', error);
    }
  };

  const handleDecrement = async (cardId: string) => {
    try {
      const result = await decrementCard(setId, cardId);
      updateCollectionState(cardId, result);
    } catch (error) {
      console.error('Error decrementing card:', error);
    }
  };

  const handleNeedToggle = async (cardId: string) => {
    try {
      const isNeededNow = await toggleNeedCard(setId, cardId);
      const updatedNeed = { ...needData };
      if (!updatedNeed[setId]) {
        updatedNeed[setId] = {};
      }
      updatedNeed[setId][cardId] = isNeededNow;
      setNeedData(updatedNeed);
    } catch (error) {
      console.error('Error toggling need card:', error);
    }
  };

  const handleWantToggle = async (cardId: string) => {
    try {
      const isWantedNow = await toggleWantCard(setId, cardId);
      const updatedWant = { ...wantData };
      if (!updatedWant[setId]) {
        updatedWant[setId] = {};
      }
      updatedWant[setId][cardId] = isWantedNow;
      setWantData(updatedWant);
    } catch (error) {
      console.error('Error toggling want card:', error);
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
          <CardItem
            key={card.id}
            card={{ ...card, setId }}
            setName={displaySetName}
            amount={collection[setId]?.[card.id] ?? 0}
            isNeeded={isCardNeeded(needData, setId, card.id)}
            isWanted={isCardWanted(wantData, setId, card.id)}
            onIncrement={() => handleIncrement(card.id)}
            onDecrement={() => handleDecrement(card.id)}
            onToggleNeed={() => handleNeedToggle(card.id)}
            onToggleWant={() => handleWantToggle(card.id)}
          />
        ))}
      </div>
    </div>
  );
}
