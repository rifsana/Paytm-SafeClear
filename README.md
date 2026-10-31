# Paytm SafeClear 🛡️⚡
> **Autonomous Incident Resolution & Merchant AI Teammate for Ambiguous POS UPI Transactions**

Paytm SafeClear is an autonomous UPI resolution platform engineered to eliminate counter friction, prevent duplicate payments, and resolve ambiguous transaction states in real-time. By bridging the gap between customer payment apps, merchant POS terminals, the iconic Paytm Soundbox, and NPCI UDIR (Unified Dispute & Issue Resolution), SafeClear delivers zero-wait, fraud-proof transaction closure.

---

## 🌟 Key Features

### 1. 📱 Customer Payer App Simulator
- **Dynamic UPI QR Code**: Real-time deterministic 25×25 QR generation with animated laser scanning.
- **SafeClear Auto-Lock**: Automatically locks the QR code upon bank timeouts or decline events to prevent customers from entering duplicate retry loops.
- **Natural Language Dispute Triage**: Payer can type queries in conversational Hinglish (*"Paisa kat gaya par dukandar bola nahi aaya"*); SafeClear categorizes and provides instant resolution steps.

### 2. 🏪 Merchant Counter & POS Terminal
- **Smart POS Terminal**: Real-time transaction monitoring with automated status badges (`SETTLED`, `PENDING`, `WEBHOOK DELAY`, `HUMAN-IN-LOOP`).
- **Tactical Merchant Actions**: One-click counter decision controls:
  - `Release Goods` — backed by SafeClear guarantee.
  - `Cash + Auto-Refund` — take cash and arm automatic refund if delayed UPI credit arrives.
  - `Hold Queue` — manage counter rush smoothly.
- **Paytm Soundbox 4G**: Integrated voice alerts with waveform animation and multilingual support (*Hindi, English, Tamil, Telugu*) with clear, natural female speech synthesis.
- **Live Merchant Ledger**: Real-time audit trail of settled, failed, and auto-refunded transactions.

### 3. 🤖 Merchant AI Copilot & Engine
- **Voice-Enabled Copilot**: Local Ollama-powered LLM assistant (`qwen2.5:1.5b` / `llama3.2:1b`) operating in conversational Hinglish.
- **Live Bank Health Grid**: Real-time telemetry monitoring for top issuer banks (*HDFC, SBI, ICICI, Axis*) tracking P95 latency and timeout percentages.
- **Bank Chaos Injector**: Tactical ops tools to simulate real-world festival surges (`Crash HDFC`, `Spike SBI`, `Reset Normal`).
- **SafeClear Event Stream**: High-frequency real-time event log tracking protocol handshakes, NPCI checks, and webhook reconciliation.

### 4. 🔏 NPCI UDIR Settlement Certificate
- Generates cryptographically verifiable settlement dockets with **SHA-256 HMAC** cryptographic seals, dispute references, and transaction proofs.

---

## 🏗️ Architecture

```
                                  ┌───────────────────────────────┐
                                  │      Paytm SafeClear Web UI    │
                                  │  (React 18 + Vite + Tailwind) │
                                  └──────────────┬────────────────┘
                                                 │
                                ┌────────────────┴────────────────┐
                                │                                 │
                     REST / SSE / WS APIs                  Web Speech API
                                │                          (Voice Copilot)
                                ▼                                 │
                 ┌─────────────────────────────┐                  ▼
                 │       FastAPI Backend       │         Paytm Soundbox 4G
                 │   - Scenario Orchestrator   │
                 │   - UDIR Dispute Engine     │
                 │   - HMAC Docket Generator   │
                 └──────────────┬──────────────┘
                                │
                 ┌──────────────┴──────────────┐
                 │                             │
                 ▼                             ▼
       ┌──────────────────┐          ┌───────────────────┐
       │   Ollama Local   │          │   NPCI UDIR Mock  │
       │  Qwen / Llama 3  │          │  Resolution Engine│
       └──────────────────┘          └───────────────────┘
```

---

## 🚀 Quick Start Guide

### Prerequisites
- **Node.js** (v18 or later)
- **Python** (v3.10 or later)
- **Ollama** (optional, for local offline AI copilot)

### 1. Clone the Repository
```bash
git clone https://github.com/rifsana/Paytm-SafeClear.git
cd Paytm-SafeClear
```

### 2. Backend Setup
```bash
cd backend
python -m venv venv
# On Windows:
.\venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate

pip install -r requirements.txt
python main.py
```
*Backend runs on `http://localhost:8000`.*

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
*Frontend runs on `http://localhost:5173`.*

### 4. Start Local AI Copilot (Optional)
```bash
ollama serve
ollama pull qwen2.5:1.5b
```

### 5. One-Click Start (Windows PowerShell)
You can launch both services together with:
```powershell
.\start.ps1
```

---

## 🧪 Incident Scenarios Demonstrated

| Scenario | Issue | SafeClear Autonomous Resolution |
| :--- | :--- | :--- |
| **Late Webhook Success** | Bank debited ₹250, but merchant POS webhook delayed. | SafeClear queries NPCI UDIR, confirms settlement in 3.6s, sounds Paytm Soundbox, preventing customer from being asked to pay twice. |
| **Bank Decline** | Payer bank declines ₹500 transaction. | SafeClear auto-locks QR code to block retry loop, notifies merchant counter to hold goods, and informs customer. |
| **Bank Timeout 60s** | Axis bank experiences latency spike on ₹1,200 payment. | SafeClear escalates to Human-in-Loop: merchant takes cash and arms auto-refund docket if UPI credit clears later. |
| **Duplicate Payment** | Customer double-scans and initiates two ₹400 debits. | SafeClear detects duplicate intent ID, clears order #1, and triggers auto-refund for order #2 via NPCI UDIR. |

---

## 🛠️ Tech Stack

- **Frontend**: React 18, Vite, Tailwind CSS, Lucide React, Sonner Toast
- **Backend**: FastAPI, Uvicorn, Pydantic, HTTPX, WebSockets
- **AI & Speech**: Ollama (`qwen2.5:1.5b`), Web Speech API (Voice Synthesis & Recognition)
- **Security**: SHA-256 HMAC Verification Seals, Audit Dockets

---

## 📄 License

This project was built for the Paytm SafeClear Autonomous Resolution Hackathon. All rights reserved.

