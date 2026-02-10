/**
 * Progress Photos – add entry (camera or gallery), view/edit on click
 */

import { initDB, addPhoto, updatePhoto, deletePhoto, getPhotoById, getAllPhotos } from "./db.js";
import { formatDate, toDateInputValue, compressImage } from "./utils.js";

let selectedImageData = null;
let editingPhotoId = null;

const photoInputGallery = document.getElementById("photoInputGallery");
const photoPreviewWrap = document.getElementById("photoPreviewWrap");
const photoPreview = document.getElementById("photoPreview");
const clearPhotoBtn = document.getElementById("clearPhotoBtn");
const progressForm = document.getElementById("progressForm");
const progressDate = document.getElementById("progressDate");
const progressWeight = document.getElementById("progressWeight");
const progressNotes = document.getElementById("progressNotes");
const saveProgressBtn = document.getElementById("saveProgressBtn");
const photoGrid = document.getElementById("photoGrid");

const photoDetailModal = document.getElementById("photoDetailModal");
const closePhotoModal = document.getElementById("closePhotoModal");
const photoEditForm = document.getElementById("photoEditForm");
const photoEditId = document.getElementById("photoEditId");
const photoEditPreview = document.getElementById("photoEditPreview");
const photoEditDate = document.getElementById("photoEditDate");
const photoEditWeight = document.getElementById("photoEditWeight");
const photoEditNotes = document.getElementById("photoEditNotes");

function setDefaultDate() {
  if (progressDate) progressDate.value = new Date().toISOString().slice(0, 10);
}

function handleFileSelect(file, isEditForm = false, capturedDataUrl = null) {
  let data = capturedDataUrl;
  if (!data && file && file.type?.startsWith("image/")) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => {
        applyImageData(reader.result, isEditForm);
        resolve();
      };
      reader.readAsDataURL(file);
    });
  }
  if (data) applyImageData(data, isEditForm);
}

function applyImageData(dataUrl, isEditForm) {
  selectedImageData = dataUrl;
  if (isEditForm && photoEditPreview) {
    photoEditPreview.innerHTML = `<img src="${dataUrl}" alt="Preview" />`;
  } else if (photoPreview) {
    photoPreview.src = dataUrl;
    if (photoPreviewWrap) photoPreviewWrap.style.display = "block";
    if (saveProgressBtn) saveProgressBtn.disabled = false;
  }
}

const photoEditInputGallery = document.getElementById("photoEditInputGallery");
const chooseGalleryBtn = document.getElementById("chooseGalleryBtn");
const chooseGalleryEditBtn = document.getElementById("chooseGalleryEditBtn");

chooseGalleryBtn?.addEventListener("click", () => photoInputGallery?.click());
chooseGalleryEditBtn?.addEventListener("click", () => photoEditInputGallery?.click());

photoInputGallery?.addEventListener("change", (e) => handleFileSelect(e.target?.files?.[0], false));

photoEditInputGallery?.addEventListener("change", (e) => {
  handleFileSelect(e.target?.files?.[0], true);
  e.target.value = "";
});

// Camera capture (getUserMedia) – real camera, not gallery
let cameraStream = null;
const cameraModal = document.getElementById("cameraModal");
const cameraVideo = document.getElementById("cameraVideo");
const cameraError = document.getElementById("cameraError");
const capturePhotoBtn = document.getElementById("capturePhotoBtn");
const closeCameraModalBtn = document.getElementById("closeCameraModal");
const takePhotoBtn = document.getElementById("takePhotoBtn");
const takePhotoEditBtn = document.getElementById("takePhotoEditBtn");

function stopCameraStream() {
  if (cameraStream) {
    cameraStream.getTracks().forEach((t) => t.stop());
    cameraStream = null;
  }
  if (cameraVideo) cameraVideo.srcObject = null;
}

function closeCameraModal() {
  stopCameraStream();
  if (cameraModal) cameraModal.classList.remove("active");
  if (cameraError) cameraError.style.display = "none";
}

