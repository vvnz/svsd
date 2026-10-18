import type { CSSProperties } from 'react'

import photoDinner from '../assets/images/photo-dinner.png'

// A day on the calendar. Days with a poem are little hand-drawn magnet tiles (a key cap with
// its depth showing on the lower left, as in Figma "Calendar"); photo days show the photo;
// days without a poem are just the number.
type Props = {
  day: number
  kind: 'poem' | 'photo' | 'plain' | 'outside'
  selected?: boolean
  today?: boolean
  /** a stable tilt per date, in degrees */
  tilt?: number
  size?: number
  style?: CSSProperties
}

export function CalendarTile({ day, kind, selected = false, today = false, tilt = 0, size = 36, style }: Props) {
  const s = size / 36
  if (kind === 'photo') {
    return (
      <span className="cal-tile cal-tile--photo" style={{ width: size, height: size, ...style }}>
        <img src={photoDinner} alt="" draggable={false} style={{ width: 24 * s, transform: `rotate(${tilt}deg)` }} />
      </span>
    )
  }
  if (kind !== 'poem') {
    return (
      <span
        className={`cal-tile cal-tile--${kind}`}
        style={{ width: size, height: size, fontSize: 19 * s, ...style }}
      >
        {today && (
          <svg className="cal-tile__circle" viewBox="0 0 36 36" aria-hidden>
            <path
              d="M18.6 4.2C11 3.6 5 9.2 4.6 16.8c-.4 7.6 5.4 13.8 12.8 14.2 7.6.4 13.6-5.2 14-12.6.4-7.2-4.6-13.4-12-14.4-3-.4-6 .2-8.4 1.6"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
          </svg>
        )}
        <span className="cal-tile__num">{day}</span>
      </span>
    )
  }
  return (
    <span
      className={`cal-tile cal-tile--poem ${selected ? 'is-selected' : ''}`}
      style={{ width: size, height: size, ...style }}
    >
      <svg viewBox="0 0 36 36" style={{ transform: `rotate(${tilt}deg)` }} aria-hidden>
        {/* depth, peeking out on the lower left */}
        <path
          className="cal-tile__depth"
          d="M8.4 9.6 4.9 13.2c-.5.5-.7 1.1-.7 1.8l.2 14.3c0 1.3 1 2.3 2.3 2.3l21.6.2c.7 0 1.3-.3 1.8-.8l3.2-3.4"
          strokeLinejoin="round"
        />
        <rect className="cal-tile__face" x="8.2" y="5.2" width="25" height="22.4" rx="2.4" />
        <text x="20.7" y="23.6" textAnchor="middle" className="cal-tile__text">
          {day}
        </text>
      </svg>
    </span>
  )
}

// Same tilt for the same date every time, a mix of slight and big turns like the hand-placed design
export function tiltFor(date: string) {
  let h = 0
  for (const c of date) h = (h * 31 + c.charCodeAt(0)) % 997
  const options = [0, -4, 3, -8, 6, 0, -3, 9, -6, 2]
  return options[h % options.length]!
}
