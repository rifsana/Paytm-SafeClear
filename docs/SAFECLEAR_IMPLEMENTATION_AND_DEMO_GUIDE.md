# 🚀 Paytm SafeClear: Comprehensive Implementation & Live Demo Guide
### *Track 2: AI-Powered Financial Journeys — Humanizing the Ambiguous 60 Seconds of UPI Point-of-Sale Payments*
**Powered by Sarvam AI (`sarvam-105b`, `bulbul-v4-flash`, `saaras-v4`, `sarvam-m`)**

---

## 📌 1. Executive Summary & Problem Solved

### The Track 2 Theme
> **Track 2: AI-Powered Financial Journeys**  
> *"Make Insurance, Lending and Fintech simpler, faster, and more human."*

### Why the Previous Approach Failed
The original *SafeClear* architecture attempted to pose as an "Autonomous AI Teammate" (Track 3). Under scrutiny, its "AI" was simply hardcoded if-else state transitions, an exponential backoff timer, and an unintegrated chatbot. It solved none of the genuine human friction points at retail counters.

### The Real Problem Solved
UPI is technically resilient, but the **human experience collapses at the moment of ambiguity** (*"Paisa kat gaya par mila nahi"*):
- The customer receives a bank debit SMS and panics.
- The merchant's Soundbox remains completely silent.
- The counter enters a 60-second deadlock: queues stall, merchants demand a second payment, and panicked customers pay twice, causing accidental duplicate debits.
- Fintech apps display a lazy catch-all hedging lie:  
  > *"Payment Failed. If money was deducted from your account, it will be refunded within 3-5 business days."*

**Paytm SafeClear** fixes this exact moment of truth using **Sarvam AI** and a **Dynamic Status QR protocol** to turn silent panic into transparent, human guidance across both sides of the physical counter.

---

## 👥 2. The Dual-Sided Multi-Device Architecture

SafeClear treats payment failure not as an isolated app error, but as an **asymmetric communication breakdown between two humans across a physical counter**:

```
┌──────────────────────────────────────────────┐       ┌──────────────────────────────────────────────┐
│           LAPTOP: MERCHANT POS & SOUNDBOX    │       │             MOBILE: CUSTOMER PAYER           │
│            (Clarity & Actionable Safety)     │       │            (Transparency & Empathy)          │
├──────────────────────────────────────────────┤       ├──────────────────────────────────────────────┤
│ 🔊 Soundbox: Proactive, fraud-safe audio     │       │ 💡 Clear "Did Money Move?" Verdict           │
│    ("Rahul se ₹250 verify ho raha hai")      │       │    (Zero Paisa Kata vs Paisa Kata Hai)       │
│                                              │       │                                              │
│ 📱 Merchant POS: Identifier Note + Token     │       │ 🧠 Sarvam AI "Why It Failed" Explainer       │
│    ("Pending: Rahul S. | Token #4821")       │       │    (Plain language in Hindi/Hinglish/Tamil)  │
│                                              │       │                                              │
│ 📷 Scan Customer QR: 1-second proof without  │       │ 📲 Auto-Surfaced Dynamic Status QR           │
│    asking customer to hand over their phone  │       │    (Cryptographic HMAC-SHA256, 3-min expiry) │
│                                              │       │                                              │
│ ⚡ 1-Tap Quick Actions:                       │       │ 🔄 1-Tap Recovery Alternative                │
│    - "Ask for Cash"                          │       │    - Auto-switch to UPI Lite (< ₹500)        │
│    - "Issue 1-Tap Instant Refund" (Duplicate)│       │    - Switch to secondary linked bank         │
└──────────────────────────────────────────────┘       └──────────────────────────────────────────────┘
                               ▲                                       ▲
                               │                                       │
                               └───────── Bidirectional WebSocket ─────┘
                                           (ws://... or wss://...)
                                           Real-Time State Sync
```

---

## 🎬 3. Master Live Demo Scenarios & Step-by-Step Execution

SafeClear is built for **live, manual counter performance** (no fake timer animations):

