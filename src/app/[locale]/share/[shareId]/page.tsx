import React from "react";
import { SharedConversationEntryClient } from "@/components/heyuka/SharedConversationEntryClient";

export const metadata = {
  title: "Shared Conversation • HEYUKA",
  description: "Open shared HEYUKA conversation and continue instantly via Gmail.",
};

export default async function SharedChatPage({
  params,
}: {
  params: Promise<{ locale: string; shareId: string }>;
}) {
  const { locale, shareId } = await params;
  return <SharedConversationEntryClient locale={locale} shareId={shareId} />;
}
