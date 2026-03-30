# PoS Prediction System

Hong Kong supermarket Point-of-Sale prototype with predictive inventory forecasting. Demo-only — no backend, no auth, no payments.

## Pages

- **Staff PoS** (`/pos`) — Ring up orders with search, category filters, and stock tracking
- **Staff Dashboard** (`/dashboard`) — Inventory management, 14-day demand forecasts, and ordering
- **Customer Menu** (`/menu`) — Phone-frame product display for customers

All pages share state via Zustand — a checkout on PoS instantly updates Dashboard and Menu.

## Data

60 real HK products with authentic HKD prices sourced from the HK Consumer Council (data.gov.hk). Forecast data is mock (no real ML inference).

## Tech Stack

React 18 · React Router · Zustand · Tailwind CSS · Recharts · Lucide Icons · Vite

## Getting Started

```bash
npm install
npm run dev
```

Build for production:

```bash
npm run build
npm run preview
```
