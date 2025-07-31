# Boardify

[![Built with Next.js](https://img.shields.io/badge/built%20with-Next.js-black?logo=next.js)](https://nextjs.org) [![TypeScript](https://img.shields.io/badge/language-TypeScript-blue)]() [![React](https://img.shields.io/badge/framework-React-61DAFB?logo=react)]()

**Boardify** is a lightweight virtual whiteboard/card layout tool that lets users organize, pan, zoom, and persist draggable cards. It’s built with modern web practices for high performance, responsiveness, and resilience across devices and failure modes.

## Live Demo

https://jolly-plant-01ab0c410.2.azurestaticapps.net

## Why I Built It

I built Boardify to demonstrate how to combine a polished interactive UX (drag, touch, zoom, pan) with solid engineering practices: resilient loading, responsive design, unified input handling, and graceful recovery from deployment edge cases like stale service worker cache mismatches. It’s a showcase of both frontend craftsmanship and thoughtful system design.

## Features

### 🃏 Drag-and-Drop Cards (Mouse + Touch)

- Unified input handling for mouse and touch so dragging works seamlessly on desktop and mobile.
- Offset-aware dragging with viewport bounds enforcement to prevent cards from disappearing offscreen.
- Visual feedback during drag (scale, shadow, cursor).

### 🔍 Zoom & Pan

- **Zoom In / Zoom Out** buttons with real-time percentage display.
- **Ctrl/Cmd + Scroll** for zooming centered on cursor with smooth exponential scaling (clamped between 20% and 300%).
- **Alt + Scroll** to pan horizontally for quick navigation.
- **Reset Zoom** to restore default scale and position while preserving context.

### 📦 Persisted Layout

- Custom hook for loading `cards.json` with validation, merging with saved local positions, and debounced persistence to local storage.
- Cancellation-safe loading logic to avoid state updates after unmount.
- Loading and error UI with retry.

### 📱 Responsive & Mobile-Friendly Controls

- Layout controls pinned to the top-right but adaptively centered on narrow viewports.
- Wrapping and horizontally scrollable control toolbar to prevent overflow.
- Accessible touch targets and stacked layout for small screens.

### 🚨 Robust Asset/Version Recovery

- Global error detection for chunk load failures (e.g., stale service worker serving outdated hashed assets).
- User-facing banner: “New version available—please hard refresh” with **Hard Refresh** and **Dismiss** options.
- One-click recovery: unregisters service worker and reloads to fetch fresh build.

### 🧮 Domain Summary

- Badge-based summary of domains/categories to surface distribution of cards.

## Technology Stack

- **Framework:** Next.js (App Router, static prerendering)
- **Language:** TypeScript
- **UI:** React with memoized components for performance
- **Styling:** Tailwind CSS
- **Icons:** lucide-react
- **State & Data:** Custom React hooks, localStorage persistence
- **Input Handling:** Unified mouse/touch drag logic, nuanced zoom/pan math
- **Error Handling:** Global exception/rejection listeners, stale asset detection & recovery
- **Responsive Design:** Adaptive layout for desktop and mobile

## Architecture Highlights

- `useCardLayout` hook abstracts fetch/merge/persist logic, exposing card state and mutation handlers.
- Separation of presentational logic (`LayoutControls`, `ErrorView`, `LoadingView`, `DomainBadgeList`) with memoization to reduce re-renders.
- Transform layering isolates UI chrome from zoom/pan transforms so controls remain fixed while content scales.
- Resilience in initialization with cancellation guards to prevent invalid state updates during unmounts or slow network.
- Intelligent recovery from deployment cache mismatches via service worker unregistration and user prompt.

## Installation

Ensure public/cards.json exists. Example:

```json
[
  {
    "id": 1,
    "title": "Example Card",
    "description": "This is a sample card.",
    "domain": "Technology",
    "x": 100,
    "y": 150
  }
]
```

## Usage

• Drag cards with mouse or touch.
• Zoom with buttons or Ctrl/Cmd + scroll; pan horizontally with Alt + scroll.
• Reset zoom to default with the Reset button.
• If the app detects a stale chunk error, use the banner to hard refresh and recover.

## Developer Skills Demonstrated

• Front-End Engineering: React/Next.js composition, performance tuning, state management.
• TypeScript: Strong typing for props, state, and safe error propagation.
• Responsive Design: Mobile-first layout controls and adaptive behaviors.
• Input Abstraction: Unified handling for diverse input modalities (mouse, touch, keyboard modifiers).
• Transform Mathematics: Correct focus-preserving zoom/pan logic.
• Error Resilience: Global error/rejection capture with user-facing recovery flows.
• Progressive Enhancement: Awareness and mitigation of service worker cache/version issues.
• UX Consideration: Non-jarring state transitions, feedback UIs, and failure transparency.

## Potential Extensions

• Pinch-to-zoom and two-finger pan on touch devices.
• “Fit to view” / auto-layout helpers.
• Real-time collaborative syncing.
• Export board as image or shareable snapshot link.
• Undo/redo and board version history.

Contributing 1. Fork the repository 2. Create a feature branch: git checkout -b feature/your-feature 3. Commit your changes: git commit -m "Add feature" 4. Push to your branch: git push origin feature/your-feature 5. Open a pull request

## License

MIT
