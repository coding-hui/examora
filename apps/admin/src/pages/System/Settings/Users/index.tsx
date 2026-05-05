import {
  DeleteOutlined,
  EditOutlined,
  MoreOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import { PageContainer } from '@ant-design/pro-components';
import { request, useIntl } from '@umijs/max';
import {
  App as AntdApp,
  Button,
  Card,
  Col,
  Drawer,
  Dropdown,
  Form,
  Input,
  Modal,
  Pagination,
  Row,
  Select,
  Space,
  Table,
  Tag,
} from 'antd';
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

interface UserFormValues {
  username: string;
  display_name?: string;
  email?: string;
  role: 'ADMIN' | 'TEACHER' | 'STUDENT';
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
}

const ROLES = [
  { label: '管理员', value: 'ADMIN' },
  { label: '教师', value: 'TEACHER' },
  { label: '学生', value: 'STUDENT' },
];

const STATUSES = [
  { label: '启用', value: 'ACTIVE' },
  { label: '停用', value: 'INACTIVE' },
  { label: '封禁', value: 'SUSPENDED' },
];

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

const UserListContent: React.FC = () => {
  const intl = useIntl();
  const { message: antdMessage } = AntdApp.useApp();
  const [userForm] = Form.useForm<UserFormValues>();
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await request<{
        code: number;
        data: { items: User[]; total: number };
      }>('/api/admin/users', {
        params: { page, page_size: pageSize },
      });
      if (response.data) {
        setUsers(response.data.items || []);
        setTotal(response.data.total || 0);
      }
    } catch (_error) {
      antdMessage.error('获取用户列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchUsers();
  }, [page, pageSize]);

  const openCreate = () => {
    setEditing(null);
    userForm.resetFields();
    setDrawerOpen(true);
  };

  const openEdit = (user: User) => {
    setEditing(user);
    userForm.setFieldsValue({
      username: user.username,
      display_name: user.display_name,
      email: user.email,
      role: user.role as UserFormValues['role'],
      status: user.status as UserFormValues['status'],
    });
    setDrawerOpen(true);
  };

  const saveUser = async () => {
    try {
      const values = await userForm.validateFields();
      setSaving(true);
      await request(
        editing ? `/api/admin/users/${editing.id}` : '/api/admin/users',
        {
          method: editing ? 'PUT' : 'POST',
          data: values,
        },
      );
      antdMessage.success(editing ? '用户已保存' : '用户已创建');
      setDrawerOpen(false);
      await fetchUsers();
    } catch (_error) {
      // form validation errors are handled by Form automatically
      antdMessage.error(editing ? '保存用户失败' : '创建用户失败');
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = (user: User) => {
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除用户「${user.username}」吗？此操作不可撤销。`,
      okText: '删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        try {
          await request(`/api/admin/users/${user.id}`, {
            method: 'DELETE',
          });
          antdMessage.success('用户已删除');
          await fetchUsers();
        } catch (_error) {
          antdMessage.error('删除用户失败');
        }
      },
    });
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
    {
      title: intl.formatMessage({
        id: 'common.actions',
        defaultMessage: '操作',
      }),
      key: 'actions',
      width: 96,
      fixed: 'right' as const,
      render: (_: unknown, user: User) => (
        <Dropdown
          menu={{
            items: [
              {
                key: 'edit',
                label: '编辑',
                icon: <EditOutlined />,
                onClick: () => openEdit(user),
              },
              {
                key: 'delete',
                label: '删除',
                icon: <DeleteOutlined />,
                danger: true,
                onClick: () => confirmDelete(user),
              },
            ],
          }}
          trigger={['click']}
        >
          <Button type="text" size="small" icon={<MoreOutlined />} />
        </Dropdown>
      ),
    },
  ];

  return (
    <PageContainer
      title={intl.formatMessage({
        id: 'menu.system.settings.users',
        defaultMessage: '用户管理',
      })}
      content={
        <p style={{ margin: '6px 0 0', color: '#6b7280', fontSize: 14 }}>
          创建和管理平台用户账号，支持设置管理员、教师、学生等角色，以及启用、停用、封禁等账号状态。
        </p>
      }
    >
      <Card>
        <div className="mb-4 flex justify-between">
          <h2>
            {intl.formatMessage({
              id: 'pages.users.title',
              defaultMessage: '用户列表',
            })}
          </h2>
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
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
          pagination={false}
          scroll={{ x: 900 }}
        />
        <div
          className="question-table-pagination"
          style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end' }}
        >
          <Pagination
            current={page}
            pageSize={pageSize}
            total={total}
            showSizeChanger
            pageSizeOptions={[10, 20, 50, 100]}
            onChange={(nextPage, nextPageSize) => {
              setPage(nextPageSize !== pageSize ? 1 : nextPage);
              setPageSize(nextPageSize);
            }}
          />
        </div>
      </Card>

      <Drawer
        title={editing ? '编辑用户' : '创建用户'}
        size={480}
        open={drawerOpen}
        onClose={() => {
          setSaving(false);
          setDrawerOpen(false);
        }}
        extra={
          <Space>
            <Button
              onClick={() => {
                setSaving(false);
                setDrawerOpen(false);
              }}
            >
              取消
            </Button>
            <Button type="primary" loading={saving} onClick={saveUser}>
              保存
            </Button>
          </Space>
        }
      >
        <Form form={userForm} layout="vertical">
          <Form.Item
            label="用户名"
            name="username"
            rules={[
              { required: true, message: '请输入用户名' },
              { min: 3, message: '用户名至少 3 个字符' },
            ]}
          >
            <Input placeholder="输入用户名" disabled={!!editing} />
          </Form.Item>
          <Form.Item label="显示名称" name="display_name">
            <Input placeholder="输入显示名称（可选）" />
          </Form.Item>
          <Form.Item
            label="邮箱"
            name="email"
            rules={[{ type: 'email', message: '请输入有效的邮箱地址' }]}
          >
            <Input placeholder="输入邮箱（可选）" />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="角色"
                name="role"
                rules={[{ required: true, message: '请选择角色' }]}
              >
                <Select options={ROLES} placeholder="选择角色" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="状态"
                name="status"
                rules={[{ required: true, message: '请选择状态' }]}
              >
                <Select options={STATUSES} placeholder="选择状态" />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Drawer>
    </PageContainer>
  );
};

const UserList: React.FC = () => (
  <AntdApp>
    <UserListContent />
  </AntdApp>
);

export default UserList;
