import type { ConfigProviderProps, ThemeConfig } from 'antd';
import { theme } from 'antd';
import { useEffect, useMemo, useState } from 'react';
import {
  getEffectiveThemeMode,
  loadThemePreference,
  SYSTEM_DARK_QUERY,
  subscribe,
} from './preference';

const DARK_CLASS = 'examora-dark';

function getSystemPrefersDark(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia(SYSTEM_DARK_QUERY).matches;
}

// ---- Light mode token values ----

const lightToken: ThemeConfig['token'] = {
  fontFamily:
    "AlibabaSans, Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
  colorPrimary: '#262626',
  colorSuccess: '#22c55e',
  colorWarning: '#f97316',
  colorError: '#ef4444',
  colorInfo: '#262626',
  colorTextBase: '#262626',
  colorBgBase: '#ffffff',
  colorPrimaryBg: '#f5f5f5',
  colorPrimaryBgHover: '#e5e5e5',
  colorPrimaryBorder: '#d4d4d4',
  colorPrimaryBorderHover: '#a3a3a3',
  colorPrimaryHover: '#404040',
  colorPrimaryActive: '#171717',
  colorPrimaryText: '#262626',
  colorPrimaryTextHover: '#404040',
  colorPrimaryTextActive: '#171717',
  colorSuccessBg: '#f0fdf4',
  colorSuccessBgHover: '#dcfce7',
  colorSuccessBorder: '#bbf7d0',
  colorSuccessBorderHover: '#86efac',
  colorSuccessHover: '#16a34a',
  colorSuccessActive: '#15803d',
  colorSuccessText: '#16a34a',
  colorSuccessTextHover: '#16a34a',
  colorSuccessTextActive: '#15803d',
  colorWarningBg: '#fff7ed',
  colorWarningBgHover: '#fed7aa',
  colorWarningBorder: '#fdba74',
  colorWarningBorderHover: '#fb923c',
  colorWarningHover: '#ea580c',
  colorWarningActive: '#c2410c',
  colorWarningText: '#ea580c',
  colorWarningTextHover: '#ea580c',
  colorWarningTextActive: '#c2410c',
  colorErrorBg: '#fef2f2',
  colorErrorBgHover: '#fecaca',
  colorErrorBorder: '#fca5a5',
  colorErrorBorderHover: '#f87171',
  colorErrorHover: '#dc2626',
  colorErrorActive: '#b91c1c',
  colorErrorText: '#dc2626',
  colorErrorTextHover: '#dc2626',
  colorErrorTextActive: '#b91c1c',
  colorInfoBg: '#f5f5f5',
  colorInfoBgHover: '#e5e5e5',
  colorInfoBorder: '#d4d4d4',
  colorInfoBorderHover: '#a3a3a3',
  colorInfoHover: '#404040',
  colorInfoActive: '#171717',
  colorInfoText: '#262626',
  colorInfoTextHover: '#404040',
  colorInfoTextActive: '#171717',
  colorText: '#262626',
  colorTextSecondary: '#525252',
  colorTextTertiary: '#737373',
  colorTextQuaternary: '#a3a3a3',
  colorTextDisabled: '#a3a3a3',
  colorBgContainer: '#ffffff',
  colorBgElevated: '#ffffff',
  colorBgLayout: '#fafafa',
  colorBgSpotlight: 'rgba(38, 38, 38, 0.85)',
  colorBgMask: 'rgba(38, 38, 38, 0.45)',
  colorBorder: '#e5e5e5',
  colorBorderSecondary: '#f5f5f5',
  borderRadius: 10,
  borderRadiusXS: 2,
  borderRadiusSM: 6,
  borderRadiusLG: 14,
  padding: 16,
  paddingSM: 12,
  paddingLG: 24,
  margin: 16,
  marginSM: 12,
  marginLG: 24,
  controlHeight: 36,
  controlHeightLG: 40,
  fontSize: 14,
  wireframe: false,
  boxShadow:
    '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)',
  boxShadowSecondary:
    '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
};

