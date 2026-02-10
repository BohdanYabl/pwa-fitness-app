/**
 * Profile – name, height, weights, birth date, gender, goal minutes, favorite activity. Saved locally (IndexedDB)
 */

import { initDB, getProfile, saveProfile } from "./db.js";

const form = document.getElementById("profileForm");
const nameEl = document.getElementById("profileName");
const heightEl = document.getElementById("profileHeight");
const currentWeightEl = document.getElementById("profileCurrentWeight");
const goalWeightEl = document.getElementById("profileGoalWeight");
const birthDateEl = document.getElementById("profileBirthDate");
const genderEl = document.getElementById("profileGender");
const goalMinutesEl = document.getElementById("profileGoalMinutes");
const favoriteActivityEl = document.getElementById("profileFavoriteActivity");

async function loadProfile() {
  try {
    const p = await getProfile();
    if (p) {
      if (nameEl) nameEl.value = p.name ?? "";
      if (heightEl) heightEl.value = p.height ?? "";
      if (currentWeightEl) currentWeightEl.value = p.currentWeight ?? "";
      if (goalWeightEl) goalWeightEl.value = p.goalWeight ?? "";
      if (birthDateEl) birthDateEl.value = p.birthDate ?? "";
      if (genderEl) genderEl.value = p.gender ?? "";
      if (goalMinutesEl) goalMinutesEl.value = p.goalMinutes ?? "";
      if (favoriteActivityEl) favoriteActivityEl.value = p.favoriteActivity ?? "";
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
    currentWeight: (currentWeightEl?.value ?? "").trim(),
    goalWeight: (goalWeightEl?.value ?? "").trim(),
    birthDate: (birthDateEl?.value ?? "").trim(),
    gender: (genderEl?.value ?? "").trim(),
    goalMinutes: (goalMinutesEl?.value ?? "").trim(),
    favoriteActivity: (favoriteActivityEl?.value ?? "").trim(),
  };
  try {
    await saveProfile(profile);
    alert("Profile saved.");
  } catch (error) {
    console.error("[profile] saveProfile", error);
    alert("Failed to save profile.");
  }
});

function initDatePicker() {
  if (typeof window.flatpickr === "undefined") return;
  const el = document.getElementById("profileBirthDate");
  if (el && !el._flatpickr) window.flatpickr(el, { locale: "en", dateFormat: "Y-m-d", allowInput: true });
}

async function init() {
  try {
    await initDB();
    await loadProfile();
    initDatePicker();
  } catch (error) {
    console.error("[profile] init", error);
  }
}
init();
