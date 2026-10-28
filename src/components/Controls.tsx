import { ui } from '../art'
import { currencySymbol, money, shortMoney } from '../game/format'
import { AUTO_COUNTS, store, type GameState } from '../game/store'
import { IconButton } from './Header'

/** Bottom panel: stake chips, the main button, Quick Pick and Auto. */
export function Controls({ s }: { s: GameState }) {
  const symbol = currencySymbol(s.info?.currency)
  const auto = s.autoRemaining > 0
  const canSend = store.canSend()

  const main = (() => {
    if (auto) return { label: 'STOP AUTO', sub: `${s.autoRemaining} left`, onClick: store.stopAuto, disabled: false }
    switch (s.phase) {
      case 'ready':
      case 'complete':
        return { label: s.phase === 'complete' ? 'PLAY AGAIN' : 'SEND THE TIDE', sub: money(s.stake, symbol), onClick: () => void store.send(), disabled: !canSend }
      case 'sending':
      case 'landing':
        return { label: 'HERE COMES THE TIDE', sub: '', onClick: () => {}, disabled: true }
      case 'picking':
        return { label: 'PICK A BOTTLE', sub: 'tap one, or Quick Pick', onClick: () => {}, disabled: true }
      default:
        return { label: 'OPENING…', sub: '', onClick: () => {}, disabled: true }
    }
  })()

  return (
    <footer className="controls" style={{ backgroundImage: `url("${ui.panelFrame}")` }}>
      <div className="stakes" role="radiogroup" aria-label="Stake">
        {s.stakes.map((v) => (
          <button
            key={v}
            className={`chip ${v === s.stake ? 'on' : ''}`}
            role="radio"
            aria-checked={v === s.stake}
            disabled={!store.canChangeStake()}
            onClick={() => store.setStake(v)}
            style={{ backgroundImage: `url("${ui.chipStake}")` }}
          >
            {shortMoney(v, symbol)}
          </button>
        ))}
      </div>

      <button
        className={`main-btn ${auto ? 'stop' : ''} ${s.phase === 'picking' ? 'waiting' : ''}`}
        style={{ backgroundImage: `url("${ui.btnMain}")` }}
        onClick={main.onClick}
        disabled={main.disabled}
      >
        <span className="main-label">{main.label}</span>
        {main.sub && <span className="main-sub">{main.sub}</span>}
      </button>

      <div className="side-btns">
        <IconButton
          src={ui.iconQuickpick}
          label="Quick Pick"
          onClick={() => store.quickPick()}
          disabled={s.phase !== 'picking'}
          active={s.phase === 'picking'}
        />
        <div className="auto-wrap">
          <IconButton src={ui.iconAuto} label="Auto play" onClick={() => store.openAutoMenu(!s.autoMenuOpen)} disabled={auto || !canSend} />
          {s.autoMenuOpen && (
            <div className="auto-menu" role="menu">
              <span className="auto-title">Auto play</span>
              {AUTO_COUNTS.map((n) => (
                <button key={n} role="menuitem" onClick={() => store.startAuto(n)}>{n} rounds</button>
              ))}
            </div>
          )}
        </div>
      </div>
    </footer>
  )
}
