# IPL Auction Frontend (React + Tailwind)

This is a small demo frontend for an IPL auction bidding system built with React (Vite) and Tailwind CSS.

Features included:
- Players list with base price and highest bid
- Simple bid modal with validation (bid must be larger than current)
- Live summary cards

Getting started

1. Install dependencies

```bash
npm install
```

2. Start backend API

```bash
npm start
```

3. Run frontend dev server

```bash
npm run dev
```

The app will open at the URL printed by Vite (usually http://localhost:5173).

Backend runs at http://localhost:4000 by default.

Notes and next steps
- This is frontend-only: bids are stored in local React state. Hook up an API/websocket for persistence and multi-user live updates.
- You can expand features: authentication, team assignment, bid history, timers per player, and richer validations.
