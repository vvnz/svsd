import { PoemScreen } from './screens/PoemScreen'

// On a phone the app fills the screen; on a laptop it sits in a phone-sized frame,
// which is also how it should be screen-recorded for the demo video.
export default function App() {
  return (
    <main className="stage">
      <div className="device">
        <PoemScreen />
      </div>
    </main>
  )
}
