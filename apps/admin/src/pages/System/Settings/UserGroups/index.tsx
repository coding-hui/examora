import { DeleteOutlined, DownOutlined, PlusOutlined } from '@ant-design/icons';
import {
  type ActionType,
  PageContainer,
  type ProColumns,
  ProTable,
} from '@ant-design/pro-components';
import type { AdminUserGroup } from '@examora/types';
import { API_PATHS } from '@examora/types';
import { history, useIntl } from '@umijs/max';
import {
  App as AntdApp,
  Button,
  Dropdown,
  Form,
  Input,
  Modal,
  Space,
  Tag,
} from 'antd';
import dayjs from 'dayjs';
import React, { useRef, useState } from 'react';
import { fetchEnvelope } from '@/utils/apiEnvelope';
import { requestErrorMessage } from '@/utils/request';
import './index.less';

interface GroupFormValues {
  name: string;
  description?: string;
}

const sourceColor = (source?: string) => {
  if (!source || source === 'LOCAL') return 'default';
  if (source === 'LOGTO') return 'blue';
  if (source === 'SCIM') return 'purple';
  return 'cyan';
};

const UserGroupsContent: React.FC = () => {
  const intl = useIntl();
  const { message, modal } = AntdApp.useApp();
  const actionRef = useRef<ActionType>(null);
  const [form] = Form.useForm<GroupFormValues>();
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const openCreate = () => {
    form.resetFields();
    setModalOpen(true);
  };

  const saveGroup = async () => {
    const values = await form.validateFields();
    setSaving(true);
    try {
      await fetchEnvelope<AdminUserGroup>(API_PATHS.admin.userGroups, {
        method: 'POST',
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
      setModalOpen(false);
      actionRef.current?.reload();
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

  const deleteGroup = (group: AdminUserGroup) => {
    modal.confirm({
      title: intl.formatMessage({
        id: 'pages.userGroups.deleteTitle',
        defaultMessage: '删除用户组',
      }),
      content: intl.formatMessage(
        {
          id: 'pages.userGroups.deleteContent',
          defaultMessage: '确定删除「{name}」吗？',
        },
        { name: group.name },
      ),
      okType: 'danger',
      onOk: async () => {
        try {
          await fetchEnvelope(API_PATHS.admin.userGroup(group.id), {
            method: 'DELETE',
          });
          message.success(
            intl.formatMessage({
              id: 'pages.userGroups.deleteSuccess',
              defaultMessage: '用户组已删除',
            }),
          );
          actionRef.current?.reload();
        } catch (error) {
          message.error(
            requestErrorMessage(error) ||
              intl.formatMessage({
                id: 'pages.userGroups.deleteError',
                defaultMessage: '删除用户组失败',
              }),
          );
          return Promise.resolve();
        }
      },
    });
  };

  const columns: ProColumns<AdminUserGroup>[] = [
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
          id: 'pages.userGroups.searchPlaceholder',
          defaultMessage: '搜索名称、说明',
        }),
      },
    },
    {
      title: intl.formatMessage({
        id: 'pages.userGroups.source',
        defaultMessage: '来源',
      }),
      dataIndex: 'source',
      hideInTable: true,
      valueEnum: {
        LOCAL: {
          text: intl.formatMessage({
            id: 'pages.userGroups.sourceLocal',
            defaultMessage: '本地',
          }),
        },
        LOGTO: { text: 'Logto' },
        OIDC: { text: 'OIDC' },
        SCIM: { text: 'SCIM' },
      },
    },
    {
      title: intl.formatMessage({
        id: 'pages.userGroups.name',
        defaultMessage: '用户组',
      }),
      dataIndex: 'name',
      width: 320,
      search: false,
      render: (_, group) => (
        <div className="user-group-name-cell">
          <Button
            type="link"
            className="user-group-name-link"
            onClick={() =>
              history.push(`/system/settings/user-groups/${group.id}`)
            }
          >
            {group.name}
          </Button>
        </div>
      ),
    },
    {
      title: intl.formatMessage({
        id: 'pages.userGroups.members',
        defaultMessage: '成员',
      }),
      dataIndex: 'member_count',
      width: 90,
      search: false,
      render: (_, group) => group.member_count || 0,
    },
    {
      title: intl.formatMessage({
        id: 'pages.userGroups.source',
        defaultMessage: '来源',
      }),
      dataIndex: 'source',
      width: 110,
      search: false,
      render: (_, group) => (
        <Tag color={sourceColor(group.source)}>{group.source}</Tag>
      ),
    },
    {
      title: intl.formatMessage({
        id: 'pages.userGroups.createdAt',
        defaultMessage: '创建时间',
      }),
      dataIndex: 'created_at',
      width: 160,
      search: false,
      render: (_, group) => dayjs(group.created_at).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: intl.formatMessage({
        id: 'common.actions',
        defaultMessage: '操作',
      }),
      width: 80,
      fixed: 'right',
      search: false,
      hideInSetting: true,
      render: (_, group) => (
        <div
          className="user-group-actions-cell"
          onClick={(e) => e.stopPropagation()}
        >
          <Dropdown
            menu={{
              items: [
                {
                  key: 'delete',
                  label: intl.formatMessage({
                    id: 'common.delete',
                    defaultMessage: '删除',
                  }),
                  icon: <DeleteOutlined />,
                  danger: true,
                  disabled: group.source !== 'LOCAL',
                  onClick: () => deleteGroup(group),
                },
              ],
            }}
            trigger={['click']}
          >
            <a onClick={(e) => e.preventDefault()}>
              <Space size={4}>
                {intl.formatMessage({
                  id: 'pages.userGroups.more',
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
        id: 'menu.system.settings.userGroups',
        defaultMessage: '用户组',
      })}
      content={intl.formatMessage({
        id: 'pages.userGroups.description',
        defaultMessage: '维护可复用的用户范围，考试可按用户或用户组分配。',
      })}
    >
      <ProTable<AdminUserGroup>
        actionRef={actionRef}
        columns={columns}
        rowKey="id"
        request={async ({ current, pageSize, keyword, source }) => {
          try {
            const params = new URLSearchParams({
              page: String(current || 1),
              page_size: String(pageSize || 20),
            });
            if (keyword) params.set('keyword', String(keyword));
            if (source) params.set('source', String(source));
            const data = await fetchEnvelope<{
              items: AdminUserGroup[];
              total: number;
            }>(`${API_PATHS.admin.userGroups}?${params.toString()}`);
            return {
              data: data.items || [],
              total: data.total || 0,
              success: true,
            };
          } catch (error) {
            message.error(
              requestErrorMessage(error) ||
                intl.formatMessage({
                  id: 'pages.userGroups.loadError',
                  defaultMessage: '加载用户组失败',
                }),
            );
            return { data: [], total: 0, success: false };
          }
        }}
        search={{ labelWidth: 'auto', defaultCollapsed: false }}
        pagination={{
          defaultPageSize: 20,
          showSizeChanger: true,
        }}
        options={{
          density: true,
          reload: true,
          setting: true,
        }}
        scroll={{ x: 1100 }}
        toolBarRender={() => [
          <Button
            key="create"
            type="primary"
            icon={<PlusOutlined />}
            onClick={openCreate}
          >
            {intl.formatMessage({
              id: 'pages.userGroups.create',
              defaultMessage: '新建用户组',
            })}
          </Button>,
        ]}
      />

      <Modal
        width={520}
        centered
        open={modalOpen}
        title={intl.formatMessage({
          id: 'pages.userGroups.create',
          defaultMessage: '新建用户组',
        })}
        onOk={saveGroup}
        confirmLoading={saving}
        onCancel={() => setModalOpen(false)}
      >
        <Form form={form} layout="vertical">
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
            <Input
              placeholder={intl.formatMessage({
                id: 'pages.userGroups.form.namePlaceholder',
                defaultMessage: '例如：2026 春季班',
              })}
            />
          </Form.Item>
          <Form.Item
            label={intl.formatMessage({
              id: 'pages.userGroups.form.description',
              defaultMessage: '说明',
            })}
            name="description"
          >
            <Input.TextArea
              rows={3}
              placeholder={intl.formatMessage({
                id: 'pages.userGroups.form.optional',
                defaultMessage: '可选',
              })}
            />
          </Form.Item>
        </Form>
      </Modal>
    </PageContainer>
  );
};

const UserGroups: React.FC = () => (
  <AntdApp>
    <UserGroupsContent />
  </AntdApp>
);

export default UserGroups;
