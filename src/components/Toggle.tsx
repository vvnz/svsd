import { motion } from 'motion/react'

export function Toggle({ on, onChange, label }: { on: boolean; onChange: (on: boolean) => void; label?: string }) {
  return (
    <button
      className={`toggle ${on ? 'is-on' : ''}`}
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={() => onChange(!on)}
    >
      <motion.span className="toggle__knob" layout transition={{ type: 'spring', stiffness: 600, damping: 34 }} />
    </button>
  )
}
