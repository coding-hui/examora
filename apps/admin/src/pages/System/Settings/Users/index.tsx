import { PlusOutlined } from '@ant-design/icons';
import { PageContainer } from '@ant-design/pro-components';
import { request, useIntl } from '@umijs/max';
import { Button, Card, message, Table, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import React, { useEffect, useState } from 'react';

interface User {
  id: number;
  username: string;
  display_name?: string;
  email?: string;
  role: string;
  status: string;
  created_at: string;
}

const UserList: React.FC = () => {
  const intl = useIntl();
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await request<{
        code: number;
        data: { items: User[]; total: number };
      }>('/api/admin/users', { params: { page: 1, page_size: 100 } });
      if (response.data) {
        setUsers(response.data.items || []);
        setTotal(response.data.total || 0);
      }
    } catch (_error) {
      message.error(
        intl.formatMessage({
          id: 'pages.users.fetchError',
          defaultMessage: '获取用户列表失败',
        }),
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const roleColors: Record<string, string> = {
    ADMIN: 'red',
    TEACHER: 'blue',
    STUDENT: 'green',
  };

  const statusColors: Record<string, string> = {
    ACTIVE: 'success',
    INACTIVE: 'default',
    SUSPENDED: 'error',
  };

  const columns: ColumnsType<User> = [
    {
      title: intl.formatMessage({
        id: 'pages.users.columns.id',
        defaultMessage: 'ID',
      }),
      dataIndex: 'id',
      key: 'id',
      width: 80,
    },
    {
      title: intl.formatMessage({
        id: 'pages.users.columns.username',
        defaultMessage: '用户名',
      }),
      dataIndex: 'username',
      key: 'username',
    },
    {
      title: intl.formatMessage({
        id: 'pages.users.columns.displayName',
        defaultMessage: '显示名称',
      }),
      dataIndex: 'display_name',
      key: 'display_name',
      render: (name: string) => name || '-',
    },
    {
      title: intl.formatMessage({
        id: 'pages.users.columns.email',
        defaultMessage: '邮箱',
      }),
      dataIndex: 'email',
      key: 'email',
      render: (email: string) => email || '-',
    },
    {
      title: intl.formatMessage({
        id: 'pages.users.columns.role',
        defaultMessage: '角色',
      }),
      dataIndex: 'role',
      key: 'role',
      render: (role: string) => (
        <Tag color={roleColors[role] || 'default'}>{role}</Tag>
      ),
    },
    {
      title: intl.formatMessage({
        id: 'pages.users.columns.status',
        defaultMessage: '状态',
      }),
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={statusColors[status] || 'default'}>{status}</Tag>
      ),
    },
    {
      title: intl.formatMessage({
        id: 'pages.users.columns.createdAt',
        defaultMessage: '创建时间',
      }),
      dataIndex: 'created_at',
      key: 'created_at',
      render: (time: string) => dayjs(time).format('YYYY-MM-DD HH:mm'),
    },
  ];

  return (
    <PageContainer
      title={intl.formatMessage({
        id: 'menu.system.settings.users',
        defaultMessage: '用户管理',
      })}
    >
      <Card>
        <div className="mb-4 flex justify-between">
          <h2>
            {intl.formatMessage({
              id: 'pages.users.title',
              defaultMessage: '用户列表',
            })}
          </h2>
          <Button type="primary" icon={<PlusOutlined />}>
            {intl.formatMessage({
              id: 'common.create',
              defaultMessage: '创建用户',
            })}
          </Button>
        </div>
        <Table
          columns={columns}
          dataSource={users}
          loading={loading}
          rowKey="id"
          pagination={{ total, pageSize: 100 }}
        />
      </Card>
    </PageContainer>
  );
};

export default UserList;
