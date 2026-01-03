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
        const setsWithSeries = seriesDetail.sets.map((set: any) => ({
          ...set,
          seriesName: series.name,
          seriesId: series.id
        }));
        allSets.push(...setsWithSeries);
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
