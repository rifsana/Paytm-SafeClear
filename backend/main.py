"""
Paytm SafeClear - FastAPI Backend (Track 2: AI-Powered Financial Journeys)
Humanizing the Ambiguous 60 Seconds of UPI Point-of-Sale Payments
Shared Real-Time Session Engine for Mobile (Client) & Laptop (Merchant)
"""

import asyncio
import hashlib
import hmac
import json
import os
import random
import re
import string
import time
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Set

import httpx
from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

app = FastAPI(
    title="Paytm SafeClear API",
    description="Track 2: AI-Powered Financial Journeys — Ambiguous 60-second UPI POS Resolution Engine",
    version="2.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["X-Copilot-Source", "X-Copilot-Model"],
)

SECRET_KEY = "paytm_safeclear_secret_key_2026"
SARVAM_API_KEY = os.getenv("SARVAM_API_KEY", "").strip()
SARVAM_CHAT_URL = os.getenv("SARVAM_CHAT_URL", "https://api.sarvam.ai/v1/chat/completions")
SARVAM_CHAT_MODEL = os.getenv("SARVAM_CHAT_MODEL", "sarvam-105b")

# ─────────────────────────────────────────────
# Sarvam AI Knowledge Base & Error Explainer
# ─────────────────────────────────────────────
ERROR_CODE_REGISTRY = {
    "ZM": {
        "code": "ZM",
        "description": "Incorrect UPI PIN",
        "money_moved": False,
        "badge": "ZERO PAISA KATA",
        "verdict_en": "No money was debited from your bank account.",
        "hindi": "Aapka UPI PIN match nahi hua. Suraksha ke liye payment reject hui. Paisa bilkul nahi kata. Turant dobara koshish karein.",
        "hinglish": "PIN galat tha. Paisa bilkul nahi kata. Turant dobara koshish karein.",
        "tamil": "UPI PIN thavaraghadhal panam edukkapadavillai. Koodiya viraivil meendum muyarchikkavum.",
        "soundbox_hi": "Token {token} asafal raha. Paisa nahi kata. Saman na dein.",
        "recommended_recovery": "RETRY_PIN",
        "upi_lite_eligible": True,
    },
    "Z9": {
        "code": "Z9",
        "description": "Insufficient Balance in Account",
        "money_moved": False,
        "badge": "ZERO PAISA KATA",
        "verdict_en": "Pre-debit decline. Zero money was deducted from your bank.",
        "hindi": "Aapke account mein zaroori balance nahi tha. Bank ne payment roki hai aur aapke account se koi paisa nahi kata. UPI Lite ya doosra bank chunein.",
        "hinglish": "Account mein balance kam tha. Paisa nahi kata. UPI Lite ya doosra bank chunein.",
        "tamil": "Kanakil pothumaana panam illai. Panam edukkapadavillai. UPI Lite payanpaduthavum.",
        "soundbox_hi": "Token {token} asafal raha. Paisa nahi kata. Saman na dein.",
        "recommended_recovery": "UPI_LITE_SWITCH",
        "upi_lite_eligible": True,
    },
    "U16": {
        "code": "U16",
        "description": "Daily UPI Transaction Limit Exceeded",
        "money_moved": False,
        "badge": "ZERO PAISA KATA",
        "verdict_en": "Pre-debit limit breach. No money debited.",
        "hindi": "Aapke bank ki dainik (daily) limit puri ho chuki hai. Paisa nahi kata. Kisi aur account ya card se pay karein.",
        "hinglish": "Rozana limit puri ho gayi hai. Kisi aur account ya card se pay karein.",
        "tamil": "Dhinamum seiyya koodiya UPI alavu mudinthuvittadhu. Panam edukkapadavillai.",
        "soundbox_hi": "Token {token} dainik limit ke kaaran asafal raha. Saman na dein.",
        "recommended_recovery": "SWITCH_BANK",
        "upi_lite_eligible": False,
    },
    "U68": {
        "code": "U68",
        "description": "Bank/NPCI Network Timeout (In-Flight Switch)",
        "money_moved": None,  # Ambiguous
        "badge": "PAISA KATA HAI — VERIFYING",
        "verdict_en": "Confirmation pending from partner bank switch. Do NOT retry.",
        "hindi": "Bank se confirmation baki hai. Dobara scan MAT karein. SafeClear live reconcile kar raha hai.",
        "hinglish": "Bank se confirmation baki hai. Dobara scan MAT karein. 30 second ruko.",
        "tamil": "Vangi urudhipaduthal baaki ulladhu. Meendum scan seyyavendaam. Kaathirukkavum.",
        "soundbox_hi": "Dhyan dein: {name} se ₹{amount} ka payment verify ho raha hai. Token {token}. Saman na dein.",
        "recommended_recovery": "DYNAMIC_QR_VERIFICATION",
        "upi_lite_eligible": True,
    },
}

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

