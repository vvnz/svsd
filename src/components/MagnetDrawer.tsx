import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import { animate, motion, useDragControls, useMotionValue, type PanInfo } from 'motion/react'

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
  usedIds: Set<string>
  isFull: boolean
  placedCount: number
  maxWords: number
  removeHint: boolean
  onPick: (word: BankWord, rect: DOMRect) => void
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
  usedIds,
  isFull,
  placedCount,
  maxWords,
  removeHint,
  onPick,
}: Props) {
  const [tab, setTab] = useState<Tab>('words')
  const y = useMotionValue(drawerTop(snap, screenHeight))
  const dragControls = useDragControls()
  const draggedRef = useRef(false)

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

      <div className="drawer__toolbar">
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
        {tab === 'words' && (
          <span className={`drawer__count ${isFull ? 'drawer__count--full' : ''}`}>
            {placedCount}/{maxWords}
          </span>
        )}
      </div>

      {/* only the part of the drawer that is on screen scrolls */}
      <div className="drawer__body" style={{ height: screenHeight - drawerTop(snap, screenHeight) - 130 }}>
        {tab === 'words' ? (
          <>
            {isFull && <p className="drawer__note">Your fridge is full. Drag a word down here to swap it out.</p>}
            <div className="bank">
              {words.map((w) => {
                const used = usedIds.has(w.id)
                const disabled = used || isFull
                return (
                  <motion.button
                    key={w.id}
                    className="bank__item"
                    disabled={disabled}
                    animate={{ opacity: used ? 0.22 : isFull ? 0.5 : 1 }}
                    whileTap={disabled ? undefined : { scale: 0.94 }}
                    onClick={(e) => onPick(w, e.currentTarget.getBoundingClientRect())}
                    aria-label={`Add ${w.text}`}
                  >
                    <Magnet text={w.text} />
                  </motion.button>
                )
              })}
            </div>
          </>
        ) : (
          <p className="drawer__note drawer__note--empty">
            {tab === 'stickers' ? 'Stickers are coming soon.' : 'Images are coming soon.'}
          </p>
        )}
      </div>
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
