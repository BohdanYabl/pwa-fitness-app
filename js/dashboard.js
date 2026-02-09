/**
 * Dashboard – progress stats (week/month/year), all workouts, add/edit modal
 */

import {
  initDB,
  addWorkout,
  updateWorkout,
  deleteWorkout,
  getWorkoutById,
} from "./db.js";
import {
  getPeriodStats,
  getLastWeight,
  getAllWorkoutsSorted,
} from "./stats.js";
import {
  formatDate,
  toDateInputValue,
  getActivityIcon,
  getActivityName,
  getMapTileUrl,
} from "./utils.js";

let currentPeriod = "week";
let currentLocation = null;
let editingWorkoutId = null;

const formSection = document.getElementById("workoutFormSection");
const formTitle = document.getElementById("workoutFormTitle");
const workoutIdInput = document.getElementById("workoutId");
const addBtn = document.getElementById("addWorkoutBtn");
const cancelBtn = document.getElementById("cancelWorkoutBtn");
const form = document.getElementById("workoutForm");
const getLocationBtn = document.getElementById("getLocationBtn");
const locationPreview = document.getElementById("locationPreview");
const locationMapLink = document.getElementById("locationMapLink");
const locationMapImg = document.getElementById("locationMapImg");
const locationStatus = document.getElementById("locationStatus");
const locationStatusEmpty = document.getElementById("locationStatusEmpty");
const submitBtn = document.getElementById("workoutSubmitBtn");

const pickOnMapBtn = document.getElementById("pickOnMapBtn");
const pickOnMapEditBtn = document.getElementById("pickOnMapEditBtn");
const mapPickerModal = document.getElementById("mapPickerModal");
const closeMapPickerBtn = document.getElementById("closeMapPickerBtn");
const mapPickerContainer = document.getElementById("mapPickerContainer");

const workoutModal = document.getElementById("workoutDetailModal");
const closeModalBtn = document.getElementById("closeWorkoutModal");
const workoutEditForm = document.getElementById("workoutEditForm");
const workoutEditIdInput = document.getElementById("workoutEditId");
const getLocationEditBtn = document.getElementById("getLocationEditBtn");
const locationEditPreview = document.getElementById("locationEditPreview");
const locationEditMapLink = document.getElementById("locationEditMapLink");
const locationEditMapImg = document.getElementById("locationEditMapImg");
const locationEditStatus = document.getElementById("locationEditStatus");
const locationEditStatusEmpty = document.getElementById(
  "locationEditStatusEmpty",
);

async function updateProgressStats() {
  try {
    const stats = await getPeriodStats(currentPeriod);
    const lastWeight = await getLastWeight();

    const workoutsEl = document.getElementById("statWorkouts");
    const minutesEl = document.getElementById("statMinutes");
    const weightEl = document.getElementById("lastWeight");

    if (workoutsEl) workoutsEl.textContent = stats.workouts;
    if (minutesEl) minutesEl.textContent = stats.minutes;
    if (weightEl) weightEl.textContent = lastWeight != null ? lastWeight : "—";
  } catch (error) {
    console.error("[dashboard] updateProgressStats", error);
  }
}

