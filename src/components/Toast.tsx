import { useCallback, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'

// A small pill that pops up from the bottom for a moment ("Saved to Photos").
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
          initial={{ opacity: 0, y: 16, x: '-50%' }}
          animate={{ opacity: 1, y: 0, x: '-50%' }}
          exit={{ opacity: 0, y: 8, x: '-50%' }}
          transition={{ type: 'spring', stiffness: 500, damping: 34 }}
        >
          {message}
        </motion.div>
      )}
    </AnimatePresence>
  )

  return { show, node }
}
