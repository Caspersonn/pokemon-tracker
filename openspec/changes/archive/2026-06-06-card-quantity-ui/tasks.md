## 1. Storage Helpers

- [x] 1.1 Add `incrementCard(setId, cardId)` function to `lib/storage.ts` that calls toggle API with `action: "increment"`
- [x] 1.2 Add `decrementCard(setId, cardId)` function to `lib/storage.ts` that calls toggle API with `action: "decrement"`

## 2. CardItem Component

- [x] 2.1 Create `components/CardItem.tsx` with props: card data, setName, amount, isNeeded, isWanted, onIncrement, onDecrement, onToggleNeed, onToggleWant
- [x] 2.2 Implement card image with green ring when amount >= 1, no ring when 0, full opacity always
- [x] 2.3 Implement info section: #localId, card name, set name (no rarity, no types)
- [x] 2.4 Implement quantity stepper: `-` button, amount display, `+` button with green bg (amount >= 1) or gray bg (amount = 0)
- [x] 2.5 Implement `-` button disabled state when amount is 0
- [x] 2.6 Implement Need button (bookmark icon, blue when active, gray when inactive)
- [x] 2.7 Implement Want button (heart icon, red when active, gray when inactive)

## 3. Refactor CardGrid

- [x] 3.1 Add need/want state management to `CardGrid.tsx` (load `getNeedCards`, `getWantCards` on mount)
- [x] 3.2 Add increment/decrement handlers using new storage helpers
- [x] 3.3 Add need/want toggle handlers
- [x] 3.4 Replace inline card rendering with `CardItem` component
- [x] 3.5 Remove rarity, types display, and grayscale/opacity image effects

## 4. Refactor ExplorePage

- [x] 4.1 Replace inline card rendering with `CardItem` component
- [x] 4.2 Add increment/decrement handlers using new storage helpers
- [x] 4.3 Remove old `handleToggle` in favor of increment/decrement
- [x] 4.4 Remove grayscale/opacity image effects

## 5. Verification

- [x] 5.1 Verify quantity stepper increments and decrements correctly on both pages
- [x] 5.2 Verify stepper color transitions (gray at 0, green at >= 1)
- [x] 5.3 Verify `-` button is disabled at amount 0
- [x] 5.4 Verify need/want buttons work on both Sets detail page and Explore page
- [x] 5.5 Verify card image shows at full opacity in both collected and uncollected states
- [x] 5.6 Verify progress bar still calculates correctly (unique cards, not total copies)
