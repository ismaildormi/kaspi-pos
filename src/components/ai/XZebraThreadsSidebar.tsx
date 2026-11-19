"use client";

import React, { useState } from "react";
import {
  Check,
  MessageSquare,
  MessageSquarePlus,
  MoreVertical,
  Pencil,
  Pin,
  PinOff,
  Search,
  Trash2,
  X,
} from "lucide-react";
import type { StoredChatThread } from "@/lib/zebra-x/core/chat-threads-store";

interface XZebraThreadsSidebarProps {
  threads: StoredChatThread[];
  activeThreadId: string;
  searchQuery: string;
  locale: "ar" | "fr" | "en";
  onSearchChange: (q: string) => void;
  onNewChat: () => void;
  onSelectThread: (thread: StoredChatThread) => void;
  onTogglePin: (id: string) => void;
  onRename: (id: string, newTitle: string) => void;
  onDelete: (id: string) => void;
  onCloseSidebarMobile?: () => void;
}

export const XZebraThreadsSidebar: React.FC<XZebraThreadsSidebarProps> = ({
  threads,
  activeThreadId,
  searchQuery,
  locale,
  onSearchChange,
  onNewChat,
  onSelectThread,
  onTogglePin,
  onRename,
  onDelete,
  onCloseSidebarMobile,
}) => {
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameDraft, setRenameDraft] = useState("");

  const isAr = locale === "ar";
  const isFr = locale === "fr";

  const labels = {
    newChat: isAr ? "محادثة جديدة" : isFr ? "Nouvelle discussion" : "New chat",
    searchPlaceholder: isAr ? "بحث في المحادثات..." : isFr ? "Rechercher..." : "Search chats...",
    pin: isAr ? "تثبيت" : isFr ? "Épingler" : "Pin",
    unpin: isAr ? "إلغاء التثبيت" : isFr ? "Désépingler" : "Unpin",
    rename: isAr ? "إعادة التسمية" : isFr ? "Renommer" : "Rename",
    del: isAr ? "حذف" : isFr ? "Supprimer" : "Delete",
    empty: isAr ? "لا توجد محادثات محفوظة بعد" : isFr ? "Aucune discussion enregistrée" : "No saved chats yet",
    pinnedHeading: isAr ? "مثبتة" : isFr ? "Épinglées" : "Pinned",
    recentHeading: isAr ? "المحادثات" : isFr ? "Récentes" : "Recent",
  };

  const commitRename = (id: string) => {
    if (renameDraft.trim()) {
      onRename(id, renameDraft.trim());
    }
    setRenamingId(null);
    setRenameDraft("");
  };

  const pinnedList = threads.filter((t) => t.pinned);
  const regularList = threads.filter((t) => !t.pinned);

  const renderThreadRow = (thread: StoredChatThread) => {
    const isActive = thread.id === activeThreadId;
    const isRenaming = renamingId === thread.id;
    const isMenuOpen = menuOpenId === thread.id;

    return (
      <div
        key={thread.id}
        className={`group relative flex items-center gap-1.5 rounded-xl px-2.5 py-2 transition-colors ${
          isActive
            ? "bg-emerald-500/20 border border-emerald-400/40 text-white"
            : "hover:bg-white/[0.07] text-zinc-300 border border-transparent"
        }`}
      >
        {isRenaming ? (
          <div className="flex items-center gap-1 w-full">
            <input
              type="text"
              value={renameDraft}
              autoFocus
              onChange={(e) => setRenameDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") commitRename(thread.id);
                if (e.key === "Escape") setRenamingId(null);
              }}
              className="flex-1 min-w-0 bg-zinc-900/90 border border-emerald-400/50 rounded-lg px-2 py-1 text-xs text-white focus:outline-none"
            />
            <button
              type="button"
              onClick={() => commitRename(thread.id)}
              className="p-1 text-emerald-400 hover:text-emerald-300 cursor-pointer"
              aria-label="Save name"
            >
              <Check className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setRenamingId(null)}
              className="p-1 text-zinc-400 hover:text-white cursor-pointer"
              aria-label="Cancel rename"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <>
            <button
              type="button"
              onClick={() => {
                setMenuOpenId(null);
                onSelectThread(thread);
              }}
              className="flex-1 min-w-0 flex items-center gap-2 text-start cursor-pointer"
            >
              {thread.pinned ? (
                <Pin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              ) : (
                <MessageSquare className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
              )}
              <span className="truncate text-xs font-medium">{thread.title}</span>
            </button>

            {/* Hover / Active 3-Dot Context Menu Trigger */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setMenuOpenId(isMenuOpen ? null : thread.id);
              }}
              className={`p-1 rounded-lg hover:bg-white/15 text-zinc-400 hover:text-white transition-opacity cursor-pointer ${
                isMenuOpen ? "opacity-100" : "opacity-0 group-hover:opacity-100 focus:opacity-100"
              }`}
              aria-label="Thread options"
            >
              <MoreVertical className="w-3.5 h-3.5" />
            </button>

            {isMenuOpen && (
              <div
                className="absolute top-9 end-2 z-30 w-40 rounded-xl border border-white/15 bg-slate-900/95 backdrop-blur-xl shadow-2xl p-1 space-y-0.5 text-xs"
                onMouseLeave={() => setMenuOpenId(null)}
              >
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpenId(null);
                    onTogglePin(thread.id);
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-white/10 text-zinc-200 cursor-pointer"
                >
                  {thread.pinned ? <PinOff className="w-3.5 h-3.5 text-amber-300" /> : <Pin className="w-3.5 h-3.5 text-emerald-400" />}
                  <span>{thread.pinned ? labels.unpin : labels.pin}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpenId(null);
                    setRenamingId(thread.id);
                    setRenameDraft(thread.title);
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-white/10 text-zinc-200 cursor-pointer"
                >
                  <Pencil className="w-3.5 h-3.5 text-sky-300" />
                  <span>{labels.rename}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpenId(null);
                    onDelete(thread.id);
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-red-500/20 text-red-300 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{labels.del}</span>
                </button>
              </div>
            )}
          </>
        )}
      </div>
    );
  };

  return (
    <aside className="w-64 shrink-0 border-e border-white/10 bg-slate-950/60 backdrop-blur-2xl flex flex-col h-full select-none">
      {/* Top Action Bar: New Chat + Mobile Close */}
      <div className="p-3 space-y-2.5 border-b border-white/10">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onNewChat}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/40 text-emerald-200 text-xs font-semibold transition-all cursor-pointer"
          >
            <MessageSquarePlus className="w-4 h-4" />
            <span>{labels.newChat}</span>
          </button>
          {onCloseSidebarMobile && (
            <button
              type="button"
              onClick={onCloseSidebarMobile}
              className="md:hidden p-2 rounded-xl bg-white/5 hover:bg-white/15 text-zinc-300 cursor-pointer"
              aria-label="Close sidebar"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Instant Search Box */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-zinc-400 absolute start-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={labels.searchPlaceholder}
            className="w-full ps-8 pe-3 py-1.5 rounded-xl bg-white/[0.06] border border-white/10 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-emerald-400/50"
          />
        </div>
      </div>

      {/* Saved Conversations List */}
      <div className="flex-1 overflow-y-auto p-2.5 space-y-3 kaspi-no-scrollbar">
        {threads.length === 0 ? (
          <p className="text-[11px] text-zinc-500 text-center py-8 px-2">{labels.empty}</p>
        ) : (
          <>
            {pinnedList.length > 0 && (
              <div className="space-y-1">
                <p className="px-2 text-[10px] font-semibold uppercase tracking-wider text-emerald-400/80">
                  {labels.pinnedHeading}
                </p>
                {pinnedList.map(renderThreadRow)}
              </div>
            )}

            {regularList.length > 0 && (
              <div className="space-y-1">
                <p className="px-2 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                  {labels.recentHeading}
                </p>
                {regularList.map(renderThreadRow)}
              </div>
            )}
          </>
        )}
      </div>
    </aside>
  );
};

export default XZebraThreadsSidebar;
