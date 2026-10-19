import { motion } from 'motion/react'

import { FitPoem, PoemCanvas, poemBounds } from '../components/PoemCanvas'
import { Icon } from '../components/Icon'
import { SteelBackdrop } from '../components/SteelBackdrop'
import { useApp } from '../state/appState'
import { useScreenSize } from '../state/useScreenSize'

type Props = { date: string; onShare: () => void; onBack: () => void }

// Figma "Fridge - View Favourite" (43:584): one favourite, full size, on brushed steel.
// Viewing doesn't change anything, so it has a back button rather than Figma's "Save".
export function ViewPoemScreen({ date, onShare, onBack }: Props) {
  const { poemFor } = useApp()
  const poem = poemFor(date)
  const [ref, size] = useScreenSize()
  const b = poem ? poemBounds(poem) : null
  // poems are laid out for a full phone screen; only shrink if this screen is shorter
  const fits = b && b.y + b.h <= size.height - 16 && b.x + b.w <= size.width

  return (
    <div className="screen" ref={ref}>
      <SteelBackdrop />
      <button className="icon-btn top-left" aria-label="Back" onClick={onBack}>
        <Icon name="back" size={24} />
      </button>
      <button className="icon-btn top-right" aria-label="Share this poem" onClick={onShare}>
        <Icon name="shareUp" size={24} />
      </button>
      <p className="poem-date">{prettyDate(date)}</p>

      {poem && (
        <motion.div
          className="poem-stage"
          initial={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 240, damping: 24 }}
        >
          {fits ? (
            <PoemCanvas poem={poem} />
          ) : (
            <FitPoem poem={poem} box={{ x: 20, y: 90, w: size.width - 40, h: size.height - 120 }} />
          )}
        </motion.div>
      )}
    </div>
  )
}

export function prettyDate(date: string, withYear = false) {
  const [y, m, d] = date.split('-').map(Number)
  return new Date(y!, m! - 1, d!).toLocaleDateString('en-US', {
    weekday: withYear ? undefined : 'long',
    month: 'long',
    day: 'numeric',
    year: withYear ? 'numeric' : undefined,
  }).toLowerCase()
}
