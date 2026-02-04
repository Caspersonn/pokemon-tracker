# Change: Add Need and Want Tracking Buttons to Explore Page

## Why
Users currently can only track cards they've collected on the Explore page. However, users also want to track cards they need (for set completion) and cards they want (cards they like or desire), independent of collection status. This enhancement provides richer tracking capabilities to help users manage their Pokemon card acquisition goals.

## What Changes
- Add "Need" button (25% width) with ONLY bookmark icon (no text) to each card on Explore page
- Add "Want" button (25% width) with ONLY heart icon (no text) to each card on Explore page
- Resize existing "Uncollected" button from 100% to 50% width
- Implement spacing: larger gap between Uncollected and Need buttons, smaller gap between Need and Want buttons
- Button padding: py-2 px-3 (or equivalent) for all buttons
- Create new database tables `NeededCard` and `WantedCard` with similar structure to `CollectedCard`
- Add API endpoints for toggling Need and Want status
- Implement visual states: blue background when Need is active, red background when Want is active
- Need, Want, and Collection status are independent (all three can be active simultaneously)

## Impact
- Affected specs: `card-tracking` (new capability)
- Affected code:
  - `components/ExplorePage.tsx` (button layout and handlers)
  - `prisma/schema.prisma` (new tables)
  - `app/api/need/toggle/route.ts` (new endpoint)
  - `app/api/want/toggle/route.ts` (new endpoint)
  - `lib/storage.ts` (new functions for Need/Want operations)
