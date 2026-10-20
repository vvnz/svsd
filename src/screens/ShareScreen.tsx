import { useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { motion, useAnimationControls } from 'motion/react'

import { Fridge, FridgeFavourites, FRIDGE_W, slotsFor } from '../components/Fridge'
import { ART_H, ART_W } from '../components/FridgeArt'
import { FridgeBackground, isDarkFinish } from '../components/FridgeBackground'
import { FitPoem, PoemCanvas, poemBounds } from '../components/PoemCanvas'
import { Icon, type IconName } from '../components/Icon'
import { SideMenu, type MenuId } from '../components/SideMenu'
import { useToast } from '../components/Toast'
import { useApp } from '../state/appState'
import { useScreenSize } from '../state/useScreenSize'
import { todayKey } from '../state/useFridge'
import type { Poem } from '../data/poems'
import type { FridgeStyle } from '../state/appState'
import { nextFrames, renderNodeToPng, saveImage, startCanvasCapture } from '../lib/exportImage'

// Figma "Share - Entire Fridge" posts (52:1358): the whole fridge on a white card, a close-up of the
// fridge's surface, and the fridge at an angle on a dark card. All three use the chosen fridge style.
type Template = 'fridge' | 'surface' | 'angled'
const TEMPLATES: { id: Template; label: string }[] = [
  { id: 'fridge', label: 'Whole fridge' },
  { id: 'surface', label: 'Fridge close-up' },
  { id: 'angled', label: 'Fridge at an angle' },
]

// Figma "Frame 131" (52:4460)
const TARGETS: { id: string; label: string; icon: IconName; toast: string }[] = [
  {
    id: 'download',
    label: 'Download',
    icon: 'download',
    toast: 'Saved to Photos',
  },
  {
    id: 'instagram',
    label: 'Instagram',
    icon: 'instagram',
    toast: 'Opening Instagram Stories…',
  },
  {
    id: 'imessage',
    label: 'iMessage',
    icon: 'imessage',
    toast: 'Opening Messages…',
  },
  {
    id: 'discord',
    label: 'Discord',
    icon: 'discord',
    toast: 'Opening Discord…',
  },
  {
    id: 'whatsapp',
    label: 'Whatsapp',
    icon: 'whatsapp',
    toast: 'Opening WhatsApp…',
  },
  {
    id: 'facebook',
    label: 'Facebook',
    icon: 'facebook',
    toast: 'Opening Facebook…',
  },
  { id: 'x', label: 'X', icon: 'x', toast: 'Opening X…' },
]

const CARD_W = 225
const CARD_H = 399
// the poem page (a 402 × 874 phone screen), shrunk to the card's width
const PAGE_W = 402
const PAGE_H = 874
const PAGE_SCALE = CARD_W / PAGE_W

type Box = { x: number; y: number; w: number; h: number }

// The part of a fridge the favourites cover (all 6 slots), in fridge art units
function faceOf(style: FridgeStyle): Box {
  const slots = slotsFor(style)
  const x = Math.min(...slots.map((s) => s.x))
  const y = Math.min(...slots.map((s) => s.y))
  return {
    x,
    y,
    w: Math.max(...slots.map((s) => s.x + s.w)) - x,
    h: Math.max(...slots.map((s) => s.y + s.h)) - y,
  }
}

type Props = {
  /** a poem's date, or the whole favourites fridge */
  subject: string | 'favourites'
  onBack?: () => void
  onMenu: (id: MenuId) => void
}

// Figma "Share Screen" (43:630): a story-sized post of your fridge, three looks, and where to send it.
// Sending is simulated for the prototype.
export function ShareScreen({ subject, onBack, onMenu }: Props) {
  const { favourites, fridgeStyle, poemFor, settings } = useApp()
  const [picked, setPicked] = useState<Template>('fridge')
  const [ref, size] = useScreenSize()
  const toast = useToast()
  const card = useAnimationControls()
  const poem = subject === 'favourites' ? undefined : poemFor(subject)
  // one day's poem is shared as it looks on its page: just the close-up, no other looks
  const template: Template = poem ? 'surface' : picked
  const k = size.height / 874 // squeeze a little on shorter screens
  // how big the post shows: bigger for one poem, which has no style tiles under it
  const shown = (poem ? 1.42 : 1.3) * k
  const name = `${settings.name.trim() || 'my'}’s fridge`
  const date = poem ? slashDate(poem.date) : slashDate(todayKey())

  // Download makes a real image: a hidden copy of the post is drawn (so the enamel / steel shaders render fresh
  // and can be captured), turned into a 1080px-wide PNG, and saved (or handed to the share sheet on a phone).
  // The other targets are simulated.
  const exportRef = useRef<HTMLDivElement>(null)
  const [exporting, setExporting] = useState(false)

  async function download() {
    if (exporting) return
    setExporting(true)
    toast.show('Making your image…')
    try {
      const capture = startCanvasCapture()
      await nextFrames(2) // let the hidden copy mount and its shaders draw
      const node = exportRef.current
      if (!node) throw new Error('no card')
      const frames = await capture.waitFor(node)
      const blob = await renderNodeToPng(node, { width: CARD_W, height: CARD_H, scale: 1080 / CARD_W, frames })
      const file = new File(
        [blob],
        `${name.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}-${date.replaceAll('/', '-')}.png`,
        {
          type: 'image/png',
        },
      )
      toast.show((await saveImage(file)) === 'shared' ? 'Shared' : 'Saved your image')
    } catch {
      toast.show("Couldn't make the image, try again")
    } finally {
      setExporting(false)
    }
  }

  function send(t: (typeof TARGETS)[number]) {
    void card.start({
      scale: [1, 0.96, 1.02, 1],
      transition: { duration: 0.45 },
    })
    if (t.id === 'download') void download()
    else toast.show(t.toast)
  }

  // what's on the fridge: the pinned favourites in their spots, or one day's poem across the doors
  const content = <FridgeContent style={fridgeStyle} poem={poem} favourites={favourites} poemFor={poemFor} />

  return (
    <div className="screen" ref={ref}>
      {/* Figma: the share screen uses the fridge variant of the menu */}
      {onBack ? (
        <button className="icon-btn top-left" aria-label="Back" onClick={onBack}>
          <Icon name="chevronLeft" size={35} />
        </button>
      ) : (
        <SideMenu screenWidth={size.width} current="favourite" onSelect={onMenu} />
      )}

      {/* the post is laid out at Figma's 225 × 399 and shown bigger, so it fills the screen (the image Download makes
          is drawn from the same layout) */}
      <div
        className="share-card-holder"
        style={{
          left: (size.width - CARD_W * shown) / 2,
          top: 96 * k,
          transform: `scale(${shown})`,
        }}
      >
        <motion.div
          className={`share-card share-card--${template}`}
          style={{ width: CARD_W, height: CARD_H, left: 0, top: 0 }}
          animate={card}
        >
          <CardContents template={template} style={fridgeStyle} poem={poem} name={name} date={date}>
            {content}
          </CardContents>
        </motion.div>
      </div>

      {/* Figma "post options" (52:1828): the three looks, drawn in the chosen fridge style */}
      {!poem && (
        <div className="share-templates" style={{ top: (96 + 16) * k + CARD_H * shown }}>
          {TEMPLATES.map((t) => (
            <button
              key={t.id}
              className={`share-template ${template === t.id ? 'is-on' : ''}`}
              aria-label={t.label}
              aria-pressed={template === t.id}
              onClick={() => setPicked(t.id)}
            >
              <TemplateThumb template={t.id} style={fridgeStyle} />
            </button>
          ))}
        </div>
      )}

      <div className="share-targets" style={{ top: 717 * k }}>
        {TARGETS.map((t) => (
          <motion.button key={t.id} className="share-target" whileTap={{ scale: 0.92 }} onClick={() => send(t)}>
            <Icon name={t.icon} size={30} />
            <span>{t.label}</span>
          </motion.button>
        ))}
      </div>
      {/* the hidden copy Download draws from: off screen, outside the phone frame, only while exporting */}
      {exporting &&
        createPortal(
          <div
            ref={exportRef}
            className={`share-card share-card--${template} share-card--export`}
            style={{ width: CARD_W, height: CARD_H }}
            aria-hidden
          >
            <CardContents template={template} style={fridgeStyle} poem={poem} name={name} date={date}>
              {content}
            </CardContents>
          </div>,
          document.body,
        )}
      {toast.node}
    </div>
  )
}

// What's on the post, for the card on screen and for the hidden copy that Download turns into an image.
function CardContents({
  template,
  style,
  poem,
  name,
  date,
  children,
}: {
  template: Template
  style: FridgeStyle
  poem?: Poem
  name: string
  date: string
  children: ReactNode
}) {
  return (
    <>
      {template === 'fridge' && (
        <>
          <div className="share-card__header share-card__header--row">
            <span>{name}</span>
            <span>{poem ? date : 'my favourites'}</span>
          </div>
          {/* Figma: the fridge 194 wide at (15, 95), running off the bottom of the card */}
          <div className="share-card__fridge" style={{ left: 15, top: 95 }}>
            <Fridge style={style} scale={194 / FRIDGE_W}>
              {children}
            </Fridge>
          </div>
        </>
      )}
      {template === 'surface' && (
        <>
          {/* the fridge's own finish (enamel or brushed steel), close up, with the poems on it. A day's poem
            shows as on its page, magnets and all, at the card's width */}
          <PageSurface style={style} poem={poem} />
          {!poem && <SurfaceContent style={style}>{children}</SurfaceContent>}
          <div className={`share-card__header ${isDarkFinish(style) ? 'on-dark' : ''}`} style={{ left: 18, top: 43 }}>
            <span>{name}</span>
            <span>{date}</span>
          </div>
        </>
      )}
      {template === 'angled' && (
        <>
          {/* Figma: the fridge 218 wide at (13, 79), turned 4.4° */}
          <div className="share-card__fridge share-card__fridge--angled" style={{ left: 13, top: 79 }}>
            <Fridge style={style} scale={218 / FRIDGE_W}>
              {children}
            </Fridge>
          </div>
          <div className="share-card__header share-card__header--light" style={{ left: 20, top: 39 }}>
            <span>{date}</span>
            <span>{name}</span>
          </div>
        </>
      )}
    </>
  )
}

function FridgeContent({
  style,
  poem,
  favourites,
  poemFor,
}: {
  style: FridgeStyle
  poem?: Poem
  favourites: (string | null)[]
  poemFor: (date: string) => Poem | undefined
}) {
  if (poem) return <FitPoem poem={poem} box={faceOf(style)} maxScale={0.5} />
  return <FridgeFavourites style={style} favourites={favourites} poemFor={poemFor} />
}

// The poem page shrunk to the card's width: the background is drawn at full page size and scaled down with
// everything on it, so the enamel / brushed steel detail keeps its size next to the magnets, like the poem page.
// The page is taller than the card, so it's centred on the poem (or the card, with no poem).
function PageSurface({ style, poem }: { style: FridgeStyle; poem?: Poem }) {
  const pageH = PAGE_H * PAGE_SCALE
  const b = poem ? poemBounds(poem) : null
  let top = (CARD_H - pageH) / 2
  if (b) top = Math.min(0, Math.max(CARD_H - pageH, CARD_H / 2 - (b.y + b.h / 2) * PAGE_SCALE))
  const page = { width: PAGE_W, height: PAGE_H, transform: `translate(0, ${top}px) scale(${PAGE_SCALE})` }
  return (
    <>
      <div className="share-card__page" style={page}>
        <FridgeBackground style={style} />
      </div>
      {/* a soft darkening at the card's edges, between the finish and the magnets */}
      <div className="vignette vignette--light" aria-hidden />
      {poem && (
        <div className="share-card__page" style={page}>
          <PoemCanvas poem={poem} />
        </div>
      )}
    </>
  )
}

// The fridge's contents without the fridge: its face, scaled up to fill the card below the header.
function SurfaceContent({ style, children }: { style: FridgeStyle; children: ReactNode }) {
  const face = faceOf(style)
  const box = { x: 18, y: 74, w: CARD_W - 36, h: CARD_H - 74 - 24 }
  const scale = Math.min(box.w / face.w, box.h / face.h)
  const left = box.x + (box.w - face.w * scale) / 2 - face.x * scale
  const top = box.y + (box.h - face.h * scale) / 2 - face.y * scale
  return (
    <div
      className="share-card__surface"
      style={{
        width: ART_W,
        height: ART_H,
        transform: `translate(${left}px, ${top}px) scale(${scale})`,
      }}
    >
      {children}
    </div>
  )
}

// A 38px picker tile (Figma "Frame 93"): a little fridge, a swatch of its finish, or a tilted close-up.
function TemplateThumb({ template, style }: { template: Template; style: FridgeStyle }) {
  if (template === 'surface') return <FridgeBackground style={style} />
  if (template === 'fridge') {
    return (
      <span className="share-template__fridge" style={{ left: 8.9, top: 3 }}>
        <Fridge style={style} scale={20.3 / FRIDGE_W} />
      </span>
    )
  }
  return (
    <span className="share-template__fridge share-template__fridge--angled" style={{ left: 6.9, top: 11.6 }}>
      <Fridge style={style} scale={34.6 / FRIDGE_W} />
    </span>
  )
}

// Figma writes the date as 10/18/2026
function slashDate(date: string) {
  const [y, m, d] = date.split('-').map(Number)
  return `${m}/${d}/${y}`
}
