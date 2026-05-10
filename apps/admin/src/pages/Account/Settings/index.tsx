import { GridContent } from "@ant-design/pro-components";
import { Menu } from "antd";
import React, { useLayoutEffect, useRef, useState } from "react";
import { useIntl } from "@umijs/max";
import BaseView from "./components/base";
import BindingView from "./components/binding";
import NotificationView from "./components/notification";
import SecurityView from "./components/security";
import useStyles from "./style";

type SettingsStateKeys = "base" | "security" | "binding" | "notification";
type SettingsState = {
  mode: "inline" | "horizontal";
  selectKey: SettingsStateKeys;
};

const SettingsContent: React.FC<{ selectKey: SettingsStateKeys }> = ({
  selectKey,
}) => {
  switch (selectKey) {
    case "base":
      return <BaseView />;
    case "security":
      return <SecurityView />;
    case "binding":
      return <BindingView />;
    case "notification":
      return <NotificationView />;
    default:
      return null;
  }
};

const Settings: React.FC = () => {
  const intl = useIntl();
  const { styles } = useStyles();
  const menuMap: Record<string, string> = {
    base: intl.formatMessage({
      id: "pages.account.settings.menu.base",
      defaultMessage: "基本设置",
    }),
    security: intl.formatMessage({
      id: "pages.account.settings.menu.security",
      defaultMessage: "安全设置",
    }),
    binding: intl.formatMessage({
      id: "pages.account.settings.menu.binding",
      defaultMessage: "账号绑定",
    }),
    notification: intl.formatMessage({
      id: "pages.account.settings.menu.notification",
      defaultMessage: "新消息通知",
    }),
  };
  const [initConfig, setInitConfig] = useState<SettingsState>({
    mode: "inline",
    selectKey: "base",
  });
  const dom = useRef<HTMLDivElement>(null);

  const resize = () => {
    requestAnimationFrame(() => {
      if (!dom.current) {
        return;
      }
      let mode: "inline" | "horizontal" = "inline";
      const { offsetWidth } = dom.current;
      if (offsetWidth < 641 && offsetWidth > 400) {
        mode = "horizontal";
      }
      if (window.innerWidth < 768 && offsetWidth > 400) {
        mode = "horizontal";
      }
      setInitConfig((prev) => ({
        ...prev,
        mode: mode as SettingsState["mode"],
      }));
    });
  };

  const resizeRef = useRef(resize);
  resizeRef.current = resize;

  useLayoutEffect(() => {
    const handler = () => resizeRef.current();
    window.addEventListener("resize", handler);
    handler();
    return () => {
      window.removeEventListener("resize", handler);
    };
  }, []);

  const getMenu = () => {
    return Object.keys(menuMap).map((item) => ({
      key: item,
      label: menuMap[item],
    }));
  };

  return (
    <GridContent>
      <div
        className={styles.main}
        ref={(ref) => {
          if (ref) {
            dom.current = ref;
          }
        }}
      >
        <div className={styles.leftMenu}>
          <Menu
            mode={initConfig.mode}
            selectedKeys={[initConfig.selectKey]}
            onClick={({ key }) => {
              setInitConfig((prev) => ({
                ...prev,
                selectKey: key as SettingsStateKeys,
              }));
            }}
            items={getMenu()}
          />
        </div>
        <div className={styles.right}>
          <div className={styles.title}>{menuMap[initConfig.selectKey]}</div>
          <SettingsContent selectKey={initConfig.selectKey} />
        </div>
      </div>
    </GridContent>
  );
};

export default Settings;
