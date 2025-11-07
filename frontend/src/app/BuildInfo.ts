// Injected via Vite define() (see vite.config.ts)
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
// FIX: Combined the variable assignment to a single line to ensure @ts-ignore applies correctly to the use of the globally-injected __BUILD_INFO__ constant.
export const BUILD_INFO: { commit: string; builtAt: string; version?: string } = (typeof __BUILD_INFO__ !== 'undefined') ? __BUILD_INFO__ : { commit: "dev", builtAt: new Date().toISOString() };
