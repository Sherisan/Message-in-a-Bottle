import type { ReactNode } from 'react'
import { currencySymbol, money, times } from '../game/format'
import { store, type GameState } from '../game/store'

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" role="dialog" aria-label={title} onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h2>{title}</h2>
          <button className="modal-close" onClick={onClose} aria-label="Close">×</button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  )
}

export function HelpModal({ s }: { s: GameState }) {
  if (!s.helpOpen || !s.info) return null
  const { info } = s
  const symbol = currencySymbol(info.currency)
  return (
    <Modal title="How to play" onClose={() => store.openHelp(false)}>
      <ol className="howto">
        <li>Choose your stake, then tap <strong>Send the tide</strong>. Five bottles wash up on the beach.</li>
        <li>Pick a bottle (or tap <strong>Quick Pick</strong>). It pops open and its message shows your prize as a multiple of your stake.</li>
        <li>The other four bottles then open so you can see what they held.</li>
      </ol>
      <p className="fair-note">
        Your prize is drawn by the game server when you send the tide. Which bottle you pick does not change
        your chances. The other bottles' messages are separate random draws from the same prize table below.
      </p>

      <h3>Prizes</h3>
      <table className="prize-table">
        <thead><tr><th>Prize</th><th>Chance</th><th>At {money(s.stake, symbol)}</th></tr></thead>
        <tbody>
          {[...info.prizeTable].reverse().map((p) => (
            <tr key={p.multiplier}>
              <td>{times(p.multiplier)}</td>
              <td>{formatChance(p.chance)}</td>
              <td>{money(p.multiplier * s.stake, symbol)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="small">
        Return to player: {(info.rtp * 100).toFixed(2)}%. Maximum win per play: {money(info.maxWin, symbol)}.
        Any other bottle is empty.
      </p>

      <h3>Provably fair</h3>
      <p className="small">Current server seed hash:</p>
      <code className="seed">{info.fairness.currentServerSeedHash}</code>
      {info.fairness.previousServerSeed && (
        <>
          <p className="small">Previous server seed (revealed):</p>
          <code className="seed">{info.fairness.previousServerSeed.serverSeed}</code>
        </>
      )}
      <p className="small">If you lose your connection after sending the tide, your play still counts — reopen the game to see your bottles.</p>
    </Modal>
  )
}

export function HistoryModal({ s }: { s: GameState }) {
  if (!s.historyOpen) return null
  const symbol = currencySymbol(s.info?.currency)
  return (
    <Modal title="History" onClose={() => store.openHistory(false)}>
      {s.history.length === 0 ? (
        <p className="small">No plays yet this session.</p>
      ) : (
        <table className="history-table">
          <thead><tr><th>Time</th><th>Stake</th><th>Prize</th><th>Win</th></tr></thead>
          <tbody>
            {s.history.map((h) => (
              <tr key={h.roundId} className={h.win > 0 ? 'won' : ''}>
                <td>{new Date(h.at).toLocaleTimeString()}</td>
                <td>{money(h.stake, symbol)}</td>
                <td>{h.multiplier > 0 ? times(h.multiplier) : '—'}</td>
                <td>{h.win > 0 ? money(h.win, symbol) : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Modal>
  )
}

const MESSAGES = {
  insufficient: 'Not enough balance for this stake. Choose a smaller stake or top up.',
  connection: 'Connection lost. If your tide went out, your bottles will be waiting — your balance has been refreshed.',
  pending: 'Your win is confirmed and will appear in your balance shortly.',
}

export function MessageToast({ s }: { s: GameState }) {
  const m = s.message
  if (!m) return null
  const text = m.kind === 'error' ? m.text : MESSAGES[m.kind]
  return (
    <div className={`toast ${m.kind}`} role="alert" onClick={store.dismissMessage}>
      {text}
    </div>
  )
}

function formatChance(chance: number): string {
  if (chance >= 0.01) return `${(chance * 100).toFixed(1)}%`
  return `1 in ${Math.round(1 / chance).toLocaleString('en-US')}`
}
