// SimulationPanel.jsx — Shift Simulation with interactive sliders
import { useState } from 'react'

const DEFAULT_PARAMS = {
  dynamic_qr_share: 0.40,
  ambiguity_rate: 0.015,
  retry_panic_rate: 0.25,
  deescalation_effectiveness: 0.70,
  issuer_timeout_share: 0.02,
}

const N = 100000

function computeResults(p) {
  const ambiguous = N * p.ambiguity_rate
  const retryAttempts = ambiguous * p.retry_panic_rate
  const duplicatesPrevented = N * p.ambiguity_rate * p.retry_panic_rate * p.deescalation_effectiveness * p.dynamic_qr_share
  const autoResolved = ambiguous * p.deescalation_effectiveness
  const humanEscalated = ambiguous * (1 - p.deescalation_effectiveness)
  const baselineHold = 75
  const safeclearHold = baselineHold * (1 - p.deescalation_effectiveness * 0.8)
  const timeSaved = (ambiguous * (baselineHold - safeclearHold)) / 3600
  const refundValue = duplicatesPrevented * 400

  return {
    ambiguous: Math.round(ambiguous),
    retryAttempts: Math.round(retryAttempts),
    duplicatesPrevented: Math.round(duplicatesPrevented),
    autoResolved: Math.round(autoResolved),
    humanEscalated: Math.round(humanEscalated),
    timeSaved: timeSaved.toFixed(1),
    baselineHold: Math.round(baselineHold),
    safeclearHold: Math.round(safeclearHold),
    refundValue: Math.round(refundValue),
  }
}

function Slider({ label, name, value, min, max, step, format, onChange }) {
  return (
    <div className="slider-group">
      <div className="slider-label">
        <span className="slider-name">{label}</span>
        <span className="slider-value">{format(value)}</span>
      </div>
      <input
        type="range" className="slider-input"
        min={min} max={max} step={step}
        value={value}
        onChange={e => onChange(name, parseFloat(e.target.value))}
      />
    </div>
  )
}

function MetricCard({ icon, label, value, sub, colorClass }) {
  return (
    <div className="metric-card">
      <div className="metric-icon">{icon}</div>
      <div style={{ flex: 1 }}>
        <div className="metric-label">{label}</div>
        <div className={`metric-value ${colorClass}`}>{value}</div>
        {sub && <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>{sub}</div>}
      </div>
    </div>
  )
}

export default function SimulationPanel() {
  const [params, setParams] = useState(DEFAULT_PARAMS)
  const results = computeResults(params)

  const update = (name, val) => setParams(p => ({ ...p, [name]: val }))
  const pct = v => `${(v * 100).toFixed(1)}%`
  const num = v => v.toLocaleString('en-IN')

  return (
    <div className="sim-panel">
      {/* Left: Sliders */}
      <div>
        <div style={{ marginBottom: 18 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--cyan)', marginBottom: 4 }}>
            📊 Shift Impact Simulation
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            Simulate 100,000 POS Transactions under festival rush & bank outage conditions.
          </div>
        </div>

        <div className="sim-sliders">
          <Slider label="Dynamic QR Share" name="dynamic_qr_share" value={params.dynamic_qr_share}
            min={0.10} max={0.90} step={0.01} format={pct} onChange={update} />
          <Slider label="Ambient Ambiguity Rate" name="ambiguity_rate" value={params.ambiguity_rate}
            min={0.005} max={0.05} step={0.001} format={pct} onChange={update} />
          <Slider label="Retry Panic Rate" name="retry_panic_rate" value={params.retry_panic_rate}
            min={0.10} max={0.50} step={0.01} format={pct} onChange={update} />
          <Slider label="SafeClear De-escalation Effectiveness" name="deescalation_effectiveness" value={params.deescalation_effectiveness}
            min={0.30} max={0.90} step={0.01} format={pct} onChange={update} />
          <Slider label="Payer Issuer Timeout Share" name="issuer_timeout_share" value={params.issuer_timeout_share}
            min={0.01} max={0.10} step={0.005} format={pct} onChange={update} />
        </div>

        {/* Parameter Summary */}
        <div style={{ marginTop: 20, padding: 14, background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 12 }}>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8, fontWeight: 700, textTransform: 'uppercase' }}>
            Current Simulation Assumptions
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
            {Object.entries(params).map(([k, v]) => (
              <div key={k} style={{ fontSize: 11, display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>{k.replace(/_/g, ' ')}:</span>
                <span style={{ color: 'var(--cyan)', fontFamily: 'monospace', fontWeight: 600 }}>{pct(v)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right: Results */}
      <div className="sim-results">
        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>
          📈 Real-Time Macro Outcomes
        </div>

        <MetricCard icon="⚠️" label="Ambiguous Incidents / Shift"
          value={num(results.ambiguous)} sub={`from ${num(N)} transactions`} colorClass="warning" />

        <MetricCard icon="🔁" label="Duplicate Incidents Prevented"
          value={num(results.duplicatesPrevented)}
          sub={`${pct(results.duplicatesPrevented / Math.max(results.retryAttempts, 1))} of retry panics caught by guard`}
          colorClass="success" />

        <MetricCard icon="🤖" label="Autonomous Resolution Rate"
          value={num(results.autoResolved)}
          sub={`${pct(params.deescalation_effectiveness)} resolved with zero merchant intervention`}
          colorClass="cyan" />

        <MetricCard icon="🧑" label="Human-in-Loop Escalations"
          value={num(results.humanEscalated)}
          sub="explicit merchant decision on POS screen"
          colorClass="purple" />

        <MetricCard icon="⏱" label="Counter Queuing Hours Saved"
          value={`${results.timeSaved} hours`}
          sub={`${results.baselineHold}s down to ${results.safeclearHold}s avg checkout latency`}
          colorClass="success" />

        <MetricCard icon="💰" label="Automated Refund Value"
          value={`₹${num(results.refundValue)}`}
          sub="prevented disputed funds or chargeback penalties"
          colorClass="cyan" />

        {/* Comparison Bar */}
        <div style={{ padding: 16, background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 12 }}>
          <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 12, color: 'var(--text-primary)' }}>
            Checkout Counter Hold Latency Comparison
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-secondary)', marginBottom: 4 }}>
                <span>Without SafeClear (Static QR + Bank Latency)</span>
                <span style={{ color: 'var(--danger)', fontWeight: 600 }}>{results.baselineHold}s avg</span>
              </div>
              <div style={{ height: 8, background: 'rgba(255,255,255,0.08)', borderRadius: 4 }}>
                <div style={{ width: '100%', height: '100%', background: 'var(--danger)', borderRadius: 4 }} />
              </div>
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-secondary)', marginBottom: 4 }}>
                <span>With SafeClear Autonomous Protocol</span>
                <span style={{ color: 'var(--success)', fontWeight: 600 }}>{results.safeclearHold}s avg</span>
              </div>
              <div style={{ height: 8, background: 'rgba(255,255,255,0.08)', borderRadius: 4 }}>
                <div style={{
                  width: `${(results.safeclearHold / results.baselineHold) * 100}%`,
                  height: '100%', background: 'var(--success)', borderRadius: 4, transition: 'width 0.4s ease'
                }} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
