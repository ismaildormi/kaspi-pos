/**
 * KASPI POS — Smart P0 Critical Alerting Engine (Layer 8)
 *
 * Suppresses routine noise and dispatches instant high-priority alerts
 * (WhatsApp / Telegram / Emergency Email Webhook) ONLY for P0 emergencies:
 *   1. BROKEN_INVOICE_OR_AUDIT_HASH_CHAIN
 *   2. FORGED_PAYMENT_WEBHOOK_SIGNATURE
 *   3. SUPER_ADMIN_UNAUTHORIZED_ACCESS_ATTEMPT
 *   4. OWNER_RIB_CHANGED_ALERT
 *   5. MASS_SCRAPING_OR_BRUTE_FORCE_AUTO_BANNED
 */

export type P0AlertType =
  | "BROKEN_INVOICE_OR_AUDIT_HASH_CHAIN"
  | "FORGED_PAYMENT_WEBHOOK_SIGNATURE"
  | "SUPER_ADMIN_UNAUTHORIZED_ACCESS_ATTEMPT"
  | "OWNER_RIB_CHANGED_ALERT"
  | "MASS_SCRAPING_OR_BRUTE_FORCE_AUTO_BANNED";

export interface P0AlertPayload {
  type: P0AlertType;
  severity: "P0_CRITICAL";
  tenantId?: string | null;
  actorId?: string | null;
  ipAddress?: string;
  summary: string;
  details?: Record<string, unknown>;
  timestampIso?: string;
}

const ALERT_DEDUP_WINDOW_MS = 60_000;
const recentAlertMap = new Map<string, number>();

/**
 * Dispatches an instant P0 critical alert without blocking the request thread.
 * Deduplicates identical alert keys within 60 seconds to prevent alert storms.
 */
export async function dispatchP0CriticalAlert(
  payload: Omit<P0AlertPayload, "severity" | "timestampIso">
): Promise<{ dispatched: boolean; channels: string[]; deduplicated?: boolean }> {
  const timestampIso = new Date().toISOString();
  const dedupKey = `${payload.type}:${payload.tenantId || "global"}:${payload.ipAddress || "unknown"}`;
  const lastSent = recentAlertMap.get(dedupKey);
  const now = Date.now();

  if (lastSent && now - lastSent < ALERT_DEDUP_WINDOW_MS) {
    return { dispatched: false, channels: [], deduplicated: true };
  }
  recentAlertMap.set(dedupKey, now);

  const fullPayload: P0AlertPayload = {
    ...payload,
    severity: "P0_CRITICAL",
    timestampIso,
  };

  const formattedMessage = [
    `[KASPI P0 SECURITY ALERT] ${fullPayload.type}`,
    `Time (UTC): ${timestampIso}`,
    `Tenant: ${fullPayload.tenantId || "PLATFORM_GLOBAL"}`,
    `IP: ${fullPayload.ipAddress || "unknown"}`,
    `Summary: ${fullPayload.summary}`,
  ].join("\n");

  const channels: string[] = [];
  const tasks: Promise<void>[] = [];

  // 1. Founder Emergency Webhook / Shuffle SOAR / Slack / Email Bridge
  const emergencyWebhookUrl = process.env.FOUNDER_EMERGENCY_WEBHOOK_URL?.trim();
  if (emergencyWebhookUrl) {
    channels.push("emergency_webhook");
    tasks.push(
      fetch(emergencyWebhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(process.env.FOUNDER_EMERGENCY_WEBHOOK_TOKEN
            ? { Authorization: `Bearer ${process.env.FOUNDER_EMERGENCY_WEBHOOK_TOKEN}` }
            : {}),
        },
        body: JSON.stringify(fullPayload),
        signal: AbortSignal.timeout(3000),
      })
        .then(() => undefined)
        .catch((err) => {
          console.error("[P0 Alerter] Emergency webhook failed:", err?.message || err);
        })
    );
  }

  // 2. Telegram Bot Emergency Channel (Zero-Cost Founder Alert)
  const telegramToken = process.env.TELEGRAM_ALERT_BOT_TOKEN?.trim();
  const telegramChatId = process.env.TELEGRAM_ALERT_CHAT_ID?.trim();
  if (telegramToken && telegramChatId) {
    channels.push("telegram");
    tasks.push(
      fetch(`https://api.telegram.org/bot${telegramToken}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: telegramChatId,
          text: formattedMessage,
        }),
        signal: AbortSignal.timeout(3000),
      })
        .then(() => undefined)
        .catch((err) => {
          console.error("[P0 Alerter] Telegram alert failed:", err?.message || err);
        })
    );
  }

  // 3. WhatsApp Cloud API Emergency Alert
  const whatsappToken = process.env.WHATSAPP_API_TOKEN?.trim();
  const whatsappPhoneId = process.env.WHATSAPP_PHONE_NUMBER_ID?.trim();
  const founderWhatsapp = process.env.FOUNDER_EMERGENCY_WHATSAPP?.trim();
  if (whatsappToken && whatsappPhoneId && founderWhatsapp) {
    channels.push("whatsapp");
    tasks.push(
      fetch(`https://graph.facebook.com/v19.0/${whatsappPhoneId}/messages`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${whatsappToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: founderWhatsapp,
          type: "text",
          text: { body: formattedMessage },
        }),
        signal: AbortSignal.timeout(3000),
      })
        .then(() => undefined)
        .catch((err) => {
          console.error("[P0 Alerter] WhatsApp alert failed:", err?.message || err);
        })
    );
  }

  if (tasks.length > 0) {
    await Promise.allSettled(tasks);
  } else {
    console.warn("[P0 CRITICAL ALERT]", JSON.stringify(fullPayload));
    channels.push("server_stderr");
  }

  return { dispatched: true, channels };
}
