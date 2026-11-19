import React from "react";
import { PublicEmbedWidgetClient } from "@/components/zebra-portal/PublicEmbedWidgetClient";

export const metadata = {
  title: "HEYUKA Embedded AI Product Widget",
  description: "Tenant-isolated HEYUKA AI product widget",
};

export default async function EmbeddedMiniProductPage({
  params,
}: {
  params: Promise<{ productId: string }>;
}) {
  const { productId } = await params;
  return <PublicEmbedWidgetClient productId={productId} />;
}
