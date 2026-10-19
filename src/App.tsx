import { useCallback, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'

import { SplashScreen } from './screens/SplashScreen'
import { ConnectScreen } from './screens/ConnectScreen'
import { SignInScreen } from './screens/SignInScreen'
import { PoemScreen } from './screens/PoemScreen'
import { FavouritesScreen } from './screens/FavouritesScreen'
import { EditFavouritesScreen } from './screens/EditFavouritesScreen'
import { ViewPoemScreen } from './screens/ViewPoemScreen'
import { CustomizeScreen } from './screens/CustomizeScreen'
import { ShareScreen } from './screens/ShareScreen'
import { CalendarScreen } from './screens/CalendarScreen'
import { DayScreen } from './screens/DayScreen'
import { SettingsScreen } from './screens/SettingsScreen'
import type { MenuId } from './components/SideMenu'
import type { Source } from './data/sources'
import { AppStateProvider, useApp } from './state/appState'
import { todayKey } from './state/useFridge'

type Route =
  | { name: 'splash' }
  | { name: 'connect'; from?: 'settings' }
  | { name: 'signin'; source: Source; from?: 'settings' }
  | { name: 'poem' }
  | { name: 'favourites' }
  | { name: 'editFavourites'; draft: (string | null)[] }
  | { name: 'viewPoem'; date: string }
  | { name: 'customize'; from: 'favourites' | 'settings' }
  | { name: 'share'; subject: string; back?: Route }
  | { name: 'calendar'; pick?: (string | null)[] } // pick: choosing a poem for the edit draft
  | { name: 'day'; date: string }
  | { name: 'settings' }

const CONNECTED_KEY = 'svsd:connected'

function loadConnected(): Set<string> {
  try {
    return new Set(JSON.parse(localStorage.getItem(CONNECTED_KEY) ?? '[]') as string[])
  } catch {
    return new Set()
  }
}

// Screens slide like a stack: forward pushes in from the right, back slides out to the right.
const slide = {
  initial: (dir: number) => ({ x: dir > 0 ? '100%' : '-30%', opacity: dir > 0 ? 1 : 0.6 }),
  animate: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? '-30%' : '100%', opacity: dir > 0 ? 0.6 : 1 }),
}

export default function App() {
  return (
    <AppStateProvider>
      <Screens />
    </AppStateProvider>
  )
}

