// The word list from `Word List.pdf` in the repo (Magnetic Poetry Original Kit), with how many
// copies of each magnet the kit has. The copies are weights: a word with more copies is more likely
// to turn up in a day's pull, like drawing from the real box. Lowercase, like the magnets.
export const KIT_WORDS: Record<string, number> = {
  '&': 2, a: 6, about: 1, above: 1, ache: 1, ad: 1, after: 1, all: 1, am: 2, an: 2, and: 4, apparatus: 1,
  are: 2, arm: 1, as: 4, ask: 1, at: 3, away: 1, bare: 1, be: 1, beat: 1, beauty: 1, bed: 1, beneath: 1,
  bitter: 1, black: 1, blood: 1, blow: 1, blue: 1, boil: 1, boy: 1, breast: 1, but: 4, butt: 1, by: 2,
  can: 1, chant: 1, chocolate: 1, cool: 1, could: 1, crush: 1, cry: 1, d: 1, day: 1, death: 1,
  delirious: 1, diamond: 1, did: 1, do: 2, dream: 1, dress: 1, drive: 1, drool: 1, drunk: 1, eat: 1,
  ed: 4, egg: 1, elaborate: 1, enormous: 1, er: 1, es: 1, est: 1, fast: 1, feet: 1, fiddle: 1, finger: 1,
  fluff: 1, for: 1, forest: 1, frantic: 1, friend: 1, from: 2, garden: 1, girl: 1, go: 1, goddess: 1,
  gorgeous: 1, gown: 1, hair: 1, has: 1, have: 2, he: 2, head: 1, heave: 1, her: 2, here: 1, him: 1,
  his: 2, honey: 1, hot: 1, how: 1, i: 4, if: 1, in: 3, ing: 6, is: 5, it: 3, juice: 1, lake: 1,
  language: 1, languid: 1, lather: 1, lazy: 1, less: 1, let: 1, lick: 1, lie: 1, life: 1, light: 1,
  like: 3, live: 1, love: 1, luscious: 1, lust: 1, ly: 4, mad: 1, man: 1, me: 3, mean: 1, meat: 1,
  men: 1, milk: 1, mist: 1, moan: 1, moon: 1, mother: 1, music: 1, must: 1, my: 3, need: 1, never: 1,
  no: 2, not: 2, of: 4, on: 2, one: 1, or: 1, our: 1, over: 1, pant: 1, peach: 1, petal: 1, picture: 1,
  pink: 1, play: 1, please: 1, pole: 1, pound: 1, puppy: 1, purple: 1, put: 1, r: 2, rain: 1, raw: 1,
  recall: 1, red: 1, repulsive: 1, rip: 1, rock: 1, rose: 1, run: 1, rust: 1, s: 11, sad: 1, said: 1,
  sausage: 1, say: 1, scream: 1, sea: 1, see: 1, shadow: 1, she: 2, shine: 1, ship: 1, shot: 1, show: 1,
  sing: 1, sit: 1, skin: 1, sky: 1, sleep: 1, smear: 1, smell: 1, smooth: 1, so: 1, soar: 1, some: 1,
  sordid: 1, spray: 1, spring: 1, still: 1, stop: 1, storm: 1, suit: 1, summer: 1, sun: 1, sweat: 1,
  sweet: 1, swim: 1, symphony: 1, the: 5, their: 1, there: 1, these: 1, they: 1, those: 1, though: 1,
  thousand: 1, through: 1, time: 1, tiny: 1, to: 3, together: 1, tongue: 1, trudge: 1, tv: 1, ugly: 1,
  up: 1, urge: 1, us: 1, use: 1, want: 2, was: 1, watch: 1, water: 1, wax: 1, we: 2, were: 1, what: 1,
  when: 1, whisper: 1, who: 1, why: 1, will: 1, wind: 1, with: 2, woman: 1, worship: 1, y: 4, yet: 1,
  you: 4,
}

// The small words that hold a poem together (articles, pronouns, connectors, the suffix tiles).
// A day's pull always has a share of these so it's writable.
export const GLUE_WORDS = new Set([
  '&', 'a', 'about', 'above', 'after', 'all', 'am', 'an', 'and', 'are', 'as', 'at', 'away', 'be', 'but',
  'by', 'can', 'could', 'd', 'did', 'do', 'ed', 'er', 'es', 'est', 'for', 'from', 'has', 'have', 'he',
  'her', 'here', 'him', 'his', 'how', 'i', 'if', 'in', 'ing', 'is', 'it', 'less', 'let', 'like', 'ly',
  'me', 'must', 'my', 'need', 'never', 'no', 'not', 'of', 'on', 'one', 'or', 'our', 'over', 'r', 's',
  'she', 'so', 'some', 'the', 'their', 'there', 'these', 'they', 'those', 'though', 'through', 'to',
  'together', 'up', 'us', 'was', 'we', 'were', 'what', 'when', 'who', 'why', 'will', 'with', 'y', 'yet',
  'you',
])

// The most useful small words. The first few are in every day's pull; the rest are picked from
// most days, so a poem always has something to hold it together.
export const ALWAYS_WORDS = ['the', 'a', 'and', 'i', 'you']
export const CORE_WORDS = ['my', 'is', 'of', 'to', 'in', 'it', 'me', 'we', 'not', 'like', 's', 'ing', 'ly', 'ed', 'at']
