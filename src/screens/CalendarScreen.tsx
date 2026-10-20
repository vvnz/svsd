import { motion } from 'motion/react'

import { CalendarTile, tiltFor, wordMagnetFor } from '../components/CalendarTile'
import { SideMenu, type MenuId } from '../components/SideMenu'
import { useToast } from '../components/Toast'
import { useApp } from '../state/appState'
import { todayKey } from '../state/useFridge'
import { useScreenSize } from '../state/useScreenSize'

const MONTHS = [
  { year: 2026, month: 8 }, // September (0-based months)
  { year: 2026, month: 9 },
  { year: 2026, month: 10 },
]
const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']
const CELL = 44

const key = (y: number, m: number, d: number) =>
  `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`

type Props = {
  onMenu: (id: MenuId) => void
  onOpenDay: (date: string) => void
}

// Figma "Calendar" (46:593): every day you made a poem becomes a little magnet tile.
export function CalendarScreen({ onMenu, onOpenDay }: Props) {
  const { poemFor } = useApp()
  const [ref, size] = useScreenSize()
  const toast = useToast()
  const today = todayKey()
  const left = Math.round((size.width - CELL * 7) / 2)
  let tileIndex = 0

  function tap(date: string, hasPoem: boolean) {
    // today opens in the day view like any other day, once it has some words
    if (hasPoem) onOpenDay(date)
    else if (date === today) toast.show("Add some words to today's poem first")
  }

  return (
    <div className="screen" ref={ref}>
      <SideMenu screenWidth={size.width} current="calendar" onSelect={onMenu} />

      <div className="calendar" style={{ paddingTop: 34 }}>
        {MONTHS.map(({ year, month }) => {
          const first = new Date(year, month, 1).getDay()
          const days = new Date(year, month + 1, 0).getDate()
          const prevDays = new Date(year, month, 0).getDate()
          const cells: { d: number; date: string; outside: boolean }[] = []
          for (let i = first - 1; i >= 0; i--) cells.push({ d: prevDays - i, date: key(year, month - 1, prevDays - i), outside: true })
          for (let d = 1; d <= days; d++) cells.push({ d, date: key(year, month, d), outside: false })
          const name = new Date(year, month, 1).toLocaleDateString('en-US', { month: 'long' })

          return (
            <section key={month} className="month" style={{ paddingLeft: left }}>
              <h2 className="month__title" style={{ width: CELL * 7 }}>
                {name}
              </h2>
              <div className="month__grid">
                {WEEKDAYS.map((w, i) => (
                  <span key={i} className="month__weekday">
                    {w}
                  </span>
                ))}
                {cells.map(({ d, date, outside }) => {
                  const poem = outside ? undefined : poemFor(date)
                  const kind = outside ? 'outside' : poem?.photo ? 'photo' : poem ? 'poem' : 'plain'
                  const isToday = date === today
                  const tappable = !!poem || isToday
                  const i = tileIndex++
                  return (
                    <motion.button
                      key={date + (outside ? 'o' : '')}
                      className={`month__day ${tappable ? '' : 'is-inert'}`}
                      disabled={!tappable}
                      aria-label={date}
                      onClick={() => tap(date, !!poem)}
                      initial={kind === 'poem' || kind === 'photo' ? { scale: 0.4, opacity: 0, y: -6 } : false}
                      animate={{ scale: 1, opacity: 1, y: 0 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 22, delay: Math.min(i * 0.012, 0.6) }}
                      whileTap={tappable ? { scale: 0.88 } : undefined}
                    >
                      <CalendarTile
                        day={d}
                        // today is always just its number, circled, even once it has a poem
                        kind={isToday ? 'plain' : kind}
                        today={isToday}
                        tilt={tiltFor(date)}
                        variant={wordMagnetFor(date)}
                        size={CELL}
                      />
                    </motion.button>
                  )
                })}
              </div>
            </section>
          )
        })}
      </div>
      <div className="calendar__fade" />
      {toast.node}
    </div>
  )
}
