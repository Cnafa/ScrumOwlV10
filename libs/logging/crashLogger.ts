import { BUILD_INFO } from "../../app/BuildInfo";
import type { CrashReport, StackFrame, Culprit, CrashContext } from "./types";

const LS_KEY_LAST_CRASH = "scrumowl:lastCrash";
const CONSOLE_RING_SIZE = 100;
const consoleRing: string[] = [];

// Patch console to capture recent logs (without spamming)
(["log","warn","error","info"] as const).forEach(fn => {
  const orig = console[fn];
  console[fn] = (...args: any[]) => {
    try {
      const line = `[${new Date().toISOString()}][${fn.toUpperCase()}] ` + args.map(a => safeToString(a)).join(" ");
      consoleRing.push(line);
      if (consoleRing.length > CONSOLE_RING_SIZE) consoleRing.shift();
    } catch {}
    // @ts-ignore
    orig.apply(console, args);
  };
});

function safeToString(x: any): string {
  try { return typeof x === "string" ? x : JSON.stringify(x); } catch { return String(x); }
}

function parseStack(stack?: string): StackFrame[] {
  if (!stack) return [];
  const lines = stack.split(/\n+/);
  const frames: StackFrame[] = [];
  const re = /at\s+(.*?)\s*\((.*?):(\d+):(\d+)\)|at\s+(.*?):(\d+):(\d+)/;
  for (const l of lines) {
    const m = l.match(re);
    if (!m) { frames.push({ raw: l }); continue; }
    if (m[2]) {
      frames.push({ functionName: m[1], fileName: m[2], lineNumber: +m[3], columnNumber: +m[4], raw: l });
    } else {
      frames.push({ fileName: m[5], lineNumber: +m[6], columnNumber: +m[7], raw: l });
    }
  }
  return frames;
}

function findCulprit(frames: StackFrame[]): Culprit {
  if (!frames.length) return { reason: "no_stack" };
  const app = frames.find(f => f.fileName && /\/(src|assets|components|pages|app|hooks|context|libs)\//.test(f.fileName));
  if (app) return { frame: app, reason: "app_frame" };
  return { frame: frames[0], reason: "first_frame" };
}

export function buildContext(extra?: Partial<CrashContext>): CrashContext {
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const route = typeof window !== "undefined" ? window.location.pathname + window.location.search : undefined;
  return {
    tz,
    route,
    build: BUILD_INFO,
    lastUiAction: (window as any).__lastUiAction,
    recentConsole: [...consoleRing],
    componentStack: (window as any).__lastReactComponentStack,
    ...extra,
  };
}

export function logCrash(err: any, opts?: { isUnhandledRejection?: boolean; networkHint?: CrashReport["networkHint"]; extra?: Partial<CrashContext> }) {
  const name = err?.name || "Error";
  const message = err?.message || safeToString(err);
  const stackRaw = err?.stack as string | undefined;
  const stack = parseStack(stackRaw);
  const culprit = findCulprit(stack);

  const report: CrashReport = {
    id: String(Date.now()),
    at: new Date().toISOString(),
    name,
    message,
    stackRaw,
    stack,
    culprit,
    isUnhandledRejection: opts?.isUnhandledRejection,
    networkHint: opts?.networkHint,
    context: buildContext(opts?.extra),
  };

  try { localStorage.setItem(LS_KEY_LAST_CRASH, JSON.stringify(report)); } catch {}
  // Also expose globally for quick manual inspection
  (window as any).__lastCrashReport = report;
  console.error("[CRASH]", report);
  return report;
}

export function getLastCrash(): CrashReport | null {
  try { const raw = localStorage.getItem(LS_KEY_LAST_CRASH); return raw ? JSON.parse(raw) as CrashReport : null; } catch { return null; }
}

export function clearLastCrash() { try { localStorage.removeItem(LS_KEY_LAST_CRASH); } catch {} }