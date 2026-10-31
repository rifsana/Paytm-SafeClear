"""
In-Memory Integration Tests for Paytm ClearMoment Backend APIs
Uses FastAPI TestClient (no network socket required)
"""
import sys
import os

# Ensure backend directory is in path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_health():
    res = client.get("/health")
    assert res.status_code == 200
    data = res.json()
    assert data["service"] == "Paytm ClearMoment"
    assert "Sarvam AI" in data["ai_stack"]
    print("✅ Health check passed")

def test_sarvam_explain():
    # Test Z9 (Insufficient Balance)
    res = client.post("/api/sarvam/explain", json={"code": "Z9", "language": "hinglish"})
    assert res.status_code == 200
    data = res.json()
    assert data["code"] == "Z9"
    assert data["money_moved"] is False
    assert data["badge"] == "ZERO PAISA KATA"
    assert "balance" in data["explanation"].lower()
    assert data["upi_lite_eligible"] is True

    # Test ZM (Incorrect PIN)
    res = client.post("/api/sarvam/explain", json={"code": "ZM", "language": "hindi"})
    assert res.status_code == 200
    data = res.json()
    assert data["money_moved"] is False
    assert data["badge"] == "ZERO PAISA KATA"

    # Test U68 (Bank Timeout)
    res = client.post("/api/sarvam/explain", json={"code": "U68", "language": "hinglish"})
    assert res.status_code == 200
    data = res.json()
    assert data["money_moved"] is None  # Ambiguous
    assert data["badge"] == "PAISA KATA HAI — VERIFYING"
    print("✅ Sarvam Explainer passed (Z9, ZM, U68)")

def test_intent_guard():
    # Duplicate within 30s
    res = client.post("/api/sarvam/intent-guard", json={
        "customer_vpa": "sneha2290@ybl",
        "merchant_id": "PAYTM_SHOP_001",
        "amount": 400.0,
        "time_delta_seconds": 30.0
    })
    assert res.status_code == 200
    data = res.json()
    assert data["is_duplicate_intent"] is True
    assert data["confidence"] >= 0.95
    assert data["action"] == "SURFACE_1TAP_REFUND"

    # Not a duplicate (after 300s)
    res = client.post("/api/sarvam/intent-guard", json={
        "customer_vpa": "sneha2290@ybl",
        "merchant_id": "PAYTM_SHOP_001",
        "amount": 400.0,
        "time_delta_seconds": 300.0
    })
    assert res.status_code == 200
    data = res.json()
    assert data["is_duplicate_intent"] is False
    print("✅ Sarvam Intent Guard passed")

def test_status_qr():
    res = client.post("/api/verify-status-qr", json={
        "payload": {
            "token": "4821",
            "amount": 250.0,
            "vpa": "rahul9821@okhdfcbank"
        }
    })
    assert res.status_code == 200
    data = res.json()
    assert data["verified"] is True
    assert data["token"] == "4821"
    print("✅ Dynamic Status QR Verification passed")

def test_upi_lite_pay():
    res = client.post("/api/upi-lite/pay", json={"amount": 350.0})
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "success"
    assert data["mode"] == "UPI_LITE"
    print("✅ UPI Lite Recovery Pay passed")

def test_instant_refund():
    res = client.post("/api/instant-refund", json={"amount": 400.0})
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "refund_initiated"
    print("✅ Instant 1-Tap Refund passed")

def test_dispute_triage():
    res = client.post("/api/triage", json={"text": "Paisa kat gaya par dukandar bola nahi aaya"})
    assert res.status_code == 200
    data = res.json()
    assert "Sarvam AI" in data["engine"]
    print("✅ Saaras-v4 Dispute Triage passed")

if __name__ == "__main__":
    test_health()
    test_sarvam_explain()
    test_intent_guard()
    test_status_qr()
    test_upi_lite_pay()
    test_instant_refund()
    test_dispute_triage()
    print("\n🎉 ALL CLEARMOMENT IN-MEMORY TESTS PASSED!")
