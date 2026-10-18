import type { CSSProperties } from 'react'

import { estimateWidth, magnetHeight, type Poem } from '../data/poems'
import apple from '../assets/stickers/apple.svg'
import smiley from '../assets/stickers/smiley.svg'
import photoDinner from '../assets/images/photo-dinner.png'

const STICKERS = { apple, smiley }
const PHOTO_RATIO = 268 / 214 // the exported photo, already tilted

type Box = { x: number; y: number; w: number; h: number }

// Everything on a poem, laid out in page coordinates (a 402 wide phone screen).
export function poemBounds(poem: Poem, wordsOnly = false): Box | null {
  const boxes: Box[] = poem.words.map((w) => ({
    x: w.x,
    y: w.y,
    w: estimateWidth(w.text, poem.fontSize),
    h: magnetHeight(poem.fontSize),
  }))
  if (!wordsOnly || boxes.length === 0) {
    if (poem.photo) boxes.push({ x: poem.photo.x, y: poem.photo.y, w: poem.photo.width, h: poem.photo.width * PHOTO_RATIO })
    for (const s of poem.stickers ?? []) boxes.push({ x: s.x, y: s.y, w: s.size, h: s.size })
  }
  if (boxes.length === 0) return null
  const x = Math.min(...boxes.map((b) => b.x))
  const y = Math.min(...boxes.map((b) => b.y))
  return {
    x,
    y,
    w: Math.max(...boxes.map((b) => b.x + b.w)) - x,
    h: Math.max(...boxes.map((b) => b.y + b.h)) - y,
  }
}

type Props = {
  poem: Poem
  /** on the favourites fridge only the words show (photo days still show their photo) */
  wordsOnly?: boolean
  className?: string
  style?: CSSProperties
}

// A poem drawn at its saved positions. Magnet padding scales with the text size,
// using the same proportions as the word bank magnets in Figma (12 / 16 / 2 at 24px).
export function PoemCanvas({ poem, wordsOnly = false, className = '', style }: Props) {
  const fs = poem.fontSize
  const showExtras = !wordsOnly || poem.words.length === 0
  return (
    <div className={`poem-canvas ${className}`} style={style}>
      {showExtras && poem.photo && (
        <img
          className="poem-canvas__photo"
          src={photoDinner}
          alt=""
          draggable={false}
          style={{ left: poem.photo.x, top: poem.photo.y, width: poem.photo.width }}
        />
      )}
      {poem.words.map((w, i) => (
        <div
          key={i}
          className="magnet poem-canvas__word"
          style={{
            left: w.x,
            top: w.y,
            padding: `${fs * 0.5}px ${fs * 0.66}px ${fs * 0.08}px`,
            transform: `rotate(${w.rotate ?? 0}deg)`,
          }}
        >
          <span className="magnet__text" style={{ fontSize: fs }}>
            {w.text}
          </span>
        </div>
      ))}
      {showExtras &&
        poem.stickers?.map((s, i) => (
          <img
            key={i}
            className="poem-canvas__sticker"
            src={STICKERS[s.kind]}
            alt=""
            draggable={false}
            style={{ left: s.x, top: s.y, width: s.size, height: s.size, transform: `rotate(${s.rotate ?? 0}deg)` }}
          />
        ))}
    </div>
  )
}

// Where a poem ends up once fitted into a box (for placing badges next to it)
export function fittedRect(poem: Poem, box: Box, maxScale = 1, wordsOnly = false): Box | null {
  const b = poemBounds(poem, wordsOnly)
  if (!b) return null
  const scale = Math.min(maxScale, box.w / b.w, box.h / b.h)
  const w = b.w * scale
  const h = b.h * scale
  return { x: box.x + (box.w - w) / 2, y: box.y + (box.h - h) / 2, w, h }
}

// A poem shrunk to fit a box, centered. Used for fridge slots, share cards and the day view.
export function FitPoem({
  poem,
  box,
  maxScale = 1,
  wordsOnly = false,
  align = 'center',
}: {
  poem: Poem
  box: Box
  maxScale?: number
  wordsOnly?: boolean
  align?: 'center' | 'top'
}) {
  const b = poemBounds(poem, wordsOnly)
  if (!b) return null
  const scale = Math.min(maxScale, box.w / b.w, box.h / b.h)
  const left = box.x + (box.w - b.w * scale) / 2 - b.x * scale
  const top = (align === 'top' ? box.y : box.y + (box.h - b.h * scale) / 2) - b.y * scale
  return (
    <PoemCanvas
      poem={poem}
      wordsOnly={wordsOnly}
      style={{ transform: `translate(${left}px, ${top}px) scale(${scale})` }}
    />
  )
}
