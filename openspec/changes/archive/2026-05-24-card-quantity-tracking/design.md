## Context

CollectedCard currently uses row existence as a boolean signal. The toggle endpoint creates or deletes rows. The GET endpoint returns a nested `{ setId: { cardId: true } }` map. All UI components check `collectionData[setId]?.[cardId]` for truthiness.

This needs to become quantity-aware to support multiple copies and to serve as foundation for the card-scanner feature (which increments on each scan).

## Goals / Non-Goals

**Goals:**
- Add `amount` integer field to CollectedCard with default 1
- Migrate existing data (all current rows get amount=1)
- Change API contracts to work with quantities
- Update all frontend code to handle numeric amounts
- Maintain backward-compatible UX — existing collected/uncollected visual states still work (amount >= 1 = collected)

**Non-Goals:**
- UI for displaying/editing quantity per card (future work)
- Decrement/remove functionality from the UI (toggle still works as collect/uncollect for now)
- Card scanner integration (separate change)

## Decisions

### 1. Keep row-based model, add amount field

**Choice**: Add `amount Int @default(1)` to existing CollectedCard model rather than switching to a different data model.

**Why**: Minimal migration — existing unique constraint `[userId, setId, cardId]` stays. A row with `amount = 0` is equivalent to uncollected (can be cleaned up periodically or deleted on uncollect).

**Alternative considered**: Delete row when amount reaches 0. Chosen against because keeping the row preserves the `createdAt` timestamp which may be useful for history.

### 2. Toggle endpoint becomes dual-purpose

**Choice**: POST `/api/collection/toggle` keeps its URL but accepts an optional `action` field:
- `{ setId, cardId }` — legacy toggle behavior (if amount=0 → set to 1, if amount>=1 → set to 0)
- `{ setId, cardId, action: "increment" }` — add one copy (for scanner)
- `{ setId, cardId, action: "decrement" }` — remove one copy (floor at 0)
- `{ setId, cardId, action: "set", amount: N }` — set exact amount

**Why**: Backward-compatible with existing UI (no action = toggle). Scanner will use `action: "increment"`.

**Alternative considered**: Separate `/api/collection/add` and `/api/collection/remove` endpoints. Rejected to avoid endpoint sprawl — single endpoint with action parameter is simpler.

### 3. Collection data response changes to numbers

**Choice**: GET `/api/collection` returns `{ setId: { cardId: number } }` instead of `{ setId: { cardId: true } }`.

**Why**: Frontend needs the count. `isCardCollected()` changes from `!!data[setId]?.[cardId]` to `(data[setId]?.[cardId] ?? 0) > 0`. This is a simple change across all consumers.

### 4. Progress calculation stays count-based

**Choice**: `getSetProgress()` counts cards with amount >= 1, not sum of amounts. A card with amount=3 still counts as 1 toward set completion.

**Why**: Set completion is about unique cards owned, not total copies.

## Risks / Trade-offs

- **Breaking API contract** → All frontend code consuming collection data must update simultaneously. Mitigated by doing this in a single change with no partial deployment.
- **amount=0 rows accumulate** → Could grow the table unnecessarily. Mitigated by deleting rows when amount reaches 0 via toggle/decrement (reversing the "keep row" decision for the 0 case — only keep rows with amount >= 1).
- **Prisma migration on production data** → Standard `ALTER TABLE ADD COLUMN amount INT DEFAULT 1`. Safe, non-destructive. Rollback: drop the column.
