/**
 * ============================================================================
 * KASPI AI — UNIVERSAL WORKFLOW AUTOMATION ENGINE
 * Natural-language workflow compiler -> structured Triggers, Conditions,
 * Multi-Step Actions, Schedules, Delays, Webhooks, Retry Policies & Audit Logs.
 * ============================================================================
 */

export type WorkflowTriggerType =
  | "new_order"
  | "low_stock"
  | "product_published"
  | "website_offline"
  | "new_customer_message"
  | "schedule_recurring"
  | "incoming_webhook";

export interface WorkflowCondition {
  field: string;
  operator: "eq" | "lte" | "gte" | "contains";
  value: string | number;
}

export interface WorkflowActionStep {
  stepId: string;
  order: number;
  title: string;
  targetServiceId: string;
  actionKey: string;
  requiresApproval: boolean;
  delaySeconds?: number;
  payloadTemplate: Record<string, unknown>;
}

export interface WorkflowExecutionRun {
  runId: string;
  executedAt: string;
  mode: "dry_run_test" | "live_authorized";
  status: "completed" | "awaiting_approval" | "partial_failed";
  stepResults: Array<{
    stepId: string;
    title: string;
    outcome: "executed" | "simulated_ok" | "awaiting_approval" | "failed";
    detail: string;
  }>;
}

export interface WorkflowRule {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  trigger: WorkflowTriggerType;
  scheduleCron?: string;
  conditions: WorkflowCondition[];
  actions: WorkflowActionStep[];
  retryPolicy: { maxRetries: number; backoffSeconds: number };
  createdAt: string;
  updatedAt: string;
  lastRun?: WorkflowExecutionRun;
}

export function parseNaturalLanguageWorkflow(prompt: string): Omit<WorkflowRule, "id" | "createdAt" | "updatedAt"> {
  const lower = prompt.toLowerCase();

  let trigger: WorkflowTriggerType = "new_order";
  let conditions: WorkflowCondition[] = [];
  let name = "Custom KASPI Automation";
  let scheduleCron: string | undefined;

  if (/(inventory|stock|units|مخزون|الكمية|نفاد)/i.test(lower)) {
    trigger = "low_stock";
    name = "Low Inventory Alert & Supplier Reorder Flow";
    const numMatch = lower.match(/(\d+)/);
    conditions = [{ field: "stockQuantity", operator: "lte", value: numMatch ? Number(numMatch[1]) : 5 }];
  } else if (/(publish|new product|نشر منتج|منتج جديد)/i.test(lower)) {
    trigger = "product_published";
    name = "Product Launch Omnichannel Marketing Flow";
  } else if (/(offline|down|uptime|متوقف|سقط|توقف الموقع)/i.test(lower)) {
    trigger = "website_offline";
    name = "Website Downtime Diagnostics & Alert Flow";
  } else if (/(every|daily|weekly|cron|كل يوم|أسبوعيا|مجدول)/i.test(lower)) {
    trigger = "schedule_recurring";
    scheduleCron = /weekly|أسبوع/i.test(lower) ? "0 9 * * 1" : "0 9 * * *";
    name = "Scheduled Autonomous Business Task";
  } else if (/(message|dm|chat|support|رسالة|عميل|زبون)/i.test(lower)) {
    trigger = "new_customer_message";
    name = "AI Customer Support Auto-Response Flow";
  } else if (/(order|طلب|طلبية|مبيعات)/i.test(lower)) {
    trigger = "new_order";
    name = "New Order Notification, CRM & Invoice Flow";
  }

  const actions: WorkflowActionStep[] = [];
  let order = 1;

  if (/(whatsapp|واتساب)/i.test(lower)) {
    actions.push({
      stepId: `step-${order}`,
      order: order++,
      title: "Prepare / Send WhatsApp Notification",
      targetServiceId: "whatsapp_business",
      actionKey: "send_notification",
      requiresApproval: true,
      payloadTemplate: { channel: "whatsapp", message: "Order/Alert update from {{storeName}}" },
    });
  }
  if (/(crm|hubspot|salesforce|zoho|monday|سجل العملاء)/i.test(lower)) {
    const target = lower.includes("hubspot") ? "hubspot" : lower.includes("monday") ? "monday" : "hubspot";
    actions.push({
      stepId: `step-${order}`,
      order: order++,
      title: `Update ${target.toUpperCase()} CRM Record`,
      targetServiceId: target,
      actionKey: "upsert_contact",
      requiresApproval: false,
      payloadTemplate: { source: "kaspi_pos" },
    });
  }
  if (/(invoice|pdf|فاتورة)/i.test(lower)) {
    actions.push({
      stepId: `step-${order}`,
      order: order++,
      title: "Generate Official KASPI PDF Invoice",
      targetServiceId: "kaspi_native_store",
      actionKey: "generate_invoice",
      requiresApproval: false,
      payloadTemplate: { format: "pdf_tva_20" },
    });
  }
  if (/(supplier|مورد|شراء)/i.test(lower)) {
    actions.push({
      stepId: `step-${order}`,
      order: order++,
      title: "Create Supplier Replenishment Draft",
      targetServiceId: "kaspi_native_store",
      actionKey: "create_purchase_order_draft",
      requiresApproval: true,
      payloadTemplate: { qty: 20 },
    });
  }
  if (/(instagram|انستغرام|إنستغرام)/i.test(lower)) {
    actions.push({
      stepId: `step-${order}`,
      order: order++,
      title: "Generate & Stage Instagram Post Draft",
      targetServiceId: "instagram",
      actionKey: "draft_carousel",
      requiresApproval: true,
      payloadTemplate: { tone: "premium" },
    });
  }
  if (/(facebook|فيسبوك)/i.test(lower)) {
    actions.push({
      stepId: `step-${order}`,
      order: order++,
      title: "Generate & Stage Facebook Page Post",
      targetServiceId: "facebook",
      actionKey: "draft_post",
      requiresApproval: true,
      payloadTemplate: { audience: "store_followers" },
    });
  }
  if (/(linkedin|لينكد)/i.test(lower)) {
    actions.push({
      stepId: `step-${order}`,
      order: order++,
      title: "Prepare LinkedIn Product Announcement",
      targetServiceId: "linkedin",
      actionKey: "draft_article_post",
      requiresApproval: true,
      payloadTemplate: { format: "b2b_launch" },
    });
  }
  if (/(slack|telegram|discord|webhook|alert|نبهني|أخبرني)/i.test(lower) || actions.length === 0) {
    const target = lower.includes("slack")
      ? "slack"
      : lower.includes("telegram")
      ? "telegram"
      : lower.includes("discord")
      ? "discord"
      : "custom_webhook";
    actions.push({
      stepId: `step-${order}`,
      order: order++,
      title: "Investigate & Dispatch Real-Time Alert",
      targetServiceId: target,
      actionKey: "dispatch_alert",
      requiresApproval: false,
      payloadTemplate: { priority: "high" },
    });
  }

  return {
    name,
    description: prompt.trim(),
    enabled: true,
    trigger,
    scheduleCron,
    conditions,
    actions,
    retryPolicy: { maxRetries: 2, backoffSeconds: 15 },
  };
}
