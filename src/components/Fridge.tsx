import type { ReactNode } from 'react'

import { ShaderFill } from '../lib/custom-effect-runtime'
import { STEEL } from '../lib/shaders'
import type { FridgeStyle } from '../state/appState'
import type { Poem } from '../data/poems'
import { FitPoem } from './PoemCanvas'

// The favourites fridge, drawn after Figma "Fridge - Main" (38:1711).
// Laid out at 268 x 428; pass `scale` to draw it bigger or smaller.
export const FRIDGE_W = 268
export const FRIDGE_H = 428
const TOP_DOOR = { y: 0, h: 210 }
const BOTTOM_DOOR = { y: 218, h: 200 }

// Where each of the 6 favourites sits on the doors, in fridge coordinates
export const SLOTS = [
  { x: 112, y: 24, w: 146, h: 86 },
  { x: 50, y: 98, w: 104, h: 64 },
  { x: 128, y: 162, w: 128, h: 38 },
  { x: 50, y: 234, w: 104, h: 92 },
  { x: 152, y: 232, w: 104, h: 130 },
  { x: 50, y: 334, w: 104, h: 74 },
] as const

export const STYLE_NAMES: Record<FridgeStyle, string> = {
  graphite: 'graphite',
  steel: 'brushed steel',
  butter: 'butter yellow',
}

type Props = {
  style: FridgeStyle
  scale?: number
  /** drawn on the doors, in fridge coordinates */
  children?: ReactNode
  /** skip the WebGPU texture (used for small thumbnails) */
  flat?: boolean
  className?: string
}

export function Fridge({ style, scale = 1, children, flat = false, className = '' }: Props) {
  const steel = !flat && style !== 'butter'
  return (
    <div
      className={`fridge fridge--${style} ${className}`}
      style={{ width: FRIDGE_W * scale, height: FRIDGE_H * scale }}
    >
      <div className="fridge__inner" style={{ transform: `scale(${scale})` }}>
        <div className="fridge__strip" />
        {[TOP_DOOR, BOTTOM_DOOR].map((d, i) => (
          <div key={i} className={`fridge__door fridge__door--${i ? 'bottom' : 'top'}`} style={{ top: d.y, height: d.h }}>
            {steel && <ShaderFill className="fridge__steel" shader={STEEL} />}
          </div>
        ))}
        <div className="fridge__handle" style={{ top: 110, height: 98 }} />
        <div className="fridge__handle fridge__handle--low" style={{ top: 220, height: 104 }} />
        <div className="fridge__foot" style={{ left: 0 }} />
        <div className="fridge__foot" style={{ right: 0 }} />
        <div className="fridge__content">{children}</div>
      </div>
    </div>
  )
}

// The pinned poems, each shrunk into its slot. Only words show (photo days show their photo),
// at about a third of their size, like the Figma fridge.
export const SLOT_SCALE = 0.36

export function FridgeFavourites({
  favourites,
  poemFor,
}: {
  favourites: (string | null)[]
  poemFor: (date: string) => Poem | undefined
}) {
  return (
    <>
      {favourites.map((date, i) => {
        const poem = date ? poemFor(date) : undefined
        const slot = SLOTS[i]
        if (!poem || !slot) return null
        return <FitPoem key={date} poem={poem} box={slot} maxScale={SLOT_SCALE} wordsOnly />
      })}
    </>
  )
}
