/** Accès sûr au stockage local : ne plante jamais (navigation privée, stockage bloqué). */
export const local = {
  get<T>(key: string, fallback: T): T {
    if (typeof window === "undefined") return fallback;
    try { const v = window.localStorage.getItem(key); return v ? (JSON.parse(v) as T) : fallback; } catch { return fallback; }
  },
  set(key: string, value: unknown): void {
    if (typeof window === "undefined") return;
    try { window.localStorage.setItem(key, JSON.stringify(value)); } catch { /* stockage indisponible */ }
  },
  remove(key: string): void {
    if (typeof window === "undefined") return;
    try { window.localStorage.removeItem(key); } catch { /* stockage indisponible */ }
  },
};

/** Clés de stockage local, toutes préfixées. */
export const KEYS = {
  favorites: "pr_favorites",
  quiz: "pr_quiz",
  theme: "pr_theme",
  consent: "pr_consent",
  projects: "pr_projects",
  chat: "pr_chat",
  home: "pr_home",
  guide: "pr_guide",
  usage: "pr_usage",
} as const;
