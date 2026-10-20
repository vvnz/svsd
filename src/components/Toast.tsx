import { useCallback, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'

import { Magnet } from './Magnet'

// A word magnet that pops up for a moment ("saved your image"), slightly tilted. The tile is see-through, the text
// less so (see .toast in index.css).
export function useToast() {
  const [message, setMessage] = useState<string | null>(null)
  const timer = useRef<number | undefined>(undefined)

  const show = useCallback((text: string) => {
    window.clearTimeout(timer.current)
    setMessage(text)
    timer.current = window.setTimeout(() => setMessage(null), 1800)
  }, [])

  const node = (
    <AnimatePresence>
      {message && (
        <motion.div
          key={message}
          className="toast"
          role="status"
          initial={{ opacity: 0, y: 16, x: '-50%', rotate: 0 }}
          animate={{ opacity: 1, y: 0, x: '-50%', rotate: -1.5 }}
          exit={{ opacity: 0, y: 8, x: '-50%' }}
          transition={{ type: 'spring', stiffness: 500, damping: 34 }}
        >
          <Magnet text={message} size="fridge" />
        </motion.div>
      )}
    </AnimatePresence>
  )

  return { show, node }
}
