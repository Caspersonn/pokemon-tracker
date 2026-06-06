'use client';

import Image from 'next/image';
import { formatImageUrl } from '@/lib/image';

interface CardItemProps {
  card: {
    id: string;
    localId: string;
    name: string;
    image: string;
    setId: string;
  };
  setName: string;
  amount: number;
  isNeeded: boolean;
  isWanted: boolean;
  onIncrement: () => void;
  onDecrement: () => void;
  onToggleNeed: () => void;
  onToggleWant: () => void;
}

export default function CardItem({
  card,
  setName,
  amount,
  isNeeded,
  isWanted,
  onIncrement,
  onDecrement,
  onToggleNeed,
  onToggleWant,
}: CardItemProps) {
  const isCollected = amount > 0;

  return (
    <div
      className={`bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden transition-all duration-300 ${
        isCollected ? 'ring-2 ring-green-500' : ''
      }`}
    >
      <div className="relative w-full aspect-[3/4] bg-gray-100 dark:bg-gray-700">
        <Image
          src={formatImageUrl(card.image)}
          alt={card.name}
          fill
          className="object-contain"
          sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 16vw"
        />
      </div>

      <div className="p-4">
        <div className="text-gray-500 text-[13px] dark:text-gray-400 mb-0.5">
          #{card.localId}
        </div>
        <h3 className="font-semibold text-xs text-gray-900 dark:text-white mb-0.5 line-clamp-1">
          {card.name}
        </h3>
        <div className="text-gray-500 dark:text-gray-400 mb-1.5 line-clamp-1">
          {setName}
        </div>
        <div className="flex items-center gap-2.5">
          {/* Quantity stepper */}
          <div
            className={`flex items-center rounded overflow-hidden flex-1 transition-colors duration-200 ${
              isCollected
                ? 'bg-green-500 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            <button
              onClick={onDecrement}
              disabled={!isCollected}
              className={`py-1.5 px-2 font-medium transition-colors ${
                isCollected
                  ? 'hover:bg-green-600'
                  : 'opacity-50 cursor-not-allowed'
              }`}
            >
              -
            </button>
            <span className="flex-1 text-center font-medium text-sm">
              {amount}
            </span>
            <button
              onClick={onIncrement}
              className={`py-1.5 px-2 font-medium transition-colors ${
                isCollected
                  ? 'hover:bg-green-600'
                  : 'hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              +
            </button>
          </div>

          {/* Need/Want buttons */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={onToggleNeed}
              className={`py-1.5 px-2 rounded text-sm font-medium transition-colors duration-200 ${
                isNeeded
                  ? 'bg-blue-500 hover:bg-blue-600 text-white'
                  : 'bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300'
              }`}
              aria-label="Need card"
            >
              <svg className="w-6 h-6" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                <path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"></path>
              </svg>
            </button>
            <button
              onClick={onToggleWant}
              className={`py-1.5 px-2 rounded text-sm font-medium transition-colors duration-200 ${
                isWanted
                  ? 'bg-red-500 hover:bg-red-600 text-white'
                  : 'bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300'
              }`}
              aria-label="Want card"
            >
              <svg className="w-6 h-6" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