let cameraCaptureCallback = null;

async function openCameraModal(isEditForm) {
  cameraCaptureCallback = (dataUrl) => {
    handleFileSelect(null, isEditForm, dataUrl);
  };
  if (cameraModal) cameraModal.classList.add("active");
  if (cameraError) cameraError.style.display = "none";
  if (capturePhotoBtn) capturePhotoBtn.disabled = true;

  try {
    cameraStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } },
      audio: false,
    });
    if (cameraVideo) {
      cameraVideo.srcObject = cameraStream;
      cameraVideo.style.display = "block";
      try {
        await cameraVideo.play();
      } catch (_) {}
    }
    if (capturePhotoBtn) capturePhotoBtn.disabled = false;
  } catch (err) {
    console.warn("[progress] Camera error:", err);
    if (cameraVideo) cameraVideo.style.display = "none";
    if (cameraError) {
      cameraError.style.display = "block";
      cameraError.querySelector("p").textContent =
        "Camera not available. Allow access or use \"Choose from gallery\" instead.";
    }
  }
}

function captureFromCamera() {
  if (!cameraVideo || !cameraVideo.srcObject || !cameraVideo.videoWidth) return;
  const canvas = document.createElement("canvas");
  canvas.width = cameraVideo.videoWidth;
  canvas.height = cameraVideo.videoHeight;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(cameraVideo, 0, 0);
  const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
  if (cameraCaptureCallback) cameraCaptureCallback(dataUrl);
  closeCameraModal();
}

takePhotoBtn?.addEventListener("click", () => openCameraModal(false));
takePhotoEditBtn?.addEventListener("click", () => openCameraModal(true));
closeCameraModalBtn?.addEventListener("click", closeCameraModal);
cameraModal?.addEventListener("click", (e) => {
  if (e.target === cameraModal) closeCameraModal();
});
capturePhotoBtn?.addEventListener("click", captureFromCamera);

clearPhotoBtn?.addEventListener("click", () => {
  selectedImageData = null;
  if (photoInputGallery) photoInputGallery.value = "";
  if (photoPreviewWrap) photoPreviewWrap.style.display = "none";
  if (photoPreview) photoPreview.src = "";
  if (saveProgressBtn) saveProgressBtn.disabled = true;
});

progressForm?.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!selectedImageData) {
    alert("Select a photo.");
    return;
  }
  const dateStr = progressDate?.value;
  const weight = parseFloat(progressWeight?.value);
  if (!dateStr || Number.isNaN(weight) || weight <= 0) {
    alert("Enter date and weight.");
    return;
  }
  try {
    const compressed = await compressImage(selectedImageData, 800, 0.7);
    await addPhoto({
      date: new Date(dateStr).getTime(),
      image: compressed,
      weight,
      notes: progressNotes?.value ?? "",
    });
    selectedImageData = null;
    if (photoInputGallery) photoInputGallery.value = "";
    if (photoPreviewWrap) photoPreviewWrap.style.display = "none";
    if (saveProgressBtn) saveProgressBtn.disabled = true;
    progressForm.reset();
    setDefaultDate();
    await displayPhotos();
  } catch (error) {
    console.error("[progress] submit", error);
    alert("Failed to save.");
  }
});

