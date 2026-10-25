# AKSHAY: Autonomous Personal AI, FinOS & Offline Knowledge Hub

[![Security-First](https://img.shields.io/badge/AppSec-OWASP%20Top%2010-38bdf8)](https://owasp.org)
[![Offline-Capable](https://img.shields.io/badge/Offline-Internet%20in%20a%20Box-34d399)](https://www.kiwix.org)
[![FinOS](https://img.shields.io/badge/FinOS-Double--Entry%20Engine-818cf8)](https://github.com/abishekainunes-cmyk/Project)

> **Codename:** Akshay (*अक्षय* — "Imperishable, Indestructible, Always Present")  
> **Mission:** A privacy-first, fully autonomous personal AI companion that runs seamlessly on mobile hardware, functions 100% offline with an embedded "Internet-in-a-Box", and incorporates a deterministic personal finance engine (FinOS).

---

## 🚀 Key Features

1. **Iron Man Jarvis-Inspired Voice HUD:**
   * Hands-free speech recognition (STT) and low-latency voice synthesis (TTS).
   * Real-time audio waveform visualizer and device telemetry (battery, offline status, latency).
2. **FinOS: Deterministic Double-Entry Financial Engine:**
   * **Zero Hallucination Arithmetic:** Calculations decoupled from AI and executed via strict mathematical ledger principles.
   * **Passive Ingestion:** Bank and UPI SMS parser, receipt scanner, and conversational logging.
   * **Proactive Financial Guardian:** Subscription vampire audits, daily burn rate alerts, and "Can I Afford This?" instant decision evaluations.
3. **Internet-in-a-Box Offline Knowledge Portal:**
   * Embedded Kiwix LibZIM integration querying Wikipedia, Stack Overflow, DevDocs, and WikiHow emergency repair guides completely offline.
4. **AppSec & Zero-Leak Architecture:**
   * OWASP Top 10 hardened input sanitization, path traversal prevention, and automated PII scrubbing on all audit log streams.

---

## 🛠️ Quick Local Launch

Run the lightweight local HUD server with Python:

```bash
python run_local.py
```
Open your browser at `http://localhost:8085` or your phone's browser connected to the same local Wi-Fi.

---

## 🔒 Security & Verification

Run the automated AppSec and accounting invariant test suite:

```bash
python -m pytest ../akshay_core/tests -v
```
All 17 security and accounting tests pass with zero findings.
