import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'

import { Icon, type IconName } from './Icon'

// The pull-out tab on the right edge, Figma component set "Menu" (88:5593).
// The tab always shows the screen you're on (poem, fridge, calendar or settings).
// Tap it and the whole piece slides left, revealing a panel with the other three.

// Outline from the Figma export (Union 46:4167): a tall panel on the right with the tab joined on its left side.
const OUTLINE =
  'M121.399 1.2C124.05 1.2001 126.199 3.3489 126.199 5.99981V195.44C126.199 198.091 124.05 200.24 121.399 200.24H56.5933C53.9424 200.24 51.7935 198.091 51.7935 195.44V145.521C51.7935 142.87 49.6444 140.721 46.9935 140.721H8.40088C5.74991 140.721 3.6001 138.571 3.6001 135.92V65.5203C3.6001 62.8693 5.74991 60.7205 8.40088 60.7205H46.9935C49.6444 60.7205 51.7935 58.5715 51.7935 55.9205V5.99981C51.7935 3.34894 53.9424 1.20016 56.5933 1.2H121.399Z'

// Shape geometry, in the outline's own coordinates
const W = 128
const H = 204
const TAB_LEFT = 3.6
const TAB_RIGHT = 51.8 // where the tab meets the panel
const TAB_TOP = 60.7
const TAB_BOTTOM = 140.7
const PANEL_RIGHT = 126.2
const TAB_CENTER_Y = (TAB_TOP + TAB_BOTTOM) / 2
const PANEL_CENTER_X = 89
const ICON_SIZE = 30
const ICON_TOPS = [31.5, 86.5, 141.5] // 30px icons, 55px apart, as in Frame 200

export type MenuId = 'poem' | 'favourite' | 'calendar' | 'settings'
type Item = { id: MenuId; icon: IconName; label: string }

const ITEMS: Record<MenuId, Item> = {
  poem: { id: 'poem', icon: 'poem', label: "Today's poem" },
  favourite: { id: 'favourite', icon: 'fridge', label: 'Favourites fridge' },
  calendar: { id: 'calendar', icon: 'calendar', label: 'Calendar' },
  settings: { id: 'settings', icon: 'settings', label: 'Settings' },
}

// Which three go in the panel, top to bottom, for each variant
const PANEL: Record<MenuId, MenuId[]> = {
  poem: ['favourite', 'calendar', 'settings'],
  favourite: ['poem', 'calendar', 'settings'],
  calendar: ['poem', 'favourite', 'settings'],
  settings: ['poem', 'calendar', 'favourite'],
}

type Props = {
  screenWidth: number
  /** where the middle of the tab should sit, from the top of the screen */
  tabCenterY?: number
  onSelect?: (id: MenuId) => void
  /** the screen we're on: it's the icon on the tab */
  current?: MenuId
}

const SLIDE = { type: 'spring', stiffness: 420, damping: 34 } as const

export function SideMenu({ screenWidth, tabCenterY = 151, onSelect, current = 'poem' }: Props) {
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
            top: TAB_TOP,
            width: TAB_RIGHT - TAB_LEFT,
            height: TAB_BOTTOM - TAB_TOP,
          }}
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-label={open ? 'Close menu' : 'Open menu'}
        >
          <motion.span animate={{ rotate: open ? -8 : 0 }} transition={SLIDE}>
            <Icon name={ITEMS[current].icon} size={ICON_SIZE} />
          </motion.span>
        </button>

        {PANEL[current].map((id, i) => {
          const item = ITEMS[id]
          return (
            <motion.button
              key={item.id}
              className="side-menu__item"
              style={{ left: PANEL_CENTER_X - 22, top: ICON_TOPS[i]! - 7 }}
              aria-label={item.label}
              tabIndex={open ? 0 : -1}
              initial={false}
              animate={{ opacity: open ? 1 : 0, x: open ? 0 : 10 }}
              transition={{ ...SLIDE, delay: open ? 0.04 * i + 0.05 : 0 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => {
                setOpen(false)
                // let the panel start closing before the next screen slides in
                window.setTimeout(() => onSelect?.(item.id), 140)
              }}
            >
              <Icon name={item.icon} size={ICON_SIZE} />
            </motion.button>
          )
        })}
      </motion.nav>
    </>
  )
}
