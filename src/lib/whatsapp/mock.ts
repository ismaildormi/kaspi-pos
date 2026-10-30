import { IWhatsAppProvider, WhatsAppMessageResult } from "./types";
import { cleanMoroccanPhone } from "../whatsapp";

export class MockWhatsAppProvider implements IWhatsAppProvider {
  name = "mock";

  async send(to: string, message: string): Promise<WhatsAppMessageResult> {
    const cleaned = cleanMoroccanPhone(to);
    console.info(`[MOCK WhatsApp Dispatch] Destination: ${cleaned}\nContent:\n${message}`);
    return {
      success: true,
      messageId: `mock_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      provider: this.name,
    };
  }
}
