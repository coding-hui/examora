import { List } from "antd";
import React from "react";
import { useIntl } from "@umijs/max";

type SecurityItem = {
  title: string;
  description: React.ReactNode;
  actions: React.ReactNode[];
};

const SecurityView: React.FC = () => {
  const intl = useIntl();

  const getData = (): SecurityItem[] => [
    {
      title: intl.formatMessage({
        id: "pages.account.settings.security.password.title",
        defaultMessage: "账户密码",
      }),
      description: intl.formatMessage({
        id: "pages.account.settings.security.password.desc",
        defaultMessage: "密码由认证服务统一管理，请前往登录页面重置",
      }),
      actions: [
        <a key="Modify" href="/login" target="_blank" rel="noopener noreferrer">
          {intl.formatMessage({
            id: "pages.account.settings.security.password.action",
            defaultMessage: "前往",
          })}
        </a>,
      ],
    },
    {
      title: intl.formatMessage({
        id: "pages.account.settings.security.mfa.title",
        defaultMessage: "MFA 设备",
      }),
      description: intl.formatMessage({
        id: "pages.account.settings.security.mfa.desc",
        defaultMessage: "多因素认证由认证服务配置",
      }),
      actions: [],
    },
  ];

  return (
    <List<SecurityItem>
      itemLayout="horizontal"
      dataSource={getData()}
      renderItem={(item) => (
        <List.Item actions={item.actions}>
          <List.Item.Meta title={item.title} description={item.description} />
        </List.Item>
      )}
    />
  );
};

export default SecurityView;
