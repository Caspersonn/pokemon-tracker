import {
  featuresFromFrame, cosineSimilarity, findBestMatch, getModel,
  type CardDB, type CardEntry, type MatchResult,
} from './phash';

// --- Thresholds (cosine similarity, 0..1) ---
export const CONFIDENT_THRESHOLD = 0.75;   // Above this = auto-add
export const CARD_CHANGE_THRESHOLD = 0.7;  // Below this = card changed
export const STABILITY_FRAMES = 2;
const FRAME_STABLE_THRESHOLD = 0.90;       // Above this = same frame

export type ScannerState = 'idle' | 'transitioning' | 'matching' | 'confirmed';

export interface ScanMatchResult {
  entry: CardEntry;
  score: number;
  confident: boolean;
  topMatches: { entry: CardEntry; score: number }[];
}

export interface ScannerEngine {
  state: ScannerState;
  lastConfirmedFeatures: Float32Array | null;
  stableFrameCount: number;
  lastFrameFeatures: Float32Array | null;
}

export function createScannerEngine(): ScannerEngine {
  return {
    state: 'idle',
    lastConfirmedFeatures: null,
    stableFrameCount: 0,
    lastFrameFeatures: null,
  };
}

export async function processFrame(
  engine: ScannerEngine,
  video: HTMLVideoElement,
  scanRegion: ScanRegion,
  cardDB: CardDB
): Promise<{ engine: ScannerEngine; match: ScanMatchResult | null; stateChanged: boolean; frameSimilarity: number }> {
  const prevState = engine.state;
  let match: ScanMatchResult | null = null;

  const model = await getModel();
  const frameFeatures = featuresFromFrame(
    model, video,
    scanRegion.scanX, scanRegion.scanY,
    scanRegion.scanW, scanRegion.scanH
  );

  // Frame-to-frame similarity
  const frameSimilarity = engine.lastFrameFeatures
    ? cosineSimilarity(frameFeatures, engine.lastFrameFeatures)
    : 0;

  // Similarity to last confirmed card
  const confirmedSimilarity = engine.lastConfirmedFeatures
    ? cosineSimilarity(frameFeatures, engine.lastConfirmedFeatures)
    : 0;

  const isNewCard = confirmedSimilarity < CARD_CHANGE_THRESHOLD;
  const isStable = frameSimilarity > FRAME_STABLE_THRESHOLD;

  switch (engine.state) {
    case 'idle':
    case 'confirmed':
      if (isNewCard) {
        engine.state = 'transitioning';
        engine.stableFrameCount = isStable ? 1 : 0;
      }
      break;

    case 'transitioning':
      if (!isNewCard) {
        engine.state = engine.lastConfirmedFeatures ? 'confirmed' : 'idle';
        engine.stableFrameCount = 0;
      } else if (isStable) {
        engine.stableFrameCount++;
        if (engine.stableFrameCount >= STABILITY_FRAMES) {
          engine.state = 'matching';

          const result = findBestMatch(frameFeatures, cardDB);
          if (result && result.score > 0.5) {
            match = {
              entry: result.entry,
              score: result.score,
              confident: result.score > CONFIDENT_THRESHOLD,
              topMatches: result.topMatches,
            };
            engine.state = 'confirmed';
            engine.lastConfirmedFeatures = frameFeatures;
          } else {
            engine.state = 'idle';
            engine.lastConfirmedFeatures = null;
          }
          engine.stableFrameCount = 0;
        }
      } else {
        engine.stableFrameCount = 0;
      }
      break;

    case 'matching':
      engine.state = 'idle';
      break;
  }

  engine.lastFrameFeatures = frameFeatures;

  return { engine, match, stateChanged: prevState !== engine.state, frameSimilarity };
}

// --- Scan region ---

export interface ScanRegion {
  scanX: number; scanY: number; scanW: number; scanH: number;
}

export function calculateScanRegion(videoWidth: number, videoHeight: number): ScanRegion {
  const cardAspect = 2.5 / 3.5;
  const scanH = videoHeight * 0.90;
  const scanW = scanH * cardAspect;

  const finalW = Math.min(scanW, videoWidth * 0.9);
  const finalH = finalW / cardAspect;

  return {
    scanX: (videoWidth - finalW) / 2,
    scanY: (videoHeight - finalH) / 2,
    scanW: finalW,
    scanH: finalH,
  };
}
