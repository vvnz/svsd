import { useEffect, useReducer } from 'react'

export type PlacedMagnet = {
  id: string // same id as the bank word, so each word can only be placed once
  text: string
  x: number // px from the left of the fridge surface
  y: number // px from the top of the fridge surface
  rotate: number // degrees, a slight tilt like a real magnet
}

type State = { placed: PlacedMagnet[] }

type Action =
  | { type: 'place'; magnet: PlacedMagnet }
  | { type: 'move'; id: string; x: number; y: number; rotate: number }
  | { type: 'remove'; id: string }
  | { type: 'clear' }

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'place':
      if (state.placed.some((m) => m.id === action.magnet.id)) return state
      return { placed: [...state.placed, action.magnet] }
    case 'move':
      return {
        // the moved magnet goes last so it sits on top of the others
        placed: [
          ...state.placed.filter((m) => m.id !== action.id),
          ...state.placed
            .filter((m) => m.id === action.id)
            .map((m) => ({ ...m, x: action.x, y: action.y, rotate: action.rotate })),
        ],
      }
    case 'remove':
      return { placed: state.placed.filter((m) => m.id !== action.id) }
    case 'clear':
      return { placed: [] }
  }
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
    if (raw) return JSON.parse(raw) as State
  } catch {
    // storage unavailable (private mode etc.), start fresh
  }
  return { placed: [] }
}

// The day's fridge autosaves on every change, so there is no save button.
export function useFridge(dateKey: string) {
  const [state, dispatch] = useReducer(reducer, dateKey, load)

  useEffect(() => {
    try {
      localStorage.setItem(storageKey(dateKey), JSON.stringify(state))
    } catch {
      // ignore
    }
  }, [dateKey, state])

  return { placed: state.placed, dispatch }
}
