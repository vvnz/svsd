import { motion } from 'motion/react'

import { CalendarTile, tiltFor } from '../components/CalendarTile'
import { Icon } from '../components/Icon'
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
  /** 'pick' when choosing a poem to pin from the edit favourites screen */
  mode: 'browse' | 'pick'
  onMenu: (id: MenuId) => void
  onOpenDay: (date: string) => void
  onToday: () => void
  onPick: (date: string) => void
  onCancelPick: () => void
}

// Figma "Calendar" (46:593): every day you made a poem becomes a little magnet tile.
export function CalendarScreen({ mode, onMenu, onOpenDay, onToday, onPick, onCancelPick }: Props) {
  const { poemFor, favourites } = useApp()
  const [ref, size] = useScreenSize()
  const toast = useToast()
  const today = todayKey()
  const left = Math.round((size.width - CELL * 7) / 2)
  let tileIndex = 0

  function tap(date: string, hasPoem: boolean) {
    if (mode === 'pick') {
      if (!hasPoem) return
      if (favourites.includes(date)) toast.show('That one is already on your fridge')
      else onPick(date)
      return
    }
    if (date === today) onToday()
    else if (hasPoem) onOpenDay(date)
  }

  return (
    <div className="screen" ref={ref}>
      {mode === 'pick' ? (
        <>
          <button className="icon-btn top-left" aria-label="Cancel" onClick={onCancelPick}>
            <Icon name="back" size={24} />
          </button>
          <p className="pick-hint">pick a poem to pin</p>
        </>
      ) : (
        <SideMenu screenWidth={size.width} current="calendar" onSelect={onMenu} />
      )}

      <div className="calendar" style={{ paddingTop: mode === 'pick' ? 64 : 34 }}>
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
                  const tappable = mode === 'pick' ? !!poem : !!poem || isToday
                  const i = tileIndex++
                  return (
                    <motion.button
                      key={date + (outside ? 'o' : '')}
                      className={`month__day ${tappable ? '' : 'is-inert'} ${mode === 'pick' && favourites.includes(date) ? 'is-pinned' : ''}`}
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
                        kind={isToday && !poem ? 'plain' : kind}
                        today={isToday}
                        tilt={tiltFor(date)}
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
