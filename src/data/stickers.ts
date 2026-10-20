import apple from '../assets/stickers/sticker-apple.svg'
import button from '../assets/stickers/sticker-button.svg'
import cloud from '../assets/stickers/sticker-cloud.svg'
import message from '../assets/stickers/sticker-message.svg'
import polkadot from '../assets/stickers/sticker-polkadot.svg'
import smiley from '../assets/stickers/sticker-smiley.svg'
import star from '../assets/stickers/sticker-star.svg'

// The sticker magnets from Figma ("Magnet" variants, 51:1512 and on), in the drawer's order
// (Poem - Add Stickers, 46:1683): smiley, button / apple, star, message / polkadot, cloud.
export const STICKERS = [
  { id: 'smiley', label: 'smiley', src: smiley },
  { id: 'button', label: 'button', src: button },
  { id: 'apple', label: 'apple', src: apple },
  { id: 'star', label: 'star', src: star },
  { id: 'message', label: 'speech bubble', src: message },
  { id: 'polkadot', label: 'polka dot', src: polkadot },
  { id: 'cloud', label: 'cloud', src: cloud },
] as const

export type BuiltInStickerId = (typeof STICKERS)[number]['id']
/** a built-in sticker, or one you made (`custom-…`, saved on this device) */
export type StickerId = BuiltInStickerId | `custom-${string}`

// A transparent pixel, for a made sticker that's no longer saved on this device
const MISSING = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'

export const stickerSrc = (id: StickerId) =>
  STICKERS.find((s) => s.id === id)?.src ?? customStickers().find((s) => s.id === id)?.src ?? MISSING

// ---- stickers you made (the "+" tile), saved in localStorage as PNG data URLs ----

// A deleted one stays saved (hidden from the drawer), so copies already on a fridge or in a poem keep their picture
export type CustomSticker = { id: `custom-${string}`; src: string; deleted?: boolean }
const KEY = 'svsd:stickers'
let cache: CustomSticker[] | null = null
const listeners = new Set<() => void>()

export function customStickers(): CustomSticker[] {
  if (cache) return cache
  try {
    cache = JSON.parse(localStorage.getItem(KEY) ?? '[]') as CustomSticker[]
  } catch {
    cache = []
  }
  return cache
}

/** saves a made sticker (newest first) and returns its id */
export function addCustomSticker(src: string): CustomSticker['id'] {
  const id = `custom-${Date.now().toString(36)}` as const
  cache = [{ id, src }, ...customStickers()]
  try {
    localStorage.setItem(KEY, JSON.stringify(cache))
  } catch {
    // storage full: it still works until the app is reloaded
  }
  listeners.forEach((l) => l())
  return id
}

/** takes a made sticker out of the drawer; magnets already placed keep showing it */
export function deleteCustomSticker(id: CustomSticker['id']) {
  cache = customStickers().map((s) => (s.id === id ? { ...s, deleted: true } : s))
  try {
    localStorage.setItem(KEY, JSON.stringify(cache))
  } catch {
    // ignore
  }
  listeners.forEach((l) => l())
}

export function subscribeCustomStickers(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

// How big a sticker is on the fridge (it's 77px in the drawer)
export const STICKER_SIZE = 64
