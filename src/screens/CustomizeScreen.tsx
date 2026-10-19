import { useState } from 'react'
import { motion } from 'motion/react'

import { Fridge, FRIDGE_H, FRIDGE_W, STYLE_NAMES } from '../components/Fridge'
import { Icon } from '../components/Icon'
import { useApp, type FridgeStyle } from '../state/appState'
import { useScreenSize } from '../state/useScreenSize'

const STYLES: FridgeStyle[] = ['graphite', 'steel', 'butter']
const CENTER = 220 / FRIDGE_W
const SIDE = 165 / FRIDGE_W

type Props = { onBack: () => void; onSave: () => void }

// Figma "Fridge - Customize fridge" (43:489): flip through fridge styles, Save to keep one.
export function CustomizeScreen({ onBack, onSave }: Props) {
  const { fridgeStyle, setFridgeStyle } = useApp()
  const [index, setIndex] = useState(Math.max(0, STYLES.indexOf(fridgeStyle)))
  const [ref, size] = useScreenSize()
  const go = (d: number) => setIndex((i) => Math.min(STYLES.length - 1, Math.max(0, i + d)))

  const centerY = (264 / 874) * size.height + (FRIDGE_H * CENTER) / 2
  const gap = size.width / 2 - 52 + (FRIDGE_W * SIDE) / 2 // side fridges peek in 52px

  return (
    <div className="screen" ref={ref}>
      <button className="icon-btn top-left" aria-label="Back" onClick={onBack}>
        <Icon name="chevronLeft" size={24} />
      </button>
      <button
        className="text-btn top-right"
        onClick={() => {
          setFridgeStyle(STYLES[index]!)
          onSave()
        }}
      >
        Save
      </button>

      <motion.div
        className="carousel"
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.25}
        onDragEnd={(_, info) => {
          if (info.offset.x < -50 || info.velocity.x < -400) go(1)
          else if (info.offset.x > 50 || info.velocity.x > 400) go(-1)
        }}
      >
        {STYLES.map((style, i) => {
          const offset = i - index
          const scale = offset === 0 ? CENTER : SIDE
          return (
            <motion.button
              key={style}
              className="carousel__item"
              aria-label={STYLE_NAMES[style]}
              onClick={() => setIndex(i)}
              initial={false}
              animate={{
                x: size.width / 2 + offset * gap - (FRIDGE_W * scale) / 2,
                y: centerY - (FRIDGE_H * scale) / 2,
                opacity: Math.abs(offset) > 1 ? 0 : 1,
              }}
              transition={{ type: 'spring', stiffness: 300, damping: 32 }}
            >
              <motion.div initial={false} animate={{ scale: scale / CENTER }} style={{ originX: 0, originY: 0 }} transition={{ type: 'spring', stiffness: 300, damping: 32 }}>
                <Fridge style={style} scale={CENTER} />
              </motion.div>
            </motion.button>
          )
        })}
      </motion.div>

      <div className="carousel__controls" style={{ top: 664 * (size.height / 874) }}>
        <motion.p key={index} className="carousel__name" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}>
          {STYLE_NAMES[STYLES[index]!]}
        </motion.p>
        <div className="carousel__arrows">
          <button className="icon-btn" aria-label="Previous style" disabled={index === 0} onClick={() => go(-1)}>
            <Icon name="arrowLeft" size={24} />
          </button>
          <button className="icon-btn" aria-label="Next style" disabled={index === STYLES.length - 1} onClick={() => go(1)}>
            <Icon name="arrowRight" size={24} />
          </button>
        </div>
      </div>
    </div>
  )
}
