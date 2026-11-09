/**
 * Robust clipboard helpers that work in secure (HTTPS), insecure (http://LAN / WSL IP),
 * and embedded (Tauri WebView) contexts.
 */

/**
 * Synchronous legacy copy via a temporary off-screen <textarea> + document.execCommand("copy").
 * Must be called synchronously inside a user gesture (click / keydown) to be allowed.
 */
export function legacyCopyText(text: string): boolean {
  if (typeof document === "undefined" || !document.body) return false;

  const previouslyFocused = document.activeElement as HTMLElement | null;
  const selection = document.getSelection();
  const previousRange =
    selection && selection.rangeCount > 0 ? selection.getRangeAt(0) : null;

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.setAttribute("aria-hidden", "true");
  textarea.style.cssText = [
    "position:fixed",
    "top:0",
    "left:0",
    "width:1px",
    "height:1px",
    "padding:0",
    "border:0",
    "outline:0",
    "opacity:0",
    "pointer-events:none",
    "user-select:text",
    "-webkit-user-select:text",
  ].join(";");

  document.body.appendChild(textarea);

  let ok = false;
  try {
    textarea.focus({ preventScroll: true });
    textarea.select();
    textarea.setSelectionRange(0, text.length);
    ok = document.execCommand("copy");
  } catch {
    ok = false;
  } finally {
    document.body.removeChild(textarea);
    if (selection) {
      selection.removeAllRanges();
      if (previousRange) selection.addRange(previousRange);
    }
    previouslyFocused?.focus?.({ preventScroll: true });
  }

  return ok;
}

/**
 * Copy text to the clipboard. Call directly from a click/keydown handler.
 *
 * Order matters: the synchronous legacy path runs first so it keeps the user-gesture
 * activation; the async Clipboard API is used as a second attempt (and is the only path
 * that works without a gesture, e.g. on page load in Chromium).
 */
export async function copyTextToClipboard(text: string): Promise<boolean> {
  if (!text) return false;

  if (legacyCopyText(text)) {
    return true;
  }

  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      return false;
    }
  }

  return false;
}

/**
 * Attempt a copy without a user gesture (e.g. `?copy=1` on page load).
 * Only the async Clipboard API can succeed here; browsers that require a gesture will reject.
 */
export async function tryCopyWithoutGesture(text: string): Promise<boolean> {
  if (!text || typeof navigator === "undefined" || !navigator.clipboard?.writeText) {
    return false;
  }
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}
