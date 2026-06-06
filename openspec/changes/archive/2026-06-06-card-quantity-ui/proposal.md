## Why

The backend already supports card quantity tracking (increment, decrement, set amount) but the frontend only exposes a binary Collected/Uncollected toggle. Users who own multiple copies of the same card have no way to see or manage quantities. Additionally, the card rendering is duplicated across `CardGrid` and `ExplorePage` with inconsistent features (CardGrid shows rarity/types but no need/want buttons, ExplorePage has need/want but different layout), making changes error-prone.

## What Changes

- **Extract a shared `CardItem` component** from `CardGrid` and `ExplorePage` that renders a single card with identical layout on both pages
- **Replace the Collected/Uncollected toggle** with a quantity stepper (`-` / amount / `+`), green when amount >= 1, gray when 0
- **Add `incrementCard` and `decrementCard` helpers** to `lib/storage.ts` that call the existing API with `action: "increment"` / `action: "decrement"`
- **Remove rarity and type display** from card rendering (previously only shown in CardGrid)
- **Remove grayscale/opacity image effect** — card images display at full opacity regardless of collection state
- **Unify card layout**: both pages show `#localId`, card name, set name, quantity stepper, need button, want button

## Capabilities

### New Capabilities

_None — this modifies existing display and tracking behavior._

### Modified Capabilities

- `card-tracking`: Frontend collection interaction changes from binary toggle to quantity stepper with increment/decrement. New storage helpers added.
- `card-display`: Card layout unified into a shared component. Rarity/types removed. Image always at full opacity. Button row changes from Collected/Uncollected toggle to quantity stepper.

## Impact

- **Components**: New `CardItem.tsx` component. `CardGrid.tsx` and `ExplorePage.tsx` refactored to use it, removing duplicated card rendering.
- **Storage**: `lib/storage.ts` gains `incrementCard()` and `decrementCard()` functions. Existing `toggleCard()` remains for backward compatibility.
- **UI**: Card appearance changes on both Sets detail page and Explore page. No API or database changes required — backend already supports all needed operations.
