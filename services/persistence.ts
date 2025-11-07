// services/persistence.ts
const NS = 'so.';
const VERS = 1;

export function load<T>(key: string, def: T): T {
  try {
    const raw = localStorage.getItem(NS + key);
    if (!raw) return def;
    const { v, data } = JSON.parse(raw);
    return (v === VERS) ? data as T : def;
  } catch {
    return def;
  }
}

export function save<T>(key: string, data: T) {
  try {
    localStorage.setItem(NS + key, JSON.stringify({ v: VERS, data }));
  } catch (e) {
    console.error("Failed to save to localStorage", e);
  }
}
