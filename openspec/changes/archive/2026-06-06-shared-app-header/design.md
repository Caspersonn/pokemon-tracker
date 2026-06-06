## Context

Four page components each render their own header with title, subtitle, navigation links, a logout button, and optional page-specific controls (search, filters). The markup is nearly identical but has drifted — NeededCardsPage includes a "Wishlist" nav link the others omit.

## Goals / Non-Goals

**Goals:**
- Single `AppHeader` component used by all 4 pages
- Consistent navigation: Sets, Explore, Wishlist, Scan on every page
- Page-specific controls (search inputs, filter buttons) passed via `children` prop
- Title always "Pokemon Card Collection Tracker"

**Non-Goals:**
- Changing any page-specific control behavior (search, filters stay as-is)
- Mobile-responsive nav changes (keep current layout)
- Adding new nav links or pages

## Decisions

### 1. AppHeader props interface

**Choice**:
```ts
interface AppHeaderProps {
  subtitle: string;
  activePage: 'sets' | 'explore' | 'wishlist' | 'scan';
  children?: ReactNode;
}
```

**Why**: Minimal surface area. `subtitle` varies per page. `activePage` controls which nav link gets the blue highlight. `children` renders in the controls area (right side of header) before the logout button, allowing each page to inject its own search/filter UI.

### 2. Children placement

**Choice**: `children` renders between the nav and the logout button, in the right-side controls area.

**Why**: This matches the current pattern — MainPage puts search+filter there, ExplorePage puts search there, ScanPage has nothing, NeededCardsPage has nothing. The logout button is always last.

### 3. Sub-header content stays in page components

**Choice**: Content below the main header bar (filter status pills in MainPage/ExplorePage, set selector in NeededCardsPage, set selector in ScanPage) stays in the page components, not inside AppHeader.

**Why**: This content varies too much between pages. Forcing it into AppHeader would require complex prop drilling or render props. Keeping it outside is simpler — AppHeader only owns the sticky top bar.

## Risks / Trade-offs

- **Children flexibility** — `children` is unstructured, so pages could pass anything. This is fine for 4 pages in a small app. If it grew, a more structured slot pattern might be needed.
- **Sub-header outside AppHeader** — Some pages render additional sticky content below the header (filters, selectors). These remain in the page component. If they need to be sticky relative to the header, CSS positioning stays the page's concern.