def compute_hmac(data: Dict, secret: str = SECRET_KEY) -> str:
    canonical = json.dumps(data, sort_keys=True)
    return hmac.new(secret.encode(), canonical.encode(), hashlib.sha256).hexdigest()

# ─────────────────────────────────────────────
# Global Shared Session State (Multi-Device Sync)
# ─────────────────────────────────────────────
SCENARIO_CONFIGS = {
    "SCENARIO_A": {
        "scenario": "SCENARIO_A",
        "title": "Scenario A: The False Alarm",
        "subtitle": "Z9 Low Balance → 1-Tap UPI Lite",
        "amount": 350.0,
        "token": "4821",
        "customer": "Rahul S.",
        "vpa": "rahul9821@okhdfcbank",
        "bank": "HDFC",
        "store": "Sharma Bakery",
    },
    "SCENARIO_B": {
        "scenario": "SCENARIO_B",
        "title": "Scenario B: Bank Timeout & Dynamic QR",
        "subtitle": "U68 Timeout → Dynamic Status QR",
        "amount": 250.0,
        "token": "4821",
        "customer": "Rahul S.",
        "vpa": "rahul9821@okhdfcbank",
        "bank": "SBI",
        "store": "Sharma Sweets",
    },
    "SCENARIO_C": {
        "scenario": "SCENARIO_C",
        "title": "Scenario C: Duplicate Guard & Refund",
        "subtitle": "Panic Re-scan → 1-Tap Instant Refund",
        "amount": 400.0,
        "token": "1043",
        "customer": "Sneha R.",
        "vpa": "sneha2290@ybl",
        "bank": "ICICI",
        "store": "Sharma Grocery",
    },
}

class SafeClearState:
    def __init__(self):
        self.active_connections: Set[WebSocket] = set()
        self.event_log: List[Dict] = []
        self.issuer_health: Dict[str, Dict] = {
            "HDFC": {"timeout_rate": 2.1, "timeoutPct": 2.1, "p95_latency_ms": 850, "latency": 850, "status": "degraded"},
            "SBI":  {"timeout_rate": 1.2, "timeoutPct": 1.2, "p95_latency_ms": 650, "latency": 650, "status": "healthy"},
            "ICICI":{"timeout_rate": 0.8, "timeoutPct": 0.8, "p95_latency_ms": 480, "latency": 480, "status": "healthy"},
            "Axis": {"timeout_rate": 1.5, "timeoutPct": 1.5, "p95_latency_ms": 720, "latency": 720, "status": "healthy"},
        }
        self.session = self.make_initial_session("SCENARIO_A")
        self.ledger: List[Dict] = []

    def make_initial_session(self, scenario_key: str = "SCENARIO_A") -> Dict:
        cfg = SCENARIO_CONFIGS.get(scenario_key, SCENARIO_CONFIGS["SCENARIO_A"])
        return {
            "scenario": scenario_key,
            "title": cfg["title"],
            "subtitle": cfg["subtitle"],
            "amount": cfg["amount"],
            "token": cfg["token"],
            "customer": cfg["customer"],
            "vpa": cfg["vpa"],
            "bank": cfg["bank"],
            "store": cfg["store"],
            "status": "IDLE",  # IDLE, IN_FLIGHT, DECLINED, TIMEOUT_PENDING, QR_SCANNED, SETTLED, DUPLICATE_ALERT, REFUNDED
            "error_code": None,
            "badge": None,
            "sarvam_explainer": None,
            "soundbox_alert": None,
            "qr_payload": None,
            "qr_scanned": false if False else False,
            "p1_settled": False,
            "duplicate_detected": False,
            "refund_executed": False,
            "rrn": None,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }

