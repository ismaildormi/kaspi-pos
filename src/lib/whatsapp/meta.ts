import { IWhatsAppProvider, WhatsAppMessageResult } from "./types";
import { cleanMoroccanPhone } from "../whatsapp";

export class MetaWhatsAppProvider implements IWhatsAppProvider {
  name = "meta";
  private phoneId: string;
  private token: string;

  constructor(phoneId?: string, token?: string) {
    this.phoneId = phoneId || process.env.WHATSAPP_INSTANCE_ID || "";
    this.token = token || process.env.WHATSAPP_API_TOKEN || "";
  }

  async send(to: string, message: string): Promise<WhatsAppMessageResult> {
    const cleanedNumber = cleanMoroccanPhone(to);
    if (!cleanedNumber) {
      return {
        success: false,
        error: "Numéro de téléphone invalide.",
        provider: this.name,
      };
    }

    if (!this.phoneId || !this.token || this.token === "mock_token") {
      console.info(`[WhatsApp Meta Cloud Mock Mode] To: ${cleanedNumber}\nMessage: ${message}`);
      return {
        success: true,
        messageId: `mock_meta_${Date.now()}`,
        provider: this.name,
      };
    }

    try {
      const url = `https://graph.facebook.com/v19.0/${this.phoneId}/messages`;
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.token}`,
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to: cleanedNumber,
          type: "text",
          text: { preview_url: false, body: message },
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error?.message || `HTTP ${res.status}`);
      }

      return {
        success: true,
        messageId: data.messages?.[0]?.id || `meta_${Date.now()}`,
        provider: this.name,
      };
    } catch (err: any) {
      console.error("[Meta Cloud WhatsApp Error]:", err);
      return {
        success: false,
        error: err.message || "Erreur lors de l'envoi WhatsApp via Meta API",
        provider: this.name,
      };
    }
  }
}
