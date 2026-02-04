'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { signOut } from 'next-auth/react';
import type { CardSet, CollectionData } from '@/types/tcgdex';
import { getCollection, isCardCollected, toggleCard, getNeedCards, isCardNeeded, toggleNeedCard, getWantCards, isCardWanted, toggleWantCard } from '@/lib/storage';
import { formatImageUrl } from '@/lib/image';

interface ExplorePageProps {
  sets: CardSet[];
}

interface ExploreCard {
  id: string;
  localId: string;
  name: string;
  image: string;
  setId: string;
}

type SortOption = 'name-asc' | 'name-desc' | 'date-asc' | 'date-desc';

const CARDS_PER_PAGE_OPTIONS = [10, 25, 50];

// Available types from TCGDex API
const POKEMON_TYPES = [
  'Colorless', 'Darkness', 'Dragon', 'Fairy', 'Fighting',
  'Fire', 'Grass', 'Lightning', 'Metal', 'Psychic', 'Water'
];

// Common rarities from TCGDex API
const POKEMON_RARITIES = [
  'Common', 'Uncommon', 'Rare', 'Rare Holo', 'Ultra Rare',
  'Secret Rare', 'Amazing Rare', 'Radiant Rare',
  'Holo Rare V', 'Holo Rare VMAX', 'Holo Rare VSTAR'
];

