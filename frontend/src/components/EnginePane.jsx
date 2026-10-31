// EnginePane.jsx — Pixel-Perfect match to reference design: Copilot with Chat History + Bank Health + Chaos + Event Stream
import { useState, useRef } from 'react'

export function CopilotBox({
  copilotResult, copilotLoading, onAskCopilot, onSpeakAdvice
}) {
  const [input, setInput] = useState('')
  const [isListening, setIsListening] = useState(false)
  const [conversation, setConversation] = useState([]) // Array of { role: 'user' | 'assistant', text: string }
  const recognitionRef = useRef(null)

  const chips = [
    'Payment attka hai kya?',
    'Auto-refund status verify karo',
    '₹1200 Axis timeout ka kya karun?',
    'Soundbox voice replay karo',
  ]

  const handleSend = (text = input) => {
    if (!text.trim() || copilotLoading) return
    const userMsg = text.trim()
    setConversation(prev => [...prev, { role: 'user', text: userMsg }])
    onAskCopilot(userMsg)
    setInput('')
  }

  // Update conversation when new copilot result arrives
  const lastResultRef = useRef(null)
  if (copilotResult && copilotResult !== lastResultRef.current) {
    lastResultRef.current = copilotResult
    if (!conversation.some(c => c.text === copilotResult.answer)) {
      setConversation(prev => [...prev, { role: 'assistant', text: copilotResult.answer }])
    }
  }

  const toggleVoiceRecording = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) {
      handleSend('₹1200 Axis timeout ka kya karun?')
      return
    }

    if (isListening) {
      try { recognitionRef.current?.stop() } catch (_) {}
      setIsListening(false)
      return
    }

    try {
      const rec = new SpeechRecognition()
      rec.lang = 'hi-IN'
      rec.onstart = () => setIsListening(true)
      rec.onend = () => setIsListening(false)
      rec.onerror = () => setIsListening(false)
      rec.onresult = (e) => {
        const text = e.results[0][0].transcript
        setInput(text)
        setIsListening(false)
        handleSend(text)
      }
      recognitionRef.current = rec
      rec.start()
    } catch (_) {
      setIsListening(false)
      handleSend('₹1200 Axis timeout ka kya karun?')
    }
  }

  // Waveform bars
  const waveBars = [8, 16, 24, 12, 28, 18, 32, 14, 22, 10, 26, 15, 20, 8, 14]

  return (
    <div className="copilot-widget-box">
      {/* Copilot Header */}
      <div className="copilot-header-row">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div className="copilot-icon-badge">✨</div>
          <div>
            <div className="copilot-main-title">Ollama AI Voice Copilot</div>
            <div className="copilot-subtitle">Claude Sonnet · Hinglish mode</div>
          </div>
        </div>
        <button
          className={`copilot-mic-circle ${isListening ? 'active-listening' : ''}`}
          onClick={toggleVoiceRecording}
          title={isListening ? "Stop listening" : "Click to speak or simulate voice question"}
        >
          🎙️
        </button>
      </div>

      {/* Frequency Soundwave Bars */}
      <div className="copilot-waveform-row">
        {waveBars.map((h, i) => (
          <div
            key={i}
            className={`copilot-wave-bar ${copilotLoading || isListening ? 'animated-bar' : ''}`}
            style={{ height: `${h}px` }}
          />
        ))}
      </div>

      {/* Suggestion Chips */}
      <div className="copilot-chips-wrap">
        {chips.map((c, idx) => (
          <button
            key={idx}
            className="copilot-chip-btn"
            onClick={() => handleSend(c)}
            disabled={copilotLoading}
          >
            {c}
          </button>
        ))}
      </div>

      {/* Answer / Chat Thread Area (Exact Match to Screenshot 1) */}
      <div className="copilot-message-box">
        {conversation.length === 0 ? (
          copilotLoading ? (
            <div className="copilot-loading-text">
              <span className="pulse-dot" style={{ background: 'var(--purple)' }} />
              Ollama is analyzing live banking telemetry and transaction state...
            </div>
          ) : (
            <div className="copilot-idle-prompt">
              Say "Payment attka hai kya?" or tap a chip to ask the copilot.
            </div>
          )
        ) : (
          <div className="copilot-chat-thread">
            {conversation.map((msg, i) => (
              <div key={i} className={`copilot-bubble-row ${msg.role}`}>
                {msg.role === 'user' ? (
                  <div className="bubble-user">
                    <span className="bubble-user-tag">YOU</span>
                    <span className="bubble-user-text">{msg.text}</span>
                  </div>
                ) : (
                  <div className="bubble-ai">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                      <span className="bubble-ai-sparkle">✨</span>
                      {onSpeakAdvice && (
                        <button
                          className="bubble-read-btn"
                          onClick={() => onSpeakAdvice(msg.text)}
                          title="Listen in female voice"
                        >
                          🔊 Read
                        </button>
                      )}
                    </div>
                    <div className="bubble-ai-text">
                      {msg.text}
                    </div>
                  </div>
                )}
              </div>
            ))}
            {copilotLoading && (
              <div className="copilot-loading-text" style={{ marginTop: 8 }}>
                <span className="pulse-dot" style={{ background: 'var(--purple)' }} />
                Analyzing bank telemetry...
              </div>
            )}
          </div>
        )}
      </div>

      {/* Input Row */}
      <div className="copilot-bottom-input-row">
        <input
          className="copilot-text-input"
          placeholder="Hinglish me pucho..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          disabled={copilotLoading}
        />
        <button
          className="copilot-send-btn"
          onClick={() => handleSend()}
          disabled={copilotLoading || !input.trim()}
        >
          ↗ Send
        </button>
      </div>
    </div>
  )
}

