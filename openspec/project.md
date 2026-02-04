# Project Context

## Purpose
A Pokemon Trading Card Game (TCG) collection tracker that allows users to:
- Browse all Pokemon card sets organized by series/generation
- Track which cards they own in their collection
- Create wishlist sets to track cards they want to acquire
- View detailed card information and completion progress per set
- Filter and search through sets

## Tech Stack
- **Framework**: Next.js 16.1.1 (App Router)
- **Language**: TypeScript 5
- **Frontend**: React 19.2.3
- **Styling**: Tailwind CSS 4
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js 4.24.13
- **External API**: TCGDex API (https://api.tcgdex.net/v2/en) for Pokemon card data
- **Deployment**: Designed for Vercel (or similar platforms)
- **Environment**: NixOS compatible (see flake.nix)

## Project Conventions

### Code Style
- TypeScript strict mode
- Client components marked with 'use client' directive
- Server components by default (Next.js App Router)
- camelCase for variables and functions
- PascalCase for React components and types
- Async/await for asynchronous operations
- Arrow functions preferred for component definitions
- Dark mode support via Tailwind dark: variants

### Architecture Patterns
- **App Router Structure**: Uses Next.js App Router with file-based routing in `/app`
- **Server Components**: Default for data fetching (see app/page.tsx, app/set/[setId]/page.tsx)
- **Client Components**: Used for interactive UI (components/*.tsx with 'use client')
- **API Routes**: RESTful endpoints in `/app/api` for database operations
- **Data Fetching**: Server-side fetching with Next.js caching (revalidate: 3600)
- **Database Access**: Centralized Prisma client in lib/prisma.ts
- **Authentication**: NextAuth.js with credentials provider, session management
- **State Management**: React hooks (useState, useEffect, useMemo) in client components
- **Type Safety**: Shared types in `/types` directory (tcgdex.ts, next-auth.d.ts)

### File Organization
- `/app` - Next.js pages and API routes
- `/components` - Reusable React components
- `/lib` - Utility functions (api.ts, auth.ts, storage.ts, prisma.ts, utils.ts)
- `/types` - TypeScript type definitions
- `/prisma` - Database schema and migrations
- `/public` - Static assets

### Testing Strategy
Currently no formal testing framework configured. Future additions should consider:
- Jest for unit tests
- React Testing Library for component tests
- Playwright/Cypress for E2E tests

### Git Workflow
- Main branch: `main`
- Commit messages should be descriptive
- Pre-commit hooks not currently configured

## Domain Context

### Pokemon TCG Terminology
- **Set**: A collection of cards released together (e.g., "Base Set", "Scarlet & Violet")
- **Series/Generation**: Groups of sets released in the same era
- **Card ID Format**: `{setId}-{localId}` (e.g., "base1-1", "sv08-123")
- **Card Categories**: Pokemon, Trainer, Energy
- **Rarity**: Common, Uncommon, Rare, Ultra Rare, etc.
- **Collection Tracking**: Users mark individual cards as "collected"
- **Wishlist**: Users can mark entire sets they want to complete

### Database Schema
- **User**: Email/password authentication, relationships to collections and filters
- **CollectedCard**: Junction table for user card ownership (userId + setId + cardId)
- **FilterSeries**: User's saved series filters for the main page
- **WishlistSet**: Sets the user wants to complete

### TCGDex API Integration
- Fetches card and set data from external API
- Caches responses for 1 hour (revalidate: 3600)
- Hierarchical structure: Series → Sets → Cards
- Images hosted at: `https://assets.tcgdex.net/en/{setId}/{localId}`

## Important Constraints
- **No Direct Modifications to Card Data**: All card information comes from TCGDex API
- **Caching Strategy**: 1-hour revalidation to balance data freshness and API load
- **Authentication Required**: Most features require user login
- **PostgreSQL Required**: Application depends on Prisma + PostgreSQL
- **NixOS Compatibility**: Prisma binary targets include "linux-nixos"

## External Dependencies
- **TCGDex API**: Primary data source for all Pokemon card information
  - Base URL: https://api.tcgdex.net/v2/en
  - Endpoints: /series, /series/{id}, /sets/{id}, /cards
  - No authentication required
  - Rate limiting considerations apply
- **Database**: PostgreSQL (connection via DATABASE_URL env var)
- **Authentication**: Session-based auth via NextAuth.js
