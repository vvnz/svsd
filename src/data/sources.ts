import type { IconName } from '../components/Icon'

// The apps shown on the "connect app" screen, in the Figma order.
// For the prototype, connecting is simulated: nothing is actually read from these apps.
export type Source = {
  id: string
  name: string
  icon: IconName
  iconSize: number
}

export const SOURCES: Source[] = [
  { id: 'imessage', name: 'iMessage', icon: 'imessage', iconSize: 43 },
  { id: 'instagram', name: 'Instagram', icon: 'instagram', iconSize: 43 },
  { id: 'whatsapp', name: 'Whatsapp', icon: 'whatsapp', iconSize: 43 },
  { id: 'facebook', name: 'Facebook', icon: 'facebook', iconSize: 43 },
  { id: 'x', name: 'X', icon: 'x', iconSize: 43 },
  { id: 'spotify', name: 'Spotify', icon: 'spotify', iconSize: 34 },
]
