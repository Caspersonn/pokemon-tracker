import { NextRequest, NextResponse } from 'next/server';

const API_BASE = 'https://api.tcgdex.net/v2/en';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;

  // Build query params for TCGDex API
  const queryParams = new URLSearchParams();

  // Name filter (partial match)
  const name = searchParams.get('name');
  if (name) {
    queryParams.set('name', `like:${name}`);
  }

  // Type filter (supports multiple values separated by |)
  const types = searchParams.get('types');
  if (types) {
    queryParams.set('types', types);
  }

  // Rarity filter (supports multiple values separated by |)
  const rarities = searchParams.get('rarities');
  if (rarities) {
    queryParams.set('rarity', rarities);
  }

  // Set filter - comma-separated list of set IDs (filtered client-side)
  const setIds = searchParams.get('sets');
  const setIdArray = setIds ? setIds.split(',') : [];

  // Sort
  const sort = searchParams.get('sort');
  if (sort === 'name-asc') {
    queryParams.set('sort:field', 'name');
    queryParams.set('sort:order', 'ASC');
  } else if (sort === 'name-desc') {
    queryParams.set('sort:field', 'name');
    queryParams.set('sort:order', 'DESC');
  }
  // Note: date sorting will be done client-side after fetching set dates

  try {
    const url = `${API_BASE}/cards${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await fetch(url, {
      next: { revalidate: 3600 } // Cache for 1 hour
    });

    if (!response.ok) {
      throw new Error('Failed to fetch cards from TCGDex');
    }

    let cards = await response.json();

    // Apply set filter client-side (API doesn't support this directly)
    if (setIdArray.length > 0) {
      cards = cards.filter((card: any) => {
        const lastHyphenIndex = card.id.lastIndexOf('-');
        const cardSetId = lastHyphenIndex > 0 ? card.id.substring(0, lastHyphenIndex) : '';
        return setIdArray.includes(cardSetId);
      });
    }

    // Map to consistent structure with extracted set ID
    const mappedCards = cards.map((card: any) => {
      const lastHyphenIndex = card.id.lastIndexOf('-');
      const extractedSetId = lastHyphenIndex > 0 ? card.id.substring(0, lastHyphenIndex) : '';

      return {
        id: card.id,
        localId: card.localId,
        name: card.name,
        image: card.image || `https://assets.tcgdex.net/en/${extractedSetId}/${card.localId}`,
        setId: extractedSetId
      };
    });

    // Fetch set details for date sorting
    const uniqueSetIds = [...new Set(mappedCards.map(c => c.setId))];
    const setDetailsMap = new Map<string, string>();

    await Promise.all(
      uniqueSetIds.map(async (setId) => {
        try {
          const setResponse = await fetch(`${API_BASE}/sets/${setId}`, {
            next: { revalidate: 3600 }
          });
          if (setResponse.ok) {
            const setData = await setResponse.json();
            if (setData.releaseDate) {
              setDetailsMap.set(setId, setData.releaseDate);
            }
          }
        } catch (error) {
          console.error(`Error fetching set details for ${setId}:`, error);
        }
      })
    );

    // Add releaseDate to cards
    const cardsWithDates = mappedCards.map(card => ({
      ...card,
      releaseDate: setDetailsMap.get(card.setId) || null
    }));

    // Apply date sorting if requested
    let sortedCards = cardsWithDates;
    if (sort === 'date-asc') {
      sortedCards = [...cardsWithDates].sort((a, b) => {
        if (!a.releaseDate && !b.releaseDate) return 0;
        if (!a.releaseDate) return 1;
        if (!b.releaseDate) return -1;
        return new Date(a.releaseDate).getTime() - new Date(b.releaseDate).getTime();
      });
    } else if (sort === 'date-desc') {
      sortedCards = [...cardsWithDates].sort((a, b) => {
        if (!a.releaseDate && !b.releaseDate) return 0;
        if (!a.releaseDate) return 1;
        if (!b.releaseDate) return -1;
        return new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime();
      });
    }

    return NextResponse.json({
      cards: sortedCards,
      total: sortedCards.length
    });
  } catch (error) {
    console.error('Error fetching cards:', error);
    return NextResponse.json(
      { error: 'Failed to fetch cards' },
      { status: 500 }
    );
  }
}
