// Shader setups used across screens, with the exact params from the Figma file.
import type { Shader } from './custom-effect-runtime/types'
import {
  setup as setupEnamel,
  render as renderEnamel,
  manifest as enamelManifest,
} from './custom-effects/CodeComponentId_8c552fed7acffbf136b02cbdf0d8db95993c2df4_381de6e90985c8ec78c4acf4f54027e72beb6d15'
import { setup as setupEnamelLayer, render as renderEnamelLayer, manifest as enamelLayerManifest } from './enamelLayer'
import {
  setup as setupSteel,
  render as renderSteel,
  manifest as steelManifest,
} from './custom-effects/CodeComponentId_bd0d2df9cf46c78c7027b331f40813ba1ccf0e11_917bf46fd321bd0678bafb23daab1df96592d381'

// "Fridge enamel texture" as used on the poem surface and calendar day screen
export const ENAMEL: Shader[] = [
  {
    setup: setupEnamel,
    render: renderEnamel,
    params: {
      bumpDepth: 0.25,
      seed: 7,
      blendStrength: 0.29999998211860657,
      textureSize: 3.6000001430511475,
      lightDirection: 225,
      glossiness: 0.7699999809265137,
    },
    manifest: enamelManifest,
  },
]

// The white fridge's door texture: the same enamel, finer (Figma "Fridges" / white fridge)
export const ENAMEL_WHITE_FRIDGE: Shader[] = [
  {
    setup: setupEnamel,
    render: renderEnamel,
    params: {
      bumpDepth: 0.25,
      seed: 7,
      blendStrength: 0.29999998211860657,
      textureSize: 1.8000000715255737,
      lightDirection: 225,
      glossiness: 0.7699999809265137,
    },
    manifest: enamelManifest,
  },
]

// The retro fridges (yellow, blue, pink) use the same enamel shader, softer and glossier
export const ENAMEL_RETRO: Shader[] = [
  {
    setup: setupEnamel,
    render: renderEnamel,
    params: {
      bumpDepth: 0.5,
      seed: 7,
      blendStrength: 0.07999999821186066,
      textureSize: 2.799999952316284,
      lightDirection: 64,
      glossiness: 1,
    },
    manifest: enamelManifest,
  },
]

// Brushed steel ("Wind vortex" in Figma), laid at 30% over the fridge door gradients
export const STEEL: Shader = {
  setup: setupSteel,
  render: renderSteel,
  params: {
    brushing: 1.0399999618530273,
    zoom: 1,
    brightness: 1.0099999904632568,
    scratches: 1.2599999904632568,
    reflection: 0.6499999761581421,
    steelTint: { r: 1, g: 1, b: 1, a: 1 },
  },
  manifest: steelManifest,
}

// The steel poem background: the same brushed steel, brushed harder (Figma "backgrounds" / Steel Fridge)
export const STEEL_BACKDROP: Shader = { ...STEEL, params: { ...STEEL.params, brushing: 2 } }

// The enamel textures as fill layers (enamelLayer.ts), drawn on top of a gradient like the brushed
// steel, so they work without HTML-in-Canvas. Same params as the effects above.
const asLayer = (effect: Shader): Shader => ({
  setup: setupEnamelLayer,
  render: renderEnamelLayer,
  params: effect.params,
  manifest: enamelLayerManifest,
})
export const ENAMEL_LAYER: Shader = asLayer(ENAMEL[0]!)
export const ENAMEL_WHITE_FRIDGE_LAYER: Shader = asLayer(ENAMEL_WHITE_FRIDGE[0]!)
export const ENAMEL_RETRO_LAYER: Shader = asLayer(ENAMEL_RETRO[0]!)
