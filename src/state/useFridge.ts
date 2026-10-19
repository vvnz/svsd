import { useEffect, useReducer } from 'react'

export type PlacedMagnet = {
  id: string // same id as the bank word, so each word can only be placed once
  text: string
  x: number // px from the left of the fridge surface
  y: number // px from the top of the fridge surface
  rotate: number // degrees, a slight tilt like a real magnet
}

type Saved = { placed: PlacedMagnet[] }
// `past` holds earlier versions of the fridge for undo. It lives in memory only,
// so undo history starts fresh each time the app opens.
type State = Saved & { past: PlacedMagnet[][] }

type Action =
  | { type: 'place'; magnet: PlacedMagnet }
  | { type: 'move'; id: string; x: number; y: number; rotate: number }
  | { type: 'remove'; id: string }
  | { type: 'clear' }
  | { type: 'undo' }

const MAX_UNDO = 50

function apply(placed: PlacedMagnet[], action: Exclude<Action, { type: 'undo' }>): PlacedMagnet[] {
  switch (action.type) {
    case 'place':
      if (placed.some((m) => m.id === action.magnet.id)) return placed
      return [...placed, action.magnet]
    case 'move': {
      const m = placed.find((m) => m.id === action.id)
      // dropped back where it was: nothing to undo
      if (!m || (m.x === action.x && m.y === action.y)) return placed
      // the moved magnet goes last so it sits on top of the others
      return [
        ...placed.filter((m) => m.id !== action.id),
        { ...m, x: action.x, y: action.y, rotate: action.rotate },
      ]
    }
    case 'remove':
      if (!placed.some((m) => m.id === action.id)) return placed
      return placed.filter((m) => m.id !== action.id)
    case 'clear':
      return placed.length ? [] : placed
  }
}

function reducer(state: State, action: Action): State {
  if (action.type === 'undo') {
    const prev = state.past.at(-1)
    if (!prev) return state
    return { placed: prev, past: state.past.slice(0, -1) }
  }
  const placed = apply(state.placed, action)
  if (placed === state.placed) return state
  return { placed, past: [...state.past, state.placed].slice(-MAX_UNDO) }
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
    if (raw) return { placed: (JSON.parse(raw) as Saved).placed, past: [] }
  } catch {
    // storage unavailable (private mode etc.), start fresh
  }
  return { placed: [], past: [] }
}

// The day's fridge autosaves on every change, so there is no save button.
export function useFridge(dateKey: string) {
  const [state, dispatch] = useReducer(reducer, dateKey, load)

  useEffect(() => {
    try {
      const saved: Saved = { placed: state.placed }
      localStorage.setItem(storageKey(dateKey), JSON.stringify(saved))
    } catch {
      // ignore
    }
  }, [dateKey, state.placed])

  return { placed: state.placed, canUndo: state.past.length > 0, dispatch }
}
