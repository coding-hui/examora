import {
  getAllLocales,
  getLocale,
  setLocale,
} from '@@/plugin-locale/localeExports';
import { GlobalOutlined } from '@ant-design/icons';
import { Dropdown } from 'antd';
import { createStyles } from 'antd-style';
import React from 'react';

const useStyles = createStyles(() => ({
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
    '&:hover': { background: 'rgba(0,0,0,0.04)' },
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

export type SiderTheme = 'light' | 'dark';
