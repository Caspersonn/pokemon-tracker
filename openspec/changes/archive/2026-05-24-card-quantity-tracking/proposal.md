## Why

CollectedCard currently uses row existence as a boolean — a card is either collected or not. Users who own multiple copies of the same card have no way to track quantity. This is a prerequisite for the upcoming card-scanner feature, which needs to increment counts rather than toggle.

## What Changes

- **BREAKING**: Add `amount` integer field to CollectedCard model (default 1)
- **BREAKING**: Replace toggle semantics with increment/decrement — POST `/api/collection/toggle` becomes a quantity-aware endpoint
- Migrate existing CollectedCard rows to `amount = 1`
- Update `storage.ts` helpers (`isCardCollected`, `getSetProgress`) to work with amounts
- Update all UI components displaying collection state to reflect quantities
- Progress calculations change from count-of-rows to count-of-cards-with-amount >= 1

## Capabilities

### New Capabilities

_None — this modifies existing collection tracking behavior._

### Modified Capabilities

- `card-tracking`: Collection status changes from boolean (exists/not-exists) to quantity-based (amount field). API response shape changes. Toggle endpoint gains increment/decrement semantics.

## Impact

- **Database**: Prisma schema migration adding `amount` field, data migration for existing rows
- **API**: `/api/collection/toggle` request/response contract changes, `/api/collection` GET response changes from `{ setId: { cardId: true } }` to `{ setId: { cardId: number } }`
- **Frontend**: `storage.ts`, `CardGrid`, `ChecklistGrid`, `ExplorePage`, `NeededCardsPage` — anywhere `isCardCollected()` or collection state is rendered
- **Types**: `CollectionData` type in `types/tcgdex.ts` changes from `Record<string, Record<string, boolean>>` to `Record<string, Record<string, number>>`
