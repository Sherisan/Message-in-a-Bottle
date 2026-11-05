import { ICONS, promos, usePromos } from './promoStore'
import type { PublicPromo } from './promoApi'
import './promo.css'

type Money = (n: number) => string

const SYMBOL_ICONS: Record<string, string> = {
  star: '⭐', moon: '🌙', sun: '☀️', comet: '☄️', gem: '💎', diamond: '💎', clover: '🍀', crown: '👑', heart: '❤️',
  key: '🗝️', coin: '🪙', bell: '🔔', cherry: '🍒', anchor: '⚓', shell: '🐚', pearl: '🫧', fish: '🐟', map: '🗺️',
}
const symbolIcon = (name: string) => SYMBOL_ICONS[name.toLowerCase()] ?? name.slice(0, 1).toUpperCase()

const METRIC: Record<string, string> = {
  BestMultiple: 'Best win multiple', BestWin: 'Biggest single win', TotalWagered: 'Most wagered', TotalWon: 'Most won',
  RoundsPlayed: 'Most cards played', Hits: 'Most top prizes',
}

function countdown(iso: string | null): string | null {
  if (!iso) return null
  const ms = new Date(iso).getTime() - Date.now()
  if (ms <= 0) return 'ending…'
  const h = Math.floor(ms / 3_600_000)
  const m = Math.floor((ms % 3_600_000) / 60_000)
  return h >= 48 ? `${Math.floor(h / 24)}d left` : h > 0 ? `${h}h ${m}m left` : `${m}m left`
}

/** What a promotion does, in a sentence. */
export function describe(p: PublicPromo, money: Money): string {
  const d = p.details
  switch (p.type) {
    case 'FreeBet': return `Free cards worth ${money(d.stake)}.`
    case 'MysteryPrize': return `Any card can hide a mystery ${d.prize === 'Cash' ? `prize of ${money(d.amount)}` : `free card worth ${money(d.amount)}`}.`
    case 'BuyXGetFree': return `Buy ${d.buy} cards, get one free.`
    case 'CollectionMission': return `Collect all ${d.symbols.length} symbols from your cards to win ${d.prize === 'Cash' ? money(d.reward) : `a ${money(d.reward)} free card`}.`
    case 'StreakMission': return `Play ${d.target} cards in a row to win ${d.prize === 'Cash' ? money(d.reward) : `a ${money(d.reward)} free card`}.`
    case 'Cashback': return `${d.percent}% of your net losses back every ${d.period === 'Daily' ? 'day' : 'week'} (up to ${money(d.maxPerPlayer)}).`
    case 'MultiplierLeaderboard': return `${METRIC[d.metric] ?? 'Best result'} wins — top prize ${money(d.prizes[0])}.`
    case 'MultiplierRace': return `First ${d.winners} to win ${d.targetMultiplier}× the card price get ${money(d.prize)} — ${d.remaining} left.`
    case 'Rain': return `${money(d.pool)} rains on players who played in the last ${d.activeWithinMinutes} minutes.`
    default: return ''
  }
}

/** Header button: opens the panel, shows the free-card count. Hidden when nothing is running. */
export function PromoButton() {
  const state = usePromos((s) => s.promos)
  if (!state || (state.promotions.length === 0 && state.freeBets.length === 0)) return null
  const free = state.freeBets.length
  return (
    <button type="button" className="promo-btn" onClick={() => promos.openPanel(true)} aria-label="Promotions">
      <span aria-hidden>🎁</span>
      {free > 0 && <span className="promo-badge">{free}</span>}
    </button>
  )
}

/** One line of progress for the offers players work towards (buy-X, collection, streak, cashback). */
export function PromoStrip({ money }: { money: Money }) {
  const state = usePromos((s) => s.promos)
  const items = (state?.promotions ?? []).filter((p) => ['BuyXGetFree', 'CollectionMission', 'StreakMission', 'Cashback'].includes(p.type))
  if (items.length === 0) return null
  return (
    <div className="promo-strip" onClick={() => promos.openPanel(true)}>
      {items.map((p) => (
        <span key={p.promotionId} className="promo-strip-item">
          {p.type === 'BuyXGetFree' && <>🎫 {p.details.count}/{p.details.buy} to a free card</>}
          {p.type === 'StreakMission' && <>🔥 Streak {p.details.streak}/{p.details.target}</>}
          {p.type === 'Cashback' && <>💸 Cashback {money(p.details.due)}</>}
          {p.type === 'CollectionMission' && (
            <>
              ✨{' '}
              {p.details.symbols.map((s: string) => (
                <span key={s} className={`promo-sym ${p.details.collected.includes(s) ? 'got' : ''}`} title={s}>
                  {symbolIcon(s)}
                </span>
              ))}
            </>
          )}
        </span>
      ))}
    </div>
  )
}

