import { logCrash } from "./crashLogger";

export function installGlobalErrorHooks() {
  if ((window as any).__errorHooksInstalled) return;
  (window as any).__errorHooksInstalled = true;

  window.addEventListener("error", (e) => {
    // window.onerror and resource errors
    const err = e.error || new Error(e.message || "Script error");
    logCrash(err);
  });

  window.addEventListener("unhandledrejection", (e) => {
    const reason: any = (e as any).reason || new Error("Unhandled Rejection");
    logCrash(reason, { isUnhandledRejection: true });
  });
}
