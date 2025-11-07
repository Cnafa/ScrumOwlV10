export type StackFrame = {
  functionName?: string;
  fileName?: string;
  lineNumber?: number;
  columnNumber?: number;
  raw?: string;
};

export type Culprit = {
  frame?: StackFrame;
  reason: "app_frame" | "first_frame" | "no_stack";
};

export type BuildInfo = { commit: string; builtAt: string; version?: string };

export type CrashContext = {
  route?: string;
  userId?: string;
  role?: string;
  boardId?: string;
  tz?: string;
  build: BuildInfo;
  lastUiAction?: string;
  recentConsole?: string[]; // last N lines
  componentStack?: string;  // from React ErrorBoundary
};

export type CrashReport = {
  id: string;                // timestamp-based
  at: string;                // ISO
  message: string;
  name?: string;
  stackRaw?: string;
  stack: StackFrame[];
  culprit: Culprit;
  context: CrashContext;
  isUnhandledRejection?: boolean;
  networkHint?: { url?: string; status?: number; method?: string };
};
