import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'

import { DEFAULT_FAVOURITES, SEEDED_POEMS, type Poem } from '../data/poems'
import { todayKey, type PlacedMagnet } from './useFridge'

export type FridgeStyle = 'graphite' | 'steel' | 'butter'

export type Settings = {
  name: string
  reminder: boolean
  reminderTime: string // "21:00"
  haptics: boolean
}

type AppState = {
  favourites: (string | null)[] // 6 slots, each a poem date or empty
  fridgeStyle: FridgeStyle
  settings: Settings
}

const KEY = 'svsd:app'
const DEFAULTS: AppState = {
  favourites: DEFAULT_FAVOURITES,
  fridgeStyle: 'steel',
  settings: { name: 'jessica', reminder: true, reminderTime: '21:00', haptics: true },
}

function load(): AppState {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) {
      const saved = JSON.parse(raw) as Partial<AppState>
      return { ...DEFAULTS, ...saved, settings: { ...DEFAULTS.settings, ...saved.settings } }
    }
  } catch {
    // ignore
  }
  return DEFAULTS
}

// Today's poem is whatever is on today's fridge right now.
function todaysPoem(): Poem | null {
  try {
    const raw = localStorage.getItem(`svsd:fridge:${todayKey()}`)
    if (!raw) return null
    const { placed } = JSON.parse(raw) as { placed: PlacedMagnet[] }
    if (!placed?.length) return null
    return {
      date: todayKey(),
      fontSize: 19, // the size magnets are on the poem screen
      words: placed.map((m) => ({ text: m.text, x: m.x, y: m.y, rotate: m.rotate })),
    }
  } catch {
    return null
  }
}

type Ctx = AppState & {
  poems: Poem[] // every day with a poem, oldest first
  poemFor: (date: string) => Poem | undefined
  setFavourites: (f: (string | null)[]) => void
  setFridgeStyle: (s: FridgeStyle) => void
  updateSettings: (s: Partial<Settings>) => void
  toggleFavourite: (date: string) => void
  refreshToday: () => void
  resetDemo: () => void
}

const AppContext = createContext<Ctx | null>(null)

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(load)
  const [today, setToday] = useState<Poem | null>(todaysPoem)

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(state))
    } catch {
      // ignore
    }
  }, [state])

  const poems = useMemo(() => (today ? [...SEEDED_POEMS, today] : SEEDED_POEMS), [today])
  const poemFor = useCallback((date: string) => poems.find((p) => p.date === date), [poems])

  const toggleFavourite = useCallback((date: string) => {
    setState((s) => {
      if (s.favourites.includes(date)) {
        return { ...s, favourites: s.favourites.map((f) => (f === date ? null : f)) }
      }
      const empty = s.favourites.indexOf(null)
      if (empty === -1) return s // fridge is full: the user swaps one out from the edit screen
      const favourites = [...s.favourites]
      favourites[empty] = date
      return { ...s, favourites }
    })
  }, [])

  const value: Ctx = {
    ...state,
    poems,
    poemFor,
    setFavourites: (favourites) => setState((s) => ({ ...s, favourites })),
    setFridgeStyle: (fridgeStyle) => setState((s) => ({ ...s, fridgeStyle })),
    updateSettings: (patch) => setState((s) => ({ ...s, settings: { ...s.settings, ...patch } })),
    toggleFavourite,
    refreshToday: () => setToday(todaysPoem()),
    resetDemo: () => {
      try {
        Object.keys(localStorage)
          .filter((k) => k.startsWith('svsd:'))
          .forEach((k) => localStorage.removeItem(k))
      } catch {
        // ignore
      }
      setState(DEFAULTS)
      setToday(null)
    },
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be inside AppStateProvider')
  return ctx
}
