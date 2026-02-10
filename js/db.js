/**
 * IndexedDB – workouts, progress photos, profile (local storage)
 */

const DB_NAME = "FitnessTrackerDB";
const DB_VERSION = 2; // v2: added profile store

let db = null;

function logError(scope, error) {
  console.error(`[${new Date().toISOString()}] [db.js ${scope}]`, error);
}

export function initDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      db = event.target.result;

      // Workouts: date, type, duration, notes, location
      if (!db.objectStoreNames.contains("workouts")) {
        const store = db.createObjectStore("workouts", {
          keyPath: "id",
          autoIncrement: true,
        });
        store.createIndex("date", "date", { unique: false });
      }

      // Progress photos: image, date, weight, notes
      if (!db.objectStoreNames.contains("photos")) {
        const store = db.createObjectStore("photos", {
          keyPath: "id",
          autoIncrement: true,
        });
        store.createIndex("date", "date", { unique: false });
      }

      // Profile: name, height, goal weight
      if (!db.objectStoreNames.contains("profile")) {
        db.createObjectStore("profile", { keyPath: "id" });
      }

      console.log("[DB] Schema upgraded");
    };

    request.onsuccess = (event) => {
      db = event.target.result;
      resolve(db);
    };

    request.onerror = () => {
      logError("initDB", request.error);
      reject(request.error);
    };
  });
}

function getDb() {
  if (!db) throw new Error("Database not initialized");
  return db;
}

// === WORKOUTS ===
export function addWorkout(workout) {
  return new Promise((resolve, reject) => {
    const database = getDb();
    const tx = database.transaction(["workouts"], "readwrite");
    const store = tx.objectStore("workouts");
    const req = store.add(workout);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => {
      logError("addWorkout", req.error);
      reject(req.error);
    };
  });
}

export function getAllWorkouts() {
  return new Promise((resolve, reject) => {
    const database = getDb();
    const tx = database.transaction(["workouts"], "readonly");
    const store = tx.objectStore("workouts");
    const req = store.getAll();
    req.onsuccess = () => {
      const list = (req.result || []).sort((a, b) => (b?.date ?? 0) - (a?.date ?? 0));
      resolve(list);
    };
    req.onerror = () => {
      logError("getAllWorkouts", req.error);
      reject(req.error);
    };
  });
}

export function getWorkoutById(id) {
  return new Promise((resolve, reject) => {
    const database = getDb();
    const tx = database.transaction(["workouts"], "readonly");
    const store = tx.objectStore("workouts");
    const req = store.get(id);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export function updateWorkout(id, workout) {
  return new Promise((resolve, reject) => {
    const data = { ...workout, id };
    const database = getDb();
    const tx = database.transaction(["workouts"], "readwrite");
    const store = tx.objectStore("workouts");
    const req = store.put(data);
    req.onsuccess = () => resolve();
    req.onerror = () => {
      logError("updateWorkout", req.error);
      reject(req.error);
    };
  });
}

export function deleteWorkout(id) {
  return new Promise((resolve, reject) => {
    const database = getDb();
    const tx = database.transaction(["workouts"], "readwrite");
    const store = tx.objectStore("workouts");
    const req = store.delete(id);
    req.onsuccess = () => resolve();
    req.onerror = () => {
      logError("deleteWorkout", req.error);
      reject(req.error);
    };
  });
}

// === PHOTOS ===
export function addPhoto(photo) {
  return new Promise((resolve, reject) => {
    const database = getDb();
    const tx = database.transaction(["photos"], "readwrite");
    const store = tx.objectStore("photos");
    const req = store.add(photo);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => {
      logError("addPhoto", req.error);
      reject(req.error);
    };
  });
}

export function getAllPhotos() {
  return new Promise((resolve, reject) => {
    const database = getDb();
    const tx = database.transaction(["photos"], "readonly");
    const store = tx.objectStore("photos");
    const req = store.getAll();
    req.onsuccess = () => {
      const list = (req.result || []).sort((a, b) => (b?.date ?? 0) - (a?.date ?? 0));
      resolve(list);
    };
    req.onerror = () => {
      logError("getAllPhotos", req.error);
      reject(req.error);
    };
  });
}

export function getPhotoById(id) {
  return new Promise((resolve, reject) => {
    const database = getDb();
    const tx = database.transaction(["photos"], "readonly");
    const store = tx.objectStore("photos");
    const req = store.get(id);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export function updatePhoto(id, photo) {
  return new Promise((resolve, reject) => {
    const data = { ...photo, id };
    const database = getDb();
    const tx = database.transaction(["photos"], "readwrite");
    const store = tx.objectStore("photos");
    const req = store.put(data);
    req.onsuccess = () => resolve();
    req.onerror = () => {
      logError("updatePhoto", req.error);
      reject(req.error);
    };
  });
}

export function deletePhoto(id) {
  return new Promise((resolve, reject) => {
    const database = getDb();
    const tx = database.transaction(["photos"], "readwrite");
    const store = tx.objectStore("photos");
    const req = store.delete(id);
    req.onsuccess = () => resolve();
    req.onerror = () => {
      logError("deletePhoto", req.error);
      reject(req.error);
    };
  });
}

// === PROFILE ===
const PROFILE_ID = "user";

export function getProfile() {
  return new Promise((resolve, reject) => {
    const database = getDb();
    const tx = database.transaction(["profile"], "readonly");
    const store = tx.objectStore("profile");
    const req = store.get(PROFILE_ID);
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => {
      logError("getProfile", req.error);
      reject(req.error);
    };
  });
}

export function saveProfile(profile) {
  return new Promise((resolve, reject) => {
    const data = { id: PROFILE_ID, ...profile };
    const database = getDb();
    const tx = database.transaction(["profile"], "readwrite");
    const store = tx.objectStore("profile");
    const req = store.put(data);
    req.onsuccess = () => resolve();
    req.onerror = () => {
      logError("saveProfile", req.error);
      reject(req.error);
    };
  });
}
