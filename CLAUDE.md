# svsd · fridge magnet poetry

A designathon project (theme: storytelling). Each day you get a word bank of ~30 magnets
and arrange up to 20 of them on your fridge to make a poem about your day.
The deliverable is a **screen-recorded demo video**, so polish what shows on camera
(motion, details) over completeness behind the scenes.

## Stack

- React 19 + TypeScript + Vite, plain CSS (no Tailwind)
- `motion` (Framer Motion) for drag and spring animation
- Fonts via `@fontsource`: **Benne** (magnets), **DM Sans** (UI), **Inter** (body), **Patrick Hand** (calendar numbers, handwritten labels)
- Built at phone size (402×874). On a laptop the app sits in a phone frame for recording.

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
| Splash, Connect | 9:1075, 46:889 |

When building a screen, pull it with the Figma MCP (`get_design_context` on its node) and match it.
Reuse the tokens in `src/index.css` instead of hardcoding new colors.

## Design tokens (from Figma)

surface-1 #FFFFFF · surface-2 #F5F7F8 · fill-1 #F4F4F5 · fill-2 #E1E1E2 · fill-3 #D0D0D4 ·
fill-4 #A1A1AA · black-3 #1B1B1B · black-4 #2F2F2F

Magnet: white, 1px #D0D0D4 border, 1px radius, Benne lowercase #2F2F2F,
shadow `1px 2px 4.8px rgba(0,0,0,.25), 1px 1px 0 rgba(47,47,47,.6)`.

## Code map

- `src/App.tsx` the screen flow and routes: splash → connect → sign in → today's fridge, plus favourites,
  edit favourites, view poem, customize, share, calendar (+ pick mode), day, settings (stack-style slide transitions)
- `src/screens/SplashScreen.tsx`, `ConnectScreen.tsx`, `SignInScreen.tsx` onboarding. Connecting an app is
  **simulated** (no real sign-in), connected apps are remembered in localStorage
- `src/screens/PoemScreen.tsx` today's fridge: placing, dragging, removing magnets
- `src/components/Icon.tsx` + `src/assets/icons/` the hand-drawn icons, exported from Figma as SVG
  (they draw in `currentColor`)
- `src/components/MagnetDrawer.tsx` the "Add Magnets" bottom sheet (collapsed / half / full)
- `src/components/SideMenu.tsx` the pull-out home tab on the right edge (Figma component "menu",
  75:5317). Star → favourites, calendar → calendar, settings → settings, share → share. On those screens
  their own button turns into a fridge icon that goes back to today's poem
- `src/screens/FavouritesScreen.tsx`, `EditFavouritesScreen.tsx`, `ViewPoemScreen.tsx`, `CustomizeScreen.tsx`
  the favourites fridge flow. Edits are a draft until Save; the + opens the calendar in pick mode
- `src/screens/CalendarScreen.tsx`, `DayScreen.tsx` month list of day tiles, and one day's poem with a tile strip
- `src/screens/ShareScreen.tsx` story card + templates + targets. Sending is **simulated** (toasts)
- `src/screens/SettingsScreen.tsx` not in Figma; built from the onboarding pieces. Reminders are **simulated**
- `src/components/Fridge.tsx` the fridge drawing (steel / graphite / butter) and the 6 favourite `SLOTS`
- `src/components/PoemCanvas.tsx` draws a saved poem at its page coordinates; `FitPoem` shrinks one into a box
- `src/components/CalendarTile.tsx`, `SteelBackdrop.tsx`, `Toast.tsx` small shared pieces
- `src/state/appState.tsx` favourites, fridge style, settings (localStorage) and `poemFor(date)`
- `src/data/poems.ts` seeded past poems so the calendar and favourites look lived-in
- `src/components/FridgeMagnet.tsx` one draggable magnet on the fridge (fly-in + settle wobble)
- `src/components/Magnet.tsx` the magnet tile visual, shared everywhere
- `src/state/useFridge.ts` the day's poem, autosaved to localStorage per date
- `src/data/wordBank.ts` sample word bank (personal words are **simulated** for now)
- `src/lib/custom-effect-runtime/` + `src/lib/custom-effects/` Figma's shader runtime and the
  "Fridge enamel texture" and brushed steel shaders, copied verbatim from Figma (params in `src/lib/shaders.ts`). Don't edit these. The texture needs
  WebGPU + HTML-in-Canvas; browsers without it fall back to the flat #F5F7F8 surface.

## Product decisions so far

- One fridge per day, autosaves, no save button. Max 20 words on the fridge.
- Tap a word in the bank to add it; drag magnets to rearrange; drag one onto the drawer to remove it.
- Where personal words come from is **undecided**. Reading messaging apps isn't possible
  (iMessage/Instagram/etc. don't allow it), so don't build integrations; keep sample words.
- Favorites fridge has 6 slots. Favourites show only a poem's words (photo days show their photo).

## Team workflow

- One branch per feature (`feature/favorites`, `feature/calendar`, `feature/share`), PR into `main`.
- Pull `main` before starting work. Keep PRs small. Check it runs before opening a PR.

## TODO

- Stickers and Images tabs (currently "coming soon").
- Real image export for Download on the share screen.
