import type { CSSProperties, ReactNode } from 'react'

import { ShaderFill } from '../lib/custom-effect-runtime'
import type { Shader } from '../lib/custom-effect-runtime/types'
import { ENAMEL_RETRO_LAYER, ENAMEL_WHITE_FRIDGE_LAYER, STEEL } from '../lib/shaders'
import type { FridgeStyle } from '../state/appState'

import whiteBody from '../assets/fridges/white-body.svg'
import whiteTextureMask from '../assets/fridges/white-texture-mask.svg'
import whiteHandleTopA from '../assets/fridges/white-handle-top-a.svg'
import whiteHandleTopB from '../assets/fridges/white-handle-top-b.svg'
import whiteHandleGap from '../assets/fridges/white-handle-gap.svg'
import whiteHandleLowA from '../assets/fridges/white-handle-low-a.svg'
import whiteHandleLowB from '../assets/fridges/white-handle-low-b.svg'
import yellowSeamTop from '../assets/fridges/yellow-seam-top.png'
import yellowSeamBottom from '../assets/fridges/yellow-seam-bottom.png'
import blueVent from '../assets/fridges/blue-vent.svg'
import blueVentFlipped from '../assets/fridges/blue-vent-flipped.svg'
import blueHandleTop from '../assets/fridges/blue-handle-top.svg'
import blueHandleLow from '../assets/fridges/blue-handle-low.svg'
import pinkHandleCap from '../assets/fridges/pink-handle-cap.svg'
import pinkHandleBar from '../assets/fridges/pink-handle-bar.svg'
import steelKick from '../assets/fridges/steel-kick.png'
import steelSeam from '../assets/fridges/steel-seam.svg'
import steelHandleLeft from '../assets/fridges/steel-handle-left.svg'
import steelHandleRight from '../assets/fridges/steel-handle-right.svg'
import steelHandleFoot from '../assets/fridges/steel-handle-foot.svg'

// The five fridges from the Figma component set "Fridges" (38:1598), drawn in its 250 x 395 frame.
// Converted from Figma's design-to-code output: positions, gradients and shader params are exact.
// Gradient stops are recomputed from Figma's raw gradient data where that output dropped minus signs.
// `flat` skips the WebGPU shaders (small thumbnails); without WebGPU they fall back to the plain gradients.
export const ART_W = 250
export const ART_H = 395

type Box = [left: number, top: number, width: number, height: number]
const at = ([left, top, width, height]: Box, extra?: CSSProperties): CSSProperties => ({
  position: 'absolute',
  left,
  top,
  width,
  height,
  ...extra,
})

function Img({ src, box, style }: { src: string; box: Box; style?: CSSProperties }) {
  return <img alt="" src={src} className="fridge-art__img" style={at(box, style)} />
}

// A door: its gradient with the enamel texture layered on top (like the brushed steel), clipped to the door.
function Enamel({ box, flat, layer = ENAMEL_RETRO_LAYER, style, rotate }: {
  box: Box
  flat: boolean
  layer?: Shader
  style: CSSProperties
  rotate?: boolean
}) {
  const { borderRadius, ...surface } = style
  return (
    <div style={at(box, { borderRadius, overflow: 'hidden', transform: rotate ? 'rotate(180deg)' : undefined })}>
      <div className="fridge-art__fill" style={surface} />
      {!flat && <ShaderFill className="fridge-art__fill" shader={layer} />}
    </div>
  )
}

// A steel panel: its gradient with brushed steel at 30% on top.
function Steel({ box, flat, gradient, flip }: { box: Box; flat: boolean; gradient: string; flip?: boolean }) {
  return (
    <div style={at(box, flip ? { transform: 'scaleX(-1)' } : undefined)}>
      <div className="fridge-art__fill" style={{ backgroundImage: gradient }} />
      {!flat && <ShaderFill className="fridge-art__fill" style={{ opacity: 0.3 }} shader={STEEL} />}
    </div>
  )
}

const RETRO_BLUE = (w: number, h: number, m: string) =>
  `url("data:image/svg+xml;utf8,<svg viewBox='0 0 ${w} ${h}' xmlns='http://www.w3.org/2000/svg' preserveAspectRatio='none'><rect x='0' y='0' height='100%' width='100%' fill='url(%23grad)' opacity='1'/><defs><radialGradient id='grad' gradientUnits='userSpaceOnUse' cx='0' cy='0' r='10' gradientTransform='matrix(${m})'><stop stop-color='rgba(232,250,250,1)' offset='0.50527'/><stop stop-color='rgba(226,248,247,1)' offset='0.53071'/><stop stop-color='rgba(155,227,212,1)' offset='1'/></radialGradient></defs></svg>")`

const WHITE_MASK: CSSProperties = {
  maskImage: `url("${whiteTextureMask}")`,
  maskMode: 'alpha',
  maskRepeat: 'no-repeat',
  maskPosition: '0.243px 0.471px',
  maskSize: '242.514px 390.058px',
}

