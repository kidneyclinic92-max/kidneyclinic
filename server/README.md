# Clinic API (Local)

Minimal Express + MongoDB (Mongoose) API for the static admin panel.

## Setup

1. Provide a MongoDB connection URI (local MongoDB or MongoDB Atlas).
2. Create `.env` and set `MONGO_URI` and optional `PORT`.
3. Install deps and start:
   ```bash
   npm install
   npm run dev
   ```

API runs at `http://localhost:3001`.

## Endpoints

- GET /health
- CRUD: `/api/doctors`, `/api/services`, `/api/achievements`, `/api/reviews`
- Home singleton: `GET /api/home`, `PUT /api/home`


