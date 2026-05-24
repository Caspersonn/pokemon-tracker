'use client';

import Image from 'next/image';
import { formatImageUrl } from '@/lib/image';
import type { CardEntry } from '@/lib/phash';
import type { Card } from '@/types/tcgdex';

interface MatchConfirmationProps {
  confirmedEntry?: CardEntry | null;
  topMatches?: { entry: CardEntry; score: number }[];
  allCards?: Card[];
  onSelect: (entry: CardEntry) => void;
  onDismiss: () => void;
}

export default function MatchConfirmation({
  confirmedEntry,
  topMatches,
  allCards,
  onSelect,
  onDismiss,
}: MatchConfirmationProps) {
  // High confidence: small overlay
  if (confirmedEntry) {
    return (
      <div className="absolute bottom-0 left-0 right-0 bg-green-600/90 backdrop-blur-sm px-4 py-3 flex items-center gap-3">
        <div className="relative w-10 h-14 flex-shrink-0 bg-white/20 rounded overflow-hidden">
          <Image
            src={formatImageUrl(confirmedEntry.image)}
            alt={confirmedEntry.name}
            fill
            className="object-contain"
            sizes="40px"
          />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white font-semibold text-sm truncate">{confirmedEntry.name}</p>
          <p className="text-green-100 text-xs">#{confirmedEntry.localId} — Added to collection</p>
        </div>
        <svg className="w-6 h-6 text-white flex-shrink-0" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
          <path d="M5 13l4 4L19 7" />
        </svg>
      </div>
    );
  }

  // Low confidence: popup with top matches + manual picker
  if (topMatches && topMatches.length > 0) {
    return (
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-end justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
            <p className="font-semibold text-gray-900 dark:text-white">Which card is this?</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Select the correct match or skip</p>
          </div>

          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {topMatches.map(({ entry, score }) => (
              <button
                key={entry.cardId}
                onClick={() => onSelect(entry)}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <div className="relative w-10 h-14 flex-shrink-0 bg-gray-100 dark:bg-gray-700 rounded overflow-hidden">
                  <Image
                    src={formatImageUrl(entry.image)}
                    alt={entry.name}
                    fill
                    className="object-contain"
                    sizes="40px"
                  />
                </div>
                <div className="flex-1 text-left min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{entry.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">#{entry.localId}</p>
                </div>
                <span className="text-xs text-gray-400 dark:text-gray-500 flex-shrink-0">
                  {Math.round(score * 100)}%
                </span>
              </button>
            ))}
          </div>

          {allCards && (
            <details className="border-t border-gray-200 dark:border-gray-700">
              <summary className="px-4 py-2 text-sm text-blue-600 dark:text-blue-400 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700">
                Pick from all cards in set
              </summary>
              <div className="max-h-48 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-700">
                {allCards.map(card => (
                  <button
                    key={card.id}
                    onClick={() => onSelect({
                      cardId: card.id,
                      features: new Float32Array(0),
                      name: card.name,
                      image: card.image,
                      localId: card.localId,
                    })}
                    className="w-full flex items-center gap-2 px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left"
                  >
                    <span className="text-xs text-gray-500 dark:text-gray-400 w-8">#{card.localId}</span>
                    <span className="text-sm text-gray-900 dark:text-white truncate">{card.name}</span>
                  </button>
                ))}
              </div>
            </details>
          )}

          <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={onDismiss}
              className="w-full py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
            >
              Skip this card
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
