# KASPI POS — Strict 1-Poste Hardware Binding, Dual-Device Lockdown & Anti-Piracy Architecture

**Document Version:** 2.5 (Enterprise Security & Revenue Protection Edition)  
**Standard Pricing Model:** 200 MAD/month (1st Terminal 100% Inclusive) + 150 MAD/month (Per Extra Licensed Terminal)  
**Regulatory Framework:** Bank Al-Maghrib Law 103-12 Non-Custodial TSP, PCI-DSS 4.0.1 Seat Integrity  
**Language Availability:** العربية (RTL) | Français (LTR) | English (LTR)

---

## 1. Executive Summary & Revenue Integrity Mandate

KASPI POS enforces a mathematical, zero-trust hardware seat binding architecture that completely prevents **unauthorized account sharing, multi-PC credential leakage, and revenue cannibalization**, while offering **frictionless, automated customer-first recovery for legitimate shop owners**.

In traditional retail software, merchants frequently share login credentials across multiple physical cash registers or home laptops, effectively consuming two or three cash stations while paying only for a single baseline tier. KASPI POS neutralizes this vulnerability through:
1. **Cryptographic Physical Hardware Fingerprinting:** Machine-level OS UUID signing via Tauri Rust bridge + non-extractable WebCrypto ECDSA keypairs in IndexedDB.
2. **Permanent Slot Binding:** Slot #1 is irrevocably bound to **Original Primary Device `PC #1` (`primaryFingerprint`)**, even when `PC #1` is powered off or offline.
3. **Instant Dual-Device Conflict Lockdown (`DUAL_LOCKDOWN`):** The exact second `PC #2` attempts authentication on a 1-Poste quota, PostgreSQL locks both stations, issues Watchdog sentinel alerts, and renders frosted visionOS Seat Conflict modals on both screens.
4. **Customer-First Clean Shutdown Grace Recovery:** If both machines close/shut down, and the original authorized `PC #1` boots up alone (with `PC #2` offline), access is restored automatically without waiting for admin support.
5. **Instant Re-Lock & 3-Strike Hard Admin Escalation (`HARD_ADMIN_LOCK`):** Any repeated connection by `PC #2` drops both stations back into lockdown. Reaching 3 strikes permanently freezes automatic grace until Founder manual intervention or adding `+1 Extra Poste (+150 MAD/mo)`.

---

## 2. Cryptographic Hardware Fingerprinting Pipeline

```
+-----------------------------------------------------------------------------------+
|                            HARDWARE IDENTITY GENERATION                           |
+-----------------------------------------------------------------------------------+
|   [TAURI DESKTOP CLIENT]                          [BROWSER / PWA CLIENT]          |
|   src-tauri/src/main.rs                           src/lib/auth/device-identity.ts |
|                                                                                   |
|   1. Read machine hostname & UUID                 1. Generate non-extractable     |
|   2. Query OS kernel platform & arch                 P-256 ECDSA keypair in IDB   |
|   3. FNV-1a / SHA-256 hardware hash               2. Export public key thumbprint |
|   4. Return tauri_{64-hex-digest}                 3. Combine hardware entropy     |
|                                                      (screen, threads, lang)      |
|                                                   4. Return hw_{32-hex-digest}    |
+-----------------------------------------------------------------------------------+
                                          |
                                          v
+-----------------------------------------------------------------------------------+
|              POSTGRESQL SEAT BINDING (`poste_bindings` table)                     |
|  - slot_index: 1                                                                  |
|  - primary_fingerprint: "tauri_9e3779b97f4a7c15..." (IRREVOCABLE PRIMARY)        |
|  - status: ACTIVE | DUAL_LOCKDOWN | HARD_ADMIN_LOCK | GRACE_RECOVERED             |
|  - conflict_strikes: 0 (escalates to HARD_ADMIN_LOCK at 3)                        |
|  - last_primary_heartbeat_at / last_secondary_heartbeat_at                        |
|  - primary_session_closed_at / secondary_session_closed_at (beacon hooks)         |
+-----------------------------------------------------------------------------------+
```

