import { motion } from 'motion/react'

import { Fridge, FridgeFavourites, FRIDGE_W, slotsFor } from '../components/Fridge'
import { Icon } from '../components/Icon'
import { SideMenu, type MenuId } from '../components/SideMenu'
import { useApp } from '../state/appState'
import { useScreenSize } from '../state/useScreenSize'

type Props = {
  onMenu: (id: MenuId) => void
  onShare: () => void
  onEdit: () => void
  onCustomize: () => void
  onOpen: (date: string) => void
}

// Figma "Fridge - Main" (38:1711): your favourite poems pinned to one fridge.
// Drawn 20% bigger than Figma's 268px fridge, as if a step closer, just under the icons and menu tab.
const ZOOM = 1.2
const TOP = 196
export function FavouritesScreen({ onMenu, onShare, onEdit, onCustomize, onOpen }: Props) {
  const { favourites, fridgeStyle, poemFor } = useApp()
  const [ref, size] = useScreenSize()
  const left = Math.round((size.width - FRIDGE_W * ZOOM) / 2)

  return (
    <div className="screen screen--scroll-none" ref={ref}>
      <div className="tool-column">
        <button className="icon-btn" aria-label="Share your fridge" onClick={onShare}>
          <Icon name="shareUp" size={35} />
        </button>
        <button className="icon-btn" aria-label="Edit favourites" onClick={onEdit}>
          <Icon name="edit" size={35} />
        </button>
        <button className="icon-btn" aria-label="Customize fridge" onClick={onCustomize}>
          <Icon name="paint" size={35} />
        </button>
      </div>

      <SideMenu screenWidth={size.width} current="favourite" onSelect={onMenu} />

      <motion.div
        className="fav-fridge"
        style={{ left, top: TOP }}
        initial={{ y: 24, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 26, delay: 0.05 }}
      >
        <Fridge style={fridgeStyle} scale={ZOOM}>
          <FridgeFavourites style={fridgeStyle} favourites={favourites} poemFor={poemFor} />
          {favourites.map((date, i) => {
            const slot = slotsFor(fridgeStyle)[i]!
            return date && poemFor(date) ? (
              <button
                key={i}
                className="fav-slot"
                style={{ left: slot.x, top: slot.y, width: slot.w, height: slot.h }}
                aria-label={`Open poem from ${date}`}
                onClick={() => onOpen(date)}
              />
            ) : null
          })}
        </Fridge>
      </motion.div>
    </div>
  )
}
