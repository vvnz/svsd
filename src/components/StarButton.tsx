import { useLayoutEffect, useRef } from 'react'
import { motion } from 'motion/react'

import { Icon } from './Icon'

type Props = {
  pinned: boolean
  onClick: () => void
  className?: string
}

// The star outline from Figma, which fills in yellow once the poem is a favourite.
export function StarButton({ pinned, onClick, className = '' }: Props) {
  const ref = useRef<HTMLButtonElement>(null)

  // the outline is refitted inside the button (see Icon), so the yellow fill follows it
  useLayoutEffect(() => {
    const outline = ref.current?.querySelector('.icon svg')
    const fill = ref.current?.querySelector('.star-btn__fill')
    const viewBox = outline?.getAttribute('viewBox')
    if (fill && viewBox) fill.setAttribute('viewBox', viewBox)
  })

  return (
    <motion.button
      ref={ref}
      className={`icon-btn star-btn ${pinned ? 'is-on' : ''} ${className}`}
      aria-label={pinned ? 'Remove from favourites' : 'Add to favourites'}
      aria-pressed={pinned}
      onClick={onClick}
      whileTap={{ scale: 0.8 }}
    >
      <motion.svg viewBox="0 0 24 24" className="star-btn__fill" initial={false} animate={{ scale: pinned ? 1 : 0 }}>
        <path d="M12 3.2l2.6 5.3 5.8.8-4.2 4.1 1 5.8L12 16.5l-5.2 2.7 1-5.8-4.2-4.1 5.8-.8z" />
      </motion.svg>
      <Icon name="star" size={35} />
    </motion.button>
  )
}
