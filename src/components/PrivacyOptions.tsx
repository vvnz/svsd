import { Toggle } from './Toggle'
import { useApp, type Privacy } from '../state/appState'

// Options from the Figma note in "hello fi" (75:5378): "places i visit / image based location"
// and "all images / daily chosen images only", plus "off" for each, and music apps.
// Shared by Settings and the privacy onboarding. Everything here is simulated.

type Option<T> = { value: T; label: string; hint: string }

export const PHOTO_OPTIONS: Option<Privacy['photos']>[] = [
  { value: 'all', label: 'all photos', hint: 'words and image days from any photo you take' },
  { value: 'picked', label: 'ones i pick', hint: 'only the photos you choose for each day' },
  { value: 'off', label: 'none', hint: 'no photos are used' },
]

export const LOCATION_OPTIONS: Option<Privacy['location']>[] = [
  { value: 'places', label: 'places i visit', hint: "journalling prompts from where you've been" },
  { value: 'photos', label: 'from my photos', hint: 'only the location saved in your photos' },
  { value: 'off', label: 'off', hint: 'no location is used' },
]

export const MUSIC_HINT = "words from what you've been listening to"

/** The privacy rows, inside a settings card. */
export function PrivacyOptions() {
  const { privacy, updatePrivacy } = useApp()

  return (
    <>
      <Choice
        label="photos"
        options={PHOTO_OPTIONS}
        value={privacy.photos}
        onChange={(photos) => updatePrivacy({ photos })}
      />
      <Choice
        label="location"
        options={LOCATION_OPTIONS}
        value={privacy.location}
        // location from photos needs photos
        disabled={privacy.photos === 'off' ? ['photos'] : []}
        onChange={(location) => updatePrivacy({ location })}
      />
      <div className="row">
        <span className="row__label">music apps</span>
        <Toggle label="music apps" on={privacy.music} onChange={(music) => updatePrivacy({ music })} />
      </div>
      <p className="row__hint">{privacy.music ? MUSIC_HINT : 'no music apps are used'}</p>
    </>
  )
}

function Choice<T extends string>({
  label,
  options,
  value,
  disabled = [],
  onChange,
}: {
  label: string
  options: Option<T>[]
  value: T
  disabled?: T[]
  onChange: (v: T) => void
}) {
  const current = options.find((o) => o.value === value)
  return (
    <>
      <div className="row">
        <span className="row__label">{label}</span>
      </div>
      <div className="row row--chips" role="radiogroup" aria-label={label}>
        {options.map((o) => (
          <button
            key={o.value}
            className={`chip ${o.value === value ? 'is-on' : ''}`}
            role="radio"
            aria-checked={o.value === value}
            disabled={disabled.includes(o.value)}
            onClick={() => onChange(o.value)}
          >
            {o.label}
          </button>
        ))}
      </div>
      {current && <p className="row__hint">{current.hint}</p>}
    </>
  )
}