async function displayWorkouts() {
  const container = document.getElementById("workoutsList");
  try {
    const workouts = await getAllWorkoutsSorted();
    if (!container) return;
    if (workouts.length === 0) {
      container.innerHTML =
        '<p class="empty">No workouts yet. Add your first!</p>';
      return;
    }
    container.innerHTML = "";
    workouts.forEach((w) => {
      const item = document.createElement("div");
      item.className = "workout-item workout-item-clickable";
      item.dataset.workoutId = w?.id ?? 0;
      const icon = getActivityIcon(w?.type);
      const name = getActivityName(w?.type);
      const date = formatDate(w?.date ?? 0);
      const durationMin = Math.floor((w?.duration ?? 0) / 60);
      const durationText = durationMin ? `${durationMin} min` : "";
      const notes = (w?.notes ?? "").trim();
      const loc = w?.location;
      const hasCoords =
        loc && typeof loc.lat === "number" && typeof loc.lng === "number";
      const mapUrl = hasCoords
        ? `https://www.openstreetmap.org/?mlat=${loc.lat}&mlon=${loc.lng}&zoom=17`
        : "";
      const locText = hasCoords
        ? `${loc.lat.toFixed(5)}, ${loc.lng.toFixed(5)}`
        : loc
          ? "Location saved"
          : "";
      const locLine = locText
        ? mapUrl
          ? `<div class="workout-location">${locText} · <a href="${mapUrl}" target="_blank" rel="noopener" class="workout-map-link">Show on map</a></div>`
          : `<div class="workout-location">${locText}</div>`
        : "";
      const notesLine = notes
        ? `<div class="workout-notes">${notes}</div>`
        : "";

      item.innerHTML = `
        <div class="workout-info">
          <div class="workout-type">${icon} ${name}</div>
          <div class="workout-details">${durationText}</div>
          ${notesLine}
          ${locLine}
        </div>
        <div class="workout-item-right">
          <span class="workout-date">${date}</span>
          <button type="button" class="btn-icon-btn btn-delete" data-delete-id="${w?.id ?? 0}" aria-label="Delete">
            <svg class="icon icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>
          </button>
        </div>
      `;
      container.appendChild(item);

      item.addEventListener("click", (e) => {
        if (e.target.closest("[data-delete-id]")) return;
        const id = parseInt(item.dataset.workoutId, 10);
        if (!Number.isNaN(id)) openEditModal(id);
      });

      const delBtn = item.querySelector("[data-delete-id]");
      if (delBtn) {
        delBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          const id = parseInt(delBtn.dataset.deleteId, 10);
          if (Number.isNaN(id)) return;
          if (!confirm("Delete this workout?")) return;
          deleteWorkout(id).then(refresh).catch(console.error);
        });
      }
    });
  } catch (error) {
    console.error("[dashboard] displayWorkouts", error);
    if (container) container.innerHTML = '<p class="empty">Failed to load.</p>';
  }
}

function refresh() {
  updateProgressStats();
  displayWorkouts();
}

function showLocationUI(hasLocation) {
  if (locationPreview)
    locationPreview.style.display = hasLocation ? "block" : "none";
  if (locationStatusEmpty)
    locationStatusEmpty.style.display = hasLocation ? "none" : "block";
}

function showLocationEditUI(hasLocation) {
  if (locationEditPreview)
    locationEditPreview.style.display = hasLocation ? "block" : "none";
  if (locationEditStatusEmpty)
    locationEditStatusEmpty.style.display = hasLocation ? "none" : "block";
}

function openForm() {
  editingWorkoutId = null;
  if (workoutIdInput) workoutIdInput.value = "";
  if (formTitle) formTitle.textContent = "Add workout";
  if (submitBtn) submitBtn.textContent = "Save workout";
  currentLocation = null;
  showLocationUI(false);
  if (locationStatusEmpty)
    locationStatusEmpty.textContent = "No location saved";
  if (form) {
    form.reset();
    const dateInput = document.getElementById("workoutDate");
    if (dateInput) dateInput.value = new Date().toISOString().slice(0, 10);
  }
  if (formSection) formSection.style.display = "block";
}

function closeForm() {
  if (formSection) formSection.style.display = "none";
}

function closeWorkoutModal() {
  if (workoutModal) workoutModal.classList.remove("active");
}

async function openEditModal(id) {
  try {
    const w = await getWorkoutById(id);
    if (!w) return;
    editingWorkoutId = id;
    if (workoutEditIdInput) workoutEditIdInput.value = id;

    document.getElementById("workoutEditType").value = w.type ?? "running";
    document.getElementById("workoutEditDate").value = toDateInputValue(
      w.date ?? Date.now(),
    );
    document.getElementById("workoutEditDuration").value =
      Math.floor((w.duration ?? 0) / 60) || "";
    document.getElementById("workoutEditNotes").value = w.notes ?? "";

    currentLocation = w.location ?? null;
    if (
      currentLocation &&
      typeof currentLocation.lat === "number" &&
      typeof currentLocation.lng === "number"
    ) {
      showLocationEditUI(true);
      if (locationEditMapLink)
        locationEditMapLink.href = `https://www.openstreetmap.org/?mlat=${currentLocation.lat}&mlon=${currentLocation.lng}&zoom=17`;
      if (locationEditMapImg)
        locationEditMapImg.src = getMapTileUrl(
          currentLocation.lat,
          currentLocation.lng,
        );
      if (locationEditStatus)
        locationEditStatus.textContent = `${currentLocation.lat.toFixed(5)}, ${currentLocation.lng.toFixed(5)}`;
    } else {
      showLocationEditUI(false);
      if (locationEditStatusEmpty)
        locationEditStatusEmpty.textContent = "No location saved";
    }

    if (workoutModal) workoutModal.classList.add("active");
  } catch (error) {
    console.error("[dashboard] openEditModal", error);
  }
}

