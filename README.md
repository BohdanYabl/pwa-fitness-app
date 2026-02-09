# Fitness Tracker – PWA

PWA for tracking workouts, progress photos and user profile. Works offline, uses geolocation and camera/gallery.

## Tech stack

- **HTML5, CSS3, JavaScript (ES modules)**
- **IndexedDB** – local storage (workouts, photos, profile)
- **Service Worker + Cache API** – offline support
- **Web App Manifest** – install to home screen

## Run

```bash
npx serve .
# Open http://localhost:3000 (HTTPS or localhost required)
```

## Structure

```
pwa/
├── index.html          # Home – progress stats, all workouts, add workout
├── progress.html       # Progress – add entry, all photo entries
├── profile.html        # Profile – name, height, goal weight
├── manifest.webmanifest
├── service-worker.js
├── css/
│   ├── main.css        # Base styles
│   ├── dashboard.css   # Home page
│   ├── progress.css    # Progress page
│   └── profile.css     # Profile page
├── js/
│   ├── app.js          # SW, offline status, DB init
│   ├── db.js           # IndexedDB (workouts, photos, profile)
│   ├── stats.js        # Period stats (week/month/year), last weight
│   ├── utils.js        # formatDate, compressImage, etc.
│   ├── dashboard.js    # Home logic
│   ├── progress.js     # Progress logic
│   └── profile.js      # Profile logic
└── images/icons/
```

## Views

### Home

- Progress stats: **Week** | **Month** | **Year** (workouts count, minutes, last weight)
- **All workouts** – list with edit (click) and delete
- **Add workout** button (modal)

### Progress

- Add entry: **Take photo** | **Choose from gallery**, date, weight (kg), notes
- **All entries** – list with edit (click) and delete

### Profile

- Name, height, goal weight, Save

## Native APIs (no keys required)

### Geolocation
- **GPS** – `navigator.geolocation.getCurrentPosition()` – current position
- **Choose on map** – Leaflet + OpenStreetMap – tap to select location (no API key)

### Camera
- **Take photo** – `navigator.mediaDevices.getUserMedia()` + Canvas – real camera capture
- **Choose from gallery** – `input type="file" accept="image/*"` – select from device

### Requirements
- HTTPS or localhost
- User permission for camera/geolocation
