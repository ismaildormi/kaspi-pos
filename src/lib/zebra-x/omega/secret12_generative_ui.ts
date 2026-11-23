import { z } from "zod";

/**
 * Secret #12 (`v88.0`): Generative Morphing UI Contracts & Safe Inline Marker Builders.
 * Renders rich interactive Calculators, Decision Matrices & Market Charts inline inside chat bubbles.
 */
export const ProfitCalculatorWidgetSchema = z.object({
  kind: z.literal("profit_calculator"),
  title: z.string(),
  currency: z.string().default("MAD"),
  unitPrice: z.number().min(0),
  unitCost: z.number().min(0),
  monthlyUnits: z.number().int().min(1),
  vatPct: z.number().min(0).max(100),
  discountPct: z.number().min(0).max(90).default(0),
});

export const MarketChartWidgetSchema = z.object({
  kind: z.literal("market_chart"),
  title: z.string(),
  subtitle: z.string().optional(),
  unitLabel: z.string().default("MAD"),
  bars: z
    .array(
      z.object({
        label: z.string(),
        value: z.number(),
        accent: z.string().optional(),
      })
    )
    .min(1)
    .max(12),
});

export const DecisionMatrixWidgetSchema = z.object({
  kind: z.literal("decision_matrix"),
  title: z.string(),
  weights: z.object({
    benefit: z.number().min(0).max(1),
    speed: z.number().min(0).max(1),
    lowRisk: z.number().min(0).max(1),
  }),
  options: z
    .array(
      z.object({
        name: z.string(),
        benefit: z.number().min(1).max(10),
        speed: z.number().min(1).max(10),
        lowRisk: z.number().min(1).max(10),
      })
    )
    .min(2)
    .max(8),
});

export const MorphWidgetPayloadSchema = z.discriminatedUnion("kind", [
  ProfitCalculatorWidgetSchema,
  MarketChartWidgetSchema,
  DecisionMatrixWidgetSchema,
]);

export type MorphWidgetPayload = z.infer<typeof MorphWidgetPayloadSchema>;

function encodeMorphBase64(payload: MorphWidgetPayload): string {
  const json = JSON.stringify(payload);
  if (typeof Buffer !== "undefined") {
    return Buffer.from(json, "utf8").toString("base64");
  }
  return btoa(unescape(encodeURIComponent(json)));
}

export function buildMorphWidgetMarker(payload: MorphWidgetPayload): string {
  const validated = MorphWidgetPayloadSchema.parse(payload);
  return `[KASPI_MORPH_WIDGET:${encodeMorphBase64(validated)}]`;
}
