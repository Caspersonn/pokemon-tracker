## Context

Users scan physical Pokemon cards using a 3D-printed holder that positions cards in front of a phone/webcam camera. The app continuously captures frames, detects when a new card appears, identifies it by matching against known card images, and adds it to the collection.

The app fetches card data and images from TCGDex via `fetchSetCards()` and `formatImageUrl()`. The collection API supports `action: "increment"` (from the `card-quantity-tracking` change).

## Goals / Non-Goals

**Goals:**
- Accurate card recognition from camera photos (~75%+ match rate)
- Browser-only recognition using TensorFlow.js + MobileNet
- Reuse existing TCGDex integration for card data and images
- Lock-to-set for focused scanning
- Usable on mobile (phone camera) and desktop (webcam)

**Non-Goals:**
- Foil/holographic card variant detection (treated as base variant)
- Multi-set scanning without set lock
- Offline/PWA support (future consideration)
- Torch/flashlight on Firefox (Chrome-only API)

## Decisions

### 1. MobileNet feature extraction (final approach)

**Choice**: Use TensorFlow.js with MobileNet v2 (alpha=0.5) for feature extraction. Compare 1280-dimensional feature vectors using cosine similarity.

**Why**: MobileNet captures high-level visual features (shapes, textures, colors) that are robust to lighting, angle, and camera differences. Previous approaches tried (dHash, pHash, NCC) all failed because they compare pixel-level data which differs drastically between camera photos and digital reference images.

**Trade-off**: ~3-4MB model download on first use. ~100ms per inference. Acceptable for 5fps scanning.

**Alternatives tried and rejected**:
- pHash (DCT-based): O(n^4) computation, inaccurate for camera-to-reference matching
- dHash (difference hash): Fast but ~52% match rate (random chance) due to pixel gradient sensitivity
- NCC (normalized cross-correlation): Better than hashing but still insufficient for camera-to-reference gap

### 2. Card-shaped scan region

**Choice**: Display a card-aspect-ratio scan area (90% of frame height) with corner accents. Card should fill most of this area.

**Why**: The scan area is hashed directly against reference images. The card needs to fill most of the frame for accurate matching. No edge detection — the user positions the card within the visible area.

### 3. Confidence-based confirmation UX

**Choice**: Two modes based on cosine similarity score:
- **High confidence** (score > 0.75): Auto-add to collection, show green confirmation overlay
- **Low confidence** (0.50 < score < 0.75): Show popup with top 3 matches and manual picker
- **No match** (score < 0.50): Reject, don't show anything

Popup freezes on first result (won't update while displayed). Resets when card changes.

### 4. Async frame processing with guard

**Choice**: `processFrame` is async (MobileNet inference). A `processingRef` guard prevents overlapping inferences. Frames are dropped if the previous one is still processing.

**Why**: MobileNet takes ~50-100ms per inference. At 5fps (200ms intervals), there's room for one inference per frame but not two.

### 5. On-demand feature DB per set with caching

**Choice**: When user selects a set, fetch card images via `fetchSetCards()`, extract MobileNet features for each, cache to localStorage as serialized Float32Arrays.

**Trade-off**: First build takes ~1-2 min for a 122-card set. Cached subsequent loads are instant.

## Risks / Trade-offs

- **TCGDex image gaps**: Recent sets may have missing card images (404s). Cards without reference images can't be matched. Future change: local card image database.
- **MobileNet model download**: ~3-4MB on first use. Cached by browser for subsequent visits.
- **Firefox torch**: Flashlight API is Chrome-only. Firefox users must use phone's built-in flashlight toggle.
- **Camera on non-HTTPS**: `getUserMedia` requires secure context. Works on localhost, requires HTTPS for network access.
