# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev        # Start dev server on localhost:3000
npm run build      # Production build to dist/
npm run preview    # Preview production build

# Install new packages with --legacy-peer-deps (required on Node 18)
npm install <pkg> --legacy-peer-deps
```

## Architecture

**3-page React SPA** for HKUST Fusion supermarket — Staff PoS, Staff Dashboard, Customer Menu. Demo prototype: no backend, no auth, no payments. All state is client-side via Zustand with localStorage persistence.

### State (`src/store/`)

Single Zustand store (`useStore.js`) shared across all pages. All mutations are in the store:
- `checkout()` — decrements `product.stock`, increments `product.salesToday`, clears `currentOrder`
- `adjustStock(id, newStock)` — direct stock override from dashboard
- `placeOrder(id, qty)` — restock: increments stock, sets `lastOrdered`
- `currentOrder` is intentionally excluded from localStorage persistence

`helpers.js` exports: `getStockStatus` (thresholds: 0=soldout, 1–5=critical, 6–10=low, 11–20=moderate, 21+=stable/overstocked), `STATUS_CONFIG` (colors per status), `getSuggestedOrder` (7-day forecast sum minus current stock), `formatPrice`, `getRelativeTime`.

### Data (`src/data/seedData.json`)

21 products across 7 categories. Each product has `forecast` (14-element array, predicted daily sales), `salesHistory` (7-element array, past week). In `UnifiedForecastOrder`, the last element of `salesHistory` is always overridden with live `product.salesToday` so the chart's "Today" point reflects actual checkouts.

Product images are downloaded locally to `public/images/products/item_XXX.jpg` (not fetched from external URLs at runtime).

### Dashboard Layout

The dashboard uses a **side-by-side layout with independent scroll panels** — no page-level scroll. Left: `w-72` `InventorySection`. Right: `flex-1` `UnifiedForecastOrder`.

`UnifiedForecastOrder` uses a **div-based CSS Grid** (not an HTML `<table>`). The column template is defined as a constant:
```js
const COL_GRID = 'grid grid-cols-[minmax(130px,1.4fr)_48px_44px_40px_40px_72px_40px_minmax(130px,1fr)]';
```
This was a deliberate switch from `<table>` — `display: contents` on `<tr>` elements caused rows to render horizontally.

### Charts

All charts are custom SVG (recharts was removed). Key pattern in `AreaChart`:
- Past + future data form **one continuous array**. `splitIdx = pastData.length` is the index where past ends and future begins.
- Past line (solid) covers indices `0..splitIdx`. Future line (dashed) covers `splitIdx-1..end` — the shared point creates a seamless visual join.
- X-axis labels are rendered **inside the SVG** as `<text>` elements at exact data-point x-coordinates. A separate `<div>` for labels cannot align with SVG internal padding.

### Customer Page — Store Finder

`StoreFinderModal` uses Leaflet with OpenStreetMap tiles (no API key). Store data is static with real coordinates. Stock at non-HKUST stores is simulated deterministically: `hash(product.id + store.id) % 60`. Leaflet is dynamically imported (`import('leaflet')`) so it only loads when the modal opens.

### Styling Conventions

- Cards/panels: `rounded-xl`
- Buttons/inputs: `rounded-lg`
- Tiny inline controls (±qty buttons): `rounded-md`
- Pills/dots: `rounded-full`
- NavBar and SummaryBar use the same dark gradient: `bg-gradient-to-r from-navy-900 via-navy-800 to-navy-900`
- `navy-900: #0B1121`, `navy-800: #0F172A` defined in `tailwind.config.js`
- `StockBadge` uses `rounded-full` for default variant, `rounded-none` for customer variant — do not use inline `borderRadius` style (it conflicts with Tailwind classes)
