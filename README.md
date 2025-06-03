# guess-the-song

A real-time, multiplayer “guess the submitter” game built with Next.js, React, Socket.io, and TypeScript. Players join a room, submit a list of songs (with submitter names), then take turns listening to short clips and guessing who submitted each track by ordering the submitter names. The host controls playback and reveals answers; everyone sees their score at the end.

---

## Table of Contents

1. [Features](#features)
2. [Tech Stack](#tech-stack)
3. [Getting Started](#getting-started)
    - [Prerequisites](#prerequisites)
    - [Installation](#installation)
    - [Environment Variables](#environment-variables)
    - [Available Scripts](#available-scripts)
4. [Folder Structure](#folder-structure)
5. [How to Play](#how-to-play)
    - [Host Flow](#host-flow)
    - [Player Flow](#player-flow)
6. [Running Tests](#running-tests)
7. [Contributing](#contributing)
8. [Code Style](#code-style)
9. [License](#license)

---

## Features

-   **Real-time rooms**: Create or join a room by code.
-   **Drag-and-drop ordering**: Players reorder submitter names rather than using up/down buttons.
-   **WebSocket communication**: All game events (player join, song play, game over, etc.) happen over Socket.io.
-   **Reveal logic**: The host plays short clips; clients reveal the answer once a clip has played.
-   **Responsive UI**: Built with Tailwind CSS and works on desktop and mobile.
-   **TypeScript throughout**: Statically typed components, contexts, and utility functions.

---

## Tech Stack

-   **Next.js** – React framework for routing, SSR/SSG, and API routes.
-   **React** – Component-based UI.
-   **Socket.io** – Real-time bidirectional communication between host and players.
-   **@hello-pangea/dnd** – Drag-and-drop ordering library (lightweight fork of react-beautiful-dnd).
-   **TypeScript** – Type safety across components, contexts, and utilities.
-   **Tailwind CSS** – Utility-first styling.
-   **Jest & React Testing Library** – Unit and component tests.

---

## Getting Started

### Prerequisites

-   **Node.js** (v16 LTS or higher) and **npm** (v8+) or **Yarn** (v1.22+).
-   A modern browser (latest Chrome, Firefox, Safari, or Edge).

```bash
# Check your versions:
node --version   # e.g. v18.16.0
npm --version    # e.g. 9.5.1
# (or)
yarn --version   # e.g. 1.22.19
```

## Installation

1. Clone the repository

```bash
   git clone https://github.com/greenwinther/guess-the-song.git
   cd guess-the-song
```

2. Install dependencies

```bash
# Using npm:
npm install
# Or using Yarn:
yarn install
```

3. Set up your environment variables
   Create a **.env.local** file in the root (next to **package.json**) with the following (replace placeholders as needed):

```bash
NEXT_PUBLIC_SOCKET_URL=http://localhost:4000
CLOUDINARY_CLOUD_NAME=<your_cloud_name>
CLOUDINARY_API_KEY=<your_api_key>
CLOUDINARY_API_SECRET=<your_api_secret>
YOUTUBE_API_KEY=<your_youtube_api_key>
```

4. Start the development server

```bash
# Build and run in development mode (Next.js + Socket.io server)
npm run dev
# or
yarn dev
```

-   The Next.js app will run at **http://localhost:3000**.
-   The Socket.io backend (for local dev) will run at **http://localhost:4000** by default.

5. Open your browser
   Navigate to http://localhost:3000 and either create a new room (as host) or join an existing room using the 4-letter code.

## Environment Variables

| Variable Name            | Description                                             | Default               |
| ------------------------ | ------------------------------------------------------- | --------------------- |
| `NEXT_PUBLIC_SOCKET_URL` | URL for Socket.io server (e.g. `http://localhost:4000`) | _required for client_ |
| `PORT`                   | Port for the Next.js web server (if overriding)         | `3000`                |
| `SOCKET_PORT`            | Port for the Socket.io server (if overriding)           | `4000`                |

Note: All client-facing variables must begin with **NEXT\*PUBLIC** in Next.js.

## Available Scripts

From the project root, run:

-   **npm run dev** / **yarn dev**
    Starts both Next.js (port 3000) and the Socket.io server (port 4000) in development with Hot Module Replacement.

-   **npm run build** / **yarn build**
    Builds the Next.js app for production. Outputs optimized JavaScript/HTML in **.next**.

-   **npm run start** / **yarn start**
    Runs the production build of Next.js (after build) on process.env.PORT (defaults to 3000).

-   **npm run lint** / **yarn lint**
    Lints TypeScript and JSX/TSX files using ESLint. Configured to follow project conventions.

-   **npm run test** / **yarn test**
    Runs Jest unit tests and React component tests.

-   **npm run test:watch** / **yarn test:watch**
    Runs tests in watch mode (re-runs on file changes).

-   **npm run format** / **yarn format**
    Formats codebase using Prettier (configurable in .prettierrc).

## Folder Structure

```bash
guess-the-song
├── .eslintrc.js
├── .prettierrc
├── README.md
├── next.config.js
├── package.json
├── tsconfig.json
├── public/
│   └── favicon.ico
│   └── assets/           # Static images (demo GIFs, logos)
├── src/
│   ├── components/        # Reusable React components
│   │   ├── JoinGameClient.tsx            # Main game UI (host & player)
│   │   ├── SubmissionOrderList.tsx       # Drag-and-drop list component
│   │   └── ui/            # Shared UI primitives (Button, Card, etc.)
│   │
│   ├── contexts/          # React contexts & providers
│   │   ├── GameContext.tsx           # Manages game state (room data, scores)
│   │   └── SocketContext.tsx         # Provides connected Socket.io instance
│   │
│   ├── pages/             # Next.js pages & API routes
│   │   ├── _app.tsx                # Global context providers
│   │   ├── index.tsx               # Landing/join or create room
│   │   └── api/
│   │       └── socket.ts           # Next.js API route for Socket.io server
│   │
│   ├── types/             # Shared TypeScript interfaces
│   │   └── room.ts                # Player, Song, Room, Score types
│   │
│   ├── utils/             # Utility functions & helpers
│   │   ├── shuffleArray.ts            # Fisher–Yates shuffle
│   │   └── formatDate.ts              # (example helper)
│   │
│   ├── lib/               # Third-party integration helpers
│   │   └── youtube.ts               # `getYouTubeID` for thumbnail URLs
│   │
│   └── styles/            # Global CSS (if any) or Tailwind config
│       └── globals.css
│
├── server/                # (if separated) Socket.io server code
│   └── index.ts          # Standalone Socket.io server entry (if not in API)
│
└── tsconfig.json          # TypeScript configuration
```

Note: Depending on your deployment strategy, the Socket.io server may live inside
**src/pages/api/socket.ts** (Next.js API Route) or a separate server/ folder.
Adjust **NEXT_PUBLIC_SOCKET_URL** accordingly.

## How to Play

There are two distinct flows: one for the host who creates the room and controls playback,
and one for players who join and submit guesses.

### Host Flow

1. Create a Room

-   On the landing page, click “Create Room.”
-   Enter a 4-letter (or numeric) room code of your choice. This generates a new **Room** object on the server.

2. Upload/Submit Songs

-   Once the room is created, the host sees a form to add songs.
-   For each song, the host enters:
    -   Title (e.g. “Blinding Lights”)
    -   Submitter Name (e.g. “Alice”)
    -   YouTube Clip URL (a short clip link, e.g. **https://www.youtube.com/watch?v=…)**
-   Upon adding all songs, click “Start Game”.

3. Gameplay

-   The server randomly determines the playlist order (host can optionally shuffle).
-   For each track in turn:
    1. Host clicks “Play Clip” → The server emits **playSong** to clients with **{ songId, clipUrl }**.
    2. The host's browser begins playback (e.g. embeds YouTube player).
    3. After the clip, the server marks that song as “revealed.”
    4. Host moves to the next track until all clips have played.

4. Viewing Results

-   Once all songs have been “played,” the host clicks “End Game.”
-   The server calculates each player’s score (number of correct guesses) and emits **gameOver** to all clients with **{ scores }**.

## Player Flow

1. Join a Room

-   On the landing page, enter the same Room Code and your Player Name.
-   The server emits **roomData** containing the current **Room** object (list of songs, existing players).
-   The host’s song list populates on your side, but titles remain hidden. You only see the submitter names.

2. Drag-and-Drop Guessing

-   As soon as the host starts the game, you see a list of “hidden” song slots with the shuffled submitter names.
-   For each track index:
-                                             Drag the submitter names into the order you believe matches the playlist.
-                                             If there are N songs, you must arrange N names from position 1 to N.
-   You can reorder freely until Submit Order.

3. Submit Your Order

-   Once satisfied, click “Submit Order.”
-   The server stores your guess for each **songId**.
-   The UI disables further dragging, and you see a “Waiting for game to end…” message.

4. Reveal & Score

-   Every time the host plays a clip for **songId**, the client “reveals” that track’s title in the playlist sidebar.
-   At the end, when **gameOver** arrives:
-                                         Each list item in your guess order is compared against the correct submitter (drawn from **Room.songs[i].submitter**).
-                                         Correct guesses show a green “1”; incorrect show a red “0.”
-                                         Your total correct count displays at the top.

## Running Tests

We use Jest and React Testing Library:

```bash
# Run all tests once:
npm run test
# or
yarn test

# Run in watch mode (reruns on file changes):
npm run test:watch
# or
yarn test:watch
```

-   Unit Tests
-   Located under **src/utils/**tests**/shuffleArray.test.ts**, etc.
-   Ensure **shuffleArray** does not mutate input and preserves content.
-   Component Tests
-   Under **src/components/**tests**/JoinGameClient.test.tsx**, **SubmissionOrderList.test.tsx**.
-   Verify that drag-and-drop reorder logic works and that result items render “0”/“1” correctly.

## Contributing

We welcome contributions! Feel free to:

1. Fork the repo and create your feature branch:

```bash
git checkout -b feature/your-feature-name
```

2. Commit your changes with clear messages:

```bash
git commit -m "Add: new drag-handle icon to SubmissionOrderList"
```

3. Push to your fork:

```bash
git push origin feature/your-feature-name
```

4. Open a Pull Request against main.
5. We’ll review and merge if everything checks out.
   Before submitting, please:

-   Run **npm run lint** (or **yarn lint**) and fix any ESLint errors.
-   Run **npm run format** (or **yarn format**) to ensure code is Prettier-formatted.
-   Add unit tests or component tests for any new logic.

## Code Style

-   ESLint with TypeScript rules (**.eslintrc.js**):
-   Enforces no unused vars, consistent imports, hooks rules, etc.
-   Prettier (**.prettierrc**):
-   2-space indent, semicolons, trailing commas where valid in ES5.
-   TypeScript (**tsconfig.json**):
-   **strict** mode enabled, **skipLibCheck: true**, **forceConsistentCasingInFileNames: true**.
    Please make sure your editors/IDEs are configured to auto-format on save and respect the project’s ESLint/Prettier rules.

## License

This project is licensed under the MIT License.

Built with ❤️ by the guess-the-song team.
If you have questions or run into issues, open an issue or reach out via pull request!