---

## 3. Finite State Machine & State Transitions

The seat integrity engine follows a deterministic, non-bypassable 5-state lifecycle:

```
                          [ UNBOUND TENANT ]
                                  |
                   (First POS activation on Slot #1)
                                  v
                       [ ACTIVE (PC #1 Bound) ]
                             |           ^
        (PC #2 Attempt on 1-Poste)       | (Clean shutdown +
                             |           |  Only PC #1 boots alone +
                             v           |  strikes < 3)
                       [ DUAL_LOCKDOWN ]--+
                             |
             (Repeated PC #2 reconnect or strikes >= 3)
                             v
                     [ HARD_ADMIN_LOCK ]
                             |
            +----------------+----------------+
            |                                 |
 (Founder Support Ticket:            (Merchant Subscribes to
  Unlock Primary / Authorize New)     +1 Extra Poste 150 MAD/mo)
            |                                 |
            v                                 v
   [ ACTIVE (PC #1) ]               [ ACTIVE DUAL SLOTS ]
```

### Transition Matrix

| Current State | Triggering Event | Next State | System Actions |
| :--- | :--- | :--- | :--- |
| **INITIAL** | PC #1 launches POS | `ACTIVE` | Binds `primary_fingerprint = PC #1`. Generates session nonce. |
| **ACTIVE** | Heartbeat from PC #1 | `ACTIVE` | Updates `last_primary_heartbeat_at`. Normal cashiering continues. |
| **ACTIVE** | PC #2 attempts login (`maxDevices == 1`) | `DUAL_LOCKDOWN` | Increments `conflict_strikes`. Locks PC #2 immediately. Locks PC #1 on next check. Dispatches Watchdog alert. |
| **DUAL_LOCKDOWN** | Both shut down; PC #1 boots ALONE (`strikes < 3`) | `ACTIVE` (`GRACE_RECOVERED`) | Verifies PC #2 is offline (`>90s` stale or closed beacon). Restores cashier flow for PC #1 only. |
| **ACTIVE** | PC #2 attempts reconnect after grace | `DUAL_LOCKDOWN` | Increments `conflict_strikes`. Drops both back into lockdown immediately. |
| **DUAL_LOCKDOWN** | `conflict_strikes >= 3` | `HARD_ADMIN_LOCK` | Disables reboot grace permanently. Requires Founder approval or `+150 MAD/mo` billing upgrade. |
| **HARD_ADMIN_LOCK** | Founder approves ticket (`UNLOCK_PRIMARY`) | `ACTIVE` | Resets `conflict_strikes = 0`, clears secondary fingerprint, resolves ticket. |
| **HARD_ADMIN_LOCK** | Founder approves ticket (`AUTHORIZE_NEW_PC`) | `ACTIVE` | Migrates primary slot to PC #2 (`primary_fingerprint = secondary_fingerprint`). |
| **ANY LOCK** | Merchant pays `+150 MAD/mo` | `ACTIVE` | `Tenant.maxDevices` increased to 2; Slot #2 unlocked legally. |

---

## 4. Trilingual Interface Specifications (AR / FR / EN)

