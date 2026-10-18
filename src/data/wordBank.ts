// Sample word bank for the prototype.
// Where personal words really come from is still undecided, so a few are
// hardcoded here and flagged `personal: true` to stand in for "words from your day".

export type BankWord = {
  id: string
  text: string
  personal?: boolean
}

const BASE_WORDS = [
  // connectors, so poems are actually writable
  'the', 'a', 'i', 'you', 'my', 'we', 'and', 'is', 'in', 'of', 'not',
  // evocative words from the Figma designs
  'still', 'moon', 'drift', 'hollow', 'rust', 'bloom', 'tender', 'ache',
  'salt', 'wander', 'hush', 'velvet', 'echo', 'wild', 'golden', 'dusk',
]

const PERSONAL_WORDS = ['3am', 'dumplings', 'midterm']

// Small seeded shuffle so the same day always gets the same order.
function seededShuffle<T>(items: T[], seed: number): T[] {
  const out = [...items]
  let s = seed
  for (let i = out.length - 1; i > 0; i--) {
    s = (s * 9301 + 49297) % 233280
    const j = Math.floor((s / 233280) * (i + 1))
    ;[out[i], out[j]] = [out[j]!, out[i]!]
  }
  return out
}

export function wordBankFor(dateKey: string): BankWord[] {
  const seed = Number(dateKey.replaceAll('-', ''))
  const words: BankWord[] = [
    ...BASE_WORDS.map((text) => ({ id: `w-${text}`, text })),
    ...PERSONAL_WORDS.map((text) => ({ id: `w-${text}`, text, personal: true })),
  ]
  return seededShuffle(words, seed)
}

export const MAX_WORDS_ON_FRIDGE = 20
