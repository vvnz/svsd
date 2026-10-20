import type { CSSProperties } from 'react'

import { PHOTO_H, PHOTO_W, photoSrc, type PhotoId } from '../data/photos'
import { STICKER_SIZE, stickerSrc, type StickerId } from '../data/stickers'

type MagnetProps = {
  text: string
  size?: 'bank' | 'fridge'
  className?: string
  style?: CSSProperties
}

// A single word magnet. Visual spec from Figma "Frame 157":
// white tile, #D0D0D4 border, 1px radius, Benne lowercase, two-layer shadow.
export function Magnet({ text, size = 'bank', className = '', style }: MagnetProps) {
  return (
    <div className={`magnet magnet--${size} ${className}`} style={style}>
      <span className="magnet__text">{text}</span>
    </div>
  )
}

// A sticker magnet (Figma "Magnet" variants): the art itself, no tile. 77px in the drawer.
export function StickerMagnet({ sticker, size = 'bank' }: { sticker: StickerId; size?: 'bank' | 'fridge' }) {
  const px = size === 'bank' ? 77 : STICKER_SIZE
  return (
    <img
      className={`sticker sticker--${size}`}
      src={stickerSrc(sticker)}
      alt=""
      draggable={false}
      style={{ width: px, height: px }}
    />
  )
}

// A photo magnet (Figma "Frame 158", 58:4784): the photo with 4px corners and a soft shadow.
export function PhotoMagnet({ photo }: { photo: PhotoId }) {
  return (
    <img
      className="photo-magnet"
      src={photoSrc(photo)}
      alt=""
      draggable={false}
      style={{ width: PHOTO_W, height: PHOTO_H }}
    />
  )
}

// Whatever is on a magnet on the fridge or in the pile: a word, a sticker or a photo.
export function MagnetFace({ text, sticker, photo }: { text: string; sticker?: StickerId; photo?: PhotoId }) {
  if (photo) return <PhotoMagnet photo={photo} />
  return sticker ? <StickerMagnet sticker={sticker} size="fridge" /> : <Magnet text={text} size="fridge" />
}
