// CustomerPane.jsx — Pixel-Perfect match to Emergent Agent reference
import { useState } from 'react'

export default function CustomerPane({ transactions, posState, nlpResult, onNlpQuery }) {
  const [nlpInput, setNlpInput] = useState('')

  const handleTriage = (q = nlpInput) => {
    if (!q.trim()) return
    onNlpQuery(q)
    setNlpInput('')
  }

  // Get active transaction details
  const latestTxn = transactions.slice(-1)[0]
  const displayAmount = posState.amount !== null && posState.amount !== undefined ? posState.amount : (latestTxn?.amount || 0)
  
  // Determine Bank Name
  const bankName = latestTxn?.scenario === 1 ? 'HDFC' :
                   latestTxn?.scenario === 2 ? 'SBI' :
                   latestTxn?.scenario === 3 ? 'AXIS' :
                   latestTxn?.scenario === 4 ? 'ICICI' : 'HDFC'

  const isSettled = posState.status === 'settled'
  const isPending = posState.status === 'pending' || posState.status === 'locked'
  const isFailed = posState.status === 'failed'
  const isLocked = posState.status === 'locked'

  const statusLabel = isSettled ? 'SETTLED' : isPending ? 'PENDING' : isFailed ? 'FAILED' : 'IDLE'
  const statusColorClass = isSettled ? 'status-pill-settled' : isPending ? 'status-pill-pending' : isFailed ? 'status-pill-failed' : 'status-pill-idle'

  return (
    <div className="card-container customer-card">
      {/* Card Header */}
      <div className="card-header-row">
        <div>
          <div className="card-title">Customer Payer App</div>
          <div className="card-subtitle">Paytm UPI · Live</div>
        </div>
        <div className={`status-pill ${statusColorClass}`}>{statusLabel}</div>
      </div>

      {/* Realistic Smartphone Mockup */}
      <div className="phone-mockup-frame">
        <div className="phone-screen">
          {/* Status Bar */}
          <div className="phone-status-bar">
            <span className="status-time">9:41</span>
            {/* Dynamic Island in middle */}
            <div className="dynamic-island-pill">
              <div className="camera-dot" />
            </div>
            <div className="status-icons">
              <span>📶</span>
              <span>􀙇</span>
              <span>🔋</span>
            </div>
          </div>

          {/* Paytm Header */}
          <div className="phone-paytm-header">
            <div className="paytm-logo-circle">P</div>
            <div>
              <div className="pay-via-text">Pay via UPI</div>
              <div className="paytm-brand-text">Paytm</div>
            </div>
          </div>

          {/* Merchant Info Block */}
          <div className="phone-info-block">
            <div className="info-label">PAYING TO</div>
            <div className="merchant-name">Sharma General Store</div>
            <div className="merchant-vpa">merchant@paytm · PAYTM_SHOP_001</div>
          </div>

          {/* Amount Block */}
          <div className="phone-amount-block">
            <div>
              <div className="info-label">AMOUNT</div>
              <div className="amount-display">₹{displayAmount.toLocaleString('en-IN')}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div className="info-label">VIA</div>
              <div className="bank-via-name">{bankName}</div>
            </div>
          </div>

          {/* QR Code Container with Animated Scan Line & Auto-Lock Overlay */}
          <div className="qr-code-wrapper">
            <div className="qr-matrix-box">
              {/* High-fidelity CSS SVG QR pattern */}
              <svg viewBox="0 0 100 100" className="qr-svg" width="160" height="160">
                <rect x="5" y="5" width="26" height="26" rx="4" fill="#002970" />
                <rect x="9" y="9" width="18" height="18" rx="2" fill="#FFFFFF" />
                <rect x="13" y="13" width="10" height="10" rx="2" fill="#002970" />

                <rect x="69" y="5" width="26" height="26" rx="4" fill="#002970" />
                <rect x="73" y="9" width="18" height="18" rx="2" fill="#FFFFFF" />
                <rect x="77" y="13" width="10" height="10" rx="2" fill="#002970" />

                <rect x="5" y="69" width="26" height="26" rx="4" fill="#002970" />
                <rect x="9" y="73" width="18" height="18" rx="2" fill="#FFFFFF" />
                <rect x="13" y="77" width="10" height="10" rx="2" fill="#002970" />

                <rect x="36" y="8" width="6" height="6" fill="#002970" />
                <rect x="46" y="8" width="6" height="6" fill="#002970" />
                <rect x="56" y="8" width="6" height="6" fill="#002970" />
                <rect x="36" y="18" width="6" height="6" fill="#002970" />
                <rect x="46" y="24" width="6" height="6" fill="#002970" />
                <rect x="56" y="18" width="6" height="6" fill="#002970" />

                <rect x="8" y="36" width="6" height="6" fill="#002970" />
                <rect x="18" y="36" width="6" height="6" fill="#002970" />
                <rect x="28" y="36" width="6" height="6" fill="#002970" />
                <rect x="38" y="36" width="6" height="6" fill="#002970" />
                <rect x="48" y="36" width="6" height="6" fill="#002970" />
                <rect x="58" y="36" width="6" height="6" fill="#002970" />
                <rect x="68" y="36" width="6" height="6" fill="#002970" />
                <rect x="78" y="36" width="6" height="6" fill="#002970" />
                <rect x="86" y="36" width="6" height="6" fill="#002970" />

                <rect x="8" y="46" width="6" height="6" fill="#002970" />
                <rect x="24" y="46" width="6" height="6" fill="#002970" />
                <rect x="36" y="46" width="6" height="6" fill="#002970" />
                <rect x="52" y="46" width="6" height="6" fill="#002970" />
                <rect x="68" y="46" width="6" height="6" fill="#002970" />
                <rect x="84" y="46" width="6" height="6" fill="#002970" />

                <rect x="8" y="56" width="6" height="6" fill="#002970" />
                <rect x="18" y="56" width="6" height="6" fill="#002970" />
                <rect x="32" y="56" width="6" height="6" fill="#002970" />
                <rect x="44" y="56" width="6" height="6" fill="#002970" />
                <rect x="60" y="56" width="6" height="6" fill="#002970" />
                <rect x="76" y="56" width="6" height="6" fill="#002970" />
                <rect x="86" y="56" width="6" height="6" fill="#002970" />

                <rect x="36" y="68" width="6" height="6" fill="#002970" />
                <rect x="48" y="68" width="6" height="6" fill="#002970" />
                <rect x="62" y="68" width="6" height="6" fill="#002970" />
                <rect x="74" y="68" width="6" height="6" fill="#002970" />
                <rect x="86" y="68" width="6" height="6" fill="#002970" />

                <rect x="36" y="78" width="6" height="6" fill="#002970" />
                <rect x="46" y="78" width="6" height="6" fill="#002970" />
                <rect x="58" y="78" width="6" height="6" fill="#002970" />
                <rect x="70" y="78" width="6" height="6" fill="#002970" />
                <rect x="82" y="78" width="6" height="6" fill="#002970" />

                <rect x="36" y="86" width="6" height="6" fill="#002970" />
                <rect x="52" y="86" width="6" height="6" fill="#002970" />
                <rect x="64" y="86" width="6" height="6" fill="#002970" />
                <rect x="80" y="86" width="6" height="6" fill="#002970" />
              </svg>

              {/* Animated Cyan Laser Scan Line */}
              <div className="qr-laser-line" />

              {/* QR AUTO-LOCKED Overlay when lock guard is active */}
              {isLocked && (
                <div className="qr-auto-locked-overlay">
                  <div className="qr-lock-icon">🔒</div>
                  <div className="qr-lock-title">QR AUTO-LOCKED</div>
                  <div className="qr-lock-sub">unlocks in 8s</div>
                </div>
              )}
            </div>
            <div className="pay-merchant-footer">Pay to merchant@paytm</div>
          </div>
        </div>
      </div>

      {/* Natural Language Dispute Triage Section */}
      <div className="triage-section">
        <div className="triage-label">
          <span className="dot-green" /> Dispute triage — natural language
        </div>
        <div className="triage-input-row">
          <input
            className="triage-input"
            placeholder="Paisa cut gaya par dukandar bola..."
            value={nlpInput}
            onChange={(e) => setNlpInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleTriage()}
          />
          <button className="triage-btn" onClick={() => handleTriage()}>
            ↗ Triage
          </button>
        </div>
        {nlpResult && (
          <div className="triage-result-pop">
            💡 {nlpResult.advice || nlpResult.status || (typeof nlpResult === 'string' ? nlpResult : JSON.stringify(nlpResult))}
          </div>
        )}
      </div>
    </div>
  )
}