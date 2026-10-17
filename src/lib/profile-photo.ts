/** Original phone photos can be larger than the saved profile picture. */
export const PROFILE_PHOTO_SOURCE_MAX_BYTES = 25 * 1024 * 1024;

/** Saved profile photos stay small enough to upload on a phone. */
export const PROFILE_PHOTO_SAVED_MAX_BYTES = 5 * 1024 * 1024;

/** Why a chosen file cannot be used, or null when it can be tried. */
export function profilePhotoSourceProblem(file: { type: string; size: number }): string | null {
  if (file.type && !file.type.startsWith("image/")) return "Please choose an image";
  if (file.size > PROFILE_PHOTO_SOURCE_MAX_BYTES) return "That photo is too large to open. Try one under 25 MB.";
  return null;
}

/** How a photo under the size limit is stored. Null means it must be made smaller first. */
export function profilePhotoPassThrough(file: { type: string; size: number }): { contentType: string; ext: string } | null {
  if (file.size > PROFILE_PHOTO_SAVED_MAX_BYTES) return null;
  if (file.type === "image/png") return { contentType: "image/png", ext: "png" };
  if (file.type === "image/webp") return { contentType: "image/webp", ext: "webp" };
  return { contentType: "image/jpeg", ext: "jpg" };
}

/** The file to store: the original when it is already small, otherwise a smaller JPEG of the whole photo. */
export async function profilePhotoToStore(file: File): Promise<{ body: Blob; contentType: string; ext: string } | null> {
  const asIs = profilePhotoPassThrough(file);
  if (asIs) return { body: file, ...asIs };
  const shrunk = await shrinkWholePhoto(file);
  if (!shrunk) return null;
  return { body: shrunk, contentType: "image/jpeg", ext: "jpg" };
}

function loadImage(file: File): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => { URL.revokeObjectURL(url); resolve(img.naturalWidth > 0 ? img : null); };
    img.onerror = () => { URL.revokeObjectURL(url); resolve(null); };
    img.src = url;
  });
}

function canvasJpeg(img: HTMLImageElement, width: number, height: number, quality: number): Promise<Blob | null> {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return Promise.resolve(null);
  ctx.drawImage(img, 0, 0, width, height);
  return new Promise((resolve) => canvas.toBlob((blob) => resolve(blob), "image/jpeg", quality));
}

async function shrinkWholePhoto(file: File): Promise<Blob | null> {
  const img = await loadImage(file);
  if (!img) return null;
  let longest = 1600;
  for (let attempt = 0; attempt < 6; attempt++) {
    const scale = Math.min(1, longest / Math.max(img.naturalWidth, img.naturalHeight));
    const width = Math.max(1, Math.round(img.naturalWidth * scale));
    const height = Math.max(1, Math.round(img.naturalHeight * scale));
    for (let quality = 0.85; quality >= 0.5; quality -= 0.15) {
      const blob = await canvasJpeg(img, width, height, quality);
      if (blob && blob.size <= PROFILE_PHOTO_SAVED_MAX_BYTES) return blob;
    }
    longest = Math.round(longest * 0.7);
  }
  return null;
}
