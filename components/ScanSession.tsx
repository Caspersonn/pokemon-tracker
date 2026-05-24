'use client';

import Image from 'next/image';
import { formatImageUrl } from '@/lib/image';

export interface ScannedCard {
  cardId: string;
  name: string;
  image: string;
  localId: string;
  setId: string;
  setName: string;
}

interface ScanSessionProps {
  cards: ScannedCard[];
  onUndo: (index: number) => void;
}

export default function ScanSession({ cards, onUndo }: ScanSessionProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <h3 className="font-semibold text-gray-900 dark:text-white">Scanned Cards</h3>
        <span className="text-sm font-medium text-indigo-600 dark:text-indigo-400">
          {cards.length} card{cards.length !== 1 ? 's' : ''}
        </span>
      </div>

      {cards.length === 0 ? (
        <div className="p-6 text-center text-gray-500 dark:text-gray-400 text-sm">
          Scanned cards will appear here
        </div>
      ) : (
        <div className="max-h-96 overflow-y-auto divide-y divide-gray-200 dark:divide-gray-700">
          {cards.map((card, index) => (
            <div key={`${card.cardId}-${index}`} className="flex items-center gap-3 px-4 py-2">
              <div className="relative w-10 h-14 flex-shrink-0 bg-gray-100 dark:bg-gray-700 rounded overflow-hidden">
                <Image
                  src={formatImageUrl(card.image)}
                  alt={card.name}
                  fill
                  className="object-contain"
                  sizes="40px"
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {card.name}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  #{card.localId} &middot; {card.setName}
                </p>
              </div>
              <button
                onClick={() => onUndo(index)}
                className="p-1.5 text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                title="Undo"
              >
                <svg className="w-4 h-4" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                  <path d="M3 10h10a5 5 0 015 5v2M3 10l4-4M3 10l4 4" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
