import { SafetyCertificateOutlined, UserOutlined } from '@ant-design/icons';
import { PageContainer, ProCard } from '@ant-design/pro-components';
import { useModel } from '@umijs/max';
import { Avatar, Descriptions, Empty, Space, Tag, Typography } from 'antd';
import React from 'react';

const { Text, Title } = Typography;

const AccountCenter: React.FC = () => {
  const { initialState } = useModel('@@initialState');
  const user = initialState?.currentUser;

  if (!user) {
    return (
      <PageContainer title="个人中心">
        <ProCard>
          <Empty description="暂无用户信息" />
        </ProCard>
      </PageContainer>
    );
  }

  const roles = user.roles || [];
  const permissions = (user.permissions || {}) as Record<string, string[]>;
  const permissionCount = Object.values(permissions).reduce(
    (count, actions: string[]) => count + actions.length,
    0,
  );
  const displayName = user.display_name || user.username;

  return (
    <PageContainer
      title="个人中心"
      content="查看当前后台账号的基础资料、角色与权限范围。"
    >
      <Space orientation="vertical" size={16} style={{ width: '100%' }}>
        <ProCard variant="outlined">
          <Space size={16} align="center">
            <Avatar size={64} icon={<UserOutlined />}>
              {displayName?.slice(0, 2).toUpperCase()}
            </Avatar>
            <div>
              <Title level={4} style={{ margin: 0 }}>
                {displayName}
              </Title>
              <Text type="secondary">{user.username}</Text>
            </div>
          </Space>
        </ProCard>

        <ProCard variant="outlined" title="账号信息">
          <Descriptions
            column={{ xs: 1, sm: 1, md: 2 }}
            items={[
              { key: 'id', label: '用户 ID', children: user.id },
              { key: 'username', label: '用户名', children: user.username },
              {
                key: 'displayName',
                label: '显示名称',
                children: user.display_name || '-',
              },
              {
                key: 'externalSubject',
                label: '外部身份',
                children: user.external_subject || '本地账号',
              },
              {
                key: 'roles',
                label: '角色',
                children: roles.length
                  ? roles.map((role: string) => <Tag key={role}>{role}</Tag>)
                  : '-',
              },
              {
                key: 'permissions',
                label: '权限项',
                children: (
                  <Space>
                    <SafetyCertificateOutlined />
                    <span>{permissionCount} 项</span>
                  </Space>
                ),
              },
            ]}
          />
        </ProCard>
      </Space>
    </PageContainer>
  );
};

export default AccountCenter;
