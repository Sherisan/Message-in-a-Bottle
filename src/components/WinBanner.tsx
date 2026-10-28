import type { CSSProperties } from 'react'
import { banners, fx } from '../art'
import { currencySymbol, money, times } from '../game/format'
import { store, type GameState } from '../game/store'

const TITLES = { big: 'BIG WIN', mega: 'MEGA WIN', treasure: 'TREASURE!' }
const COINS = { big: 14, mega: 22, treasure: 32 }

/** Celebration for 25× and up. Tap anywhere to close. */
export function WinBanner({ s }: { s: GameState }) {
  const { banner } = s
  if (!banner) return null
  const symbol = currencySymbol(s.info?.currency)

  return (
    <div className={`win-banner tier-${banner.tier}`} onClick={store.dismissBanner} role="dialog" aria-label={TITLES[banner.tier]}>
      <img className="rays" src={fx.lightRays} alt="" />
      <div className="coins" aria-hidden>
        {Array.from({ length: COINS[banner.tier] }, (_, i) => (
          <img
            key={i}
            src={i % 3 ? fx.coin : fx.coinEdge}
            alt=""
            style={{ '--x': `${(i * 37) % 100}%`, '--d': `${(i * 0.13) % 1.4}s`, '--t': `${1.6 + ((i * 7) % 10) / 10}s` } as CSSProperties}
          />
        ))}
      </div>
      <div className="banner-plate">
        <img src={banners[banner.tier]} alt="" />
        <span className="banner-title">{TITLES[banner.tier]}</span>
      </div>
      <div className="banner-amount">{money(banner.win, symbol)}</div>
      <div className="banner-mult">{times(banner.multiple)}</div>
    </div>
  )
}
