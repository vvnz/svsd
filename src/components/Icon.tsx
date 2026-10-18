// Hand-drawn icons exported from the Figma file as SVG.
// They draw in `currentColor`, so set `color` on the icon (or its parent) to tint them.
import fridge from '../assets/icons/fridge.svg?raw'
import imessage from '../assets/icons/imessage.svg?raw'
import instagram from '../assets/icons/instagram.svg?raw'
import whatsapp from '../assets/icons/whatsapp.svg?raw'
import facebook from '../assets/icons/facebook.svg?raw'
import x from '../assets/icons/x.svg?raw'
import spotify from '../assets/icons/spotify.svg?raw'
import back from '../assets/icons/back.svg?raw'
import arrowLeft from '../assets/icons/arrow-left.svg?raw'
import home from '../assets/icons/home.svg?raw'
import tabWords from '../assets/icons/tab-words.svg?raw'
import tabStickers from '../assets/icons/tab-stickers.svg?raw'
import tabImages from '../assets/icons/tab-images.svg?raw'
import star from '../assets/icons/star.svg?raw'
import calendar from '../assets/icons/calendar.svg?raw'
import settings from '../assets/icons/settings.svg?raw'
import share from '../assets/icons/share.svg?raw'

const ICONS = {
  fridge,
  imessage,
  instagram,
  whatsapp,
  facebook,
  x,
  spotify,
  back,
  arrowLeft,
  home,
  tabWords,
  tabStickers,
  tabImages,
  star,
  calendar,
  settings,
  share,
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
