import { useCallback, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'

import { SplashScreen } from './screens/SplashScreen'
import { ConnectScreen } from './screens/ConnectScreen'
import { SignInScreen } from './screens/SignInScreen'
import { PoemScreen } from './screens/PoemScreen'
import type { Source } from './data/sources'

type Route =
  | { name: 'splash' }
  | { name: 'connect' }
  | { name: 'signin'; source: Source }
  | { name: 'poem' }

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

// On a phone the app fills the screen; on a laptop it sits in a phone-sized frame,
// which is also how it should be screen-recorded for the demo video.
export default function App() {
  const [route, setRoute] = useState<Route>({ name: 'splash' })
  const [dir, setDir] = useState(1)
  const [connected, setConnected] = useState(loadConnected)

  const go = useCallback((next: Route, direction = 1) => {
    setDir(direction)
    setRoute(next)
  }, [])

  const finishSplash = useCallback(() => go({ name: 'connect' }), [go])

  function markConnected(source: Source) {
    setConnected((prev) => {
      const next = new Set(prev).add(source.id)
      try {
        localStorage.setItem(CONNECTED_KEY, JSON.stringify([...next]))
      } catch {
        // ignore
      }
      return next
    })
    go({ name: 'connect' }, -1)
  }

  const key = route.name === 'signin' ? `signin-${route.source.id}` : route.name

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
                onPick={(source) => go({ name: 'signin', source })}
                onDone={() => go({ name: 'poem' })}
              />
            )}
            {route.name === 'signin' && (
              <SignInScreen
                source={route.source}
                onBack={() => go({ name: 'connect' }, -1)}
                onConnected={markConnected}
              />
            )}
            {route.name === 'poem' && <PoemScreen onBack={() => go({ name: 'connect' }, -1)} />}
          </motion.div>
        </AnimatePresence>
      </div>
    </main>
  )
}