state = SafeClearState()

# ─────────────────────────────────────────────
# WebSocket Manager
# ─────────────────────────────────────────────
async def broadcast(event: Dict):
    """Broadcast state or event to all connected clients (phone & laptop)."""
    event_with_time = {
        **event,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "session": state.session,
    }
    state.event_log.append(event_with_time)
    dead = set()
    for ws in state.active_connections:
        try:
            await ws.send_json(event_with_time)
        except Exception:
            dead.add(ws)
    state.active_connections -= dead

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    state.active_connections.add(websocket)
    # Send current live state immediately
    await websocket.send_json({
        "type": "SYNC_STATE",
        "session": state.session,
        "issuer_health": state.issuer_health,
        "ledger": state.ledger[-10:],
    })
    try:
        while True:
            data = await websocket.receive_json()
            await handle_ws_action(data)
    except WebSocketDisconnect:
        state.active_connections.discard(websocket)

async def handle_ws_action(data: Dict):
    action = data.get("action") or data.get("type")
    if action == "SELECT_SCENARIO":
        scenario = data.get("scenario", "SCENARIO_A")
        await set_scenario(scenario)
    elif action == "START_PAYMENT":
        await start_payment()
    elif action == "PAY_UPI_LITE":
        await execute_upi_lite_payment()
    elif action == "PANIC_RESCAN":
        await execute_panic_rescan()
    elif action == "SCAN_STATUS_QR":
        await execute_scan_status_qr()
    elif action == "ISSUE_1TAP_REFUND":
        await execute_instant_refund()
    elif action == "RESET":
        await reset_session()

# ─────────────────────────────────────────────
# Scenario Operations (Real-time Synced Flows)
# ─────────────────────────────────────────────
async def set_scenario(scenario_key: str):
    state.session = state.make_initial_session(scenario_key)
    await broadcast({
        "type": "SCENARIO_CHANGED",
        "scenario": scenario_key,
        "message": f"Switched to {state.session['title']}"
    })

async def reset_session():
    current_sc = state.session["scenario"]
    state.session = state.make_initial_session(current_sc)
    await broadcast({
        "type": "SESSION_RESET",
        "message": "Reset to IDLE state — Ready to pay"
    })

async def start_payment():
    """Customer initiates payment on their phone."""
    sc = state.session["scenario"]
    state.session["status"] = "IN_FLIGHT"
    await broadcast({
        "type": "PAYMENT_IN_FLIGHT",
        "message": f"Customer initiated ₹{state.session['amount']} via {state.session['bank']} Bank"
    })

    await asyncio.sleep(1.0)

    if sc == "SCENARIO_A":
        # Bank returns Z9 (Insufficient Balance)
        state.session["status"] = "DECLINED"
        state.session["error_code"] = "Z9"
        state.session["badge"] = "ZERO PAISA KATA"
        state.session["sarvam_explainer"] = "Account mein balance kam tha. Paisa bilkul nahi kata. UPI Lite ya doosra bank chunein."
        state.session["soundbox_alert"] = {
            "text": f"Token {state.session['token']} asafal raha. Paisa nahi kata. Saman na dein.",
            "audio_file": "sbx_decline_350.wav",
        }
        await broadcast({
            "type": "PRE_DEBIT_DECLINE",
            "message": "Bank returned Z9 (Insufficient Balance) — 'Zero Paisa Kata' badge surfaced"
        })

    elif sc == "SCENARIO_B":
        # Bank server timeout U68
        qr_payload = {
            "txn_id": gen_id("CM"),
            "token": state.session["token"],
            "amount": state.session["amount"],
            "vpa": state.session["vpa"],
            "status": "SWITCH_RECONCILING",
            "expires_at": time.time() + 180,
        }
        qr_payload["hmac_signature"] = compute_hmac(qr_payload)

        state.session["status"] = "TIMEOUT_PENDING"
        state.session["error_code"] = "U68"
        state.session["badge"] = "PAISA KATA HAI — CLEARANCE IN PROGRESS"
        state.session["qr_payload"] = qr_payload
        state.session["soundbox_alert"] = {
            "text": f"Dhyan dein: {state.session['customer']} se ₹{int(state.session['amount'])} ka payment verify ho raha hai. Token {state.session['token']}. Saman na dein.",
            "audio_file": "sbx_holding_token.wav",
        }
        await broadcast({
            "type": "TIMEOUT_PENDING",
            "message": f"Bank Timeout U68 — Dynamic Status QR with Token #{state.session['token']} surfaced"
        })

    elif sc == "SCENARIO_C":
        # P1 is in-flight / success on switch
        state.session["status"] = "P1_IN_FLIGHT"
        state.session["p1_settled"] = True
        await broadcast({
            "type": "P1_PENDING",
            "message": f"Payment #1 (₹{state.session['amount']}) initiated — awaiting response"
        })

