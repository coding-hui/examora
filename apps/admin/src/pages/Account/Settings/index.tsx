import { PageContainer, ProCard } from '@ant-design/pro-components';
import { useModel } from '@umijs/max';
import { Descriptions, Space, Tabs, Tag, Typography } from 'antd';
import React from 'react';

const { Text } = Typography;

const AccountSettings: React.FC = () => {
  const { initialState } = useModel('@@initialState');
  const user = initialState?.currentUser;

  return (
    <PageContainer title="个人设置" content="管理当前账号信息与本地界面偏好。">
      <ProCard variant="outlined">
        <Tabs
          tabPlacement="start"
          items={[
            {
              key: 'profile',
              label: '基础资料',
              children: (
                <Space
                  orientation="vertical"
                  size={16}
                  style={{ width: '100%' }}
                >
                  <Text type="secondary">
                    账号资料来自认证服务，当前页面仅展示后台可读取的信息。
                  </Text>
                  <Descriptions
                    column={1}
                    items={[
                      {
                        key: 'username',
                        label: '用户名',
                        children: user?.username || '-',
                      },
                      {
                        key: 'displayName',
                        label: '显示名称',
                        children: user?.display_name || '-',
                      },
                      {
                        key: 'roles',
                        label: '角色',
                        children: user?.roles?.length
                          ? user.roles.map((role: string) => (
                              <Tag key={role}>{role}</Tag>
                            ))
                          : '-',
                      },
                    ]}
                  />
                </Space>
              ),
            },
            {
              key: 'appearance',
              label: '界面偏好',
              children: (
                <Space orientation="vertical" size={12}>
                  <Text type="secondary">
                    界面偏好请使用右侧悬浮的官方主题配置面板进行调整。
                  </Text>
                  <Text type="secondary">
                    配置会保存在当前浏览器，并在刷新后继续生效。
                  </Text>
                </Space>
              ),
            },
          ]}
        />
      </ProCard>
    </PageContainer>
  );
};

export default AccountSettings;
