## Context

The backend fully supports card quantity tracking via the toggle API's `action` parameter (`increment`, `decrement`, `set`). However, the frontend only uses the default toggle (create/delete). Card rendering is duplicated in `CardGrid.tsx` (set detail page) and `ExplorePage.tsx` (explore page) with inconsistent features — CardGrid shows rarity/types but lacks need/want buttons, while ExplorePage has need/want but different layout.

## Goals / Non-Goals

**Goals:**
- Extract a shared `CardItem` component used by both `CardGrid` and `ExplorePage`
- Replace the Collected/Uncollected toggle with a quantity stepper (`-` / amount / `+`)
- Add `incrementCard` and `decrementCard` helpers to `lib/storage.ts`
- Unify card appearance: same layout, same buttons, same behavior on both pages

**Non-Goals:**
- Changing the API or database schema (backend already supports all operations)
- Adding quantity editing via text input or modal
- Changing the grid layout or responsive breakpoints
- Modifying the progress bar calculation (already counts unique cards)

## Decisions

### 1. Single `CardItem` component in `components/CardItem.tsx`

**Choice**: Extract all per-card rendering (image, info, buttons) into `CardItem`. Both `CardGrid` and `ExplorePage` render a grid of `CardItem` components.

**Why**: Eliminates duplication. Any future card UI changes happen in one place. Both pages get identical behavior (need/want buttons, quantity stepper).

**Props interface**:
- `card`: Card data (id, localId, name, image, setId)
- `setName`: Display name for the set
- `amount`: Current quantity from collection data
- `isNeeded` / `isWanted`: Boolean status flags
- `onIncrement` / `onDecrement`: Quantity change callbacks
- `onToggleNeed` / `onToggleWant`: Need/want toggle callbacks

**Why callbacks instead of calling storage directly**: Keeps `CardItem` a presentational component. Parent manages state and data fetching, `CardItem` just renders and reports interactions. This matches the existing pattern in both pages.

### 2. Quantity stepper replaces toggle button

**Choice**: The "Collected/Uncollected" button becomes three elements: `[-]` button, amount display, `[+]` button. The group uses green background when amount >= 1, gray when 0.

**Why**: Direct mapping to the existing API actions. Simple, no modal or secondary interactions needed. The `-` button is disabled (visually muted, no-op) at amount 0.

**Alternative considered**: Keep toggle button and add a small counter badge. Rejected because the user explicitly wants the stepper pattern and it's simpler to understand.

### 3. Storage helpers call existing API with action parameter

**Choice**: Add `incrementCard(setId, cardId)` and `decrementCard(setId, cardId)` to `lib/storage.ts`. These call `POST /api/collection/toggle` with `action: "increment"` or `action: "decrement"`. Keep existing `toggleCard()` for backward compatibility (scanner uses it).

**Why**: The API already handles all the logic (create on first increment, delete on decrement to 0). No backend changes needed.

### 4. CardGrid gains need/want buttons

**Choice**: Since `CardItem` always renders need/want buttons, `CardGrid` (set detail page) now needs to load and manage need/want state — same as `ExplorePage` already does.

**Why**: Consistent user experience across pages. The data loading pattern already exists in `ExplorePage` and can be replicated.

## Risks / Trade-offs

- **CardGrid complexity increases** — It now manages need/want state in addition to collection state. This is more state, but follows the exact same pattern already proven in ExplorePage. Mitigation: extract from working code, don't reinvent.
- **Visual change for existing users** — The Collected/Uncollected button disappears in favor of the stepper. Users may need a moment to adapt. Mitigation: The stepper is intuitive (0 = gray = uncollected, green with number = collected).
- **Image no longer dims when collected** — Removes a visual distinction. Mitigation: Green ring still indicates collected status, and the quantity number provides clear feedback.
