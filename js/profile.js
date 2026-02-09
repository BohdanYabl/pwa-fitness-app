/**
 * Profile – name, height, goal weight. Saved locally (IndexedDB)
 */

import { initDB, getProfile, saveProfile } from "./db.js";

const form = document.getElementById("profileForm");
const nameEl = document.getElementById("profileName");
const heightEl = document.getElementById("profileHeight");
const goalWeightEl = document.getElementById("profileGoalWeight");

async function loadProfile() {
  try {
    const p = await getProfile();
    if (p) {
      if (nameEl) nameEl.value = p.name ?? "";
      if (heightEl) heightEl.value = p.height ?? "";
      if (goalWeightEl) goalWeightEl.value = p.goalWeight ?? "";
    }
  } catch (error) {
    console.error("[profile] loadProfile", error);
  }
}

form?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const profile = {
    name: (nameEl?.value ?? "").trim(),
    height: (heightEl?.value ?? "").trim(),
    goalWeight: (goalWeightEl?.value ?? "").trim(),
  };
  try {
    await saveProfile(profile);
    alert("Profile saved.");
  } catch (error) {
    console.error("[profile] saveProfile", error);
    alert("Failed to save profile.");
  }
});

async function init() {
  try {
    await initDB();
    await loadProfile();
  } catch (error) {
    console.error("[profile] init", error);
  }
}
init();
