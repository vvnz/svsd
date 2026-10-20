import { AnimatePresence, motion } from 'motion/react'

import { MagnetFace } from './Magnet'
import type { PiledMagnet } from '../state/useFridge'

// Figma "Tap to Collect Interaction" (158:4883): tapped words drop into a messy pile
// at the bottom of the screen; tap the pile to throw them all onto the fridge.

// Offsets and tilts from the Figma pile, so it looks hand-stacked. The newest word is on top.
const SLOTS = [
  { x: 0, y: 0, rotate: -8.8 },
  { x: -3, y: 9, rotate: 8.4 },
  { x: 1, y: 6, rotate: 0 },
  { x: -1, y: 11, rotate: 9.1 },
  { x: 3, y: 4, rotate: -4 },
]
const SHOWN = SLOTS.length // older words hide under the top few
const HEIGHT = 52 // the Figma pile is about 52px tall

const DROP = { type: 'spring', stiffness: 300, damping: 24 } as const

type Props = {
  pile: PiledMagnet[]
  centerX: number
  /** where the pile's bottom edge sits, from the top of the screen */
  bottom: number
  /** where each newly collected word flew in from, relative to the screen */
  spawnFrom: Map<string, { x: number; y: number }>
  onRelease: () => void
}

export function MagnetPile({ pile, centerX, bottom, spawnFrom, onRelease }: Props) {
  const top = bottom - HEIGHT
  const shown = pile.slice(-SHOWN)

  return (
    <AnimatePresence>
      {pile.length > 0 && (
        <motion.button
          className="pile"
          aria-label={`Put ${pile.length} collected ${pile.length === 1 ? 'magnet' : 'magnets'} on the fridge`}
          style={{ left: centerX }}
          initial={false}
          animate={{ top }}
          exit={{ opacity: 0, transition: { duration: 0.12 } }}
          transition={DROP}
          whileTap={{ scale: 0.94 }}
          onClick={onRelease}
        >
          {shown.map((m, i) => {
            // newest word takes the top slot; older ones shuffle down the stack
            const slot = SLOTS[shown.length - 1 - i]!
            const from = spawnFrom.get(m.id)
            return (
              <motion.span
                key={m.id}
                className="pile__item"
                initial={from ? { x: from.x - centerX, y: from.y - top, rotate: 0, scale: 1.08 } : false}
                animate={{ x: slot.x, y: slot.y, rotate: slot.rotate, scale: 1 }}
                transition={DROP}
                onAnimationComplete={() => spawnFrom.delete(m.id)}
              >
                <MagnetFace text={m.text} sticker={m.sticker} />
              </motion.span>
            )
          })}
        </motion.button>
      )}
    </AnimatePresence>
  )
}
