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

> **Windows users:** Xcode is Mac-only, so iOS Simulator is not available. Use a physical iPhone with the Expo Go app instead — it works on any OS.

### Prerequisites
- Node.js 18+
- **Expo Go** app installed on your iPhone (free on the App Store)
- Your iPhone and Windows PC on the **same Wi-Fi network**

### Setup & Start

```bash
cd mobile
npm install
npx expo start
```

This opens the Expo developer tools in your terminal and displays a QR code.

**To open on your iPhone:**
1. Open the Camera app and point it at the QR code
2. Tap the banner that appears — this launches the app in Expo Go

> If the QR code doesn't connect, try pressing `w` in the terminal to switch to tunnel mode (`npx expo start --tunnel`), which works even if your PC and phone are on different networks.

### Face ID

Face ID works on a real iPhone automatically. The app will prompt for Face ID on the auth screen. If your device doesn't support Face ID, tap **"Continue without biometric"** to proceed.

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