const lightComponents: ThemeConfig['components'] = {
  Button: {
    primaryShadow: 'none',
    defaultShadow: 'none',
    dangerShadow: 'none',
    defaultBorderColor: '#e4e4e7',
    defaultColor: '#18181b',
    defaultBg: '#ffffff',
    defaultHoverBg: '#f4f4f5',
    defaultHoverBorderColor: '#d4d4d8',
    defaultHoverColor: '#18181b',
    defaultActiveBg: '#e4e4e7',
    defaultActiveBorderColor: '#d4d4d8',
    borderRadius: 6,
  },
  Input: {
    activeShadow: 'none',
    hoverBorderColor: '#a1a1aa',
    activeBorderColor: '#18181b',
    borderRadius: 6,
  },
  Select: {
    optionSelectedBg: '#f4f4f5',
    optionActiveBg: '#fafafa',
    optionSelectedFontWeight: 500,
    borderRadius: 6,
  },
  Alert: {
    borderRadiusLG: 8,
  },
  Modal: {
    borderRadiusLG: 12,
  },
  Card: {
    headerBg: '#FFFFFF',
    headerFontSize: 15,
    headerHeight: 48,
    bodyPadding: 20,
  },
  Layout: {
    bodyBg: '#FAFAFA',
    headerBg: '#FFFFFF',
    lightSiderBg: '#FFFFFF',
    lightTriggerBg: '#FFFFFF',
  },
  Menu: {
    itemBorderRadius: 6,
    itemHeight: 40,
    itemHoverBg: '#F4F4F5',
    itemHoverColor: '#18181B',
    itemSelectedBg: '#F4F4F5',
    itemSelectedColor: '#18181B',
    groupTitleColor: '#737373',
  },
  Table: {
    borderColor: '#E5E5E5',
    headerBg: '#FAFAFA',
    headerColor: '#525252',
    rowHoverBg: '#FAFAFA',
    cellPaddingBlock: 13,
    cellPaddingInline: 16,
  },
  Progress: {
    defaultColor: '#18181b',
    remainingColor: '#f4f4f5',
  },
  Steps: {
    iconSize: 32,
  },
  Switch: {
    trackHeight: 24,
    trackMinWidth: 44,
    innerMinMargin: 4,
    innerMaxMargin: 24,
  },
  Checkbox: {
    borderRadiusSM: 4,
  },
  Slider: {
    trackBg: '#f4f4f5',
    trackHoverBg: '#e4e4e7',
    handleSize: 18,
    handleSizeHover: 20,
    railSize: 6,
  },
  ColorPicker: {
    borderRadius: 6,
  },
  Tag: {
    borderRadiusSM: 6,
  },
};

// ---- Dark mode token overrides ----

const darkTokenOverrides: Partial<ThemeConfig['token']> = {
  colorTextBase: '#e4e4e7',
  colorBgBase: '#0a0a0a',
  colorText: '#e4e4e7',
  colorTextSecondary: '#a1a1aa',
  colorTextTertiary: '#71717a',
  colorTextQuaternary: '#52525b',
  colorTextDisabled: '#52525b',
  colorBgContainer: '#18181b',
  colorBgElevated: '#27272a',
  colorBgLayout: '#0a0a0a',
  colorBgSpotlight: 'rgba(0, 0, 0, 0.85)',
  colorBgMask: 'rgba(0, 0, 0, 0.65)',
  colorBorder: '#27272a',
  colorBorderSecondary: '#18181b',
  boxShadow:
    '0 1px 3px 0 rgba(0, 0, 0, 0.4), 0 1px 2px -1px rgba(0, 0, 0, 0.4)',
  boxShadowSecondary:
    '0 4px 6px -1px rgba(0, 0, 0, 0.4), 0 2px 4px -2px rgba(0, 0, 0, 0.4)',
};

