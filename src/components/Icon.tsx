import { useLayoutEffect, useRef } from 'react'

// Hand-drawn icons exported from the Figma file as SVG.
// They draw in `currentColor`, so set `color` on the icon (or its parent) to tint them.
import fridge from '../assets/icons/fridge.svg?raw'
import imessage from '../assets/icons/imessage.svg?raw'
import instagram from '../assets/icons/instagram.svg?raw'
import whatsapp from '../assets/icons/whatsapp.svg?raw'
import facebook from '../assets/icons/facebook.svg?raw'
import discord from '../assets/icons/discord.svg?raw'
import close from '../assets/icons/close.svg?raw'
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
  discord,
  close,
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

// Standalone icon buttons: the hand-drawn icons fill anywhere from under half to almost all of their
// 24px canvas, so at the same size they look different. In icon buttons and the side menu, each icon is
// refitted so its drawing takes the same share of its box (25/40), and lines get one weight (see index.css).
const OPTICAL_FILL = 25 / 40

export function Icon({ name, size, className = '' }: Props) {
  const ref = useRef<HTMLSpanElement>(null)

  useLayoutEffect(() => {
    const svg = ref.current?.querySelector('svg')
    if (!svg || !ref.current?.closest('.icon-btn, .side-menu')) return
    const box = svg.getBBox()
    if (!box.width || !box.height) return
    const side = Math.max(box.width, box.height) / OPTICAL_FILL
    const cx = box.x + box.width / 2
    const cy = box.y + box.height / 2
    svg.setAttribute('viewBox', `${cx - side / 2} ${cy - side / 2} ${side} ${side}`)
  }, [name])

  return (
    <span
      ref={ref}
      className={`icon ${className}`}
      style={{ width: size, height: size }}
      aria-hidden
      // trusted, bundled SVG files from our own Figma export
      dangerouslySetInnerHTML={{ __html: ICONS[name] }}
    />
  )
}
