'use client';

import { useState, useCallback, useRef } from 'react';
import type { CardSet, Card } from '@/types/tcgdex';
import AppHeader from './AppHeader';
import { fetchSetCards } from '@/lib/api';
import { buildCardDB, getCachedCardDB, cacheCardDB, findBestMatch, featuresFromFrame, getModel, type CardDB, type CardEntry } from '@/lib/phash';
import { createScannerEngine, processFrame, CONFIDENT_THRESHOLD, type ScannerEngine, type ScanMatchResult, type ScanRegion } from '@/lib/scanner';
import CameraView from './CameraView';
import MatchConfirmation from './MatchConfirmation';
import ScanSession, { type ScannedCard } from './ScanSession';
import { formatImageUrl } from '@/lib/image';

interface ScanPageProps {
  sets: CardSet[];
}

interface DebugState {
  state: string;
  bestMatch: string;
  score: number;
  frameSim: number;
  frameMs: number;
  cropSrc: string;
  matchImageSrc: string;
}

export default function ScanPage({ sets }: ScanPageProps) {
  const [selectedSetId, setSelectedSetId] = useState<string>('');
  const [cardDB, setCardDB] = useState<CardDB | null>(null);
  const [buildProgress, setBuildProgress] = useState<{ current: number; total: number } | null>(null);
  const [scanning, setScanning] = useState(false);
  const [cards, setCards] = useState<Card[]>([]);
  const [scannedCards, setScannedCards] = useState<ScannedCard[]>([]);
  const [debug, setDebug] = useState(false);
  const [debugState, setDebugState] = useState<DebugState | null>(null);

  // Match state
  const [confirmedEntry, setConfirmedEntry] = useState<CardEntry | null>(null);
  const [lowConfidenceMatch, setLowConfidenceMatch] = useState<ScanMatchResult | null>(null);
  const handledRef = useRef(false);

  const engineRef = useRef<ScannerEngine>(createScannerEngine());

  const selectedSet = sets.find(s => s.id === selectedSetId);

  const handleSetSelect = useCallback(async (setId: string) => {
    setSelectedSetId(setId);
    setScanning(false);
    setConfirmedEntry(null);
    setLowConfidenceMatch(null);
    engineRef.current = createScannerEngine();

    if (!setId) {
      setCardDB(null);
      return;
    }

    setBuildProgress({ current: 0, total: 1 });
    try {
      await getModel();

      const cached = getCachedCardDB(setId);
      const fetchedCards = await fetchSetCards(setId);
      setCards(fetchedCards);

      if (cached) {
        setCardDB(cached);
        setScanning(true);
        setBuildProgress(null);
        return;
      }

      const db = await buildCardDB(fetchedCards, setId, (current, total) => {
        setBuildProgress({ current, total });
      });

      setCardDB(db);
      cacheCardDB(db);
      setScanning(true);
    } catch (err) {
      console.error('Failed to build card DB:', err);
    } finally {
      setBuildProgress(null);
    }
  }, []);

  const processingRef = useRef(false);
  const handleFrame = useCallback((video: HTMLVideoElement, scanRegion: ScanRegion) => {
    if (!cardDB || processingRef.current) return;
    processingRef.current = true;

    processFrame(engineRef.current, video, scanRegion, cardDB).then(async result => {
      engineRef.current = result.engine;

      if ((result.engine.state === 'confirmed' || result.engine.state === 'matching') && !handledRef.current) {
        const model = await getModel();
        const features = featuresFromFrame(model, video, scanRegion.scanX, scanRegion.scanY, scanRegion.scanW, scanRegion.scanH);
        const currentMatch = findBestMatch(features, cardDB);

        if (currentMatch && currentMatch.score > 0.5) {
          if (currentMatch.score > CONFIDENT_THRESHOLD) {
            if (result.match) {
              addCardToCollection(currentMatch.entry);
            }
            setConfirmedEntry(currentMatch.entry);
            setLowConfidenceMatch(null);
            handledRef.current = true;
          } else {
            setLowConfidenceMatch({
              entry: currentMatch.entry,
              score: currentMatch.score,
              confident: false,
              topMatches: currentMatch.topMatches,
            });
            setConfirmedEntry(null);
            handledRef.current = true;
          }
        }
      }

      if (result.stateChanged && (result.engine.state === 'transitioning' || result.engine.state === 'idle')) {
        setConfirmedEntry(null);
        setLowConfidenceMatch(null);
        handledRef.current = false;
      }

      // Update debug
      if (debug) {
        const model = await getModel();
        const features = featuresFromFrame(model, video, scanRegion.scanX, scanRegion.scanY, scanRegion.scanW, scanRegion.scanH);
        const bestResult = findBestMatch(features, cardDB);
        setDebugState(prev => ({
          state: result.engine.state,
          bestMatch: bestResult ? `${bestResult.entry.name} (#${bestResult.entry.localId})` : '(no match)',
          score: bestResult ? Math.round(bestResult.score * 100) : 0,
          frameSim: Math.round(result.frameSimilarity * 100),
          frameMs: prev?.frameMs ?? 0,
          cropSrc: prev?.cropSrc ?? '',
          matchImageSrc: bestResult ? formatImageUrl(bestResult.entry.image) : '',
        }));
      }
    }).finally(() => {
      processingRef.current = false;
    });
  }, [cardDB, selectedSetId, debug]);

  const handleDebugInfo = useCallback((info: { frameMs: number; cropSrc: string }) => {
    setDebugState(prev => prev ? { ...prev, frameMs: info.frameMs, cropSrc: info.cropSrc } : null);
  }, []);

  const addCardToCollection = useCallback(async (entry: CardEntry) => {
    try {
      await fetch('/api/collection/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ setId: selectedSetId, cardId: entry.cardId, action: 'increment' }),
      });

      const setName = selectedSet?.name || selectedSetId;
      setScannedCards(prev => [{
        cardId: entry.cardId,
        name: entry.name,
        image: entry.image,
        localId: entry.localId,
        setId: selectedSetId,
        setName,
      }, ...prev]);
    } catch (err) {
      console.error('Failed to add card to collection:', err);
    }
  }, [selectedSetId, selectedSet]);

  const handleLowConfidenceSelect = useCallback((entry: CardEntry) => {
    addCardToCollection(entry);
    setConfirmedEntry(entry);
    setLowConfidenceMatch(null);
    handledRef.current = true;
    engineRef.current.state = 'confirmed';
  }, [addCardToCollection]);

  const handleDismiss = useCallback(() => {
    setLowConfidenceMatch(null);
    handledRef.current = true;
  }, []);

  const handleUndo = useCallback(async (index: number) => {
    const card = scannedCards[index];
    try {
      await fetch('/api/collection/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ setId: card.setId, cardId: card.cardId, action: 'decrement' }),
      });
      setScannedCards(prev => prev.filter((_, i) => i !== index));
    } catch (err) {
      console.error('Failed to undo card:', err);
    }
  }, [scannedCards]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <AppHeader subtitle="Scan cards to add them to your collection" activePage="scan" />

      <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Set selector */}
          <div className="pb-4 pt-4 flex gap-2">
            <select
              value={selectedSetId}
              onChange={(e) => handleSetSelect(e.target.value)}
              disabled={!!buildProgress}
              className="flex-1 px-4 py-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Select a set to scan...</option>
              {sets.map(set => (
                <option key={set.id} value={set.id}>
                  {set.name} ({set.cardCount.total} cards)
                </option>
              ))}
            </select>
            <button
              onClick={() => {
                const keys = Object.keys(localStorage).filter(k =>
                  k.startsWith('dhash_') || k.startsWith('phash_') || k.startsWith('ncc_') || k.startsWith('art_') || k.startsWith('mobilenet_')
                );
                keys.forEach(k => localStorage.removeItem(k));
                setCardDB(null);
                setScanning(false);
                setSelectedSetId('');
                alert(`Cleared ${keys.length} cached DB(s)`);
              }}
              className="px-3 py-2 text-xs bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-red-100 dark:hover:bg-red-900 hover:text-red-600 dark:hover:text-red-400 rounded-lg transition-colors whitespace-nowrap"
              title="Clear cached card databases"
            >
              Clear Cache
            </button>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {!selectedSetId ? (
          <div className="text-center py-12">
            <svg className="w-16 h-16 mx-auto mb-4 text-gray-400 dark:text-gray-500" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" stroke="currentColor">
              <path d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Select a Set</h2>
            <p className="text-gray-600 dark:text-gray-300">Choose a card set above to start scanning</p>
          </div>
        ) : buildProgress ? (
          <div className="text-center py-12">
            <div className="mb-4">
              <div className="w-64 mx-auto bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-blue-500 to-indigo-600 h-3 rounded-full transition-all duration-300"
                  style={{ width: `${buildProgress.total > 0 ? (buildProgress.current / buildProgress.total) * 100 : 0}%` }}
                />
              </div>
            </div>
            <p className="text-gray-600 dark:text-gray-300">
              Building card database... {buildProgress.current}/{buildProgress.total}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              This is cached for future use
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Camera view */}
            <div className="lg:col-span-2">
              <div className="relative">
                <CameraView
                  scanning={scanning}
                  debug={debug}
                  onFrame={handleFrame}
                  onDebugInfo={handleDebugInfo}
                />
                <MatchConfirmation
                  confirmedEntry={confirmedEntry}
                  topMatches={lowConfidenceMatch?.topMatches}
                  allCards={cards}
                  onSelect={handleLowConfidenceSelect}
                  onDismiss={handleDismiss}
                />
              </div>

              {/* Debug toggle */}
              <div className="mt-2 flex justify-end">
                <button
                  onClick={() => setDebug(d => !d)}
                  className={`px-3 py-1 text-xs rounded font-mono transition-colors ${
                    debug
                      ? 'bg-yellow-500 text-black'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                  }`}
                >
                  {debug ? 'DEBUG ON' : 'Debug'}
                </button>
              </div>

              {/* Debug panel */}
              {debug && debugState && (
                <div className="mt-2 bg-gray-900 text-green-400 rounded-lg p-4 font-mono text-xs space-y-3">
                  <div className="flex gap-4 items-start">
                    {debugState.cropSrc && (
                      <div>
                        <div className="text-gray-500 mb-1">CAMERA CROP</div>
                        <img src={debugState.cropSrc} alt="crop" className="border border-green-800 rounded" style={{ width: 150 }} />
                      </div>
                    )}
                    {debugState.matchImageSrc && (
                      <div>
                        <div className="text-gray-500 mb-1">BEST MATCH</div>
                        <img src={debugState.matchImageSrc} alt="match" className="border border-green-800 rounded" style={{ width: 150 }} />
                      </div>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-1">
                    <div>State: <span className="text-white">{debugState.state}</span></div>
                    <div>Frame: <span className="text-white">{debugState.frameMs}ms</span></div>
                    <div>Match: <span className="text-white">{debugState.bestMatch}</span></div>
                    <div>Score: <span className={debugState.score > 85 ? 'text-green-300' : debugState.score > 70 ? 'text-yellow-300' : 'text-red-300'}>{debugState.score}%</span></div>
                    <div>Stability: <span className={debugState.frameSim > 90 ? 'text-green-300' : 'text-red-300'}>{debugState.frameSim}%</span></div>
                    <div>DB entries: <span className="text-white">{cardDB?.entries.length ?? 0}</span></div>
                  </div>
                </div>
              )}
            </div>

            {/* Session panel */}
            <div>
              <ScanSession cards={scannedCards} onUndo={handleUndo} />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