export function PromoPanel({ money }: { money: Money }) {
  const open = usePromos((s) => s.panelOpen)
  const state = usePromos((s) => s.promos)
  if (!open || !state) return null
  return (
    <div className="promo-overlay" onClick={() => promos.openPanel(false)}>
      <aside className="promo-panel" onClick={(e) => e.stopPropagation()} aria-label="Promotions">
        <header className="promo-head">
          <span>Promotions</span>
          <button type="button" className="promo-x" onClick={() => promos.openPanel(false)} aria-label="Close">✕</button>
        </header>

        {state.freeBets.length > 0 && (
          <div className="promo-free">
            <b>🎟️ You have {state.freeBets.length} free card{state.freeBets.length === 1 ? '' : 's'}</b>
            <div className="promo-chips">
              {state.freeBets.map((f) => (
                <span key={f.awardId} className="promo-chip">
                  {money(f.amount)}
                  {f.expiresAt && <small> · {countdown(f.expiresAt)}</small>}
                </span>
              ))}
            </div>
            <small>Play one with the Free card button — it pays its prize like a bought card.</small>
          </div>
        )}

        {state.promotions.map((p) => (
          <section key={p.promotionId} className="promo-card">
            <div className="promo-card-head">
              <span aria-hidden>{ICONS[p.type] ?? '🎁'}</span>
              <b>{p.name}</b>
              {p.endsAt && <small>{countdown(p.endsAt)}</small>}
            </div>
            <p>{describe(p, money)}</p>
            <Progress p={p} money={money} />
            {p.minStake > 0 && p.type !== 'FreeBet' && <small className="promo-terms">Cards of {money(p.minStake)} or more count. Free cards don't.</small>}
            {p.terms && <small className="promo-terms">{p.terms}</small>}
          </section>
        ))}
        {state.promotions.length === 0 && <p>No promotions running right now.</p>}
      </aside>
    </div>
  )
}

function Progress({ p, money }: { p: PublicPromo; money: Money }) {
  const d = p.details
  switch (p.type) {
    case 'BuyXGetFree':
      return <Bar value={d.count} max={d.buy} label={`${d.count} of ${d.buy} cards`} />
    case 'StreakMission':
      return <Bar value={d.streak} max={d.target} label={`${d.streak} of ${d.target} in a row · breaks after ${d.maxGapMinutes} min idle`} />
    case 'CollectionMission':
      return (
        <div className="promo-symbols">
          {d.symbols.map((s: string) => (
            <span key={s} className={`promo-sym big ${d.collected.includes(s) ? 'got' : ''}`} title={s}>
              {symbolIcon(s)}
              <small>{s}</small>
            </span>
          ))}
          {d.maxCompletions > 0 && <small className="promo-terms">Sets completed: {d.completed} of {d.maxCompletions}</small>}
        </div>
      )
    case 'Cashback':
      return (
        <small className="promo-terms">
          Net loss so far {money(d.netLoss)} → {money(d.due)} back {d.due > 0 ? `on ${new Date(d.paidAt).toLocaleString()}` : `(from ${money(d.minLoss)} net loss)`}
          {d.days?.length ? ` · counts on ${d.days.join(', ')}` : ''}
        </small>
      )
    case 'MultiplierLeaderboard':
      return (
        <ol className="promo-board">
          {d.top.map((r: { rank: number; player: string; score: number }) => (
            <li key={r.rank} className={d.me?.rank === r.rank ? 'me' : ''}>
              <span>{r.rank}</span>
              <span>{r.player}</span>
              <span>{d.metric === 'BestMultiple' ? `${r.score}×` : d.metric === 'RoundsPlayed' || d.metric === 'Hits' ? r.score : money(r.score)}</span>
              <span>{r.rank <= d.prizes.length ? money(d.prizes[r.rank - 1]) : ''}</span>
            </li>
          ))}
          {d.top.length === 0 && <li className="empty">Nobody on the board yet — be the first.</li>}
          {d.me && d.me.rank > 10 && <li className="me">You're #{d.me.rank}</li>}
        </ol>
      )
    default:
      return null
  }
}

function Bar({ value, max, label }: { value: number; max: number; label: string }) {
  return (
    <div className="promo-bar" aria-label={label}>
      <div className="promo-bar-fill" style={{ width: `${Math.min(100, (value / Math.max(1, max)) * 100)}%` }} />
      <span>{label}</span>
    </div>
  )
}

/** Toasts for promo wins and progress. */
export function PromoNotices() {
  const notices = usePromos((s) => s.notices)
  return (
    <div className="promo-notices" aria-live="polite">
      {notices.map((n) => (
        <div key={n.id} className={`promo-notice ${n.tone}`} onClick={() => promos.dismiss(n.id)}>
          <span className="promo-notice-icon" aria-hidden>{n.icon}</span>
          <div>
            <b>{n.title}</b>
            <span>{n.text}</span>
          </div>
        </div>
      ))}
    </div>
  )
}

/**
 * Plays one of the player's free cards. With a price (a game with one card price), only free cards at that price;
 * without, the next free card the server will use (the one expiring first) at its own value.
 */
export function FreeCardButton({ price, money, disabled, onPlay, label = 'Free card' }: { price?: number; money: Money; disabled: boolean; onPlay: () => void; label?: string }) {
  const state = usePromos((s) => s.promos)
  const free = price == null ? (state?.freeBets ?? []) : promos.freeCardsAt(price)
  if (free.length === 0) return null
  return (
    <button type="button" className="free-card-btn" disabled={disabled} onClick={onPlay}>
      🎟️ {label} {money(free[0].amount)}
      {free.length > 1 && <small>{free.length} left</small>}
    </button>
  )
}
