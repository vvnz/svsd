import { useCallback, useState } from 'react'
import { AnimatePresence, MotionConfig, motion } from 'motion/react'

import { SplashScreen } from './screens/SplashScreen'
import { PrivacyScreen } from './screens/PrivacyScreen'
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
import { AppStateProvider, useApp } from './state/appState'
import { todayKey } from './state/useFridge'
import { DEVICE_H, DEVICE_W, useDeviceScale } from './state/deviceScale'

type Route =
  | { name: 'splash' }
  | { name: 'privacy' }
  | { name: 'poem' }
  | { name: 'favourites' }
  // swapIn: a starred poem waiting for a slot on a full fridge; back: where to return after Save / Cancel
  | { name: 'editFavourites'; draft: (string | null)[]; swapIn?: string; back?: Route }
  | { name: 'viewPoem'; date: string }
  | { name: 'customize'; from: 'favourites' | 'settings' }
  | { name: 'share'; subject: string; back?: Route }
  | { name: 'calendar' }
  | { name: 'day'; date: string }
  | { name: 'settings' }

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

// On a phone the app fills the screen; on a laptop it sits in an iPhone-sized frame (402 × 874), scaled down as a
// whole if the window is short, which is also how it should be screen-recorded for the demo video.
function Screens() {
  const scale = useDeviceScale()
  const [route, setRoute] = useState<Route>({ name: 'splash' })
  const [dir, setDir] = useState(1)
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

  // onboarding: splash, then the privacy choices, then today's fridge
  const finishSplash = useCallback(() => go({ name: 'privacy' }), [go])

  // the pull-out menu: favourites, calendar, settings, share, or back to today's fridge
  const menu = (id: MenuId) => {
    if (id === 'poem') go({ name: 'poem' }, -1)
    else if (id === 'favourite') go({ name: 'favourites' })
    else if (id === 'calendar') go({ name: 'calendar' })
    else go({ name: 'settings' })
  }

  const key =
    route.name === 'day'
      ? 'day' // the day view animates its own poem changes
      : route.name

  return (
    // drags are measured in screen pixels; the frame may be scaled, so motion converts them into the app's pixels
    <MotionConfig transformPagePoint={(p) => ({ x: p.x / scale, y: p.y / scale })}>
      <main className="stage">
        <div className="device-frame" style={{ width: DEVICE_W * scale, height: DEVICE_H * scale }}>
          <div className="device" style={{ transform: scale === 1 ? undefined : `scale(${scale})` }}>
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
                {route.name === 'privacy' && <PrivacyScreen onDone={() => go({ name: 'poem' })} />}
                {route.name === 'poem' && (
                  <PoemScreen
                    onMenu={menu}
                    onFavouritesFull={() =>
                      go({ name: 'editFavourites', draft: app.favourites, swapIn: todayKey(), back: { name: 'poem' } })
                    }
                    onShare={() => go({ name: 'share', subject: todayKey(), back: { name: 'poem' } })}
                  />
                )}

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
                    swapIn={route.swapIn}
                    onChange={(draft) => setRoute({ ...route, draft })}
                    // came from starring today's poem: go back there
                    onCancel={() => go(route.back ?? { name: 'favourites' }, -1)}
                    onSave={() => {
                      app.setFavourites(route.draft)
                      go(route.back ?? { name: 'favourites' }, -1)
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
                  <CalendarScreen onMenu={menu} onOpenDay={(date) => go({ name: 'day', date })} />
                )}
                {route.name === 'day' && (
                  <DayScreen
                    date={route.date}
                    onFavouritesFull={(date) =>
                      go({ name: 'editFavourites', draft: app.favourites, swapIn: date, back: { name: 'day', date } })
                    }
                    onDate={(date) => setRoute({ name: 'day', date })}
                    onBack={() => go({ name: 'calendar' }, -1)}
                    onShare={(date) => go({ name: 'share', subject: date, back: { name: 'day', date } })}
                  />
                )}
                {route.name === 'settings' && (
                  <SettingsScreen
                    onMenu={menu}
                    onCustomize={() => go({ name: 'customize', from: 'settings' })}
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
        </div>
      </main>
    </MotionConfig>
  )
}
