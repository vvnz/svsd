// Turns a photo into a die-cut sticker, all in the browser with a canvas (no libraries, nothing uploaded).
//
// The background is found by colour: starting from the photo's edges, it spreads through pixels that are close to
// their neighbour and to the edges' typical colour, so an object on a plain table, wall or sheet of paper comes out
// on its own. If that doesn't leave a clear object (busy backgrounds), the photo is cut into a circle instead.
// The result gets a white sticker border and is trimmed into a square PNG.

const WORK = 320 // the photo is shrunk to this before cutting, so it's quick
const OUT = 256 // the finished sticker, square
const BORDER = 7 // white border, in output pixels

export async function makeSticker(file: Blob): Promise<string> {
  const img = await loadImage(file)
  const k = Math.min(1, WORK / Math.max(img.width, img.height))
  const w = Math.max(1, Math.round(img.width * k))
  const h = Math.max(1, Math.round(img.height * k))
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!
  ctx.drawImage(img, 0, 0, w, h)
  const data = ctx.getImageData(0, 0, w, h)

  let alpha = backgroundMask(data)
  const fg = alpha.reduce((n, a) => n + (a ? 1 : 0), 0) / (w * h)
  // nearly everything or nearly nothing is "background": no clear object, so cut a circle
  if (fg < 0.04 || fg > 0.92) alpha = circleMask(w, h)
  else alpha = feather(keepMainShapes(alpha, w, h), w, h)

  for (let i = 0; i < w * h; i++) data.data[i * 4 + 3] = alpha[i]!
  ctx.putImageData(data, 0, 0)
  return finish(canvas, alpha, w, h)
}

function loadImage(file: Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve(img)
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('not an image'))
    }
    img.src = url
  })
}

// 0 for background, 255 for the object
function backgroundMask({ data, width: w, height: h }: ImageData): Uint8ClampedArray {
  const px = (i: number) => [data[i * 4]!, data[i * 4 + 1]!, data[i * 4 + 2]!] as const
  const dist = (a: readonly number[], b: readonly number[]) =>
    Math.hypot(a[0]! - b[0]!, a[1]! - b[1]!, a[2]! - b[2]!)

  // the edges' typical colour: the median of the border pixels, channel by channel
  const border: number[] = []
  for (let x = 0; x < w; x++) border.push(x, (h - 1) * w + x)
  for (let y = 1; y < h - 1; y++) border.push(y * w, y * w + w - 1)
  const median = [0, 1, 2].map((c) => {
    const vals = border.map((i) => data[i * 4 + c]!).sort((a, b) => a - b)
    return vals[vals.length >> 1]!
  })

  const NEIGHBOUR = 20 // a smooth step from the pixel next door
  const FAR = 105 // but never too far from the edges' colour
  const bg = new Uint8Array(w * h)
  const queue: number[] = []
  for (const i of border) {
    if (!bg[i] && dist(px(i), median) < FAR) {
      bg[i] = 1
      queue.push(i)
    }
  }
  while (queue.length) {
    const i = queue.pop()!
    const x = i % w
    const y = (i - x) / w
    const here = px(i)
    for (const j of [x > 0 ? i - 1 : -1, x < w - 1 ? i + 1 : -1, y > 0 ? i - w : -1, y < h - 1 ? i + w : -1]) {
      if (j < 0 || bg[j]) continue
      const p = px(j)
      if (dist(p, here) < NEIGHBOUR && dist(p, median) < FAR) {
        bg[j] = 1
        queue.push(j)
      }
    }
  }
  const alpha = new Uint8ClampedArray(w * h)
  for (let i = 0; i < w * h; i++) alpha[i] = bg[i] ? 0 : 255
  return alpha
}

// Drops specks: keeps the biggest shape and anything at least a fifth of its size.
function keepMainShapes(alpha: Uint8ClampedArray, w: number, h: number) {
  const label = new Int32Array(w * h).fill(-1)
  const sizes: number[] = []
  for (let s = 0; s < w * h; s++) {
    if (!alpha[s] || label[s]! >= 0) continue
    const id = sizes.length
    let size = 0
    const stack = [s]
    label[s] = id
    while (stack.length) {
      const i = stack.pop()!
      size++
      const x = i % w
      for (const j of [x > 0 ? i - 1 : -1, x < w - 1 ? i + 1 : -1, i - w, i + w]) {
        if (j >= 0 && j < w * h && alpha[j] && label[j]! < 0) {
          label[j] = id
          stack.push(j)
        }
      }
    }
    sizes.push(size)
  }
  const biggest = Math.max(0, ...sizes)
  const out = new Uint8ClampedArray(w * h)
  for (let i = 0; i < w * h; i++) {
    const id = label[i]!
    if (id >= 0 && sizes[id]! >= biggest / 5) out[i] = 255
  }
  return out
}

// A 1px soft edge, so the cut doesn't look jagged
function feather(alpha: Uint8ClampedArray, w: number, h: number) {
  const out = new Uint8ClampedArray(w * h)
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let sum = 0
      let n = 0
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const xx = x + dx
          const yy = y + dy
          if (xx < 0 || yy < 0 || xx >= w || yy >= h) continue
          sum += alpha[yy * w + xx]!
          n++
        }
      }
      out[y * w + x] = sum / n
    }
  }
  return out
}

function circleMask(w: number, h: number) {
  const r = Math.min(w, h) * 0.46
  const out = new Uint8ClampedArray(w * h)
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const d = Math.hypot(x + 0.5 - w / 2, y + 0.5 - h / 2)
      out[y * w + x] = Math.max(0, Math.min(255, (r - d + 0.5) * 255))
    }
  }
  return out
}

// Trim to the object, fit it into the square, and put a white border round it.
function finish(cut: HTMLCanvasElement, alpha: Uint8ClampedArray, w: number, h: number) {
  let x0 = w
  let y0 = h
  let x1 = 0
  let y1 = 0
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (alpha[y * w + x]! > 24) {
        x0 = Math.min(x0, x)
        y0 = Math.min(y0, y)
        x1 = Math.max(x1, x)
        y1 = Math.max(y1, y)
      }
    }
  }
  const bw = x1 - x0 + 1
  const bh = y1 - y0 + 1
  const inner = OUT - BORDER * 2 - 4
  const s = inner / Math.max(bw, bh)
  const dw = bw * s
  const dh = bh * s
  const dx = (OUT - dw) / 2
  const dy = (OUT - dh) / 2

  const out = document.createElement('canvas')
  out.width = OUT
  out.height = OUT
  const ctx = out.getContext('2d')!

  // the border: the object's silhouette in white, stamped in a ring around it
  const sil = document.createElement('canvas')
  sil.width = OUT
  sil.height = OUT
  const sctx = sil.getContext('2d')!
  sctx.drawImage(cut, x0, y0, bw, bh, dx, dy, dw, dh)
  sctx.globalCompositeOperation = 'source-in'
  sctx.fillStyle = '#fff'
  sctx.fillRect(0, 0, OUT, OUT)
  for (let a = 0; a < 24; a++) {
    const t = (a / 24) * Math.PI * 2
    ctx.drawImage(sil, Math.cos(t) * BORDER, Math.sin(t) * BORDER)
  }
  ctx.drawImage(sil, 0, 0)

  ctx.drawImage(cut, x0, y0, bw, bh, dx, dy, dw, dh)
  return out.toDataURL('image/png')
}
