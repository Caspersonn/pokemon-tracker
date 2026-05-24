## Why

Adding cards to the collection one by one through the UI is slow when processing large batches of physical cards. A camera-based scanner using a 3D-printed card holder enables rapid continuous scanning — point the camera at cards as they slide through the holder and they get added to the collection automatically.

## What Changes

- New `/scan` page with camera stream, set selector, and scanning session UI
- Browser-side perceptual hashing (pHash) for card image matching
- On-demand hash database built per set using existing `fetchSetCards()` + TCGDex card images
- Frame differencing to detect when a new card enters the camera frame
- Fixed crop region overlay (aligned to 3D holder position) instead of edge detection
- Auto-confirm for high-confidence matches; popup with manual picker for low confidence
- Confirmation popup stays visible until card changes (no timeout)
- Foil/holographic cards treated as their non-holographic variant
- Scanning session with running list of scanned cards and undo capability
- Cards added via `increment` action on collection toggle API (requires `card-quantity-tracking` change)

## Capabilities

### New Capabilities

- `card-scanning`: Camera-based card recognition using pHash matching. Covers camera access, frame capture, hash computation, card matching, set-locked scanning, and scan session management.

### Modified Capabilities

_None — this builds on existing APIs without changing their spec-level behavior._

## Impact

- **New pages**: `/app/scan/page.tsx` and supporting components
- **New lib**: `lib/phash.ts` (perceptual hash computation), `lib/scanner.ts` (frame differencing, matching logic)
- **Dependencies**: May add `phash-js` or similar browser-side hashing library, or implement with canvas API
- **Existing API reuse**: `fetchSetCards()` for card data, `formatImageUrl()` for image URLs, POST `/api/collection/toggle` with `action: "increment"` for adding scanned cards
- **Browser APIs**: `getUserMedia` for camera access, Canvas API for image processing
- **Prerequisite**: `card-quantity-tracking` change must be implemented first
