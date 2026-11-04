import { getSupabaseAdmin } from "./supabase-server";

export interface KitchenTicketEventPayload {
  event: "ticket:created" | "ticket:updated" | "ticket:deleted";
  ticketId: string;
  ticketNumber?: string;
  status?: string;
  timestamp: string;
  ticket?: any;
}

/**
 * Server-side function to broadcast a Kitchen Ticket event across Supabase Realtime.
 * Every connected KDS screen listening to this tenant's channel will receive the payload instantly.
 */
export async function broadcastKitchenTicket(
  tenantId: string,
  event: "ticket:created" | "ticket:updated" | "ticket:deleted",
  ticket: any
): Promise<void> {
  try {
    const admin = getSupabaseAdmin();
    if (!admin) {
      console.warn("[Supabase Realtime] Supabase admin client unavailable; skipping broadcast.");
      return;
    }

    const channelName = `kds-tenant-${tenantId}`;
    const channel = admin.channel(channelName);

    await channel.send({
      type: "broadcast",
      event: "ticket_change",
      payload: {
        event,
        ticketId: ticket.id,
        ticketNumber: ticket.ticketNumber,
        status: ticket.status,
        timestamp: new Date().toISOString(),
        ticket,
      } satisfies KitchenTicketEventPayload,
    });

    console.log(`[Supabase Realtime] Broadcasted ${event} to channel ${channelName}`);
  } catch (err) {
    console.warn("[Supabase Realtime] Failed to broadcast ticket event:", err);
  }
}
