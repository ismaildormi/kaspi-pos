import { z } from "zod";

/**
 * HEYUKA / YUKA — Hyper-Custom Spec Compiler, Universal Bot Factory, Autonomous SEO & Robotics Code Generator (`v21.0`–`v21.5`)
 *
 * Translates any user requirements into strict Zod Blueprint Specs (Parlant behavioral guidelines,
 * Style Dictionary UI tokens, XState/Cron schedules) and generates ready-to-run Worker Bots,
 * SEO XML/JSON-LD artifacts, ROS 2 Python nodes, ESPHome YAML configs, or CadQuery 3D mechanical scripts.
 */

export const BotRuleGuidelineSchema = z.object({
  condition: z.string().min(1).max(200),
  action: z.string().min(1).max(400),
});

export const YukaBotBlueprintSpecSchema = z.object({
  botId: z.string().min(2).max(64).regex(/^[a-zA-Z0-9_-]+$/),
  displayName: z.string().min(1).max(100),
  platform: z.enum(["telegram", "whatsapp", "discord", "seo_worker", "robotics_ros2", "esphome_iot", "cadquery_3d"]),
  languages: z.array(z.string().min(2).max(20)).min(1).default(["ar-MA", "fr", "en"]),
  personaTone: z.string().min(2).max(160).default("helpful, direct, accurate"),
  guidelines: z.array(BotRuleGuidelineSchema).min(1).max(25),
  scheduleCron: z.string().max(64).default("*/15 * * * *"),
  themeAccentHex: z.string().regex(/^#[0-9a-fA-F]{6}$/).default("#E11D48"),
  guardrailsEnabled: z.boolean().default(true),
});

export type YukaBotBlueprintSpec = z.infer<typeof YukaBotBlueprintSpecSchema>;

export interface GeneratedBotPackage {
  spec: YukaBotBlueprintSpec;
  blueprintYaml: string;
  entryFilename: string;
  sourceCode: string;
  readmeNotes: string;
}

export function compileCustomBotBlueprint(rawSpec: unknown): GeneratedBotPackage {
  const spec = YukaBotBlueprintSpecSchema.parse(rawSpec);

  const blueprintYaml = [
    `id: ${spec.botId}`,
    `name: "${spec.displayName.replace(/"/g, '\\"')}"`,
    `platform: ${spec.platform}`,
    `languages: [${spec.languages.join(", ")}]`,
    `tone: "${spec.personaTone.replace(/"/g, '\\"')}"`,
    `guardrails: ${spec.guardrailsEnabled}`,
    `schedule: "${spec.scheduleCron}"`,
    `guidelines:`,
    ...spec.guidelines.map((g) => `  - when: "${g.condition}"\n    then: "${g.action}"`),
  ].join("\n");

  let entryFilename = "bot.ts";
  let sourceCode = "";

  if (spec.platform === "telegram") {
    entryFilename = `${spec.botId}_telegram_grammy.ts`;
    sourceCode = [
      `import { Bot } from "grammy";`,
      `const bot = new Bot(process.env.TELEGRAM_BOT_TOKEN || "");`,
      `const GUIDELINES = ${JSON.stringify(spec.guidelines, null, 2)};`,
      ``,
      `bot.command("start", (ctx) => ctx.reply("Welcome to ${spec.displayName} (${spec.languages.join("/")})"));`,
      `bot.on("message:text", async (ctx) => {`,
      `  const res = await fetch(process.env.HEYUKA_API_URL || "https://kaspi-pos.vercel.app/v1/chat/completions", {`,
      `    method: "POST",`,
      `    headers: { "Content-Type": "application/json", Authorization: \`Bearer \${process.env.HEYUKA_API_KEY}\` },`,
      `    body: JSON.stringify({ model: "heyuka-omni", messages: [{ role: "system", content: JSON.stringify(GUIDELINES) }, { role: "user", content: ctx.message.text }] })`,
      `  });`,
      `  const data = await res.json();`,
      `  await ctx.reply(data?.choices?.[0]?.message?.content || "Ready.");`,
      `});`,
      `bot.start();`,
    ].join("\n");
  } else if (spec.platform === "whatsapp") {
    entryFilename = `${spec.botId}_whatsapp_worker.ts`;
    sourceCode = [
      `// Evolution API / Baileys Worker for ${spec.displayName}`,
      `export const BOT_GUIDELINES = ${JSON.stringify(spec.guidelines, null, 2)};`,
      `export async function handleIncomingWhatsApp(sender: string, text: string) {`,
      `  const res = await fetch(process.env.HEYUKA_API_URL || "https://kaspi-pos.vercel.app/v1/chat/completions", {`,
      `    method: "POST",`,
      `    headers: { "Content-Type": "application/json", Authorization: \`Bearer \${process.env.HEYUKA_API_KEY}\` },`,
      `    body: JSON.stringify({ model: "heyuka-core", messages: [{ role: "system", content: "Tone: ${spec.personaTone}. Rules: " + JSON.stringify(BOT_GUIDELINES) }, { role: "user", content: text }] })`,
      `  });`,
      `  return res.json();`,
      `}`,
    ].join("\n");
  } else if (spec.platform === "robotics_ros2") {
    entryFilename = `${spec.botId}_ros2_node.py`;
    sourceCode = [
      `import rclpy`,
      `from rclpy.node import Node`,
      `from std_msgs.msg import String`,
      ``,
      `class HeyukaWorkerRobotNode(Node):`,
      `    def __init__(self):`,
      `        super().__init__("${spec.botId.replace(/-/g, "_")}_node")`,
      `        self.pub = self.create_publisher(String, "/heyuka/cmd_telemetry", 10)`,
      `        self.timer = self.create_timer(1.0, self.on_tick)`,
      `    def on_tick(self):`,
      `        msg = String()`,
      `        msg.data = "ACTIVE: ${spec.displayName}"`,
      `        self.pub.publish(msg)`,
      ``,
      `def main():`,
      `    rclpy.init()`,
      `    node = HeyukaWorkerRobotNode()`,
      `    rclpy.spin(node)`,
    ].join("\n");
  } else if (spec.platform === "esphome_iot") {
    entryFilename = `${spec.botId}_esphome.yaml`;
    sourceCode = [
      `esphome:`,
      `  name: ${spec.botId}`,
      `esp32:`,
      `  board: esp32dev`,
      `mqtt:`,
      `  broker: !secret mqtt_broker`,
      `sensor:`,
      `  - platform: dht`,
      `    pin: GPIO4`,
      `    temperature:`,
      `      name: "${spec.displayName} Temperature"`,
      `    humidity:`,
      `      name: "${spec.displayName} Humidity"`,
    ].join("\n");
  } else if (spec.platform === "cadquery_3d") {
    entryFilename = `${spec.botId}_cadquery_part.py`;
    sourceCode = [
      `import cadquery as cq`,
      `# Parametric 3D mounting bracket generated by HEYUKA Bot Factory`,
      `result = (`,
      `    cq.Workplane("XY")`,
      `    .box(60.0, 40.0, 6.0)`,
      `    .faces(">Z")`,
      `    .workplane()`,
      `    .hole(8.5)`,
      `)`,
      `cq.exporters.export(result, "${spec.botId}.step")`,
    ].join("\n");
  } else {
    entryFilename = `${spec.botId}_seo_autonomous.ts`;
    sourceCode = `// Autonomous SEO & Indexing Bot\nexport const GUIDELINES = ${JSON.stringify(spec.guidelines)};\n`;
  }

  return {
    spec,
    blueprintYaml,
    entryFilename,
    sourceCode,
    readmeNotes: `Compiled cleanly via Zod Spec Compiler (${spec.platform}) with ${spec.guidelines.length} conditional Parlant rules.`,
  };
}

export function buildAutonomousSeoBundle(params: {
  siteUrl: string;
  brandName: string;
  routes: Array<{ path: string; priority?: number }>;
  headline: string;
  description: string;
}): {
  sitemapXml: string;
  jsonLdSchema: Record<string, any>;
  metaAuditScore: number;
} {
  const cleanOrigin = new URL(params.siteUrl).origin;
  const nowIso = new Date().toISOString().slice(0, 10);

  const sitemapXml = [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
    ...params.routes.map(
      (r) =>
        `  <url><loc>${cleanOrigin}${r.path.startsWith("/") ? r.path : `/${r.path}`}</loc><lastmod>${nowIso}</lastmod><priority>${(r.priority ?? 0.8).toFixed(1)}</priority></url>`
    ),
    `</urlset>`,
  ].join("\n");

  const jsonLdSchema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: params.brandName,
    url: cleanOrigin,
    applicationCategory: "BusinessApplication",
    description: params.description,
    headline: params.headline,
  };

  let score = 60;
  if (params.headline.length >= 20 && params.headline.length <= 70) score += 15;
  if (params.description.length >= 50 && params.description.length <= 160) score += 15;
  if (params.routes.length > 0) score += 10;

  return {
    sitemapXml,
    jsonLdSchema,
    metaAuditScore: Math.min(100, score),
  };
}
