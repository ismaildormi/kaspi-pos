"use client";

import Dexie, { type Table } from "dexie";

/**
 * X × Zebra — Lightweight Local Conversation Thread Store (v7.4)
 * Stores compact text-only snapshots of conversations in an isolated Dexie
 * IndexedDB store (`kaspi_zebra_x_threads_v1`) so Gemini-style sidebar search,
 * pinning, renaming, and deletion operate at 0 server cost while volatile React
 * states & WASM workers still reset cleanly to 0 RAM on chat close.
 */

export interface StoredThreadMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: number;
}

export interface StoredChatThread {
  id: string;
  title: string;
  pinned: boolean;
  updatedAt: number;
  preview: string;
  messages: StoredThreadMessage[];
}

class ZebraThreadsDexie extends Dexie {
  threads!: Table<StoredChatThread, string>;

  constructor() {
    super("kaspi_zebra_x_threads_v1");
    this.version(1).stores({
      threads: "id, updatedAt, pinned",
    });
  }
}

/**
 * Persistent HEYUKA conversation store powered by IndexedDB (Dexie).
 * Stores threads permanently until explicitly deleted by the user.
 */
let db: ZebraThreadsDexie | null = null;

function getDb(): ZebraThreadsDexie | null {
  if (typeof window === "undefined") return null;
  if (!db) db = new ZebraThreadsDexie();
  return db;
}

function deriveThreadTitle(messages: StoredThreadMessage[]): string {
  const firstUser = messages.find((m) => m.role === "user" && m.content.trim());
  const raw = (firstUser?.content || messages[0]?.content || "New Chat")
    .replace(/\[ATTACHED DOCUMENT CONTENT[\s\S]*/g, "")
    .replace(/\[KASPI_[A-Z_]+:[^\]]+\]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  return raw.slice(0, 48) || "New Chat";
}

function sanitizeMessages(
  messages: Array<{ id: string; role: string; content: string }>
): StoredThreadMessage[] {
  return messages
    .filter((m) => m.role === "user" || m.role === "assistant")
    .slice(-60)
    .map((m) => ({
      id: m.id,
      role: m.role as "user" | "assistant",
      // Strip giant inline base64 data URLs before persisting to keep IndexedDB nimble
      content: String(m.content || "")
        .replace(/data:[a-z0-9/+.-]+;base64,[A-Za-z0-9+/=]{120,}/gi, "[MEDIA_ATTACHMENT]")
        .slice(0, 12_000),
      createdAt: Date.now(),
    }));
}

export async function listChatThreads(searchQuery = ""): Promise<StoredChatThread[]> {
  const store = getDb();
  if (!store) return [];
  try {
    const all = await store.threads.toArray();
    const sorted = all.sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      return b.updatedAt - a.updatedAt;
    });
    const q = searchQuery.trim().toLowerCase();
    if (!q) return sorted;
    return sorted.filter(
      (th) =>
        th.title.toLowerCase().includes(q) ||
        th.preview.toLowerCase().includes(q) ||
        th.messages.some((m) => m.content.toLowerCase().includes(q))
    );
  } catch {
    return [];
  }
}

export async function saveChatThreadSnapshot(params: {
  id: string;
  messages: Array<{ id: string; role: string; content: string }>;
  existingTitle?: string;
  pinned?: boolean;
}): Promise<StoredChatThread | null> {
  const store = getDb();
  const cleanMsgs = sanitizeMessages(params.messages);
  if (!store || cleanMsgs.length === 0) return null;

  try {
    const prev = await store.threads.get(params.id);
    const title = params.existingTitle || prev?.title || deriveThreadTitle(cleanMsgs);
    const lastContent = cleanMsgs[cleanMsgs.length - 1]?.content || "";
    const record: StoredChatThread = {
      id: params.id,
      title,
      pinned: params.pinned ?? prev?.pinned ?? false,
      updatedAt: Date.now(),
      preview: lastContent.replace(/\[KASPI_[A-Z_]+:[^\]]+\]/g, "").slice(0, 90),
      messages: cleanMsgs,
    };
    await store.threads.put(record);
    return record;
  } catch {
    return null;
  }
}

export async function togglePinChatThread(id: string): Promise<void> {
  const store = getDb();
  if (!store) return;
  const item = await store.threads.get(id);
  if (!item) return;
  await store.threads.update(id, { pinned: !item.pinned });
}

export async function renameChatThread(id: string, newTitle: string): Promise<void> {
  const store = getDb();
  const clean = newTitle.trim().slice(0, 64);
  if (!store || !clean) return;
  await store.threads.update(id, { title: clean });
}

export async function deleteChatThread(id: string): Promise<void> {
  const store = getDb();
  if (!store) return;
  await store.threads.delete(id);
}
