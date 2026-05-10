import type { Settings as LayoutSettings } from "@ant-design/pro-components";

const STORAGE_KEY = "examora-theme-preference";

export interface ThemePreference {
  navTheme: "light" | "realDark";
  colorPrimary: string;
}

const DEFAULT: ThemePreference = {
  navTheme: "light",
  colorPrimary: "#262626",
};

export function loadThemePreference(): ThemePreference {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return { ...DEFAULT, ...JSON.parse(raw) };
    }
  } catch {
    // ignore
  }
  return { ...DEFAULT };
}

export function saveThemePreference(pref: ThemePreference): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(pref));
}

const listeners = new Set<() => void>();

export function subscribe(callback: () => void): () => void {
  listeners.add(callback);
  return () => {
    listeners.delete(callback);
  };
}

export function notifyThemeChange(): void {
  listeners.forEach((fn) => fn());
}

export function toLayoutSettings(pref: ThemePreference): LayoutSettings {
  return {
    navTheme: pref.navTheme,
    colorPrimary: pref.colorPrimary,
    layout: "mix",
    contentWidth: "Fluid",
    fixedHeader: true,
    fixSiderbar: true,
    splitMenus: false,
    siderMenuType: "group",
    colorWeak: false,
    title: "Examora",
  };
}
