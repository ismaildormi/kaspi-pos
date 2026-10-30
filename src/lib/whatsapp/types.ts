export interface WhatsAppMessageResult {
  success: boolean;
  messageId?: string;
  error?: string;
  provider: string;
}

export interface IWhatsAppProvider {
  name: string;
  send(to: string, message: string): Promise<WhatsAppMessageResult>;
}
