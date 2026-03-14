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

### Phase 3 ✅ — Plaid Financial Sync & Savings Dashboard
- **Plaid Link** — Connect any bank account in sandbox or production
- **Account balances** — Live checking and savings balances
- **Transaction feed** — Categorised transactions with merchant names
- **Spending breakdown** — Visual category bars (Food, Transport, Entertainment, etc.)
- **Savings Goals** — Set targets with deadlines and track progress

### Phase 4 ✅ — AI-driven Coaching (Claude Opus 4.6)
- **AI Advisor** — Chat interface powered by Claude Opus 4.6 with adaptive thinking
- **Live context** — Health metrics, workout history, and habits injected into every prompt
- **Streaming** — Real-time response rendering via SSE
- **Suggested prompts** — Pre-built coaching questions for quick interaction

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
| `PLAID_CLIENT_ID` | [dashboard.plaid.com](https://dashboard.plaid.com) (free sandbox) | Real bank sync |
| `PLAID_SECRET` | Plaid dashboard → Team → Keys → Sandbox secret | Real bank sync |
| `PLAID_ENV` | `sandbox` (default) or `development` | Real bank sync |
| `ANTHROPIC_API_KEY` | [console.anthropic.com](https://console.anthropic.com) | Real AI responses |

> Without keys, the server returns realistic mock data for Plaid and a canned response for AI — everything still renders correctly.

#### Plaid Sandbox Test Credentials
When using sandbox mode, use these test credentials in the Plaid Link flow:
- **Username:** `user_good`
- **Password:** `pass_good`

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
| Finance | react-plaid-link | Server API proxy | plaid (Node SDK) |
| AI | SSE streaming | SSE streaming | @anthropic-ai/sdk (Opus 4.6) |

---

## Roadmap

- **Phase 1** ✅ Core UI Shell & Local Habit Tracking
- **Phase 2** ✅ Apple HealthKit Integration & Readiness Algorithm
- **Phase 3** ✅ Plaid Financial Sync & Savings Dashboard
- **Phase 4** ✅ AI-driven Coaching with Claude Opus 4.6
