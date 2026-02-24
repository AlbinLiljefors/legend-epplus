# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Legend — EPPlus** is an interactive architecture visualization for the EPPlus codebase. Built with Vite, React, TypeScript, shadcn-ui, and Tailwind CSS. Uses pipeline-generated data from `/public/generated/epplus.json`.

## Development Commands

```bash
# Install dependencies
npm i

# Start dev server (runs on http://[::]:8080)
npm run dev

# Build for production
npm run build

# Build in development mode
npm run build:dev

# Run linter
npm run lint

# Run tests (one-time)
npm test

# Run tests in watch mode
npm test:watch

# Preview production build
npm preview
```

## Architecture Overview

### Application Flow
1. **Landing Page** (`/`) - Entry point with hero section
2. **Sign In** (`/signin`) - Name/email collection + PostHog identification
3. **Loading Animation** (`/loading/:repoId`) - Transition screen
4. **Graph View** (`/graph/:repoId`) - Main interactive graph visualization

### Key Architectural Patterns

**React Flow Integration**: The graph visualization is built on `@xyflow/react`. The `GraphView` component orchestrates the entire visualization:
- Custom node types: `GraphNode` (individual nodes) and `GroupNode` (background groupings)
- Custom edge type: `AnimatedEdge` for connection visualization
- Four zoom levels: context (L1), system (L2), module (L3), and file (L4)
- Dynamic node positioning based on system groups

**Data Architecture**: Graph data is loaded at runtime from `public/generated/epplus.json`:
- `src/data/loader.ts` — fetches and caches generated JSON
- `src/data/types.ts` — TypeScript interfaces (GraphNode, GraphEdge, GeneratedRepoData)
- `src/data/demoData.ts` — thin wrapper delegating to loader

**Component Organization**:
- `src/components/ui/` - shadcn-ui components (autoconfigured, generally don't modify)
- `src/components/graph/` - Graph-specific components (nodes, edges, panels, sidebar)
- `src/components/landing/` - Landing page components
- `src/components/repos/` - Repository selection UI
- `src/components/loading/` - Loading animations

### Path Aliases

The project uses `@/` as an alias for `src/`:
```typescript
import { Button } from "@/components/ui/button"
```

## Deployment

- Deployed on Vercel with SPA routing (vercel.json)
- PostHog analytics for user tracking (same credentials as other Legend instances)
- Generated data must be in `public/generated/` before build
