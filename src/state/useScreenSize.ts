import { useLayoutEffect, useRef, useState } from 'react'

// The size of a screen element, kept up to date as the window resizes.
export function useScreenSize() {
  const ref = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState({ width: 402, height: 874 })
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    setSize({ width: el.clientWidth, height: el.clientHeight })
    const ro = new ResizeObserver(([entry]) => {
      if (entry) setSize({ width: entry.contentRect.width, height: entry.contentRect.height })
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  return [ref, size] as const
}
