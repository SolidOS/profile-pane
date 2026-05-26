export async function stripExifCanvas(file: File): Promise<File> {
  const type = file.type.toLowerCase()

  const needsExifRemoval =
    type === 'image/jpeg' ||
    type === 'image/jpg' ||
    type === 'image/webp'

  if (!needsExifRemoval) {
    return file
  }

  const bitmap: ImageBitmap = await createImageBitmap(file)

  const canvas: HTMLCanvasElement = document.createElement('canvas')
  canvas.width = bitmap.width
  canvas.height = bitmap.height

  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas 2D context unavailable')

  ctx.drawImage(bitmap, 0, 0)

  const blob: Blob = await new Promise((resolve, reject) => {
    canvas.toBlob(
      b => (b ? resolve(b) : reject('Failed to create Blob')),
      type,
      0.92
    )
  })

  return new File([blob], file.name, { type })
}
