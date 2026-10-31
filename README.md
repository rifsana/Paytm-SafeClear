# Paytm SafeClear 🚀⚡
> **Track 2: AI-Powered Financial Journeys — Humanizing the Ambiguous 60 Seconds of UPI Point-of-Sale Payments**  
> *Powered by Sarvam AI (`sarvam-105b`, `bulbul-v4-flash`, `saaras-v4`, `sarvam-m`)*

🎥 **Project Demo & Video Walkthrough:** [Google Drive Demo Folder](https://drive.google.com/drive/folders/136d_klIFqaICnI5YWgD-EdLA6VCN8Vjo?usp=sharing)

---

## 📌 Executive Summary

UPI handles over 14 billion transactions monthly with incredible resilience, yet **the human experience collapses at the moment of ambiguity** (*"Paisa kat gaya par mila nahi"*).
- The customer receives a bank debit SMS and panics.
- The merchant's Soundbox remains completely silent.
- The retail counter enters a 60-second deadlock: queues stall, merchants demand a second payment, and panicked customers pay twice, causing accidental duplicate debits.

Fintech apps currently use lazy catch-all hedging:  
> *"Payment Failed. If money was deducted from your account, it will be refunded within 3-5 business days."*

**Paytm SafeClear** fixes this moment of truth using sovereign Indian AI (**Sarvam AI**) and a **Dynamic Status QR Protocol** to turn silent panic into transparent, human guidance.

---

## 🌟 The 4 Core Pillars

### 1. 📲 Pillar 1: Dynamic Transaction Status QR ("Scan-to-Know")
- **Instant Trigger**: The millisecond a transaction enters `PENDING`, `PROCESSING`, or `TIMEOUT`, the customer's screen flips to a dynamic, cryptographically signed QR code.
- **Instant Counter Token**: A high-contrast **4-digit token** (e.g. `Token #4821`) matching between customer phone and merchant POS.
- **Merchant Verification**: The merchant taps **"Scan Customer QR"** on the POS for 1-second cryptographic verification without asking the customer to hand over their phone.

### 2. 🧠 Pillar 2: Sarvam AI Failure Explainer & Soundbox Vocalizer
- **Contextual Translation (`sarvam-105b`)**: Converts raw ISO/NPCI error codes (`ZM`, `Z9`, `U16`, `U68`, `RB`, `91`) into deterministic, plain-language vernacular instructions in Hindi, Hinglish, Tamil, and English.
- **Verdict Badges**:
  - `✅ ZERO PAISA KATA`: Clearly proves when money never left the account (ZM, Z9, U16).
  - `⏳ PAISA KATA HAI — CLEARANCE IN PROGRESS`: Shows safe clearance underway during bank network timeouts (U68).
- **Sub-250ms Soundbox Audio (`bulbul-v4-flash`)**:
  - Vocalizes fraud-safe counter announcements (*"Token 4821 verify ho raha hai. Saman na dein."*).
  - Eliminates walkaway fraud by **never** saying "payment received" until 100% settlement.

### 3. 🛡️ Pillar 3: Intent-Level Duplicate Guard & 1-Tap Auto-Refund
- **Real-Time Detection (`sarvam-m`)**: Evaluates `(Customer VPA + Merchant ID + Amount + Timestamp < 120s)`.
- **Proactive Warning**: Sounds duplicate warning before settling second payment.
- **1-Tap Instant Refund**: If duplicate occurs, surfaces a prominent 1-tap refund button on merchant POS with instant IMPS/UPI credit and sealed UDIR audit docket.

### 4. ⚡ Pillar 4: Intelligent Fallback (UPI Lite & Self-Healing)
- If primary bank account fails due to balance (`Z9`) or bank server latency, SafeClear surfaces a **1-tap checkout via on-device UPI Lite** (up to ₹500, zero core banking latency).

---

## 🎬 Master Demo Scenarios

> 📺 **Watch Demo Video / Access Drive:** [Google Drive Demo Folder](https://drive.google.com/drive/folders/136d_klIFqaICnI5YWgD-EdLA6VCN8Vjo?usp=sharing)

| Scenario | Trigger | What Current Apps Do | What SafeClear Does (Sarvam AI) |
| :--- | :--- | :--- | :--- |
| **Scenario A: The False Alarm** | ₹350 at bakery; bank returns `Z9` (Insufficient Balance) | Silent soundbox. Customer panics: *"Did my ₹350 get deducted?"* | Green Badge: **"Zero Paisa Kata"**. Sarvam explainer explains why. Surfaces **"1-Tap Pay ₹350 via UPI Lite"**. Payment completes in 2s. Soundbox rings! |
| **Scenario B: Bank Server Timeout** | ₹250 at sweet shop; SBI switch latency spike (`U68`) | Counter standoff. Merchant refuses sweets; customer shows debit SMS. | Phone flips to **Dynamic Status QR [Token #4821]**. Soundbox: *"Rahul se ₹250 verify ho raha hai. Token 4821. Saman na dein."* Merchant scans QR. Switch confirms. Turns Green! |
| **Scenario C: Duplicate Guard & Refund** | Customer panics during pending and pays ₹400 again within 45s | Merchant gets ₹400 twice; customer waits 5 days for manual chargeback. | Sarvam-m detects 98% confidence duplicate intent. Soundbox: *"Chetawani! Duplicate payment detect hua."* POS surfaces **"Issue 1-Tap Instant Refund"**. Instant money back! |

---

## 🚀 Running the Project

### Prerequisites
- Node.js (v18+)
- Python (3.10+)

### Quick Start (macOS / Linux)
```bash
./start.sh
```

### Quick Start (Windows)
```powershell
.\start.ps1
```

### Manual Setup
```bash
# Backend (FastAPI on Port 8000)
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000 --reload

# Frontend (Vite + React on Port 5173)
cd frontend
npm install
npm run dev
```

Visit **http://localhost:5173** to experience the interactive demo!
