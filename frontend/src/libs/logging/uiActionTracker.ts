// Lightweight breadcrumbs: keep the last meaningful UI action.
export function installUiActionTracker() {
  if ((window as any).__uiTrackerInstalled) return;
  (window as any).__uiTrackerInstalled = true;

  document.addEventListener("click", (ev) => {
    try {
      const t = ev.target as HTMLElement;
      const summary = summarizeTarget(t);
      (window as any).__lastUiAction = `${new Date().toISOString()} click ${summary}`;
    } catch {}
  }, { capture: true });
}

function summarizeTarget(el: HTMLElement | null): string {
  if (!el) return "<unknown>";
  const name = el.getAttribute("data-testid") || el.id || el.getAttribute("aria-label") || el.tagName.toLowerCase();
  const txt = (el.textContent || "").trim().slice(0, 60).replace(/\s+/g, " ");
  return `${name}${txt ? `: \"${txt}\"` : ""}`;
}