function updateLocationStatus(lat, lng) {
  showLocationUI(true);
  if (locationMapLink)
    locationMapLink.href = `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}&zoom=17`;
  if (locationMapImg) locationMapImg.src = getMapTileUrl(lat, lng);
  if (locationStatus)
    locationStatus.textContent = `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
}

function updateLocationEditStatus(lat, lng) {
  showLocationEditUI(true);
  if (locationEditMapLink)
    locationEditMapLink.href = `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}&zoom=17`;
  if (locationEditMapImg) locationEditMapImg.src = getMapTileUrl(lat, lng);
  if (locationEditStatus)
    locationEditStatus.textContent = `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
}

// Map picker (Leaflet) – choose location by tapping on map
let mapPickerInstance = null;
let mapPickerMarker = null;
const DEFAULT_CENTER = [50.45, 30.52];
const DEFAULT_ZOOM = 10;

function closeMapPicker() {
  if (mapPickerInstance) {
    try {
      mapPickerInstance.remove();
    } catch (_) {}
    mapPickerInstance = null;
    mapPickerMarker = null;
  }
  if (mapPickerContainer) mapPickerContainer.innerHTML = "";
  if (mapPickerModal) mapPickerModal.classList.remove("active");
}

function openMapPicker(isEditForm) {
  if (typeof window.L === "undefined") {
    alert("Map not loaded. Check your connection and try again.");
    return;
  }
  closeMapPicker();
  const center =
    currentLocation &&
    typeof currentLocation.lat === "number" &&
    typeof currentLocation.lng === "number"
      ? [currentLocation.lat, currentLocation.lng]
      : DEFAULT_CENTER;
  const zoom = currentLocation ? 15 : DEFAULT_ZOOM;

  if (mapPickerModal) mapPickerModal.classList.add("active");
  if (!mapPickerContainer) return;

  const initMap = () => {
    try {
      mapPickerInstance = window.L.map(mapPickerContainer, {
        tap: true,
      }).setView(center, zoom);
      window.L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap",
        maxZoom: 19,
      }).addTo(mapPickerInstance);

      if (currentLocation && typeof currentLocation.lat === "number") {
        mapPickerMarker = window.L.marker([
          currentLocation.lat,
          currentLocation.lng,
        ]).addTo(mapPickerInstance);
      }

      mapPickerInstance.on("click", (e) => {
        const { lat, lng } = e.latlng;
        currentLocation = { lat, lng };
        if (mapPickerMarker) mapPickerMarker.setLatLng([lat, lng]);
        else
          mapPickerMarker = window.L.marker([lat, lng]).addTo(
            mapPickerInstance,
          );

        if (isEditForm) updateLocationEditStatus(lat, lng);
        else updateLocationStatus(lat, lng);
        closeMapPicker();
      });

      mapPickerInstance.invalidateSize();
    } catch (err) {
      console.error("[map picker]", err);
      alert("Could not load map. Check your connection.");
    }
  };

  setTimeout(initMap, 150);
}

pickOnMapBtn?.addEventListener("click", () => openMapPicker(false));
pickOnMapEditBtn?.addEventListener("click", () => openMapPicker(true));
closeMapPickerBtn?.addEventListener("click", closeMapPicker);
mapPickerModal?.addEventListener("click", (e) => {
  if (e.target === mapPickerModal) closeMapPicker();
});

function requestLocation() {
  if (!navigator.geolocation) {
    alert("Geolocation is not supported.");
    return;
  }
  if (getLocationBtn) {
    getLocationBtn.disabled = true;
    getLocationBtn.textContent = "Getting...";
  }
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      currentLocation = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      updateLocationStatus(currentLocation.lat, currentLocation.lng);
      if (getLocationBtn) {
        getLocationBtn.disabled = false;
        getLocationBtn.innerHTML =
          '<span class="btn-icon"><svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg></span> GPS';
      }
    },
    () => {
      alert("Could not get location. Check permissions.");
      if (getLocationBtn) {
        getLocationBtn.disabled = false;
        getLocationBtn.innerHTML =
          '<span class="btn-icon"><svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg></span> GPS';
      }
    },
    { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
  );
}