// On a phone the app fills the screen; on a laptop it sits in a phone-sized frame,
// which is also how it should be screen-recorded for the demo video.
function Screens() {
  const [route, setRoute] = useState<Route>({ name: 'splash' })
  const [dir, setDir] = useState(1)
  const [connected, setConnected] = useState(loadConnected)
  const app = useApp()

  const go = useCallback(
    (next: Route, direction = 1) => {
      setDir(direction)
      setRoute(next)
      app.refreshToday() // today's poem may have changed on the fridge screen
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [app.refreshToday],
  )

  const finishSplash = useCallback(() => go({ name: 'connect' }), [go])

  // the pull-out menu: favourites, calendar, settings, share, or back to today's fridge
  const menu = (id: MenuId) => {
    if (id === 'poem') go({ name: 'poem' }, -1)
    else if (id === 'favourite') go({ name: 'favourites' })
    else if (id === 'calendar') go({ name: 'calendar' })
    else go({ name: 'settings' })
  }

  function markConnected(source: Source, from?: 'settings') {
    setConnected((prev) => {
      const next = new Set(prev).add(source.id)
      try {
        localStorage.setItem(CONNECTED_KEY, JSON.stringify([...next]))
      } catch {
        // ignore
      }
      return next
    })
    go({ name: 'connect', from }, -1)
  }

  const key =
    route.name === 'signin'
      ? `signin-${route.source.id}`
      : route.name === 'day'
        ? 'day' // the day view animates its own poem changes
        : route.name === 'calendar'
          ? `calendar-${route.pick ? 'pick' : 'browse'}`
          : route.name

  return (
    <main className="stage">
      <div className="device">
        <AnimatePresence initial={false} custom={dir}>
          <motion.div
            key={key}
            className="route"
            custom={dir}
            variants={slide}
            initial={route.name === 'splash' ? false : 'initial'}
            animate="animate"
            exit={route.name === 'poem' && dir > 0 ? { opacity: 0 } : 'exit'}
            transition={{ type: 'spring', stiffness: 320, damping: 36 }}
          >
            {route.name === 'splash' && <SplashScreen onDone={finishSplash} />}
            {route.name === 'connect' && (
              <ConnectScreen
                connected={connected}
                onPick={(source) => go({ name: 'signin', source, from: route.from })}
                onDone={() => (route.from === 'settings' ? go({ name: 'settings' }, -1) : go({ name: 'poem' }))}
              />
            )}
            {route.name === 'signin' && (
              <SignInScreen
                source={route.source}
                onBack={() => go({ name: 'connect', from: route.from }, -1)}
                onConnected={(s) => markConnected(s, route.from)}
              />
            )}
            {route.name === 'poem' && <PoemScreen onMenu={menu} />}

            {route.name === 'favourites' && (
              <FavouritesScreen
                onMenu={menu}
                onShare={() => go({ name: 'share', subject: 'favourites', back: { name: 'favourites' } })}
                onEdit={() => go({ name: 'editFavourites', draft: app.favourites })}
                onCustomize={() => go({ name: 'customize', from: 'favourites' })}
                onOpen={(date) => go({ name: 'viewPoem', date })}
              />
            )}
            {route.name === 'editFavourites' && (
              <EditFavouritesScreen
                draft={route.draft}
                onChange={(draft) => setRoute({ name: 'editFavourites', draft })}
                onAdd={() => go({ name: 'calendar', pick: route.draft })}
                onCancel={() => go({ name: 'favourites' }, -1)}
                onSave={() => {
                  app.setFavourites(route.draft)
                  go({ name: 'favourites' }, -1)
                }}
              />
            )}
            {route.name === 'viewPoem' && (
              <ViewPoemScreen
                date={route.date}
                onShare={() => go({ name: 'share', subject: route.date, back: route })}
                onBack={() => go({ name: 'favourites' }, -1)}
              />
            )}
            {route.name === 'customize' && (
              <CustomizeScreen
                onBack={() => go({ name: route.from }, -1)}
                onSave={() => go({ name: route.from }, -1)}
              />
            )}
            {route.name === 'share' && (
              <ShareScreen
                subject={route.subject}
                onMenu={menu}
                onBack={route.back ? () => go(route.back!, -1) : undefined}
              />
            )}
            {route.name === 'calendar' && (
              <CalendarScreen
                mode={route.pick ? 'pick' : 'browse'}
                onMenu={menu}
                onOpenDay={(date) => go({ name: 'day', date })}
                onToday={() => go({ name: 'poem' }, -1)}
                onPick={(date) => {
                  const draft = [...(route.pick ?? [])]
                  const empty = draft.indexOf(null)
                  if (empty !== -1) draft[empty] = date
                  go({ name: 'editFavourites', draft }, -1)
                }}
                onCancelPick={() => go({ name: 'editFavourites', draft: route.pick ?? app.favourites }, -1)}
              />
            )}
            {route.name === 'day' && (
              <DayScreen
                date={route.date}
                onDate={(date) => setRoute({ name: 'day', date })}
                onBack={() => go({ name: 'calendar' }, -1)}
                onShare={(date) => go({ name: 'share', subject: date, back: { name: 'day', date } })}
              />
            )}
            {route.name === 'settings' && (
              <SettingsScreen
                connectedCount={connected.size}
                onMenu={menu}
                onCustomize={() => go({ name: 'customize', from: 'settings' })}
                onConnect={() => go({ name: 'connect', from: 'settings' })}
                onClearToday={() => {
                  try {
                    localStorage.removeItem(`svsd:fridge:${todayKey()}`)
                  } catch {
                    // ignore
                  }
                  app.refreshToday()
                }}
                onReplayOnboarding={() => go({ name: 'splash' }, -1)}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </main>
  )
}