### 🍞 Scenario A: The False Alarm (`Z9` Insufficient Balance $\rightarrow$ 1-Tap UPI Lite)
1. **On Mobile Phone**:
   - Tap **"A: False Alarm"** on the top picker $\rightarrow$ shows bill for **₹350** at Sharma Bakery.
   - Tap **"Pay ₹350 via HDFC Bank"**.
2. **What Happens Live**:
   - **Customer Mobile**: Bank returns `Z9`. Screen immediately flashes the **`✅ ZERO PAISA KATA`** green badge.
   - **Sarvam AI Explainer**: Explains: *"Account mein balance kam tha. Paisa bilkul nahi kata. UPI Lite ya doosra bank chunein."* (Dispels the 3-5 days blanket lie).
   - **Laptop Soundbox**: Vocalizes via Sarvam `bulbul-v4-flash`: *"Token 4821 asafal raha. Paisa nahi kata. Saman na dein."*
   - **Laptop POS**: Shows red alert card: `Token #4821 Declined — Saman na dein`.
3. **Recovery Action**:
   - **On Mobile**: Tap **"⚡ 1-Tap Pay ₹350 via UPI Lite"**.
4. **Resolution**:
   - Customer mobile shows green success checkmark.
   - Laptop POS flips to bright green **`SETTLED — Release Goods`**!
   - Laptop Soundbox chimes: *"Paytm par teen sau pachaas rupaye prapt hue"*.

---

### 🍬 Scenario B: Bank Network Timeout (`U68`) $\rightarrow$ Dynamic Status QR Scan
1. **On Mobile Phone**:
   - Switch to **"B: Timeout QR"** (₹250 at Sharma Sweets).
   - Tap **"Pay ₹250 via SBI Bank"**.
2. **What Happens Live**:
   - **Customer Mobile**: SBI latency spike enters `U68` $\rightarrow$ auto-flips to a full-screen **Dynamic Status QR** with **Token `#4821`** and **`PAISA KATA HAI — CLEARANCE IN PROGRESS`** orange badge.
   - **Laptop Soundbox**: Warns the merchant: *"Dhyan dein: Rahul se ₹250 ka payment verify ho raha hai. Token 4821. Saman na dein."*
   - **Laptop POS**: Shows Amber Sticky Card: `Pending: ₹250 from Rahul S. | Token #4821`.
3. **Merchant Action**:
   - **On Laptop**: Click **"Scan Customer QR"** on the POS terminal.
4. **Resolution**:
   - POS scanner verifies cryptographic ticket `#4821`.
   - Switch acknowledges credit $\rightarrow$ Laptop POS unlocks to **SETTLED** $\rightarrow$ Laptop Soundbox rings success $\rightarrow$ Customer mobile updates to green confirmed!

---

