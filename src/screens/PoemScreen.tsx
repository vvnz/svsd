import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion, useMotionValue } from 'motion/react'

import { Icon } from '../components/Icon'
import { SideMenu, type MenuId } from '../components/SideMenu'
import { FridgeBackground, isDarkFinish } from '../components/FridgeBackground'
import { freeSpot } from '../lib/freeSpot'
import { FridgeMagnet, randomTilt } from '../components/FridgeMagnet'
import { MagnetFace } from '../components/Magnet'
import { MagnetDrawer, drawerTop, type Collectible, type DrawerSnap } from '../components/MagnetDrawer'
import { MagnetPile } from '../components/MagnetPile'
import { StarButton } from '../components/StarButton'
import { useToast } from '../components/Toast'
import { useApp } from '../state/appState'
import { PHOTO_H, PHOTO_W } from '../data/photos'
import { STICKER_SIZE } from '../data/stickers'
import { wordBankFor } from '../data/wordBank'
import { newMagnetId, todayKey, useFridge } from '../state/useFridge'
import { deviceScale } from '../state/deviceScale'

// the side margin (--margin in index.css); released magnets keep inside it, and clear of the menu tab (40px)
const MARGIN = 24

// Rough magnet size at fridge scale, used to find a free spot for a new word (stickers are square).
const estimateSize = (text: string, sticker?: unknown, photo?: unknown) =>
  photo
    ? { w: PHOTO_W, h: PHOTO_H }
    : sticker
      ? { w: STICKER_SIZE, h: STICKER_SIZE }
      : { w: Math.round(text.length * 9.5 + 30), h: 38 }

type Rect = { x: number; y: number; w: number; h: number }
const overlaps = (a: Rect, b: Rect, pad = 6) =>
  a.x < b.x + b.w + pad && a.x + a.w + pad > b.x && a.y < b.y + b.h + pad && a.y + a.h + pad > b.y

// A released pile scatters across the fridge, as in Figma's "on canvas" frame, in reading order:
// the words you collected first come first, left to right along a row, then the next row down.
// The fridge is split into a loose grid (up to 3 words a row) and each word lands at a random spot
// in its cell, avoiding the magnets already there so every word stays readable.
function cellFor(index: number, count: number, area: Rect): Rect {
  const perRow = Math.min(3, Math.max(1, Math.round(Math.sqrt(count))))
  const rows = Math.ceil(count / perRow)
  const row = Math.floor(index / perRow)
  const col = index % perRow
  const step = area.h / rows
  // words in a row stay within about 18px of the row's centre line, so each row reads as a row
  const magnetH = estimateSize('').h
  const h = magnetH + 36
  const centre = area.y + (row + 0.5) * step
  const y = Math.max(area.y, Math.min(centre - h / 2, area.y + area.h - h))
  const w = area.w / perRow
  return { x: area.x + col * w, y, w, h }
}

