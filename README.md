<div align="center">

# ⚡ StockFlow

**An Arabic-first business management platform — inventory, point of sale, and smart reports.**

<p>
  <img src="https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white&labelColor=0b1220" alt="React 19" />
  <img src="https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white&labelColor=0b1220" alt="Vite 8" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss&logoColor=white&labelColor=0b1220" alt="Tailwind CSS 4" />
  <img src="https://img.shields.io/badge/Firebase-12-FFCA28?logo=firebase&logoColor=white&labelColor=0b1220" alt="Firebase 12" />
  <img src="https://img.shields.io/badge/Express-5-000000?logo=express&logoColor=white&labelColor=0b1220" alt="Express 5" />
  <img src="https://img.shields.io/badge/Arabic-RTL_first-10b981?labelColor=0b1220" alt="Arabic RTL first" />
</p>

</div>

---

## 🧭 Overview

**StockFlow** is a web platform for managing small-to-medium businesses — real-time inventory tracking, point-of-sale (POS) sales recording, expense logging, customer & supplier management, and clear profit reports that help owners make confident decisions.

Built **Arabic-first** (full RTL with English support), with a signature dark `slate + cyan` theme and interactive motion that makes the experience feel alive.

## ✨ Features

| | Feature | Description |
|---|---------|-------------|
| 📊 | **Dashboard** | Live KPIs: sales, profit, margin, and low-stock alerts |
| 📦 | **Products & Categories** | Full catalog with images, prices/costs, and a stock movement history |
| 🛒 | **Sales (POS)** | Fast sale recording with automatic stock decrement |
| 💸 | **Expenses** | Log and categorize operating expenses |
| 👥 | **Customers & Suppliers** | Relationships, balances, and transaction history |
| 📈 | **Reports** | Analytics and historical business performance |
| 🏬 | **Branches & Warehouses** | Switch between branches/warehouses from the top bar |
| 🖼️ | **Cloud images** | Product image uploads via Cloudinary with automatic optimization |
| 🌍 | **Arabic / English** | Full i18n with dynamic RTL/LTR — Arabic is the default |
| 🌗 | **Dark / Light theme** | Dark is the default brand identity, toggle anytime |
| 🎬 | **Interactive motion** | Live POS simulator on the landing hero: 3D tilt, count-up numbers, live toasts (framer-motion) |
| 🔐 | **Secure auth** | Firebase Authentication with protected routes |

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| UI | React 19 + Vite 8 |
| Styling | Tailwind CSS v4 (central design system with `sys-*` tokens) |
| Motion | framer-motion 12 |
| Icons | lucide-react |
| Routing | react-router-dom 7 |
| Database & Auth | Firebase (Firestore + Auth) |
| Server | Express 5 (Cloudinary image upload/delete + app serving) |
| Fonts | Cairo (headings) + Tajawal (body) |
| Linting | oxlint |

## 🚀 Quick Start

```bash
# 1) Clone the repository
git clone https://github.com/ali-yaqoup/Landingpage-.git
cd Landingpage-

# 2) Install dependencies
npm install

# 3) Set up environment variables
cp .env.example .env
# then fill in the values (see the table below)

# 4) Start the dev environment (Express + Vite on port 3000)
npm run dev
```

## 🔑 Environment Variables

Copy `.env.example` to `.env` and fill in:

| Variable | Provider | Description |
|----------|----------|-------------|
| `VITE_FIREBASE_API_KEY` | Firebase | Web app API key |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase | Auth domain |
| `VITE_FIREBASE_PROJECT_ID` | Firebase | Project ID |
| `VITE_FIREBASE_STORAGE_BUCKET` | Firebase | Storage bucket |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Firebase | Messaging sender ID |
| `VITE_FIREBASE_APP_ID` | Firebase | App ID |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary | Cloud name (server-side) |
| `CLOUDINARY_API_KEY` | Cloudinary | API key (server-side) |
| `CLOUDINARY_API_SECRET` | Cloudinary | Secret — **never share it** |

> ⚠️ `VITE_*` variables are bundled into the client code, while the Cloudinary variables stay server-side only (`server.js`).

## 📜 Available Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Start the dev environment (Express + Vite middleware on port 3000) |
| `npm run build` | Build the production bundle into `dist` |
| `npm run preview` | Preview the production build |
| `npm run lint` | Lint the codebase with oxlint |
| `npm start` | Run the production server (serves `dist`) |

## 🗂️ Project Structure

```
├── server.js                  # Express server: Cloudinary upload/delete + app serving
├── docs/
│   └── ARCHITECTURE_BIBLE.md  # Full platform architecture specification
└── src/
    ├── components/
    │   ├── animations/        # TiltCard, CountUp, LiveToasts, Transition
    │   ├── icons/             # Custom icons
    │   ├── layout/            # Sidebar, Navbar, Footer, MainLayout, ProtectedRoute
    │   └── ui/                # Card, Modal, Table, EmptyState, ...
    ├── constants/             # App constants
    ├── context/               # Auth, Business, Theme, Language
    ├── hooks/                 # Custom hooks (useBusiness, ...)
    ├── lib/                   # Firebase initialization
    ├── locales/               # ar.json + en.json (translations)
    ├── pages/                 # 13 pages: Dashboard, Products, Sales, Reports, ...
    ├── styles/                # Central design system (index.css — sys-* tokens)
    └── utils/                 # Pure helper utilities
```

## 🏗️ Architecture Notes

- **Multi-tenant data isolation**: each business's data lives in Firestore under `/businesses/{businessId}/...` (products, sales, expenses, customers, suppliers) — no query can reach another tenant's data.
- **Central design system**: all colors, fonts, and spacing are CSS tokens in `src/styles/index.css`, so a single change restyles every page automatically.
- **Language & direction**: `LanguageContext` sets `dir` and `lang` on the document dynamically, with nested translations and a smart English fallback.

📖 Full details in [`docs/ARCHITECTURE_BIBLE.md`](docs/ARCHITECTURE_BIBLE.md).

## 👨‍💻 Author

**Ali Yaqoub** — Full Stack Developer focused on React & UI/UX

<a href="https://github.com/ali-yaqoup">GitHub</a> • <a href="https://linktr.ee/ali_yaqoup_dev">Linktree</a>

---

<p align="center">Made with passion in Palestine 🇵🇸</p>
