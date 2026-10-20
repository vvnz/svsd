// Past poems for the demo, so the favourites fridge and calendar look lived-in.
// Today's poem is the real one the user makes (see useFridge). Everything else is seeded.
//
// Poems are laid out in "page" coordinates: a 402px wide phone screen with magnets at 22.6px
// text (the size used on the Figma "View Favourite" and calendar day screens).

import type { PhotoId } from './photos'
import type { StickerId } from './stickers'
import { todayKey } from '../state/useFridge'

export type PoemWord = { text: string; x: number; y: number; rotate?: number }
export type PoemSticker = { kind: StickerId; x: number; y: number; size: number; rotate?: number }
export type PoemPhoto = { x: number; y: number; width: number }
// a photo magnet from the Images tab, at its fridge size (PHOTO_W × PHOTO_H)
export type PoemPhotoMagnet = { id: PhotoId; x: number; y: number; rotate?: number; scale?: number }

export type Poem = {
  date: string // YYYY-MM-DD
  words: PoemWord[]
  fontSize: number // text size the coordinates were laid out at
  stickers?: PoemSticker[]
  photo?: PoemPhoto
  photoMagnets?: PoemPhotoMagnet[]
}

export const PAGE_FONT = 22.6

// Lines of words become magnets laid out left to right, with a little hand-placed wobble.
function lines(rows: { y: number; x: number; words: string[]; gap?: number }[]): PoemWord[] {
  const out: PoemWord[] = []
  for (const row of rows) {
    let x = row.x
    row.words.forEach((text, i) => {
      out.push({ text, x, y: row.y + ((i * 7) % 5) - 2, rotate: ((i * 13) % 7) / 3 - 1 })
      x += estimateWidth(text) + (row.gap ?? 4)
    })
  }
  return out
}

// Rough magnet width at page size, used for layout and for fitting poems into small spaces.
export function estimateWidth(text: string, fontSize = PAGE_FONT) {
  return Math.round(text.length * fontSize * 0.5 + fontSize * 1.35)
}
export const magnetHeight = (fontSize = PAGE_FONT) => Math.round(fontSize * 1.7)

// The four poems on the Figma favourites fridge, plus a few more for the calendar.
const DESIGNATHONS: Omit<Poem, 'date'> = {
  fontSize: PAGE_FONT,
  // positions straight from the Figma "View Favourite" frame
  words: [
    { text: 'design', x: 107, y: 205 },
    { text: 'athons', x: 236, y: 205 },
    { text: 'we', x: 77, y: 259 },
    { text: 'think', x: 134, y: 259 },
    { text: 'we', x: 241, y: 259 },
    { text: 'play', x: 299, y: 259 },
    { text: 'iterate', x: 30, y: 306 },
    { text: 'iterate', x: 180, y: 306 },
    { text: '.', x: 267, y: 306 },
    { text: 'iterate', x: 239, y: 389 },
    { text: '.', x: 327, y: 389 },
  ],
  photo: { x: 134, y: 506, width: 213 },
  stickers: [{ kind: 'apple', x: 228, y: 474, size: 64, rotate: -16 }],
}

const SUMMER: Omit<Poem, 'date'> = {
  fontSize: PAGE_FONT,
  words: lines([
    { y: 240, x: 70, words: ['on'] },
    { y: 288, x: 40, words: ['summer', 'days'] },
    { y: 336, x: 150, words: ['i'] },
    { y: 368, x: 190, words: ['sweat'] },
  ]),
  stickers: [{ kind: 'smiley', x: 250, y: 200, size: 86, rotate: 8 }],
}

const HELLO: Omit<Poem, 'date'> = {
  fontSize: PAGE_FONT,
  words: lines([{ y: 300, x: 40, words: ['i', 'hello', 'you'] }, { y: 300, x: 290, words: ['bye'] }]),
}

const THOU: Omit<Poem, 'date'> = {
  fontSize: PAGE_FONT,
  words: lines([
    { y: 220, x: 70, words: ['thou', 'leaf'] },
    { y: 290, x: 40, words: ['home', 'sway'] },
    { y: 334, x: 150, words: ['sway'] },
    { y: 390, x: 110, words: ['fall'] },
  ]),
}

const MORE: Omit<Poem, 'date'>[] = [
  { fontSize: PAGE_FONT, words: lines([{ y: 260, x: 50, words: ['the', 'moon', 'is'] }, { y: 310, x: 120, words: ['golden'] }]) },
  { fontSize: PAGE_FONT, words: lines([{ y: 240, x: 60, words: ['salt', 'and'] }, { y: 300, x: 150, words: ['dusk'] }]) },
  { fontSize: PAGE_FONT, words: lines([{ y: 230, x: 40, words: ['we', 'drift'] }, { y: 290, x: 120, words: ['hollow', 'and'] }, { y: 340, x: 180, words: ['tender'] }]) },
  { fontSize: PAGE_FONT, words: lines([{ y: 280, x: 60, words: ['my', 'velvet'] }, { y: 330, x: 160, words: ['3am'] }]), stickers: [{ kind: 'smiley', x: 60, y: 160, size: 80, rotate: -10 }] },
  { fontSize: PAGE_FONT, words: lines([{ y: 250, x: 80, words: ['wild', 'bloom'] }, { y: 310, x: 40, words: ['in', 'the', 'hush'] }]) },
  { fontSize: PAGE_FONT, words: lines([{ y: 270, x: 70, words: ['dumplings'] }, { y: 320, x: 150, words: ['and', 'you'] }]), stickers: [{ kind: 'apple', x: 250, y: 190, size: 62, rotate: 12 }] },
  { fontSize: PAGE_FONT, words: lines([{ y: 260, x: 100, words: ['still'] }, { y: 310, x: 60, words: ['i', 'wander'] }]) },
  { fontSize: PAGE_FONT, words: lines([{ y: 240, x: 50, words: ['ache', 'of', 'the'] }, { y: 300, x: 140, words: ['midterm'] }]) },
]

// Which days have a poem. Gaps on purpose, so the calendar reads like a real habit.
function seedDates(): string[] {
  const days: string[] = []
  const add = (m: number, from: number, to: number) => {
    for (let d = from; d <= to; d++) days.push(`2026-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`)
  }
  add(9, 1, 13)
  add(9, 15, 23)
  add(10, 1, 8)
  add(10, 11, 17)
  return days
}

// Fixed poems for the days the favourites fridge points at; the rest cycle through MORE.
const PINNED: Record<string, Omit<Poem, 'date'>> = {
  '2026-10-05': DESIGNATHONS,
  '2026-09-12': SUMMER,
  '2026-09-20': HELLO,
  '2026-10-02': THOU,
  // a photo day: just a picture from that night and a sticker, no words
  '2026-09-05': {
    fontSize: PAGE_FONT,
    words: [],
    photo: { x: 94, y: 250, width: 213 },
    stickers: [{ kind: 'apple', x: 190, y: 220, size: 64, rotate: -16 }],
  },
}

export const SEEDED_POEMS: Poem[] = seedDates()
  .filter((date) => date < todayKey())
  .map((date, i) => ({ date, ...(PINNED[date] ?? MORE[i % MORE.length]!) }))

export const DEFAULT_FAVOURITES: (string | null)[] = ['2026-10-05', '2026-09-12', '2026-09-20', '2026-10-02', '2026-09-05', null]
