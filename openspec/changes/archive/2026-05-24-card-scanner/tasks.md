## 1. Card Recognition Engine

- [x] 1.1 Create `lib/phash.ts` with MobileNet-based feature extraction (TensorFlow.js)
- [x] 1.2 Add cosine similarity comparison for feature vectors
- [x] 1.3 Add card database builder: loads set cards, extracts features via MobileNet, returns CardDB
- [x] 1.4 Add localStorage caching for card databases keyed by setId

## 2. Scanner Engine

- [x] 2.1 Create `lib/scanner.ts` with frame differencing logic using cosine similarity
- [x] 2.2 Implement state machine: IDLE → TRANSITIONING → MATCHING → CONFIRMED
- [x] 2.3 Add card matching: extract frame features via MobileNet, find nearest match in CardDB
- [x] 2.4 Add scan region calculation for card-shaped overlay

## 3. Camera Component

- [x] 3.1 Create `CameraView` component with `getUserMedia` setup (prefer rear camera)
- [x] 3.2 Add scan area overlay with corner accents
- [x] 3.3 Add frame capture loop at ~5fps (200ms intervals)
- [x] 3.4 Handle camera permission denied state with error message
- [x] 3.5 Add torch/flashlight toggle button (Chrome-only, auto-detected)

## 4. Scan Page

- [x] 4.1 Create `/app/scan/page.tsx` as server component shell
- [x] 4.2 Create `ScanPage` client component with set selector, camera view, and session panel
- [x] 4.3 Wire set selection to card DB builder (show progress indicator during build, pre-load MobileNet model)
- [x] 4.4 Wire frame capture loop to scanner engine matching (async, with processing guard)
- [x] 4.5 Add clear cache button for card databases

## 5. Confirmation UX

- [x] 5.1 Create `MatchConfirmation` overlay component for high-confidence matches (card name + image, stays until card changes)
- [x] 5.2 Create low-confidence popup showing top 3 matches with manual card picker (freezes on first result)
- [x] 5.3 Wire high-confidence auto-confirm to POST `/api/collection/toggle` with `action: "increment"`
- [x] 5.4 Wire manual card selection to POST `/api/collection/toggle` with `action: "increment"`
- [x] 5.5 Add handled flag to prevent popup from re-appearing after user selects/dismisses

## 6. Scan Session

- [x] 6.1 Create `ScanSession` component with running list of scanned cards (name, image, set)
- [x] 6.2 Add undo button per entry that calls POST `/api/collection/toggle` with `action: "decrement"`
- [x] 6.3 Add scanned card count display
- [x] 6.4 Preserve session across set changes

## 7. Integration

- [x] 7.1 Add image proxy API route (`/api/proxy-image`) for CORS fallback on TCGDex images
- [x] 7.2 Add navigation link to `/scan` page from MainPage, ExplorePage, NeededCardsPage
- [x] 7.3 Add debug toggle with panel showing camera crop, best match, score, state, and stability
- [ ] 7.4 Tune confidence thresholds with real card scans
- [ ] 7.5 Test on mobile browser with 3D printed holder
