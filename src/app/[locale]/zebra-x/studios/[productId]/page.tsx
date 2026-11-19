import React from "react";
import { HEYUKAPlatformShell } from "@/components/zebra-portal/HEYUKAPlatformShell";
import { PlatformSingleStudioView } from "@/components/zebra-portal/PlatformSingleStudioView";
import { getSpecializedProductById } from "@/lib/heyuka/ecosystem/products-catalog";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ productId: string }>;
}) {
  const { productId } = await params;
  const prod = getSpecializedProductById(productId);
  return {
    title: prod ? `${prod.name} • HEYUKA AI Ecosystem` : "HEYUKA Specialized Studio",
    description: prod?.tagline.en || "Specialized AI Product Workspace",
  };
}

export default async function ZebraSingleStudioPage({
  params,
}: {
  params: Promise<{ productId: string }>;
}) {
  const { productId } = await params;
  const prod = getSpecializedProductById(productId);
  return (
    <HEYUKAPlatformShell
      activeNav="studios"
      pageTitle={prod?.name || "Specialized Studio"}
      pageSubtitle={prod?.shortTag || "Dedicated Workspace + Isolated AI Chat"}
    >
      <PlatformSingleStudioView productId={productId} />
    </HEYUKAPlatformShell>
  );
}
