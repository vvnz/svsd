import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import { AnimatePresence, animate, motion, useDragControls, useMotionValue, useTransform, type PanInfo } from 'motion/react'

import { Icon } from './Icon'
import { Magnet } from './Magnet'
import type { BankWord } from '../data/wordBank'

export type DrawerSnap = 'collapsed' | 'half' | 'full'

type Tab = 'words' | 'stickers' | 'images'

type Props = {
  screenHeight: number
  snap: DrawerSnap
  onSnapChange: (snap: DrawerSnap) => void
  words: BankWord[]
  /** how many of each word (by id) are waiting in the pile */
  pileCounts: Map<string, number>
  removeHint: boolean
  onPick: (word: BankWord, rect: DOMRect) => void
  /** a word was held long enough to drag it out onto the fridge; the screen takes over from here */
  onHold: (word: BankWord, point: { x: number; y: number }) => void
}

// Long enough that a normal swipe through the words scrolls instead of grabbing one.
const HOLD_MS = 350
const HOLD_SLOP = 8 // px the finger may wander during the hold before it counts as a scroll

// Figma lays each row of three out with equal gaps between them (space-between).
function rowsOf<T>(items: T[], n: number): T[][] {
  const rows: T[][] = []
  for (let i = 0; i < items.length; i += n) rows.push(items.slice(i, i + n))
  return rows
}

// Where the top edge of the drawer sits for each snap point.
// Figma: collapsed bar is 80px tall, half sheet 455px of 874, full sheet starts 32px from the top.
export function drawerTop(snap: DrawerSnap, screenHeight: number) {
  if (snap === 'collapsed') return screenHeight - 80
  if (snap === 'half') return screenHeight - Math.round(screenHeight * (455 / 874))
  return 32
}

const SPRING = { type: 'spring', stiffness: 380, damping: 38 } as const

