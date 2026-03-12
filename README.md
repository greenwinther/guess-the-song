# guess-the-song

Real-time multiplayer "guess the submitter" game built with Next.js, React, Socket.io, Express, and TypeScript.

The app is now organized around three separate flows:

- Public/player flow: join a room, wait in the lobby, play rounds, and see results.
- Admin/editor flow: prepare songs, theme, detail answers, and room settings ahead of time.
- Host/control flow: run the live session, play songs, reveal answers, and show results.

## Current Routes

- `/`
  Public entry shell with an in-card `join` / `host` switch.
- `/play/[code]`
  Player runtime shell. The room phase decides whether the player sees lobby, gameplay, or results.
- `/control/[code]`
  Host control shell. The room phase decides whether the host sees pre-game control or live playback.
- `/admin/[code]`
  Admin/editor surface plus live dashboard.

Legacy compatibility routes still exist and redirect:

- `/join/[code]`
- `/join/[code]/game`
- `/host/[code]`
- `/host/[code]/game`

## Stack

- Next.js 16
- React 18
- TypeScript
- Tailwind CSS
- Socket.io
- Express
- Zod
- `@dnd-kit/*` for drag-and-drop ordering

## Architecture

### Client

- `src/app`
  App Router pages and route layouts.
- `src/components/player`
  Player-facing UI pieces.
- `src/components/control`
  Host-control and shared editor/control widgets.
- `src/components/admin`
  Admin/editor-specific surfaces.
- `src/contexts/gameContext`
  Room/runtime React state for mounted shells.
- `src/contexts/SocketContext.tsx`
  Shared Socket.io client connection.

### Server

- `src/server/socket`
  Socket event handlers and live game flow.
- `src/server/http/registerHttpRoutes.ts`
  Express HTTP routes.
- `src/server/store`
  In-memory room storage and mutations.
- `src/server/state`
  Game snapshots, persistence, and public room projection.

Room HTTP endpoints now live in one place only: the Express server. The duplicate App Router room APIs were removed.

## Getting Started

### Prerequisites

- Node.js 20+
- npm
- YouTube Data API key

### Install

```bash
npm install
```

### Environment

Create `.env.local` in the project root:

```bash
NEXT_PUBLIC_SOCKET_URL=http://localhost:4000
NEXT_PUBLIC_API_URL=http://localhost:4000
CLIENT_URL=http://localhost:3000
YOUTUBE_API_KEY=your_youtube_api_key
```

Useful optional variables:

- `CLIENT_URL_2`
- `LOG_LEVEL`
- `PORT`
- `SOCKET_PORT`
- `CLEANUP_INTERVAL_MS`

### Run Locally

```bash
npm run dev
```

This starts:

- Next.js on `http://localhost:3000`
- Express + Socket.io on `http://localhost:4000`

## Available Scripts

- `npm run dev`
  Start Next.js and the socket server together.
- `npm run dev:next`
  Start only the Next.js app.
- `npm run dev:socket`
  Start only the socket/Express server.
- `npm run build`
  Build the Next.js app and the server bundle.
- `npm run build:server`
  Build only the server bundle into `dist/`.
- `npm run start:next`
  Start the production Next.js app.
- `npm run start:railway`
  Start the compiled server bundle.
- `npm run lint`
  Run ESLint across the repo.
- `npm run test:unit`
  Run unit tests with `tsx --test`.
- `npm run test:e2e`
  Run Playwright end-to-end tests.
- `npm run test:smoke`
  Run the smoke test script.
- `npm run wipe`
  Clear persisted game data.
- `npm run knip`
  Check for unused files and exports.

## HTTP Endpoints

These are served by the Express server:

- `GET /health`
- `GET /api/youtube-search?q=...`
- `GET /api/youtube-title?id=...`
- `POST /api/rooms`
- `GET /api/rooms/:code`
- `POST /api/rooms/:code/songs`

## How The Flows Work

### Player Flow

1. Join from `/`.
2. Enter `/play/[code]`.
3. Wait in lobby until the room leaves `LOBBY`.
4. Guess submitters and optional detail answers during gameplay.
5. View final scoring and results.

### Admin Flow

1. Open `/admin/[code]`.
2. Add songs, set theme, configure detail question, and manage lobby rules.
3. Return later if needed before the live session begins.

### Host Flow

1. Open `/control/[code]`.
2. Watch readiness and room setup status.
3. Start the game.
4. Play clips, advance rounds, reveal submitters/detail answers, and show results.

## Testing And CI

CI runs:

- `npm run lint`
- `npm run test:unit`
- `npm run build`

Run the same checks locally before pushing if you are changing core flow or server behavior.
