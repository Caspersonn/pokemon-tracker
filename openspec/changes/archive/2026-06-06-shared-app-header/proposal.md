## Why

The app header (title, navigation, logout, page-specific controls) is copy-pasted across 4 page components (MainPage, ExplorePage, NeededCardsPage, ScanPage) with ~80 lines of near-identical JSX each. This causes inconsistency — NeededCardsPage shows a "Wishlist" nav link the others don't — and makes changes error-prone (updating nav requires editing 4 files).

## What Changes

- **Extract a shared `AppHeader` component** that renders the title, navigation, logout button, and accepts page-specific controls via children
- **Title is always** "Pokemon Card Collection Tracker"
- **Navigation is consistent**: all 4 pages show all 4 links (Sets, Explore, Wishlist, Scan)
- **Refactor all 4 page components** to use `AppHeader` instead of inline header markup
- **Props**: `subtitle` (page description), `activePage` (which nav link to highlight), `children` (optional page-specific controls like search/filter)

## Capabilities

### New Capabilities

- `app-layout`: Shared application header with consistent navigation across all pages

### Modified Capabilities

_None — this is a structural refactor, no spec-level behavior changes to existing capabilities._

## Impact

- **Components**: New `AppHeader.tsx`. Refactor `MainPage.tsx`, `ExplorePage.tsx`, `NeededCardsPage.tsx`, `ScanPage.tsx` to remove inline headers.
- **Navigation**: All pages gain consistent 4-link nav (Sets, Explore, Wishlist, Scan). Previously inconsistent.
- **No API, database, or type changes.**