function WhiteFridge({ flat }: { flat: boolean }) {
  return (
    <>
      <Img src={whiteBody} box={[3.74, 2.47, 242.514, 390.058]} />
      {/* the body's tint multiplied over it, then the enamel texture on top, both clipped to the body's shape */}
      <div style={at([3.5, 2, 243, 382], { mixBlendMode: 'multiply' })}>
        <div style={{ width: 243, height: 382, background: '#f5f7f8', opacity: 0.7, ...WHITE_MASK }} />
      </div>
      {!flat && (
        <div style={at([3.5, 2, 243, 382], WHITE_MASK)}>
          <ShaderFill className="fridge-art__fill" shader={ENAMEL_WHITE_FRIDGE_LAYER} />
        </div>
      )}
      <div style={at([3.74, 383.61, 13.257, 8.918], { backgroundImage: 'linear-gradient(to bottom, #595959, #646464)' })} />
      <Img src={whiteHandleTopA} box={[29.97, 101.64, 6.875, 95.049]} />
      <Img src={whiteHandleTopB} box={[21.02, 101.81, 13.476, 94.882]} />
      <Img src={whiteHandleGap} box={[21.75, 199.49, 15.442, 0.866]} />
      <Img src={whiteHandleLowA} box={[29.68, 199.49, 7.501, 95.698]} />
      <Img src={whiteHandleLowB} box={[20.07, 200.35, 14.431, 94.882]} style={{ transform: 'scaleY(-1)' }} />
    </>
  )
}

function YellowFridge({ flat }: { flat: boolean }) {
  return (
    <>
      <div
        style={at([16.04, 367.57, 217.918, 24.963], {
          transform: 'rotate(180deg)',
          borderRadius: '14px 14px 0 0',
          backgroundImage: 'linear-gradient(184.38deg, rgb(216, 198, 143) 20.04%, rgb(200, 125, 59) 87.332%)',
        })}
      />
      <Enamel
        box={[3.74, 2.47, 242.514, 139.773]}
        flat={flat}
        style={{
          borderRadius: '30px 30px 0 0',
          backgroundImage: 'linear-gradient(165.82deg, rgb(255, 241, 177) 49.714%, rgb(255, 236, 177) 62.475%, rgb(255, 209, 143) 97.886%)',
        }}
      />
      <Enamel
        box={[3.74, 155.49, 242.514, 224.619]}
        flat={flat}
        rotate
        style={{
          borderRadius: '14px 14px 0 0',
          backgroundImage: 'linear-gradient(-79.19deg, rgb(255, 241, 177) 22.007%, rgb(255, 236, 177) 42.946%, rgb(255, 209, 143) 101.05%)',
        }}
      />
      <Img src={yellowSeamTop} box={[3.74, 142.24, 242.514, 7.011]} style={{ objectFit: 'cover' }} />
      <Img src={yellowSeamBottom} box={[3.74, 151.98, 242.514, 7.011]} style={{ objectFit: 'cover' }} />
      <div style={at([7.82, 149.26, 234.37, 2.726], { background: '#a58930' })} />
      <div style={at([35.62, 115.04, 28.725, 5.667], { background: '#e2c877', borderRadius: 2, transform: 'rotate(-2.34deg)' })} />
      <div style={at([35.62, 175.03, 28.725, 5.667], { background: '#e2c877', borderRadius: 2, transform: 'rotate(-2.34deg)' })} />
      <div
        style={at([34.29, 116.49, 59.049, 7.567], {
          borderRadius: '2px 15px 3px 2px',
          backgroundImage: 'linear-gradient(174.8deg, rgb(179, 158, 91) 9.4404%, rgb(167, 128, 42) 81.333%)',
        })}
      />
      <div
        style={at([34.29, 176.48, 59.049, 7.567], {
          borderRadius: '2px 3px 15px 2px',
          backgroundImage: 'linear-gradient(177.06deg, rgb(179, 158, 91) 3.5504%, rgb(167, 128, 42) 116.74%)',
        })}
      />
    </>
  )
}

