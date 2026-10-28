import type { CSSProperties } from 'react'
import { bottles, extras, fx, lossArt } from '../art'
import { times } from '../game/format'
import { lossItem } from '../game/rules'
import { BOTTLES, store, type GameState } from '../game/store'

const OPEN_PHASES = ['opening', 'others', 'complete']

/** The five bottles on the sand. Pickable while the phase is "picking". */
export function Bottles({ s }: { s: GameState }) {
  const { phase, result, picked, othersShown } = s
  if (!result || !['landing', 'picking', 'opening', 'others', 'complete'].includes(phase)) return null

  const values = store.values
  // The four unpicked bottles open left to right after the picked one.
  const otherRank = (i: number) => (picked == null ? -1 : i < picked ? i : i - 1)

  return (
    <div className={`bottles phase-${phase}`} role="group" aria-label="Bottles">
      {bottles.map((b, i) => {
        const isPicked = picked === i
        const isOpen = isPicked ? OPEN_PHASES.includes(phase) : picked != null && othersShown > otherRank(i)
        const value = values?.[i]
        const classes = [
          'bottle',
          phase === 'landing' && 'landing',
          phase === 'picking' && 'pickable',
          isPicked && 'picked',
          picked != null && !isPicked && 'other',
          isOpen && 'open',
        ].filter(Boolean).join(' ')

        return (
          <button
            key={b.color}
            className={classes}
            style={{ '--i': i } as CSSProperties}
            disabled={phase !== 'picking'}
            onClick={() => store.pick(i)}
            aria-label={`Bottle ${i + 1}${isOpen && value != null ? `: ${value > 0 ? times(value) : 'empty'}` : ''}`}
          >
            {phase === 'landing' && <img className="splash" src={i % 2 ? fx.splashMd : fx.splashSm} alt="" />}
            <img className="glass" src={isOpen ? b.open : b.closed} alt="" draggable={false} />

            {isPicked && phase === 'opening' && (
              <>
                <img className="cork-pop" src={fx.corkPop} alt="" />
                <img className="scroll-out" src={extras.scrollRolled} alt="" />
              </>
            )}

            {!isPicked && isOpen && value != null && (
              <span className={`tag ${value > 0 ? 'win' : 'empty'}`}>
                {value > 0 ? times(value) : <img src={lossArt[lossItem(result.roundId, i)]} alt="" />}
              </span>
            )}
            <span className="key-hint" aria-hidden>{i + 1}</span>
          </button>
        )
      })}
      <span className="sr-only" aria-live="polite">{phase === 'picking' ? `Pick a bottle, 1 to ${BOTTLES}` : ''}</span>
    </div>
  )
}