### 4.1 Arabic (العربية - RTL)
- **عنوان الإشعار:** تنبيه أمان: تم إيقاف جلسة الكاشير مؤقتاً (Anti-Account Sharing)
- **سبب الإيقاف الصريح:** تم إيقاف الجلسة مؤقتاً بسبب محاولة تشغيل حساب البوست الواحد على أكثر من جهاز في نفس الوقت أو على جهاز غير مرخص.
- **مقارنة العتاد:**
  - *الجهاز الأصلي المرخص (PC #1):* اسم الجهاز، نظام التشغيل، تاريخ الربط الأولي.
  - *الجهاز الثاني المتنازع عليه (PC #2):* اسم الجهاز، نظام التشغيل، وقت المحاولة المخالفة.
  - *عداد المخالفات:* المحاولة X من 3 (قبل تفعيل القفل الإداري الدائم).
- **إجراء 1 (إرسال تذكرة مع لقطة الشاشة):** نموذج دعم آلي يلتقط صورة ملخصة لشاشة العتاد + ملاحظة التاجر ويحفظها في جدول `support_conflict_tickets` لإدارة كسب المركزية.
- **إجراء 2 (الحل الفوري الصادق):** "💡 إذا تم إغلاق البرنامجين معاً، وتشغيل الجهاز الأصلي (PC #1) وحده، فسيتم فتح القفل واستئناف العمل فوراً وتلقائياً دون انتظار الدعم."
- **إجراء 3 (الترقية الفورية):** زر أخضر زمردي: "إضافة بوست إضافي (+150 MAD/شهر)".

### 4.2 French (Français - LTR)
- **Titre:** Alerte de Sécurité : Session Caisse Suspendue
- **Motif Explicite:** La session a été suspendue temporairement : Détection d'une tentative d'utilisation simultanée d'un compte 1-Poste sur un second appareil non autorisé.
- **Matrice Matérielle:** Comparaison Poste Principal Agréé (#1) vs Second Appareil (#2), décompte de frappes (X/3).
- **Action Support:** Formulaire de contestation avec capture écran et transmission au Command Center SuperAdmin.
- **Grace Reboot:** Déblocage automatique si fermeture conjointe et redémarrage du PC #1 uniquement.
- **Upgrade Licence:** Bouton verre émeraude "Ajouter un Poste Supplémentaire (+150 MAD/mois)".

### 4.3 English (English - LTR)
- **Title:** Security Alert: Cashier Session Paused
- **Explicit Policy:** Session temporarily paused: Detected concurrent multi-device access or an unauthorized station attempt on a 1-Poste license.
- **Hardware Signatures:** Side-by-side card comparing Authorized Primary Terminal (PC #1) vs Conflicting Device (PC #2).
- **Support Action:** Built-in inquiry form capturing viewport snapshot and filing a `SupportConflictTicket`.
- **Customer Grace:** Solitary reboot of authorized PC #1 restores cashiering seamlessly.
- **Seat Upgrade:** Instant CTA "+1 Extra Poste (+150 MAD/month)".

---

## 5. SuperAdmin Founder Command Center Integration

Inside the Founder Studio (`/admin` -> `تذاكر الدعم وحماية لي بوست` / `/admin/conflict-tickets`):
1. **Live Conflict Feed:** Displays all active seat contentions with store details, ICE, subscription plan, and strike counters.
2. **Sanitized Screenshot Lightbox:** Founder can inspect the merchant's screen and error context directly.
3. **1-Click Executive Resolutions:**
   - `UNLOCK_PRIMARY`: Unlocks the original primary PC and clears strikes.
   - `AUTHORIZE_NEW_PC`: Authorizes the new machine as the official terminal (for verified hardware upgrades or broken PCs).
   - `REQUIRE_EXTRA_POSTE`: Demands plan upgrade (+150 MAD/mo) for persistent multi-register stores.
   - `SUSPEND`: Suspends tenant under hard lock.

---

## 6. Mathematical Anti-Exploit Guarantees

1. **No PC Swapping Loophole:** `PC #2` can NEVER self-promote to Primary. Even if `PC #1` is shut down, `PC #2` remains locked until Admin approval or extra poste purchase.
2. **Nonce Rotation Defense:** Session nonces rotate every 18 seconds; cloning browser IndexedDB / localStorage to another machine immediately invalidates the stale clone upon the next heartbeat.
3. **Escalation Cap:** After 3 strikes within 24 hours, automatic grace is revoked, preventing cyclic "turn off / turn on" piracy scripts.
4. **Offline Tampering Shield:** Tauri desktop stores offline sales signed with the bound hardware key; conflicting unverified sales are quarantined in Postgres outbox review.
