import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'

import { Icon, type IconName } from './Icon'

// The pull-out tab on the right edge, Figma component "menu" (75:5317).
// Closed, only the home tab peeks out. Tap it and the whole piece slides left,
// revealing a panel with favourite, calendar, settings and share (Figma "Frame 200").

// Outline from the Figma export: a tall panel on the right with the tab joined on its left side.
const OUTLINE =
  'M135.8 1.2C138.451 1.2 140.6 3.349 140.6 6V230.521C140.6 233.172 138.451 235.321 135.8 235.321H70.995C68.344 235.321 66.195 233.172 66.195 230.521V173.509C66.195 170.858 64.046 168.709 61.395 168.709H8.4C5.749 168.709 3.6 166.56 3.6 163.909V66.463C3.6 63.812 5.749 61.663 8.4 61.663H61.395C64.046 61.663 66.195 59.514 66.195 56.863V6C66.195 3.349 68.344 1.2 70.995 1.2H135.8Z'

// Shape geometry, in the outline's own coordinates
const W = 142
const H = 239
const TAB_LEFT = 3.6
const TAB_RIGHT = 66.2 // where the tab meets the panel
const PANEL_RIGHT = 140.6
const TAB_CENTER_Y = 115.2
const PANEL_CENTER_X = 103.4
const ICON_TOPS = [25.25, 79.25, 133.25, 187.25] // 24px icons, 54px apart, as in Frame 200

type Item = { id: string; icon: IconName; label: string }

const ITEMS: Item[] = [
  { id: 'favourite', icon: 'star', label: 'Favourites' },
  { id: 'calendar', icon: 'calendar', label: 'Calendar' },
  { id: 'settings', icon: 'settings', label: 'Customize fridge' },
  { id: 'share', icon: 'share', label: 'Share' },
]

type Props = {
  screenWidth: number
  /** where the middle of the tab should sit, from the top of the screen */
  tabCenterY?: number
  onSelect?: (id: string) => void
}

const SLIDE = { type: 'spring', stiffness: 420, damping: 34 } as const

export function SideMenu({ screenWidth, tabCenterY = 151, onSelect }: Props) {
  const [open, setOpen] = useState(false)

  // closed: only the tab shows, the panel is just past the right edge
  // open: the panel's right edge tucks 2px past the screen edge, so it reads as attached
  // (3px extra so the hidden panel's border and shadow don't peek out above and below the tab)
  const closedX = screenWidth - TAB_RIGHT + 3
  const openX = screenWidth - PANEL_RIGHT + 2

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.button
            className="side-menu__scrim"
            aria-label="Close menu"
            onClick={() => setOpen(false)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
        )}
      </AnimatePresence>

      <motion.nav
        className="side-menu"
        style={{ width: W, height: H, top: tabCenterY - TAB_CENTER_Y, left: 0 }}
        initial={false}
        animate={{ x: open ? openX : closedX }}
        transition={SLIDE}
        aria-label="Menu"
      >
        <svg className="side-menu__shape" width={W} height={H} viewBox={`0 0 ${W} ${H}`} aria-hidden>
          <path d={OUTLINE} fill="var(--surface-1)" stroke="var(--fill-2)" strokeWidth="1.2" />
        </svg>

        <button
          className="side-menu__tab"
          style={{
            left: TAB_LEFT,
            top: 61.7,
            width: TAB_RIGHT - TAB_LEFT,
            height: 168.7 - 61.7,
          }}
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-label={open ? 'Close menu' : 'Open menu'}
        >
          <motion.span animate={{ rotate: open ? -8 : 0 }} transition={SLIDE}>
            <Icon name="home" size={23} />
          </motion.span>
        </button>

        {ITEMS.map((item, i) => (
          <motion.button
            key={item.id}
            className="side-menu__item"
            style={{ left: PANEL_CENTER_X - 22, top: ICON_TOPS[i]! - 10 }}
            aria-label={item.label}
            tabIndex={open ? 0 : -1}
            initial={false}
            animate={{ opacity: open ? 1 : 0, x: open ? 0 : 10 }}
            transition={{ ...SLIDE, delay: open ? 0.04 * i + 0.05 : 0 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => {
              setOpen(false)
              onSelect?.(item.id) // TODO: open favourites / calendar / customize / share screens
            }}
          >
            <Icon name={item.icon} size={24} />
          </motion.button>
        ))}
      </motion.nav>
    </>
  )
}
