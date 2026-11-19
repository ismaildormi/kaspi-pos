"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useLocale } from "next-intl";
import { ArrowLeft, PackagePlus, ShieldCheck, Sparkles } from "lucide-react";
import {
  getSpecializedProductById,
  SPECIALIZED_PRODUCTS,
} from "@/lib/heyuka/ecosystem/products-catalog";
import type { PortalLocale } from "./platform-data";
import { StudioDomainChat } from "./StudioDomainChat";
import {
  BackgroundStudioWorkbench,
  CodingStudioWorkbench,
  ImageStudioWorkbench,
  logArtifactToVault,
  ThreeDStudioWorkbench,
} from "./StudioWorkbenchesA";
import {
  AudioStudioWorkbench,
  ConversionStudioWorkbench,
  DataStudioWorkbench,
  VideoAndShortsWorkbench,
  WebAndDocWorkbench,
} from "./StudioWorkbenchesB";

export function PlatformSingleStudioView({ productId }: { productId: string }) {
  const localeRaw = useLocale();
  const locale: PortalLocale =
    localeRaw === "ar" ? "ar" : localeRaw === "en" ? "en" : "fr";
  const product = getSpecializedProductById(productId) || SPECIALIZED_PRODUCTS[0];
  const [workspaceContext, setWorkspaceContext] = useState("");
  const [savedNotice, setSavedNotice] = useState(false);

  const renderWorkbench = () => {
    switch (product.id) {
      case "coding-studio":
        return <CodingStudioWorkbench onContextChange={setWorkspaceContext} />;
      case "background-studio":
        return <BackgroundStudioWorkbench />;
      case "image-studio":
        return <ImageStudioWorkbench />;
      case "3d-studio":
        return <ThreeDStudioWorkbench />;
      case "video-studio":
        return <VideoAndShortsWorkbench mode="video" />;
      case "shorts-studio":
        return <VideoAndShortsWorkbench mode="shorts" />;
      case "audio-studio":
        return <AudioStudioWorkbench />;
      case "conversion-studio":
        return <ConversionStudioWorkbench />;
      case "data-studio":
        return <DataStudioWorkbench />;
      case "web-studio":
        return <WebAndDocWorkbench mode="web" />;
      case "document-studio":
        return <WebAndDocWorkbench mode="document" />;
      case "automation-studio":
        return <WebAndDocWorkbench mode="automation" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Studio Banner */}
      <section className="kaspi-glass-card kaspi-polar-aurora-orbit relative rounded-3xl p-5 sm:p-7 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Link
              href={`/${locale}/zebra-x/studios`}
              className="kaspi-glass-btn rounded-full px-3 py-1.5 text-xs font-bold inline-flex items-center gap-1"
            >
              <ArrowLeft className={`w-3.5 h-3.5 ${locale === "ar" ? "rotate-180" : ""}`} />
              <span>All Studios</span>
            </Link>
            <span className="px-2.5 py-1 rounded-full kaspi-glass-surface text-[11px] font-mono font-bold text-rose-500">
              {product.shortTag}
            </span>
          </div>

          <Link
            href={`/${locale}/zebra-x/products`}
            className="kaspi-primary-cta-btn rounded-2xl px-4 py-2 text-xs font-bold inline-flex items-center gap-1.5"
          >
            <PackagePlus className="w-3.5 h-3.5" />
            <span>Create Custom Website App / Widget</span>
          </Link>
        </div>

        <h1 className="text-2xl sm:text-3xl font-black text-[var(--kaspi-text-primary)]">
          {product.name}
        </h1>
        <p className="text-xs sm:text-sm text-[var(--kaspi-text-secondary)] max-w-3xl leading-relaxed">
          {product.description[locale]}
        </p>

        <div className="flex flex-wrap items-center gap-2 text-[11px] text-[var(--kaspi-text-muted)]">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full kaspi-frosted-surface">
            <ShieldCheck className="w-3.5 h-3.5 text-rose-500" />
            {product.sharedEngineDisclosure[locale]}
          </span>
          {product.allowedApiEndpoints.map((ep) => (
            <span
              key={ep}
              dir="ltr"
              className="font-mono px-2.5 py-1 rounded-full kaspi-frosted-surface text-rose-500"
            >
              {ep}
            </span>
          ))}
        </div>
      </section>

      {/* Real Functional Domain Workbench */}
      {renderWorkbench()}

      {/* Isolated Domain AI Chat */}
      {savedNotice && (
        <div className="kaspi-frosted-surface rounded-2xl px-4 py-2 text-xs font-bold text-rose-500">
          Saved assistant output directly to Real Output Vault!
        </div>
      )}

      <StudioDomainChat
        productId={product.id}
        product={product}
        workspaceContext={workspaceContext}
        onSaveOutputText={async (txt) => {
          await logArtifactToVault({
            taskName: `${product.name} Assistant Output`,
            productId: product.id,
            actualModel: "heyuka-omni",
            actualEngine: "Studio Domain Specialist",
            status: "completed",
            truthClass: "real_output",
            durationMs: 50,
            format: "md",
            inlineTextPreview: txt,
          });
          setSavedNotice(true);
          setTimeout(() => setSavedNotice(false), 2500);
        }}
      />
    </div>
  );
}
