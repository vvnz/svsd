import type { CSSProperties } from 'react'

import { estimateWidth, magnetHeight, type Poem } from '../data/poems'
import { PHOTO_H, PHOTO_W, photoSrc } from '../data/photos'
import { stickerSrc } from '../data/stickers'
import photoDinner from '../assets/images/photo-dinner.png'

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
    for (const p of poem.photoMagnets ?? []) boxes.push({ x: p.x, y: p.y, w: PHOTO_W * (p.scale ?? 1), h: PHOTO_H * (p.scale ?? 1) })
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
      {/* photos sit under everything else */}
      {showExtras &&
        poem.photoMagnets?.map((p, i) => (
          <img
            key={`photo-${i}`}
            className="photo-magnet poem-canvas__photo-magnet"
            src={photoSrc(p.id)}
            alt=""
            draggable={false}
            style={{
              left: p.x,
              top: p.y,
              width: PHOTO_W * (p.scale ?? 1),
              height: PHOTO_H * (p.scale ?? 1),
              transform: `rotate(${p.rotate ?? 0}deg)`,
            }}
          />
        ))}
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
            src={stickerSrc(s.kind)}
            alt=""
            draggable={false}
            style={{ left: s.x, top: s.y, width: s.size, height: s.size, transform: `rotate(${s.rotate ?? 0}deg)` }}
          />
        ))}
    </div>
  )
}

// Squeezes the space between a poem's pieces (never the words themselves): row by row, the gaps between magnets and
// between rows shrink to `c` of their size (1 = as laid out, 0 = nearly touching). As a last resort photos and stickers
// shrink too (`extra`), so the words stay readable. Used when a spread-out poem would otherwise shrink to unreadable
// magnets in a small spot.
function compact(source: Poem, c: number, wordsOnly: boolean, extra = 1): Poem {
  const showExtras = !wordsOnly || source.words.length === 0
  const poem: Poem =
    extra === 1 || !showExtras
      ? source
      : {
          ...source,
          stickers: source.stickers?.map((s) => ({ ...s, size: s.size * extra })),
          photoMagnets: source.photoMagnets?.map((p) => ({ ...p, scale: (p.scale ?? 1) * extra })),
          photo: source.photo && { ...source.photo, width: source.photo.width * extra },
        }
  type Item = Box & { kind: 'word' | 'sticker' | 'photo' | 'photoMagnet'; i: number }
  const items: Item[] = poem.words.map((w, i) => ({
    kind: 'word',
    i,
    x: w.x,
    y: w.y,
    w: estimateWidth(w.text, poem.fontSize),
    h: magnetHeight(poem.fontSize),
  }))
  if (showExtras) {
    poem.stickers?.forEach((s, i) => items.push({ kind: 'sticker', i, x: s.x, y: s.y, w: s.size, h: s.size }))
    poem.photoMagnets?.forEach((p, i) =>
      items.push({ kind: 'photoMagnet', i, x: p.x, y: p.y, w: PHOTO_W * (p.scale ?? 1), h: PHOTO_H * (p.scale ?? 1) }),
    )
    if (poem.photo) {
      const p = poem.photo
      items.push({ kind: 'photo', i: 0, x: p.x, y: p.y, w: p.width, h: p.width * PHOTO_RATIO })
    }
  }
  if (items.length < 2) return poem

  // rows: words scattered from the pile wobble up and down a little, so a piece joins the row if its middle is within a
  // magnet's height of the row's middle
  const tolerance = magnetHeight(poem.fontSize)
  const rows: Item[][] = []
  for (const it of [...items].sort((a, b) => a.y + a.h / 2 - (b.y + b.h / 2))) {
    const row = rows.at(-1)
    const mid = it.y + it.h / 2
    const rowMid = row ? row.reduce((n, r) => n + r.y + r.h / 2, 0) / row.length : 0
    if (row && Math.abs(mid - rowMid) <= tolerance) row.push(it)
    else rows.push([it])
  }
  // where each row starts squeezes less than the gaps, so the poem keeps its shape (never one long column)
  const startFactor = 0.4 + 0.6 * c

  const MIN_GAP = 3 // page px left between neighbours
  const left = Math.min(...items.map((it) => it.x))
  let prevBottom: number | null = null
  const moved = new Map<Item, { x: number; y: number }>()
  for (const row of rows) {
    const rowTop = Math.min(...row.map((r) => r.y))
    const rowBottom = Math.max(...row.map((r) => r.y + r.h))
    const newTop: number = prevBottom === null ? rowTop : prevBottom + Math.max(MIN_GAP, (rowTop - prevBottom) * c)
    const dy = newTop - rowTop
    let prevRight: number | null = null
    let shift = 0
    for (const it of [...row].sort((a, b) => a.x - b.x)) {
      let nx: number
      if (prevRight === null) nx = left + (it.x - left) * startFactor
      else {
        const gap = it.x - prevRight
        nx = gap > 0 ? prevRight + shift + Math.max(Math.min(gap, MIN_GAP), gap * c) : it.x + shift
      }
      shift = nx - it.x
      prevRight = it.x + it.w
      moved.set(it, { x: nx, y: it.y + dy })
    }
    prevBottom = rowBottom + dy
  }

  const at = (kind: Item['kind'], i: number) => moved.get(items.find((it) => it.kind === kind && it.i === i)!)!
  return {
    ...poem,
    words: poem.words.map((w, i) => ({ ...w, ...at('word', i) })),
    stickers: showExtras ? poem.stickers?.map((s, i) => ({ ...s, ...at('sticker', i) })) : poem.stickers,
    photoMagnets: showExtras ? poem.photoMagnets?.map((p, i) => ({ ...p, ...at('photoMagnet', i) })) : poem.photoMagnets,
    photo: showExtras && poem.photo ? { ...poem.photo, ...at('photo', 0) } : poem.photo,
  }
}

