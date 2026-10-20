import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'

import { AddFavouritePanel } from '../components/AddFavouritePanel'

import { Fridge, SLOT_MIN_SCALE, SLOT_SCALE, slotsFor } from '../components/Fridge'
import { FitPoem, fittedRect } from '../components/PoemCanvas'
import { Icon } from '../components/Icon'
import { useToast } from '../components/Toast'
import { useApp } from '../state/appState'
import { todayKey } from '../state/useFridge'
import { useScreenSize } from '../state/useScreenSize'
import { prettyDate } from './ViewPoemScreen'

type Props = {
  draft: (string | null)[]
  onChange: (draft: (string | null)[]) => void
  onCancel: () => void
  onSave: () => void
  /** a poem waiting to go on a full fridge: tapping a poem's badge swaps it for this one */
  swapIn?: string
}

// Figma "Fridge - Edit Favourites" (43:370): the fridge zooms in and every poem gets a remove badge.
// Changes stay a draft until Save.
const ZOOM = 1.5

export function EditFavouritesScreen({ draft, onChange, onCancel, onSave, swapIn }: Props) {
  const { fridgeStyle, poemFor, poems } = useApp()
  // the search panel is open: which empty spot it fills (the + on top fills the first free one)
  const [adding, setAdding] = useState<number | null>(null)
  const [ref, size] = useScreenSize()
  const toast = useToast()
  const full = !draft.includes(null)
  const swapping = !!swapIn && !draft.includes(swapIn)
  // the zoomed fridge fills the width, so the handle and every badge stay in view
  const left = Math.round((size.width - 268 * ZOOM) / 2)

  return (
    <div className="screen" ref={ref}>
      {/* back on top, like the other icon columns */}
      <div className="tool-column tool-column--edit">
        <button className="icon-btn" aria-label="Cancel" onClick={onCancel}>
          <Icon name="chevronLeft" size={35} />
        </button>
        <button
          className="icon-btn"
          aria-label="Add a favourite"
          onClick={() => (full ? toast.show('Your fridge is full, remove one first') : setAdding(draft.indexOf(null)))}
        >
          <Icon name="plus" size={35} />
        </button>
      </div>
      <button className="text-btn top-right" onClick={onSave}>
        Save
      </button>
      {swapIn && (
        <p className="swap-hint">
          {swapping ? `Pick one to swap for ${swapIn === todayKey() ? "today's poem" : prettyDate(swapIn!, true)}` : 'Swapped in! Tap Save to keep it'}
        </p>
      )}

      <motion.div
        className="fav-fridge"
        style={{ left, top: 160 }}
        initial={{ scale: 0.6, opacity: 0.4 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 220, damping: 26 }}
      >
        <Fridge style={fridgeStyle} scale={ZOOM}>
          <AnimatePresence>
            {draft.map((date, i) => {
              const poem = date ? poemFor(date) : undefined
              const slot = slotsFor(fridgeStyle)[i]!
              if (!poem || !date) return null
              const r = fittedRect(poem, slot, SLOT_SCALE, false, SLOT_MIN_SCALE) ?? slot
              return (
                <motion.div
                  key={date}
                  className="edit-slot"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.6, transition: { duration: 0.2 } }}
                  style={{ transformOrigin: `${r.x + r.w / 2}px ${r.y + r.h / 2}px` }}
                >
                  <FitPoem poem={poem} box={slot} maxScale={SLOT_SCALE} minScale={SLOT_MIN_SCALE} />
                  <motion.button
                    className="remove-badge"
                    style={{ left: r.x + r.w - 2, top: r.y - 13 }}
                    aria-label={swapping ? "Swap this for today's poem" : 'Remove from favourites'}
                    whileTap={{ scale: 0.85 }}
                    // swapping: today's poem takes this slot; otherwise the slot just empties
                    onClick={() => onChange(draft.map((d, j) => (j === i ? (swapping ? swapIn! : null) : d)))}
                  >
                    <Icon name="minus" size={12} />
                  </motion.button>
                </motion.div>
              )
            })}
          </AnimatePresence>
          {draft.map((date, i) => {
            const slot = slotsFor(fridgeStyle)[i]!
            return date ? null : (
              <button
                key={`empty-${i}`}
                className="empty-slot"
                style={{ left: slot.x + slot.w / 2 - 14, top: slot.y + slot.h / 2 - 14 }}
                aria-label="Add a favourite here"
                onClick={() => setAdding(i)}
              >
                <Icon name="plus" size={14} />
              </button>
            )
          })}
        </Fridge>
      </motion.div>
      <AnimatePresence>
        {adding !== null && (
          <AddFavouritePanel
            poems={poems}
            exclude={draft}
            onClose={() => setAdding(null)}
            onPick={(date) => {
              onChange(draft.map((d, j) => (j === adding ? date : d)))
              setAdding(null)
              navigator.vibrate?.(10)
            }}
          />
        )}
      </AnimatePresence>
      {toast.node}
    </div>
  )
}
