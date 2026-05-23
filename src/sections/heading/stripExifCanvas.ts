/*!
 * EXIF Remover (Canvas-based)
 * MIT License
 */

export async function stripExifCanvas(file: File): Promise<File> {
  const type = file.type.toLowerCase();

  // Only JPEG and WebP may contain EXIF metadata
  const needsExifRemoval =
    type === "image/jpeg" ||
    type === "image/jpg" ||
    type === "image/webp";

  // If the format does not contain EXIF, return the original file unchanged
  if (!needsExifRemoval) {
    return file;
  }

  const bitmap: ImageBitmap = await createImageBitmap(file);

  const canvas: HTMLCanvasElement = document.createElement("canvas");
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D context unavailable");

  ctx.drawImage(bitmap, 0, 0);

  const blob: Blob = await new Promise((resolve, reject) => {
    canvas.toBlob(
      b => (b ? resolve(b) : reject("Failed to create Blob")),
      type, // preserve original MIME type
      0.92
    );
  });

  // Keep the original filename and MIME type
  return new File([blob], file.name, { type });
}