export function MagnetDrawer({
  screenHeight,
  snap,
  onSnapChange,
  words,
  pileCounts,
  removeHint,
  onPick,
  onHold,
}: Props) {
  const [tab, setTab] = useState<Tab>('words')
  const y = useMotionValue(drawerTop(snap, screenHeight))
  // Figma: the closed drawer is just the "Add Magnets" bar, so the tabs and words
  // fade in as the drawer is pulled up instead of peeking out below it
  const collapsedTop = drawerTop('collapsed', screenHeight)
  const contentOpacity = useTransform(y, [collapsedTop, collapsedTop - 60], [0, 1])
  const dragControls = useDragControls()
  const draggedRef = useRef(false)
  const bodyRef = useRef<HTMLDivElement>(null)
  const hold = useRef<{ timer: number; x: number; y: number } | null>(null)
  // true from the moment a word is grabbed until the finger lifts
  const grabbing = useRef(false)
  // the click that ends a grab shouldn't also collect the word
  const skipClick = useRef(false)

  // Once a word is grabbed, stop the list from scrolling under the finger.
  // (Has to be a non-passive listener that's already there when the touch starts.)
  useEffect(() => {
    const el = bodyRef.current
    if (!el) return
    const block = (e: TouchEvent) => {
      if (grabbing.current) e.preventDefault()
    }
    el.addEventListener('touchmove', block, { passive: false })
    return () => el.removeEventListener('touchmove', block)
  }, [])

  useEffect(() => {
    const end = () => {
      if (hold.current) window.clearTimeout(hold.current.timer)
      hold.current = null
      grabbing.current = false
    }
    window.addEventListener('pointerup', end)
    window.addEventListener('pointercancel', end)
    return () => {
      end()
      window.removeEventListener('pointerup', end)
      window.removeEventListener('pointercancel', end)
    }
  }, [])

  function startHold(w: BankWord, e: ReactPointerEvent) {
    if (hold.current) window.clearTimeout(hold.current.timer)
    const point = { x: e.clientX, y: e.clientY }
    const timer = window.setTimeout(() => {
      hold.current = null
      grabbing.current = true
      skipClick.current = true
      navigator.vibrate?.(12)
      onHold(w, point)
    }, HOLD_MS)
    hold.current = { timer, ...point }
  }

  function moveHold(e: ReactPointerEvent) {
    const h = hold.current
    if (h && Math.hypot(e.clientX - h.x, e.clientY - h.y) > HOLD_SLOP) {
      window.clearTimeout(h.timer)
      hold.current = null
    }
  }

  useEffect(() => {
    void animate(y, drawerTop(snap, screenHeight), SPRING)
  }, [snap, screenHeight, y])

  function handleDragEnd(_: unknown, info: PanInfo) {
    // pick the nearest snap point, nudged by how fast the drawer was flicked
    const projected = y.get() + info.velocity.y * 0.15
    const snaps: DrawerSnap[] = ['full', 'half', 'collapsed']
    let best: DrawerSnap = snap
    let bestDist = Infinity
    for (const s of snaps) {
      const d = Math.abs(drawerTop(s, screenHeight) - projected)
      if (d < bestDist) {
        bestDist = d
        best = s
      }
    }
    if (best === snap) void animate(y, drawerTop(snap, screenHeight), SPRING)
    onSnapChange(best)
  }

  function startDrag(e: ReactPointerEvent) {
    dragControls.start(e)
  }

  return (
    <motion.section
      className={`drawer ${removeHint ? 'drawer--remove' : ''}`}
      style={{ y, height: screenHeight - 32 }}
      drag="y"
      dragListener={false}
      dragControls={dragControls}
      dragConstraints={{ top: drawerTop('full', screenHeight), bottom: drawerTop('collapsed', screenHeight) }}
      dragElastic={0.08}
      dragMomentum={false}
      onDragStart={() => {
        draggedRef.current = true
      }}
      onDragEnd={handleDragEnd}
      aria-label="Add magnets"
    >
      <header
        className="drawer__header"
        onPointerDown={startDrag}
        onClick={() => {
          // a drag also ends in a click, so only toggle on a real tap
          if (draggedRef.current) {
            draggedRef.current = false
            return
          }
          onSnapChange(snap === 'collapsed' ? 'half' : 'collapsed')
        }}
      >
        <span className="drawer__grabber" />
        <span className="drawer__title">{removeHint ? 'Drop here to remove' : 'Add Magnets'}</span>
      </header>

      <motion.div
        className="drawer__toolbar"
        style={{ opacity: contentOpacity }}
        inert={snap === 'collapsed'}
      >
        <div className="drawer__tabs" role="tablist">
          <button
            role="tab"
            aria-selected={tab === 'words'}
            className={`tab ${tab === 'words' ? 'tab--active' : ''}`}
            onClick={() => setTab('words')}
          >
            <Icon name="tabWords" size={17} />
            {tab === 'words' && <span>Words</span>}
          </button>
          <button
            role="tab"
            aria-selected={tab === 'stickers'}
            aria-label="Stickers"
            className={`tab ${tab === 'stickers' ? 'tab--active' : ''}`}
            onClick={() => setTab('stickers')}
          >
            <Icon name="tabStickers" size={18} />
            {tab === 'stickers' && <span>Stickers</span>}
          </button>
          <button
            role="tab"
            aria-selected={tab === 'images'}
            aria-label="Images"
            className={`tab ${tab === 'images' ? 'tab--active' : ''}`}
            onClick={() => setTab('images')}
          >
            <Icon name="tabImages" size={18} />
            {tab === 'images' && <span>Images</span>}
          </button>
        </div>
      </motion.div>

      {/* only the part of the drawer that is on screen scrolls */}
      <motion.div
        ref={bodyRef}
        className="drawer__body"
        style={{ height: screenHeight - drawerTop(snap, screenHeight) - 130, opacity: contentOpacity }}
        inert={snap === 'collapsed'}
      >
        {tab === 'words' ? (
          // words can be used as often as you like, so they never run out.
          // Tap to collect; hold and drag to put one straight on the fridge.
          <div className="bank">
            {rowsOf(words, 3).map((row) => (
              <div key={row[0]!.id} className="bank__row">
                {row.map((w) => {
                  const count = pileCounts.get(w.id) ?? 0
                  return (
                    <motion.button
                      key={w.id}
                      className="bank__item"
                      whileTap={{ scale: 0.94 }}
                      onPointerDown={(e) => startHold(w, e)}
                      onPointerMove={moveHold}
                      onContextMenu={(e) => e.preventDefault()}
                      onClick={(e) => {
                        if (skipClick.current) {
                          skipClick.current = false
                          return
                        }
                        onPick(w, e.currentTarget.getBoundingClientRect())
                      }}
                      aria-label={`Collect ${w.text}`}
                    >
                      <Magnet text={w.text} />
                      <AnimatePresence>
                        {count > 0 && (
                          // Figma: a small black badge with the number in the pile
                          <motion.span
                            key="badge"
                            className="bank__badge"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0 }}
                            transition={{ duration: 0.16, ease: 'easeOut' }}
                            aria-label={`${count} in the pile`}
                          >
                            {count}
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </motion.button>
                  )
                })}
              </div>
            ))}
          </div>
        ) : (
          <p className="drawer__note drawer__note--empty">
            {tab === 'stickers' ? 'Stickers are coming soon.' : 'Images are coming soon.'}
          </p>
        )}
      </motion.div>
      {snap !== 'collapsed' && (
        <div
          className="drawer__fade"
          aria-hidden
          style={{ top: screenHeight - drawerTop(snap, screenHeight) - 120 }}
        />
      )}
    </motion.section>
  )
}