export function BankHealthSection({ issuerHealth, onUpdateBankHealth, events }) {
  const defaults = {
    HDFC: { status: 'NORMAL', latency: 180, timeout: 0.4 },
    SBI:  { status: 'NORMAL', latency: 172, timeout: 0.6 },
    ICICI:{ status: 'NORMAL', latency: 186, timeout: 0.3 },
    AXIS: { status: 'NORMAL', latency: 177, timeout: 0.8 },
  }

  const banks = ['HDFC', 'SBI', 'ICICI', 'AXIS'].map(name => {
    const live = issuerHealth[name] || {}
    const isCritical = live.status === 'critical' || live.timeout_rate > 3.0
    const isDegraded = live.status === 'degraded' || (live.timeout_rate > 1.5 && !isCritical)
    const statusText = isCritical ? 'CRITICAL' : isDegraded ? 'DEGRADED' : 'NORMAL'
    const latency = live.p95_latency_ms || defaults[name].latency
    const timeout = live.timeout_rate !== undefined ? live.timeout_rate : defaults[name].timeout

    return { name, statusText, isCritical, isDegraded, latency, timeout }
  })

  const triggerChaos = (bank, status, latency, timeout) => {
    if (onUpdateBankHealth) onUpdateBankHealth(bank, status, latency, timeout)
  }

  const resetBanks = () => {
    Object.entries(defaults).forEach(([b, d]) => {
      if (onUpdateBankHealth) onUpdateBankHealth(b, 'healthy', d.latency, d.timeout)
    })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Payer Issuer Bank Health (2x2 Grid) */}
      <div className="bank-health-container">
        <div className="bank-health-header">
          <div className="bank-health-title">🏦 Payer Issuer Bank Health</div>
          <div className="bank-live-indicator">
            <span className="dot-green" /> Live · 1s
          </div>
        </div>

        <div className="bank-cards-2x2">
          {banks.map(b => (
            <div key={b.name} className={`bank-card-tile ${b.isCritical ? 'critical' : b.isDegraded ? 'degraded' : 'normal'}`}>
              <div className="bank-tile-top">
                <span className="bank-tile-name">{b.name}</span>
                <span className={`bank-dot ${b.isCritical ? 'dot-red' : b.isDegraded ? 'dot-amber' : 'dot-green'}`} />
              </div>
              <div className="bank-stat-line">
                <span className="stat-name">latency</span>
                <span className="stat-val">{b.latency}ms</span>
              </div>
              <div className="bank-stat-line">
                <span className="stat-name">timeout</span>
                <span className="stat-val">{b.timeout}%</span>
              </div>
              <div className={`bank-status-pill ${b.isCritical ? 'pill-critical' : b.isDegraded ? 'pill-degraded' : 'pill-normal'}`}>
                {b.statusText}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bank Chaos Injector (Exact Match to Screenshot 3) */}
      <div className="chaos-box-clean">
        <div className="chaos-header-row">
          <span className="chaos-title">Bank Chaos Injector</span>
          <span className="chaos-tag">tactical ops</span>
        </div>
        <div className="chaos-actions-row">
          <button className="chaos-solid-btn crash" onClick={() => triggerChaos('HDFC', 'critical', 2400, 8.5)}>
            💥 Crash HDFC
          </button>
          <button className="chaos-solid-btn spike" onClick={() => triggerChaos('SBI', 'degraded', 1600, 4.2)}>
            ⚠️ Spike SBI
          </button>
          <button className="chaos-solid-btn reset" onClick={resetBanks}>
            🔄 Reset Normal
          </button>
        </div>
      </div>

      {/* SafeClear Event Stream (Exact Match to Screenshot 3) */}
      <div className="event-stream-box">
        <div className="event-stream-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 13 }}>((•))</span>
            <span style={{ fontSize: 12, fontWeight: 800, color: '#0F172A' }}>SafeClear Event Stream</span>
          </div>
          <span className="dot-green" />
        </div>
        <div className="event-stream-body">
          {events && events.length > 0 ? (
            <div className="events-scroll-list">
              {events.slice(0, 5).map(e => (
                <div key={e._id} className="event-mini-row">
                  <span className="event-mini-time">{e._ts}</span>
                  <span className="event-mini-msg">{e.message || e.type}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="event-stream-empty">Awaiting events...</div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function EnginePane({
  copilotResult, copilotLoading, onAskCopilot, onSpeakAdvice,
  issuerHealth, onUpdateBankHealth, events
}) {
  return (
    <div className="card-container engine-card">
      <div className="card-header-row">
        <div>
          <div className="card-title">Merchant AI Copilot & Engine</div>
          <div className="card-subtitle">Ollama Copilot · Bank Health · Chaos</div>
        </div>
        <div className="ai-active-pill">AI ACTIVE</div>
      </div>

      {/* Ollama AI Voice Copilot Widget with Interactive Chat */}
      <CopilotBox
        copilotResult={copilotResult}
        copilotLoading={copilotLoading}
        onAskCopilot={onAskCopilot}
        onSpeakAdvice={onSpeakAdvice}
      />

      {/* Payer Issuer Bank Health + Bank Chaos Injector + Event Stream */}
      <BankHealthSection
        issuerHealth={issuerHealth}
        onUpdateBankHealth={onUpdateBankHealth}
        events={events}
      />
    </div>
  )
}