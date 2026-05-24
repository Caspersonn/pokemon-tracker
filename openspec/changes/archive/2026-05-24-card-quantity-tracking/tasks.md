## 1. Database Migration

- [x] 1.1 Add `amount Int @default(1)` field to CollectedCard model in `prisma/schema.prisma`
- [x] 1.2 Generate and run Prisma migration (existing rows get amount=1 via default)

## 2. Types

- [x] 2.1 Update `CollectionData` type in `types/tcgdex.ts` from `Record<string, Record<string, boolean>>` to `Record<string, Record<string, number>>`

## 3. API Changes

- [x] 3.1 Update GET `/api/collection/route.ts` to return `{ setId: { cardId: amount } }` instead of `{ setId: { cardId: true } }`
- [x] 3.2 Update POST `/api/collection/toggle/route.ts` to support `action` field (`increment`, `decrement`, `set`) with legacy toggle as default
- [x] 3.3 Update toggle response to include `{ collected: boolean, amount: number }`

## 4. Storage & Utility Updates

- [x] 4.1 Update `isCardCollected()` in `lib/storage.ts` to check `(amount ?? 0) > 0` instead of boolean truthiness
- [x] 4.2 Update `getSetProgress()` in `lib/storage.ts` to count cards with amount >= 1
- [x] 4.3 Update any other storage helpers that consume CollectionData

## 5. Frontend Components

- [x] 5.1 Update `CardGrid.tsx` collected state rendering to work with numeric amounts
- [x] 5.2 Update `ChecklistGrid.tsx` to derive collected status from amount
- [x] 5.3 Update `ExplorePage.tsx` collection state handling
- [x] 5.4 Update `NeededCardsPage.tsx` / `NeededCardsSetSection.tsx` if they reference collection data
- [x] 5.5 Update `MainPage.tsx` / `SetGrid.tsx` progress display if affected

## 6. Verification

- [x] 6.1 Verify toggle (no action) still works as collect/uncollect
- [x] 6.2 Verify increment/decrement actions work correctly
- [x] 6.3 Verify progress bars still calculate correctly
- [x] 6.4 Verify all pages render collected state correctly
