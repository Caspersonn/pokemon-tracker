# Change: Fix Explore Page Card Sizing and Grid Layout

## Why
After moving the filter sidebar fully to the left, the Pokemon card grid now spans the full remaining width, causing cards to become oversized. The card images are too large and the information section is difficult to read. Cards should be displayed in a compact, readable grid format with proper proportions.

## What Changes
- Adjust card aspect ratio so image takes 75% and information section takes 25% of card height
- Reduce grid column counts to create smaller, more compact cards
- Update grid breakpoints: 2 cols (mobile), 3 cols (sm), 4 cols (md), 5 cols (lg), 6 cols (xl)
- Ensure text remains readable at reduced card size
- Maintain current button layout and spacing (Uncollected, Need, Want)

## Impact
- Affected specs: `card-display` (new capability)
- Affected code:
  - `components/ExplorePage.tsx` (grid layout and card proportions)
