import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'

import { CalendarTile, tiltFor } from '../components/CalendarTile'
import { FitPoem } from '../components/PoemCanvas'
import { Icon } from '../components/Icon'
import { StarButton } from '../components/StarButton'
import { SteelBackdrop } from '../components/SteelBackdrop'
import { useToast } from '../components/Toast'
import { useApp } from '../state/appState'
import { useScreenSize } from '../state/useScreenSize'
import { prettyDate } from './ViewPoemScreen'

type Props = {
  date: string
  onDate: (date: string) => void
  onBack: () => void
  onShare: (date: string) => void
  /** starred this poem, but all 6 favourites are taken: pick one to swap out */
  onFavouritesFull: (date: string) => void
}

// Figma calendar day view (54:3592): one day's poem, with a strip of day tiles to flip through.
export function DayScreen({ date, onDate, onBack, onShare, onFavouritesFull }: Props) {
  const { poems, poemFor, favourites, toggleFavourite } = useApp()
  const [ref, size] = useScreenSize()
  const toast = useToast()
  const stripRef = useRef<HTMLDivElement>(null)
  const [dir, setDir] = useState(1)
  const poem = poemFor(date)
  const index = poems.findIndex((p) => p.date === date)
  const pinned = favourites.includes(date)

  // keep the selected tile in the middle of the strip
  useEffect(() => {
    const el = stripRef.current?.querySelector<HTMLElement>('.is-current')
    el?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
  }, [date])

  function step(d: number) {
    const next = poems[index + d]
    if (!next) return
    setDir(d)
    onDate(next.date)
  }

  function star() {
    if (!pinned && !favourites.includes(null)) {
      onFavouritesFull(date)
      return
    }
    toggleFavourite(date)
    toast.show(pinned ? 'Taken off your fridge' : 'Pinned to your favourites')
  }

  const month = date.slice(0, 7)

  return (
    <div className="screen day-screen" ref={ref}>
      <SteelBackdrop />

      <div className="tool-column tool-column--day">
        <button className="icon-btn" aria-label="Back to calendar" onClick={onBack}>
          <Icon name="chevronLeft" size={40} />
        </button>
        <button className="icon-btn" aria-label="Share this poem" onClick={() => onShare(date)}>
          <Icon name="shareUp" size={40} />
        </button>
        <StarButton pinned={pinned} onClick={star} />
      </div>
      <p className="poem-date">{prettyDate(date)}</p>

      <AnimatePresence initial={false} custom={dir} mode="popLayout">
        {poem && (
          <motion.div
            key={date}
            className="poem-stage"
            custom={dir}
            variants={{
              enter: (d: number) => ({ x: d * 120, opacity: 0 }),
              center: { x: 0, opacity: 1 },
              exit: (d: number) => ({ x: d * -120, opacity: 0 }),
            }}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: 'spring', stiffness: 320, damping: 32 }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.3}
            onDragEnd={(_, info) => {
              if (info.offset.x < -60) step(1)
              else if (info.offset.x > 60) step(-1)
            }}
          >
            <FitPoem poem={poem} box={{ x: 24, y: 120, w: size.width - 48, h: size.height - 120 - 190 }} />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="day-strip">
        <p className="day-strip__month">
          {new Date(`${month}-15T12:00`).toLocaleDateString('en-US', { month: 'long' }).toLowerCase()}
        </p>
        <div className="day-strip__scroller" ref={stripRef}>
          {poems.map((p, i) => (
            <motion.button
              key={p.date}
              className={`day-strip__tile ${p.date === date ? 'is-current' : ''}`}
              aria-label={p.date}
              whileTap={{ scale: 0.9 }}
              onClick={() => {
                setDir(i > index ? 1 : -1)
                onDate(p.date)
              }}
            >
              <CalendarTile
                day={Number(p.date.slice(8))}
                kind="poem"
                selected={p.date === date}
                tilt={tiltFor(p.date)}
                size={68}
              />
            </motion.button>
          ))}
        </div>
      </div>
      {toast.node}
    </div>
  )
}
