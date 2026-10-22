// Turns a piece of the page (the share post) into a PNG, with no libraries.
//
// 1. The enamel / brushed steel textures are WebGPU canvases, and a WebGPU canvas reads back blank once its frame is
//    on screen. So while exporting, every GPU submit is followed by a quick copy of the canvases that just drew.
// 2. The post is cloned with every computed style written inline, its images and fonts turned into data URLs and its
//    canvases swapped for those copies, then wrapped in an SVG <foreignObject> and drawn onto a canvas.

type Frames = Map<HTMLCanvasElement, string>

/** Waits a few frames (falls back to timers when frames are paused, e.g. a hidden tab). */
export function nextFrames(n: number) {
  return new Promise<void>((resolve) => {
    let left = n
    const step = () => {
      if (--left <= 0) resolve()
      else tick()
    }
    const tick = () => {
      let done = false
      const once = () => {
        if (done) return
        done = true
        step()
      }
      requestAnimationFrame(once)
      setTimeout(once, 50)
    }
    tick()
  })
}

/** Starts copying WebGPU canvases right after they draw. Call `waitFor(node)` to get the frames for a node. */
export function startCanvasCapture() {
  const copies = new Map<HTMLCanvasElement, HTMLCanvasElement>()
  const queue = typeof GPUQueue === 'undefined' ? null : GPUQueue.prototype
  const submit = queue?.submit
  if (queue && submit) {
    queue.submit = function (this: GPUQueue, ...args: Parameters<GPUQueue['submit']>) {
      const result = submit.apply(this, args)
      for (const canvas of document.querySelectorAll<HTMLCanvasElement>('.share-card--export canvas')) {
        // a canvas starts at the default 300 × 150 before the shader sizes it; a frame of the wrong shape would come out
        // stretched, so only keep frames drawn at the canvas's real size
        if (canvas.width < 2 || canvas.height < 2 || !fitsElement(canvas)) continue
        const copy = document.createElement('canvas')
        copy.width = canvas.width
        copy.height = canvas.height
        const ctx = copy.getContext('2d', { willReadFrequently: true })!
        ctx.drawImage(canvas, 0, 0)
        if (!isBlank(ctx, copy.width, copy.height)) copies.set(canvas, copy)
      }
      return result
    }
  }
  const stop = () => {
    if (queue && submit) queue.submit = submit
  }

  return {
    /** resolves once every canvas in `node` has drawn (or after a moment, for ones that never do) */
    async waitFor(node: HTMLElement, timeout = 2500): Promise<Frames> {
      const start = performance.now()
      try {
        for (;;) {
          const canvases = [...node.querySelectorAll('canvas')].filter((c) => c.width > 1)
          if (canvases.length && canvases.every((c) => copies.has(c))) break
          if (!queue || performance.now() - start > timeout) break
          await nextFrames(1)
        }
      } finally {
        stop()
      }
      const frames: Frames = new Map()
      for (const [canvas, copy] of copies) frames.set(canvas, copy.toDataURL('image/png'))
      return frames
    },
  }
}

function fitsElement(canvas: HTMLCanvasElement) {
  const w = canvas.clientWidth
  const h = canvas.clientHeight
  if (!w || !h) return false
  return Math.abs(canvas.width / canvas.height - w / h) < 0.02 * (w / h) && canvas.width >= w * 0.9
}

function isBlank(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const d = ctx.getImageData(0, 0, w, h).data
  for (let i = 3; i < d.length; i += 4 * 61) if (d[i]) return false
  return true
}

export async function renderNodeToPng(
  node: HTMLElement,
  { width, height, scale, frames }: { width: number; height: number; scale: number; frames: Frames },
): Promise<Blob> {
  const urls = new Map<string, Promise<string>>()
  const inline = (url: string) => {
    if (url.startsWith('data:')) return Promise.resolve(url)
    if (!urls.has(url)) urls.set(url, toDataUrl(url))
    return urls.get(url)!
  }

  const clone = await cloneWithStyles(node, frames, inline)
  clone.style.position = 'relative'
  clone.style.left = '0'
  clone.style.top = '0'
  clone.style.margin = '0'
  clone.style.transform = 'none'

  const fonts = await fontFaces(inline)
  const html = new XMLSerializer().serializeToString(clone)
  const W = Math.round(width * scale)
  const H = Math.round(height * scale)
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">` +
    `<foreignObject x="0" y="0" width="${W}" height="${H}">` +
    `<div xmlns="http://www.w3.org/1999/xhtml" style="width:${width}px;height:${height}px;transform:scale(${scale});transform-origin:0 0">` +
    `<style>${fonts}</style>${html}</div></foreignObject></svg>`

  const img = new Image()
  img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg)
  await img.decode()
  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(img, 0, 0, W, H)
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('could not encode'))), 'image/png'),
  )
}

