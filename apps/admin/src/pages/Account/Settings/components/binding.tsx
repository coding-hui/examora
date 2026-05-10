import {
  DingdingOutlined,
  GithubOutlined,
  GoogleOutlined,
  WechatOutlined,
} from "@ant-design/icons";
import { List } from "antd";
import React from "react";
import { useIntl } from "@umijs/max";

type BindingItem = {
  title: string;
  description: string;
  avatar: React.ReactNode;
  actions: React.ReactNode[];
};

const BindingView: React.FC = () => {
  const intl = useIntl();

  const getData = (): BindingItem[] => [
    {
      title: intl.formatMessage({
        id: "pages.account.settings.binding.wechat",
        defaultMessage: "绑定微信",
      }),
      description: intl.formatMessage({
        id: "pages.account.settings.binding.wechat.desc",
        defaultMessage: "当前未绑定微信账号",
      }),
      avatar: <WechatOutlined style={{ color: "#07c160", fontSize: 48 }} />,
      actions: [
        <a key="Bind" href="#">
          {intl.formatMessage({
            id: "pages.account.settings.binding.bind",
            defaultMessage: "绑定",
          })}
        </a>,
      ],
    },
    {
      title: intl.formatMessage({
        id: "pages.account.settings.binding.github",
        defaultMessage: "绑定 GitHub",
      }),
      description: intl.formatMessage({
        id: "pages.account.settings.binding.github.desc",
        defaultMessage: "当前未绑定 GitHub 账号",
      }),
      avatar: <GithubOutlined style={{ fontSize: 48 }} />,
      actions: [
        <a key="Bind" href="#">
          {intl.formatMessage({
            id: "pages.account.settings.binding.bind",
            defaultMessage: "绑定",
          })}
        </a>,
      ],
    },
    {
      title: intl.formatMessage({
        id: "pages.account.settings.binding.dingtalk",
        defaultMessage: "绑定钉钉",
      }),
      description: intl.formatMessage({
        id: "pages.account.settings.binding.dingtalk.desc",
        defaultMessage: "当前未绑定钉钉账号",
      }),
      avatar: <DingdingOutlined style={{ color: "#2eabff", fontSize: 48 }} />,
      actions: [
        <a key="Bind" href="#">
          {intl.formatMessage({
            id: "pages.account.settings.binding.bind",
            defaultMessage: "绑定",
          })}
        </a>,
      ],
    },
    {
      title: intl.formatMessage({
        id: "pages.account.settings.binding.google",
        defaultMessage: "绑定 Google",
      }),
      description: intl.formatMessage({
        id: "pages.account.settings.binding.google.desc",
        defaultMessage: "当前未绑定 Google 账号",
      }),
      avatar: <GoogleOutlined style={{ color: "#4285f4", fontSize: 48 }} />,
      actions: [
        <a key="Bind" href="#">
          {intl.formatMessage({
            id: "pages.account.settings.binding.bind",
            defaultMessage: "绑定",
          })}
        </a>,
      ],
    },
  ];

  return (
    <List<BindingItem>
      itemLayout="horizontal"
      dataSource={getData()}
      renderItem={(item) => (
        <List.Item actions={item.actions}>
          <List.Item.Meta
            avatar={item.avatar}
            title={item.title}
            description={item.description}
          />
        </List.Item>
      )}
    />
  );
};

export default BindingView;
