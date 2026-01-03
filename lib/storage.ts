import type { CollectionData } from '@/types/tcgdex';

// Re-export types for convenience
export type { CollectionData };

// API-based storage functions (replaces localStorage)

export async function getCollection(): Promise<CollectionData> {
  try {
    const response = await fetch('/api/collection');
    if (!response.ok) {
      if (response.status === 401) {
        // User not authenticated
        return {};
      }
      throw new Error('Failed to fetch collection');
    }
    const data = await response.json();
    return data.collection || {};
  } catch (error) {
    console.error('Error loading collection data:', error);
    return {};
  }
}

export async function toggleCard(setId: string, cardId: string): Promise<boolean> {
  try {
    const response = await fetch('/api/collection/toggle', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ setId, cardId }),
    });

    if (!response.ok) {
      throw new Error('Failed to toggle card');
    }

    const data = await response.json();
    return data.collected;
  } catch (error) {
    console.error('Error toggling card:', error);
    throw error;
  }
}

export function isCardCollected(collection: CollectionData, setId: string, cardId: string): boolean {
  return collection[setId]?.[cardId] || false;
}

export function getSetProgress(
  collection: CollectionData,
  setId: string,
  totalCards: number
): { collected: number; total: number; percentage: number } {
  const setData = collection[setId] || {};
  const collected = Object.values(setData).filter(Boolean).length;

  return {
    collected,
    total: totalCards,
    percentage: totalCards > 0 ? Math.round((collected / totalCards) * 100) : 0,
  };
}

// Filter series functions
export async function getFilterSeries(): Promise<string[]> {
  try {
    const response = await fetch('/api/filter/series');
    if (!response.ok) {
      if (response.status === 401) {
        return [];
      }
      throw new Error('Failed to fetch filter series');
    }
    const data = await response.json();
    return data.series || [];
  } catch (error) {
    console.error('Error loading filter series:', error);
    return [];
  }
}

export async function saveFilterSeries(series: string[]): Promise<void> {
  try {
    const response = await fetch('/api/filter/series', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ series }),
    });

    if (!response.ok) {
      throw new Error('Failed to save filter series');
    }
  } catch (error) {
    console.error('Error saving filter series:', error);
    throw error;
  }
}

// Wishlist sets functions
export async function getNeededCardsSets(): Promise<string[]> {
  try {
    const response = await fetch('/api/wishlist/sets');
    if (!response.ok) {
      if (response.status === 401) {
        return [];
      }
      throw new Error('Failed to fetch wishlist sets');
    }
    const data = await response.json();
    return data.sets || [];
  } catch (error) {
    console.error('Error loading wishlist sets:', error);
    return [];
  }
}

export async function saveNeededCardsSets(setIds: string[]): Promise<void> {
  try {
    const response = await fetch('/api/wishlist/sets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sets: setIds }),
    });

    if (!response.ok) {
      throw new Error('Failed to save wishlist sets');
    }
  } catch (error) {
    console.error('Error saving wishlist sets:', error);
    throw error;
  }
}

export async function toggleNeededCardsSet(setId: string, currentSets: string[]): Promise<string[]> {
  const index = currentSets.indexOf(setId);
  const newSets = [...currentSets];

  if (index === -1) {
    newSets.push(setId);
  } else {
    newSets.splice(index, 1);
  }

  await saveNeededCardsSets(newSets);
  return newSets;
}