const darkComponentsOverrides: ThemeConfig['components'] = {
  Button: {
    defaultBorderColor: '#303030',
    defaultColor: '#e4e4e7',
    defaultBg: '#1c1c1c',
    defaultHoverBg: '#262626',
    defaultHoverBorderColor: '#404040',
    defaultHoverColor: '#fafafa',
    defaultActiveBg: '#303030',
    defaultActiveBorderColor: '#525252',
    defaultActiveColor: '#fafafa',
  },
  Card: {
    headerBg: '#18181b',
    colorTextHeading: '#e4e4e7',
  },
  Layout: {
    bodyBg: '#0a0a0a',
    headerBg: '#0a0a0a',
    lightSiderBg: '#0a0a0a',
    lightTriggerBg: '#0a0a0a',
    siderBg: '#0a0a0a',
  },
  Menu: {
    itemHoverBg: '#27272a',
    itemHoverColor: '#fafafa',
    itemSelectedBg: '#27272a',
    itemSelectedColor: '#fafafa',
    groupTitleColor: '#71717a',
    colorBgContainer: '#0a0a0a',
  },
  Table: {
    borderColor: '#27272a',
    headerBg: '#18181b',
    headerColor: '#a1a1aa',
    rowHoverBg: '#18181b',
    colorBgContainer: '#18181b',
  },
  Input: {
    hoverBorderColor: '#52525b',
    activeBorderColor: '#fafafa',
    colorBgContainer: '#18181b',
    colorBorder: '#27272a',
  },
  Select: {
    optionSelectedBg: '#27272a',
    optionActiveBg: '#1c1c1c',
    colorBgContainer: '#18181b',
    colorBgElevated: '#27272a',
    colorBorder: '#27272a',
  },
  Modal: {
    colorBgElevated: '#18181b',
    headerBg: '#18181b',
    contentBg: '#18181b',
  },
  Tag: {
    colorBgContainer: '#27272a',
  },
};

// ---- Hook ----

const useShadcnTheme = (): ConfigProviderProps => {
  const [preference, setPreference] = useState(() => loadThemePreference());
  const [systemPrefersDark, setSystemPrefersDark] =
    useState(getSystemPrefersDark);

  useEffect(() => {
    const syncPreference = () => setPreference(loadThemePreference());
    window.addEventListener('storage', syncPreference);
    const unsub = subscribe(syncPreference);
    return () => {
      window.removeEventListener('storage', syncPreference);
      unsub();
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return undefined;
    const mediaQuery = window.matchMedia(SYSTEM_DARK_QUERY);
    const syncSystemTheme = () => setSystemPrefersDark(mediaQuery.matches);
    syncSystemTheme();
    mediaQuery.addEventListener?.('change', syncSystemTheme);
    return () => {
      mediaQuery.removeEventListener?.('change', syncSystemTheme);
    };
  }, []);

  const effectiveThemeMode = getEffectiveThemeMode(
    preference.themeMode,
    systemPrefersDark,
  );
  const isDark = effectiveThemeMode === 'dark';

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add(DARK_CLASS);
    } else {
      root.classList.remove(DARK_CLASS);
    }
  }, [isDark]);

  const algorithm = useMemo(
    () => (isDark ? theme.darkAlgorithm : theme.defaultAlgorithm),
    [isDark],
  );

  return useMemo<ConfigProviderProps>(
    () => ({
      variant: 'filled',
      theme: {
        algorithm,
        token: {
          ...lightToken,
          colorPrimary: preference.colorPrimary,
          colorInfo: preference.colorPrimary,
          ...(isDark ? darkTokenOverrides : {}),
        },
        components: {
          ...lightComponents,
          ...(isDark ? darkComponentsOverrides : {}),
        },
      },
    }),
    [algorithm, isDark, preference.colorPrimary],
  );
};

export default useShadcnTheme;
