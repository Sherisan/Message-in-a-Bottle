import { useEffect } from 'react'
import { scene } from '../art'
import { sound } from '../game/sound'
import { store, type GameState } from '../game/store'

const CRAB_CROSSING_MS = 7_200

/** Interactive crab rendered above the decorative scene so it always receives clicks. */
export function Crab({ s }: { s: GameState }) {
  useEffect(() => {
    if (s.crabStatus !== 'active') return
    const timers: number[] = []
    const schedule = (delay: number, callback: () => void) => {
      timers.push(window.setTimeout(callback, delay))
    }

    for (let offset = 0; offset < CRAB_CROSSING_MS; offset += 900) {
      schedule(offset, () => sound.play('crab'))
    }
    schedule(CRAB_CROSSING_MS, () => store.endCrabPass())

    return () => timers.forEach((timer) => window.clearTimeout(timer))
  }, [s.crabStatus])

  return (
    <button
      className={`crab ${s.crabStatus}`}
      onClick={() => void store.catchCrab()}
      aria-disabled={s.crabStatus !== 'active' || s.crabBusy}
      aria-label="Catch Mr Crab for a possible bottle bonus"
    >
      <img className="flap-a" src={scene.crab1} alt="" />
      <img className="flap-b" src={scene.crab2} alt="" />
      {(s.crabStatus === 'caged' || s.crabStatus === 'caught') && (
        <span className="cage-visual" aria-hidden="true">
          <img className="cage-art" src={scene.crabCage} alt="" />
        </span>
      )}
      <span className={`crab-caption ${s.crabStatus}`}>
        {s.crabStatus === 'active' && 'Catch Mr Crab!'}
        {s.crabStatus === 'caged' && (s.crabMessage ?? 'Mr Crab is caged!')}
        {s.crabStatus === 'caught' && (s.crabMessage ?? 'Mr Crab is caged!')}
        {s.crabStatus === 'escaped' && 'Oh no! Mr Crab escaped!'}
      </span>
    </button>
  )
}
