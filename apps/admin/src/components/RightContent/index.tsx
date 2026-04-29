import { SelectLang as UmiSelectLang } from '@umijs/max';

export type SiderTheme = 'light' | 'dark';

export const SelectLang: React.FC = () => (
  <UmiSelectLang
    style={{
      padding: '8px 12px',
      borderRadius: 8,
      background: 'transparent',
      border: '1px solid rgba(255, 255, 255, 0.15)',
      color: 'inherit',
      fontSize: 12,
      height: 28,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}
  />
);

export const Question: React.FC = () => {
  return (
    <a
      href="https://pro.ant.design/docs/getting-started"
      target="_blank"
      rel="noreferrer"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '4px',
        height: '22px',
        width: '22px',
        color: 'inherit',
        transition: 'background 0.2s ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'transparent';
      }}
    >
      <img
        src="/logo.svg"
        alt="Help"
        style={{
          width: 20,
          height: 20,
          objectFit: 'contain',
        }}
      />
    </a>
  );
};