async function displayPhotos() {
  try {
    const photos = await getAllPhotos();
    if (!photoGrid) return;
    if (photos.length === 0) {
      photoGrid.innerHTML = '<p class="empty">No photos yet. Add your first entry!</p>';
      return;
    }
    photoGrid.innerHTML = "";
    photos.forEach((photo) => {
      const card = document.createElement("div");
      card.className = "photo-card photo-card-clickable";
      card.dataset.photoId = photo?.id ?? 0;
      const date = formatDate(photo.date);
      const weight = photo.weight ? `${photo.weight} kg` : "—";
      const id = photo?.id ?? 0;
      card.innerHTML = `
        <div class="photo-card-image-wrap">
          <img src="${photo.image}" alt="Progress" />
          <button type="button" class="btn-icon-btn photo-card-delete" data-delete-id="${id}" aria-label="Delete">
            <svg class="icon icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>
          </button>
        </div>
        <div class="photo-card-info">
          <div class="photo-weight">${weight}</div>
          <div class="photo-date">${date}</div>
        </div>
      `;
      photoGrid.appendChild(card);

      card.addEventListener("click", (e) => {
        if (e.target.closest("[data-delete-id]")) return;
        const photoId = parseInt(card.dataset.photoId, 10);
        if (!Number.isNaN(photoId)) openEditModal(photoId);
      });

      const delBtn = card.querySelector("[data-delete-id]");
      if (delBtn) {
        delBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          const photoId = parseInt(delBtn.dataset.deleteId, 10);
          if (Number.isNaN(photoId)) return;
          if (!confirm("Delete this photo?")) return;
          deletePhoto(photoId).then(displayPhotos).catch(console.error);
        });
      }
    });
  } catch (error) {
    console.error("[progress] displayPhotos", error);
    if (photoGrid) photoGrid.innerHTML = '<p class="empty">Failed to load.</p>';
  }
}

async function openEditModal(id) {
  try {
    const photo = await getPhotoById(id);
    if (!photo) return;
    editingPhotoId = id;
    selectedImageData = photo.image;

    if (photoEditId) photoEditId.value = id;
    if (photoEditPreview) photoEditPreview.innerHTML = `<img src="${photo.image}" alt="Preview" />`;
    if (photoEditDate) photoEditDate.value = toDateInputValue(photo.date);
    if (photoEditWeight) photoEditWeight.value = photo.weight ?? "";
    if (photoEditNotes) photoEditNotes.value = photo.notes ?? "";

    const photoEditInputGalleryEl = document.getElementById("photoEditInputGallery");
    if (photoEditInputGalleryEl) photoEditInputGalleryEl.value = "";

    if (photoDetailModal) photoDetailModal.classList.add("active");
  } catch (error) {
    console.error("[progress] openEditModal", error);
  }
}

function closeEditModal() {
  if (photoDetailModal) photoDetailModal.classList.remove("active");
  selectedImageData = null;
  editingPhotoId = null;
}

photoEditForm?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const id = parseInt(photoEditId?.value ?? "0", 10);
  const dateStr = photoEditDate?.value;
  const weight = parseFloat(photoEditWeight?.value);
  if (Number.isNaN(id) || !dateStr || Number.isNaN(weight) || weight <= 0) {
    alert("Enter date and weight.");
    return;
  }
  const existingPhoto = await getPhotoById(id);
  const imageToSave = selectedImageData || existingPhoto?.image;
  if (!imageToSave) {
    alert("Photo is required.");
    return;
  }
  try {
    const finalImage = selectedImageData
      ? await compressImage(selectedImageData, 800, 0.7)
      : existingPhoto.image;
    await updatePhoto(id, {
      date: new Date(dateStr).getTime(),
      image: finalImage,
      weight,
      notes: photoEditNotes?.value ?? "",
    });
    closeEditModal();
    await displayPhotos();
  } catch (error) {
    console.error("[progress] update", error);
    alert("Failed to save.");
  }
});

closePhotoModal?.addEventListener("click", closeEditModal);
photoDetailModal?.addEventListener("click", (e) => {
  if (e.target === photoDetailModal) closeEditModal();
});

function initDatePickers() {
  if (typeof window.flatpickr === "undefined") return;
  const opts = { dateFormat: "Y-m-d", allowInput: true };
  const p = document.getElementById("progressDate");
  const e = document.getElementById("photoEditDate");
  if (p && !p._flatpickr) window.flatpickr(p, opts);
  if (e && !e._flatpickr) window.flatpickr(e, opts);
}

async function init() {
  try {
    await initDB();
    setDefaultDate();
    await displayPhotos();
    initDatePickers();
  } catch (error) {
    console.error("[progress] init", error);
  }
}
init();
