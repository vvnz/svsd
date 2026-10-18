import { ShaderFill } from '../lib/custom-effect-runtime'
import { STEEL } from '../lib/shaders'

// Full-screen brushed steel, as behind "View Favourite" and the calendar day view:
// a soft grey gradient, the steel texture at 30%, and a light vignette.
export function SteelBackdrop() {
  return (
    <div className="steel-backdrop" aria-hidden>
      <ShaderFill className="steel-backdrop__texture" shader={STEEL} />
      <div className="steel-backdrop__vignette" />
    </div>
  )
}
