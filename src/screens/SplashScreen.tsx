import { useEffect } from 'react'
import { motion } from 'motion/react'

import { Icon } from '../components/Icon'

type Props = { onDone: () => void }

// Figma "Splash" (9:1075). Holds briefly, or skips ahead on tap.
export function SplashScreen({ onDone }: Props) {
  useEffect(() => {
    const t = setTimeout(onDone, 1800)
    return () => clearTimeout(t)
  }, [onDone])

  return (
    <button className="screen splash" onClick={onDone} aria-label="Start">
      <motion.div
        className="splash__mark"
        initial={{ y: -14, rotate: -6, opacity: 0 }}
        animate={{ y: 0, rotate: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 420, damping: 13, delay: 0.1 }}
      >
        <Icon name="fridge" size={100} />
      </motion.div>
      <motion.p
        className="splash__title title"
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35, duration: 0.4 }}
      >
        ref.
      </motion.p>
    </button>
  )
}
