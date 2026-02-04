import type { CardSet, Card } from '@/types/tcgdex';

const API_BASE = 'https://api.tcgdex.net/v2/en';

export async function fetchAllSets(): Promise<CardSet[]> {
  // First fetch all series
  const seriesResponse = await fetch(`${API_BASE}/series`, {
    next: { revalidate: 3600 } // Cache for 1 hour
  });

  if (!seriesResponse.ok) {
    throw new Error('Failed to fetch series');
  }

  const seriesList = await seriesResponse.json();

  // Fetch sets for each series
  const allSets: CardSet[] = [];

  for (const series of seriesList) {
    const seriesDetailResponse = await fetch(`${API_BASE}/series/${series.id}`, {
      next: { revalidate: 3600 }
    });

    if (seriesDetailResponse.ok) {
      const seriesDetail = await seriesDetailResponse.json();

      // Add series information to each set
      if (seriesDetail.sets) {
        // Fetch detailed info for each set to get release dates
        const setsWithDetails = await Promise.all(
          seriesDetail.sets.map(async (set: any) => {
            try {
              const setDetailResponse = await fetch(`${API_BASE}/sets/${set.id}`, {
                next: { revalidate: 3600 }
              });

              if (setDetailResponse.ok) {
                const setDetail = await setDetailResponse.json();
                return {
                  ...set,
                  seriesName: series.name,
                  seriesId: series.id,
                  releaseDate: setDetail.releaseDate
                };
              }
            } catch (error) {
              console.error(`Error fetching details for set ${set.id}:`, error);
            }

            // Fallback if detailed fetch fails
            return {
              ...set,
              seriesName: series.name,
              seriesId: series.id
            };
          })
        );

        allSets.push(...setsWithDetails);
      }
    }
  }

  return allSets;
}

export async function fetchSetCards(setId: string): Promise<Card[]> {
  const response = await fetch(`${API_BASE}/sets/${setId}`, {
    next: { revalidate: 3600 }
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch cards for set ${setId}`);
  }

  const data = await response.json();
  return data.cards || [];
}

export async function fetchAllCards(): Promise<Card[]> {
  // Fetch all cards from the API
  const response = await fetch(`${API_BASE}/cards`, {
    next: { revalidate: 3600 }
  });

  if (!response.ok) {
    throw new Error('Failed to fetch all cards');
  }

  const cardsList = await response.json();

  // The /cards endpoint returns minimal data: id, localId, name, image
  // Extract set ID from card ID (e.g., "base1-1" -> "base1", "sv08-123" -> "sv08")
  const cards: Card[] = cardsList.map((card: any) => {
    // Extract set ID: everything before the last hyphen
    const lastHyphenIndex = card.id.lastIndexOf('-');
    const setId = lastHyphenIndex > 0 ? card.id.substring(0, lastHyphenIndex) : '';

    return {
      id: card.id,
      localId: card.localId,
      name: card.name,
      image: card.image || `https://assets.tcgdex.net/en/${setId}/${card.localId}`,
      category: 'Pokemon',
      types: [],
      rarity: '',
      set: {
        id: setId,
        name: '',
        cardCount: { official: 0, total: 0 }
      }
    };
  });

  return cards;
}
