// Where a dropped magnet should settle so it doesn't sit on top of another one.
// If the spot is free it stays put. Otherwise it slides to the nearest free place, preferring to
// sit beside the magnet it landed on (left or right), then just above or below. If the fridge is too
// crowded for that, it searches outward in a widening ring.

export type Rect = { x: number; y: number; w: number; h: number }

const GAP = 0 // edges touch, like words pushed together into a phrase

const overlaps = (a: Rect, b: Rect) =>
  a.x < b.x + b.w + GAP && a.x + a.w + GAP > b.x && a.y < b.y + b.h + GAP && a.y + a.h + GAP > b.y

const inside = (r: Rect, bounds: Rect) =>
  r.x >= bounds.x && r.y >= bounds.y && r.x + r.w <= bounds.x + bounds.w && r.y + r.h <= bounds.y + bounds.h

export function freeSpot(rect: Rect, others: Rect[], bounds: Rect): { x: number; y: number } {
  const fits = (x: number, y: number) => {
    const r = { ...rect, x, y }
    return inside(r, bounds) && !others.some((o) => overlaps(r, o))
  }
  if (fits(rect.x, rect.y)) return { x: rect.x, y: rect.y }

  // sliding sideways reads as "beside it"; moving up or down costs three times as much, so it only
  // goes above or below when it was dropped mostly above or below
  const cost = (x: number, y: number) => Math.abs(x - rect.x) + 3 * Math.abs(y - rect.y)
  let best: { x: number; y: number } | null = null
  const consider = (x: number, y: number) => {
    x = Math.round(x)
    y = Math.round(y)
    if (fits(x, y) && (!best || cost(x, y) < cost(best.x, best.y))) best = { x, y }
  }

  // beside, above or below each magnet it touches
  for (const o of others) {
    consider(o.x + o.w + GAP, rect.y)
    consider(o.x - rect.w - GAP, rect.y)
    consider(rect.x, o.y + o.h + GAP)
    consider(rect.x, o.y - rect.h - GAP)
    // and the corners, for when a neighbour blocks the straight slide
    consider(o.x + o.w + GAP, o.y + o.h + GAP)
    consider(o.x - rect.w - GAP, o.y + o.h + GAP)
  }
  if (best) return best

  // crowded: the nearest free spot in a widening ring
  for (let radius = 8; radius <= 400; radius += 8) {
    for (let a = 0; a < 360; a += 15) {
      const t = (a * Math.PI) / 180
      consider(rect.x + Math.cos(t) * radius, rect.y + Math.sin(t) * radius * 0.7)
    }
    if (best) return best
  }
  // nowhere free at all: leave it where it was dropped
  return { x: rect.x, y: rect.y }
}
