# ref. · fridge magnet poetry (repo: svsd)

A designathon project (theme: storytelling). Each day you get a word bank of ~30 magnets
and arrange up to 20 of them on your fridge to make a poem about your day.
The deliverable is a **screen-recorded demo video**, so polish what shows on camera
(motion, details) over completeness behind the scenes.

## Stack

- React 19 + TypeScript + Vite, plain CSS (no Tailwind)
- `motion` (Framer Motion) for drag and spring animation
- Fonts via `@fontsource`: **Benne** (magnets), **DM Sans** (UI), **Inter** (body), **Patrick Hand** (calendar numbers, handwritten labels)
- Built at phone size (402×874, an iPhone 16 / 17 Pro). On a laptop the app sits in an iPhone frame for recording, always
  402×874 inside; a short window scales the whole phone down (`src/state/deviceScale.ts`). Motion drags are corrected with
  `transformPagePoint` in App; anything mixing pointer positions with `getBoundingClientRect` must divide by `deviceScale()`

## Commands

- `npm run dev` start the dev server
- `npm run build` typecheck + production build (run before every commit)
- `npx vite build -c vite.artifact.config.ts` builds everything into one HTML file in `dist-single/`
  (used to share the prototype as a single page)

## Figma

File: https://www.figma.com/design/jgt5aNrWoSwsAAbqUTbUAR/SVSD---Fridge-App (file key `jgt5aNrWoSwsAAbqUTbUAR`)
Hi-fis are in the section **"hello fi"** (node `20:1330`). Key frames:

| Screen | Node |
| --- | --- |
| Poem - Start (empty fridge, collapsed drawer) | 35:387 |
| Poem - Add Words Half | 35:447 |
| Poem - Add Words Full | 51:1180 |
| Poem - Add Stickers Half / Full | 46:1683 / 51:1221 |
| Fridge - Main (favorites fridge) | 38:1711 |
| Fridge - Edit Favourites | 43:370 |
| Fridge - View Favourite | 43:584 |
| Fridge - Customize fridge | 43:489 |
| Share Screen | 43:630 |
| Calendar (month / day) | 46:593 / 54:3592 |
| Splash | 9:1075 |
| Splash animation, on hold (lofi page, Frame A / middle / Frame B) | 401:2572 |

When building a screen, pull it with the Figma MCP (`get_design_context` on its node) and match it.
Reuse the tokens in `src/index.css` instead of hardcoding new colors.

## Design tokens (from Figma)

surface-1 #FFFFFF · surface-2 #F5F7F8 · fill-1 #F4F4F5 · fill-2 #E1E1E2 · fill-3 #D0D0D4 ·
fill-4 #A1A1AA · black-3 #1B1B1B · black-4 #2F2F2F

Text styles: title Benne 32 · subtitle Benne 24 (calendar month names) · magnet text Benne 24 · body DM Sans 16 ·
secondary DM Sans 13 · button DM Sans Medium 16 · minitext Patrick Hand 18 · handwritten Patrick Hand 24

Side margin: one shared `--margin` (24px) on every screen (icons, drawer, grids, share targets, settings). Use it for
anything that lines up with the screen's edges.

Magnet: white, 1px #D0D0D4 border, 1px radius, Benne lowercase #2F2F2F,
shadow `1px 2px 4.8px rgba(0,0,0,.25), 1px 1px 0 rgba(47,47,47,.6)`.

## Code map

- `src/App.tsx` the screen flow and routes: splash → privacy → today's fridge, plus favourites,
  edit favourites, view poem, customize, share, calendar, day, settings (stack-style slide transitions)
- `src/screens/SplashScreen.tsx`, `PrivacyScreen.tsx` onboarding. The door-opening animation (lofi "ANIMATION" section,
  401:2572) is on hold: the splash is the still fridge icon and "ref." for now. The privacy screen (not in Figma) replaced the
  old "connect app" + sign-in screens: it asks what the fridge may use (photos / location / music apps), the same
  `PrivacyOptions` as Settings
- `src/screens/PoemScreen.tsx` today's fridge: placing, dragging, removing magnets
- `src/components/Icon.tsx` + `src/assets/icons/` the hand-drawn icons, exported from Figma as SVG
  (they draw in `currentColor`)
- `src/components/MagnetDrawer.tsx` the "Add Magnets" bottom sheet (collapsed / half / full)
- `src/components/SideMenu.tsx` the pull-out tab on the right edge (Figma component set "Menu",
  88:5593). The tab shows the screen you're on (poem, fridge, calendar, settings); the panel holds the
  other three. Share isn't in the menu; it's reached from the favourites fridge
- `src/screens/FavouritesScreen.tsx`, `EditFavouritesScreen.tsx`, `ViewPoemScreen.tsx`, `CustomizeScreen.tsx`
  the favourites fridge flow. Edits are a draft until Save; the + (top, or in an empty spot) opens
  `src/components/AddFavouritePanel.tsx` (Figma "Fridge - Add to Favourites" 52:3086): search poems by words or date
- `src/screens/CalendarScreen.tsx`, `DayScreen.tsx` month list of day tiles, and one day's poem with a tile strip
- `src/screens/ShareScreen.tsx` the post (Figma "Share - Entire Fridge" 52:1358: whole fridge / surface close-up / angled
  fridge, all in the chosen fridge style, the close-up on `FridgeBackground`), the "post options" pickers (52:1828, drawn live)
  and the 7 targets (52:4460). A single day's poem only gets the close-up: its poem page shrunk to the card (background
  drawn at page size and scaled, so the enamel detail matches the poem page). Download saves a real 1080px PNG
  (`src/lib/exportImage.ts`, no libraries: a hidden copy of the post is drawn, its WebGPU shader canvases captured right after
  they render, then cloned with inline styles + embedded fonts/images into an SVG foreignObject). On a phone it opens the
  share sheet. The other targets are **simulated** (toasts)
