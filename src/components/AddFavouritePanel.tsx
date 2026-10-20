import { useMemo, useState } from 'react'
import { motion } from 'motion/react'

import { Icon } from './Icon'
import type { Poem } from '../data/poems'

type Props = {
  poems: Poem[]
  /** poems already on the fridge (or the draft), left out of the list */
  exclude: (string | null)[]
  onPick: (date: string) => void
  onClose: () => void
}

// Figma "Fridge - Add to Favourites" (52:3086): a panel over Edit Favourites to find a poem by its date or its words.
export function AddFavouritePanel({ poems, exclude, onPick, onClose }: Props) {
  const [query, setQuery] = useState('')
  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    return poems
      .filter((p) => !exclude.includes(p.date))
      .filter((p) => !q || searchText(p).includes(q))
      .sort((a, b) => b.date.localeCompare(a.date)) // newest first
  }, [poems, exclude, query])

  return (
    <motion.div
      className="add-fav"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
    >
      <button className="add-fav__scrim" aria-label="Close" onClick={onClose} />
      <motion.div
        className="add-fav__panel"
        role="dialog"
        aria-label="Add to favourites"
        initial={{ scale: 0.94, y: 12 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.96, y: 8 }}
        transition={{ type: 'spring', stiffness: 420, damping: 32 }}
      >
        <button className="add-fav__close" aria-label="Close" onClick={onClose}>
          <Icon name="close" size={24} />
        </button>
        <label className="add-fav__search">
          <input
            type="search"
            placeholder="Search by date or words"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoComplete="off"
            enterKeyHint="search"
          />
          {/* Figma "Vector 286": a hand-drawn underline */}
          <svg viewBox="0 0 250.905 4.2495" preserveAspectRatio="none" aria-hidden>
            <path
              d="M1 3.24949C101.902 0.570549 145.358 0.83081 154.473 1.29588C183.4 2.03995 242.985 3.08166 249.905 1.29588"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
            />
          </svg>
        </label>
        <ul className="add-fav__list">
          {results.map((p) => (
            <li key={p.date}>
              <button className="add-fav__item" onClick={() => onPick(p.date)}>
                <span className="add-fav__title">{titleOf(p)}</span>
                <span className="add-fav__date">{numericDate(p.date)}</span>
              </button>
            </li>
          ))}
          {results.length === 0 && <li className="add-fav__empty">No poems match “{query.trim()}”</li>}
        </ul>
      </motion.div>
    </motion.div>
  )
}

// A poem's words in reading order (rows top to bottom, then left to right), all lowercase like the magnets
export function titleOf(poem: Poem) {
  const rowH = poem.fontSize * 1.2
  const words = [...poem.words]
    .sort((a, b) => (Math.abs(a.y - b.y) < rowH / 2 ? a.x - b.x : a.y - b.y))
    .map((w) => w.text)
    .join(' ')
  if (!words) return poem.photoMagnets?.length || poem.photo ? 'a photo' : 'stickers'
  return words.toLowerCase()
}

// Figma writes the date as 16/10/2026
function numericDate(date: string) {
  const [y, m, d] = date.split('-')
  return `${d}/${m}/${y}`
}

// What a search can match: the words, and the date written a few ways (16/10/2026, 16/10, 2026-10-16, october 16,
// oct 16, 16 october, friday)
function searchText(poem: Poem) {
  const [y, m, d] = poem.date.split('-').map(Number) as [number, number, number]
  const day = new Date(y, m - 1, d)
  const month = day.toLocaleDateString('en-US', { month: 'long' }).toLowerCase()
  const weekday = day.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase()
  const dd = String(d).padStart(2, '0')
  const mm = String(m).padStart(2, '0')
  return [
    titleOf(poem),
    `${dd}/${mm}/${y}`,
    `${d}/${m}/${y}`,
    poem.date,
    `${month} ${d}`,
    `${month.slice(0, 3)} ${d}`,
    `${d} ${month}`,
    weekday,
  ].join(' | ')
}
