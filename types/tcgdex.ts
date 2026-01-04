// Type definitions for tcgdex API

export interface CardSet {
  id: string;
  name: string;
  seriesName: string;
  seriesId: string;
  logo?: string;
  symbol?: string;
  cardCount: {
    total: number;
    official: number;
  };
  releaseDate?: string; // ISO date format: YYYY-MM-DD
}

export interface Card {
  id: string;
  localId: string;
  name: string;
  image: string;
  category: string;
  types?: string[];
  rarity: string;
  illustrator?: string;
  hp?: number;
  set: {
    id: string;
    name: string;
    cardCount: {
      official: number;
      total: number;
    };
  };
}

export interface CollectionData {
  [setId: string]: {
    [cardId: string]: boolean; // true if collected
  };
}
