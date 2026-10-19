import { useState } from 'react'
import { motion, useAnimationControls } from 'motion/react'

import { Fridge, FridgeFavourites, FRIDGE_W } from '../components/Fridge'
import { FitPoem } from '../components/PoemCanvas'
import { Icon, type IconName } from '../components/Icon'
import { SideMenu, type MenuId } from '../components/SideMenu'
import { useToast } from '../components/Toast'
import { useApp } from '../state/appState'
import { useScreenSize } from '../state/useScreenSize'

type Template = 'steel' | 'enamel' | 'paper'
const TEMPLATES: { id: Template; label: string }[] = [
  { id: 'steel', label: 'Brushed steel' },
  { id: 'enamel', label: 'Enamel' },
  { id: 'paper', label: 'Paper' },
]

const TARGETS: { id: string; label: string; icon: IconName; toast: string }[] = [
  { id: 'download', label: 'Download', icon: 'download', toast: 'Saved to Photos' },
  { id: 'instagram', label: 'Instagram', icon: 'instagram', toast: 'Opening Instagram Stories…' },
  { id: 'imessage', label: 'iMessage', icon: 'imessage', toast: 'Opening Messages…' },
  { id: 'whatsapp', label: 'Whatsapp', icon: 'whatsapp', toast: 'Opening WhatsApp…' },
  { id: 'x', label: 'X', icon: 'x', toast: 'Opening X…' },
]

const CARD_W = 224
const CARD_H = 398

type Props = {
  /** a poem's date, or the whole favourites fridge */
  subject: string | 'favourites'
  onBack?: () => void
  onMenu: (id: MenuId) => void
}

// Figma "Share Screen" (43:630): a story-sized card of your fridge, a few looks, and where to send it.
// Sending is simulated for the prototype.
export function ShareScreen({ subject, onBack, onMenu }: Props) {
  const { favourites, fridgeStyle, poemFor, settings } = useApp()
  const [template, setTemplate] = useState<Template>('steel')
  const [ref, size] = useScreenSize()
  const toast = useToast()
  const card = useAnimationControls()
  const poem = subject === 'favourites' ? undefined : poemFor(subject)
  const k = size.height / 874 // squeeze a little on shorter screens
  const fridgeScale = 188 / FRIDGE_W

  function send(t: (typeof TARGETS)[number]) {
    void card.start({ scale: [1, 0.96, 1.02, 1], transition: { duration: 0.45 } })
    toast.show(t.toast)
  }

  return (
    <div className="screen" ref={ref}>
      {/* Figma: the share screen uses the fridge variant of the menu */}
      {onBack ? (
        <button className="icon-btn top-left" aria-label="Back" onClick={onBack}>
          <Icon name="chevronLeft" size={40} />
        </button>
      ) : (
        <SideMenu screenWidth={size.width} current="favourite" onSelect={onMenu} />
      )}

      <motion.div
        className={`share-card share-card--${template}`}
        style={{ width: CARD_W, height: CARD_H, left: (size.width - CARD_W) / 2 - 2, top: 144 * k }}
        animate={card}
      >
        <div className="share-card__header">
          <span>{settings.name.trim() || 'my'}'s fridge</span>
          <span>{poem ? shortDate(poem.date) : 'my favourites'}</span>
        </div>
        {poem ? (
          <div className="share-card__poem">
            <FitPoem poem={poem} box={{ x: 14, y: 50, w: CARD_W - 28, h: CARD_H - 80 }} maxScale={0.5} />
          </div>
        ) : (
          <div className="share-card__fridge" style={{ left: (CARD_W - 188) / 2 }}>
            <Fridge style={fridgeStyle} scale={fridgeScale} flat={template !== 'steel'}>
              <FridgeFavourites favourites={favourites} poemFor={poemFor} />
            </Fridge>
          </div>
        )}
      </motion.div>

      <div className="share-templates" style={{ top: 556 * k }}>
        {TEMPLATES.map((t) => (
          <button
            key={t.id}
            className={`share-template share-template--${t.id} ${template === t.id ? 'is-on' : ''}`}
            aria-label={t.label}
            aria-pressed={template === t.id}
            onClick={() => setTemplate(t.id)}
          />
        ))}
      </div>

      <div className="share-targets" style={{ top: 676 * k }}>
        {TARGETS.map((t) => (
          <motion.button key={t.id} className="share-target" whileTap={{ scale: 0.92 }} onClick={() => send(t)}>
            <Icon name={t.icon} size={t.icon === 'download' ? 26 : 34} />
            <span>{t.label}</span>
          </motion.button>
        ))}
      </div>
      {toast.node}
    </div>
  )
}

function shortDate(date: string) {
  const [y, m, d] = date.split('-').map(Number)
  return new Date(y!, m! - 1, d!).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toLowerCase()
}
