import { IWhatsAppProvider, WhatsAppMessageResult } from "./types";
import { cleanMoroccanPhone } from "../whatsapp";

export class UltraMsgProvider implements IWhatsAppProvider {
  name = "ultramsg";
  private instanceId: string;
  private token: string;

  constructor(instanceId?: string, token?: string) {
    this.instanceId = instanceId || process.env.WHATSAPP_INSTANCE_ID || "";
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

    if (!this.instanceId || !this.token || this.token === "mock_token") {
      console.info(`[WhatsApp UltraMsg Mock Mode] To: ${cleanedNumber}\nMessage: ${message}`);
      return {
        success: true,
        messageId: `mock_umsg_${Date.now()}`,
        provider: this.name,
      };
    }

    try {
      const url = `https://api.ultramsg.com/${this.instanceId}/messages/chat`;
      const params = new URLSearchParams();
      params.append("token", this.token);
      params.append("to", cleanedNumber);
      params.append("body", message);

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: params.toString(),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || `HTTP ${res.status}`);
      }

      return {
        success: true,
        messageId: data.id?.toString() || data.message || `umsg_${Date.now()}`,
        provider: this.name,
      };
    } catch (err: any) {
      console.error("[UltraMsg WhatsApp Error]:", err);
      return {
        success: false,
        error: err.message || "Erreur lors de l'envoi WhatsApp via UltraMsg",
        provider: this.name,
      };
    }
  }
}
