import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'

import { Icon } from '../components/Icon'
import type { Source } from '../data/sources'

type Props = {
  source: Source
  onBack: () => void
  onConnected: (source: Source) => void
}

type Phase = 'idle' | 'connecting' | 'done'

// Figma "Connect - Sign In" (35:284).
// Prototype only: the sign-on is simulated, no real account is touched.
export function SignInScreen({ source, onBack, onConnected }: Props) {
  const [phase, setPhase] = useState<Phase>('idle')

  function signIn() {
    if (phase !== 'idle') return
    setPhase('connecting')
    setTimeout(() => setPhase('done'), 1100)
    setTimeout(() => onConnected(source), 1900)
  }

  return (
    <div className="screen onboard">
      <button className="icon-btn signin__back" onClick={onBack} aria-label="Back">
        <Icon name="arrowLeft" size={24} />
      </button>

      <header className="onboard__header">
        <h1 className="title">sign in securely</h1>
        <p className="subtitle">connect apps for custom vocab words</p>
      </header>

      <motion.div
        className="signin__tile"
        animate={phase === 'connecting' ? { rotate: [0, -2, 2, 0] } : { rotate: 0 }}
        transition={phase === 'connecting' ? { repeat: Infinity, duration: 0.5 } : { duration: 0.2 }}
      >
        <Icon name={source.icon} size={97} />
        <AnimatePresence>
          {phase === 'done' && (
            <motion.span
              className="signin__done"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 600, damping: 16 }}
            >
              <svg viewBox="0 0 20 20" width="20" height="20" aria-hidden>
                <path
                  d="M5 10.5l3.2 3L15 6.5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </motion.span>
          )}
        </AnimatePresence>
      </motion.div>

      <p className="signin__note">
        Fridge App never stores
        <br />
        your information
      </p>

      <button className="cta cta--dark" onClick={signIn} disabled={phase !== 'idle'}>
        {phase === 'idle' && `Open ${source.name} sign-on`}
        {phase === 'connecting' && 'Connecting…'}
        {phase === 'done' && `${source.name} connected`}
      </button>
    </div>
  )
}