### 🛒 Scenario C: Panic Duplicate $\rightarrow$ 1-Tap Instant Auto-Refund
1. **On Mobile Phone**:
   - Switch to **"C: Duplicate"** (₹400 at Sharma Grocery).
   - Tap **"Pay ₹400 via ICICI Bank"** (simulating Payment #1).
   - Tap **"⚠️ Scan & Pay Again (Panic Re-scan)"** (simulating an anxious customer scanning a second time within 25 seconds).
2. **What Happens Live**:
   - **Sarvam-m Intent Guard**: Flags repeat payment with **98% duplicate intent confidence** (`Same VPA + Merchant ID + ₹400 in < 25s`).
   - **Laptop Soundbox**: Screams duplicate alarm: *"Chetawani: Duplicate payment detect hua."*
   - **Laptop POS**: High-priority purple card surfaces: *"Sneha R. paid ₹400 twice within 25s"*.
3. **Merchant Action**:
   - **On Laptop**: Tap **"⚡ Issue 1-Tap Instant Refund"**.
4. **Resolution**:
   - Laptop Soundbox confirms: *"Duplicate payment detected. ₹400 refund initiate kar diya gaya."*
   - Customer mobile instantly receives the push alert: **"₹400 Instant Refund Credited to your account via UPI"** with a sealed UDIR cryptographic docket.

---

## 🤖 4. The Sarvam AI Specification

| Component | Model | Role in SafeClear | Latency |
| :--- | :--- | :--- | :--- |
| **Failure Explainer** | `sarvam-105b` | Maps 40+ raw ISO/NPCI error codes (`ZM`, `Z9`, `U16`, `U68`, `RB`, `91`) into clear, vernacular explanations in Hindi, Hinglish, Tamil, Telugu, and English. | ~300ms |
| **Soundbox Voice** | `bulbul-v4-flash` | Sub-250ms text-to-speech tailored for Indian accents and clean rupee (`₹`) pronunciation. Never announces success on pending state. | <250ms |
| **Dispute Intake** | `saaras-v4` | Vernacular speech and text input parsing colloquial customer queries (*"Paisa kat gaya par dukandar bola nahi aaya"*). | <400ms |
| **Intent Guard Classifier** | `sarvam-m` | Edge/lightweight intent evaluation distinguishing legitimate rapid repeat purchases from panic duplicates. | <100ms |

---

## 🌐 5. Hosting & Deployment Architecture

FastAPI and the Vite React frontend are unified into a single service:
- **Port 8000** serves:
  - Both Web UI views (`/?view=merchant` and `/?view=client`)
  - All REST endpoints (`/api/...`)
  - The live WebSocket connection (`/ws`)
- **Zero CORS issues**: Frontend and backend run on the exact same origin.
- **Automatic Protocol Switching**: Uses `http://` and `ws://` locally; automatically upgrades to `https://` and `wss://` in production.

### Deployed URLs (Render)
- **Production URL**: `https://paytm-safeclear.onrender.com`
- **Laptop (Merchant)**: `https://paytm-safeclear.onrender.com/?view=merchant`
- **Mobile (Customer)**: `https://paytm-safeclear.onrender.com/?view=client`

### Local Development Running Commands
```bash
# Start backend daemon
cd backend && .venv/bin/uvicorn main:app --host 0.0.0.0 --port 8000

# Start frontend development server
cd frontend && npx vite --host 0.0.0.0 --port 5173
```

---

## 🐛 6. Debugging & Bug Fixes Log (Reference for Future Work)

1. **Bug: QR code expanded to fill the entire screen**
   - *Cause*: In `ClientView.jsx`, the QR code was rendered as 625 `<div>` cells inside Tailwind utility classes `w-44` and `h-44`. Because `index.css` is a static precompiled bundle that lacked those exact utility rules, the container had unconstrained dimensions (`width: auto`), blowing up across the screen.
   - *Fix*: Replaced the grid of divs with an `<svg width="144" height="144" viewBox="0 0 25 25">` constrained inside an explicit `style={{ width: "160px", height: "160px" }}` container. It now renders with fixed, rock-solid dimensions in any CSS environment.

2. **Bug: `TypeError: undefined is not an object (evaluating 'u.timeoutPct.toFixed')`**
   - *Cause*: The backend broadcasted bank telemetry with the key `timeout_rate`, but `BankHealth.jsx` called `h.timeoutPct.toFixed(1)`. When `timeoutPct` was undefined, React threw an uncaught error and unmounted the entire component tree, which severed the WebSocket connection.
   - *Fix*: Added defensive key resolution in `BankHealth.jsx`: `Number(h.timeoutPct ?? h.timeout_rate ?? 0.5)` with `isNaN` safety checks, and normalized `backend/main.py` to broadcast both `timeoutPct` and `timeout_rate`.

3. **Bug: Desktop browser incorrectly opened in Mobile Client Mode**
   - *Cause*: `window.innerWidth < 768` misclassified laptop split windows or responsive developer windows as mobile.
   - *Fix*: Desktop/laptop now **always defaults to Merchant Mode**. Mobile mode is only activated if explicitly selected via `?view=client` or on genuine mobile device user-agents. A pinned top bar allows manual switching at any time.
