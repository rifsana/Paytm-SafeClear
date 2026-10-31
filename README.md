# Paytm SafeClear

Resolving the ambiguous seconds after a UPI payment at the shop counter.

Track 2: AI-Powered Financial Journeys

Demo video and walkthrough: [Google Drive](https://drive.google.com/drive/folders/136d_klIFqaICnI5YWgD-EdLA6VCN8Vjo?usp=sharing)
Presentation: [`docs/Paytm SafeClear - submitted.pdf`](docs/Paytm%20SafeClear%20-%20submitted.pdf)

## The problem

UPI rarely loses money. The real failure happens at the counter, in the seconds after the customer taps Pay:

- The customer gets a debit SMS, but the merchant's soundbox stays silent.
- The merchant won't hand over goods, and the customer won't pay again. The queue stalls.
- Under pressure, customers often pay a second time and end up with a duplicate debit.
- Apps fall back to the same blanket message for every failure: "If money was deducted, it will be refunded in 3–5 business days."

## The solution

SafeClear gives the customer, the merchant and the soundbox the same accurate status at the same moment. For each outcome it then shows the next step.

| Scenario | Trigger | SafeClear response |
| :--- | :--- | :--- |
| A. False alarm | ₹350, bank returns `Z9` (insufficient balance) | Customer sees "Zero paisa kata" with the reason in their language. The POS shows "Declined, no money debited". The customer can retry with one tap via UPI Lite. |
| B. Bank timeout | ₹250, issuer switch times out (`U68`) | Customer phone shows a signed status QR with a counter token. The soundbox says "verify ho raha hai, saman na dein" (verifying, don't hand over goods). The merchant scans the QR, the switch confirms, and the payment settles. |
| C. Duplicate payment | Customer pays ₹400 again while payment 1 is still pending | The duplicate is detected. The soundbox warns the merchant. The POS offers a one-tap instant refund, and the customer sees the refund reference. |

## Features

- Customer phone and merchant counter stay in sync live over WebSocket
- Merchant, customer and split views; the merchant can connect a real phone by scanning a QR
- Plain-language failure reasons in Hinglish, Hindi and Tamil instead of a blanket refund message
- One-tap retry with UPI Lite after a pre-debit decline
- Status QR signed with HMAC-SHA256, with a counter token, for one-tap verification by the merchant
- Cash fallback with an automatic refund
- Duplicate-payment detection with a one-tap instant refund
- Soundbox voice alerts in Hindi, English, Tamil and Telugu; it never announces success while a payment is pending
- SafeClear Copilot: merchant chat assistant powered by Sarvam AI, aware of the live counter session
- UPI error decoder (`ZM`, `Z9`, `U16`, `U68`)
- Live ledger, bank health (latency and timeout rate per issuer) and simulated bank outages
- Full audit trail of payment events
- Customer help box for describing a problem in any language
- Responsive on phone, tablet and desktop

## How AI is used

| Component | Implementation |
| :--- | :--- |
| SafeClear Copilot | Sarvam AI chat completions (`sarvam-105b`), streamed, with the live session as context. Falls back to scripted replies if `SARVAM_API_KEY` is missing or the API fails. Each reply is labelled with its source. |
| Error explainer, dispute triage, duplicate-intent check | Deterministic rules, so the verdict on whether money moved is always predictable |
| Soundbox | Pre-recorded Hindi clips, with browser speech synthesis for other languages |

## Architecture

```
frontend/  React 18, Vite, Tailwind CSS
  src/App.jsx                 app shell, WebSocket sync, shared soundbox player
  src/components/views/       ClientView (customer phone), MerchantView (counter dashboard)
  src/components/safeclear/   POS terminal, soundbox, copilot, ledger, bank health, event log
  src/components/ui/          brand, phone frame
backend/   FastAPI, Uvicorn, httpx
  main.py                     session state machine, REST + WebSocket API, Sarvam integration
  test_safeclear.py           API tests
Dockerfile                    builds the frontend and serves it from the backend on one port
render.yaml                   Render deployment
```

The backend keeps one shared session in memory and broadcasts every state change to all connected clients. Both REST calls and WebSocket messages can trigger an action.

## Running locally

Prerequisites: Node.js 18+ and Python 3.10+.

```bash
./start.sh        # macOS / Linux
.\start.ps1       # Windows
```

Or manually:

```bash
# Backend on :8000
cd backend
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
export SARVAM_API_KEY=your_key   # optional; enables live copilot
uvicorn main:app --host 0.0.0.0 --port 8000 --reload

# Frontend on :5173
cd frontend
npm install
npm run dev
```

Open http://localhost:5173. Use `?view=merchant`, `?view=client` or `?view=split` to pick a view.

To play the customer on a real phone, open the app from your machine's LAN IP and use **Connect phone** in the merchant view.

## Configuration

| Variable | Default | Purpose |
| :--- | :--- | :--- |
| `SARVAM_API_KEY` | none | Enables the Sarvam-powered copilot |
| `SARVAM_CHAT_MODEL` | `sarvam-105b` | Sarvam chat model |
| `SARVAM_CHAT_URL` | `https://api.sarvam.ai/v1/chat/completions` | Chat completions endpoint |
| `PORT` | `8000` | Server port (Docker) |

## Deployment

```bash
docker build -t safeclear .
docker run -p 8000:8000 -e SARVAM_API_KEY=your_key safeclear
```

On Render, `render.yaml` deploys the Dockerfile; set `SARVAM_API_KEY` in the service environment. To verify:

- `GET /health` reports whether the key is configured.
- `GET /api/copilot/ping` makes a live test call to Sarvam and returns its status and latency.

## Tests

```bash
cd backend
pip install pytest
pytest -q test_safeclear.py
```

## API overview

| Method | Path | Description |
| :--- | :--- | :--- |
| `GET` | `/api/session` | Current session, ledger and issuer health |
| `POST` | `/api/session/scenario` | Switch scenario (`SCENARIO_A`, `SCENARIO_B`, `SCENARIO_C`) |
| `POST` | `/api/session/{pay, upi-lite, scan-qr, panic-rescan, instant-refund, reset}` | Payment flow actions |
| `POST` | `/api/copilot/chat` | Streamed copilot reply (`X-Copilot-Source: sarvam` or `fallback`) |
| `GET` | `/api/copilot/ping` | Live Sarvam connectivity check |
| `POST` | `/api/sarvam/explain` | Explain a UPI error code |
| `POST` | `/api/triage` | Categorise a customer complaint |
| `POST` | `/api/verify-status-qr` | Verify a signed status QR payload |
| `WS` | `/ws` | Live session updates |
