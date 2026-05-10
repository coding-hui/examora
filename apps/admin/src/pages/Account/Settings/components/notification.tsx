import { List, Switch } from "antd";
import React from "react";
import { useIntl } from "@umijs/max";

type NotificationItem = {
  title: string;
  description: string;
  actions: React.ReactNode[];
};

const NotificationView: React.FC = () => {
  const intl = useIntl();

  const Action = (
    <Switch
      checkedChildren={intl.formatMessage({
        id: "pages.account.settings.switch.on",
        defaultMessage: "开",
      })}
      unCheckedChildren={intl.formatMessage({
        id: "pages.account.settings.switch.off",
        defaultMessage: "关",
      })}
      defaultChecked
    />
  );

  const getData = (): NotificationItem[] => [
    {
      title: intl.formatMessage({
        id: "pages.account.settings.notification.user.title",
        defaultMessage: "用户消息",
      }),
      description: intl.formatMessage({
        id: "pages.account.settings.notification.user.desc",
        defaultMessage: "其他用户的消息将以站内信的形式通知",
      }),
      actions: [Action],
    },
    {
      title: intl.formatMessage({
        id: "pages.account.settings.notification.system.title",
        defaultMessage: "系统消息",
      }),
      description: intl.formatMessage({
        id: "pages.account.settings.notification.system.desc",
        defaultMessage: "系统消息将以站内信的形式通知",
      }),
      actions: [Action],
    },
    {
      title: intl.formatMessage({
        id: "pages.account.settings.notification.todo.title",
        defaultMessage: "待办任务",
      }),
      description: intl.formatMessage({
        id: "pages.account.settings.notification.todo.desc",
        defaultMessage: "待办任务将以站内信的形式通知",
      }),
      actions: [Action],
    },
  ];

  return (
    <List<NotificationItem>
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

export default NotificationView;
