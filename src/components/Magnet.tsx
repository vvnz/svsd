import type { CSSProperties } from 'react'

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
