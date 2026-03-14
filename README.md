# Lauryn's Dashboard

A high-security, unified personal dashboard for habits, finances, and fitness. Notion-inspired UI built with React (web) and React Native / Expo (iOS).

---

## Features

### Phase 1 ✅ — Core UI Shell & Local Habit Tracking
- **Habit tracking** — Create, delete, and drag-to-reorder habit blocks
- **GitHub-style heatmaps** — 365-day contribution graph per habit
- **Streak engine** — Current and longest streak calculation
- **Slash commands** — Press `/` to add habits or trigger actions
- **Auth shell** — OAuth 2.0 + JWT structure with Face ID placeholder
- **Local persistence** — All data stored in localStorage (web) / AsyncStorage (iOS)

### Phase 2 ✅ — Apple HealthKit Integration & Readiness Algorithm
- **HealthKit sync** — Steps, HRV, resting HR, sleep, and active calories (requires dev build)
- **Readiness Score** — 0–100 daily score: HRV (40%) + Sleep (40%) + Activity (20%)
- **Workout Library** — Log exercises, sets, reps, and weight per session
- **Recommendation engine** — Rule-based workout suggestions per readiness tier

### Phase 3 ✅ — Stitch Financial Sync & Savings Dashboard (South African banks)
- **Stitch Open Finance** — Connects Investec, Discovery Bank, Capitec, FNB, Standard Bank, Nedbank, Absa, TymeBank
- **ZAR currency** — All balances and transactions displayed in South African Rand (R)
- **Account balances** — Live bank account balances per institution
- **Transaction feed** — Categorised transactions with merchant names
- **Spending breakdown** — Visual category bars (Food, Transport, Entertainment, etc.)
- **Savings Goals** — Set targets with deadlines and track progress

### Phase 4 ✅ — AI-driven Coaching (Claude Opus 4.6) + Dark Mode
- **AI Advisor** — Chat interface powered by Claude Opus 4.6 with adaptive thinking
- **Live context** — Health metrics, workout history, and habits injected into every prompt
- **Streaming** — Real-time response rendering via SSE
- **Suggested prompts** — Pre-built coaching questions for quick interaction
- **Dark mode** — System-wide dark/light toggle in the sidebar (persisted, no flash on load)

---

## Project Structure

```
Lauryns-dashboard-/
├── server/   # Node.js/Express backend (Plaid + Claude API)
├── web/      # React + Vite + Tailwind CSS
└── mobile/   # React Native + Expo
```

---

## Quick Start

### 1. Backend Server (required for Phase 3 & 4)

```bash
cd server
npm install
cp .env.example .env   # fill in your keys (see below)
npm run dev            # runs on http://localhost:3001
```

The server runs in **mock mode** automatically if no API keys are set — the UI is fully functional with demo data.

#### Environment Variables (`server/.env`)

| Variable | Where to get it | Required for |
|---|---|---|
| `STITCH_CLIENT_ID` | [docs.stitch.money](https://docs.stitch.money/) (free sandbox) | Real SA bank sync |
| `STITCH_CLIENT_SECRET` | Stitch dashboard → App Settings → Credentials | Real SA bank sync |
| `STITCH_REDIRECT_URI` | Must match a URI registered in your Stitch app | Real SA bank sync |
| `ANTHROPIC_API_KEY` | [console.anthropic.com](https://console.anthropic.com) | Real AI responses |

> Without keys, the server runs in **demo mode** — realistic mock data for Investec, Discovery Bank & Capitec is returned automatically. The full UI is usable without any API keys.

#### Stitch Sandbox — Supported Banks
Stitch supports all major South African banks:
**Investec** · **Discovery Bank** · **Capitec** · **FNB** · **Standard Bank** · **Nedbank** · **Absa** · **TymeBank** · **African Bank**

### 2. Web App

```bash
cd web
npm install
npm run dev   # http://localhost:5173
```

> The web app calls `http://localhost:3001` by default. Set `VITE_API_URL` in `web/.env` to override.

### 3. iOS App (Expo Go)

> **Windows users:** Xcode is Mac-only. Use a physical iPhone with Expo Go or build a dev client via EAS.

```bash
cd mobile
npm install
npx expo start
```

Scan the QR code with your iPhone Camera app to open in Expo Go.

> **For Phase 2 HealthKit features:** Expo Go does not support native modules. Build a development client via EAS:
> ```bash
> cd mobile
> npx eas build --profile development --platform ios
> ```
> Install the resulting `.ipa` on your iPhone — it replaces Expo Go and supports HealthKit, Face ID, and all native modules.

#### Pointing Mobile to the Backend
By default the mobile app calls `http://localhost:3001`. When testing on a **physical iPhone** on the same Wi-Fi network, replace `localhost` with your PC's local IP:

```bash
# In mobile/.env (create if it doesn't exist):
EXPO_PUBLIC_API_URL=http://192.168.1.XXX:3001
```

---

## Tech Stack

| Layer | Web | iOS | Server |
|---|---|---|---|
| Framework | React 18 + Vite | React Native 0.74 + Expo 51 | Node.js + Express |
| Styling | Tailwind CSS | NativeWind | — |
| State | Zustand + localStorage | Zustand + AsyncStorage | In-memory |
| Navigation | React Router v6 | React Navigation v6 (bottom tabs) | — |
| Auth | Mock OAuth shell | expo-local-authentication (Face ID) | — |
| Health | — | react-native-health (HealthKit) | — |
| Finance | Stitch OAuth redirect | Server API proxy | stitch.money GraphQL API |
| AI | SSE streaming | SSE streaming | @anthropic-ai/sdk (Opus 4.6) |

---

## Roadmap

- **Phase 1** ✅ Core UI Shell & Local Habit Tracking
- **Phase 2** ✅ Apple HealthKit Integration & Readiness Algorithm
- **Phase 3** ✅ Plaid Financial Sync & Savings Dashboard
- **Phase 4** ✅ AI-driven Coaching with Claude Opus 4.6
