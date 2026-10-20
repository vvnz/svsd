import type { ReactNode } from 'react'

import { ART_H, ART_W, FridgeArt } from './FridgeArt'
import type { FridgeStyle } from '../state/appState'
import type { Poem } from '../data/poems'
import { FitPoem } from './PoemCanvas'

// The favourites fridge: one of the five Figma "Fridges" (38:1598), 268px wide at scale 1
// (Figma "Fridge - Main" 38:1711). Pass `scale` to draw it bigger or smaller.
// Children and SLOTS use the Figma fridge frame's own 250 x 395 coordinates.
export const FRIDGE_W = 268
const K = FRIDGE_W / ART_W
export const FRIDGE_H = ART_H * K

export const FRIDGE_STYLES: FridgeStyle[] = ['white', 'yellow', 'blue', 'pink', 'steel']

export const STYLE_NAMES: Record<FridgeStyle, string> = {
  white: 'white',
  yellow: 'yellow',
  blue: 'blue',
  pink: 'pink mini fridge',
  steel: 'steel',
}

type Slot = { x: number; y: number; w: number; h: number }

// Where each of the 6 favourites sits, per fridge: on the doors, clear of handles, seams and vents.
const SLOTS_BY_STYLE: Record<FridgeStyle, readonly Slot[]> = {
  // top door (to y 199) and bottom door; handles on the left, x 20-37
  white: [
    { x: 104, y: 22, w: 136, h: 80 },
    { x: 47, y: 91, w: 97, h: 60 },
    { x: 119, y: 151, w: 119, h: 35 },
    { x: 47, y: 218, w: 97, h: 86 },
    { x: 142, y: 216, w: 97, h: 121 },
    { x: 47, y: 312, w: 97, h: 69 },
  ],
  // short top door (to y 142), tall bottom door from 159; handles bottom-left / top-left, x 34-93
  yellow: [
    { x: 110, y: 14, w: 126, h: 96 },
    { x: 16, y: 14, w: 86, h: 92 },
    { x: 110, y: 168, w: 126, h: 64 },
    { x: 16, y: 196, w: 86, h: 84 },
    { x: 110, y: 244, w: 126, h: 124 },
    { x: 16, y: 292, w: 86, h: 76 },
  ],
  // narrow (x 30-219): freezer to y 142, main door from 149; handles at y 124 / 160, vents from y 360
  blue: [
    { x: 40, y: 12, w: 80, h: 104 },
    { x: 128, y: 12, w: 80, h: 104 },
    { x: 40, y: 176, w: 80, h: 82 },
    { x: 128, y: 176, w: 80, h: 82 },
    { x: 40, y: 266, w: 80, h: 86 },
    { x: 128, y: 266, w: 80, h: 86 },
  ],
  // one door (x 17-232, y 47-348); handle on the left, x 42-96, y 163-188
  pink: [
    { x: 30, y: 60, w: 92, h: 92 },
    { x: 130, y: 60, w: 92, h: 92 },
    { x: 110, y: 160, w: 112, h: 56 },
    { x: 30, y: 200, w: 92, h: 66 },
    { x: 130, y: 226, w: 92, h: 112 },
    { x: 30, y: 276, w: 92, h: 62 },
  ],
  // two doors (handles at x 100-117 and 132-150, to y 267), bottom drawer from 271
  steel: [
    { x: 12, y: 14, w: 84, h: 116 },
    { x: 12, y: 140, w: 84, h: 116 },
    { x: 156, y: 14, w: 84, h: 116 },
    { x: 156, y: 140, w: 84, h: 116 },
    { x: 12, y: 280, w: 110, h: 96 },
    { x: 128, y: 280, w: 110, h: 96 },
  ],
}

export const slotsFor = (style: FridgeStyle) => SLOTS_BY_STYLE[style]

type Props = {
  style: FridgeStyle
  scale?: number
  /** drawn on the doors, in the fridge frame's 250 x 395 coordinates */
  children?: ReactNode
  /** skip the WebGPU textures (used for small thumbnails) */
  flat?: boolean
  className?: string
}

export function Fridge({ style, scale = 1, children, flat = false, className = '' }: Props) {
  return (
    <div className={`fridge ${className}`} style={{ width: FRIDGE_W * scale, height: FRIDGE_H * scale }}>
      <div className="fridge__inner" style={{ width: ART_W, height: ART_H, transform: `scale(${K * scale})` }}>
        <FridgeArt style={style} flat={flat} />
        <div className="fridge__content">{children}</div>
      </div>
    </div>
  )
}

// The pinned poems, each shrunk into its slot (words, stickers and photos), at about a third of their size,
// like the Figma fridge.
export const SLOT_SCALE = 0.36
// a spread-out poem gets tighter spacing rather than coming out smaller than this
export const SLOT_MIN_SCALE = 0.25

export function FridgeFavourites({
  style,
  favourites,
  poemFor,
}: {
  style: FridgeStyle
  favourites: (string | null)[]
  poemFor: (date: string) => Poem | undefined
}) {
  const slots = slotsFor(style)
  return (
    <>
      {favourites.map((date, i) => {
        const poem = date ? poemFor(date) : undefined
        const slot = slots[i]
        if (!poem || !slot) return null
        return <FitPoem key={date} poem={poem} box={slot} maxScale={SLOT_SCALE} minScale={SLOT_MIN_SCALE} />
      })}
    </>
  )
}
