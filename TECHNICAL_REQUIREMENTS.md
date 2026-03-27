# Technical Requirements — PoS Prediction System v2.0

> **Hong Kong Supermarket PoS Prototype with Predictive Inventory Forecasting**
> Demo prototype only — no production backend, no authentication, no payment processing.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Page Architecture](#2-page-architecture)
3. [Design System](#3-design-system)
4. [Staff PoS Page](#4-staff-pos-page)
5. [Staff Dashboard](#5-staff-dashboard)
6. [Customer Menu (Phone View)](#6-customer-menu-phone-view)
7. [Data Model](#7-data-model)
8. [Animation Specifications](#8-animation-specifications)
9. [Accessibility](#9-accessibility)
10. [Responsive Breakpoints](#10-responsive-breakpoints)
11. [Tech Stack](#11-tech-stack)

---

## 1. Project Overview

### Purpose

A demo prototype of a Hong Kong supermarket Point-of-Sale system with predictive inventory forecasting. The system demonstrates how real-time sales data can drive inventory management decisions through demand forecasting.

### Scope

| In Scope | Out of Scope |
|---|---|
| Client-side PoS checkout flow | Production backend / API |
| Inventory tracking with stock levels | User authentication / login |
| 14-day demand forecast display | Payment gateway integration |
| Customer-facing menu (display only) | Multi-store support |
| Shared state across all pages | Real ML inference (uses mock forecast data) |

### Product Data Sources

- **Product catalogue**: HK Consumer Council supermarket price data via [data.gov.hk](https://data.gov.hk)
- **Product images**: [Open Food Facts](https://openfoodfacts.org) open-source image database
- **Catalogue size**: 60 real products with authentic HKD prices
- **Currency**: Hong Kong Dollar (HKD), formatted as `HK$XX.X`

---

## 2. Page Architecture

The application consists of **3 pages** connected by a shared top navigation bar and unified global state.

### Pages

| Page | Route | Target Device | Min Width | Purpose |
|---|---|---|---|---|
| Staff PoS | `/pos` | Desktop / Tablet | 1024px | Ring up customer orders |
| Staff Dashboard | `/dashboard` | Desktop / Tablet | 1024px | Inventory tracker + 14-day forecast + ordering |
| Customer Menu | `/menu` | Mobile phone (in phone-frame mockup on desktop) | N/A (fixed 393px frame) | Display-only product menu for customers |

### Navigation Bar

- Persistent top nav bar shared across all pages
- Contains page links, store name/branding, and demo reset control
- Active page indicator on current route
- Fixed position, does not scroll with content

### Shared State

All three pages read from and react to the same Zustand store. Actions on any page (e.g., a PoS checkout) immediately propagate to all other pages.

---

## 3. Design System

### Color Palette

#### Core Colors

| Token | Hex | Usage |
|---|---|---|
| Primary | `#2563EB` | Buttons, links, active states |
| Primary Hover | `#1D4ED8` | Button hover state |
| Primary Light | `#EFF6FF` | Primary tinted backgrounds |
| Surface | `#FFFFFF` | Cards, panels, modals |
| Background | `#F8FAFC` | Page background |

#### Category Colors (7 Categories)

| Category | Slug | Color | Hex |
|---|---|---|---|
| Beverages | `beverages` | Blue | `#3B82F6` |
| Dairy & Eggs | `dairy` | Green | `#22C55E` |
| Snacks & Confectionery | `snacks` | Orange | `#F97316` |
| Noodles & Rice | `noodles_rice` | Amber | `#F59E0B` |
| Canned & Cooking | `canned_cooking` | Red | `#EF4444` |
| Frozen Foods | `frozen` | Indigo | `#6366F1` |
| Bakery | `bakery` | Purple | `#A855F7` |

#### Stock Status Colors

| Status | Color | Hex | Condition |
|---|---|---|---|
| Stable | Green | `#22C55E` | Stock > 20 |
| Moderate | Yellow | `#EAB308` | Stock 11–20 |
| Low | Amber | `#F59E0B` | Stock 6–10 |
| Critical | Red | `#EF4444` | Stock 1–5 |
| Sold Out | Gray | `#9CA3AF` | Stock = 0 |
| Overstocked | Blue | `#3B82F6` | Stock significantly above target |

### Typography

- **Font Family**: Inter (with system-ui fallback stack)
- **Scale**: Tailwind default type scale
- **Weights**: 400 (normal), 500 (medium), 600 (semibold), 700 (bold)

### Spacing

- **Base unit**: 4px
- All spacing values are multiples of the 4px base: 4, 8, 12, 16, 20, 24, 32, 40, 48, 64px
- Tailwind spacing classes map directly (1 = 4px, 2 = 8px, etc.)

### Shadows

| Level | CSS Value | Usage |
|---|---|---|
| Shadow 0 | `none` | Flat elements |
| Shadow 1 | `0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06)` | Cards, tiles at rest |
| Shadow 2 | `0 4px 6px rgba(0,0,0,0.1), 0 2px 4px rgba(0,0,0,0.06)` | Elevated cards, hover states |
| Shadow 3 | `0 10px 15px rgba(0,0,0,0.1), 0 4px 6px rgba(0,0,0,0.05)` | Modals, popovers |
| Phone Frame | `0 25px 50px rgba(0,0,0,0.25)` | iPhone mockup frame |

### Interactive States

| State | Visual Treatment |
|---|---|
| Default | Base styles, Shadow 1 for cards |
| Hover | Slight lift (translateY -1px), Shadow 2, color shift where applicable |
| Active | Scale down (0.98), Shadow 1 |
| Focus | Double-ring outline — inner 2px white + outer 2px primary (`#2563EB`) |
| Disabled | 50% opacity, `cursor: not-allowed`, no hover effects |

---

## 4. Staff PoS Page

### Layout

Split-panel layout on desktop/tablet:

```
┌──────────────────────────────────────────────┐
│                  Nav Bar                      │
├────────────────────────────┬─────────────────┤
│   Product Grid (68%)       │  Order Panel    │
│                            │  (32%)          │
│  [Search Bar]              │  Order #1234    │
│  [Category Filter Pills]   │                 │
│                            │  Line Item 1    │
│  ┌──────┐ ┌──────┐ ┌────┐ │  Line Item 2    │
│  │ Tile │ │ Tile │ │Tile│ │  Line Item 3    │
│  └──────┘ └──────┘ └────┘ │                 │
│  ┌──────┐ ┌──────┐ ┌────┐ │  ───────────    │
│  │ Tile │ │ Tile │ │Tile│ │  Total: $XX.X   │
│  └──────┘ └──────┘ └────┘ │  [Checkout]     │
└────────────────────────────┴─────────────────┘
```

- **Product grid**: 68% width — scrollable area for browsing/searching products
- **Order panel**: 32% width — fixed sidebar showing current order

### Search Bar

- Full-width search input at the top of the product grid area
- Supports text search (product name, brand) and SKU lookup
- Real-time filtering as the user types
- Clear button when search text is present
- Placeholder: `"Search products or enter SKU..."`

### Category Filter Pills

- Horizontal row of pill-shaped filter buttons below the search bar
- One pill per category, using the category's assigned color
- Each pill shows the category name and product count (e.g., `Beverages (9)`)
- "All" pill selected by default
- Multiple categories can be active simultaneously or single-select (toggle behavior)

### Product Tiles

Each tile displays:

| Element | Detail |
|---|---|
| Image | Product image from Open Food Facts (with fallback placeholder) |
| Brand | Small text above product name |
| Name | Product name (truncate with ellipsis if too long) |
| Price | `HK$XX.X` format, bold |
| Stock Badge | Color-coded badge showing current stock level |

Click/tap on a tile adds 1 unit to the current order.

### Stock Thresholds

| Status | Stock Range | Badge Color | Tile Behavior |
|---|---|---|---|
| Stable | > 20 | Green | Normal, clickable |
| Moderate | 11–20 | Yellow | Normal, clickable |
| Low | 6–10 | Amber | Normal, clickable |
| Critical | 1–5 | Red | Clickable, shows urgency |
| Sold Out | 0 | Gray | Greyed out, not clickable |

### Order Panel

- **Header**: Order number/identifier
- **Line items**: Each shows product name, unit price, quantity controls (-, qty, +), line total
- **Quantity controls**: Minus button decrements (removes at 0), plus button increments (capped at available stock)
- **Order summary**: Subtotal, item count
- **Checkout button**: Prominent primary-colored button, disabled when order is empty
- **Clear order**: Secondary action to discard the current order

### Animations

- **+1 Float**: When a product is added to the order, a "+1" label floats up from the tile and fades out (400ms ease-out)
- **Checkout Success Cascade**: On successful checkout, order line items animate out sequentially (staggered slide-out), followed by a success confirmation

---

## 5. Staff Dashboard

### Summary Bar

Top-level KPI bar displayed at the top of the dashboard, showing at-a-glance metrics:

| KPI | Description |
|---|---|
| Total Products | Count of all products in catalogue |
| In Stock | Count of products with stock > 0 |
| Low Stock | Count of products with stock 6–10 |
| Critical Stock | Count of products with stock 1–5 |
| Sales Today | Total units sold today across all products |

Each KPI is displayed as a card with an icon, label, and prominent number. Status-colored accents for low/critical.

### Inventory Section

- **Filterable card grid**: Grid of inventory cards, filterable by category, stock status, and search
- **Inventory card** contents:
  - Product image (thumbnail)
  - Product name and brand
  - Current stock level as a number
  - **Stock bar**: Horizontal bar showing current stock as a proportion of max/target stock, color-coded by status
  - Category tag
  - **Quick adjust**: Inline +/- buttons to manually adjust stock count (for receiving deliveries, corrections, etc.)

### Forecast Section

- **Forecast table**: Tabular view of all products with demand forecasting data
- **Columns**:
  - Product name
  - Category
  - Today (actual sales — filled from real checkout data)
  - Day 1 through Day 14 (forecast values — mock data)
- **Sparklines**: Inline mini line chart in each row showing the 14-day forecast trend
- **Heat-map cells**: Forecast cells are background-colored using a heat-map gradient — higher predicted demand = warmer color, lower = cooler
- Sortable by any column
- Filterable by category

### Ordering Section

- **Urgency-sorted table**: Products sorted by restock urgency (critical first, then low, then moderate)
- **Columns**:
  - Product name
  - Current stock
  - Predicted demand (next 3 days)
  - Suggested order quantity (calculated from forecast vs. current stock)
  - Status badge
  - Order action
- **Suggested quantity**: Auto-calculated based on forecasted demand minus current stock, with a minimum buffer
- **Order button**: Per-row button to place a restock order for the suggested (or manually adjusted) quantity
- **Auto-order toggle**: Per-product toggle to enable automatic reordering when stock falls below threshold
- **Bulk order**: Button to place orders for all critical/low items at once using suggested quantities

---

## 6. Customer Menu (Phone View)

### Phone Frame Mockup

The customer menu is rendered inside an iPhone 15 frame mockup when viewed on desktop. This simulates how the menu would appear on a customer's mobile device.

| Property | Value |
|---|---|
| Frame dimensions | 393 x 852 px (iPhone 15 logical resolution) |
| Dynamic Island | Rendered at top of frame for realism |
| Frame border | Rounded rectangle with device-accurate corner radius |
| Frame shadow | `0 25px 50px rgba(0,0,0,0.25)` |
| Background | Centered on the page background |

### Store Header

- Store name and branding at the top of the phone screen
- **Live indicator**: Pulsing green dot with "Live" label, indicating real-time stock data
- Subtle background color or gradient

### Category Sections

- Products grouped by category with section headers
- **Collapsible**: Each category section can be expanded/collapsed by tapping the header
- **2-column grid** within each section: Product cards arranged in a 2-column layout

### Product Cards (Customer View)

Each card shows:

- Product image
- Product name
- Price in HKD
- **Availability badge** (see below)

### Availability Badges

| Stock Range | Badge Text | Style |
|---|---|---|
| 20+ | In Stock | Green badge |
| 11–20 | Available | Default/subtle badge |
| 4–10 | Only N left | Amber badge (N = actual count) |
| 1–3 | Only N left — hurry! | Red badge, pulsing animation (N = actual count) |
| 0 | Sold Out | Gray badge, entire card greyed out |

### Live Updates

- When stock changes (e.g., PoS checkout on another page), the customer menu updates in real-time via shared Zustand state
- Badge transitions animate smoothly (color fade, text crossfade) rather than snapping
- Sold-out items transition to greyed-out state with a subtle fade

---

## 7. Data Model

### TypeScript Interfaces

> Note: The current implementation uses JavaScript (JSX). These interfaces serve as the canonical type reference.

```typescript
interface Product {
  id: string;                    // Unique identifier, e.g. "bev_001"
  sku: string;                   // SKU code for barcode/search
  name: string;                  // Product name (English)
  nameChinese?: string;          // Product name (Traditional Chinese)
  brand: string;                 // Brand name
  category: CategorySlug;        // Category key
  price: number;                 // Price in HKD
  stock: number;                 // Current stock level (units)
  maxStock: number;              // Target/max stock level
  salesToday: number;            // Units sold today
  salesHistory: number[];        // Past 30 days daily sales
  forecast: number[];            // 14-day demand forecast
  imageUrl: string;              // Product image URL (Open Food Facts)
  autoOrder: boolean;            // Auto-reorder enabled
  lastOrdered?: string;          // ISO timestamp of last restock order
}

type CategorySlug =
  | 'beverages'
  | 'dairy'
  | 'snacks'
  | 'noodles_rice'
  | 'canned_cooking'
  | 'frozen'
  | 'bakery';

interface Category {
  slug: CategorySlug;
  name: string;                  // Display name
  nameChinese?: string;          // Chinese display name
  color: string;                 // Hex color code
  icon: string;                  // Lucide icon name
}

interface OrderItem {
  productId: string;
  qty: number;
  price: number;                 // Unit price at time of order
}

interface Order {
  id: string;                    // e.g. "order_1700000000000"
  items: OrderItem[];
  total: number;                 // Order total in HKD
  timestamp: string;             // ISO 8601 timestamp
}

interface AppState {
  // Data
  products: Product[];
  categories: Record<CategorySlug, Category>;
  orderHistory: Order[];
  currentOrder: OrderItem[];
  lastUpdated: string | null;
  initialized: boolean;

  // Actions — PoS
  addToOrder: (productId: string) => void;
  updateOrderQty: (productId: string, qty: number) => void;
  removeFromOrder: (productId: string) => void;
  clearOrder: () => void;
  checkout: () => Order | undefined;

  // Actions — Dashboard
  adjustStock: (productId: string, newStock: number) => void;
  placeOrder: (productId: string, qty: number) => void;
  toggleAutoOrder: (productId: string) => void;

  // Lifecycle
  initialize: (seedData: { products: Product[]; categories: Record<string, Category> }) => void;
  resetDemo: (seedData: { products: Product[]; categories: Record<string, Category> }) => void;

  // Derived
  getProduct: (id: string) => Product | undefined;
  getOrderTotal: () => number;
  getOrderItemCount: () => number;
}
```

### State Flow

```
PoS Checkout
    │
    ▼
┌─────────────────────┐
│   Zustand Store      │
│  (persisted to       │
│   localStorage)      │
└──────┬──────┬───────┘
       │      │
       ▼      ▼
  Dashboard  Customer Menu
  (instant)  (instant)
```

1. **PoS checkout** decrements `product.stock` and increments `product.salesToday` for each item in the order
2. State change propagates instantly to all pages via Zustand subscriptions
3. **Dashboard** reflects updated stock levels, KPIs, and ordering urgency
4. **Customer Menu** reflects updated availability badges
5. State is persisted to `localStorage` under key `pos-prediction-state`

### Seed Data

- **60 products** sourced from HK Consumer Council supermarket price data
- Distributed across all 7 categories
- Each product has realistic HKD pricing, initial stock levels, mock sales history, and 14-day mock forecast data
- Images sourced from Open Food Facts where available, with placeholder fallback

---

## 8. Animation Specifications

| Animation | Duration | Easing | Trigger | Description |
|---|---|---|---|---|
| +1 Float | 400ms | ease-out | Product added to order | "+1" text floats up 20px and fades out |
| Slide In Right | 200ms | ease-out | New order line item | Line item slides in from the right |
| Slide Out Left | 150ms | ease-in | Order line item removed | Line item slides out to the left and fades |
| Scale In | 300ms | cubic-bezier(0.34, 1.56, 0.64, 1) | Element appears | Bouncy scale from 0.5 to 1.0 |
| Checkout Cascade | 150ms each, 50ms stagger | ease-in | Checkout confirmed | Line items slide out sequentially |
| Pulse Slow | 1500ms | ease-in-out, infinite | Live indicator / critical stock | Gentle pulsing opacity/scale |
| Badge Transition | 200ms | ease | Stock status change | Smooth color and text crossfade |
| Card Hover Lift | 150ms | ease | Mouse enter/leave on card | translateY(-1px) + shadow elevation |

All animations respect `prefers-reduced-motion: reduce` — when set, animations are replaced with instant state changes (no motion).

---

## 9. Accessibility

### Standard: WCAG 2.1 Level AA

| Requirement | Implementation |
|---|---|
| Color contrast | All text meets 4.5:1 ratio (normal) / 3:1 (large). Status colors paired with text labels, never color-only |
| Keyboard navigation | All interactive elements reachable via Tab. Logical tab order follows visual layout |
| Focus indicators | Double-ring focus style: 2px white inner + 2px primary outer (visible on all backgrounds) |
| Screen reader support | Semantic HTML elements (`<nav>`, `<main>`, `<section>`, `<button>`). ARIA labels on icon-only buttons |
| Reduced motion | `prefers-reduced-motion: reduce` disables all animations/transitions |
| Touch targets | Minimum 44x44px touch target size for all interactive elements |
| Status announcements | Stock changes and order confirmations announced via `aria-live` regions |
| Alt text | All product images have descriptive alt text. Decorative images use `alt=""` |

---

## 10. Responsive Breakpoints

| Breakpoint | Min Width | Target |
|---|---|---|
| `sm` | 640px | — |
| `md` | 768px | — |
| `lg` | 1024px | Staff PoS / Dashboard minimum |
| `xl` | 1280px | Comfortable desktop layout |
| `2xl` | 1536px | Wide desktop |

### Staff Pages (PoS + Dashboard)

- **Minimum supported width**: 1024px
- Below 1024px: Display a "Please use a larger screen" message or gracefully collapse to a stacked single-column layout
- PoS split panel adjusts from 68/32 to stacked below `lg`

### Customer Menu

- Always rendered in the 393px-wide phone frame mockup on desktop
- The phone frame itself is centered on the page
- Internal layout is fixed at mobile dimensions regardless of viewport size

---

## 11. Tech Stack

| Layer | Technology | Version |
|---|---|---|
| Framework | React | 18.x |
| Build Tool | Vite | 5.x |
| State Management | Zustand | 4.x (with `persist` middleware) |
| Styling | Tailwind CSS | 3.x |
| Charts | Recharts | 2.x |
| Icons | Lucide React | latest |
| Routing | React Router | 6.x |
| Language | JavaScript (JSX) | ES2022+ |
| Persistence | localStorage | Browser API |

### Development

```bash
npm run dev       # Start Vite dev server
npm run build     # Production build
npm run preview   # Preview production build
```

### Project Structure

```
src/
├── main.jsx                    # App entry point
├── App.jsx                     # Router setup
├── components/
│   ├── pos/
│   │   ├── OrderPanel.jsx      # Order sidebar
│   │   └── ProductTile.jsx     # Product grid tile
│   ├── dashboard/
│   │   ├── SummaryBar.jsx      # KPI summary cards
│   │   ├── InventorySection.jsx
│   │   ├── InventoryCard.jsx
│   │   ├── ForecastSection.jsx
│   │   └── OrderingSection.jsx
│   └── shared/
│       ├── NavBar.jsx          # Top navigation
│       ├── ProductImage.jsx    # Image with fallback
│       ├── StockBadge.jsx      # Status badge component
│       └── Toast.jsx           # Notification toast
├── pages/
│   ├── PosPage.jsx
│   ├── DashboardPage.jsx
│   └── CustomerPage.jsx
└── store/
    ├── useStore.js             # Zustand store
    └── helpers.js              # Store utility functions
```

---

*Document version: 2.0*
*Last updated: 2026-03-23*
