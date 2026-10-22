import { motion } from 'motion/react'

import { STYLE_NAMES } from '../components/Fridge'
import { Icon } from '../components/Icon'
import { PrivacyOptions } from '../components/PrivacyOptions'
import { SideMenu, type MenuId } from '../components/SideMenu'
import { Toggle } from '../components/Toggle'
import { useToast } from '../components/Toast'
import { useApp } from '../state/appState'
import { useScreenSize } from '../state/useScreenSize'

type Props = {
  onMenu: (id: MenuId) => void
  onCustomize: () => void
  onClearToday: () => void
  onReplayOnboarding: () => void
}

const TIMES = ['08:00', '12:00', '18:00', '21:00', '23:00']
const timeLabel = (t: string) => {
  const [h, m] = t.split(':').map(Number)
  return `${((h! + 11) % 12) + 1}:${String(m).padStart(2, '0')} ${h! < 12 ? 'am' : 'pm'}`
}

// Not in the Figma file: built from the design system (text styles, colour styles,
// 4px spacing, white cards with the fill-2 border, hand-drawn icons).
// The whole page scrolls, header included; the side menu stays put.
export function SettingsScreen({
  onMenu,
  onCustomize,
  onClearToday,
  onReplayOnboarding,
}: Props) {
  const { settings, updateSettings, fridgeStyle, resetDemo } = useApp()
  const [ref, size] = useScreenSize()
  const toast = useToast()

  return (
    <div className="screen settings" ref={ref}>
      <SideMenu screenWidth={size.width} current="settings" onSelect={onMenu} />

      <div className="settings__scroll">
        <header className="settings__header">
          <h1 className="title">settings</h1>
          <p className="settings__subtitle">make the fridge yours</p>
        </header>

        <motion.div
          className="settings__body"
          initial="hidden"
          animate="show"
          variants={{ show: { transition: { staggerChildren: 0.05 } } }}
        >
          <Section label="you">
            <label className="row">
              <span className="row__label">your name</span>
              <input
                className="row__input"
                value={settings.name}
                maxLength={16}
                placeholder="name"
                onChange={(e) => updateSettings({ name: e.target.value.toLowerCase() })}
              />
            </label>
            <p className="row__hint">shows on your share cards as “{settings.name.trim() || 'my'}'s fridge”</p>
          </Section>

          <Section label="fridge">
            <button className="row" onClick={onCustomize}>
              <span className="row__label">fridge style</span>
              <span className="row__value">{STYLE_NAMES[fridgeStyle]}</span>
              <Icon name="arrowRight" size={20} />
            </button>
          </Section>

          <Section label="privacy">
            <PrivacyOptions />
          </Section>

          <Section label="reminders">
            <div className="row">
              <span className="row__label">daily poem reminder</span>
              <Toggle on={settings.reminder} onChange={(reminder) => updateSettings({ reminder })} />
            </div>
            {settings.reminder && (
              <div className="row row--chips">
                {TIMES.map((t) => (
                  <button
                    key={t}
                    className={`chip ${settings.reminderTime === t ? 'is-on' : ''}`}
                    onClick={() => updateSettings({ reminderTime: t })}
                  >
                    {timeLabel(t)}
                  </button>
                ))}
              </div>
            )}
            <div className="row">
              <span className="row__label">haptics</span>
              <Toggle
                on={settings.haptics}
                onChange={(haptics) => {
                  updateSettings({ haptics })
                  if (haptics) navigator.vibrate?.(10)
                }}
              />
            </div>
          </Section>

          <Section label="start over">
            <button
              className="row"
              onClick={() => {
                onClearToday()
                toast.show("Today's fridge is empty again")
              }}
            >
              <span className="row__label">clear today's fridge</span>
            </button>
            <button className="row" onClick={onReplayOnboarding}>
              <span className="row__label">replay onboarding</span>
            </button>
            <button
              className="row row--danger"
              onClick={() => {
                resetDemo()
                toast.show('Demo data reset')
              }}
            >
              <span className="row__label">reset demo data</span>
            </button>
          </Section>

          <p className="settings__note">ref. never stores your information</p>
        </motion.div>
      </div>
      {toast.node}
    </div>
  )
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <motion.section
      className="settings__section"
      variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }}
    >
      <h2 className="settings__label">{label}</h2>
      <div className="card">{children}</div>
    </motion.section>
  )
}
