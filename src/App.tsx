import { useEffect } from 'react'
import { store, useGame, BOTTLES } from './game/store'
import { Scene } from './components/Scene'
import { Header } from './components/Header'
import { Bottles } from './components/Bottles'
import { Reveal } from './components/Reveal'
import { Controls } from './components/Controls'
import { WinBanner } from './components/WinBanner'
import { HelpModal, HistoryModal, MessageToast } from './components/Modals'

let started = false

export function App() {
  const s = useGame()

  useEffect(() => {
    // StrictMode mounts effects twice in development — only load once.
    if (started) return
    started = true
    void store.init()
  }, [])

  // Keyboard: 1–5 picks a bottle, Space / Enter sends the tide.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLButtonElement) return
      const n = Number(e.key)
      if (n >= 1 && n <= BOTTLES) store.pick(n - 1)
      else if ((e.key === ' ' || e.key === 'Enter') && store.canSend()) {
        e.preventDefault()
        void store.send()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  if (s.phase === 'fatal') {
    return (
      <div className="app">
        <Scene />
        <div className="fatal" role="alert">
          <h1>Message in a Bottle</h1>
          <p>{s.fatal}</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`app phase-${s.phase}`}>
      <Scene />
      <Header s={s} />
      <main className="stage">
        {s.phase === 'loading' && <div className="loading">Loading…</div>}
        {s.phase === 'ready' && !s.result && <div className="prompt">Send the tide to wash five bottles ashore</div>}
        <Reveal s={s} />
        <Bottles s={s} />
      </main>
      <Controls s={s} />
      <WinBanner s={s} />
      <HelpModal s={s} />
      <HistoryModal s={s} />
      <MessageToast s={s} />
    </div>
  )
}