- `src/screens/SettingsScreen.tsx` not in Figma; built on the design system (text + colour styles, 4px spacing). Whole page scrolls. Reminders are **simulated**
- `src/components/PrivacyOptions.tsx` the privacy choices (photos / location / music apps), shared by Settings and
  onboarding. Options from the Figma note 75:5378. Saved in `appState` as `privacy`; **simulated**, nothing is read
- `src/components/Fridge.tsx` the favourites fridge in the chosen style, and the 6 favourite spots per style (`slotsFor`)
- `src/components/FridgeArt.tsx` the five Figma "Fridges" (38:1598): white, yellow, blue, pink mini fridge, steel. Converted
  from Figma's design-to-code output (pieces in `src/assets/fridges/`) with the enamel / brushed steel shaders
- `src/components/FridgeBackground.tsx` today's poem surface in the chosen style, from the Figma "backgrounds" frames (133:3948)
- `src/components/PoemCanvas.tsx` draws a saved poem at its page coordinates; `FitPoem` shrinks one into a box
- `src/components/CalendarTile.tsx`, `Toast.tsx` small shared pieces
- `src/state/appState.tsx` favourites, fridge style, settings (localStorage) and `poemFor(date)`
- `src/data/poems.ts` seeded past poems so the calendar and favourites look lived-in
- `src/components/FridgeMagnet.tsx` one draggable magnet on the fridge (fly-in + settle wobble)
- `src/components/MagnetPile.tsx` the pile of collected words and stickers; tap it to release them
- `src/data/stickers.ts` + `src/assets/stickers/` the 7 sticker magnets from Figma (51:1512 and on). Star and cloud have
  texture fills, so they're SVGs with a small copy of the texture embedded (Figma's PNG exports bake in a dark background).
  Stickers you make (the "+" tile: take or pick a photo) are saved in localStorage (`svsd:stickers`) and come first after the +;
  their "−" badge deletes one from the drawer (it stays saved, hidden, so magnets already placed keep their picture)
- `src/lib/cutout.ts` turns a photo into a die-cut sticker with a canvas, no libraries: the background is removed by colour
  from the photo's edges (best for an object on a plain surface), busy photos become a round sticker; white border, 256px PNG
- `src/data/photos.ts` + `src/assets/photos/` the Images tab's camera roll: 24 **placeholder** photos (simulated, nothing
  is read from the real library). Photo magnets are 80 × 113 like the Figma grid cells
- `src/components/Magnet.tsx` the magnet tile visual, shared everywhere
- `src/state/useFridge.ts` the day's poem and pile, autosaved to localStorage per date, plus undo history (in memory)
- `src/data/wordList.ts` the words from `Word List.pdf` (Magnetic Poetry Original Kit): 241 words, with each one's
  number of copies in the kit (329 magnets)
- `src/data/wordBank.ts` each day's 25 words, the same all day: 20 from the kit (always the / a / and / i / you, 5 more
  core small words, 2 other small words, 8 others; weighted by copies squared) + 5 custom words (**simulated**, a
  rotating pick from a stand-in pool)
- `src/lib/custom-effect-runtime/` + `src/lib/custom-effects/` Figma's shader runtime and the
  "Fridge enamel texture" and brushed steel shaders, copied verbatim from Figma (params in `src/lib/shaders.ts`). Don't edit these.
- `src/lib/enamelLayer.ts` the enamel texture as a fill layer drawn on top of a gradient (like the brushed steel), so it needs
  only WebGPU, not the experimental HTML-in-Canvas the original effect needs. Same noise and lighting as Figma's shader.
  The fridges and backgrounds use this; without WebGPU they fall back to the plain gradients.

## Product decisions so far

- One fridge per day, autosaves, no save button. No word limit, and words can be reused as often as you like.
- Tap to collect (Figma section "Tap to Collect Interaction", 158:4883): tapping a word in the bank drops a copy
  into a pile at the bottom of the screen (the bank word shows a count badge); tap the pile to scatter them all (in reading order: left to right, then down, in the order collected)
  onto the fridge. Stickers work the same way (Stickers tab). Photos (Images tab) skip the pile: tap one to put it
  straight on the fridge, or hold and drag it. Photos always sit under the other magnets and are left out of the
  no-overlap rule (they don't move aside, and words / stickers may land on them). With photos off in privacy settings the tab says so instead. Or hold a word (350ms, so swipes still scroll) and drag it straight onto the fridge. Drag magnets to rearrange; drag one onto the drawer to remove it. Undo steps back through all of it.
- Delete Mode (Figma 88:5505): long press a magnet; everything but the magnets dims and they wiggle. Tap a magnet to
  delete it, "Clear" (top right) removes them all (the pile stays), tap the dim layer to finish. Undo brings them back.
- Where personal words come from is **undecided**. Reading messaging apps isn't possible
  (iMessage/Instagram/etc. don't allow it), so don't build integrations; keep sample words.
- Favorites fridge has 6 slots. Each favourite shows the whole poem: words, stickers and photos. A spread-out poem that would
  come out tiny gets tighter spacing instead (then smaller photos / stickers), so its magnets stay readable (`SLOT_MIN_SCALE`).
- Star a poem (today's, under undo; or any day in the calendar) to pin it. If all 6 slots are taken, Edit Favourites opens in
  swap mode: tap a poem's badge to swap it for the starred one, then Save (or Cancel) goes back where you were.

## Team workflow

- One branch per feature (`feature/favorites`, `feature/calendar`, `feature/share`), PR into `main`.
- Pull `main` before starting work. Keep PRs small. Check it runs before opening a PR.

## TODO

- Real photos for the Images tab (placeholders now).
