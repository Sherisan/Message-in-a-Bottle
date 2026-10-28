import { ui } from '../art'
import { currencySymbol, money } from '../game/format'
import { store, type GameState } from '../game/store'

export function Header({ s }: { s: GameState }) {
  const balance = store.shownBalance
  return (
    <header className="header">
      <picture className="logo">
        <source media="(max-width: 640px)" srcSet={ui.logoStacked} />
        <img src={ui.logoHorizontal} alt="Message in a Bottle" />
      </picture>

      <div className="balance" aria-live="polite">
        <span className="balance-label">Balance</span>
        <span className="balance-value">{balance == null ? '—' : money(balance, currencySymbol(s.info?.currency))}</span>
      </div>

      <nav className="header-icons">
        <IconButton src={ui.iconHistory} label="History" onClick={() => store.openHistory(true)} />
        <IconButton src={ui.iconInfo} label="How to play" onClick={() => store.openHelp(true)} />
        <IconButton src={s.soundOn ? ui.iconSoundOn : ui.iconSoundOff} label={s.soundOn ? 'Sound off' : 'Sound on'} onClick={() => store.toggleSound()} />
      </nav>
    </header>
  )
}

export function IconButton({ src, label, onClick, disabled, active }: { src: string; label: string; onClick: () => void; disabled?: boolean; active?: boolean }) {
  return (
    <button className={`icon-btn ${active ? 'active' : ''}`} onClick={onClick} disabled={disabled} aria-label={label} title={label}>
      <img src={src} alt="" />
    </button>
  )
}
