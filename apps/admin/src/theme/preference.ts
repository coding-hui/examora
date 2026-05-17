import type { Settings as LayoutSettings } from '@ant-design/pro-components';

const STORAGE_KEY = 'examora-theme-preference';
export const SYSTEM_DARK_QUERY = '(prefers-color-scheme: dark)';

export type ThemeMode = 'light' | 'dark' | 'system';
export type EffectiveThemeMode = 'light' | 'dark';

export interface ThemePreference {
  themeMode: ThemeMode;
  colorPrimary: string;
}

const DEFAULT: ThemePreference = {
  themeMode: 'system',
  colorPrimary: '#262626',
};

type LegacyThemePreference = Partial<ThemePreference> & {
  navTheme?: 'light' | 'realDark';
};

function normalizeThemeMode(value: unknown): ThemeMode {
  if (value === 'dark' || value === 'light' || value === 'system') {
    return value;
  }
  return DEFAULT.themeMode;
}

export function normalizeThemePreference(
  value: LegacyThemePreference | null | undefined,
): ThemePreference {
  if (!value) return { ...DEFAULT };
  const { navTheme, themeMode, ...rest } = value;
  const legacyMode = navTheme === 'realDark' ? 'dark' : navTheme;
  return {
    ...DEFAULT,
    ...rest,
    themeMode: normalizeThemeMode(themeMode || legacyMode),
  };
}

export function getEffectiveThemeMode(
  mode: ThemeMode,
  systemPrefersDark: boolean,
): EffectiveThemeMode {
  if (mode === 'system') return systemPrefersDark ? 'dark' : 'light';
  return mode;
}

export function getSystemPrefersDark(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia(SYSTEM_DARK_QUERY).matches;
}

export function loadThemePreference(): ThemePreference {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return normalizeThemePreference(JSON.parse(raw));
    }
  } catch {
    // ignore
  }
  return { ...DEFAULT };
}

export function saveThemePreference(pref: ThemePreference): void {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(normalizeThemePreference(pref)),
  );
  notifyThemeChange();
}

const listeners = new Set<() => void>();

export function subscribe(callback: () => void): () => void {
  listeners.add(callback);
  return () => {
    listeners.delete(callback);
  };
}

export function notifyThemeChange(): void {
  for (const fn of listeners) {
    fn();
  }
}

export function toLayoutSettings(
  pref: ThemePreference,
  systemPrefersDark = getSystemPrefersDark(),
): LayoutSettings {
  const normalized = normalizeThemePreference(pref);
  const effectiveThemeMode = getEffectiveThemeMode(
    normalized.themeMode,
    systemPrefersDark,
  );
  return {
    navTheme: effectiveThemeMode === 'dark' ? 'realDark' : 'light',
    colorPrimary: normalized.colorPrimary,
    layout: 'mix',
    contentWidth: 'Fluid',
    fixedHeader: true,
    fixSiderbar: true,
    splitMenus: false,
    siderMenuType: 'group',
    colorWeak: false,
    title: 'Examora',
  };
}
