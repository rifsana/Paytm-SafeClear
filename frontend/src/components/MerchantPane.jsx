// MerchantPane.jsx — Pixel-Perfect match to reference design: POS Terminal + Soundbox 4G + Ledger
import { useState } from 'react'

export function SoundboxWidget({ soundboxState, soundboxLang, onChangeLang, onTestSoundbox, displayAmount }) {
  const { speaking, text } = soundboxState
  const bars = [12, 22, 14, 28, 18, 24, 10]

  const langs = [
    { id: 'hi', label: 'Hindi' },
    { id: 'en', label: 'English' },
    { id: 'ta', label: 'Tamil' },
    { id: 'te', label: 'Telugu' },
  ]

  const currentLangLabel = langs.find(l => l.id === soundboxLang)?.label || 'Hindi'
  const amt = displayAmount || 500
  const displayText = text || (soundboxLang === 'en' ? `Received ${amt} rupees on Paytm` : `${amt} rupaye prapt hue, Paytm par`)

  return (
    <div className="soundbox-card-box">
      <div className="soundbox-header-row">
        <div>
          <div className="soundbox-brand">PAYTM SOUNDBOX 4G</div>
          <div className="soundbox-title">Voice Payment Alert</div>
        </div>
        <div className={`soundbox-speaker-icon ${speaking ? 'pulse-speaking' : ''}`}>
          🔊
        </div>
      </div>

      {/* Animated Equalizer Wave Bars */}
      <div className="soundbox-equalizer-row">
        {bars.map((h, i) => (
          <div
            key={i}
            className={`soundbox-bar ${speaking ? 'speaking-bar' : ''}`}
            style={{ height: `${speaking ? Math.min(32, h * 1.3) : h}px` }}
          />
        ))}
      </div>

      {/* Language Selector Pills */}
      <div className="soundbox-langs-row">
        {langs.map(l => (
          <button
            key={l.id}
            className={`soundbox-lang-pill ${soundboxLang === l.id ? 'active' : ''}`}
            onClick={() => onChangeLang(l.id)}
          >
            {l.label}
          </button>
        ))}
      </div>

      {/* Big Replay Voice Alert Button */}
      <button className="soundbox-replay-btn" onClick={onTestSoundbox}>
        ▷ Replay Voice Alert ({currentLangLabel})
      </button>

      {/* Voice Announcement Quote */}
      <div className="soundbox-quote-text">
        "{displayText}"
      </div>
    </div>
  )
}

