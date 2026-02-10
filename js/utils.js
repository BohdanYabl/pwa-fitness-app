/** Format date */
export function formatDate(timestamp) {
  try {
    const date = new Date(timestamp);
    if (Number.isNaN(date.getTime())) return "—";
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.toDateString() === today.toDateString()) return "Today";
    if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
    return `${date.getDate()}.${date.getMonth() + 1}.${date.getFullYear()}`;
  } catch {
    return "—";
  }
}

/** Format date for input[type=date] */
export function toDateInputValue(timestamp) {
  try {
    const d = new Date(timestamp);
    if (Number.isNaN(d.getTime())) return "";
    return d.toISOString().slice(0, 10);
  } catch {
    return "";
  }
}

export function getActivityIcon(type) {
  const map = {
    running: "🏃",
    cycling: "🚴",
    walking: "🚶",
    swimming: "🏊",
    gym: "🏋️",
    yoga: "🧘",
    hiking: "🥾",
    skating: "⛸️",
    rowing: "🚣",
    boxing: "🥊",
    dancing: "💃",
  };
  return map[type] || "🏃";
}

export function getActivityName(type) {
  const map = {
    running: "Running",
    cycling: "Cycling",
    walking: "Walking",
    swimming: "Swimming",
    gym: "Gym",
    yoga: "Yoga",
    hiking: "Hiking",
    skating: "Skating",
    rowing: "Rowing",
    boxing: "Boxing",
    dancing: "Dancing",
  };
  return map[type] || "Workout";
}

/** OSM tile URL for map preview at lat, lng (zoom 15) */
export function getMapTileUrl(lat, lng, zoom = 15) {
  const n = Math.pow(2, zoom);
  const x = Math.floor(((lng + 180) / 360) * n);
  const latRad = (lat * Math.PI) / 180;
  const y = Math.floor(
    ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * n,
  );
  const tx = Math.max(0, Math.min(x, n - 1));
  const ty = Math.max(0, Math.min(y, n - 1));
  return `https://tile.openstreetmap.org/${zoom}/${tx}/${ty}.png`;
}

export function compressImage(imageData, maxWidth = 800, quality = 0.7) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onerror = () => reject(new Error("Failed to load image"));
    img.onload = () => {
      const canvas = document.createElement("canvas");
      let { width, height } = img;
      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL("image/jpeg", quality));
    };
    img.src = imageData;
  });
}
