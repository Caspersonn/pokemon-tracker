# Implementation Tasks

## 1. Database Schema
- [x] 1.1 Add `NeededCard` model to Prisma schema (userId, setId, cardId, createdAt)
- [x] 1.2 Add `WantedCard` model to Prisma schema (userId, setId, cardId, createdAt)
- [x] 1.3 Add unique constraint on userId + setId + cardId for both models
- [x] 1.4 Add indexes for userId and setId for both models
- [x] 1.5 Add relations to User model
- [x] 1.6 Run Prisma migration to create tables
- [x] 1.7 Generate Prisma client

## 2. Storage Layer
- [x] 2.1 Add `getNeedCards()` function to lib/storage.ts
- [x] 2.2 Add `getWantCards()` function to lib/storage.ts
- [x] 2.3 Add `toggleNeedCard(setId, cardId)` function to lib/storage.ts
- [x] 2.4 Add `toggleWantCard(setId, cardId)` function to lib/storage.ts
- [x] 2.5 Add `isCardNeeded(needData, setId, cardId)` helper function
- [x] 2.6 Add `isCardWanted(wantData, setId, cardId)` helper function

## 3. API Endpoints
- [x] 3.1 Create app/api/need/route.ts for GET (fetch all needed cards)
- [x] 3.2 Create app/api/need/toggle/route.ts for POST (toggle need status)
- [x] 3.3 Create app/api/want/route.ts for GET (fetch all wanted cards)
- [x] 3.4 Create app/api/want/toggle/route.ts for POST (toggle want status)
- [x] 3.5 Ensure authentication is required for all endpoints

## 4. Frontend - ExplorePage Component
- [x] 4.1 Add state for `needed` tracking (Record<string, boolean>)
- [x] 4.2 Add state for `wanted` tracking (Record<string, boolean>)
- [x] 4.3 Add state for `needData` (similar to collection)
- [x] 4.4 Add state for `wantData` (similar to collection)
- [x] 4.5 Load Need data on mount
- [x] 4.6 Load Want data on mount
- [x] 4.7 Create `handleNeedToggle(card)` function
- [x] 4.8 Create `handleWantToggle(card)` function
- [x] 4.9 Modify button layout: change Uncollected button with flex-1, add gap-2 container
- [x] 4.10 Add Need button (bookmark icon, blue when active)
- [x] 4.11 Add Want button (heart icon, red when active)
- [x] 4.12 Update needed/wanted state after fetch to sync with loaded data

## 5. Testing
- [x] 5.1 Test Need button toggle functionality
- [x] 5.2 Test Want button toggle functionality
- [x] 5.3 Test independence of Need, Want, and Collection status
- [x] 5.4 Test visual states (blue for Need, red for Want)
- [x] 5.5 Test database persistence across page reloads
- [x] 5.6 Test responsive layout on mobile devices