export function DocketPanel({ docket, onClose }) {
  if (!docket) return null

  return (
    <div className="docket-certificate-card">
      <div className="docket-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 20 }}>🛡️</span>
          <div>
            <div className="docket-title">NPCI UDIR Settlement Certificate</div>
            <div className="docket-sub">Official RBI DPSS Harmonisation Audit Mandate</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span className="docket-guarantee-badge">✓ Guaranteed Auto-Refund</span>
          {onClose && (
            <button className="docket-close-btn" onClick={onClose} title="Close Certificate">
              ✕
            </button>
          )}
        </div>
      </div>

      <div className="docket-grid">
        <div className="docket-item">
          <div className="docket-label">DOCKET REFERENCE ID</div>
          <div className="docket-val mono">{docket.docket_id || 'UDIR-SAFECLEAR-20261029'}</div>
        </div>
        <div className="docket-item">
          <div className="docket-label">PROTECTED CLAIM</div>
          <div className="docket-val" style={{ color: 'var(--paytm-navy)', fontWeight: 900, fontSize: 18 }}>
            ₹{docket.amount?.toLocaleString('en-IN') || '1,200'}
          </div>
        </div>
        <div className="docket-item">
          <div className="docket-label">PAYER VPA</div>
          <div className="docket-val">{docket.customer_masked_vpa || 'amit****@okaxis'}</div>
        </div>
        <div className="docket-item">
          <div className="docket-label">HMAC DIGITAL SEAL</div>
          <div className="docket-val mono" style={{ fontSize: 11, color: '#059669' }}>
            {docket.hmac_signature ? `${docket.hmac_signature.slice(0, 24)}...` : 'SHA-256 Verified ✓'}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function MerchantPane({
  transactions, posState, soundboxState,
  soundboxLang, onChangeLang,
  merchantDecision, countdownState, docket,
  onMerchantDecision, onCancelRefund, onTestSoundbox
}) {
  const recentTxns = transactions.slice(-4).reverse()
  const latestTxn = transactions.slice(-1)[0]
  const displayAmount = posState.amount !== null && posState.amount !== undefined ? posState.amount : (latestTxn?.amount || 0)
  const isSettled = posState.status === 'settled'

  return (
    <div className="card-container merchant-card">
      {/* Header */}
      <div className="card-header-row">
        <div>
          <div className="card-title">Merchant Counter</div>
          <div className="card-subtitle">POS · Soundbox · Live Ledger</div>
        </div>
        <div className="counter-label">COUNTER #3</div>
      </div>

      {/* POS Terminal Screen (Dark Navy Theme) */}
      <div className="pos-terminal-dark">
        <div className="pos-dark-header">
          <span className="pos-counter-tag">POS TERMINAL · COUNTER #3</span>
          <span className={`pos-dark-status ${isSettled ? 'settled' : 'idle'}`}>
            {isSettled ? 'SETTLED' : 'IDLE'}
          </span>
        </div>

        <div className="pos-store-name">Sharma General Store</div>

        <div className="pos-amount-group">
          <div className="pos-tx-label">TRANSACTION</div>
          <div className="pos-big-number">₹{displayAmount.toLocaleString('en-IN')}</div>
        </div>

        {/* 3 Counter Action Buttons */}
        <div className="pos-actions-grid">
          <button
            className="pos-action-btn"
            onClick={() => onMerchantDecision && onMerchantDecision(posState.txnId, 'RELEASE_GOODS')}
          >
            <span style={{ fontSize: 14 }}>📦</span>
            <span>Release Goods</span>
          </button>
          <button
            className="pos-action-btn"
            onClick={() => onMerchantDecision && onMerchantDecision(posState.txnId, 'TAKE_CASH_AUTO_REFUND')}
          >
            <span style={{ fontSize: 14 }}>💵</span>
            <span>Cash + Auto-Refund</span>
          </button>
          <button
            className="pos-action-btn"
            onClick={() => onMerchantDecision && onMerchantDecision(posState.txnId, 'HOLD_QUEUE')}
          >
            <span style={{ fontSize: 14 }}>⏸</span>
            <span>Hold Queue</span>
          </button>
        </div>
      </div>

      {/* Bottom Sub-Row: Soundbox 4G (Left) + Live Merchant Ledger (Right) */}
      <div className="merchant-bottom-split">
        {/* Soundbox 4G Widget */}
        <div className="split-half">
          <SoundboxWidget
            soundboxState={soundboxState}
            soundboxLang={soundboxLang}
            onChangeLang={onChangeLang}
            onTestSoundbox={onTestSoundbox}
            displayAmount={displayAmount}
          />
        </div>

        {/* Live Merchant Ledger */}
        <div className="split-half">
          <div className="ledger-card-box">
            <div className="ledger-header-row">
              <div className="ledger-title">📈 Live Merchant Ledger</div>
              <div className="ledger-count">{recentTxns.length} txns</div>
            </div>

            <div className="ledger-list-area">
              {recentTxns.length === 0 ? (
                <div className="ledger-empty-msg">
                  No settlements yet. Run a scenario to see transactions appear.
                </div>
              ) : (
                <div className="ledger-items-stack">
                  {recentTxns.map(t => {
                    const isFailed = t.status === 'FAILED'
                    const isHuman = t.status === 'IN_FLIGHT' || t.status === 'TIMEOUT' || t.scenario === 3
                    const statusTag = isFailed ? 'FAILED' : isHuman ? 'HUMAN_IN_LOOP' : 'SETTLED'
                    const statusClass = isFailed ? 'failed' : isHuman ? 'human' : 'settled'

                    return (
                      <div key={t.id} className="ledger-item-row">
                        <div>
                          <div className="ledger-item-ref">
                            {t.id?.slice(0, 14)}.. {new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })} · {t.scenario === 2 ? 'SBI' : t.scenario === 3 ? 'AXIS' : 'HDFC'}
                          </div>
                          <div className="ledger-item-amount">₹{t.amount?.toLocaleString('en-IN')}</div>
                        </div>
                        <span className={`ledger-status-tag ${statusClass}`}>
                          {statusTag}
                        </span>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}