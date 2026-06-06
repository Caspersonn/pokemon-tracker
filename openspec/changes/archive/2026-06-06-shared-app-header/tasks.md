## 1. Create AppHeader Component

- [x] 1.1 Create `components/AppHeader.tsx` with props: subtitle, activePage, children
- [x] 1.2 Implement title ("Pokemon Card Collection Tracker") and subtitle display
- [x] 1.3 Implement navigation links: Sets (`/`), Explore (`/explore`), Wishlist (`/needed-cards`), Scan (`/scan`)
- [x] 1.4 Implement active page highlighting (blue for active, gray for inactive)
- [x] 1.5 Implement children slot (renders before logout button)
- [x] 1.6 Implement logout button with signOut redirect to `/auth/signin`

## 2. Refactor Page Components

- [x] 2.1 Refactor `MainPage.tsx` to use AppHeader, move search/filter controls to children
- [x] 2.2 Refactor `ExplorePage.tsx` to use AppHeader, move search button to children
- [x] 2.3 Refactor `NeededCardsPage.tsx` to use AppHeader (no children controls)
- [x] 2.4 Refactor `ScanPage.tsx` to use AppHeader (no children controls)

## 3. Verification

- [x] 3.1 Verify all 4 pages show consistent nav: Sets, Explore, Wishlist, Scan
- [x] 3.2 Verify active page highlighting works on each page
- [x] 3.3 Verify page-specific controls (search, filter) still function on MainPage and ExplorePage
- [x] 3.4 Verify TypeScript compiles cleanly
