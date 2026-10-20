// The camera roll in the Images tab (Figma "coNnect", 46:1922 / 46:2278): 24 photos, cut from the
// Figma grid cells (79.5 × 113) at 2x. **Simulated**: nothing is read from the real photo library.
const files = import.meta.glob<string>('../assets/photos/photo-*.jpg', { eager: true, import: 'default' })

export const PHOTOS = Object.keys(files)
  .sort()
  .map((path) => ({ id: path.match(/photo-(\d+)/)![1]!, src: files[path]! }))

export type PhotoId = string

export const photoSrc = (id: PhotoId) => PHOTOS.find((p) => p.id === id)?.src ?? PHOTOS[0]!.src

// A photo magnet on the fridge is the same size as its grid cell (Figma "Frame 158", 58:4784)
export const PHOTO_W = 80
export const PHOTO_H = 113