async def execute_upi_lite_payment():
    """Customer on mobile taps 'Pay via UPI Lite' for Scenario A."""
    rrn = gen_rrn()
    state.session["status"] = "SETTLED"
    state.session["rrn"] = rrn
    state.session["soundbox_alert"] = {
        "text": f"Paytm par teen sau pachaas rupaye prapt hue.",
        "audio_file": "sbx_success_350.wav",
    }
    state.ledger.insert(0, {
        "id": gen_id("LEDGER"),
        "ref": f"UDIR-{rrn[:8]}",
        "time": datetime.now().strftime("%H:%M:%S"),
        "bank": "UPI Lite",
        "amount": state.session["amount"],
        "status": "SETTLED",
    })
    await broadcast({
        "type": "UPI_LITE_SETTLED",
        "message": f"1-Tap UPI Lite Checkout: ₹{state.session['amount']} settled in 1.8s (Zero core-banking latency)"
    })

async def execute_scan_status_qr():
    """Merchant on laptop taps 'Scan Customer QR' for Scenario B."""
    state.session["qr_scanned"] = True
    await broadcast({
        "type": "QR_SCANNED_VERIFIED",
        "message": f"Merchant POS Scanned Customer QR: Valid Cryptographic Token #{state.session['token']} Verified"
    })
    # Switch reconciliation
    await asyncio.sleep(1.2)
    rrn = gen_rrn()
    state.session["status"] = "SETTLED"
    state.session["rrn"] = rrn
    state.session["soundbox_alert"] = {
        "text": "Paytm par do sau pachaas rupaye prapt hue.",
        "audio_file": "sbx_success_250.wav",
    }
    state.ledger.insert(0, {
        "id": gen_id("LEDGER"),
        "ref": f"UDIR-{rrn[:8]}",
        "time": datetime.now().strftime("%H:%M:%S"),
        "bank": state.session["bank"],
        "amount": state.session["amount"],
        "status": "SETTLED",
    })
    await broadcast({
        "type": "SWITCH_SETTLED",
        "message": f"Switch ACK confirmed credit (RRN: {rrn}) — Goods Released!"
    })

async def execute_panic_rescan():
    """Customer on mobile taps 'Scan & Pay Again' for Scenario C."""
    state.session["status"] = "DUPLICATE_ALERT"
    state.session["duplicate_detected"] = True
    state.session["soundbox_alert"] = {
        "text": "Chetawani: Duplicate payment detect hua.",
        "audio_file": "sbx_dupe_warning.wav",
    }
    await broadcast({
        "type": "DUPLICATE_DETECTED",
        "message": f"Intent Guard: 98% confidence duplicate — paid twice within 25s"
    })

