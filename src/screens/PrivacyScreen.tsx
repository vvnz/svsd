import { motion } from 'motion/react'

import { PrivacyOptions } from '../components/PrivacyOptions'

type Props = { onDone: () => void }

// Onboarding, after the splash: choose what the fridge may use to suggest words
// (photos, location, music apps). Replaces the old "connect app" screen.
// Not in Figma: built on the design system like Settings, with the same choices.
export function PrivacyScreen({ onDone }: Props) {
  return (
    <div className="screen privacy">
      <div className="privacy__scroll">
        <header className="settings__header">
          <h1 className="title">word bank</h1>
          <p className="settings__subtitle">choose what your poems will be inspired by</p>
        </header>

        <motion.div
          className="privacy__body"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 260, damping: 28, delay: 0.1 }}
        >
          <PrivacyOptions sections />
          <p className="settings__note">you can change these anytime in settings</p>
        </motion.div>
      </div>

      {/* Figma "Button" (18:366), Base */}
      <motion.button className="cta cta--dark" whileTap={{ scale: 0.98 }} onClick={onDone}>
        Start my fridge
      </motion.button>
    </div>
  )
}
