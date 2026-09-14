import { toast } from "sonner";

/**
 * Safely copies text to the clipboard using modern Navigator Clipboard API,
 * falling back to the legacy document.execCommand method if write permission
 * is denied or unavailable (e.g. inside an iframe sandbox with strict policies).
 * 
 * @param text The text string to copy.
 * @param successMessage Optional custom success message to show via sonner toast. Return value indicates whether it succeeded.
 */
export async function copyToClipboard(text: string, successMessage: string = "Copied to clipboard!"): Promise<boolean> {
  // 1. Try modern clipboard API first
  if (navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(successMessage);
      return true;
    } catch (err) {
      console.warn("Modern clipboard writeText denied/failed, trying fallback copy:", err);
    }
  }

  // 2. Fallback to older document.execCommand method
  const success = fallbackCopy(text);
  if (success) {
    toast.success(successMessage);
    return true;
  }

  // 3. If everything fails, inform user gracefully
  toast.error("Clipboard copy restricted by browser. Please manually copy the link/text.");
  return false;
}

/**
 * Silently copies text to the clipboard without showing toasts.
 * 
 * @param text The text string to copy.
 * @returns boolean indicating success or failure.
 */
export async function copyToClipboardQuiet(text: string): Promise<boolean> {
  if (navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (err) {
      console.warn("Modern silent clipboard writeText failed:", err);
    }
  }

  return fallbackCopy(text);
}

/**
 * Helper to execute legacy document.execCommand copy
 */
function fallbackCopy(text: string): boolean {
  try {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed";
    textArea.style.top = "0";
    textArea.style.left = "0";
    textArea.style.width = "2em";
    textArea.style.height = "2em";
    textArea.style.padding = "0";
    textArea.style.border = "none";
    textArea.style.outline = "none";
    textArea.style.boxShadow = "none";
    textArea.style.background = "transparent";
    
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    const successful = document.execCommand("copy");
    document.body.removeChild(textArea);
    return !!successful;
  } catch (err) {
    console.error("Fallback legacy copy execution failed:", err);
    return false;
  }
}
