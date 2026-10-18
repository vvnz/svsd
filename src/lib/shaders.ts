// Shader setups used across screens, with the exact params from the Figma file.
import type { Shader } from './custom-effect-runtime/types'
import {
  setup as setupEnamel,
  render as renderEnamel,
  manifest as enamelManifest,
} from './custom-effects/CodeComponentId_8c552fed7acffbf136b02cbdf0d8db95993c2df4_381de6e90985c8ec78c4acf4f54027e72beb6d15'
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

// The yellow retro fridge uses the same enamel shader, softer and glossier
export const ENAMEL_YELLOW: Shader[] = [
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
