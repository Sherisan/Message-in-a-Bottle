import { extras, fx, lossArt, prizeArt as PRIZE_ART } from '../art'
import { currencySymbol, money, times } from '../game/format'
import { lossItem, prizeArt } from '../game/rules'
import type { GameState } from '../game/store'

const LOSS_LINES = {
  crab: 'Just a cheeky crab!',
  seaweed: 'Only seaweed this time',
  sand: 'Nothing but sand',
}

/** What came out of the picked bottle — an unrolled scroll, a treasure map, or something harmless. */
export function Reveal({ s }: { s: GameState }) {
  const { result, picked, phase } = s
  if (!result || picked == null || !['opening', 'others', 'complete'].includes(phase)) return null

  const prize = result.card.prize
  const art = prizeArt(prize)
  const symbol = currencySymbol(s.info?.currency)

  if (art === 'loss') {
    const item = lossItem(result.roundId, picked)
    return (
      <div className="reveal loss" aria-live="polite">
        <img className="reveal-art" src={lossArt[item]} alt="" />
        <div className="reveal-caption">{LOSS_LINES[item]}</div>
      </div>
    )
  }

  return (
    <div className={`reveal ${art}`} aria-live="polite">
      {art === 'chest' && <img className="reveal-chest" src={extras.treasureChest} alt="" />}
      <div className="reveal-card">
        <img className="reveal-art" src={PRIZE_ART[art]} alt="" />
        <div className="reveal-text">
          <span className="reveal-mult">{times(prize)}</span>
          <span className="reveal-amount">{money(result.win, symbol)}</span>
        </div>
      </div>
      {art !== 'plain' &&
        [0, 1, 2, 3, 4, 5].map((i) => <img key={i} className={`sparkle sparkle-${i}`} src={fx.sparkle} alt="" />)}
    </div>
  )
}
