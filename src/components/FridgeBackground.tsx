import { ShaderFill } from '../lib/custom-effect-runtime'
import { ENAMEL_LAYER, ENAMEL_RETRO_LAYER, STEEL_BACKDROP } from '../lib/shaders'
import type { FridgeStyle } from '../state/appState'

// Today's poem surface, in the chosen fridge's finish: Figma "backgrounds" (133:3948),
// White / Yellow / Blue / Pink / Steel Fridge. Converted from Figma's design-to-code output.
// Each is its gradient with the enamel texture layered on top (steel: brushed steel at 30%).
// The textures need WebGPU; without it they fall back to the plain gradients.

const BLUE =
  "url(\"data:image/svg+xml;utf8,<svg viewBox='0 0 402 874' xmlns='http://www.w3.org/2000/svg' preserveAspectRatio='none'><rect x='0' y='0' height='100%' width='100%' fill='url(%23grad)' opacity='1'/><defs><radialGradient id='grad' gradientUnits='userSpaceOnUse' cx='0' cy='0' r='10' gradientTransform='matrix(0.89163 93.455 -42.994 4.2848 192.08 456.45)'><stop stop-color='rgba(232,250,250,1)' offset='0.25504'/><stop stop-color='rgba(226,248,247,1)' offset='0.53071'/><stop stop-color='rgba(155,227,212,1)' offset='1'/></radialGradient></defs></svg>\")"

const GRADIENTS: Partial<Record<FridgeStyle, string>> = {
  yellow:
    'linear-gradient(-87.47deg, #ffd18f -23.25%, #fff1b1 19.66%, #ffecb1 62.77%, #ffd18f 120.05%)',
  blue: BLUE,
  pink: 'linear-gradient(104.88deg, rgb(237, 188, 212) 11.284%, rgb(248, 215, 231) 39.684%, rgb(237, 188, 212) 94.885%, rgb(229, 139, 182) 131.66%)',
  // Figma's angle and stop positions, in the steel fridge's own drawer colours (38:1702) so they match
  steel: 'linear-gradient(92.96deg, #7e7e7d 20.24%, #bcbcb9 55.23%, #8a8a8a 93.62%, #767676 121.33%)',
}

// Finishes too dark for the grey secondary text: screens add `on-dark` so it switches to black 4.
export const isDarkFinish = (style: FridgeStyle) => style === 'steel'

// The enamel texture as a layer on top (like the brushed steel), over a tint of surface-2
// multiplied onto the colour, as in Figma.
function EnamelLayers({ retro = false, tint = true }: { retro?: boolean; tint?: boolean }) {
  return (
    <>
      {tint && <div className="surface surface--tint" />}
      <ShaderFill className="surface" shader={ENAMEL_LAYER} />
      {retro && <ShaderFill className="surface" shader={ENAMEL_RETRO_LAYER} />}
    </>
  )
}

export function FridgeBackground({ style }: { style: FridgeStyle }) {
  if (style === 'steel') {
    return (
      <div className="surface surface--plain">
        <div className="surface" style={{ backgroundImage: GRADIENTS.steel }} />
        <ShaderFill className="surface" style={{ opacity: 0.3 }} shader={STEEL_BACKDROP} />
      </div>
    )
  }
  if (style === 'white') {
    return (
      <div className="surface surface--plain">
        <EnamelLayers tint={false} />
      </div>
    )
  }
  // yellow, blue, pink: the colour, then the enamel; pink also has the retro enamel over everything
  return (
    <div className="surface" style={{ backgroundImage: GRADIENTS[style] }}>
      <EnamelLayers retro={style === 'pink'} />
    </div>
  )
}
