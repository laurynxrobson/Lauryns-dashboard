# Lauryn's Dashboard

A high-security, unified personal dashboard for habits, finances, and fitness. Notion-inspired UI built with React (web) and React Native / Expo (iOS).

---

## Features (Phase 1)

- **Habit tracking** — Create, delete, and drag-to-reorder habit blocks
- **GitHub-style heatmaps** — 365-day contribution graph per habit
- **Streak engine** — Current and longest streak calculation
- **Slash commands** — Press `/` to add habits or trigger actions
- **Auth shell** — OAuth 2.0 + JWT structure with Face ID placeholder
- **Local persistence** — All data stored in localStorage (web) / AsyncStorage (iOS)

---

## Project Structure

```
Lauryns-dashboard-/
├── web/      # React + Vite + Tailwind CSS
└── mobile/   # React Native + Expo
```

---

## Running the Web App

### Prerequisites
- Node.js 18+
- npm 9+

### Setup & Start

```bash
cd web
npm install
npm run dev
```

The app will be available at **http://localhost:5173**.

### Production Build

```bash
cd web
npm run build       # outputs to web/dist/
npm run preview     # serve the production build locally
```

---

## Running the iOS App

### Prerequisites
- Node.js 18+
- [Expo CLI](https://docs.expo.dev/get-started/installation/) — `npm install -g expo-cli`
- **Expo Go** app installed on your iPhone (download from the App Store)
- Or Xcode 15+ with an iOS Simulator configured

### Setup & Start

```bash
cd mobile
npm install
npx expo start
```

This opens the Expo developer tools in your terminal. Then:

- **On a physical iPhone** — scan the QR code with the Camera app or Expo Go
- **On iOS Simulator** — press `i` in the terminal (requires Xcode)

### Face ID (Simulator)

To test the Face ID prompt in the iOS Simulator:

1. Open **Features → Face ID → Enrolled** in the Simulator menu
2. Use **Features → Face ID → Matching Face** to approve the prompt

---

## Tech Stack

| Layer | Web | iOS |
|---|---|---|
| Framework | React 18 + Vite | React Native 0.74 + Expo 51 |
| Styling | Tailwind CSS | NativeWind |
| State | Zustand + localStorage | Zustand + AsyncStorage |
| Drag & Drop | @dnd-kit/core | — |
| Navigation | React Router v6 | React Navigation v6 |
| Auth (Phase 1) | Mock OAuth shell | expo-local-authentication |

---

## Roadmap

- **Phase 1** ✅ Core UI Shell & Local Habit Tracking
- **Phase 2** Apple HealthKit Integration & Readiness Algorithm
- **Phase 3** Plaid Financial Sync & Savings Dashboard
- **Phase 4** AI-driven Workout Recommendations
