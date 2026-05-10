import {
  DeleteOutlined,
  DownOutlined,
  EditOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import {
  type ActionType,
  PageContainer,
  type ProColumns,
  ProTable,
} from "@ant-design/pro-components";
import { request, useIntl } from "@umijs/max";
import {
  App as AntdApp,
  Button,
  Col,
  Divider,
  Drawer,
  Dropdown,
  Form,
  Input,
  Modal,
  Row,
  Select,
  Space,
  Tag,
} from "antd";
import dayjs from "dayjs";
import React, { useMemo, useRef, useState } from "react";

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
  role: "ADMIN" | "TEACHER" | "STUDENT";
  status: "ACTIVE" | "INACTIVE" | "SUSPENDED";
}

const ROLES = [
  { label: "管理员", value: "ADMIN" },
  { label: "教师", value: "TEACHER" },
  { label: "学生", value: "STUDENT" },
];

const STATUSES = [
  { label: "启用", value: "ACTIVE" },
  { label: "停用", value: "INACTIVE" },
  { label: "封禁", value: "SUSPENDED" },
];

const roleColors: Record<string, string> = {
  ADMIN: "red",
  TEACHER: "blue",
  STUDENT: "green",
};

const statusColors: Record<string, string> = {
  ACTIVE: "success",
  INACTIVE: "default",
  SUSPENDED: "error",
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

  // i18n label maps
  const roleLabelMap = useMemo(
    () =>
      Object.fromEntries(
        ROLES.map((r) => [
          r.value,
          intl.formatMessage({
            id: `pages.users.roles.${r.value}`,
            defaultMessage: r.label,
          }),
        ])
      ),
    [intl]
  );

  const statusLabelMap = useMemo(
    () =>
      Object.fromEntries(
        STATUSES.map((s) => [
          s.value,
          intl.formatMessage({
            id: `pages.users.statuses.${s.value}`,
            defaultMessage: s.label,
          }),
        ])
      ),
    [intl]
  );

  // i18n'd select options
  const roleOptions = useMemo(
    () => ROLES.map((r) => ({ ...r, label: roleLabelMap[r.value] })),
    [roleLabelMap]
  );

  const statusOptions = useMemo(
    () => STATUSES.map((s) => ({ ...s, label: statusLabelMap[s.value] })),
    [statusLabelMap]
  );

  // valueEnums for ProTable
  const roleValueEnum = useMemo(
    () =>
      Object.fromEntries(
        ROLES.map((r) => [r.value, { text: roleLabelMap[r.value] }])
      ),
    [roleLabelMap]
  );

  const statusValueEnum = useMemo(
    () =>
      Object.fromEntries(
        STATUSES.map((s) => [s.value, { text: statusLabelMap[s.value] }])
      ),
    [statusLabelMap]
  );

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
      role: user.role as UserFormValues["role"],
      status: user.status as UserFormValues["status"],
    });
    setDrawerOpen(true);
  };

  const saveUser = async () => {
    try {
      const values = await userForm.validateFields();
      setSaving(true);
      await request(
        editing ? `/api/admin/users/${editing.id}` : "/api/admin/users",
        {
          method: editing ? "PUT" : "POST",
          data: values,
        }
      );
      antdMessage.success(
        editing
          ? intl.formatMessage({
              id: "pages.users.saveSuccess",
              defaultMessage: "用户已保存",
            })
          : intl.formatMessage({
              id: "pages.users.createSuccess",
              defaultMessage: "用户已创建",
            })
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
              id: "pages.users.saveError",
              defaultMessage: "保存用户失败",
            })
          : intl.formatMessage({
              id: "pages.users.createError",
              defaultMessage: "创建用户失败",
            })
      );
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = (user: User) => {
    Modal.confirm({
      title: intl.formatMessage({
        id: "pages.users.deleteConfirmTitle",
        defaultMessage: "确认删除",
      }),
      content: intl.formatMessage(
        {
          id: "pages.users.deleteConfirmContent",
          defaultMessage: "确定要删除用户「{username}」吗？此操作不可撤销。",
        },
        { username: user.username }
      ),
      okText: intl.formatMessage({
        id: "pages.users.delete",
        defaultMessage: "删除",
      }),
      okType: "danger",
      cancelText: intl.formatMessage({
        id: "pages.users.cancel",
        defaultMessage: "取消",
      }),
      onOk: async () => {
        try {
          await request(`/api/admin/users/${user.id}`, {
            method: "DELETE",
          });
          antdMessage.success(
            intl.formatMessage({
              id: "pages.users.deleteSuccess",
              defaultMessage: "用户已删除",
            })
          );
          actionRef.current?.reload();
        } catch (_error) {
          antdMessage.error(
            intl.formatMessage({
              id: "pages.users.deleteError",
              defaultMessage: "删除用户失败",
            })
          );
        }
      },
    });
  };

  const columns: ProColumns<User>[] = [
    {
      title: intl.formatMessage({
        id: "pages.users.columns.keyword",
        defaultMessage: "关键词",
      }),
      dataIndex: "keyword",
      valueType: "text",
      hideInTable: true,
      order: 100,
      fieldProps: {
        allowClear: true,
        placeholder: intl.formatMessage({
          id: "pages.users.search.placeholder",
          defaultMessage: "搜索用户名、邮箱...",
        }),
      },
    },
    {
      title: intl.formatMessage({
        id: "pages.users.columns.id",
        defaultMessage: "ID",
      }),
      dataIndex: "id",
      key: "id",
      hideInTable: true,
      search: false,
      sorter: true,
    },
    {
      title: intl.formatMessage({
        id: "pages.users.columns.username",
        defaultMessage: "用户名",
      }),
      dataIndex: "username",
      key: "username",
      width: 150,
      search: false,
      ellipsis: true,
    },
    {
      title: intl.formatMessage({
        id: "pages.users.columns.displayName",
        defaultMessage: "显示名称",
      }),
      dataIndex: "display_name",
      key: "display_name",
      width: 150,
      search: false,
      ellipsis: true,
      renderText: (name?: string) => name || "-",
    },
    {
      title: intl.formatMessage({
        id: "pages.users.columns.email",
        defaultMessage: "邮箱",
      }),
      dataIndex: "email",
      key: "email",
      width: 210,
      search: false,
      ellipsis: true,
      renderText: (email?: string) => email || "-",
    },
    {
      title: intl.formatMessage({
        id: "pages.users.columns.role",
        defaultMessage: "角色",
      }),
      dataIndex: "role",
      key: "role",
      width: 90,
      search: false,
      valueEnum: roleValueEnum,
      render: (_, user) => (
        <Tag color={roleColors[user.role] || "default"}>
          {roleLabelMap[user.role] || user.role}
        </Tag>
      ),
    },
    {
      title: intl.formatMessage({
        id: "pages.users.columns.status",
        defaultMessage: "状态",
      }),
      dataIndex: "status",
      key: "status",
      width: 90,
      search: false,
      valueEnum: statusValueEnum,
      render: (_, user) => (
        <Tag color={statusColors[user.status] || "default"}>
          {statusLabelMap[user.status] || user.status}
        </Tag>
      ),
    },
    {
      title: intl.formatMessage({
        id: "pages.users.columns.createdAt",
        defaultMessage: "创建时间",
      }),
      dataIndex: "created_at",
      key: "created_at",
      width: 150,
      search: false,
      sorter: true,
      render: (_, user) => dayjs(user.created_at).format("YYYY-MM-DD HH:mm"),
    },
    {
      title: intl.formatMessage({
        id: "common.actions",
        defaultMessage: "操作",
      }),
      key: "actions",
      width: 130,
      fixed: "right" as const,
      search: false,
      hideInSetting: true,
      render: (_: unknown, user: User) => (
        <div onClick={(e) => e.stopPropagation()}>
          <a onClick={() => openEdit(user)}>
            {intl.formatMessage({
              id: "pages.users.edit",
              defaultMessage: "编辑",
            })}
          </a>
          <Divider type="vertical" />
          <Dropdown
            menu={{
              items: [
                {
                  key: "delete",
                  label: intl.formatMessage({
                    id: "pages.users.delete",
                    defaultMessage: "删除",
                  }),
                  icon: <DeleteOutlined />,
                  danger: true,
                  onClick: () => confirmDelete(user),
                },
              ],
            }}
            trigger={["click"]}
          >
            <a onClick={(e) => e.preventDefault()}>
              <Space size={4}>
                {intl.formatMessage({
                  id: "pages.users.more",
                  defaultMessage: "更多",
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
        id: "menu.system.settings.users",
        defaultMessage: "用户管理",
      })}
      content={
        <p
          style={{
            margin: 0,
            color: "var(--examora-text-secondary)",
            fontSize: 14,
          }}
        >
          {intl.formatMessage({
            id: "pages.users.description",
            defaultMessage:
              "创建和管理平台用户账号，支持设置管理员、教师、学生等角色，以及启用、停用、封禁等账号状态。",
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
          persistenceKey: "examora-system-users-table-columns",
          persistenceType: "localStorage",
        }}
        columnEmptyText="-"
        dateFormatter="string"
        debounceTime={300}
        defaultSize="middle"
        headerTitle={intl.formatMessage({
          id: "pages.users.listTitle",
          defaultMessage: "用户列表",
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
          labelWidth: "auto",
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
            id: "pages.users.search.searchText",
            defaultMessage: "查询",
          }),
          resetText: intl.formatMessage({
            id: "pages.users.search.resetText",
            defaultMessage: "重置",
          }),
        }}
        beforeSearchSubmit={(params) => ({
          ...params,
          keyword:
            typeof params.keyword === "string"
              ? params.keyword.trim()
              : params.keyword,
        })}
        request={async ({ current, pageSize, keyword }) => {
          try {
            const trimmedKeyword =
              typeof keyword === "string" ? keyword.trim() : undefined;
            const response = await request<{
              code: number;
              data: { items: User[]; total: number };
            }>("/api/admin/users", {
              params: {
                page: current,
                page_size: pageSize,
                ...(trimmedKeyword ? { keyword: trimmedKeyword } : {}),
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
                id: "pages.users.fetchError",
                defaultMessage: "获取用户列表失败",
              })
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
                id: "pages.users.total",
                defaultMessage: "共 {total} 条",
              },
              { total }
            ),
        }}
        revalidateOnFocus={false}
        scroll={{ x: 900 }}
        tableLayout="fixed"
        toolBarRender={() => [
          <Button
            key="create"
            type="primary"
            icon={<PlusOutlined />}
            onClick={openCreate}
          >
            {intl.formatMessage({
              id: "pages.users.create",
              defaultMessage: "添加用户",
            })}
          </Button>,
        ]}
      />

      <Modal
        title={intl.formatMessage({
          id: "pages.users.modal.createTitle",
          defaultMessage: "添加用户",
        })}
        open={modalOpen}
        onCancel={() => {
          setSaving(false);
          setModalOpen(false);
        }}
        footer={null}
        centered
      >
        <p style={{ margin: "0 0 16px", color: "#888" }}>
          {intl.formatMessage({
            id: "pages.users.modal.description",
            defaultMessage: "提供以下至少一项字段才能继续",
          })}
        </p>
        <Form
          form={userForm}
          layout="vertical"
          onFinish={async () => {
            try {
              await userForm.validateFields();
              setSaving(true);
              await request("/api/admin/users", {
                method: "POST",
                data: userForm.getFieldsValue(),
              });
              antdMessage.success(
                intl.formatMessage({
                  id: "pages.users.createSuccess",
                  defaultMessage: "用户已创建",
                })
              );
              setModalOpen(false);
              actionRef.current?.reload();
            } catch (_error) {
              antdMessage.error(
                intl.formatMessage({
                  id: "pages.users.createError",
                  defaultMessage: "创建用户失败",
                })
              );
            } finally {
              setSaving(false);
            }
          }}
        >
          <Form.Item
            label={intl.formatMessage({
              id: "pages.users.form.username.label",
              defaultMessage: "用户名",
            })}
            name="username"
            rules={[
              {
                required: true,
                message: intl.formatMessage({
                  id: "pages.users.form.username.required",
                  defaultMessage: "请输入用户名",
                }),
              },
              {
                min: 3,
                message: intl.formatMessage({
                  id: "pages.users.form.username.minLength",
                  defaultMessage: "用户名至少 3 个字符",
                }),
              },
            ]}
          >
            <Input
              placeholder={intl.formatMessage({
                id: "pages.users.form.username.placeholder",
                defaultMessage: "输入用户名",
              })}
            />
          </Form.Item>
          <Form.Item
            label={intl.formatMessage({
              id: "pages.users.form.displayName.label",
              defaultMessage: "显示名称",
            })}
            name="display_name"
          >
            <Input
              placeholder={intl.formatMessage({
                id: "pages.users.form.displayName.placeholder",
                defaultMessage: "输入显示名称（可选）",
              })}
            />
          </Form.Item>
          <Form.Item
            label={intl.formatMessage({
              id: "pages.users.form.email.label",
              defaultMessage: "邮箱",
            })}
            name="email"
            rules={[
              {
                type: "email",
                message: intl.formatMessage({
                  id: "pages.users.form.email.invalid",
                  defaultMessage: "请输入有效的邮箱地址",
                }),
              },
            ]}
          >
            <Input
              placeholder={intl.formatMessage({
                id: "pages.users.form.email.placeholder",
                defaultMessage: "输入邮箱（可选）",
              })}
            />
          </Form.Item>
          <Row gutter={12}>
            <Col span={10}>
              <Form.Item
                label={intl.formatMessage({
                  id: "pages.users.form.role.label",
                  defaultMessage: "角色",
                })}
                name="role"
                rules={[
                  {
                    required: true,
                    message: intl.formatMessage({
                      id: "pages.users.form.role.required",
                      defaultMessage: "请选择角色",
                    }),
                  },
                ]}
              >
                <Select
                  options={roleOptions}
                  placeholder={intl.formatMessage({
                    id: "pages.users.form.role.placeholder",
                    defaultMessage: "选择角色",
                  })}
                />
              </Form.Item>
            </Col>
            <Col span={14}>
              <Form.Item
                label={intl.formatMessage({
                  id: "pages.users.form.status.label",
                  defaultMessage: "状态",
                })}
                name="status"
                rules={[
                  {
                    required: true,
                    message: intl.formatMessage({
                      id: "pages.users.form.status.required",
                      defaultMessage: "请选择状态",
                    }),
                  },
                ]}
              >
                <Select
                  options={statusOptions}
                  placeholder={intl.formatMessage({
                    id: "pages.users.form.status.placeholder",
                    defaultMessage: "选择状态",
                  })}
                />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item style={{ marginBottom: 0, textAlign: "right" }}>
            <Space>
              <Button onClick={() => setModalOpen(false)}>
                {intl.formatMessage({
                  id: "pages.users.cancel",
                  defaultMessage: "取消",
                })}
              </Button>
              <Button type="primary" htmlType="submit" loading={saving}>
                {intl.formatMessage({
                  id: "pages.users.modal.submit",
                  defaultMessage: "添加用户",
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
                id: "pages.users.drawerEditTitle",
                defaultMessage: "编辑用户",
              })
            : intl.formatMessage({
                id: "pages.users.drawerCreateTitle",
                defaultMessage: "创建用户",
              })
        }
        size={480}
        open={drawerOpen}
        onClose={() => {
          setSaving(false);
          setDrawerOpen(false);
        }}
        extra={
          <Space>
            <Button type="primary" loading={saving} onClick={saveUser}>
              {intl.formatMessage({
                id: "pages.users.save",
                defaultMessage: "保存",
              })}
            </Button>
          </Space>
        }
      >
        <Form form={userForm} layout="vertical">
          <Form.Item
            label={intl.formatMessage({
              id: "pages.users.form.username.label",
              defaultMessage: "用户名",
            })}
            name="username"
            rules={[
              {
                required: true,
                message: intl.formatMessage({
                  id: "pages.users.form.username.required",
                  defaultMessage: "请输入用户名",
                }),
              },
              {
                min: 3,
                message: intl.formatMessage({
                  id: "pages.users.form.username.minLength",
                  defaultMessage: "用户名至少 3 个字符",
                }),
              },
            ]}
          >
            <Input
              placeholder={intl.formatMessage({
                id: "pages.users.form.username.placeholder",
                defaultMessage: "输入用户名",
              })}
              disabled={!!editing}
            />
          </Form.Item>
          <Form.Item
            label={intl.formatMessage({
              id: "pages.users.form.displayName.label",
              defaultMessage: "显示名称",
            })}
            name="display_name"
          >
            <Input
              placeholder={intl.formatMessage({
                id: "pages.users.form.displayName.placeholder",
                defaultMessage: "输入显示名称（可选）",
              })}
            />
          </Form.Item>
          <Form.Item
            label={intl.formatMessage({
              id: "pages.users.form.email.label",
              defaultMessage: "邮箱",
            })}
            name="email"
            rules={[
              {
                type: "email",
                message: intl.formatMessage({
                  id: "pages.users.form.email.invalid",
                  defaultMessage: "请输入有效的邮箱地址",
                }),
              },
            ]}
          >
            <Input
              placeholder={intl.formatMessage({
                id: "pages.users.form.email.placeholder",
                defaultMessage: "输入邮箱（可选）",
              })}
            />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label={intl.formatMessage({
                  id: "pages.users.form.role.label",
                  defaultMessage: "角色",
                })}
                name="role"
                rules={[
                  {
                    required: true,
                    message: intl.formatMessage({
                      id: "pages.users.form.role.required",
                      defaultMessage: "请选择角色",
                    }),
                  },
                ]}
              >
                <Select
                  options={roleOptions}
                  placeholder={intl.formatMessage({
                    id: "pages.users.form.role.placeholder",
                    defaultMessage: "选择角色",
                  })}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label={intl.formatMessage({
                  id: "pages.users.form.status.label",
                  defaultMessage: "状态",
                })}
                name="status"
                rules={[
                  {
                    required: true,
                    message: intl.formatMessage({
                      id: "pages.users.form.status.required",
                      defaultMessage: "请选择状态",
                    }),
                  },
                ]}
              >
                <Select
                  options={statusOptions}
                  placeholder={intl.formatMessage({
                    id: "pages.users.form.status.placeholder",
                    defaultMessage: "选择状态",
                  })}
                />
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