function requestLocationEdit() {
  if (!navigator.geolocation) {
    alert("Geolocation is not supported.");
    return;
  }
  if (getLocationEditBtn) {
    getLocationEditBtn.disabled = true;
    getLocationEditBtn.textContent = "Getting...";
  }
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      currentLocation = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      updateLocationEditStatus(currentLocation.lat, currentLocation.lng);
      if (getLocationEditBtn) {
        getLocationEditBtn.disabled = false;
        getLocationEditBtn.innerHTML =
          '<span class="btn-icon"><svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg></span> GPS';
      }
    },
    () => {
      alert("Could not get location. Check permissions.");
      if (getLocationEditBtn) {
        getLocationEditBtn.disabled = false;
        getLocationEditBtn.innerHTML =
          '<span class="btn-icon"><svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg></span> GPS';
      }
    },
    { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
  );
}

async function submitWorkout(e) {
  e.preventDefault();
  const type = document.getElementById("workoutType")?.value ?? "running";
  const dateStr = document.getElementById("workoutDate")?.value;
  const durationMin = parseInt(
    document.getElementById("workoutDuration")?.value ?? "0",
    10,
  );
  const notes = document.getElementById("workoutNotes")?.value ?? "";

  if (!dateStr || Number.isNaN(durationMin) || durationMin < 1) {
    alert("Enter date and duration.");
    return;
  }

  const date = new Date(dateStr).getTime();
  const workout = {
    type,
    date,
    duration: durationMin * 60,
    notes,
    location: currentLocation
      ? { lat: currentLocation.lat, lng: currentLocation.lng }
      : undefined,
  };

  try {
    await initDB();
    if (editingWorkoutId) {
      await updateWorkout(editingWorkoutId, workout);
    } else {
      await addWorkout(workout);
    }
    closeForm();
    refresh();
  } catch (error) {
    console.error("[dashboard] submitWorkout", error);
    alert("Failed to save.");
  }
}

async function submitWorkoutEdit(e) {
  e.preventDefault();
  const type = document.getElementById("workoutEditType")?.value ?? "running";
  const dateStr = document.getElementById("workoutEditDate")?.value;
  const durationMin = parseInt(
    document.getElementById("workoutEditDuration")?.value ?? "0",
    10,
  );
  const notes = document.getElementById("workoutEditNotes")?.value ?? "";

  if (!dateStr || Number.isNaN(durationMin) || durationMin < 1) {
    alert("Enter date and duration.");
    return;
  }

  const date = new Date(dateStr).getTime();
  const workout = {
    type,
    date,
    duration: durationMin * 60,
    notes,
    location: currentLocation
      ? { lat: currentLocation.lat, lng: currentLocation.lng }
      : undefined,
  };

  try {
    await initDB();
    if (editingWorkoutId) {
      await updateWorkout(editingWorkoutId, workout);
    }
    closeWorkoutModal();
    refresh();
  } catch (error) {
    console.error("[dashboard] submitWorkoutEdit", error);
    alert("Failed to save.");
  }
}

// Period tabs
document.querySelectorAll(".period-tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    document
      .querySelectorAll(".period-tab")
      .forEach((t) => t.classList.remove("active"));
    tab.classList.add("active");
    currentPeriod = tab.dataset.period ?? "week";
    updateProgressStats();
  });
});

addBtn?.addEventListener("click", openForm);
cancelBtn?.addEventListener("click", closeForm);
getLocationBtn?.addEventListener("click", requestLocation);
form?.addEventListener("submit", submitWorkout);

closeModalBtn?.addEventListener("click", closeWorkoutModal);
workoutModal?.addEventListener("click", (e) => {
  if (e.target === workoutModal) closeWorkoutModal();
});
workoutEditForm?.addEventListener("submit", submitWorkoutEdit);
getLocationEditBtn?.addEventListener("click", requestLocationEdit);

async function init() {
  try {
    await initDB();
    await updateProgressStats();
    await displayWorkouts();
  } catch (error) {
    console.error("[dashboard] init", error);
  }
}
init();