function BlueFridge({ flat }: { flat: boolean }) {
  return (
    <>
      <Enamel
        box={[30.32, 2.47, 189.363, 139.773]}
        flat={flat}
        style={{ borderRadius: '18px 18px 0 0', backgroundImage: RETRO_BLUE(189.36, 139.77, '0.42001 12.142 -16.45 0.56902 90.482 72.997') }}
      />
      <Enamel
        box={[30.32, 149.25, 189.363, 243.274]}
        flat={flat}
        rotate
        style={{
          borderRadius: '4px 4px 0 0',
          backgroundImage: `${RETRO_BLUE(189.36, 243.27, '0.42001 21.133 -16.45 0.99037 90.482 127.05')}, linear-gradient(90deg, rgb(232, 250, 250) 0%, rgb(232, 250, 250) 100%)`,
        }}
      />
      <div style={at([32.59, 142.24, 184.814, 7.011], { backgroundImage: 'linear-gradient(29.92deg, rgb(204, 246, 246) 6.002%, rgb(149, 209, 209) 61.214%)' })} />
      <Img src={blueVent} box={[46.64, 378.55, 157.928, 3]} />
      {/* Figma flips this one vertically then rotates it 180°, which is a horizontal flip */}
      <Img src={blueVentFlipped} box={[46.64, 369.82, 157.928, 3]} style={{ transform: 'scaleX(-1)' }} />
      <Img src={blueVent} box={[46.64, 360.01, 157.928, 3]} />
      <div style={at([55.92, 127.75, 22.554, 3.394], { backgroundImage: 'linear-gradient(8.79deg, rgb(120, 202, 188) 25.345%, rgb(90, 157, 146) 75.835%)' })} />
      <div style={at([55.92, 160.36, 22.554, 3.394], { transform: 'scaleY(-1)', backgroundImage: 'linear-gradient(5.53deg, rgb(120, 202, 188) 26.278%, rgb(90, 157, 146) 78.088%)' })} />
      <Img src={blueHandleTop} box={[45.84, 123.8, 40.529, 7.838]} />
      <Img src={blueHandleLow} box={[45.84, 159.86, 40.529, 7.838]} />
    </>
  )
}

function PinkFridge({ flat }: { flat: boolean }) {
  return (
    <>
      <Enamel
        box={[17.3, 46.82, 215.402, 301.366]}
        flat={flat}
        style={{
          borderRadius: '30px 30px 20px 20px',
          backgroundImage: 'linear-gradient(103.95deg, rgb(237, 188, 212) 19.07%, rgb(248, 215, 231) 56.699%, rgb(237, 188, 212) 85.049%, rgb(229, 139, 182) 126.29%)',
        }}
      />
      <div
        style={at([48.62, 163.31, 34.967, 25.261], {
          borderRadius: '0 48.419px 48.419px 0',
          backgroundImage: 'linear-gradient(-0.51deg, #f6c8de -17.16%, #ac5b9a 42.13%, #f6c8de 107.42%)',
        })}
      />
      <Img src={pinkHandleCap} box={[42.12, 166.92, 16.031, 18.03]} />
      <Img src={pinkHandleBar} box={[56.46, 168.74, 39.977, 14.722]} />
    </>
  )
}

function SteelFridge({ flat }: { flat: boolean }) {
  return (
    <>
      <Steel
        box={[3.74, 3.83, 118.019, 263.313]}
        flat={flat}
        gradient="linear-gradient(90deg, #606060 -41.96%, #737373 17.68%, #a5a5a5 83.27%, #dfdfdf 135.24%)"
      />
      <Steel
        box={[128.23, 3.83, 118.019, 263.313]}
        flat={flat}
        flip
        gradient="linear-gradient(90deg, #676767 -41.96%, #7b7b7b 17.68%, #a9a9a9 83.27%, #dfdfdf 135.24%)"
      />
      <Steel
        box={[3.74, 270.96, 242.514, 114.01]}
        flat={flat}
        gradient="linear-gradient(90deg, rgb(123, 123, 122) 0%, rgb(126, 126, 125) 21.141%, rgb(188, 188, 185) 51.131%, rgb(138, 138, 138) 77.189%, rgb(118, 118, 118) 102.26%)"
      />
      <Img src={steelKick} box={[9.1, 384.97, 231.779, 6.193]} style={{ objectFit: 'cover' }} />
      <Img src={steelSeam} box={[3.73, 267.15, 242.534, 3.817]} />
      <div style={at([121.76, 7.67, 6.478, 259.474], { backgroundImage: 'linear-gradient(to bottom, #686868, #a0a0a0 56.25%, #707070)' })} />
      <Img src={steelHandleLeft} box={[99.78, 53.22, 17.954, 171.137]} />
      <Img src={steelHandleRight} box={[132.26, 53.22, 17.954, 171.137]} style={{ transform: 'scaleX(-1)' }} />
      <Img src={steelHandleFoot} box={[136.31, 217.76, 9.488, 1.17]} />
      <Img src={steelHandleFoot} box={[103.83, 217.76, 9.488, 1.17]} />
    </>
  )
}

const ART: Record<FridgeStyle, (p: { flat: boolean }) => ReactNode> = {
  white: WhiteFridge,
  yellow: YellowFridge,
  blue: BlueFridge,
  pink: PinkFridge,
  steel: SteelFridge,
}

export function FridgeArt({ style, flat = false }: { style: FridgeStyle; flat?: boolean }) {
  const Art = ART[style]
  return (
    <div className="fridge-art" style={{ width: ART_W, height: ART_H }} aria-hidden>
      <Art flat={flat} />
    </div>
  )
}
