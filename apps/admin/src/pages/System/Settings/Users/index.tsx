import {
  DeleteOutlined,
  DownOutlined,
  EditOutlined,
  PlusOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import {
  type ActionType,
  PageContainer,
  type ProColumns,
  ProTable,
} from '@ant-design/pro-components';
import type {
  AdminUserGroup,
  AdminUserGroupTreeResponse,
} from '@examora/types';
import { API_PATHS } from '@examora/types';
import { request, useIntl } from '@umijs/max';
import {
  App as AntdApp,
  Button,
  Col,
  Drawer,
  Dropdown,
  Form,
  Input,
  Modal,
  Row,
  Select,
  Space,
  Tag,
  Tooltip,
} from 'antd';
import dayjs from 'dayjs';
import React, { useMemo, useRef, useState } from 'react';
import './index.less';

interface User {
  id: number;
  username: string;
  display_name?: string;
  email?: string;
  role: string;
  status: string;
  created_at: string;
  source?: string;
}

interface UserFormValues {
  username: string;
  display_name?: string;
  email?: string;
  role: 'ADMIN' | 'TEACHER' | 'STUDENT';
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
}

const ROLE_KEYS = ['ADMIN', 'TEACHER', 'STUDENT'] as const;
const STATUS_KEYS = ['ACTIVE', 'INACTIVE', 'SUSPENDED'] as const;

const normalizeRole = (role?: string) => {
  const normalized = role?.toUpperCase();
  if (normalized === 'CLIENT') return 'STUDENT';
  return normalized || '';
};

const normalizeStatus = (status?: string) => status?.toUpperCase() || '';

const flattenGroups = (groups: AdminUserGroup[]): AdminUserGroup[] =>
  groups.flatMap((group) => [group, ...flattenGroups(group.children || [])]);

const groupPath = (groupID: number, groups: AdminUserGroup[]) => {
  const flat = flattenGroups(groups);
  const byID = new Map(flat.map((group) => [group.id, group]));
  const parts: string[] = [];
  let current = byID.get(groupID);
  while (current) {
    parts.unshift(current.name);
    current = current.parent_id ? byID.get(current.parent_id) : undefined;
  }
  return parts.join(' / ');
};

const UserListContent: React.FC = () => {
  const intl = useIntl();
  const { message: antdMessage } = AntdApp.useApp();
  const [userForm] = Form.useForm<UserFormValues>();
  const actionRef = useRef<ActionType>(null);
  const [tableLoading, setTableLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [selectedUserIDs, setSelectedUserIDs] = useState<number[]>([]);
  const [groups, setGroups] = useState<AdminUserGroup[]>([]);
  const [groupID, setGroupID] = useState<number | undefined>();
  const [groupModalOpen, setGroupModalOpen] = useState(false);

  // i18n label maps
  const roleLabelMap: Record<string, string> = useMemo(
    () => ({
      ADMIN: intl.formatMessage({
        id: 'pages.users.roles.ADMIN',
        defaultMessage: '管理员',
      }),
      TEACHER: intl.formatMessage({
        id: 'pages.users.roles.TEACHER',
        defaultMessage: '教师',
      }),
      STUDENT: intl.formatMessage({
        id: 'pages.users.roles.STUDENT',
        defaultMessage: '学生',
      }),
    }),
    [intl],
  );

  const statusLabelMap: Record<string, string> = useMemo(
    () => ({
      ACTIVE: intl.formatMessage({
        id: 'pages.users.statuses.ACTIVE',
        defaultMessage: '启用',
      }),
      INACTIVE: intl.formatMessage({
        id: 'pages.users.statuses.INACTIVE',
        defaultMessage: '停用',
      }),
      SUSPENDED: intl.formatMessage({
        id: 'pages.users.statuses.SUSPENDED',
        defaultMessage: '封禁',
      }),
    }),
    [intl],
  );

  // i18n'd select options
  const roleOptions = useMemo(
    () => ROLE_KEYS.map((v) => ({ label: roleLabelMap[v], value: v })),
    [roleLabelMap],
  );

  const statusOptions = useMemo(
    () => STATUS_KEYS.map((v) => ({ label: statusLabelMap[v], value: v })),
    [statusLabelMap],
  );

  // valueEnums for ProTable
  const roleValueEnum = useMemo(
    () =>
      Object.fromEntries(ROLE_KEYS.map((v) => [v, { text: roleLabelMap[v] }])),
    [roleLabelMap],
  );

  const statusValueEnum = useMemo(
    () =>
      Object.fromEntries(
        STATUS_KEYS.map((v) => [v, { text: statusLabelMap[v] }]),
      ),
    [statusLabelMap],
  );

  const groupOptions = useMemo(
    () =>
      flattenGroups(groups).map((group) => ({
        value: group.id,
        label: groupPath(group.id, groups),
      })),
    [groups],
  );

  const loadGroups = async () => {
    try {
      const response = await request<{
        code: number;
        data: AdminUserGroupTreeResponse;
      }>(API_PATHS.admin.userGroupTree);
      setGroups(response.data?.items || []);
    } catch (_error) {
      antdMessage.error(
        intl.formatMessage({
          id: 'pages.users.groupsLoadError',
          defaultMessage: '加载用户组失败',
        }),
      );
    }
  };

  const openCreate = () => {
    setEditing(null);
    userForm.resetFields();
    setModalOpen(true);
  };

  const openEdit = (user: User) => {
    setEditing(user);
    userForm.setFieldsValue({
      username: user.username,
      display_name: user.display_name,
      email: user.email,
      role: normalizeRole(user.role) as UserFormValues['role'],
      status: normalizeStatus(user.status) as UserFormValues['status'],
    });
    setDrawerOpen(true);
  };

  const saveUser = async () => {
    try {
      const values = await userForm.validateFields();
      setSaving(true);
      await request(
        editing ? API_PATHS.admin.user(editing.id) : API_PATHS.admin.users,
        {
          method: editing ? 'PUT' : 'POST',
          data: values,
        },
      );
      antdMessage.success(
        editing
          ? intl.formatMessage({
              id: 'pages.users.saveSuccess',
              defaultMessage: '用户已保存',
            })
          : intl.formatMessage({
              id: 'pages.users.createSuccess',
              defaultMessage: '用户已创建',
            }),
      );
      if (editing) {
        setDrawerOpen(false);
      } else {
        setModalOpen(false);
      }
      actionRef.current?.reload();
    } catch (_error) {
      antdMessage.error(
        editing
          ? intl.formatMessage({
              id: 'pages.users.saveError',
              defaultMessage: '保存用户失败',
            })
          : intl.formatMessage({
              id: 'pages.users.createError',
              defaultMessage: '创建用户失败',
            }),
      );
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = (user: User) => {
    Modal.confirm({
      title: intl.formatMessage({
        id: 'pages.users.deleteConfirmTitle',
        defaultMessage: '确认删除',
      }),
      content: intl.formatMessage(
        {
          id: 'pages.users.deleteConfirmContent',
          defaultMessage: '确定要删除用户「{username}」吗？此操作不可撤销。',
        },
        { username: user.username },
      ),
      okText: intl.formatMessage({
        id: 'pages.users.delete',
        defaultMessage: '删除',
      }),
      okType: 'danger',
      cancelText: intl.formatMessage({
        id: 'pages.users.cancel',
        defaultMessage: '取消',
      }),
      onOk: async () => {
        try {
          await request(API_PATHS.admin.user(user.id), {
            method: 'DELETE',
          });
          antdMessage.success(
            intl.formatMessage({
              id: 'pages.users.deleteSuccess',
              defaultMessage: '用户已删除',
            }),
          );
          actionRef.current?.reload();
        } catch (_error) {
          antdMessage.error(
            intl.formatMessage({
              id: 'pages.users.deleteError',
              defaultMessage: '删除用户失败',
            }),
          );
        }
      },
    });
  };

  const openJoinGroup = () => {
    setGroupID(undefined);
    setGroupModalOpen(true);
    loadGroups();
  };

  const joinGroup = async () => {
    if (!groupID || selectedUserIDs.length === 0) return;
    setSaving(true);
    try {
      await request(API_PATHS.admin.userGroupMembers(groupID), {
        method: 'POST',
        data: { ids: selectedUserIDs },
      });
      antdMessage.success(
        intl.formatMessage({
          id: 'pages.users.joinGroupSuccess',
          defaultMessage: '用户已加入用户组',
        }),
      );
      setGroupModalOpen(false);
      setSelectedUserIDs([]);
      actionRef.current?.reload();
    } catch (_error) {
      antdMessage.error(
        intl.formatMessage({
          id: 'pages.users.joinGroupError',
          defaultMessage: '加入用户组失败',
        }),
      );
    } finally {
      setSaving(false);
    }
  };

  const columns: ProColumns<User>[] = [
    {
      title: intl.formatMessage({
        id: 'pages.users.columns.keyword',
        defaultMessage: '关键词',
      }),
      dataIndex: 'keyword',
      valueType: 'text',
      hideInTable: true,
      order: 100,
      fieldProps: {
        allowClear: true,
        placeholder: intl.formatMessage({
          id: 'pages.users.search.placeholder',
          defaultMessage: '搜索用户名、邮箱...',
        }),
      },
    },
    {
      title: intl.formatMessage({
        id: 'pages.users.columns.id',
        defaultMessage: 'ID',
      }),
      dataIndex: 'id',
      key: 'id',
      hideInTable: true,
      search: false,
      sorter: true,
    },
    {
      title: intl.formatMessage({
        id: 'pages.users.columns.username',
        defaultMessage: '用户',
      }),
      dataIndex: 'username',
      key: 'username',
      width: 320,
      search: false,
      render: (_: unknown, user: User) => {
        const firstChar = (user.display_name || user.username)
          .charAt(0)
          .toUpperCase();
        return (
          <div className="user-name-cell">
            <div className="user-avatar" aria-hidden="true">
              {firstChar}
            </div>
            <div className="user-name-main">
              <Tooltip title={user.display_name || user.username}>
                <span className="user-name-text">
                  {user.display_name || user.username}
                </span>
              </Tooltip>
              <div className="user-name-sub">{user.email || '-'}</div>
            </div>
          </div>
        );
      },
    },
    {
      title: intl.formatMessage({
        id: 'pages.users.columns.role',
        defaultMessage: '角色',
      }),
      dataIndex: 'role',
      key: 'role',
      width: 90,
      search: true,
      valueEnum: roleValueEnum,
      render: (_, user) => {
        const roleKey = normalizeRole(user.role);
        return (
          <Tag className="user-role-tag">
            {roleLabelMap[roleKey] || user.role}
          </Tag>
        );
      },
    },
    {
      title: intl.formatMessage({
        id: 'pages.users.columns.status',
        defaultMessage: '状态',
      }),
      dataIndex: 'status',
      key: 'status',
      width: 90,
      search: true,
      valueEnum: statusValueEnum,
      render: (_, user) => {
        const statusKey = normalizeStatus(user.status);
        return (
          <Tag
            className={`user-status-tag user-status-${statusKey.toLowerCase()}`}
          >
            {statusLabelMap[statusKey] || user.status}
          </Tag>
        );
      },
    },
    {
      title: intl.formatMessage({
        id: 'pages.users.columns.source',
        defaultMessage: '来源',
      }),
      dataIndex: 'source',
      key: 'source',
      width: 90,
      valueEnum: {
        LOCAL: {
          text: intl.formatMessage({
            id: 'pages.users.source.LOCAL',
            defaultMessage: '本地',
          }),
        },
        LOGTO: { text: 'Logto' },
        OIDC: { text: 'OIDC' },
        SCIM: { text: 'SCIM' },
      },
      render: (_, user) => <Tag>{user.source || 'LOCAL'}</Tag>,
    },
    {
      title: intl.formatMessage({
        id: 'pages.users.columns.createdAt',
        defaultMessage: '创建时间',
      }),
      dataIndex: 'created_at',
      key: 'created_at',
      width: 150,
      search: false,
      sorter: true,
      render: (_, user) => (
        <span className="user-date">
          {dayjs(user.created_at).format('YYYY-MM-DD HH:mm')}
        </span>
      ),
    },
    {
      title: intl.formatMessage({
        id: 'common.actions',
        defaultMessage: '操作',
      }),
      key: 'actions',
      width: 80,
      fixed: 'right' as const,
      search: false,
      hideInSetting: true,
      render: (_: unknown, user: User) => (
        <div className="user-actions-cell" onClick={(e) => e.stopPropagation()}>
          <Dropdown
            menu={{
              items: [
                {
                  key: 'edit',
                  label: intl.formatMessage({
                    id: 'pages.users.edit',
                    defaultMessage: '编辑',
                  }),
                  icon: <EditOutlined />,
                  onClick: () => openEdit(user),
                },
                {
                  key: 'delete',
                  label: intl.formatMessage({
                    id: 'pages.users.delete',
                    defaultMessage: '删除',
                  }),
                  icon: <DeleteOutlined />,
                  danger: true,
                  onClick: () => confirmDelete(user),
                },
              ],
            }}
            trigger={['click']}
          >
            <a onClick={(e) => e.preventDefault()}>
              <Space size={4}>
                {intl.formatMessage({
                  id: 'pages.users.more',
                  defaultMessage: '更多',
                })}
                <DownOutlined />
              </Space>
            </a>
          </Dropdown>
        </div>
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
        <p
          style={{
            margin: 0,
            color: 'var(--examora-text-secondary)',
            fontSize: 14,
          }}
        >
          {intl.formatMessage({
            id: 'pages.users.description',
            defaultMessage:
              '创建和管理平台用户账号，支持设置管理员、教师、学生等角色，以及启用、停用、封禁等账号状态。',
          })}
        </p>
      }
    >
      <ProTable<User>
        actionRef={actionRef}
        cardBordered={{
          search: true,
          table: true,
        }}
        columns={columns}
        columnsState={{
          persistenceKey: 'examora-system-users-table-columns',
          persistenceType: 'localStorage',
        }}
        columnEmptyText="-"
        dateFormatter="string"
        debounceTime={300}
        defaultSize="middle"
        headerTitle={intl.formatMessage({
          id: 'pages.users.listTitle',
          defaultMessage: '用户列表',
        })}
        loading={tableLoading}
        onLoadingChange={(loading) => {
          setTableLoading(Boolean(loading));
        }}
        options={{
          density: true,
          fullScreen: false,
          reload: true,
          setting: true,
        }}
        rowKey="id"
        search={{
          labelWidth: 'auto',
          span: {
            xs: 24,
            sm: 12,
            md: 8,
            lg: 6,
            xl: 6,
            xxl: 4,
          },
          defaultCollapsed: true,
          searchText: intl.formatMessage({
            id: 'pages.users.search.searchText',
            defaultMessage: '查询',
          }),
          resetText: intl.formatMessage({
            id: 'pages.users.search.resetText',
            defaultMessage: '重置',
          }),
        }}
        beforeSearchSubmit={(params) => ({
          ...params,
          keyword:
            typeof params.keyword === 'string'
              ? params.keyword.trim()
              : params.keyword,
        })}
        rowSelection={{
          selectedRowKeys: selectedUserIDs,
          preserveSelectedRowKeys: true,
          onChange: (keys) => setSelectedUserIDs(keys.map(Number)),
        }}
        tableAlertOptionRender={() => (
          <Space size={12}>
            <Button type="link" icon={<TeamOutlined />} onClick={openJoinGroup}>
              {intl.formatMessage({
                id: 'pages.users.joinGroup',
                defaultMessage: '加入用户组',
              })}
            </Button>
            <Button type="link" onClick={() => setSelectedUserIDs([])}>
              {intl.formatMessage({
                id: 'pages.users.clearSelection',
                defaultMessage: '清空',
              })}
            </Button>
          </Space>
        )}
        request={async ({
          current,
          pageSize,
          keyword,
          role,
          status,
          source,
        }) => {
          try {
            const trimmedKeyword =
              typeof keyword === 'string' ? keyword.trim() : undefined;
            const response = await request<{
              code: number;
              data: { items: User[]; total: number };
            }>(API_PATHS.admin.users, {
              params: {
                page: current,
                page_size: pageSize,
                ...(trimmedKeyword ? { keyword: trimmedKeyword } : {}),
                ...(role ? { role } : {}),
                ...(status ? { status } : {}),
                ...(source ? { source } : {}),
              },
            });

            return {
              data: response.data?.items || [],
              total: response.data?.total || 0,
              success: true,
            };
          } catch (_error) {
            antdMessage.error(
              intl.formatMessage({
                id: 'pages.users.fetchError',
                defaultMessage: '获取用户列表失败',
              }),
            );
            return {
              data: [],
              total: 0,
              success: false,
            };
          }
        }}
        pagination={{
          defaultPageSize: 20,
          showSizeChanger: true,
          pageSizeOptions: [10, 20, 50, 100],
          showTotal: (total) =>
            intl.formatMessage(
              {
                id: 'pages.users.total',
                defaultMessage: '共 {total} 条',
              },
              { total },
            ),
        }}
        revalidateOnFocus={false}
        scroll={{ x: 750 }}
        tableLayout="fixed"
        toolBarRender={() => [
          <Button
            key="create"
            type="primary"
            icon={<PlusOutlined />}
            onClick={openCreate}
          >
            {intl.formatMessage({
              id: 'pages.users.create',
              defaultMessage: '添加用户',
            })}
          </Button>,
        ]}
      />

      <Modal
        title={intl.formatMessage({
          id: 'pages.users.modal.createTitle',
          defaultMessage: '添加用户',
        })}
        width={600}
        open={modalOpen}
        onCancel={() => {
          setSaving(false);
          setModalOpen(false);
        }}
        footer={null}
        centered
      >
        <Form
          form={userForm}
          layout="vertical"
          onFinish={async () => {
            try {
              await userForm.validateFields();
              setSaving(true);
              await request(API_PATHS.admin.users, {
                method: 'POST',
                data: userForm.getFieldsValue(),
              });
              antdMessage.success(
                intl.formatMessage({
                  id: 'pages.users.createSuccess',
                  defaultMessage: '用户已创建',
                }),
              );
              setModalOpen(false);
              actionRef.current?.reload();
            } catch (_error) {
              antdMessage.error(
                intl.formatMessage({
                  id: 'pages.users.createError',
                  defaultMessage: '创建用户失败',
                }),
              );
            } finally {
              setSaving(false);
            }
          }}
        >
          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                label={intl.formatMessage({
                  id: 'pages.users.form.username.label',
                  defaultMessage: '用户名',
                })}
                name="username"
                rules={[
                  {
                    required: true,
                    message: intl.formatMessage({
                      id: 'pages.users.form.username.required',
                      defaultMessage: '请输入用户名',
                    }),
                  },
                  {
                    min: 3,
                    message: intl.formatMessage({
                      id: 'pages.users.form.username.minLength',
                      defaultMessage: '用户名至少 3 个字符',
                    }),
                  },
                ]}
              >
                <Input
                  placeholder={intl.formatMessage({
                    id: 'pages.users.form.username.placeholder',
                    defaultMessage: '输入用户名',
                  })}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                label={intl.formatMessage({
                  id: 'pages.users.form.displayName.label',
                  defaultMessage: '显示名称',
                })}
                name="display_name"
              >
                <Input
                  placeholder={intl.formatMessage({
                    id: 'pages.users.form.displayName.placeholder',
                    defaultMessage: '输入显示名称（可选）',
                  })}
                />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item
            label={intl.formatMessage({
              id: 'pages.users.form.email.label',
              defaultMessage: '邮箱',
            })}
            name="email"
            rules={[
              {
                type: 'email',
                message: intl.formatMessage({
                  id: 'pages.users.form.email.invalid',
                  defaultMessage: '请输入有效的邮箱地址',
                }),
              },
            ]}
          >
            <Input
              placeholder={intl.formatMessage({
                id: 'pages.users.form.email.placeholder',
                defaultMessage: '输入邮箱（可选）',
              })}
            />
          </Form.Item>
          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                label={intl.formatMessage({
                  id: 'pages.users.form.role.label',
                  defaultMessage: '角色',
                })}
                name="role"
                rules={[
                  {
                    required: true,
                    message: intl.formatMessage({
                      id: 'pages.users.form.role.required',
                      defaultMessage: '请选择角色',
                    }),
                  },
                ]}
              >
                <Select
                  options={roleOptions}
                  placeholder={intl.formatMessage({
                    id: 'pages.users.form.role.placeholder',
                    defaultMessage: '选择角色',
                  })}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                label={intl.formatMessage({
                  id: 'pages.users.form.status.label',
                  defaultMessage: '状态',
                })}
                name="status"
                rules={[
                  {
                    required: true,
                    message: intl.formatMessage({
                      id: 'pages.users.form.status.required',
                      defaultMessage: '请选择状态',
                    }),
                  },
                ]}
              >
                <Select
                  options={statusOptions}
                  placeholder={intl.formatMessage({
                    id: 'pages.users.form.status.placeholder',
                    defaultMessage: '选择状态',
                  })}
                />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setModalOpen(false)}>
                {intl.formatMessage({
                  id: 'pages.users.cancel',
                  defaultMessage: '取消',
                })}
              </Button>
              <Button type="primary" htmlType="submit" loading={saving}>
                {intl.formatMessage({
                  id: 'pages.users.modal.submit',
                  defaultMessage: '添加用户',
                })}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Drawer
        title={
          editing
            ? intl.formatMessage({
                id: 'pages.users.drawerEditTitle',
                defaultMessage: '编辑用户',
              })
            : intl.formatMessage({
                id: 'pages.users.drawerCreateTitle',
                defaultMessage: '创建用户',
              })
        }
        size={520}
        open={drawerOpen}
        onClose={() => {
          setSaving(false);
          setDrawerOpen(false);
        }}
        extra={
          <Space>
            <Button type="primary" loading={saving} onClick={saveUser}>
              {intl.formatMessage({
                id: 'pages.users.save',
                defaultMessage: '保存',
              })}
            </Button>
          </Space>
        }
      >
        <Form form={userForm} layout="vertical">
          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                label={intl.formatMessage({
                  id: 'pages.users.form.username.label',
                  defaultMessage: '用户名',
                })}
                name="username"
                rules={[
                  {
                    required: true,
                    message: intl.formatMessage({
                      id: 'pages.users.form.username.required',
                      defaultMessage: '请输入用户名',
                    }),
                  },
                  {
                    min: 3,
                    message: intl.formatMessage({
                      id: 'pages.users.form.username.minLength',
                      defaultMessage: '用户名至少 3 个字符',
                    }),
                  },
                ]}
              >
                <Input
                  placeholder={intl.formatMessage({
                    id: 'pages.users.form.username.placeholder',
                    defaultMessage: '输入用户名',
                  })}
                  disabled={!!editing}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                label={intl.formatMessage({
                  id: 'pages.users.form.displayName.label',
                  defaultMessage: '显示名称',
                })}
                name="display_name"
              >
                <Input
                  placeholder={intl.formatMessage({
                    id: 'pages.users.form.displayName.placeholder',
                    defaultMessage: '输入显示名称（可选）',
                  })}
                />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item
            label={intl.formatMessage({
              id: 'pages.users.form.email.label',
              defaultMessage: '邮箱',
            })}
            name="email"
            rules={[
              {
                type: 'email',
                message: intl.formatMessage({
                  id: 'pages.users.form.email.invalid',
                  defaultMessage: '请输入有效的邮箱地址',
                }),
              },
            ]}
          >
            <Input
              placeholder={intl.formatMessage({
                id: 'pages.users.form.email.placeholder',
                defaultMessage: '输入邮箱（可选）',
              })}
            />
          </Form.Item>
          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                label={intl.formatMessage({
                  id: 'pages.users.form.role.label',
                  defaultMessage: '角色',
                })}
                name="role"
                rules={[
                  {
                    required: true,
                    message: intl.formatMessage({
                      id: 'pages.users.form.role.required',
                      defaultMessage: '请选择角色',
                    }),
                  },
                ]}
              >
                <Select
                  options={roleOptions}
                  placeholder={intl.formatMessage({
                    id: 'pages.users.form.role.placeholder',
                    defaultMessage: '选择角色',
                  })}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                label={intl.formatMessage({
                  id: 'pages.users.form.status.label',
                  defaultMessage: '状态',
                })}
                name="status"
                rules={[
                  {
                    required: true,
                    message: intl.formatMessage({
                      id: 'pages.users.form.status.required',
                      defaultMessage: '请选择状态',
                    }),
                  },
                ]}
              >
                <Select
                  options={statusOptions}
                  placeholder={intl.formatMessage({
                    id: 'pages.users.form.status.placeholder',
                    defaultMessage: '选择状态',
                  })}
                />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Drawer>

      <Modal
        width={520}
        centered
        open={groupModalOpen}
        title={intl.formatMessage({
          id: 'pages.users.joinGroup',
          defaultMessage: '加入用户组',
        })}
        onOk={joinGroup}
        okButtonProps={{ disabled: !groupID || selectedUserIDs.length === 0 }}
        confirmLoading={saving}
        onCancel={() => setGroupModalOpen(false)}
      >
        <Select
          showSearch
          allowClear
          style={{ width: '100%' }}
          options={groupOptions}
          value={groupID}
          onChange={setGroupID}
          optionFilterProp="label"
          placeholder={intl.formatMessage({
            id: 'pages.users.joinGroupPlaceholder',
            defaultMessage: '选择要加入的用户组',
          })}
        />
      </Modal>
    </PageContainer>
  );
};

const UserList: React.FC = () => (
  <AntdApp>
    <UserListContent />
  </AntdApp>
);

export default UserList;
