import { motion } from 'motion/react'

import { Icon } from '../components/Icon'
import { SOURCES, type Source } from '../data/sources'

type Props = {
  connected: Set<string>
  onPick: (source: Source) => void
  onDone: () => void
}

// Figma "connect app" (46:889). Spotify sits alone on the third row, as in the design.
const GRID_POS: Record<string, { row: number; col: number }> = {
  imessage: { row: 1, col: 1 },
  instagram: { row: 1, col: 2 },
  whatsapp: { row: 1, col: 3 },
  facebook: { row: 2, col: 1 },
  x: { row: 2, col: 2 },
  spotify: { row: 3, col: 1 },
}

export function ConnectScreen({ connected, onPick, onDone }: Props) {
  const anyConnected = connected.size > 0

  return (
    <div className="screen onboard">
      <header className="onboard__header">
        <h1 className="title">connect app</h1>
        <p className="subtitle">connect apps for custom vocab words</p>
      </header>

      <ul className="sources">
        {SOURCES.map((s, i) => {
          const isOn = connected.has(s.id)
          const pos = GRID_POS[s.id] ?? { row: 1, col: 1 }
          return (
            <motion.li
              key={s.id}
              style={{ gridRow: pos.row, gridColumn: pos.col }}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 * i, duration: 0.3 }}
            >
              <button
                className={`source ${isOn ? 'source--on' : ''}`}
                onClick={() => onPick(s)}
                aria-label={isOn ? `${s.name}, connected` : `Connect ${s.name}`}
              >
                <span className="source__icon">
                  <Icon name={s.icon} size={s.iconSize} />
                  {isOn && (
                    <motion.span
                      className="source__check"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 600, damping: 18 }}
                    />
                  )}
                </span>
                <span className="source__name">{s.name}</span>
              </button>
            </motion.li>
          )
        })}
      </ul>

      <button className={`cta ${anyConnected ? 'cta--dark' : 'cta--light'}`} onClick={onDone}>
        {anyConnected ? (
          'Start my fridge'
        ) : (
          <>
            <Icon name="home" size={16} />
            Skip
          </>
        )}
      </button>
    </div>
  )
}
