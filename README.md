# Techligence Campaign Analytics Dashboard

Full-stack robot advertisement platform with campaign management, analytics, geo tracking, reports, notifications, and mock AI integrations.

## Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 19, Vite, Tailwind CSS, Recharts, Leaflet, React Router |
| Backend | Node.js, Express 5, JWT, express-validator |
| Database | MongoDB Atlas (Mongoose) |

## Quick Start

```bash
# Backend
cd backend
npm install
cp .env.example .env   # configure MONGODB_URI + JWT_SECRET
npm run seed           # demo user + analytics data
npm start              # http://localhost:5000

# Frontend
cd frontend
npm install
npm run dev            # http://localhost:5173
```

**Demo login:** `demo@techligence.test` / `Password123`

## Features

- **Dashboard** — KPIs, performance trends, top campaigns
- **Campaigns** — CRUD, media upload, draft workflow, Drive import (mock)
- **Analytics** — Recharts line/bar/pie charts, sentiment, channel performance, health scores
- **Compare** — Side-by-side campaign benchmarking (Recharts + DataTable)
- **Reports** — Generate executive, performance, sentiment, geo, comparison reports
- **Notifications** — Inbox, unread counts, mark read
- **Geo** — Leaflet map with live robot locations and city summaries
- **Billing** — Campaign payment flow
- **AI Integrations** — Mock endpoints for Rekognition, Transcribe, Comprehend, Whisper, Video Moderation

## API Routes

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Create account |
| POST | `/api/auth/login` | JWT login |
| GET | `/api/dashboard/overview` | Aggregated metrics |
| GET | `/api/dashboard/geo` | Robot locations |
| GET | `/api/dashboard/sentiment` | Sentiment analytics |
| GET | `/api/campaigns` | List campaigns (paginated) |
| GET | `/api/campaigns/compare` | Campaign comparison |
| POST | `/api/reports` | Generate report |
| GET | `/api/notifications` | Notification inbox |
| POST | `/api/integrations/*` | Mock AI endpoints |

## Project Structure

```
ad-website/
├── backend/
│   ├── config/          # DB, env, pricing
│   ├── controllers/     # Route handlers
│   ├── middleware/      # Auth, validation, uploads
│   ├── models/          # Mongoose schemas
│   ├── routes/          # Express routers
│   ├── services/        # Business logic + mock analytics
│   ├── validations/     # express-validator rules
│   └── scripts/         # Seed scripts
└── frontend/
    └── src/
        ├── api/         # Axios client
        ├── components/  # Reusable UI (Panel, StatCard, RobotsMap, DataTable)
        ├── context/     # Auth provider
        └── pages/       # Route pages
```
