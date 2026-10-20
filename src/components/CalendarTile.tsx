import type { CSSProperties } from 'react'

import photoDinner from '../assets/images/photo-dinner.png'
import { WORD_MAGNETS } from '../data/wordMagnets'

// A day on the calendar. Days with a poem are hand-drawn word magnet blocks (Figma "word magnet"
// 220:5118, one of its three variants per day) with the number on the front face; photo days show
// the photo; days without a poem are just the number.
type Props = {
  day: number
  kind: 'poem' | 'photo' | 'plain' | 'outside'
  selected?: boolean
  today?: boolean
  /** a stable tilt per date, in degrees (photo days) */
  tilt?: number
  /** which word magnet variant to draw (poem days); see wordMagnetFor */
  variant?: number
  size?: number
  style?: CSSProperties
}

export function CalendarTile({ day, kind, selected = false, today = false, tilt = 0, variant = 0, size = 36, style }: Props) {
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
        {today && <TodayCircle />}
        <span className="cal-tile__num">{day}</span>
      </span>
    )
  }
  const magnet = WORD_MAGNETS[variant % WORD_MAGNETS.length]!
  const [cx, cy] = magnet.centre
  return (
    <span
      className={`cal-tile cal-tile--poem ${selected ? 'is-selected' : ''}`}
      style={{ width: size, height: size, ...style }}
    >
      <svg viewBox="0 0 24 24" aria-hidden>
        {/* the whole block, filled solid behind its lines */}
        <polygon className="cal-tile__body" points={magnet.outline} />
        <path className="cal-tile__face" d={magnet.face} />
        {magnet.edges.map((d, i) => (
          <path key={i} className="cal-tile__edge" d={d} />
        ))}
        {/* on the front face, tilted with it */}
        <text
          x={cx}
          y={cy}
          transform={`rotate(${magnet.angle} ${cx} ${cy})`}
          textAnchor="middle"
          dominantBaseline="central"
          className="cal-tile__text"
        >
          {day}
        </text>
      </svg>
    </span>
  )
}

// The hand-drawn circle that marks today, from Figma (33 x 32)
function TodayCircle() {
  return (
    <svg className="cal-tile__circle" viewBox="0 0 33 32" aria-hidden>
      <path
        d="M24.6999 3.59376C23.9459 3.10843 22.9725 2.58153 21.9662 2.15248C20.9599 1.72344 19.9567 1.38208 19.3567 1.22926C18.5867 1.03316 17.519 0.933375 15.9928 1.04943C14.8654 1.13516 13.964 1.25507 12.6698 1.82917C11.7593 2.23304 10.3865 2.90467 9.25837 3.57066C8.13023 4.23665 7.2727 4.87758 6.55402 5.49232C5.83533 6.10705 5.27254 6.67826 4.65596 7.46649C4.03938 8.25471 3.38872 9.23038 2.78961 10.3599C2.19051 11.4894 1.65906 12.7351 1.36272 13.4912C1.06637 14.2474 1.00693 14.5061 1.00148 15.2416C0.996034 15.9771 0.998144 17.1597 1.14417 18.0814C1.39553 19.6678 1.67907 20.7504 2.31833 21.839C2.74386 22.5636 3.40403 23.5936 4.02721 24.4606C4.65039 25.3276 5.21934 26.0107 5.65309 26.4743C6.08684 26.9379 6.37661 27.1747 7.00858 27.5915C7.64055 28.0083 8.58606 28.5875 9.42395 29.028C10.2619 29.4684 10.9707 29.7612 11.6974 29.9887C12.4242 30.2161 13.1471 30.3735 13.9148 30.4638C14.6825 30.5541 15.4712 30.5765 16.5438 30.5169C17.6164 30.4574 18.942 30.3662 20.221 30.0906C22.7318 29.5495 23.9644 29.2378 23.9839 29.2378L25.1043 28.6604C25.5448 28.3761 26.1255 28.1825 27.6215 26.7031C28.4738 25.8602 29.2488 24.8968 29.9007 23.4543C30.2884 22.5965 30.7662 21.4841 30.9839 20.7203C31.3037 19.5981 31.5622 16.5874 30.9839 15.2416C30.6851 14.5463 30.3355 13.8449 29.7051 12.859C29.0746 11.8731 28.1901 10.6401 27.3538 9.64457C26.5175 8.6491 25.7525 7.91348 24.926 7.25599"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

// A stable word magnet variant per date, so the calendar looks hand-placed but never reshuffles
export function wordMagnetFor(date: string) {
  let h = 7
  for (const c of date) h = (h * 131 + c.charCodeAt(0)) % 10007
  return h % WORD_MAGNETS.length
}

// Same tilt for the same date every time, a mix of slight and big turns like the hand-placed design
export function tiltFor(date: string) {
  let h = 0
  for (const c of date) h = (h * 31 + c.charCodeAt(0)) % 997
  const options = [0, -4, 3, -8, 6, 0, -3, 9, -6, 2]
  return options[h % options.length]!
}
