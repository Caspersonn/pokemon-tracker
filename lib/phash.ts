import type { Card } from '@/types/tcgdex';
import { formatImageUrl } from '@/lib/image';

// --- MobileNet feature extraction ---
// Uses a pre-trained MobileNet to extract high-level feature vectors (embeddings)
// from card images. These features capture shapes, textures, and colors that are
// robust to lighting, angle, and camera differences.
//
// Cosine similarity for comparison: 1.0 = identical, 0.0 = unrelated

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let modelPromise: Promise<any> | null = null;

export async function getModel() {
  if (!modelPromise) {
    modelPromise = (async () => {
      const mobilenet = await import('@tensorflow-models/mobilenet');
      await import('@tensorflow/tfjs');
      return await mobilenet.load({ version: 2, alpha: 0.5 });
    })();
  }
  return modelPromise;
}

// Extract feature vector from an image/video crop
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractFeatures(model: any, source: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement): Float32Array {
  const tensor = model.infer(source, true); // true = return embedding
  const data = tensor.dataSync();
  tensor.dispose();
  return new Float32Array(data);
}

// Cosine similarity between two feature vectors
export function cosineSimilarity(a: Float32Array, b: Float32Array): number {
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB) || 1);
}

// --- Public API ---

export interface CardEntry {
  cardId: string;
  features: Float32Array;
  name: string;
  image: string;
  localId: string;
}

export interface CardDB {
  setId: string;
  entries: CardEntry[];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function featuresFromImage(model: any, img: HTMLImageElement): Float32Array {
  // Resize to 224x224 (MobileNet's expected input)
  const canvas = document.createElement('canvas');
  canvas.width = 224;
  canvas.height = 224;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(img, 0, 0, 224, 224);
  return extractFeatures(model, canvas);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function featuresFromFrame(
  model: any,
  video: HTMLVideoElement,
  sx: number, sy: number, sw: number, sh: number,
): Float32Array {
  const canvas = document.createElement('canvas');
  canvas.width = 224;
  canvas.height = 224;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(video, sx, sy, sw, sh, 0, 0, 224, 224);
  return extractFeatures(model, canvas);
}

// --- Matching ---

export interface MatchResult {
  entry: CardEntry;
  score: number; // 0..1 cosine similarity
  topMatches: { entry: CardEntry; score: number }[];
}

export function findBestMatch(features: Float32Array, db: CardDB): MatchResult | null {
  if (db.entries.length === 0) return null;

  const scored = db.entries.map(e => ({
    entry: e,
    score: cosineSimilarity(features, e.features),
  }));
  scored.sort((a, b) => b.score - a.score);

  return {
    entry: scored[0].entry,
    score: scored[0].score,
    topMatches: scored.slice(0, 3),
  };
}

// --- Build DB ---

export async function buildCardDB(
  cards: Card[],
  setId: string,
  onProgress?: (current: number, total: number) => void
): Promise<CardDB> {
  const model = await getModel();
  const entries: CardEntry[] = [];
  const total = cards.length;

  for (let i = 0; i < cards.length; i++) {
    const card = cards[i];
    const imageUrl = formatImageUrl(card.image, 'low', 'png');
    try {
      const img = await loadImage(imageUrl);
      const features = featuresFromImage(model, img);
      entries.push({ cardId: card.id, features, name: card.name, image: card.image, localId: card.localId });
    } catch (err) {
      console.warn(`Failed to process card ${card.id}:`, err);
    }
    onProgress?.(i + 1, total);
  }

  return { setId, entries };
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => {
      const proxyImg = new Image();
      proxyImg.crossOrigin = 'anonymous';
      proxyImg.onload = () => resolve(proxyImg);
      proxyImg.onerror = () => reject(new Error(`Failed to load image: ${url}`));
      proxyImg.src = `/api/proxy-image?url=${encodeURIComponent(url)}`;
    };
    img.src = url;
  });
}

// --- localStorage caching ---

const CACHE_PREFIX = 'mobilenet_db_v1_';

export function getCachedCardDB(setId: string): CardDB | null {
  try {
    const cached = localStorage.getItem(CACHE_PREFIX + setId);
    if (!cached) return null;
    const parsed = JSON.parse(cached);
    for (const entry of parsed.entries) {
      entry.features = new Float32Array(entry.features);
    }
    return parsed as CardDB;
  } catch {
    return null;
  }
}

export function cacheCardDB(db: CardDB): void {
  try {
    const serializable = {
      setId: db.setId,
      entries: db.entries.map(e => ({
        ...e,
        features: Array.from(e.features),
      })),
    };
    localStorage.setItem(CACHE_PREFIX + db.setId, JSON.stringify(serializable));
  } catch {
    console.warn('Failed to cache card DB to localStorage');
  }
}
