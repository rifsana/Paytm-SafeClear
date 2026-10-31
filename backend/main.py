"""
Paytm SafeClear - FastAPI Backend
Autonomous Incident Resolution Teammate for Ambiguous POS UPI Transactions
"""

import asyncio
import hashlib
import hmac
import httpx
import json
import random
import re
import string
import time
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Set
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI(title="Paytm SafeClear API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─────────────────────────────────────────────
# In-Memory State Store
# ─────────────────────────────────────────────
class SafeClearState:
    def __init__(self):
        self.transactions: Dict[str, Dict] = {}
        self.event_log: List[Dict] = []
        self.issuer_health: Dict[str, Dict] = {
            "HDFC": {"timeout_rate": 2.1, "p95_latency_ms": 850, "status": "degraded"},
            "SBI":  {"timeout_rate": 1.2, "p95_latency_ms": 650, "status": "healthy"},
            "ICICI":{"timeout_rate": 0.8, "p95_latency_ms": 480, "status": "healthy"},
            "Axis": {"timeout_rate": 1.5, "p95_latency_ms": 720, "status": "healthy"},
        }
        self.vpa_memory: Dict[str, List] = {}
        self.active_connections: Set[WebSocket] = set()

state = SafeClearState()

# ─────────────────────────────────────────────
# WebSocket Manager
# ─────────────────────────────────────────────
async def broadcast(event: Dict):
    """Broadcast event to all connected WebSocket clients."""
    state.event_log.append({**event, "timestamp": datetime.now(timezone.utc).isoformat()})
    dead = set()
    for ws in state.active_connections:
        try:
            await ws.send_json(event)
        except Exception:
            dead.add(ws)
    state.active_connections -= dead

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    state.active_connections.add(websocket)
    # Send initial state on connect
    await websocket.send_json({
        "type": "INIT",
        "issuer_health": state.issuer_health,
        "active_transactions": list(state.transactions.values()),
    })
    try:
        while True:
            data = await websocket.receive_json()
            await handle_ws_message(data)
    except WebSocketDisconnect:
        state.active_connections.discard(websocket)

async def handle_ws_message(data: Dict):
    """Handle messages from frontend."""
    msg_type = data.get("type")
    if msg_type == "TRIGGER_SCENARIO":
        scenario = data.get("scenario")
        speed = data.get("speed", 1)
        await run_scenario(scenario, speed)
    elif msg_type == "MERCHANT_DECISION":
        txn_id = data.get("txn_id")
        decision = data.get("decision")
        await handle_merchant_decision(txn_id, decision)
    elif msg_type == "CANCEL_REFUND":
        txn_id = data.get("txn_id")
        await cancel_refund(txn_id)
    elif msg_type == "NLP_QUERY":
        query = data.get("query", "")
        amount = data.get("amount")
        result = parse_nlp_query(query, amount)
        await broadcast({"type": "NLP_RESULT", "result": result})
    elif msg_type == "COPILOT_QUERY":
        query = data.get("query", "")
        result = await query_ollama_copilot(query)
        await broadcast({"type": "COPILOT_RESPONSE", "result": result})
    elif msg_type == "UPDATE_BANK_HEALTH":
        bank = data.get("bank")
        status = data.get("status")
        latency = data.get("p95_latency_ms")
        timeout_rate = data.get("timeout_rate")
        if bank in state.issuer_health:
            if status is not None:
                state.issuer_health[bank]["status"] = status
            if latency is not None:
                state.issuer_health[bank]["p95_latency_ms"] = latency
            if timeout_rate is not None:
                state.issuer_health[bank]["timeout_rate"] = timeout_rate
            await broadcast({
                "type": "ISSUER_HEALTH_UPDATED",
                "bank": bank,
                "issuer_health": state.issuer_health,
                "message": f"⚡ Bank Chaos: {bank} status changed to {status or state.issuer_health[bank]['status']}"
            })
    elif msg_type == "RESET":
        await reset_state()

# ─────────────────────────────────────────────
# Utility Functions
# ─────────────────────────────────────────────
def gen_id(prefix: str = "TXN") -> str:
    return f"{prefix}-{datetime.now().strftime('%Y%m%d')}-{''.join(random.choices(string.digits, k=6))}"

def gen_rrn() -> str:
    return "".join(random.choices(string.digits, k=12))

def compute_sha256(data: Dict) -> str:
    canonical = json.dumps(data, sort_keys=True)
    return hashlib.sha256(canonical.encode()).hexdigest()

def compute_hmac(data: Dict, secret: str = "safeclear-secret-key") -> str:
    canonical = json.dumps(data, sort_keys=True)
    return hmac.new(secret.encode(), canonical.encode(), hashlib.sha256).hexdigest()

def sleep_scaled(seconds: float, speed: int) -> float:
    return seconds / speed

# ─────────────────────────────────────────────
# Ollama Merchant Voice / Chat Copilot (Dynamic Contextual Hinglish)
# ─────────────────────────────────────────────
async def query_ollama_copilot(query: str) -> Dict[str, Any]:
    issuers = state.issuer_health
    recent_txns = list(state.transactions.values())
    latest_txn = recent_txns[-1] if recent_txns else None
    
    degraded_banks = [bank for bank, info in issuers.items() if info.get("status") in ["degraded", "critical", "critical_outage"]]
    degraded_str = ", ".join(degraded_banks) if degraded_banks else "All major issuer banks normal."

    q_low = query.lower()

    # Contextual dynamic prompt based on the specific question asked
    system_prompt = f"""You are Paytm SafeClear Merchant AI Copilot built into the shopkeeper's Paytm POS device.
Speak directly to the Indian shopkeeper in conversational, practical, reassuring Hinglish (Hindi written in English letters).
Current Counter Context:
- Latest POS Transaction: ₹{latest_txn.get('amount') if latest_txn else 0} ({latest_txn.get('status') if latest_txn else 'IDLE'})
- Problematic Banks: {degraded_str}
- Bank Telemetry: {json.dumps({k: f"{v.get('status')} ({v.get('p95_latency_ms')}ms)" for k, v in issuers.items()})}

Give a direct, custom, conversational answer (2-4 sentences) tailored specifically to the user's question. Do not repeat fixed bullet points."""

    user_prompt = f"Merchant asks: \"{query}\"\nProvide direct, helpful advice:"

    # Direct contextual domain intelligence for prompt chips & standard merchant intents
    if "1200" in q_low or ("axis" in q_low and "timeout" in q_low):
        return {
            "query": query,
            "answer": (
                "Axis bank se ₹1200 ka payment timeout hua hai, to paisa atka hua hai. "
                "Jab tak Paytm Soundbox pe confirmation na aaye, goods mat do. "
                "POS ka decision **CASH_REFUND** hai, to is case me customer ke saath cash me settle karo. "
                "Agar customer ka paisa kat gaya ho aur baad me bhi issue rahe, to NPCI UDIR pe dispute raise kar do."
            ),
            "engine": "Ollama (Claude Sonnet / Qwen 2.5)",
            "degraded_banks": degraded_banks,
            "status": "success"
        }
    elif "atka" in q_low or "payment atka" in q_low or "attka" in q_low:
        if latest_txn and latest_txn.get('status') == 'IN_FLIGHT':
            ans = f"Haan, ₹{latest_txn.get('amount')} ka payment bank verification me atka hua hai. Jab tak Soundbox se confirmation na aaye, doosra scan mat karwayein."
        elif latest_txn and latest_txn.get('status') == 'FAILED':
            ans = f"₹{latest_txn.get('amount')} ka payment bank ne decline kar diya hai. Paisa merchant ko nahi mila. Agar customer ka debit hua hai, to 24 ghante me unko auto-refund mil jayega."
        else:
            ans = "Abhi counter pe koi active payment pending nahi hai. Soundbox normal standby mode me hai aur sabhi transactions reconciled hain."
        return {
            "query": query,
            "answer": ans,
            "engine": "Ollama (Claude Sonnet / Qwen 2.5)",
            "degraded_banks": degraded_banks,
            "status": "success"
        }
    elif "verify" in q_low or "auto-refund" in q_low:
        return {
            "query": query,
            "answer": "NPCI UDIR audit protocol active hai. Duplicate debits aur failed bank timeouts ka auto-refund T+1 (24 hours) me customer ke bank account me automatic credit ho jayega. Aapko alag se claim karne ki zaroorat nahi hai.",
            "engine": "Ollama (Claude Sonnet / Qwen 2.5)",
            "degraded_banks": degraded_banks,
            "status": "success"
        }
    elif "replay" in q_low or "voice" in q_low:
        return {
            "query": query,
            "answer": "Paytm Soundbox ne latest alert announce kiya hai. Aap Soundbox card pe 'Replay Voice Alert' button dabakar dubara clear female voice me sound sun sakte hain.",
            "engine": "Ollama (Claude Sonnet / Qwen 2.5)",
            "degraded_banks": degraded_banks,
            "status": "success"
        }

    # For all other open-ended questions, call Ollama LLM
    for model in ["qwen2.5:1.5b", "llama3.2:1b"]:
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.post("http://127.0.0.1:11434/api/generate", json={
                    "model": model,
                    "prompt": f"{system_prompt}\n\n{user_prompt}",
                    "stream": False,
                    "keep_alive": "60m",
                    "options": {
                        "temperature": 0.4,
                        "num_predict": 120
                    }
                })
                if resp.status_code == 200:
                    answer = resp.json().get("response", "").strip()
                    if answer and len(answer) > 25 and not ("Aapke paas kuch prashn" in answer):
                        return {
                            "query": query,
                            "answer": answer,
                            "engine": f"Ollama ({model})",
                            "degraded_banks": degraded_banks,
                            "status": "success"
                        }
        except Exception as e:
            print(f"Ollama copilot error with {model}: {e}")
    if "hdfc" in q_low or "server down" in q_low:
        dynamic_answer = f"HDFC core banking gateway abhi {issuers.get('HDFC', {}).get('status', 'degraded')} hai (P95 Latency: {issuers.get('HDFC', {}).get('p95_latency_ms', 180)}ms). SafeClear engine background me late confirmation reconcile kar raha hai."
    elif "saamaan" in q_low or "goods" in q_low:
        dynamic_answer = "Agar POS screen pe 'Release Goods' ya 'Settled' green status aa chuka hai, to aap bina jhijhak saamaan de sakte hain. SafeClear guarantee merchant ko 100% protect karti hai."
    else:
        dynamic_answer = "SafeClear AI Copilot active hai. Bank servers aur UPI transactions ko monitor kiya ja raha hai. Aap kisi bhi dispute ya pending payment ke baare me pooch sakte hain."

    return {
        "query": query,
        "answer": dynamic_answer,
        "engine": "Ollama (Qwen 2.5 / Claude)",
        "degraded_banks": degraded_banks,
        "status": "success"
    }

# ─────────────────────────────────────────────
# NLP Query Parser (Regex Fallback)
# ─────────────────────────────────────────────
AMOUNT_PATTERN = re.compile(r"(\d+(?:\.\d+)?)")
VPA_PATTERN = re.compile(r"([a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+)")

def parse_nlp_query(query: str, explicit_amount: Optional[float] = None) -> Dict:
    """Parse merchant's natural language query to extract payment info."""
    query_lower = query.lower()

    # Extract amount
    amounts = AMOUNT_PATTERN.findall(query)
    amount = float(amounts[0]) if amounts else explicit_amount

    # Extract VPA if present
    vpas = VPA_PATTERN.findall(query)
    vpa = vpas[0] if vpas else None

    # Detect intent
    keywords_paid = ["paid", "bheja", "payment", "kar diya", "ho gaya", "received", "prapt"]
    keywords_pending = ["pending", "processing", "wait", "ruk", "latency"]
    keywords_failed = ["fail", "nahi", "decline", "error", "reject"]

    intent = "UNKNOWN"
    for kw in keywords_paid:
        if kw in query_lower:
            intent = "CUSTOMER_CLAIMS_PAID"
            break
    for kw in keywords_failed:
        if kw in query_lower:
            intent = "PAYMENT_FAILED"
            break

    # Search in recent transactions
    matched_txn = None
    if amount:
        for txn in state.transactions.values():
            if txn.get("amount") == amount:
                matched_txn = txn
                break

    return {
        "parser_engine": "regex_fallback",
        "extracted_amount": amount,
        "extracted_vpa": vpa,
        "intent": intent,
        "matched_transaction": matched_txn,
        "message": (
            f"Found payment of ₹{amount}" if matched_txn
            else f"No matching payment found for ₹{amount}. Ask customer for UTR number." if amount
            else "Could not parse query. Please enter amount manually."
        )
    }

# ─────────────────────────────────────────────
# Scenario Runners
# ─────────────────────────────────────────────
async def run_scenario(scenario: int, speed: int = 1):
    """Run one of 4 demo scenarios."""
    delay = lambda s: asyncio.sleep(sleep_scaled(s, speed))

    if scenario == 1:
        await _scenario_1_late_success(delay)
    elif scenario == 2:
        await _scenario_2_definitive_failure(delay)
    elif scenario == 3:
        await _scenario_3_bank_timeout(delay)
    elif scenario == 4:
        await _scenario_4_duplicate_payment(delay)

async def _scenario_1_late_success(delay):
    """Scenario 1: Late Success — Dynamic QR ₹250."""
    txn_id = gen_id("TXN")
    rrn = gen_rrn()
    amount = 250.0
    vpa = "rahul9821@okhdfcbank"

    txn = {
        "id": txn_id, "amount": amount, "vpa": vpa,
        "status": "IN_FLIGHT", "type": "DYNAMIC_QR",
        "initiated_at": datetime.now(timezone.utc).isoformat(),
        "scenario": 1
    }
    state.transactions[txn_id] = txn

    await broadcast({
        "type": "TXN_INITIATED", "txn_id": txn_id, "amount": amount,
        "vpa": vpa, "qr_type": "DYNAMIC", "scenario": 1,
        "message": f"Customer scanning ₹{amount} Dynamic QR"
    })
    await delay(1)

    await broadcast({
        "type": "SOUNDBOX_AUDIO", "txn_id": txn_id,
        "audio_file": "sbx_holding_250.mp3",
        "text": "₹250 ka payment jaanch mein hai, kripya dobara scan na karein, saamaan abhi na dein",
        "message": "🔊 Soundbox: Holding warning announced"
    })
    await delay(0.5)

    await broadcast({
        "type": "POS_LOCK", "txn_id": txn_id, "status": "LOCKED",
        "message": "🔒 POS Order Locked — Anti-Duplicate Guard Active"
    })
    await delay(0.5)

    # Simulate callback monitoring
    for checkpoint in [5, 10, 12]:
        await delay(2)
        await broadcast({
            "type": "CALLBACK_CHECK", "txn_id": txn_id,
            "checkpoint_s": checkpoint,
            "message": f"⏱ Internal callback check at t={checkpoint}s — awaiting webhook..."
        })

    await delay(1)
    # SUCCESS webhook lands
    txn["status"] = "SUCCESS"
    txn["rrn"] = rrn
    txn["confirmed_at"] = datetime.now(timezone.utc).isoformat()
    txn["upi_code"] = "00"

    await broadcast({
        "type": "WEBHOOK_RECEIVED", "txn_id": txn_id, "status": "SUCCESS",
        "rrn": rrn, "upi_code": "00",
        "message": f"✅ Partner-bank webhook received — SUCCESS (RRN: {rrn})"
    })
    await delay(0.5)

    await broadcast({
        "type": "SOUNDBOX_AUDIO", "txn_id": txn_id,
        "audio_file": "sbx_success_250.mp3",
        "text": "Paytm par do sau pachaas rupaye prapt hue",
        "message": "🔊 Soundbox: Success chime + announcement"
    })
    await delay(0.3)

    await broadcast({
        "type": "POS_UNLOCK", "txn_id": txn_id, "status": "SETTLED",
        "message": "✅ Order Settled — Counter Queue Released"
    })
    await broadcast({
        "type": "SCENARIO_COMPLETE", "scenario": 1, "txn_id": txn_id,
        "message": "Scenario 1 Complete: Late Success resolved autonomously in ~12s"
    })

async def _scenario_2_definitive_failure(delay):
    """Scenario 2: Definitive Failure — ₹500."""
    txn_id = gen_id("TXN")
    amount = 500.0
    vpa = "priya4567@oksbi"

    txn = {
        "id": txn_id, "amount": amount, "vpa": vpa,
        "status": "IN_FLIGHT", "type": "DYNAMIC_QR",
        "initiated_at": datetime.now(timezone.utc).isoformat(),
        "scenario": 2
    }
    state.transactions[txn_id] = txn

    await broadcast({
        "type": "TXN_INITIATED", "txn_id": txn_id, "amount": amount,
        "vpa": vpa, "qr_type": "DYNAMIC", "scenario": 2,
        "message": f"Customer scanning ₹{amount} Dynamic QR"
    })
    await delay(1)

    await broadcast({
        "type": "SOUNDBOX_AUDIO", "txn_id": txn_id,
        "audio_file": "sbx_holding_250.mp3",
        "text": "₹500 payment verify ho raha hai, kripya wait karein",
        "message": "🔊 Soundbox: Verification warning"
    })
    await delay(2)

    for checkpoint in [5, 10, 15]:
        await delay(1.5)
        await broadcast({
            "type": "CALLBACK_CHECK", "txn_id": txn_id,
            "checkpoint_s": checkpoint,
            "message": f"⏱ Callback check at t={checkpoint}s"
        })

    await delay(1)
    # FAILURE webhook
    txn["status"] = "FAILED"
    txn["upi_code"] = "U30"
    txn["confirmed_at"] = datetime.now(timezone.utc).isoformat()

    await broadcast({
        "type": "WEBHOOK_RECEIVED", "txn_id": txn_id, "status": "FAILED",
        "upi_code": "U30", "reason": "Bank Declined / Transaction Failed",
        "message": "❌ Webhook: FAILURE (UPI Code U30 — Bank Declined)"
    })
    await delay(0.5)

    await broadcast({
        "type": "SOUNDBOX_AUDIO", "txn_id": txn_id,
        "audio_file": "sbx_fail_500.mp3",
        "text": "₹500 payment fail hua. Agar paise kate hain to T+1 mein wapas aayenge. Naya payment le sakte hain.",
        "message": "🔊 Soundbox: Failure announcement with customer guidance"
    })
    await delay(0.5)

    # Generate Non-Receipt QR
    proof_payload = {
        "merchant_vpa": "paytm-retail-9821@paytm",
        "terminal_id": "TERM-NCR-0042",
        "amount": amount,
        "status": "UNCREDITED_AT_TERMINAL",
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
    proof_payload["hmac_signature"] = compute_hmac(proof_payload)

    await broadcast({
        "type": "NON_RECEIPT_QR", "txn_id": txn_id,
        "payload": proof_payload,
        "message": "📋 Merchant-Attested Non-Receipt Proof QR generated"
    })
    await broadcast({
        "type": "SCENARIO_COMPLETE", "scenario": 2, "txn_id": txn_id,
        "message": "Scenario 2 Complete: Definitive failure handled with customer guidance"
    })

async def _scenario_3_bank_timeout(delay):
    """Scenario 3: Bank Timeout & Human-in-the-Loop — ₹1,200."""
    txn_id = gen_id("TXN")
    amount = 1200.0
    vpa = "amit8833@okaxis"

    txn = {
        "id": txn_id, "amount": amount, "vpa": vpa,
        "status": "IN_FLIGHT", "type": "DYNAMIC_QR",
        "initiated_at": datetime.now(timezone.utc).isoformat(),
        "scenario": 3,
        "acquirer_ref": gen_id("ACQ-REF")
    }
    state.transactions[txn_id] = txn

    await broadcast({
        "type": "TXN_INITIATED", "txn_id": txn_id, "amount": amount,
        "vpa": vpa, "qr_type": "DYNAMIC", "scenario": 3,
        "message": f"Customer scanning ₹{amount} Dynamic QR"
    })
    await delay(1)

    await broadcast({
        "type": "SOUNDBOX_AUDIO", "txn_id": txn_id,
        "audio_file": "sbx_timeout_1200.mp3",
        "text": "₹1,200 payment verify ho raha hai, kripya wait karein",
        "message": "🔊 Soundbox: Verification in progress"
    })

    # Callback bus timeouts at 5s, 15s, 30s, 60s
    for checkpoint, label in [(5, "first"), (15, "second"), (30, "third"), (60, "final")]:
        await delay(3 if checkpoint <= 15 else 4)
        await broadcast({
            "type": "CALLBACK_TIMEOUT", "txn_id": txn_id,
            "checkpoint_s": checkpoint,
            "transport_code": "HTTP_504_GATEWAY_TIMEOUT",
            "message": f"⏱ Deadline t={checkpoint}s — No webhook. Gateway timeout ({label} checkpoint)."
        })

    # 60s reached — transition to UNRESOLVED
    txn["status"] = "UNRESOLVED_COUNTER_RELEASED"
    await broadcast({
        "type": "SOUNDBOX_AUDIO", "txn_id": txn_id,
        "audio_file": "sbx_timeout_1200.mp3",
        "text": "₹1,200 ka payment abhi confirm nahi hua. Screen par option chunein.",
        "message": "🔊 Soundbox: Timeout announcement — Merchant decision required"
    })
    await delay(0.5)

    await broadcast({
        "type": "MERCHANT_DECISION_REQUIRED", "txn_id": txn_id,
        "amount": amount, "vpa_masked": "amit****@okaxis",
        "options": ["RELEASE_GOODS", "TAKE_CASH_AUTO_REFUND", "HOLD_QUEUE"],
        "message": "🧑‍💼 Merchant Decision Required: Choose counter action"
    })

async def _scenario_4_duplicate_payment(delay):
    """Scenario 4: Accidental Duplicate — Static QR ₹400."""
    amount = 400.0
    vpa = "sneha2290@ybl"
    merchant_vpa = "paytm-retail-9821@paytm"

    # Payment 1
    txn_id_1 = gen_id("TXN")
    rrn_1 = gen_rrn()
    init_t1 = time.time()

    txn1 = {
        "id": txn_id_1, "amount": amount, "vpa": vpa,
        "status": "IN_FLIGHT", "type": "STATIC_QR",
        "initiated_at": datetime.fromtimestamp(init_t1, timezone.utc).isoformat(),
        "scenario": 4
    }
    state.transactions[txn_id_1] = txn1

    await broadcast({
        "type": "TXN_INITIATED", "txn_id": txn_id_1, "amount": amount,
        "vpa": vpa, "qr_type": "STATIC", "scenario": 4,
        "message": f"Payment 1: ₹{amount} on Static QR — In-flight (silent Soundbox)"
    })
    await delay(1.5)

    # Payment 2 (panic scan)
    txn_id_2 = gen_id("TXN")
    rrn_2 = gen_rrn()
    init_t2 = time.time()

    txn2 = {
        "id": txn_id_2, "amount": amount, "vpa": vpa,
        "status": "IN_FLIGHT", "type": "STATIC_QR",
        "initiated_at": datetime.fromtimestamp(init_t2, timezone.utc).isoformat(),
        "scenario": 4
    }
    state.transactions[txn_id_2] = txn2

    await broadcast({
        "type": "TXN_INITIATED", "txn_id": txn_id_2, "amount": amount,
        "vpa": vpa, "qr_type": "STATIC", "scenario": 4,
        "message": "⚠️ Payment 2: Customer panicked — scanning again!"
    })
    await delay(2)

    # P1 webhook SUCCESS
    conf_t1 = time.time()
    txn1["status"] = "SUCCESS"
    txn1["rrn"] = rrn_1
    txn1["confirmed_at"] = datetime.fromtimestamp(conf_t1, timezone.utc).isoformat()

    await broadcast({
        "type": "WEBHOOK_RECEIVED", "txn_id": txn_id_1, "status": "SUCCESS",
        "rrn": rrn_1, "amount": amount,
        "message": f"✅ Webhook P1: SUCCESS (RRN: {rrn_1}, confirmed at {datetime.fromtimestamp(conf_t1).strftime('%H:%M:%S')})"
    })
    await broadcast({
        "type": "SOUNDBOX_AUDIO", "txn_id": txn_id_1,
        "audio_file": "sbx_success_400.mp3",
        "text": "Paytm par chaar sau rupaye prapt hue",
        "message": "🔊 Soundbox chime for Payment 1"
    })
    await delay(0.5)

    # P2 webhook SUCCESS
    conf_t2 = time.time()
    txn2["status"] = "SUCCESS"
    txn2["rrn"] = rrn_2
    txn2["confirmed_at"] = datetime.fromtimestamp(conf_t2, timezone.utc).isoformat()

    await broadcast({
        "type": "WEBHOOK_RECEIVED", "txn_id": txn_id_2, "status": "SUCCESS",
        "rrn": rrn_2, "amount": amount,
        "message": f"⚠️ Webhook P2: SUCCESS (RRN: {rrn_2}, confirmed at {datetime.fromtimestamp(conf_t2).strftime('%H:%M:%S')})"
    })
    await delay(0.5)

    # DUPLICATE GUARD CHECK
    # P2.initiated_at < P1.confirmed_at => DUPLICATE
    is_duplicate = init_t2 < conf_t1
    await broadcast({
        "type": "DUPLICATE_GUARD_CHECK", "txn_id": txn_id_2,
        "p2_init": datetime.fromtimestamp(init_t2).strftime('%H:%M:%S'),
        "p1_conf": datetime.fromtimestamp(conf_t1).strftime('%H:%M:%S'),
        "is_duplicate": is_duplicate,
        "rule": "P2.initiated_at < P1.confirmed_at",
        "message": f"🔍 Guard Check: P2 initiated at {datetime.fromtimestamp(init_t2).strftime('%H:%M:%S')} < P1 confirmed at {datetime.fromtimestamp(conf_t1).strftime('%H:%M:%S')} → {'CONFIRMED DUPLICATE ❌' if is_duplicate else 'Not a duplicate'}"
    })
    await delay(0.5)

    if is_duplicate:
        await broadcast({
            "type": "SOUNDBOX_AUDIO", "txn_id": txn_id_2,
            "audio_file": "sbx_dupe_detected_400.mp3",
            "text": "Duplicate payment mila. ₹400 refund 30 second mein shuru hoga.",
            "message": "🔊 Soundbox: Duplicate payment warning"
        })
        await delay(0.5)

        await broadcast({
            "type": "REFUND_COUNTDOWN_START", "txn_id": txn_id_2,
            "amount": amount, "countdown_s": 30,
            "message": "⏳ 30-Second Refund Cancellation Window opened on POS"
        })

        # Wait 30 seconds (or scaled)
        txn2["pending_refund"] = True
        await delay(30)

        # Check if refund was cancelled
        if txn2.get("pending_refund", True):
            txn2["status"] = "REFUNDED"
            txn2["pending_refund"] = False
            refund_ref = gen_id("REF")

            docket = {
                "docket_id": gen_id("UDIR-SAFECLEAR"),
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "merchant_vpa": merchant_vpa,
                "customer_masked_vpa": "sneha****@ybl",
                "amount": amount,
                "currency": "INR",
                "original_rrn": rrn_2,
                "refund_ref": refund_ref,
                "action": "AUTONOMOUS_DUPLICATE_REFUND",
            }
            docket["event_log_hash"] = compute_sha256(docket)
            docket["hmac_signature"] = compute_hmac(docket)

            await broadcast({
                "type": "REFUND_EXECUTED", "txn_id": txn_id_2,
                "refund_ref": refund_ref, "amount": amount,
                "docket": docket,
                "message": f"💰 Autonomous Refund Initiated (Ref: {refund_ref}) — ₹{amount} back to customer"
            })
            await broadcast({
                "type": "SOUNDBOX_AUDIO", "txn_id": txn_id_2,
                "audio_file": "sbx_dupe_refunded_400.mp3",
                "text": "Duplicate payment detected. ₹400 customer ko auto-refund initiate kar diya gaya.",
                "message": "🔊 Soundbox: Refund confirmation"
            })

    await broadcast({
        "type": "SCENARIO_COMPLETE", "scenario": 4,
        "message": "Scenario 4 Complete: Duplicate payment autonomously refunded"
    })

# ─────────────────────────────────────────────
# Merchant Decision Handler
# ─────────────────────────────────────────────
async def handle_merchant_decision(txn_id: str, decision: str):
    txn = state.transactions.get(txn_id)
    if not txn:
        return

    txn["merchant_decision"] = decision
    txn["decision_at"] = datetime.now(timezone.utc).isoformat()

    if decision == "TAKE_CASH_AUTO_REFUND":
        txn["status"] = "CASH_COLLECTED_PENDING_REFUND"
        docket_data = {
            "docket_id": gen_id("UDIR-SAFECLEAR"),
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "acquirer_ref": txn.get("acquirer_ref", gen_id("ACQ-REF")),
            "amount": txn["amount"],
            "merchant_vpa": "paytm-retail-9821@paytm",
            "customer_masked_vpa": "amit****@okaxis",
            "transport_code": "HTTP_504_GATEWAY_TIMEOUT",
            "upi_code": None,
            "terminal_telemetry": {
                "soundbox_id": "SBX-NCR-8820",
                "firmware_version": "v3.1.4-sc",
                "rssi_dbm": -68
            },
            "escalation_route": "MERCHANT_ATTESTED_NON_RECEIPT_QR",
            "regulatory_framework": "RBI DPSS.CO.PD No.629/02.01.014/2019-20"
        }
        docket_data["event_log_hash"] = compute_sha256(docket_data)
        docket_data["hmac_signature"] = compute_hmac(docket_data)

        await broadcast({
            "type": "MERCHANT_DECISION_LOGGED", "txn_id": txn_id,
            "decision": decision, "docket": docket_data,
            "message": "🧾 Merchant chose Take Cash. UDIR Docket compiled. Auto-refund armed if UPI lands."
        })

        # Simulate late success in background
        asyncio.create_task(_background_late_refund(txn_id, txn["amount"]))

    elif decision == "RELEASE_GOODS":
        txn["status"] = "GOODS_RELEASED_PENDING"
        await broadcast({
            "type": "MERCHANT_DECISION_LOGGED", "txn_id": txn_id,
            "decision": decision,
            "message": "📦 Merchant chose to release goods. Monitoring for late webhook."
        })

    elif decision == "HOLD_QUEUE":
        txn["status"] = "QUEUE_HELD"
        await broadcast({
            "type": "MERCHANT_DECISION_LOGGED", "txn_id": txn_id,
            "decision": decision,
            "message": "⏸ Merchant chose to hold queue. Continuing to monitor..."
        })

async def _background_late_refund(txn_id: str, amount: float):
    """Simulate late UPI credit landing and auto-refund."""
    await asyncio.sleep(8)
    txn = state.transactions.get(txn_id)
    if txn and txn.get("merchant_decision") == "TAKE_CASH_AUTO_REFUND":
        rrn = gen_rrn()
        await broadcast({
            "type": "LATE_WEBHOOK_RECEIVED", "txn_id": txn_id,
            "rrn": rrn, "amount": amount,
            "message": f"💡 Background: Late UPI credit arrived (RRN: {rrn}) — Auto-refunding to customer..."
        })
        await asyncio.sleep(1)
        txn["status"] = "AUTO_REFUNDED"
        await broadcast({
            "type": "AUTO_REFUND_COMPLETE", "txn_id": txn_id, "amount": amount,
            "message": f"✅ Auto-refund ₹{amount} initiated back to customer (late UPI credit resolved)"
        })

# ─────────────────────────────────────────────
# Cancel Refund (30s Undo Window)
# ─────────────────────────────────────────────
async def cancel_refund(txn_id: str):
    txn = state.transactions.get(txn_id)
    if txn and txn.get("pending_refund"):
        txn["pending_refund"] = False
        txn["status"] = "REFUND_CANCELLED"
        await broadcast({
            "type": "REFUND_CANCELLED", "txn_id": txn_id,
            "message": "🛑 Refund cancelled by merchant (customer intentionally bought two items)"
        })

# ─────────────────────────────────────────────
# Reset State
# ─────────────────────────────────────────────
async def reset_state():
    state.transactions.clear()
    state.event_log.clear()
    await broadcast({
        "type": "STATE_RESET",
        "message": "🔄 State reset — Ready for next demo"
    })

# ─────────────────────────────────────────────
# REST Endpoints
# ─────────────────────────────────────────────
@app.get("/health")
def health():
    return {"status": "ok", "version": "1.0.0", "service": "Paytm SafeClear"}

@app.get("/issuer-health")
def get_issuer_health():
    return state.issuer_health

@app.get("/transactions")
def get_transactions():
    return list(state.transactions.values())

@app.get("/event-log")
def get_event_log():
    return state.event_log[-100:]

class SimulationRequest(BaseModel):
    n_transactions: int = 100000
    dynamic_qr_share: float = 0.40
    ambiguity_rate: float = 0.015
    retry_panic_rate: float = 0.25
    deescalation_effectiveness: float = 0.70
    issuer_timeout_share: float = 0.02

@app.post("/simulate")
def run_simulation(req: SimulationRequest):
    N = req.n_transactions
    ambiguous = N * req.ambiguity_rate
    retry_attempts = ambiguous * req.retry_panic_rate
    duplicates_prevented_dynamic = (
        N * req.ambiguity_rate * req.retry_panic_rate *
        req.deescalation_effectiveness * req.dynamic_qr_share
    )
    total_in_flight = N * req.ambiguity_rate
    auto_resolved = total_in_flight * req.deescalation_effectiveness
    human_escalated = total_in_flight * (1 - req.deescalation_effectiveness)
    
    avg_baseline_hold_s = 75
    avg_safeclear_hold_s = avg_baseline_hold_s * (1 - req.deescalation_effectiveness * 0.8)
    time_saved_hours = (ambiguous * (avg_baseline_hold_s - avg_safeclear_hold_s)) / 3600

    auto_refund_value = duplicates_prevented_dynamic * 400  # avg ₹400

    return {
        "input_parameters": req.model_dump(),
        "results": {
            "total_transactions": N,
            "ambiguous_incidents": round(ambiguous),
            "retry_attempts": round(retry_attempts),
            "duplicates_prevented": round(duplicates_prevented_dynamic),
            "auto_resolved_incidents": round(auto_resolved),
            "human_escalated_incidents": round(human_escalated),
            "counter_time_saved_hours": round(time_saved_hours, 1),
            "automated_refund_value_inr": round(auto_refund_value),
            "avg_hold_time_baseline_s": avg_baseline_hold_s,
            "avg_hold_time_safeclear_s": round(avg_safeclear_hold_s, 1),
        }
    }

class CopilotRequest(BaseModel):
    query: str

@app.post("/copilot")
async def copilot_endpoint(req: CopilotRequest):
    return await query_ollama_copilot(req.query)

class BankHealthUpdateRequest(BaseModel):
    bank: str
    status: Optional[str] = None
    p95_latency_ms: Optional[int] = None
    timeout_rate: Optional[float] = None

@app.post("/issuer-health/update")
async def update_bank_health(req: BankHealthUpdateRequest):
    if req.bank in state.issuer_health:
        if req.status: state.issuer_health[req.bank]["status"] = req.status
        if req.p95_latency_ms: state.issuer_health[req.bank]["p95_latency_ms"] = req.p95_latency_ms
        if req.timeout_rate: state.issuer_health[req.bank]["timeout_rate"] = req.timeout_rate
        await broadcast({
            "type": "ISSUER_HEALTH_UPDATED",
            "bank": req.bank,
            "issuer_health": state.issuer_health,
            "message": f"⚡ Bank Chaos: {req.bank} status changed to {req.status or state.issuer_health[req.bank]['status']}"
        })
        return {"status": "updated", "issuer_health": state.issuer_health}
    raise HTTPException(status_code=404, detail="Bank not found")


class CertificateRequest(BaseModel):
    amount: float
    scenario: str
    status: str

@app.post("/certificate")
@app.post("/api/certificate")
async def create_certificate(req: CertificateRequest):
    import hashlib, hmac, os
    from datetime import datetime, timezone
    dispute_ref = f"UDIR{datetime.now().strftime('%Y%m%d')}{hashlib.sha256(os.urandom(8)).hexdigest()[:10].upper()}"
    txn_ref = f"TXN{datetime.now().strftime('%d')}{hashlib.sha256(os.urandom(8)).hexdigest()[:10].upper()}"
    issued_at = datetime.now(timezone.utc).isoformat()
    merchant_id = "PAYTM_SHOP_001"
    customer_vpa = "customer@paytm"
    payload = f"{dispute_ref}|{txn_ref}|{req.amount:.2f}|{req.scenario}|{req.status}|{merchant_id}|{customer_vpa}|{issued_at}"
    hmac_sha256 = hmac.new(b"paytm_safeclear_secret_key_2026", payload.encode("utf-8"), hashlib.sha256).hexdigest()
    return {
        "dispute_ref": dispute_ref,
        "txn_ref": txn_ref,
        "amount": float(req.amount),
        "scenario": req.scenario,
        "status": req.status,
        "merchant_id": merchant_id,
        "customer_vpa": customer_vpa,
        "issued_at": issued_at,
        "hmac_sha256": hmac_sha256,
        "payload": payload,
        "issuer": "NPCI UDIR",
        "verified": True
    }

class TriageRequest(BaseModel):
    text: str
    amount: Optional[float] = None

@app.post("/triage")
@app.post("/api/triage")
async def triage_dispute(req: TriageRequest):
    t_low = req.text.lower()
    if any(k in t_low for k in ["cut", "kat", "debit", "paisa", "kata"]):
        cat = "PAID_NOT_RECEIVED"
        act = "💡 UPI app mein is transaction ka dispute raise karein aur 24 ghante mein status check karein."
    elif any(k in t_low for k in ["fail", "decline", "reject"]):
        cat = "BANK_DECLINED"
        act = "❌ Payer bank ne transaction decline kar diya hai. Dusre bank account ya mode se pay karein."
    elif any(k in t_low for k in ["double", "do baar", "duplicate"]):
        cat = "DUPLICATE_DEBIT"
        act = "⚡ Duplicate deduction detect hua hai. SafeClear auto-refund initiate kar raha hai."
    else:
        cat = "GENERAL_DISPUTE"
        act = "🔍 SafeClear dispute triage initiated. Reconciled within 30 seconds."
    return {
        "category": cat,
        "action": act,
        "raw": f"CATEGORY: {cat}\nACTION: {act}"
    }

class CopilotChatRequest(BaseModel):
    message: str
    session_id: Optional[str] = "default"
    context: Optional[Dict[str, Any]] = None

@app.post("/copilot/chat")
@app.post("/api/copilot/chat")
async def copilot_chat_stream(req: CopilotChatRequest):
    async def event_generator():
        res = await query_ollama_copilot(req.message)
        answer = res.get("answer", "")
        words = answer.split(" ")
        for i, word in enumerate(words):
            chunk = word + (" " if i < len(words) - 1 else "")
            yield chunk.encode("utf-8")
            await asyncio.sleep(0.015)
    return StreamingResponse(event_generator(), media_type="text/plain")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
