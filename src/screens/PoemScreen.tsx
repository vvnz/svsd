import { useLayoutEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { House, Undo2 } from 'lucide-react'

import { ShaderEffect } from '../lib/custom-effect-runtime'
import {
  setup as setupEnamel,
  render as renderEnamel,
  manifest as enamelManifest,
} from '../lib/custom-effects/CodeComponentId_8c552fed7acffbf136b02cbdf0d8db95993c2df4_381de6e90985c8ec78c4acf4f54027e72beb6d15'
import { FridgeMagnet, randomTilt } from '../components/FridgeMagnet'
import { MagnetDrawer, drawerTop, type DrawerSnap } from '../components/MagnetDrawer'
import { MAX_WORDS_ON_FRIDGE, wordBankFor, type BankWord } from '../data/wordBank'
import { todayKey, useFridge, type PlacedMagnet } from '../state/useFridge'

// Shader params copied from the Figma "Poem" frames (Fridge enamel texture).
const ENAMEL_SHADERS = [
  {
    setup: setupEnamel,
    render: renderEnamel,
    params: {
      bumpDepth: 0.25,
      seed: 7,
      blendStrength: 0.29999998211860657,
      textureSize: 3.6000001430511475,
      lightDirection: 225,
      glossiness: 0.7699999809265137,
    },
    manifest: enamelManifest,
  },
]

// Rough magnet size at fridge scale, used to find a free spot for a new word.
const estimateSize = (text: string) => ({ w: Math.round(text.length * 9.5 + 30), h: 38 })

type Rect = { x: number; y: number; w: number; h: number }
const overlaps = (a: Rect, b: Rect, pad = 6) =>
  a.x < b.x + b.w + pad && a.x + a.w + pad > b.x && a.y < b.y + b.h + pad && a.y + a.h + pad > b.y

// New words land in reading order, top to bottom, left to right, in the first gap
// that fits, so a fresh poem starts out readable and is easy to rearrange.
function findSpot(text: string, placed: PlacedMagnet[], area: Rect) {
  const size = estimateSize(text)
  const taken = placed.map((m) => ({ x: m.x, y: m.y, ...estimateSize(m.text) }))
  for (let y = area.y; y + size.h <= area.y + area.h; y += 46) {
    for (let x = area.x; x + size.w <= area.x + area.w; x += 8) {
      const jitterY = y + Math.round(Math.random() * 6 - 3)
      const r = { x, y: jitterY, ...size }
      if (!taken.some((t) => overlaps(r, t))) return { x, y: jitterY }
    }
  }
  // fridge is crowded: drop it somewhere in the area and let the user tidy up
  return {
    x: area.x + Math.random() * Math.max(area.w - size.w, 0),
    y: area.y + Math.random() * Math.max(area.h - size.h, 0),
  }
}

export function PoemScreen() {
  const dateKey = todayKey()
  const words = useMemo(() => wordBankFor(dateKey), [dateKey])
  const { placed, dispatch } = useFridge(dateKey)

  const screenRef = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState({ width: 402, height: 874 })
  const [snap, setSnap] = useState<DrawerSnap>('collapsed')
  const [dragging, setDragging] = useState(false)
  const [overDrawer, setOverDrawer] = useState(false)
  const spawnFrom = useRef(new Map<string, { x: number; y: number }>())

  useLayoutEffect(() => {
    const el = screenRef.current
    if (!el) return
    const ro = new ResizeObserver(([entry]) => {
      if (!entry) return
      setSize({ width: entry.contentRect.width, height: entry.contentRect.height })
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const usedIds = useMemo(() => new Set(placed.map((m) => m.id)), [placed])
  const isFull = placed.length >= MAX_WORDS_ON_FRIDGE
  const top = drawerTop(snap, size.height)

  // Is a page y coordinate over the drawer?
  const isOverDrawer = (pageY: number) => {
    const rect = screenRef.current?.getBoundingClientRect()
    if (!rect) return false
    return pageY - rect.top - window.scrollY > drawerTop(snap, size.height)
  }

  function pick(word: BankWord, from: DOMRect) {
    if (isFull || usedIds.has(word.id)) return
    const screen = screenRef.current?.getBoundingClientRect()
    if (!screen) return
    // words fill the open space above the drawer, under the top icons
    const area = { x: 28, y: 92, w: size.width - 56 - 40, h: Math.max(top - 92 - 20, 120) }
    const spot = findSpot(word.text, placed, area)
    spawnFrom.current.set(word.id, { x: from.left - screen.left, y: from.top - screen.top })
    dispatch({
      type: 'place',
      magnet: { id: word.id, text: word.text, x: spot.x, y: spot.y, rotate: randomTilt() },
    })
    navigator.vibrate?.(8)
  }

  return (
    <div className="screen" ref={screenRef}>
      <ShaderEffect className="surface" shaders={ENAMEL_SHADERS}>
        <div className="surface__fill" />
      </ShaderEffect>

      <button className="icon-btn back-btn" aria-label="Back">
        {/* TODO: swap for the Figma back icon */}
        <Undo2 size={20} strokeWidth={2.2} />
      </button>

      <button className="home-tab" aria-label="Home">
        {/* TODO: swap for the Figma home icon */}
        <House size={20} strokeWidth={1.8} />
      </button>

      <AnimatePresence>
        {placed.length === 0 && snap === 'collapsed' && (
          <motion.p
            className="empty-hint"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.15 } }}
          >
            Welcome! Add words to
            <br />
            start your poem!
          </motion.p>
        )}
      </AnimatePresence>

      {/* while a magnet is dragged it rides above the drawer, so it can be dropped there to remove */}
      <div className="magnets" style={{ zIndex: dragging ? 30 : 10 }}>
        <AnimatePresence>
          {placed.map((m) => (
            <FridgeMagnet
              key={m.id}
              magnet={m}
              spawnFrom={spawnFrom.current.get(m.id)}
              bounds={size}
              onDragStateChange={(isDragging, pageY) => {
                setDragging(isDragging)
                setOverDrawer(isDragging && pageY !== undefined && isOverDrawer(pageY))
                spawnFrom.current.delete(m.id)
              }}
              onDrop={(id, x, y, rotate, pageY) => {
                if (isOverDrawer(pageY)) dispatch({ type: 'remove', id })
                else dispatch({ type: 'move', id, x, y, rotate })
              }}
            />
          ))}
        </AnimatePresence>
      </div>

      <MagnetDrawer
        screenHeight={size.height}
        snap={snap}
        onSnapChange={setSnap}
        words={words}
        usedIds={usedIds}
        isFull={isFull}
        placedCount={placed.length}
        maxWords={MAX_WORDS_ON_FRIDGE}
        removeHint={dragging && overDrawer}
        onPick={pick}
      />
    </div>
  )
}
