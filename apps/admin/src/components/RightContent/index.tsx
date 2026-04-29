import { SelectLang as UmiSelectLang } from '@umijs/max';

export type SiderTheme = 'light' | 'dark';

export const SelectLang = () => <UmiSelectLang style={{ padding: 4 }} />;

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
      }}
    >
      <img
        src="/logo.svg"
        alt="Examora"
        style={{
          height: '18px',
          width: '18px',
          objectFit: 'contain',
        }}
      />
    </a>
  );
};