// How a poem fits a box: its scale, and (if it would come out smaller than minScale) a version with tighter spacing.
function fitLayout(poem: Poem, box: Box, maxScale: number, wordsOnly: boolean, minScale = 0) {
  const scaleOf = (p: Poem) => {
    const b = poemBounds(p, wordsOnly)
    return b ? { b, scale: Math.min(maxScale, box.w / b.w, box.h / b.h) } : null
  }
  let best = scaleOf(poem)
  if (!best) return null
  let fitted = poem
  if (best.scale < minScale) {
    // tighter spacing first; then, with the pieces nearly touching, smaller photos and stickers
    const steps: [number, number][] = [[0.75, 1], [0.5, 1], [0.3, 1], [0.15, 1], [0, 1], [0, 0.8], [0, 0.65], [0, 0.5]]
    for (const [c, extra] of steps) {
      const tighter = compact(poem, c, wordsOnly, extra)
      const next = scaleOf(tighter)!
      if (next.scale > best.scale) {
        best = next
        fitted = tighter
      }
      if (best.scale >= minScale) break
    }
  }
  return { poem: fitted, ...best }
}

// Where a poem ends up once fitted into a box (for placing badges next to it)
export function fittedRect(poem: Poem, box: Box, maxScale = 1, wordsOnly = false, minScale = 0): Box | null {
  const fit = fitLayout(poem, box, maxScale, wordsOnly, minScale)
  if (!fit) return null
  const { b, scale } = fit
  const w = b.w * scale
  const h = b.h * scale
  return { x: box.x + (box.w - w) / 2, y: box.y + (box.h - h) / 2, w, h }
}

// A poem shrunk to fit a box, centered. Used for fridge slots, share cards and the day view.
// With minScale, a spread-out poem gets tighter spacing instead of tiny magnets.
export function FitPoem({
  poem,
  box,
  maxScale = 1,
  minScale = 0,
  wordsOnly = false,
  align = 'center',
}: {
  poem: Poem
  box: Box
  maxScale?: number
  minScale?: number
  wordsOnly?: boolean
  align?: 'center' | 'top'
}) {
  const fit = fitLayout(poem, box, maxScale, wordsOnly, minScale)
  if (!fit) return null
  const { b, scale } = fit
  const left = box.x + (box.w - b.w * scale) / 2 - b.x * scale
  const top = (align === 'top' ? box.y : box.y + (box.h - b.h * scale) / 2) - b.y * scale
  return (
    <PoemCanvas
      poem={fit.poem}
      wordsOnly={wordsOnly}
      style={{ transform: `translate(${left}px, ${top}px) scale(${scale})` }}
    />
  )
}
