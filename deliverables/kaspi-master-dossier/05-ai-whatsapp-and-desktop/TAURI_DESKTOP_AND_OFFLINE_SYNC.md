# KASPI POS (كسب) — Tauri 2.0 Rust Desktop Client & Offline Edge Synchronization Engine

**Document Version:** 2.4.0  
**Classification:** Native Systems Engineering, Offline Resilience & Edge Synchronization  
**Source Implementation:** `src-tauri/`, `src/client/db.ts`, `src/client/sync-engine.ts`

---

## 1. Native Desktop Architecture: Tauri 2.0 Rust vs Electron

For enterprise commercial terminals, browser memory leaks and slow startup times are unacceptable. KASPI POS is packaged as a **native Tauri 2.0 Rust application**:

```mermaid
flowchart TD
    subgraph Frontend ["WEB RUNTIME (Next.js 15 Client)"]
        UI["visionOS Liquid Crystal UI (React 19)"]
        PosStore["Zustand State Store (Cart, CashShift, Pricing)"]
        Dexie["Dexie.js Client Database (IndexedDB)"]
    end

    subgraph IPCBridge ["TAURI IPC COMMAND BRIDGE"]
        Invoke["invoke('tpe_command', payload)"]
        Events["listen('tpe_event', callback)"]
    end

    subgraph RustCore ["NATIVE RUST SUBSYSTEM (src-tauri/src/)"]
        TauriCore["Tauri 2.0 Runtime Core"]
        TpeBridge["tpe_bridge.rs (Raw TCP Sockets for nexo/OPI/CMI)"]
        PrinterSpool["printer.rs (Raw Win32 / CUPS ESC/POS Bytecode Spooler)"]
        HardwareWedge["scanner.rs (Raw OS Barcode Wedge Hook)"]
    end

    Frontend <--> IPCBridge
    IPCBridge <--> RustCore
```

### 1.1 Architectural Comparison Matrix
| Performance Metric | Traditional Electron App | KASPI Tauri 2.0 Desktop | Improvement Factor |
| :--- | :--- | :--- | :--- |
| **Idle Memory Footprint (RAM)** | 280 MB – 520 MB | **14 MB – 32 MB** | **16x Less RAM** |
| **Application Installer Footprint** | 120 MB – 240 MB | **< 15 MB (.msi / .dmg)** | **10x Smaller Download** |
| **Cold Startup Latency** | 3.5s – 7.2s | **0.38s – 0.65s** | **8x Faster Launch** |
| **Network Socket Access** | Restricted by Chrome Sandbox | **Unrestricted Native OS TCP/UDP Sockets** | **Direct Hardware Access** |
| **Direct Hardware Printing** | Slow OS Print Dialog | **Direct Raw Bytecode to Thermal Head** | **Zero UI Latency** |

---

## 2. Low-Level Rust Subsystem Implementation (`src-tauri/src/`)

### 2.1 Native TCP Socket TPE Bridge (`tpe_bridge.rs`)
Directly communicates with local network payment terminals:
- `connect_tpe_tcp(ip: String, port: u16)`: Opens a persistent non-blocking asynchronous TCP stream.
- `send_tpe_frame(frame: Vec<u8>)`: Transmits raw binary or XML protocol frames with LRC checksum calculation.
- `probe_tpe_endpoint(ip: String, port: u16)`: High-speed 500ms network ping verifying terminal presence.

### 2.2 Direct ESC/POS Thermal Printing Spooler
- On Windows: Invokes the native Win32 Spooler API (`winspool.drv` via `OpenPrinterW`, `StartDocPrinterW`, `WritePrinter`).
- On Linux / macOS: Spools raw byte streams directly to CUPS or character device nodes (`/dev/usb/lp0`, `/dev/ttyUSB0`).
- Generates raw ESC/POS commands: Paper cut (`GS V 66 0`), cash drawer kick pulse (`ESC p 0 25 250`), and bold text formatting.

---

## 3. Offline-First Edge Synchronization Engine (`src/client/sync-engine.ts`)

In rural or dense urban Moroccan commercial centers, internet connectivity frequently drops due to cell congestion or power outages. The KASPI synchronization engine ensures **uninterrupted continuous operation**:

```mermaid
sequenceDiagram
    autonumber
    participant Cashier as Cashier Terminal
    participant Dexie as Local Dexie.js (IndexedDB)
    participant SyncEngine as Client Sync Worker
    participant Server as KASPI Cloud Backend (/api/v1/sync/batch)
    participant DB as PostgreSQL Cluster

    Note over Cashier,Dexie: INTERNET DROPPED (OFFLINE MODE)
    Cashier->>Dexie: Commit Sale (Generate Client UUID, Ticket #0042)
    Dexie->>Dexie: Write to offlineSales & syncQueue (status: PENDING)
    Cashier->>Cashier: Print Fiscal Thermal Receipt Immediately (0ms wait)
    
    Note over SyncEngine,Server: INTERNET RESTORED (AUTO-DETECT)
    SyncEngine->>SyncEngine: Heartbeat Ping Succeeded
    SyncEngine->>Dexie: Read PENDING Batch (up to 50 sales)
    SyncEngine->>Server: POST /api/v1/sync/batch (Encrypted Payload)
    Server->>DB: Atomic Upsert & Decrement Stock (Idempotency Key Check)
    Server-->>SyncEngine: HTTP 200 OK (Confirmed Order IDs)
    SyncEngine->>Dexie: Mark syncQueue items as SYNCED
```

### 3.1 Idempotency & Conflict Resolution
- **Client-Side UUID Generation:** Every offline sale is tagged with a cryptographic UUID `clientOfflineId` before being written to IndexedDB.
- **Deduplication:** When the batch is pushed to `/api/v1/sync/batch`, PostgreSQL checks the `OfflineSyncRecord` unique index. If a network blip caused duplicate submissions, the server recognizes the existing UUID, skips re-insertion, and returns success with zero double-counting.
- **Stock Decrement Reconciliation:** Inventory counts are decremented additively upon receipt of synced sales, preventing negative stock overwrite bugs.
