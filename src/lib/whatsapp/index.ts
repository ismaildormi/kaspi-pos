import { IWhatsAppProvider, WhatsAppMessageResult } from "./types";
import { UltraMsgProvider } from "./ultramsg";
import { MetaWhatsAppProvider } from "./meta";
import { MockWhatsAppProvider } from "./mock";
import { prisma } from "@/server/db/prisma";

export * from "./types";
export * from "./ultramsg";
export * from "./meta";
export * from "./mock";

export function getWhatsAppProvider(): IWhatsAppProvider {
  const provider = (process.env.WHATSAPP_API_PROVIDER || "ultramsg").toLowerCase();

  switch (provider) {
    case "ultramsg":
      return new UltraMsgProvider();
    case "meta":
      return new MetaWhatsAppProvider();
    case "mock":
    default:
      return new MockWhatsAppProvider();
  }
}

/**
 * Sends an automated WhatsApp message through the configured business gateway
 */
export async function sendWhatsAppMessage(
  to: string,
  message: string
): Promise<WhatsAppMessageResult> {
  const provider = getWhatsAppProvider();
  return await provider.send(to, message);
}

/**
 * Sends a platform-wide administrative alert to the Super Admin's phone (+212687597267)
 */
export async function sendAdminWhatsAppAlert(message: string): Promise<WhatsAppMessageResult> {
  const adminNumber = process.env.ADMIN_WHATSAPP_NUMBER || "+212687597267";
  return await sendWhatsAppMessage(adminNumber, message);
}
