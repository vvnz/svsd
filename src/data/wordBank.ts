// Each day's Add Magnets words: 25 a day, 20 pulled from the Magnetic Poetry kit list (wordList.ts)
// and 5 custom words.
// - always the, a, and, i and you; 5 more core small words (my, is, of, to, ing, s…); 2 other small
//   words; 8 other words. Words with more copies in the kit are much more likely to turn up
//   (weight = copies squared), like drawing from the real box.
// - 5 custom words, standing in for "words from your day" (photos, location, music in the privacy
//   settings). Where these really come from is still undecided, so they're **simulated**: a rotating
//   pick from a small pool.
// The same day always gets the same pull; tomorrow is a new mix.
import { ALWAYS_WORDS, CORE_WORDS, GLUE_WORDS, KIT_WORDS } from './wordList'

export type BankWord = {
  id: string
  text: string
  personal?: boolean
}

const CORE_PER_DAY = 5
const SMALL_PER_DAY = 2
const OTHER_PER_DAY = 8
const CUSTOM_PER_DAY = 5
const CUSTOM_POOL = [
  '3am', 'dumplings', 'midterm', 'subway', 'matcha', 'playlist', 'studio', 'roommate',
  'sunset', 'library', 'bike', 'deadline', 'sketchbook', 'rooftop', 'ramen', 'chorus',
]

// Small seeded random, so the same date always gives the same numbers.
function seededRandom(seed: number) {
  let s = seed >>> 0
  return () => {
    s = (s + 0x6d2b79f5) >>> 0
    let t = s
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// Pick `count` words without repeats, each weighted by its copies in the kit, squared
// (each word gets a random key r^(1/weight); the highest keys win).
function weightedPick(words: string[], count: number, random: () => number) {
  return words
    .map((w) => ({ w, key: Math.pow(random(), 1 / (KIT_WORDS[w] ?? 1) ** 2) }))
    .sort((a, b) => b.key - a.key)
    .slice(0, count)
    .map((x) => x.w)
}

function shuffle<T>(items: T[], random: () => number): T[] {
  const out = [...items]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1))
    ;[out[i], out[j]] = [out[j]!, out[i]!]
  }
  return out
}

const all = Object.keys(KIT_WORDS)
const core = new Set([...ALWAYS_WORDS, ...CORE_WORDS])
const otherSmall = all.filter((w) => GLUE_WORDS.has(w) && !core.has(w))
const otherWords = all.filter((w) => !GLUE_WORDS.has(w))

export function wordBankFor(dateKey: string): BankWord[] {
  const random = seededRandom(Number(dateKey.replaceAll('-', '')))
  const kit = [
    ...ALWAYS_WORDS,
    ...weightedPick(CORE_WORDS, CORE_PER_DAY, random),
    ...weightedPick(otherSmall, SMALL_PER_DAY, random),
    ...weightedPick(otherWords, OTHER_PER_DAY, random),
  ]
  const custom = shuffle(CUSTOM_POOL, random).slice(0, CUSTOM_PER_DAY)
  const words: BankWord[] = [
    ...kit.map((text) => ({ id: `w-${text}`, text })),
    ...custom.map((text) => ({ id: `w-${text}`, text, personal: true })),
  ]
  return shuffle(words, random)
}