async def execute_instant_refund():
    """Merchant on laptop taps 'Issue 1-Tap Instant Refund' for Scenario C."""
    refund_ref = gen_id("REF")
    state.session["status"] = "REFUNDED"
    state.session["refund_executed"] = True
    state.session["refund_ref"] = refund_ref
    state.session["soundbox_alert"] = {
        "text": f"Duplicate payment detected. ₹{int(state.session['amount'])} refund initiate kar diya gaya.",
        "audio_file": "sbx_dupe_refunded_400.wav",
    }
    state.ledger.insert(0, {
        "id": gen_id("LEDGER"),
        "ref": refund_ref,
        "time": datetime.now().strftime("%H:%M:%S"),
        "bank": "Auto-Refund",
        "amount": state.session["amount"],
        "status": "AUTO_REFUNDED",
    })
    await broadcast({
        "type": "REFUND_EXECUTED",
        "message": f"1-Tap Instant Refund Executed: ₹{state.session['amount']} returned to {state.session['customer']} (Ref: {refund_ref})"
    })

# ─────────────────────────────────────────────
# REST Endpoints (Synchronized Session & Sarvam)
# ─────────────────────────────────────────────
@app.get("/api/session")
def get_session():
    return {
        "session": state.session,
        "issuer_health": state.issuer_health,
        "ledger": state.ledger[-10:],
    }

class ScenarioRequest(BaseModel):
    scenario: str

@app.post("/api/session/scenario")
async def api_set_scenario(req: ScenarioRequest):
    await set_scenario(req.scenario)
    return {"status": "ok", "session": state.session}

@app.post("/api/session/reset")
async def api_reset():
    await reset_session()
    return {"status": "ok", "session": state.session}

@app.post("/api/session/pay")
async def api_pay():
    await start_payment()
    return {"status": "ok", "session": state.session}

@app.post("/api/session/upi-lite")
async def api_upi_lite():
    await execute_upi_lite_payment()
    return {"status": "ok", "session": state.session}

@app.post("/api/session/scan-qr")
async def api_scan_qr():
    await execute_scan_status_qr()
    return {"status": "ok", "session": state.session}

@app.post("/api/session/panic-rescan")
async def api_panic_rescan():
    await execute_panic_rescan()
    return {"status": "ok", "session": state.session}

@app.post("/api/session/instant-refund")
async def api_instant_refund():
    await execute_instant_refund()
    return {"status": "ok", "session": state.session}

# Sarvam Endpoints
@app.get("/api/sarvam/error-codes")
def list_error_codes():
    return ERROR_CODE_REGISTRY

class ExplainRequest(BaseModel):
    code: str
    language: Optional[str] = "hinglish"

@app.post("/api/sarvam/explain")
def sarvam_explain(req: ExplainRequest):
    entry = ERROR_CODE_REGISTRY.get(req.code.upper())
    if not entry:
        return {"code": req.code, "found": False}
    return {
        "code": req.code,
        "found": True,
        "money_moved": entry["money_moved"],
        "badge": entry["badge"],
        "explanation": entry.get(req.language, entry["hinglish"]),
        "upi_lite_eligible": entry.get("upi_lite_eligible", False),
        "soundbox_text": entry["soundbox_hi"].format(token=state.session["token"], name=state.session["customer"], amount=int(state.session["amount"])),
    }

class TriageRequest(BaseModel):
    text: str

@app.post("/api/triage")
def triage_dispute(req: TriageRequest):
    t_low = req.text.lower()
    if any(k in t_low for k in ["cut", "kat", "debit", "paisa", "kata"]):
        cat = "PAID_NOT_RECEIVED"
        act = "SafeClear: Paisa verify ho raha hai. SafeClear switch se direct reconcile kar raha hai."
    elif any(k in t_low for k in ["fail", "decline", "reject", "pin", "balance"]):
        cat = "PRE_DEBIT_DECLINE"
        act = "SafeClear: Zero paisa kata. Account balance kam tha. UPI Lite se pay karein."
    elif any(k in t_low for k in ["double", "do baar", "duplicate"]):
        cat = "DUPLICATE_DEBIT"
        act = "Intent Guard: Duplicate deduction detect hua. 1-Tap auto-refund active hai."
    else:
        cat = "COUNTER_INQUIRY"
        act = "SafeClear: Live transaction 18 second ke andar reconcile ho jayegi."
    return {"category": cat, "action": act, "engine": "rules"}

class IntentGuardRequest(BaseModel):
    customer_vpa: str
    merchant_id: str
    amount: float
    time_delta_seconds: float

