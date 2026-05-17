import {
  getAllLocales,
  getLocale,
  setLocale,
} from '@@/plugin-locale/localeExports';
import {
  CheckOutlined,
  DesktopOutlined,
  GlobalOutlined,
  MoonOutlined,
  SunOutlined,
} from '@ant-design/icons';
import { useIntl, useModel } from '@umijs/max';
import { Dropdown } from 'antd';
import { createStyles } from 'antd-style';
import React, { useEffect, useState } from 'react';
import {
  getEffectiveThemeMode,
  getSystemPrefersDark,
  loadThemePreference,
  SYSTEM_DARK_QUERY,
  saveThemePreference,
  subscribe,
  type ThemeMode,
  toLayoutSettings,
} from '@/theme/preference';

const useStyles = createStyles(({ token }) => ({
  trigger: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    cursor: 'pointer',
    fontSize: 18,
    color: 'inherit',
    transition: 'background 0.2s',
    borderRadius: 8,
    '&:hover': { background: token.colorBgTextHover },
  },
}));

const localeLabels: Record<string, string> = {
  'zh-CN': '简体中文',
  'en-US': 'English',
};

export const SelectLang: React.FC = () => {
  const { styles } = useStyles();

  return (
    <Dropdown
      menu={{
        selectedKeys: [getLocale()],
        onClick: ({ key }) => setLocale(key, false),
        items: getAllLocales().map((loc) => ({
          key: loc,
          label: localeLabels[loc] || loc,
        })),
      }}
      trigger={['click']}
    >
      <span className={styles.trigger}>
        <GlobalOutlined />
      </span>
    </Dropdown>
  );
};

const themeModeIcons: Record<ThemeMode, React.ReactNode> = {
  light: <SunOutlined />,
  dark: <MoonOutlined />,
  system: <DesktopOutlined />,
};

export const ThemeSwitcher: React.FC = () => {
  const intl = useIntl();
  const { styles } = useStyles();
  const { setInitialState } = useModel('@@initialState');
  const [preference, setPreference] = useState(() => loadThemePreference());
  const [systemPrefersDark, setSystemPrefersDark] =
    useState(getSystemPrefersDark);

  useEffect(() => {
    const syncPreference = () => setPreference(loadThemePreference());
    const unsubscribe = subscribe(syncPreference);
    window.addEventListener('storage', syncPreference);
    return () => {
      unsubscribe();
      window.removeEventListener('storage', syncPreference);
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

  const updateThemeMode = (themeMode: ThemeMode) => {
    const next = { ...loadThemePreference(), themeMode };
    saveThemePreference(next);
    setPreference(next);
    setInitialState?.((state: any) => ({
      ...state,
      settings: {
        ...state?.settings,
        ...toLayoutSettings(next, systemPrefersDark),
      },
    }));
  };

  const effectiveThemeMode = getEffectiveThemeMode(
    preference.themeMode,
    systemPrefersDark,
  );
  const triggerIcon =
    preference.themeMode === 'system'
      ? themeModeIcons.system
      : themeModeIcons[effectiveThemeMode];

  return (
    <Dropdown
      menu={{
        selectedKeys: [preference.themeMode],
        onClick: ({ key }) => updateThemeMode(key as ThemeMode),
        items: (['light', 'dark', 'system'] as ThemeMode[]).map((mode) => ({
          key: mode,
          icon: themeModeIcons[mode],
          label: intl.formatMessage({
            id: `navbar.theme.${mode}`,
            defaultMessage: mode,
          }),
          extra:
            preference.themeMode === mode ? (
              <CheckOutlined aria-hidden />
            ) : undefined,
        })),
      }}
      trigger={['click']}
    >
      <span
        className={styles.trigger}
        title={intl.formatMessage({
          id: 'navbar.theme',
          defaultMessage: 'Theme',
        })}
      >
        {triggerIcon}
      </span>
    </Dropdown>
  );
};

export type SiderTheme = 'light' | 'dark';
