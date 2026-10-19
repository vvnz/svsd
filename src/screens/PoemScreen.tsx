import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion, useMotionValue } from 'motion/react'

import { Icon } from '../components/Icon'
import { SideMenu, type MenuId } from '../components/SideMenu'
import { ShaderEffect } from '../lib/custom-effect-runtime'
import {
  setup as setupEnamel,
  render as renderEnamel,
  manifest as enamelManifest,
} from '../lib/custom-effects/CodeComponentId_8c552fed7acffbf136b02cbdf0d8db95993c2df4_381de6e90985c8ec78c4acf4f54027e72beb6d15'
import { FridgeMagnet, randomTilt } from '../components/FridgeMagnet'
import { Magnet } from '../components/Magnet'
import { MagnetDrawer, drawerTop, type DrawerSnap } from '../components/MagnetDrawer'
import { MagnetPile } from '../components/MagnetPile'
import { StarButton } from '../components/StarButton'
import { useToast } from '../components/Toast'
import { useApp } from '../state/appState'
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

type Props = {
  onMenu: (id: MenuId) => void
  /** starred today's poem, but all 6 favourites are taken: pick one to swap out */
  onFavouritesFull: () => void
}

export function PoemScreen({ onMenu, onFavouritesFull }: Props) {
  const dateKey = todayKey()
  const words = useMemo(() => wordBankFor(dateKey), [dateKey])
  const { placed, pile, canUndo, dispatch } = useFridge(dateKey)
  const { favourites, toggleFavourite, refreshToday } = useApp()
  const toast = useToast()
  const pinned = favourites.includes(dateKey)

  const screenRef = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState({ width: 402, height: 874 })
  const [snap, setSnap] = useState<DrawerSnap>('collapsed')
  const [dragging, setDragging] = useState(false)
  const [overDrawer, setOverDrawer] = useState(false)
  // Figma "Poem - Delete Mode" (88:5505): long press a magnet; it ends on its own once the fridge is empty
  const [deleteModeOn, setDeleteMode] = useState(false)
  const deleteMode = deleteModeOn && placed.length > 0
  // a word held in the drawer and being dragged out onto the fridge
  const [held, setHeld] = useState<BankWord | null>(null)
  const [heldOverDrawer, setHeldOverDrawer] = useState(true)
  const heldX = useMotionValue(0)
  const heldY = useMotionValue(0)
  const heldRef = useRef<HTMLDivElement>(null)
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

  // Screen-relative position of a pointer.
  const toScreen = (clientX: number, clientY: number) => {
    const r = screenRef.current?.getBoundingClientRect()
    return { x: clientX - (r?.left ?? 0), y: clientY - (r?.top ?? 0) }
  }

  // A word held in the drawer: it lifts out and follows the finger until it's let go.
  function hold(word: BankWord, point: { x: number; y: number }) {
    const p = toScreen(point.x, point.y)
    heldX.set(p.x)
    heldY.set(p.y)
    setHeldOverDrawer(true)
    setHeld(word)
  }

  useEffect(() => {
    if (!held) return
    const move = (e: PointerEvent) => {
      const p = toScreen(e.clientX, e.clientY)
      heldX.set(p.x)
      heldY.set(p.y)
      setHeldOverDrawer(p.y > drawerTop(snap, size.height))
    }
    const drop = (e: PointerEvent) => {
      const p = toScreen(e.clientX, e.clientY)
      const box = heldRef.current?.getBoundingClientRect()
      const screen = screenRef.current?.getBoundingClientRect()
      // let go over the fridge: it sticks where it was dropped; over the drawer: it goes back
      if (e.type === 'pointerup' && box && screen && p.y < drawerTop(snap, size.height)) {
        const x = Math.min(Math.max(box.left - screen.left, 8), size.width - box.width - 8)
        const y = Math.min(Math.max(box.top - screen.top, 8), size.height - box.height - 8)
        dispatch({
          type: 'place',
          magnet: { id: newMagnetId(), text: held.text, x: Math.round(x), y: Math.round(y), rotate: randomTilt() },
        })
        navigator.vibrate?.(8)
      }
      setHeld(null)
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', drop)
    window.addEventListener('pointercancel', drop)
    return () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', drop)
      window.removeEventListener('pointercancel', drop)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [held, snap, size])

  // Star today's poem to pin it to the favourites fridge.
  function star() {
    if (pinned) {
      toggleFavourite(dateKey)
      toast.show('Taken off your favourites')
      return
    }
    if (!placed.length) {
      toast.show('Add some words to your poem first')
      return
    }
    // make sure favourites sees what's on the fridge right now
    refreshToday()
    if (!favourites.includes(null)) {
      onFavouritesFull()
      return
    }
    toggleFavourite(dateKey)
    navigator.vibrate?.(10)
    toast.show('Pinned to your favourites')
  }

  // the drawer pulls down so the whole fridge is in view while deleting
  function openDeleteMode() {
    setSnap('collapsed')
    setDeleteMode(true)
  }

  function deleteMagnet(id: string) {
    dispatch({ type: 'remove', id })
    if (placed.length <= 1) setDeleteMode(false)
  }

  function clearFridge() {
    dispatch({ type: 'clear' })
    setDeleteMode(false)
    navigator.vibrate?.([10, 40, 10])
  }

  return (
    <div className="screen poem-screen" ref={screenRef}>
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

      <StarButton pinned={pinned} onClick={star} className="top-right" />

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

      {/* Delete Mode dims everything but the magnets; tap the dim layer to finish */}
      <AnimatePresence>
        {deleteMode && (
          <>
            <motion.button
              key="dim"
              className="delete-mode__dim"
              aria-label="Done deleting"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setDeleteMode(false)}
            />
            <motion.p
              key="hint"
              className={`delete-mode__hint ${pile.length ? 'delete-mode__hint--above-pile' : ''}`}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 6 }}
              transition={{ duration: 0.2 }}
            >
              Tap a magnet to remove it
              <span>Tap anywhere else when you're done</span>
            </motion.p>
            <motion.button
              key="clear"
              className="text-btn top-right delete-mode__clear"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              whileTap={{ scale: 0.95 }}
              onClick={clearFridge}
            >
              Clear
            </motion.button>
          </>
        )}
      </AnimatePresence>

      {/* while a magnet is dragged it rides above the drawer, so it can be dropped there to remove;
          in Delete Mode the magnets sit above the dim layer */}
      <div className="magnets" style={{ zIndex: deleteMode ? 40 : dragging ? 30 : 10 }}>
        <AnimatePresence>
          {placed.map((m) => (
            <FridgeMagnet
              key={m.id}
              magnet={m}
              spawnFrom={spawnFrom.current.get(m.id)}
              spawnDelay={spawnDelay.current.get(m.id)}
              bounds={size}
              deleteMode={deleteMode}
              onLongPress={openDeleteMode}
              onDelete={deleteMagnet}
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
        onHold={hold}
      />
      {toast.node}

      {/* the word being dragged out of the drawer, a little above the finger so it stays visible */}
      <AnimatePresence>
        {held && (
          <motion.div
            key="held"
            ref={heldRef}
            className="held-magnet"
            style={{ x: heldX, y: heldY }}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: heldOverDrawer ? 1 : 1.08, opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.1 } }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          >
            <Magnet text={held.text} size="fridge" />
          </motion.div>
        )}
      </AnimatePresence>

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