const URL_RE = /url\((['"]?)(.*?)\1\)/g

async function replaceUrls(value: string, inline: (url: string) => Promise<string>, base = document.baseURI) {
  const found = [...value.matchAll(URL_RE)]
  let out = value
  for (const m of found) {
    const abs = new URL(m[2]!, base).href
    out = out.replace(m[0], `url("${await inline(abs)}")`)
  }
  return out
}

async function cloneWithStyles(
  el: Element,
  frames: Frames,
  inline: (url: string) => Promise<string>,
): Promise<HTMLElement> {
  // a shader canvas becomes the frame captured for it (or nothing, if it never drew)
  if (el instanceof HTMLCanvasElement) {
    const img = document.createElement('img')
    const frame = frames.get(el)
    if (frame) img.src = frame
    await copyStyle(el, img, inline)
    if (!frame) img.style.display = 'none'
    return img
  }
  const copy = el.cloneNode(false) as HTMLElement
  await copyStyle(el, copy, inline)
  if (el instanceof HTMLImageElement && el.currentSrc) {
    ;(copy as HTMLImageElement).src = await inline(el.currentSrc)
    copy.removeAttribute('srcset')
  }
  for (const child of el.childNodes) {
    if (child.nodeType === Node.ELEMENT_NODE) copy.appendChild(await cloneWithStyles(child as Element, frames, inline))
    else if (child.nodeType === Node.TEXT_NODE) copy.appendChild(child.cloneNode())
  }
  return copy
}

const LOGICAL = /^(inset-(block|inline)|(margin|padding|border|scroll-margin|scroll-padding|overscroll-behavior)-(block|inline)|(min-|max-)?(block|inline)-size|contain-intrinsic-(block|inline)-size)/

async function copyStyle(from: Element, to: HTMLElement | SVGElement, inline: (url: string) => Promise<string>) {
  const cs = getComputedStyle(from)
  let text = ''
  for (let i = 0; i < cs.length; i++) {
    const prop = cs[i]!
    // logical duplicates of left / margin-top / width... would override the position reset on the root
    if (LOGICAL.test(prop)) continue
    let value = cs.getPropertyValue(prop)
    if (value.includes('url(')) value = await replaceUrls(value, inline)
    text += `${prop}:${value};`
  }
  to.setAttribute('style', text)
}

// The @font-face rules the post uses (latin only), with their font files inlined
async function fontFaces(inline: (url: string) => Promise<string>) {
  const families = ['benne', 'dm sans', 'patrick hand', 'inter']
  let css = ''
  for (const sheet of document.styleSheets) {
    let rules: CSSRuleList
    try {
      rules = sheet.cssRules
    } catch {
      continue
    }
    for (const rule of rules) {
      if (!(rule instanceof CSSFontFaceRule)) continue
      const family = rule.style.getPropertyValue('font-family').replace(/['"]/g, '').trim().toLowerCase()
      if (!families.includes(family)) continue
      const range = rule.style.getPropertyValue('unicode-range')
      if (range && !/U\+0000-00FF/i.test(range)) continue
      css += await replaceUrls(rule.cssText, inline, sheet.href ?? document.baseURI)
    }
  }
  return css
}

async function toDataUrl(url: string): Promise<string> {
  const blob = await (await fetch(url)).blob()
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(blob)
  })
}

/** On a phone, hands the image to the share sheet (so it can go to Photos); elsewhere downloads it. */
export async function saveImage(file: File): Promise<'shared' | 'downloaded'> {
  const phone = matchMedia('(pointer: coarse)').matches
  if (phone && navigator.canShare?.({ files: [file] })) {
    await navigator.share({ files: [file] })
    return 'shared'
  }
  const url = URL.createObjectURL(file)
  const a = document.createElement('a')
  a.href = url
  a.download = file.name
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
  return 'downloaded'
}
