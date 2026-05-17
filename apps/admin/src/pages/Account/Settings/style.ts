import { createStyles } from 'antd-style';

const useStyles = createStyles(({ token }) => {
  return {
    main: {
      display: 'flex',
      width: '100%',
      height: '100%',
      minHeight: '520px',
      overflow: 'hidden',
      backgroundColor: token.colorBgContainer,
      border: `${token.lineWidth}px solid ${token.colorBorderSecondary}`,
      borderRadius: token.borderRadiusLG,
      '.ant-list-split .ant-list-item:last-child': {
        borderBottom: `1px solid ${token.colorSplit}`,
      },
      '.ant-list-item': { paddingTop: '16px', paddingBottom: '16px' },
      '.ant-list-item-meta-title': {
        color: token.colorTextHeading,
        fontWeight: 600,
      },
      '.ant-list-item-meta-description': {
        color: token.colorTextTertiary,
      },
      '.ant-list-item-action a': {
        color: token.colorTextSecondary,
      },
      '.ant-list-item-action a:hover': {
        color: token.colorText,
      },
      [`@media screen and (max-width: ${token.screenMD}px)`]: {
        flexDirection: 'column',
      },
    },
    leftMenu: {
      width: '224px',
      padding: '16px 12px',
      backgroundColor: token.colorBgContainer,
      borderRight: `${token.lineWidth}px solid ${token.colorBorderSecondary}`,
      '.ant-menu': {
        background: 'transparent',
        border: 'none !important',
      },
      '.ant-menu-item': {
        height: '40px',
        marginInline: 0,
        marginBlock: '4px',
        borderRadius: token.borderRadius,
        color: token.colorTextSecondary,
        fontWeight: 500,
      },
      '.ant-menu-item:hover': {
        color: token.colorText,
        backgroundColor: token.colorFillTertiary,
      },
      '.ant-menu-item-selected': {
        color: token.colorText,
        backgroundColor: token.colorFillSecondary,
        boxShadow: `inset 2px 0 0 ${token.colorBorder}`,
      },
      '.ant-menu-horizontal': { fontWeight: 600 },
      [`@media screen and (max-width: ${token.screenMD}px)`]: {
        width: '100%',
        borderRight: 'none',
        borderBottom: `${token.lineWidth}px solid ${token.colorBorderSecondary}`,
      },
    },
    right: {
      flex: '1',
      minWidth: 0,
      padding: '28px 40px 40px',
      backgroundColor: token.colorBgContainer,
      [`@media screen and (max-width: ${token.screenMD}px)`]: {
        padding: '24px',
      },
    },
    title: {
      marginBottom: '20px',
      color: token.colorTextHeading,
      fontWeight: '500',
      fontSize: '20px',
      lineHeight: '28px',
    },
    baseView: {
      display: 'flex',
      '.ant-legacy-form-item .ant-legacy-form-item-control-wrapper': {
        width: '100%',
      },
    },
    ':global': {
      'font.strong': { color: token.colorSuccess },
      'font.medium': { color: token.colorWarning },
      'font.weak': { color: token.colorError },
      'html.examora-dark .account-settings-main': {
        backgroundColor: '#18181b',
        borderColor: '#27272a',
      },
      'html.examora-dark .account-settings-menu': {
        backgroundColor: '#18181b',
        borderRightColor: '#27272a',
      },
      'html.examora-dark .account-settings-content': {
        backgroundColor: '#18181b',
      },
      'html.examora-dark .account-settings-main .ant-list-split .ant-list-item':
        {
          borderBlockEndColor: '#27272a',
        },
      'html.examora-dark .account-settings-main .ant-list-item-meta-description':
        {
          color: '#a1a1aa',
        },
      'html.examora-dark .account-settings-main .ant-list-item-action a': {
        color: '#a1a1aa',
      },
      'html.examora-dark .account-settings-main .ant-list-item-action a:hover':
        {
          color: '#e4e4e7',
        },
      'html.examora-dark .account-settings-menu .ant-menu-item': {
        color: '#a1a1aa',
      },
      'html.examora-dark .account-settings-menu .ant-menu-item:hover': {
        color: '#e4e4e7',
        backgroundColor: 'rgba(63, 63, 70, 0.28)',
      },
      'html.examora-dark .account-settings-menu .ant-menu-item-selected': {
        color: '#e4e4e7',
        backgroundColor: 'rgba(63, 63, 70, 0.42)',
        boxShadow: 'inset 2px 0 0 #52525b',
      },
    },
  };
});

export default useStyles;
