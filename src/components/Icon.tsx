// Hand-drawn icons exported from the Figma file as SVG.
// They draw in `currentColor`, so set `color` on the icon (or its parent) to tint them.
import fridge from '../assets/icons/fridge.svg?raw'
import imessage from '../assets/icons/imessage.svg?raw'
import instagram from '../assets/icons/instagram.svg?raw'
import whatsapp from '../assets/icons/whatsapp.svg?raw'
import facebook from '../assets/icons/facebook.svg?raw'
import x from '../assets/icons/x.svg?raw'
import spotify from '../assets/icons/spotify.svg?raw'
import undo from '../assets/icons/undo.svg?raw'
import arrowLeft from '../assets/icons/arrow-left.svg?raw'
import home from '../assets/icons/home.svg?raw'
import tabWords from '../assets/icons/tab-words.svg?raw'
import tabStickers from '../assets/icons/tab-stickers.svg?raw'
import tabImages from '../assets/icons/tab-images.svg?raw'
import star from '../assets/icons/star.svg?raw'
import calendar from '../assets/icons/calendar.svg?raw'
import settings from '../assets/icons/settings.svg?raw'
import share from '../assets/icons/share.svg?raw'
import shareUp from '../assets/icons/share-up.svg?raw'
import edit from '../assets/icons/edit.svg?raw'
import paint from '../assets/icons/paint.svg?raw'
import plus from '../assets/icons/plus.svg?raw'
import minus from '../assets/icons/minus.svg?raw'
import arrowRight from '../assets/icons/arrow-right.svg?raw'
import chevronLeft from '../assets/icons/chevron-left.svg?raw'
import download from '../assets/icons/download.svg?raw'
import poem from '../assets/icons/poem.svg?raw'

const ICONS = {
  fridge,
  imessage,
  instagram,
  whatsapp,
  facebook,
  x,
  spotify,
  undo,
  arrowLeft,
  home,
  tabWords,
  tabStickers,
  tabImages,
  star,
  calendar,
  settings,
  share,
  shareUp,
  edit,
  paint,
  plus,
  minus,
  arrowRight,
  chevronLeft,
  download,
  poem,
}

export type IconName = keyof typeof ICONS

type Props = {
  name: IconName
  size: number
  className?: string
}

export function Icon({ name, size, className = '' }: Props) {
  return (
    <span
      className={`icon ${className}`}
      style={{ width: size, height: size }}
      aria-hidden
      // trusted, bundled SVG files from our own Figma export
      dangerouslySetInnerHTML={{ __html: ICONS[name] }}
    />
  )
}
