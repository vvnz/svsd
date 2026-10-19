import { useLayoutEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'

import { Icon } from '../components/Icon'
import { SideMenu, type MenuId } from '../components/SideMenu'
import { ShaderEffect } from '../lib/custom-effect-runtime'
import {
  setup as setupEnamel,
  render as renderEnamel,
  manifest as enamelManifest,
} from '../lib/custom-effects/CodeComponentId_8c552fed7acffbf136b02cbdf0d8db95993c2df4_381de6e90985c8ec78c4acf4f54027e72beb6d15'
import { FridgeMagnet, randomTilt } from '../components/FridgeMagnet'
import { MagnetDrawer, drawerTop, type DrawerSnap } from '../components/MagnetDrawer'
import { MagnetPile } from '../components/MagnetPile'
import { wordBankFor, type BankWord } from '../data/wordBank'
import { newMagnetId, todayKey, useFridge } from '../state/useFridge'

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

// A released pile scatters across the fridge, as in Figma's "on canvas" frame:
// random spots, but avoiding the magnets already there so every word stays readable.
function scatterSpot(text: string, taken: Rect[], area: Rect) {
  const size = estimateSize(text)
  const random = () => ({
    x: Math.round(area.x + Math.random() * Math.max(area.w - size.w, 0)),
    y: Math.round(area.y + Math.random() * Math.max(area.h - size.h, 0)),
  })
  for (let i = 0; i < 60; i++) {
    const spot = random()
    if (!taken.some((t) => overlaps({ ...spot, ...size }, t))) return spot
  }
  // fridge is crowded: drop it anywhere and let the user tidy up
  return random()
}

export function PoemScreen({ onMenu }: { onMenu: (id: MenuId) => void }) {
  const dateKey = todayKey()
  const words = useMemo(() => wordBankFor(dateKey), [dateKey])
  const { placed, pile, canUndo, dispatch } = useFridge(dateKey)

  const screenRef = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState({ width: 402, height: 874 })
  const [snap, setSnap] = useState<DrawerSnap>('collapsed')
  const [dragging, setDragging] = useState(false)
  const [overDrawer, setOverDrawer] = useState(false)
  const spawnFrom = useRef(new Map<string, { x: number; y: number }>())
  const spawnDelay = useRef(new Map<string, number>())
  const pileSpawn = useRef(new Map<string, { x: number; y: number }>())

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

  const pileCounts = useMemo(() => {
    const counts = new Map<string, number>()
    for (const m of pile) counts.set(m.wordId, (counts.get(m.wordId) ?? 0) + 1)
    return counts
  }, [pile])
  const collapsedTop = drawerTop('collapsed', size.height)
  // Figma: the pile rests just above the closed drawer, or at the bottom of the screen over an open one
  const pileCenterX = size.width / 2
  const pileBottom = snap === 'collapsed' ? collapsedTop - 25 : size.height - 42

  // Is a page y coordinate over the drawer?
  const isOverDrawer = (pageY: number) => {
    const rect = screenRef.current?.getBoundingClientRect()
    if (!rect) return false
    return pageY - rect.top - window.scrollY > drawerTop(snap, size.height)
  }

  // Tap a word in the drawer: a copy flies down into the pile.
  function collect(word: BankWord, from: DOMRect) {
    const screen = screenRef.current?.getBoundingClientRect()
    if (!screen) return
    const id = newMagnetId()
    pileSpawn.current.set(id, { x: from.left + from.width / 2 - screen.left, y: from.top - screen.top })
    dispatch({ type: 'collect', magnet: { id, wordId: word.id, text: word.text } })
    navigator.vibrate?.(8)
  }

  // Tap the pile: the drawer closes and every collected word scatters onto the fridge.
  function release() {
    if (!pile.length) return
    setSnap('collapsed')
    // the open fridge, under the top icons, left of the menu tab and clear of the pile
    const area = { x: 28, y: 92, w: size.width - 56 - 40, h: Math.max(collapsedTop - 25 - 52 - 92 - 24, 160) }
    const taken: Rect[] = placed.map((m) => ({ x: m.x, y: m.y, ...estimateSize(m.text) }))
    // newest first, so the word on top of the pile is the first to fly
    const magnets = [...pile].reverse().map((m, i) => {
      const spot = scatterSpot(m.text, taken, area)
      taken.push({ ...spot, ...estimateSize(m.text) })
      spawnFrom.current.set(m.id, { x: pileCenterX - estimateSize(m.text).w / 2, y: collapsedTop - 25 - 52 })
      spawnDelay.current.set(m.id, i * 0.05)
      return { id: m.id, text: m.text, x: spot.x, y: spot.y, rotate: randomTilt() }
    })
    dispatch({ type: 'release', magnets: magnets.reverse() })
    navigator.vibrate?.([6, 30, 6])
  }

  return (
    <div className="screen" ref={screenRef}>
      <ShaderEffect className="surface" shaders={ENAMEL_SHADERS}>
        <div className="surface__fill" />
      </ShaderEffect>

      {/* Figma "undo" icon (75:5214): steps back through adds, moves and removals */}
      <motion.button
        className="icon-btn back-btn"
        aria-label="Undo"
        disabled={!canUndo}
        animate={{ opacity: canUndo ? 1 : 0.3 }}
        whileTap={canUndo ? { scale: 0.88, rotate: -12 } : undefined}
        onClick={() => {
          dispatch({ type: 'undo' })
          navigator.vibrate?.(8)
        }}
      >
        <Icon name="undo" size={25} />
      </motion.button>

      <SideMenu screenWidth={size.width} onSelect={onMenu} />

      <AnimatePresence>
        {placed.length === 0 && pile.length === 0 && snap === 'collapsed' && (
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
              spawnDelay={spawnDelay.current.get(m.id)}
              bounds={size}
              onDragStateChange={(isDragging, pageY) => {
                setDragging(isDragging)
                setOverDrawer(isDragging && pageY !== undefined && isOverDrawer(pageY))
                spawnFrom.current.delete(m.id)
                spawnDelay.current.delete(m.id)
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
        pileCounts={pileCounts}
        removeHint={dragging && overDrawer}
        onPick={collect}
      />

      <MagnetPile
        pile={pile}
        centerX={pileCenterX}
        bottom={pileBottom}
        spawnFrom={pileSpawn.current}
        onRelease={release}
      />
    </div>
  )
}