function scatterSpot(size: { w: number; h: number }, taken: Rect[], area: Rect, bounds: Rect) {
  // stay inside the cell so the next word in the row has room; a word wider than its cell starts at
  // the cell's left edge and runs over, as long as it stays on the fridge
  const maxX = Math.min(Math.max(area.x, area.x + area.w - size.w), bounds.x + bounds.w - size.w)
  const random = () => ({
    x: Math.round(area.x + Math.random() * Math.max(maxX - area.x, 0)),
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
  onShare: () => void
}

export function PoemScreen({ onMenu, onFavouritesFull, onShare }: Props) {
  const dateKey = todayKey()
  const words = useMemo(() => wordBankFor(dateKey), [dateKey])
  const { placed, pile, canUndo, dispatch } = useFridge(dateKey)
  const { favourites, toggleFavourite, refreshToday, fridgeStyle, privacy } = useApp()
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
  const [held, setHeld] = useState<Collectible | null>(null)
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

  // Is a drag point over the drawer? Drag points come from motion, already divided by the frame's scale
  // (see MotionConfig in App), while the screen's rect is in real screen pixels.
  const isOverDrawer = (pointY: number) => {
    const rect = screenRef.current?.getBoundingClientRect()
    if (!rect) return false
    return pointY - (rect.top + window.scrollY) / deviceScale() > drawerTop(snap, size.height)
  }

  // From one on-screen rect to another, in the app's own pixels (the phone frame may be scaled on a laptop)
  const between = (from: DOMRect, screen: DOMRect) => {
    const s = deviceScale()
    return { x: (from.left - screen.left) / s, y: (from.top - screen.top) / s, w: from.width / s, h: from.height / s }
  }

  // Tap a word or sticker in the drawer: a copy flies down into the pile. A photo skips the pile.
  function collect(word: Collectible, from: DOMRect) {
    const screen = screenRef.current?.getBoundingClientRect()
    if (!screen) return
    if (word.photo) {
      placePhoto(word, from, screen)
      return
    }
    const id = newMagnetId()
    const r = between(from, screen)
    pileSpawn.current.set(id, { x: r.x + r.w / 2, y: r.y })
    dispatch({ type: 'collect', magnet: { id, wordId: word.id, text: word.text, sticker: word.sticker } })
    navigator.vibrate?.(8)
  }

  // Tap the pile: the drawer closes and every collected word scatters onto the fridge.
  function release() {
    if (!pile.length) return
    setSnap('collapsed')
    // the open fridge: below the undo / share / star column (it ends at y 176), left of the menu tab, clear of the pile
    const top = 192
    const area = { x: MARGIN, y: top, w: size.width - MARGIN * 2 - 40, h: Math.max(collapsedTop - 25 - 52 - top - 24, 160) }
    // photos lie underneath, so words and stickers may land on them
    const taken: Rect[] = placed
      .filter((m) => !m.photo)
      .map((m) => ({ x: m.x, y: m.y, ...estimateSize(m.text, m.sticker) }))
    // reading order: first collected top left, last collected bottom right
    const magnets = pile.map((m, i) => {
      const size = estimateSize(m.text, m.sticker)
      const spot = scatterSpot(size, taken, cellFor(i, pile.length, area), area)
      taken.push({ ...spot, ...size })
      spawnFrom.current.set(m.id, { x: pileCenterX - size.w / 2, y: collapsedTop - 25 - 52 })
      // the word on top of the pile (the newest) is the first to fly
      spawnDelay.current.set(m.id, (pile.length - 1 - i) * 0.05)
      return { id: m.id, text: m.text, sticker: m.sticker, x: spot.x, y: spot.y, rotate: randomTilt() }
    })
    dispatch({ type: 'release', magnets })
    navigator.vibrate?.([6, 30, 6])
  }

  // Tap a photo: it flies out of the grid straight onto the open part of the fridge.
  // Photos lie under the other magnets, so any spot will do. A full drawer drops to half so you can see where it went.
  function placePhoto(item: Collectible, from: DOMRect, screen: DOMRect) {
    const nextSnap = snap === 'full' ? 'half' : snap
    if (nextSnap !== snap) setSnap(nextSnap)
    const top = 192 // below the undo / share / star column
    const bottom = drawerTop(nextSnap, size.height) - 12
    const x = MARGIN + Math.random() * Math.max(size.width - MARGIN * 2 - 40 - PHOTO_W, 0)
    const y = top + Math.random() * Math.max(bottom - PHOTO_H - top, 0)
    const spot = { x: Math.round(x), y: Math.round(y) }
    const id = newMagnetId()
    const r = between(from, screen)
    spawnFrom.current.set(id, { x: r.x, y: r.y })
    dispatch({
      type: 'place',
      magnet: { id, text: item.text, photo: item.photo, x: spot.x, y: spot.y, rotate: randomTilt() },
    })
    navigator.vibrate?.(8)
  }

  // Where a dropped magnet settles: beside another one rather than on top of it.
  // Sizes come from the magnets on screen (their real width), positions from the saved fridge.
  // Photos are left out both ways: they stay where they're dropped, and the others may cover them.
  function settle(id: string | null, x: number, y: number, w: number, h: number) {
    if (id && placed.find((m) => m.id === id)?.photo) return { x, y }
    const els = screenRef.current?.querySelectorAll<HTMLElement>('.fridge-magnet[data-id]') ?? []
    const sizes = new Map([...els].map((el) => [el.dataset.id!, { w: el.offsetWidth, h: el.offsetHeight }]))
    const others = placed
      .filter((m) => m.id !== id && !m.photo)
      .map((m) => ({ x: m.x, y: m.y, ...(sizes.get(m.id) ?? estimateSize(m.text, m.sticker)) }))
    // the open fridge above the drawer, inside the 8px edge the magnets keep
    const bounds = { x: 8, y: 8, w: size.width - 16, h: drawerTop(snap, size.height) - 16 }
    return freeSpot({ x, y, w, h }, others, bounds)
  }

  // Screen-relative position of a pointer, in the app's own pixels
  const toScreen = (clientX: number, clientY: number) => {
    const r = screenRef.current?.getBoundingClientRect()
    const s = deviceScale()
    return { x: (clientX - (r?.left ?? 0)) / s, y: (clientY - (r?.top ?? 0)) / s }
  }

  // A word or sticker held in the drawer: it lifts out and follows the finger until it's let go.
  function hold(word: Collectible, point: { x: number; y: number }) {
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
        // the held word is drawn 8% bigger while it's lifted; settle it at its real size
        const r = between(box, screen)
        const w = r.w / 1.08
        const h = r.h / 1.08
        const x = Math.min(Math.max(r.x, 8), size.width - w - 8)
        const y = Math.min(Math.max(r.y, 8), size.height - h - 8)
        const spot = held.photo ? { x: Math.round(x), y: Math.round(y) } : settle(null, Math.round(x), Math.round(y), w, h)
        dispatch({
          type: 'place',
          magnet: {
            id: newMagnetId(),
            text: held.text,
            sticker: held.sticker,
            photo: held.photo,
            x: spot.x,
            y: spot.y,
            rotate: randomTilt(),
          },
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

  // Share today's poem as it is right now.
  function share() {
    if (!placed.length) {
      toast.show("Add some words to today's poem first")
      return
    }
    refreshToday()
    onShare()
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
    <div className={`screen poem-screen ${isDarkFinish(fridgeStyle) ? 'on-dark' : ''}`} ref={screenRef}>
      {/* the fridge's finish, from the style picked in Customize */}
      <FridgeBackground style={fridgeStyle} />

      {/* undo on top, then share and the star, stacked like the day view's back / share / star column */}
      <div className="tool-column tool-column--poem">
        {/* Figma "undo" icon (75:5214): steps back through adds, moves and removals */}
        <motion.button
          className="icon-btn"
          aria-label="Undo"
          disabled={!canUndo}
          animate={{ opacity: canUndo ? 1 : 0.3 }}
          whileTap={canUndo ? { scale: 0.88, rotate: -12 } : undefined}
          onClick={() => {
            dispatch({ type: 'undo' })
            navigator.vibrate?.(8)
          }}
        >
          <Icon name="undo" size={35} />
        </motion.button>
        <button className="icon-btn" aria-label="Share today's poem" onClick={share}>
          <Icon name="shareUp" size={35} />
        </button>
        <StarButton pinned={pinned} onClick={star} />
      </div>

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

      {/* each magnet is layered on its own (see .fridge-magnet), so only the one being dragged rides
          above the drawer to be dropped there, and magnets the open drawer covers stay hidden under it */}
      <div className="magnets">
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
              onDrop={(id, x, y, rotate, pageY, w, h) => {
                if (isOverDrawer(pageY)) dispatch({ type: 'remove', id })
                else {
                  // landed on another magnet: it slides over beside it
                  const spot = settle(id, x, y, w, h)
                  dispatch({ type: 'move', id, x: spot.x, y: spot.y, rotate })
                }
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
        onNotice={toast.show}
        photosOff={privacy.photos === 'off'}
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
            <MagnetFace text={held.text} sticker={held.sticker} photo={held.photo} />
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
