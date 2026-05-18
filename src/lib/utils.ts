/**
 * Robustly copy text to the clipboard with fallback for non-secure contexts (HTTP).
 * Essential for mobile browsers when not running over HTTPS.
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  // 1. Try modern Clipboard API (requires Secure Context / HTTPS)
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch (err) {
    console.error("Clipboard API failed, falling back", err);
  }

  // 2. Fallback for non-secure contexts (HTTP) or older browsers
  // This uses a hidden textarea and document.execCommand('copy')
  try {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    
    // Ensure the textarea is off-screen but part of the DOM
    textArea.style.position = "fixed";
    textArea.style.left = "-9999px";
    textArea.style.top = "0";
    textArea.style.width = "2em";
    textArea.style.height = "2em";
    textArea.style.padding = "0";
    textArea.style.border = "none";
    textArea.style.outline = "none";
    textArea.style.boxShadow = "none";
    textArea.style.background = "transparent";
    
    // Prevent zooming on focus in some mobile browsers
    textArea.setAttribute("readonly", "");
    
    document.body.appendChild(textArea);
    
    // Handle focus and selection
    textArea.focus();
    textArea.select();
    
    // Additional selection for mobile compatibility
    textArea.setSelectionRange(0, 99999);
    
    const successful = document.execCommand("copy");
    document.body.removeChild(textArea);
    
    if (successful) return true;
  } catch (err) {
    console.error("Fallback copy failed", err);
  }

  return false;
}
