import {
  getEffectiveThemeMode,
  loadThemePreference,
  normalizeThemePreference,
  saveThemePreference,
  subscribe,
} from './preference';

describe('theme preference', () => {
  const storage = {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      value: storage,
    });
  });

  it('normalizes legacy navTheme values', () => {
    expect(normalizeThemePreference({ navTheme: 'realDark' })).toMatchObject({
      themeMode: 'dark',
    });
    expect(normalizeThemePreference({ navTheme: 'light' })).toMatchObject({
      themeMode: 'light',
    });
  });

  it('defaults to system mode when no preference exists', () => {
    storage.getItem.mockReturnValue(null);

    expect(loadThemePreference()).toEqual({
      themeMode: 'system',
      colorPrimary: '#262626',
    });
  });

  it('falls back to light when system preference is unavailable', () => {
    expect(getEffectiveThemeMode('system', false)).toBe('light');
    expect(getEffectiveThemeMode('system', true)).toBe('dark');
    expect(getEffectiveThemeMode('dark', false)).toBe('dark');
  });

  it('loads persisted theme mode', () => {
    storage.getItem.mockReturnValue(
      JSON.stringify({
        themeMode: 'system',
        colorPrimary: '#1677ff',
      }),
    );

    expect(loadThemePreference()).toEqual({
      themeMode: 'system',
      colorPrimary: '#1677ff',
    });
  });

  it('notifies subscribers after saving', () => {
    const listener = jest.fn();
    const unsubscribe = subscribe(listener);

    saveThemePreference({
      themeMode: 'dark',
      colorPrimary: '#262626',
    });

    expect(storage.setItem).toHaveBeenCalledWith(
      'examora-theme-preference',
      JSON.stringify({
        themeMode: 'dark',
        colorPrimary: '#262626',
      }),
    );
    expect(listener).toHaveBeenCalledTimes(1);

    unsubscribe();
    saveThemePreference({
      themeMode: 'light',
      colorPrimary: '#262626',
    });
    expect(listener).toHaveBeenCalledTimes(1);
  });
});
