/** Original phone photos can be larger than the saved profile picture. */
export const PROFILE_PHOTO_SOURCE_MAX_BYTES = 25 * 1024 * 1024;

/** Why a chosen file cannot open in the crop, or null when it can be tried. */
export function profilePhotoSourceProblem(file: { type: string; size: number }): string | null {
  if (file.type && !file.type.startsWith("image/")) return "Please choose an image";
  if (file.size > PROFILE_PHOTO_SOURCE_MAX_BYTES) return "That photo is too large to open. Try one under 25 MB.";
  return null;
}
