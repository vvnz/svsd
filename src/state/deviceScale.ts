import { useEffect, useState } from 'react'

// On a laptop the app sits in an iPhone-sized frame (402 × 874, an iPhone 16 / 17 Pro), always in those proportions.
// When the window is too small the whole phone is scaled down to fit, like a zoomed-out screenshot.
// On a phone (narrow screens) it fills the screen at scale 1.
export const DEVICE_W = 402
export const DEVICE_H = 874
const MARGIN = 24 // around the frame, on each side
const PHONE_BREAKPOINT = 600

let current = 1

/** How much the phone frame is scaled on screen. Pointer positions and on-screen rects are in screen pixels, so divide
 *  their differences by this to get the app's own pixels. */
export const deviceScale = () => current

function measure() {
  if (window.innerWidth < PHONE_BREAKPOINT) return 1
  return Math.min(1, (window.innerHeight - MARGIN * 2) / DEVICE_H, (window.innerWidth - MARGIN * 2) / DEVICE_W)
}

export function useDeviceScale() {
  const [scale, setScale] = useState(() => (current = measure()))
  useEffect(() => {
    const update = () => setScale((current = measure()))
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])
  return scale
}
