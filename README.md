# Fitness Tracker – PWA

Progressive Web App for tracking workouts, progress photos and user profile. Works offline. Installable on home screen.

**Live (HTTPS):** [fitness-tracker-notes.netlify.app](https://fitness-tracker-notes.netlify.app)

---

## Technologies

- **HTML5, CSS3, JavaScript (ES modules)** – no frameworks
- **IndexedDB** – local storage (workouts, photos, profile)
- **Service Worker + Cache API** – offline
- **Web App Manifest** – name, icons, theme_color, start_url → install to home screen

---

## Run locally

**Dependencies:** none (or any static server).

- **Live Server** (VS Code / Cursor): right-click `index.html` → “Open with Live Server”.
- **CLI:** `npx serve .` then open http://localhost:3000.

HTTPS or localhost is required for PWA (Service Worker, geolocation, camera).

---

## Native device features (2+)

1. **Geolocation** – workout location: GPS via `navigator.geolocation.getCurrentPosition()`; or “Choose on map” (Leaflet + OpenStreetMap, tap to set point). No API key.
2. **Camera / media** – progress photos: take photo via `navigator.mediaDevices.getUserMedia()` + Canvas, or choose from gallery with `input type="file" accept="image/*"`.

User must grant camera and location permission; app works over HTTPS or localhost.

---

## Offline

- **Service Worker** registers and caches app shell (HTML, CSS, JS, manifest, icons, Leaflet).
- **Cache API** – navigation: Network First, fallback to cache, then offline fallback to `index.html`; static assets: Cache First, then network.
- **Banner** “No connection. App works offline.” when `navigator.onLine === false`. Data in IndexedDB, so workouts, photos and profile are available offline.

---

## Views (3) and flow

| View | Purpose | Flow |
|------|--------|------|
| **Home** | Stats (Week / Month / Year: workouts, minutes, last weight), list of workouts, add/edit/delete | Bottom nav → Home, Progress, Profile |
| **Progress** | Add progress entry (photo + date + weight + notes), list of entries, edit/delete | Same nav |
| **Profile** | Name, height, current/goal weight, birth date, gender, goal min/week, favorite activity | Same nav |

Transitions: bottom navigation; each view has a clear role.

---

## Hosting

App is deployed on **Netlify** with HTTPS: [fitness-tracker-notes.netlify.app](https://fitness-tracker-notes.netlify.app). Build: publish directory `.`, no build command (static site).

---

## Responsiveness

Viewport meta on all pages; CSS media queries (`main.css`, `dashboard.css`, `progress.css`) for 640px, 768px, 1024px. Layout adapts to different screen sizes.

---

## Performance and caching

- Static assets and pages cached by Service Worker; no heavy runtime. Images compressed before save (`utils.js`). Lighthouse recommended for metrics.
- **Caching strategy (Service Worker):** navigation requests → Network First, then cache, then offline fallback; other requests → Cache First, then network. Different strategies for HTML vs static resources.

---

## Code quality and documentation

- **Structure:** separate JS modules (app, db, stats, utils, dashboard, progress, profile); single IndexedDB layer; error handling and logging where needed.
- **Comments:** file-level and key logic commented (e.g. Service Worker, db schema, native API usage).
- **README:** run instructions, dependencies, technologies and features described above.

---

## Project structure

```
├── index.html           # Home
├── progress.html        # Progress photos
├── profile.html         # Profile
├── manifest.webmanifest
├── service-worker.js
├── css/                 # main, dashboard, progress, profile
├── js/                  # app, db, stats, utils, dashboard, progress, profile
└── images/icons/
```
