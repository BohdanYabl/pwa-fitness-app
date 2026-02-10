/**
 * Stats – period stats (week/month/year), last weight, workout list
 */

import { getAllWorkouts, getAllPhotos } from "./db.js";

function getPeriodBounds(period) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (period === "week") {
    const dayOfWeek = today.getDay();
    const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const monday = new Date(today);
    monday.setDate(today.getDate() - diff);
    const start = monday.getTime();
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);
    return { start, end: sunday.getTime() };
  }
  if (period === "month") {
    const start = new Date(today.getFullYear(), today.getMonth(), 1).getTime();
    const end = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999).getTime();
    return { start, end };
  }
  if (period === "year") {
    const start = new Date(today.getFullYear(), 0, 1).getTime();
    const end = new Date(today.getFullYear(), 11, 31, 23, 59, 59, 999).getTime();
    return { start, end };
  }
  return getPeriodBounds("week");
}

export async function getPeriodStats(period = "week") {
  try {
    const workouts = await getAllWorkouts();
    const { start, end } = getPeriodBounds(period);

    const filtered = (workouts || []).filter((w) => {
      const d = Number(w?.date) || 0;
      if (!d) return false;
      return d >= start && d <= end;
    });
    let totalMinutes = 0;
    filtered.forEach((w) => {
      const dur = Number(w?.duration) || 0;
      totalMinutes += Math.floor(dur / 60);
    });

    return {
      workouts: filtered.length,
      minutes: totalMinutes,
    };
  } catch (error) {
    console.error("[stats] getPeriodStats", error);
    throw error;
  }
}

export async function getLastWeight() {
  try {
    const photos = await getAllPhotos();
    const withWeight = (photos || []).filter(
      (p) => p?.weight != null && !Number.isNaN(parseFloat(String(p.weight)))
    );
    if (withWeight.length === 0) return null;
    return parseFloat(String(withWeight[0].weight));
  } catch (error) {
    console.error("[stats] getLastWeight", error);
    return null;
  }
}

export async function getAllWorkoutsSorted() {
  try {
    const workouts = await getAllWorkouts();
    return workouts || [];
  } catch (error) {
    console.error("[stats] getAllWorkoutsSorted", error);
    throw error;
  }
}