@app.post("/api/sarvam/intent-guard")
def sarvam_intent_guard(req: IntentGuardRequest):
    """Duplicate-intent check: same payer and amount within 120s."""
    is_dupe = req.time_delta_seconds < 120.0
    confidence = 0.98 if req.time_delta_seconds < 45.0 else (0.85 if is_dupe else 0.12)
    return {
        "is_duplicate_intent": is_dupe,
        "confidence": confidence,
        "risk_tier": "HIGH" if is_dupe else "LOW",
        "model": "rules",
        "action": "SURFACE_1TAP_REFUND" if is_dupe else "PROCESS_AS_NEW",
        "verdict": f"Detected repeat payment of ₹{req.amount} within {int(req.time_delta_seconds)}s — {'Panic Duplicate' if is_dupe else 'Legitimate Repeat Purchase'}",
    }

class StatusQRVerifyRequest(BaseModel):
    payload: Dict[str, Any]

@app.post("/api/verify-status-qr")
def verify_status_qr(req: StatusQRVerifyRequest):
    token = req.payload.get("token", "4821")
    return {
        "verified": True,
        "token": token,
        "switch_status": "RECONCILING",
        "partner_bank": "HDFC / SBI Switch",
        "p95_latency_ms": 1800,
        "instruction": "HOLD GOODS — Reconciling with bank switch",
    }

@app.post("/api/upi-lite/pay")
async def api_upi_lite_legacy():
    await execute_upi_lite_payment()
    return {"status": "success", "mode": "UPI_LITE"}

@app.post("/api/instant-refund")
async def api_instant_refund_legacy():
    await execute_instant_refund()
    return {"status": "refund_initiated"}

class CertificateRequest(BaseModel):
    amount: float
    scenario: str
    status: str

@app.post("/certificate")
@app.post("/api/certificate")
async def create_certificate(req: CertificateRequest):
    dispute_ref = f"UDIR{datetime.now().strftime('%Y%m%d')}{hashlib.sha256(os.urandom(8)).hexdigest()[:10].upper()}"
    txn_ref = f"CM{datetime.now().strftime('%d')}{hashlib.sha256(os.urandom(8)).hexdigest()[:10].upper()}"
    issued_at = datetime.now(timezone.utc).isoformat()
    merchant_id = "PAYTM_RETAIL_001"
    customer_vpa = "rahul9821@okhdfcbank"
    payload = f"{dispute_ref}|{txn_ref}|{req.amount:.2f}|{req.scenario}|{req.status}|{merchant_id}|{customer_vpa}|{issued_at}"
    hmac_sha256 = hmac.new(SECRET_KEY.encode("utf-8"), payload.encode("utf-8"), hashlib.sha256).hexdigest()
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
        "issuer": "NPCI UDIR + Sarvam SafeClear",
        "verified": True
    }

class CopilotChatRequest(BaseModel):
    message: str
    session_id: Optional[str] = "default"
    context: Optional[Dict[str, Any]] = None

COPILOT_SYSTEM_PROMPT = """You are SafeClear Copilot, an assistant for a Paytm merchant at a UPI point-of-sale counter in India.
You help the merchant resolve the ambiguous seconds after a customer pays: declines, bank timeouts and duplicate payments.
Reply in the language the merchant uses (Hinglish, Hindi or English). Keep answers to 2-4 short sentences.
Be concrete about whether money moved and what the merchant should do now (release goods, wait, scan the status QR, issue a refund).
Never claim a payment succeeded unless the live session status is SETTLED.

UPI error codes: ZM = wrong PIN (no debit), Z9 = insufficient balance (no debit), U16 = daily limit exceeded (no debit),
U68 = bank timeout (debit ambiguous, wait for reconciliation or verify the customer's status QR)."""


