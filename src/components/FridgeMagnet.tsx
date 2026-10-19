import { useEffect, useRef } from 'react'
import { animate, motion, useMotionValue } from 'motion/react'

import { Magnet } from './Magnet'
import type { PlacedMagnet } from '../state/useFridge'

type Props = {
  magnet: PlacedMagnet
  spawnFrom?: { x: number; y: number }
  /** seconds to wait before flying in, so a released pile scatters one after another */
  spawnDelay?: number
  bounds: { width: number; height: number }
  /** Delete Mode: magnets wiggle, can't be dragged, and a tap deletes */
  deleteMode?: boolean
  onLongPress?: () => void
  onDelete?: (id: string) => void
  onDragStateChange: (dragging: boolean, clientY?: number) => void
  onDrop: (id: string, x: number, y: number, rotate: number, clientY: number) => void
}

// A loose magnet tilt, like one stuck on in a hurry.
export const randomTilt = () => Math.round((Math.random() * 6 - 3) * 10) / 10

// Settles with a little overshoot, like a magnet clicking onto metal.
const SETTLE = { type: 'spring', stiffness: 520, damping: 14, mass: 0.6 } as const
const FLY = { type: 'spring', stiffness: 260, damping: 26 } as const

const LONG_PRESS_MS = 450

// A steady per-magnet offset, so they don't all wiggle in sync.
const wiggleDelay = (id: string) => ([...id].reduce((n, c) => n + c.charCodeAt(0), 0) % 7) * 0.045

export function FridgeMagnet({
  magnet,
  spawnFrom,
  spawnDelay = 0,
  bounds,
  deleteMode = false,
  onLongPress,
  onDelete,
  onDragStateChange,
  onDrop,
}: Props) {
  const x = useMotionValue(spawnFrom?.x ?? magnet.x)
  const y = useMotionValue(spawnFrom?.y ?? magnet.y)
  const rotate = useMotionValue(spawnFrom ? 0 : magnet.rotate)
  const ref = useRef<HTMLDivElement>(null)
  // where this magnet last put itself, so a drop doesn't re-trigger the glide below
  const settled = useRef({ x: magnet.x, y: magnet.y, rotate: magnet.rotate })
  const press = useRef<{ timer: number; x: number; y: number } | null>(null)
  // the press that opened Delete Mode shouldn't also delete this magnet when it lifts
  const justOpened = useRef(false)

  const cancelPress = () => {
    if (press.current) window.clearTimeout(press.current.timer)
    press.current = null
  }
  useEffect(() => cancelPress, [])

  // Fly in from the pile on first mount.
  useEffect(() => {
    if (!spawnFrom) return
    void animate(x, magnet.x, { ...FLY, delay: spawnDelay })
    void animate(y, magnet.y, { ...FLY, delay: spawnDelay })
    void animate(rotate, magnet.rotate, { ...SETTLE, delay: spawnDelay + 0.18 })
    // runs only on mount, on purpose
  }, [])

  // Moved from outside (undo): glide back to the saved spot.
  useEffect(() => {
    const s = settled.current
    if (s.x === magnet.x && s.y === magnet.y && s.rotate === magnet.rotate) return
    settled.current = { x: magnet.x, y: magnet.y, rotate: magnet.rotate }
    void animate(x, magnet.x, FLY)
    void animate(y, magnet.y, FLY)
    void animate(rotate, magnet.rotate, SETTLE)
  }, [magnet.x, magnet.y, magnet.rotate, x, y, rotate])

  return (
    <motion.div
      ref={ref}
      className="fridge-magnet"
      style={{ x, y, rotate }}
      drag={!deleteMode}
      dragMomentum={false}
      dragElastic={0}
      whileDrag={{ scale: 1.08, zIndex: 50, cursor: 'grabbing' }}
      exit={{ scale: 0.4, opacity: 0, transition: { duration: 0.18 } }}
      // hold still for a moment to open Delete Mode; moving turns it into a drag instead
      onPointerDown={(e) => {
        if (deleteMode || !onLongPress) return
        cancelPress()
        const timer = window.setTimeout(() => {
          press.current = null
          justOpened.current = true
          navigator.vibrate?.(15)
          onLongPress()
        }, LONG_PRESS_MS)
        press.current = { timer, x: e.clientX, y: e.clientY }
      }}
      onPointerMove={(e) => {
        const p = press.current
        if (p && Math.hypot(e.clientX - p.x, e.clientY - p.y) > 6) cancelPress()
      }}
      onPointerUp={cancelPress}
      onPointerCancel={cancelPress}
      onTap={() => {
        if (justOpened.current) {
          justOpened.current = false
          return
        }
        if (deleteMode) {
          navigator.vibrate?.(8)
          onDelete?.(magnet.id)
        }
      }}
      onDragStart={() => {
        cancelPress()
        void animate(rotate, 0, { duration: 0.12 })
        onDragStateChange(true)
      }}
      onDrag={(_, info) => onDragStateChange(true, info.point.y)}
      onDragEnd={(_, info) => {
        onDragStateChange(false)
        const el = ref.current
        const w = el?.offsetWidth ?? 60
        const h = el?.offsetHeight ?? 36
        // keep the magnet on the fridge
        const nx = Math.min(Math.max(x.get(), 8), bounds.width - w - 8)
        const ny = Math.min(Math.max(y.get(), 8), bounds.height - h - 8)
        void animate(x, nx, SETTLE)
        void animate(y, ny, SETTLE)
        const tilt = randomTilt()
        void animate(rotate, tilt, SETTLE)
        settled.current = { x: nx, y: ny, rotate: tilt }
        onDrop(magnet.id, nx, ny, tilt, info.point.y)
      }}
    >
      {/* a gentle wiggle in Delete Mode, each magnet a little out of step */}
      <div
        className={deleteMode ? 'wiggle' : undefined}
        style={{ animationDelay: `${-wiggleDelay(magnet.id)}s` }}
      >
        <Magnet text={magnet.text} size="fridge" />
      </div>
    </motion.div>
  )
}
