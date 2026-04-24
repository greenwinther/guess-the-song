# guess-the-song

Real-time multiplayer "guess the submitter" game built with Next.js, React, Express, Socket.IO, and TypeScript.

The app has three main runtime surfaces:

- player flow: join a room, ready up, play rounds, and view results
- host flow: run the live game, control playback, and reveal results
- admin flow: prepare songs, themes, and bonus questions before the game starts

## Routes

Current App Router routes:

- `/`
  Home screen with `Join` / `Host` entry
- `/join/[code]`
  Player room runtime
- `/host/[code]`
  Host control runtime
- `/admin/[code]`
  Admin/editor runtime

## Stack

- Next.js 16
- React 18
- TypeScript
- Tailwind CSS
- Express
- Socket.IO
- Zod
- `@dnd-kit/*`

## Project Layout

### Client

- `src/app`
  App Router pages and layouts
- `src/components/player`
  Player UI
- `src/components/host`
  Host UI
- `src/components/admin`
  Admin/editor UI
- `src/contexts/gameContext`
  Shared mounted room/runtime state
- `src/contexts/SocketContext.tsx`
  Shared browser Socket.IO connection

### Server

- `src/server/socketServer.ts`
  Express + Socket.IO entrypoint
- `src/server/socket`
  Socket event handlers
- `src/server/http/registerHttpRoutes.ts`
  HTTP endpoints
- `src/server/store`
  In-memory room store
- `src/server/state`
  Persistence and runtime snapshots

## Prerequisites

- Node.js 22.x
- npm
- YouTube Data API key

## Install

```bash
npm install
```

## Local Environment

Create `.env.local` in the project root:

```env
NEXT_PUBLIC_SOCKET_URL=http://localhost:4000
NEXT_PUBLIC_API_URL=http://localhost:4000
SOCKET_PORT=4000
CLIENT_URL=http://localhost:3000
YOUTUBE_API_KEY=your_youtube_api_key
```

Useful optional variables:

- `CLIENT_URL_2`
- `LOG_LEVEL`
- `PORT`
- `CLEANUP_INTERVAL_MS`

Notes:

- `.env.local` is used for local development
- hosted production deploys should use platform environment variables instead
- in hosted production, the backend listens on platform `PORT`

## Run Locally

```bash
npm run dev
```

This starts:

- Next.js on `http://localhost:3000`
- Express + Socket.IO on `http://localhost:4000`

## Scripts

- `npm run dev`
  Start Next.js and the socket server together
- `npm run dev:next`
  Start only Next.js
- `npm run dev:socket`
  Start only the Express + Socket.IO server
- `npm run build`
  Build the Next.js app and the server bundle
- `npm run build:server`
  Build only the backend bundle into `dist/`
- `npm run build:railway`
  Build target used for Railway
- `npm run build:render`
  Build target used for Render
- `npm run start:server`
  Start the compiled backend from `dist/`
- `npm run start:railway`
  Railway start target
- `npm run start:render`
  Render start target
- `npm run start:next`
  Start the production Next.js app
- `npm run lint`
  Run ESLint
- `npm run test:unit`
  Run unit tests
- `npm run test:e2e`
  Run Playwright end-to-end tests
- `npm run test:smoke`
  Run the smoke-test script
- `npm run wipe`
  Remove persisted local state
- `npm run knip`
  Check for unused files and exports

## HTTP Endpoints

Served by the Express backend:

- `GET /`
- `GET /health`
- `GET /api/youtube-search?q=...`
- `GET /api/youtube-title?id=...`
- `POST /api/rooms`
- `GET /api/rooms/:code`
- `POST /api/rooms/:code/songs`

## Deployment

This repo is designed as a split deploy:

- frontend on Vercel
- backend on a long-running Node host such as Render or Railway

### Frontend Environment

Set these on Vercel:

- `NEXT_PUBLIC_SOCKET_URL`
  Public backend URL, for example `https://your-backend.up.railway.app`
- `NEXT_PUBLIC_API_URL`
  Same backend URL

### Backend Environment

Set these on the backend host:

- `NODE_ENV=production`
- `CLIENT_URL`
  Exact frontend origin, for example `https://your-app.vercel.app`
- `YOUTUBE_API_KEY`

Optional:

- `CLIENT_URL_2`
  Secondary allowed frontend origin
- `CLEANUP_INTERVAL_MS`
- `LOG_LEVEL`

Do not set a custom `PORT` unless the platform explicitly requires it. Hosted platforms such as Render and Railway provide `PORT` automatically.

### Render

This repo includes [render.yaml](./render.yaml) for the backend service.

### Railway

Typical Railway commands:

- build: `npm run build:railway`
- start: `npm run start:railway`

If needed, pin Railway's Node runtime with:

```env
NIXPACKS_NODE_VERSION=22
```

### Deployment Order

1. Deploy the backend.
2. Confirm backend health with `/health`.
3. Configure Vercel with `NEXT_PUBLIC_SOCKET_URL` and `NEXT_PUBLIC_API_URL`.
4. Deploy the frontend.
5. Set backend `CLIENT_URL` to the exact frontend origin.
6. Redeploy the backend if CORS settings changed.

## CI

GitHub Actions currently runs:

- `npm run lint`
- `npm run test:unit`
- `npm run build`
- `npm run test:e2e`

## Notes

- The backend uses in-memory room state with file persistence for local/server runtime recovery.
- Free hosts may sleep, restart, or lose state between deployments.
- If the frontend shows the socket status banner in production, check:
  - frontend `NEXT_PUBLIC_SOCKET_URL`
  - backend `CLIENT_URL` / `CLIENT_URL_2`
  - backend `/health`
