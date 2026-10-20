import { useEffect, useReducer } from 'react'

import type { PhotoId } from '../data/photos'
import type { StickerId } from '../data/stickers'

export type PlacedMagnet = {
  id: string // unique per magnet: a word can be on the fridge more than once
  text: string
  x: number // px from the left of the fridge surface
  y: number // px from the top of the fridge surface
  rotate: number // degrees, a slight tilt like a real magnet
  sticker?: StickerId // a sticker magnet instead of a word (then `text` is its name)
  photo?: PhotoId // a photo magnet (Images tab); photos go straight onto the fridge, never into the pile
}

// A word (or sticker) tapped in the drawer, waiting in the pile at the bottom of the screen.
export type PiledMagnet = { id: string; wordId: string; text: string; sticker?: StickerId }

type Fridge = { placed: PlacedMagnet[]; pile: PiledMagnet[] }
// `past` holds earlier versions of the fridge for undo. It lives in memory only,
// so undo history starts fresh each time the app opens.
type State = Fridge & { past: Fridge[] }

type Action =
  | { type: 'collect'; magnet: PiledMagnet }
  | { type: 'place'; magnet: PlacedMagnet }
  | { type: 'release'; magnets: PlacedMagnet[] }
  | { type: 'move'; id: string; x: number; y: number; rotate: number }
  | { type: 'remove'; id: string }
  | { type: 'clear' }
  | { type: 'undo' }

const MAX_UNDO = 50

function apply(f: Fridge, action: Exclude<Action, { type: 'undo' }>): Fridge {
  switch (action.type) {
    case 'collect':
      return { ...f, pile: [...f.pile, action.magnet] }
    case 'place':
      // a word dragged straight from the drawer onto the fridge
      return { ...f, placed: [...f.placed, action.magnet] }
    case 'release':
      // the whole pile goes onto the fridge at once
      if (!f.pile.length) return f
      return { placed: [...f.placed, ...action.magnets], pile: [] }
    case 'move': {
      const m = f.placed.find((m) => m.id === action.id)
      // dropped back where it was: nothing to undo
      if (!m || (m.x === action.x && m.y === action.y)) return f
      // the moved magnet goes last so it sits on top of the others
      return {
        ...f,
        placed: [
          ...f.placed.filter((m) => m.id !== action.id),
          { ...m, x: action.x, y: action.y, rotate: action.rotate },
        ],
      }
    }
    case 'remove':
      if (!f.placed.some((m) => m.id === action.id)) return f
      return { ...f, placed: f.placed.filter((m) => m.id !== action.id) }
    case 'clear':
      // Delete Mode's "Clear fridge": the pile isn't on the fridge yet, so it stays
      return f.placed.length ? { ...f, placed: [] } : f
  }
}

function reducer(state: State, action: Action): State {
  if (action.type === 'undo') {
    const prev = state.past.at(-1)
    if (!prev) return state
    return { ...prev, past: state.past.slice(0, -1) }
  }
  const { past, ...current } = state
  const next = apply(current, action)
  if (next === current) return state
  return { ...next, past: [...past, current].slice(-MAX_UNDO) }
}

export function todayKey(date = new Date()): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

const storageKey = (dateKey: string) => `svsd:fridge:${dateKey}`

function load(dateKey: string): State {
  try {
    const raw = localStorage.getItem(storageKey(dateKey))
    if (raw) {
      const saved = JSON.parse(raw) as Partial<Fridge>
      return { placed: saved.placed ?? [], pile: saved.pile ?? [], past: [] }
    }
  } catch {
    // storage unavailable (private mode etc.), start fresh
  }
  return { placed: [], pile: [], past: [] }
}

let nextId = 0
/** A fresh id for a magnet, so the same word can be collected again and again. */
export const newMagnetId = () => `m-${Date.now().toString(36)}-${(nextId++).toString(36)}`

// The day's fridge autosaves on every change, so there is no save button.
export function useFridge(dateKey: string) {
  const [state, dispatch] = useReducer(reducer, dateKey, load)

  useEffect(() => {
    try {
      const saved: Fridge = { placed: state.placed, pile: state.pile }
      localStorage.setItem(storageKey(dateKey), JSON.stringify(saved))
    } catch {
      // ignore
    }
  }, [dateKey, state.placed, state.pile])

  return { placed: state.placed, pile: state.pile, canUndo: state.past.length > 0, dispatch }
}