def canned_copilot_answer(message: str) -> str:
    q_low = message.lower()
    if "350" in q_low or "lite" in q_low or "balance" in q_low:
        return "Customer ke account me insufficient balance tha. Paisa bilkul nahi kata (Zero Paisa Kata). Customer ko mobile screen par '1-Tap Pay via UPI Lite' dikh raha hai jisse 2 second me payment ho jayegi."
    if "4821" in q_low or "token" in q_low or "250" in q_low:
        return "Token #4821 Rahul S. ka ₹250 payment hai jo bank timeout me pending hai. Soundbox ne warning de di hai 'Saman na dein'. Customer ke phone ka Status QR scan karein ya 18 second ruko."
    if "400" in q_low or "duplicate" in q_low or "twice" in q_low:
        return "Sneha R. ne ₹400 do baar scan kiya hai (within 25s). Sarvam Intent Guard ne 98% confidence se duplicate detect kiya hai. POS screen par 'Issue 1-Tap Instant Refund' dabayein."
    return "SafeClear Sarvam AI Copilot active hai. All transactions and counter ambiguous states are monitored under the sovereign Sarvam AI protocol."


async def stream_words(text: str):
    words = text.split(" ")
    for i, word in enumerate(words):
        yield (word + (" " if i < len(words) - 1 else "")).encode("utf-8")
        await asyncio.sleep(0.015)


def sarvam_headers() -> Dict[str, str]:
    return {"api-subscription-key": SARVAM_API_KEY, "Content-Type": "application/json"}


def live_session_context() -> str:
    s = state.session
    return (
        f"Live counter session: scenario {s.get('scenario')}, status {s.get('status')}, "
        f"amount Rs {s.get('amount')}, customer {s.get('customer')}, token #{s.get('token')}, "
        f"bank {s.get('bank')}, error code {s.get('error_code') or 'none'}, store {s.get('store')}."
    )


def strip_think(text: str, in_think: bool):
    """Drop inline <think>…</think> spans (defensive; Sarvam returns reasoning in a separate field)."""
    out = ""
    while text:
        if in_think:
            end = text.find("</think>")
            if end < 0:
                return out, True
            text, in_think = text[end + 8:], False
        else:
            start = text.find("<think>")
            if start < 0:
                return out + text, False
            out, text, in_think = out + text[:start], text[start + 7:], True
    return out, in_think


async def open_sarvam_chat_stream(message: str):
    """Open a streaming Sarvam chat completion. Returns (client, response) on HTTP 200, else raises."""
    payload = {
        "model": SARVAM_CHAT_MODEL,
        "messages": [
            {"role": "system", "content": f"{COPILOT_SYSTEM_PROMPT}\n\n{live_session_context()}"},
            {"role": "user", "content": message},
        ],
        "stream": True,
        "temperature": 0.3,
        "max_tokens": 1024,  # includes reasoning tokens
        "reasoning_effort": "low",
    }
    client = httpx.AsyncClient(timeout=httpx.Timeout(60.0, connect=10.0))
    try:
        req = client.build_request("POST", SARVAM_CHAT_URL, json=payload, headers=sarvam_headers())
        resp = await client.send(req, stream=True)
        if resp.status_code != 200:
            body = (await resp.aread()).decode("utf-8", "replace")[:300]
            await resp.aclose()
            raise RuntimeError(f"Sarvam HTTP {resp.status_code}: {body}")
        return client, resp
    except Exception:
        await client.aclose()
        raise


async def iter_sarvam_text(client: httpx.AsyncClient, resp: httpx.Response):
    """Yield answer text from OpenAI-style SSE chunks; reasoning_content is skipped."""
    in_think = False
    try:
        async for line in resp.aiter_lines():
            if not line.startswith("data:"):
                continue
            data = line[5:].strip()
            if data == "[DONE]":
                break
            try:
                chunk = json.loads(data)
            except json.JSONDecodeError:
                continue
            choices = chunk.get("choices") or []
            if not choices:
                continue
            out, in_think = strip_think((choices[0].get("delta") or {}).get("content") or "", in_think)
            if out:
                yield out.encode("utf-8")
    finally:
        await resp.aclose()
        await client.aclose()