export default function ExplorePage({ sets }: ExplorePageProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [sortOption, setSortOption] = useState<SortOption>('name-asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [cardsPerPage, setCardsPerPage] = useState(25);

  // Filter states - now using Sets for multiple selection
  const [selectedSets, setSelectedSets] = useState<Set<string>>(new Set());
  const [selectedTypes, setSelectedTypes] = useState<Set<string>>(new Set());
  const [selectedRarities, setSelectedRarities] = useState<Set<string>>(new Set());
  const [showUncollectedOnly, setShowUncollectedOnly] = useState(false);
  const [showCollectedOnly, setShowCollectedOnly] = useState(false);
  const [showNeededOnly, setShowNeededOnly] = useState(false);
  const [showWantedOnly, setShowWantedOnly] = useState(false);

  // Cards state
  const [cards, setCards] = useState<ExploreCard[]>([]);
  const [isLoadingCards, setIsLoadingCards] = useState(true);

  // Collection state
  const [collection, setCollection] = useState<CollectionData>({});
  const [collected, setCollected] = useState<Record<string, boolean>>({});

  // Need state
  const [needData, setNeedData] = useState<CollectionData>({});
  const [needed, setNeeded] = useState<Record<string, boolean>>({});

  // Want state
  const [wantData, setWantData] = useState<CollectionData>({});
  const [wanted, setWanted] = useState<Record<string, boolean>>({});

  // Create a map of set IDs to set names for quick lookup
  const setNameMap = useMemo(() => {
    const map = new Map<string, string>();
    sets.forEach(set => map.set(set.id, set.name));
    return map;
  }, [sets]);

  // Fetch cards from API when filters change
  const fetchCards = useCallback(async () => {
    setIsLoadingCards(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.set('name', searchQuery);
      if (selectedTypes.size > 0) params.set('types', Array.from(selectedTypes).join('|'));
      if (selectedRarities.size > 0) params.set('rarities', Array.from(selectedRarities).join('|'));
      if (selectedSets.size > 0) params.set('sets', Array.from(selectedSets).join(','));
      params.set('sort', sortOption);

      const response = await fetch(`/api/explore?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch cards');

      const data = await response.json();
      setCards(data.cards);
    } catch (error) {
      console.error('Error fetching cards:', error);
      setCards([]);
    } finally {
      setIsLoadingCards(false);
    }
  }, [searchQuery, selectedTypes, selectedRarities, selectedSets, sortOption]);

  // Load collection, need, and want data on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const [collectionData, needCardsData, wantCardsData] = await Promise.all([
          getCollection(),
          getNeedCards(),
          getWantCards(),
        ]);
        setCollection(collectionData);
        setNeedData(needCardsData);
        setWantData(wantCardsData);
      } catch (error) {
        console.error('Error loading data:', error);
      }
    };
    loadData();
  }, []);

  // Fetch cards when filters change
  useEffect(() => {
    fetchCards();
  }, [fetchCards]);

  // Update card statuses when collection/need/want data changes (without refetching)
  useEffect(() => {
    const collectedStatus: Record<string, boolean> = {};
    const neededStatus: Record<string, boolean> = {};
    const wantedStatus: Record<string, boolean> = {};
    cards.forEach((card) => {
      collectedStatus[card.id] = isCardCollected(collection, card.setId, card.id);
      neededStatus[card.id] = isCardNeeded(needData, card.setId, card.id);
      wantedStatus[card.id] = isCardWanted(wantData, card.setId, card.id);
    });
    setCollected(collectedStatus);
    setNeeded(neededStatus);
    setWanted(wantedStatus);
  }, [cards, collection, needData, wantData]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedTypes, selectedRarities, selectedSets, cardsPerPage]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(searchInput);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const handleToggle = async (card: ExploreCard) => {
    try {
      const isCollectedNow = await toggleCard(card.setId, card.id);

      setCollected(prev => ({
        ...prev,
        [card.id]: isCollectedNow
      }));

      const updatedCollection = { ...collection };
      if (!updatedCollection[card.setId]) {
        updatedCollection[card.setId] = {};
      }
      updatedCollection[card.setId][card.id] = isCollectedNow;
      setCollection(updatedCollection);
    } catch (error) {
      console.error('Error toggling card:', error);
    }
  };

  const handleNeedToggle = async (card: ExploreCard) => {
    try {
      const isNeededNow = await toggleNeedCard(card.setId, card.id);

      setNeeded(prev => ({
        ...prev,
        [card.id]: isNeededNow
      }));

      const updatedNeed = { ...needData };
      if (!updatedNeed[card.setId]) {
        updatedNeed[card.setId] = {};
      }
      updatedNeed[card.setId][card.id] = isNeededNow;
      setNeedData(updatedNeed);
    } catch (error) {
      console.error('Error toggling need card:', error);
    }
  };

  const handleWantToggle = async (card: ExploreCard) => {
    try {
      const isWantedNow = await toggleWantCard(card.setId, card.id);

      setWanted(prev => ({
        ...prev,
        [card.id]: isWantedNow
      }));

      const updatedWant = { ...wantData };
      if (!updatedWant[card.setId]) {
        updatedWant[card.setId] = {};
      }
      updatedWant[card.setId][card.id] = isWantedNow;
      setWantData(updatedWant);
    } catch (error) {
      console.error('Error toggling want card:', error);
    }
  };

  // Toggle functions for multi-select
  const toggleType = (type: string) => {
    setSelectedTypes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(type)) {
        newSet.delete(type);
      } else {
        newSet.add(type);
      }
      return newSet;
    });
  };

  const toggleRarity = (rarity: string) => {
    setSelectedRarities(prev => {
      const newSet = new Set(prev);
      if (newSet.has(rarity)) {
        newSet.delete(rarity);
      } else {
        newSet.add(rarity);
      }
      return newSet;
    });
  };

  const toggleSet = (setId: string) => {
    setSelectedSets(prev => {
      const newSet = new Set(prev);
      if (newSet.has(setId)) {
        newSet.delete(setId);
      } else {
        newSet.add(setId);
      }
      return newSet;
    });
  };

  // Client-side filtering for collection status, needed, and wanted
  const filteredCards = useMemo(() => {
    let filtered = cards;

    if (showUncollectedOnly) {
      filtered = filtered.filter(card => !collected[card.id]);
    }

    if (showCollectedOnly) {
      filtered = filtered.filter(card => collected[card.id]);
    }

    if (showNeededOnly) {
      filtered = filtered.filter(card => needed[card.id]);
    }

    if (showWantedOnly) {
      filtered = filtered.filter(card => wanted[card.id]);
    }

    return filtered;
  }, [cards, showUncollectedOnly, showCollectedOnly, showNeededOnly, showWantedOnly, collected, needed, wanted]);

  // Pagination
  const totalPages = Math.ceil(filteredCards.length / cardsPerPage);
  const paginatedCards = filteredCards.slice(
    (currentPage - 1) * cardsPerPage,
    currentPage * cardsPerPage
  );

  // Generate page numbers to display
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible + 2) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push('...');

      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (currentPage < totalPages - 2) pages.push('...');
      pages.push(totalPages);
    }
    return pages;
  };

  const clearAllFilters = () => {
    setSelectedSets(new Set());
    setSelectedTypes(new Set());
    setSelectedRarities(new Set());
    setShowUncollectedOnly(false);
    setShowCollectedOnly(false);
    setShowNeededOnly(false);
    setShowWantedOnly(false);
    setSearchInput('');
    setSearchQuery('');
  };

  const totalActiveFilters = selectedSets.size + selectedTypes.size + selectedRarities.size + (showUncollectedOnly ? 1 : 0) + (showCollectedOnly ? 1 : 0) + (showNeededOnly ? 1 : 0) + (showWantedOnly ? 1 : 0);

  // Checkbox component for consistent styling
  const Checkbox = ({ checked, onChange, label }: { checked: boolean; onChange: () => void; label: string }) => (
    <button
      onClick={onChange}
      className={`w-full text-left px-3 py-1.5 rounded text-sm transition-colors flex items-center gap-2 ${
        checked
          ? 'bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100'
          : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
      }`}
    >
      <div className={`w-4 h-4 border-2 rounded flex items-center justify-center flex-shrink-0 ${
        checked
          ? 'border-blue-600 bg-blue-600'
          : 'border-gray-300 dark:border-gray-600'
      }`}>
        {checked && (
          <svg className="w-3 h-3 text-white" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
            <path d="M5 13l4 4L19 7"></path>
          </svg>
        )}
      </div>
      <span className="truncate">{label}</span>
    </button>
  );

  // Filter section component (reused for desktop and mobile)
  const FilterSection = () => (
    <>
      {/* Collection Status Filters */}
      <div className="mb-6 space-y-1">
        <Checkbox
          checked={showUncollectedOnly}
          onChange={() => setShowUncollectedOnly(!showUncollectedOnly)}
          label="Uncollected"
        />
        <Checkbox
          checked={showCollectedOnly}
          onChange={() => setShowCollectedOnly(!showCollectedOnly)}
          label="Collected"
        />
        <Checkbox
          checked={showNeededOnly}
          onChange={() => setShowNeededOnly(!showNeededOnly)}
          label="Needed"
        />
        <Checkbox
          checked={showWantedOnly}
          onChange={() => setShowWantedOnly(!showWantedOnly)}
          label="Wanted"
        />
      </div>

      {/* Type Filter */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Type</h3>
          {selectedTypes.size > 0 && (
            <button onClick={() => setSelectedTypes(new Set())} className="text-xs text-blue-600 dark:text-blue-400 hover:underline">
              Clear
            </button>
          )}
        </div>
        <div className="space-y-1 max-h-48 overflow-y-auto">
          {POKEMON_TYPES.map(type => (
            <Checkbox
              key={type}
              checked={selectedTypes.has(type)}
              onChange={() => toggleType(type)}
              label={type}
            />
          ))}
        </div>
      </div>

      {/* Rarity Filter */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Rarity</h3>
          {selectedRarities.size > 0 && (
            <button onClick={() => setSelectedRarities(new Set())} className="text-xs text-blue-600 dark:text-blue-400 hover:underline">
              Clear
            </button>
          )}
        </div>
        <div className="space-y-1 max-h-48 overflow-y-auto">
          {POKEMON_RARITIES.map(rarity => (
            <Checkbox
              key={rarity}
              checked={selectedRarities.has(rarity)}
              onChange={() => toggleRarity(rarity)}
              label={rarity}
            />
          ))}
        </div>
      </div>

      {/* Set Filter */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Set</h3>
          {selectedSets.size > 0 && (
            <button onClick={() => setSelectedSets(new Set())} className="text-xs text-blue-600 dark:text-blue-400 hover:underline">
              Clear
            </button>
          )}
        </div>
        <div className="space-y-1 max-h-64 overflow-y-auto">
          {sets.map(set => (
            <Checkbox
              key={set.id}
              checked={selectedSets.has(set.id)}
              onChange={() => toggleSet(set.id)}
              label={set.name}
            />
          ))}
        </div>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <header className="bg-white dark:bg-gray-800 shadow-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center gap-6 flex-1">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  Pokemon Card Collection Tracker
                </h1>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                  Explore all Pokemon cards
                </p>
              </div>

              {/* Navigation */}
              <nav className="flex items-center gap-1">
                <Link
                  href="/"
                  className="px-4 py-2 text-base font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  Sets
                </Link>
                <Link
                  href="/explore"
                  className="px-4 py-2 text-base font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                >
                  Explore
                </Link>
              </nav>
            </div>

            {/* Search, Sort, and Logout */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => signOut({ callbackUrl: '/auth/signin' })}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                Logout
              </button>

              {/* Sort dropdown */}

              {isSearchOpen && (
                <input
                  type="text"
                  placeholder="Search by name..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white w-64 transition-all duration-200"
                  autoFocus
                />
              )}

              <button
                onClick={() => {
                  setIsSearchOpen(!isSearchOpen);
                  if (isSearchOpen) {
                    setSearchInput('');
                    setSearchQuery('');
                  }
                }}
                className="p-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors duration-200"
                aria-label="Search"
              >
                {isSearchOpen ? (
                  <svg className="w-6 h-6" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                    <path d="M6 18L18 6M6 6l12 12"></path>
                  </svg>
                ) : (
                  <svg className="w-6 h-6" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                    <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Filter/Search Status */}
          {(searchQuery || totalActiveFilters > 0) && (
            <div className="mt-4 flex items-center gap-2 flex-wrap">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Found {filteredCards.length} card{filteredCards.length !== 1 ? 's' : ''}
              </span>
              {showUncollectedOnly && (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-100">
                  Uncollected only
                  <button onClick={() => setShowUncollectedOnly(false)} className="ml-1 hover:text-gray-900 dark:hover:text-gray-50">×</button>
                </span>
              )}
              {showCollectedOnly && (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100">
                  Collected only
                  <button onClick={() => setShowCollectedOnly(false)} className="ml-1 hover:text-green-900 dark:hover:text-green-50">×</button>
                </span>
              )}
              {showNeededOnly && (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-100">
                  Needed only
                  <button onClick={() => setShowNeededOnly(false)} className="ml-1 hover:text-blue-900 dark:hover:text-blue-50">×</button>
                </span>
              )}
              {showWantedOnly && (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-100">
                  Wanted only
                  <button onClick={() => setShowWantedOnly(false)} className="ml-1 hover:text-red-900 dark:hover:text-red-50">×</button>
                </span>
              )}
              {searchQuery && (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-100">
                  Search: &quot;{searchQuery}&quot;
                  <button onClick={() => { setSearchInput(''); setSearchQuery(''); }} className="ml-1 hover:text-blue-900 dark:hover:text-blue-50">×</button>
                </span>
              )}
              {Array.from(selectedTypes).map(type => (
                <span key={type} className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-100">
                  {type}
                  <button onClick={() => toggleType(type)} className="ml-1 hover:text-orange-900 dark:hover:text-orange-50">×</button>
                </span>
              ))}
              {Array.from(selectedRarities).map(rarity => (
                <span key={rarity} className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-100">
                  {rarity}
                  <button onClick={() => toggleRarity(rarity)} className="ml-1 hover:text-purple-900 dark:hover:text-purple-50">×</button>
                </span>
              ))}
              {Array.from(selectedSets).map(setId => (
                <span key={setId} className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100">
                  {setNameMap.get(setId) || setId}
                  <button onClick={() => toggleSet(setId)} className="ml-1 hover:text-green-900 dark:hover:text-green-50">×</button>
                </span>
              ))}
              {totalActiveFilters > 0 && (
                <button onClick={clearAllFilters} className="text-xs text-blue-600 dark:text-blue-400 hover:underline">
                  Clear all filters
                </button>
              )}
            </div>
          )}
        </div>
      </header>

      <div className="py-8">
        <div className="flex">
          {/* Left Sidebar - Filters */}
          <aside className="w-64 flex-shrink-0 hidden lg:block pl-8">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 sticky top-32">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Filters</h2>
                {totalActiveFilters > 0 && (
                  <button onClick={clearAllFilters} className="text-xs text-blue-600 dark:text-blue-400 hover:underline">
                    Clear all
                  </button>
                )}
              </div>
              <FilterSection />
            </div>
          </aside>

          {/* Mobile Filter Button */}
          <button
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className="lg:hidden fixed bottom-20 left-4 z-40 p-3 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg"
          >
            <svg className="w-6 h-6" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
              <path d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"></path>
            </svg>
            {totalActiveFilters > 0 && (
              <span className="absolute -top-1 -right-1 bg-green-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                {totalActiveFilters}
              </span>
            )}
          </button>

          {/* Mobile Filter Panel */}
          {isFilterOpen && (
            <div className="lg:hidden fixed inset-0 z-50 bg-black bg-opacity-50" onClick={() => setIsFilterOpen(false)}>
              <div className="absolute left-0 top-0 bottom-0 w-80 bg-white dark:bg-gray-800 overflow-y-auto p-4" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Filters</h2>
                  <button onClick={() => setIsFilterOpen(false)} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                    <svg className="w-6 h-6" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                      <path d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                  </button>
                </div>
                <FilterSection />
                {totalActiveFilters > 0 && (
                  <button onClick={clearAllFilters} className="mt-4 w-full py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors">
                    Clear all filters
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Main Content */}
          <main className="flex-1 px-8">
            <div className="mb-4 flex justify-end">
              <select
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value as SortOption)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm"
              >
                <option value="name-asc">Sort by: Name: A to Z</option>
                <option value="name-desc">Sort by: Name: Z to A</option>
                <option value="date-asc">Sort by: Date: old to new</option>
                <option value="date-desc">Sort by: Date: new to old</option>
              </select>
            </div>

            {isLoadingCards ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-gray-600 dark:text-gray-400">Loading cards...</div>
              </div>
            ) : (
              <>
                {/* Cards Grid */}
                {paginatedCards.length > 0 ? (
                  <div className="grid grid-cols-[repeat(auto-fill,minmax(250px,1fr))] gap-4">
                    {paginatedCards.map((card) => (
                      <div
                        key={card.id}
                        className={`bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden transition-all duration-300 ${
                          collected[card.id] ? 'ring-2 ring-green-500' : ''
                        }`}
                      >
                        <div className="relative w-full aspect-[3/4] bg-gray-100 dark:bg-gray-700">
                          <Image
                            src={formatImageUrl(card.image)}
                            alt={card.name}
                            fill
                            className={`object-contain transition-all duration-300 ${
                              collected[card.id] ? 'grayscale opacity-50' : ''
                            }`}
                            sizes="(max-width: 640px) 33vw, (max-width: 768px) 25vw, (max-width: 1024px) 20vw, (max-width: 1280px) 16vw, 12vw"
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
                            {setNameMap.get(card.setId) || card.setId}
                          </div>
                          <div className="flex items-center gap-2.5">
                            <button
                              onClick={() => handleToggle(card)}
                              className={`flex-1 py-1.5 px-2 rounded font-medium transition-colors duration-200 ${
                                collected[card.id]
                                  ? 'bg-green-500 hover:bg-green-600 text-white'
                                  : 'bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300'
                              }`}
                            >
                              {collected[card.id] ? 'Collected ✓' : 'Uncollected'}
                            </button>
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => handleNeedToggle(card)}
                                className={`py-1.5 px-2 rounded text-sm font-medium transition-colors duration-200 ${
                                  needed[card.id]
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
                                onClick={() => handleWantToggle(card)}
                                className={`py-1.5 px-2 rounded text-sm font-medium transition-colors duration-200 ${
                                  wanted[card.id]
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
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-xl text-gray-600 dark:text-gray-400">
                      No cards found
                      {searchQuery && ` matching "${searchQuery}"`}
                    </p>
                    <button onClick={clearAllFilters} className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
                      Clear filters
                    </button>
                  </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Show:</span>
                      <select
                        value={cardsPerPage}
                        onChange={(e) => setCardsPerPage(Number(e.target.value))}
                        className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm"
                      >
                        {CARDS_PER_PAGE_OPTIONS.map(option => (
                          <option key={option} value={option}>{option} per page</option>
                        ))}
                      </select>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                        className="px-3 py-1.5 rounded-lg bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        Prev
                      </button>

                      {getPageNumbers().map((page, index) => (
                        page === '...' ? (
                          <span key={`ellipsis-${index}`} className="px-2 text-gray-500 dark:text-gray-400">...</span>
                        ) : (
                          <button
                            key={page}
                            onClick={() => setCurrentPage(page as number)}
                            className={`px-3 py-1.5 rounded-lg transition-colors ${
                              currentPage === page
                                ? 'bg-blue-600 text-white'
                                : 'bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'
                            }`}
                          >
                            {page}
                          </button>
                        )
                      ))}

                      <button
                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                        disabled={currentPage === totalPages}
                        className="px-3 py-1.5 rounded-lg bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        Next
                      </button>
                    </div>

                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Page {currentPage} of {totalPages}
                    </span>
                  </div>
                )}
              </>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
