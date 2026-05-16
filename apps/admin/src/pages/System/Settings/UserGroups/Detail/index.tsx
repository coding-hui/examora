import {
  DeleteOutlined,
  PlusOutlined,
  ReloadOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import {
  type ActionType,
  PageContainer,
  type ProColumns,
  ProTable,
} from '@ant-design/pro-components';
import type {
  AdminExamAssignment,
  AdminUser,
  AdminUserGroup,
  AdminUserGroupMember,
} from '@examora/types';
import { API_PATHS } from '@examora/types';
import { history, useIntl } from '@umijs/max';
import {
  App as AntdApp,
  Button,
  Form,
  Input,
  Modal,
  Tabs,
  Tag,
  Typography,
} from 'antd';
import dayjs from 'dayjs';
import React, { useEffect, useRef, useState } from 'react';
import { fetchEnvelope } from '@/utils/apiEnvelope';
import { requestErrorMessage } from '@/utils/request';
import '../index.less';

const { Text } = Typography;

interface GroupFormValues {
  name: string;
  description?: string;
}

const queryString = (
  params: Record<string, string | number | boolean | undefined>,
) => {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== '') {
      search.set(key, String(value));
    }
  });
  return search.toString();
};

const UserGroupDetailContent: React.FC = () => {
  const intl = useIntl();
  const groupID = Number(
    window.location.pathname.split('/').filter(Boolean).at(-1),
  );
  const { message, modal } = AntdApp.useApp();
  const memberActionRef = useRef<ActionType>(null);
  const userActionRef = useRef<ActionType>(null);
  const [form] = Form.useForm<GroupFormValues>();
  const [group, setGroup] = useState<AdminUserGroup | null>(null);
  const [assignments, setAssignments] = useState<AdminExamAssignment[]>([]);
  const [saving, setSaving] = useState(false);
  const [basicDirty, setBasicDirty] = useState(false);
  const [memberKeywordInput, setMemberKeywordInput] = useState('');
  const [memberKeyword, setMemberKeyword] = useState('');
  const [assignmentKeywordInput, setAssignmentKeywordInput] = useState('');
  const [assignmentKeyword, setAssignmentKeyword] = useState('');
  const [memberModalOpen, setMemberModalOpen] = useState(false);
  const [selectedUserIDs, setSelectedUserIDs] = useState<number[]>([]);

  const loadGroup = React.useCallback(async () => {
    try {
      const data = await fetchEnvelope<AdminUserGroup>(
        API_PATHS.admin.userGroup(groupID),
      );
      setGroup(data);
      form.setFieldsValue({
        name: data.name,
        description: data.description,
      });
      setBasicDirty(false);
    } catch (error) {
      message.error(
        requestErrorMessage(error) ||
          intl.formatMessage({
            id: 'pages.userGroups.loadError',
            defaultMessage: '加载用户组失败',
          }),
      );
    }
  }, [form, groupID, intl, message]);

  const loadAssignments = React.useCallback(async () => {
    try {
      const data = await fetchEnvelope<{ items: AdminExamAssignment[] }>(
        API_PATHS.admin.userGroupExamAssignments(groupID),
      );
      setAssignments(data.items || []);
    } catch (error) {
      message.error(
        requestErrorMessage(error) ||
          intl.formatMessage({
            id: 'pages.userGroups.detail.examLoadError',
            defaultMessage: '加载考试失败',
          }),
      );
    }
  }, [groupID, intl, message]);

  useEffect(() => {
    if (!Number.isFinite(groupID)) return;
    loadGroup();
    loadAssignments();
  }, [groupID, loadAssignments, loadGroup]);

  useEffect(() => {
    memberActionRef.current?.reloadAndRest?.();
  }, [memberKeyword]);

  const searchMembers = () => {
    const nextKeyword = memberKeywordInput.trim();
    if (nextKeyword === memberKeyword) {
      memberActionRef.current?.reloadAndRest?.();
      return;
    }
    setMemberKeyword(nextKeyword);
  };

  const searchAssignments = () => {
    setAssignmentKeyword(assignmentKeywordInput.trim());
  };

  const saveGroup = async () => {
    const values = await form.validateFields();
    setSaving(true);
    try {
      await fetchEnvelope(API_PATHS.admin.userGroup(groupID), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: values.name,
          description: values.description || '',
        }),
      });
      message.success(
        intl.formatMessage({
          id: 'pages.userGroups.saveSuccess',
          defaultMessage: '用户组已保存',
        }),
      );
      await loadGroup();
      setBasicDirty(false);
    } catch (error) {
      message.error(
        requestErrorMessage(error) ||
          intl.formatMessage({
            id: 'pages.userGroups.saveError',
            defaultMessage: '保存用户组失败',
          }),
      );
    } finally {
      setSaving(false);
    }
  };

  const addMembers = async () => {
    if (selectedUserIDs.length === 0) return;
    setSaving(true);
    try {
      await fetchEnvelope(API_PATHS.admin.userGroupMembers(groupID), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedUserIDs }),
      });
      message.success(
        intl.formatMessage({
          id: 'pages.userGroups.detail.addMemberSuccess',
          defaultMessage: '用户已加入用户组',
        }),
      );
      setMemberModalOpen(false);
      setSelectedUserIDs([]);
      memberActionRef.current?.reload();
      await loadGroup();
    } catch (error) {
      message.error(
        requestErrorMessage(error) ||
          intl.formatMessage({
            id: 'pages.userGroups.detail.addMemberError',
            defaultMessage: '添加用户失败',
          }),
      );
    } finally {
      setSaving(false);
    }
  };

  const removeMember = (user: AdminUser) => {
    modal.confirm({
      title: intl.formatMessage({
        id: 'pages.userGroups.detail.removeMemberTitle',
        defaultMessage: '移出用户',
      }),
      content: intl.formatMessage(
        {
          id: 'pages.userGroups.detail.removeMemberContent',
          defaultMessage: '确定将「{name}」移出当前用户组吗？',
        },
        { name: user.display_name || user.username },
      ),
      okType: 'danger',
      onOk: async () => {
        try {
          await fetchEnvelope(
            API_PATHS.admin.userGroupMember(groupID, user.id),
            {
              method: 'DELETE',
            },
          );
          memberActionRef.current?.reload();
          await loadGroup();
        } catch (error) {
          message.error(
            requestErrorMessage(error) ||
              intl.formatMessage({
                id: 'pages.userGroups.detail.removeMemberError',
                defaultMessage: '移出用户失败',
              }),
          );
          return Promise.resolve();
        }
      },
    });
  };

  const memberColumns: ProColumns<AdminUserGroupMember>[] = [
    {
      title: intl.formatMessage({
        id: 'pages.userGroups.detail.user',
        defaultMessage: '用户',
      }),
      dataIndex: ['user', 'username'],
      width: 300,
      search: false,
      render: (_, item) => (
        <div className="user-group-name-cell">
          <div className="user-group-avatar">
            {(item.user.display_name || item.user.username)
              .charAt(0)
              .toUpperCase()}
          </div>
          <div className="user-group-name-main">
            <Text strong ellipsis>
              {item.user.display_name || item.user.username}
            </Text>
            <Text type="secondary" ellipsis>
              {item.user.email || item.user.username}
            </Text>
          </div>
        </div>
      ),
    },
    {
      title: intl.formatMessage({
        id: 'pages.userGroups.detail.role',
        defaultMessage: '角色',
      }),
      dataIndex: ['user', 'role'],
      width: 110,
      search: false,
      render: (_, item) => <Tag>{item.user.role}</Tag>,
    },
    {
      title: intl.formatMessage({
        id: 'pages.userGroups.source',
        defaultMessage: '来源',
      }),
      dataIndex: 'direct',
      width: 140,
      search: false,
      render: (_, item) =>
        item.direct ? (
          <Tag color="green">
            {intl.formatMessage({
              id: 'pages.userGroups.detail.directMember',
              defaultMessage: '直接成员',
            })}
          </Tag>
        ) : (
          <Tag>
            {intl.formatMessage({
              id: 'pages.userGroups.detail.inheritedMember',
              defaultMessage: '继承成员',
            })}
          </Tag>
        ),
    },
    {
      title: intl.formatMessage({
        id: 'pages.userGroups.detail.joinedAt',
        defaultMessage: '加入时间',
      }),
      dataIndex: 'created_at',
      width: 170,
      search: false,
      render: (_, item) => dayjs(item.created_at).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: intl.formatMessage({
        id: 'common.actions',
        defaultMessage: '操作',
      }),
      width: 90,
      fixed: 'right',
      search: false,
      hideInSetting: true,
      render: (_, item) =>
        item.direct ? (
          <Button
            danger
            type="link"
            size="small"
            icon={<DeleteOutlined />}
            disabled={group?.source !== 'LOCAL'}
            onClick={() => removeMember(item.user)}
          >
            {intl.formatMessage({
              id: 'pages.userGroups.detail.remove',
              defaultMessage: '移出',
            })}
          </Button>
        ) : (
          '-'
        ),
    },
  ];

  const userColumns: ProColumns<AdminUser>[] = [
    {
      title: intl.formatMessage({
        id: 'pages.userGroups.keyword',
        defaultMessage: '关键词',
      }),
      dataIndex: 'keyword',
      hideInTable: true,
      fieldProps: {
        allowClear: true,
        placeholder: intl.formatMessage({
          id: 'pages.userGroups.detail.userSearchPlaceholder',
          defaultMessage: '搜索用户名、邮箱',
        }),
      },
    },
    {
      title: intl.formatMessage({
        id: 'pages.userGroups.detail.user',
        defaultMessage: '用户',
      }),
      dataIndex: 'username',
      search: false,
      render: (_, user) => (
        <div className="user-group-name-main">
          <Text>{user.display_name || user.username}</Text>
          <Text type="secondary">{user.email || user.username}</Text>
        </div>
      ),
    },
    {
      title: intl.formatMessage({
        id: 'pages.userGroups.detail.role',
        defaultMessage: '角色',
      }),
      dataIndex: 'role',
      width: 120,
      search: false,
      render: (_, user) => <Tag>{user.role}</Tag>,
    },
  ];

  const assignmentColumns: ProColumns<AdminExamAssignment>[] = [
    {
      title: intl.formatMessage({
        id: 'pages.userGroups.detail.examId',
        defaultMessage: '考试 ID',
      }),
      dataIndex: 'exam_id',
      width: 120,
      render: (_, item) => (
        <Button
          type="link"
          onClick={() => history.push(`/examination/exams/${item.exam_id}`)}
        >
          {item.exam_id}
        </Button>
      ),
    },
    {
      title: intl.formatMessage({
        id: 'pages.userGroups.detail.type',
        defaultMessage: '类型',
      }),
      dataIndex: 'target_type',
      render: () => (
        <Tag color="blue">
          {intl.formatMessage({
            id: 'pages.userGroups.name',
            defaultMessage: '用户组',
          })}
        </Tag>
      ),
    },
    {
      title: intl.formatMessage({
        id: 'pages.userGroups.detail.time',
        defaultMessage: '时间',
      }),
      dataIndex: 'created_at',
      render: (_, item) => dayjs(item.created_at).format('YYYY-MM-DD HH:mm'),
    },
  ];

  const filteredAssignments = assignmentKeyword
    ? assignments.filter((item) =>
        String(item.exam_id).includes(assignmentKeyword),
      )
    : assignments;

  return (
    <PageContainer
      title={
        group?.name ||
        intl.formatMessage({
          id: 'pages.userGroups.detail.title',
          defaultMessage: '用户组详情',
        })
      }
      onBack={() => history.push('/system/settings/user-groups')}
      content={
        group ? (
          <div className="user-group-header-meta">
            <Tag color={group.source === 'LOCAL' ? 'green' : 'blue'}>
              {group.source}
            </Tag>
            {group.source !== 'LOCAL' && (
              <Tag>
                {intl.formatMessage(
                  {
                    id: 'pages.userGroups.detail.syncMode',
                    defaultMessage: '同步 {mode}',
                  },
                  { mode: group.sync_mode },
                )}
              </Tag>
            )}
            <Tag>
              {intl.formatMessage(
                {
                  id: 'pages.userGroups.detail.memberCount',
                  defaultMessage: '成员 {count}',
                },
                { count: group.member_count || 0 },
              )}
            </Tag>
            <Tag>
              {intl.formatMessage(
                {
                  id: 'pages.userGroups.detail.examCount',
                  defaultMessage: '考试 {count}',
                },
                { count: assignments.length },
              )}
            </Tag>
          </div>
        ) : null
      }
      extra={[
        <Button key="reload" icon={<ReloadOutlined />} onClick={loadGroup}>
          {intl.formatMessage({
            id: 'common.refresh',
            defaultMessage: '刷新',
          })}
        </Button>,
      ]}
    >
      <Tabs
        className="user-group-detail-tabs"
        items={[
          {
            key: 'basic',
            label: intl.formatMessage({
              id: 'pages.userGroups.detail.basic',
              defaultMessage: '基础信息',
            }),
            forceRender: true,
            children: group ? (
              <div className="user-group-basic">
                {basicDirty && (
                  <div className="user-group-basic-actions">
                    <Button type="primary" loading={saving} onClick={saveGroup}>
                      {intl.formatMessage({
                        id: 'common.save',
                        defaultMessage: '保存',
                      })}
                    </Button>
                  </div>
                )}
                <Form
                  form={form}
                  layout="vertical"
                  disabled={group.source !== 'LOCAL'}
                  onValuesChange={() => setBasicDirty(true)}
                >
                  <Form.Item
                    label={intl.formatMessage({
                      id: 'pages.userGroups.form.name',
                      defaultMessage: '名称',
                    })}
                    name="name"
                    rules={[
                      {
                        required: true,
                        message: intl.formatMessage({
                          id: 'pages.userGroups.form.nameRequired',
                          defaultMessage: '请输入用户组名称',
                        }),
                      },
                    ]}
                  >
                    <Input />
                  </Form.Item>
                  <Form.Item
                    label={intl.formatMessage({
                      id: 'pages.userGroups.form.description',
                      defaultMessage: '说明',
                    })}
                    name="description"
                  >
                    <Input.TextArea rows={3} />
                  </Form.Item>
                </Form>
                <div className="user-group-basic-meta">
                  <Text type="secondary">
                    {intl.formatMessage(
                      {
                        id: 'pages.userGroups.detail.createdAtMeta',
                        defaultMessage: '创建时间 {time}',
                      },
                      {
                        time: dayjs(group.created_at).format(
                          'YYYY-MM-DD HH:mm',
                        ),
                      },
                    )}
                  </Text>
                  <Text type="secondary">
                    {intl.formatMessage(
                      {
                        id: 'pages.userGroups.detail.updatedAtMeta',
                        defaultMessage: '更新时间 {time}',
                      },
                      {
                        time: dayjs(group.updated_at).format(
                          'YYYY-MM-DD HH:mm',
                        ),
                      },
                    )}
                  </Text>
                </div>
              </div>
            ) : null,
          },
          {
            key: 'members',
            label: intl.formatMessage({
              id: 'pages.userGroups.members',
              defaultMessage: '成员',
            }),
            children: (
              <ProTable<AdminUserGroupMember>
                className="user-group-detail-table"
                actionRef={memberActionRef}
                columns={memberColumns}
                rowKey={(item) => `${item.user_group_id}-${item.user.id}`}
                request={async ({ current, pageSize }) => {
                  const params = queryString({
                    page: current || 1,
                    page_size: pageSize || 20,
                    keyword: memberKeyword || undefined,
                  });
                  try {
                    const data = await fetchEnvelope<{
                      items: AdminUserGroupMember[];
                      total: number;
                    }>(
                      `${API_PATHS.admin.userGroupMembers(groupID)}?${params}`,
                    );
                    return {
                      data: data.items || [],
                      total: data.total || 0,
                      success: true,
                    };
                  } catch (error) {
                    message.error(
                      requestErrorMessage(error) ||
                        intl.formatMessage({
                          id: 'pages.userGroups.detail.membersLoadError',
                          defaultMessage: '加载成员失败',
                        }),
                    );
                    return { data: [], total: 0, success: false };
                  }
                }}
                search={false}
                pagination={{ defaultPageSize: 20, showSizeChanger: true }}
                options={{ density: true, reload: true, setting: true }}
                scroll={{ x: 900 }}
                headerTitle={
                  <div className="user-group-toolbar-search">
                    <Input
                      allowClear
                      prefix={<SearchOutlined />}
                      placeholder={intl.formatMessage({
                        id: 'pages.userGroups.detail.userSearchPlaceholder',
                        defaultMessage: '搜索用户名、邮箱',
                      })}
                      value={memberKeywordInput}
                      onChange={(event) => {
                        const value = event.target.value;
                        setMemberKeywordInput(value);
                        if (!value) setMemberKeyword('');
                      }}
                      onPressEnter={searchMembers}
                    />
                    <Button onClick={searchMembers}>
                      {intl.formatMessage({
                        id: 'common.search',
                        defaultMessage: '搜索',
                      })}
                    </Button>
                  </div>
                }
                toolBarRender={() => [
                  <Button
                    key="add"
                    type="primary"
                    icon={<PlusOutlined />}
                    disabled={group?.source !== 'LOCAL'}
                    onClick={() => {
                      setSelectedUserIDs([]);
                      setMemberModalOpen(true);
                    }}
                  >
                    {intl.formatMessage({
                      id: 'pages.userGroups.detail.addMember',
                      defaultMessage: '加入用户',
                    })}
                  </Button>,
                ]}
              />
            ),
          },
          {
            key: 'assignments',
            label: intl.formatMessage({
              id: 'pages.userGroups.detail.exams',
              defaultMessage: '考试',
            }),
            children: (
              <ProTable<AdminExamAssignment>
                className="user-group-detail-table"
                columns={assignmentColumns}
                dataSource={filteredAssignments}
                rowKey="id"
                search={false}
                pagination={{ defaultPageSize: 10 }}
                options={{ reload: loadAssignments, setting: true }}
                headerTitle={
                  <div className="user-group-toolbar-search">
                    <Input
                      allowClear
                      prefix={<SearchOutlined />}
                      placeholder={intl.formatMessage({
                        id: 'pages.userGroups.detail.examSearchPlaceholder',
                        defaultMessage: '搜索考试 ID',
                      })}
                      value={assignmentKeywordInput}
                      onChange={(event) => {
                        const value = event.target.value;
                        setAssignmentKeywordInput(value);
                        if (!value) setAssignmentKeyword('');
                      }}
                      onPressEnter={searchAssignments}
                    />
                    <Button onClick={searchAssignments}>
                      {intl.formatMessage({
                        id: 'common.search',
                        defaultMessage: '搜索',
                      })}
                    </Button>
                  </div>
                }
              />
            ),
          },
        ]}
      />

      <Modal
        width={760}
        centered
        open={memberModalOpen}
        title={intl.formatMessage({
          id: 'pages.userGroups.detail.addMember',
          defaultMessage: '加入用户',
        })}
        onOk={addMembers}
        okButtonProps={{ disabled: selectedUserIDs.length === 0 }}
        confirmLoading={saving}
        onCancel={() => setMemberModalOpen(false)}
      >
        <ProTable<AdminUser>
          actionRef={userActionRef}
          columns={userColumns}
          rowKey="id"
          search={{ labelWidth: 'auto', defaultCollapsed: false }}
          options={false}
          pagination={{ defaultPageSize: 10, showSizeChanger: true }}
          rowSelection={{
            selectedRowKeys: selectedUserIDs,
            preserveSelectedRowKeys: true,
            onChange: (keys) => setSelectedUserIDs(keys.map(Number)),
          }}
          request={async ({ current, pageSize, keyword }) => {
            const params = queryString({
              page: current || 1,
              page_size: pageSize || 10,
              keyword: keyword ? String(keyword).trim() : undefined,
              exclude_user_group_id: groupID,
            });
            try {
              const data = await fetchEnvelope<{
                items: AdminUser[];
                total: number;
              }>(`${API_PATHS.admin.users}?${params}`);
              return {
                data: data.items || [],
                total: data.total || 0,
                success: true,
              };
            } catch (error) {
              message.error(
                requestErrorMessage(error) ||
                  intl.formatMessage({
                    id: 'pages.userGroups.detail.usersLoadError',
                    defaultMessage: '加载用户失败',
                  }),
              );
              return { data: [], total: 0, success: false };
            }
          }}
          tableAlertRender={false}
        />
      </Modal>
    </PageContainer>
  );
};

const UserGroupDetail: React.FC = () => (
  <AntdApp>
    <UserGroupDetailContent />
  </AntdApp>
);

export default UserGroupDetail;