@app.post("/copilot/chat")
@app.post("/api/copilot/chat")
async def copilot_chat_stream(req: CopilotChatRequest):
    fallback_headers = {"X-Copilot-Source": "fallback"}
    if not SARVAM_API_KEY:
        return StreamingResponse(stream_words(canned_copilot_answer(req.message)), media_type="text/plain", headers=fallback_headers)

    try:
        client, resp = await open_sarvam_chat_stream(req.message)
    except Exception as e:
        print(f"[copilot] Sarvam call failed: {e}", flush=True)
        return StreamingResponse(stream_words(canned_copilot_answer(req.message)), media_type="text/plain", headers=fallback_headers)

    # Wait for the first answer text so the source header is truthful.
    chunks = iter_sarvam_text(client, resp)
    try:
        first = await chunks.__anext__()
    except StopAsyncIteration:
        print("[copilot] Sarvam returned no answer text; using fallback", flush=True)
        return StreamingResponse(stream_words(canned_copilot_answer(req.message)), media_type="text/plain", headers=fallback_headers)
    except Exception as e:
        await chunks.aclose()
        print(f"[copilot] Sarvam stream failed: {e}", flush=True)
        return StreamingResponse(stream_words(canned_copilot_answer(req.message)), media_type="text/plain", headers=fallback_headers)

    async def event_generator():
        yield first
        try:
            async for piece in chunks:
                yield piece
        except Exception as e:
            print(f"[copilot] Sarvam stream broke: {e}", flush=True)

    return StreamingResponse(
        event_generator(),
        media_type="text/plain",
        headers={"X-Copilot-Source": "sarvam", "X-Copilot-Model": SARVAM_CHAT_MODEL},
    )


@app.get("/api/copilot/ping")
async def copilot_ping():
    """Live check of the Sarvam chat integration. Never returns the key."""
    if not SARVAM_API_KEY:
        return {"ok": False, "reason": "SARVAM_API_KEY not set", "model": SARVAM_CHAT_MODEL}
    payload = {
        "model": SARVAM_CHAT_MODEL,
        "messages": [{"role": "user", "content": "Reply with just: OK"}],
        "max_tokens": 256,
        "reasoning_effort": "low",
    }
    started = time.time()
    try:
        async with httpx.AsyncClient(timeout=httpx.Timeout(30.0, connect=10.0)) as client:
            r = await client.post(SARVAM_CHAT_URL, json=payload, headers=sarvam_headers())
        latency_ms = int((time.time() - started) * 1000)
        if r.status_code != 200:
            try:
                err = r.json().get("error", {})
            except Exception:
                err = {}
            return {"ok": False, "http_status": r.status_code, "error_code": err.get("code"),
                    "error_message": (err.get("message") or r.text)[:200], "latency_ms": latency_ms, "model": SARVAM_CHAT_MODEL}
        data = r.json()
        choice = (data.get("choices") or [{}])[0]
        reply, _ = strip_think((choice.get("message") or {}).get("content") or "", False)
        return {"ok": bool(reply.strip()), "http_status": 200, "model": data.get("model", SARVAM_CHAT_MODEL),
                "finish_reason": choice.get("finish_reason"), "reply": reply.strip()[:80],
                "usage": data.get("usage"), "latency_ms": latency_ms}
    except Exception as e:
        return {"ok": False, "reason": f"{type(e).__name__}: {e}"[:200], "model": SARVAM_CHAT_MODEL}

@app.get("/health")
def health():
    return {
        "status": "ok",
        "service": "Paytm SafeClear",
        "version": "2.1.0",
        "track": "Track 2: AI-Powered Financial Journeys",
        "ai_stack": f"Sarvam AI chat ({SARVAM_CHAT_MODEL}) for copilot; rule-based explainer, triage and intent guard",
        "session_status": state.session["status"],
        "copilot": {"sarvam_key_configured": bool(SARVAM_API_KEY), "model": SARVAM_CHAT_MODEL},
    }

# Mount built React frontend for unified single-service hosting
from fastapi.staticfiles import StaticFiles
frontend_dist_candidates = [
    os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "frontend", "dist"),
    os.path.join(os.path.dirname(os.path.abspath(__file__)), "dist"),
    os.path.join(os.getcwd(), "dist"),
    os.path.join(os.getcwd(), "..", "frontend", "dist"),
]
frontend_dist = next((p for p in frontend_dist_candidates if os.path.exists(p)), None)
if frontend_dist:
    app.mount("/", StaticFiles(directory=frontend_dist, html=True), name="frontend")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
