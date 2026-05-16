import {
  DeleteOutlined,
  DownOutlined,
  EditOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import {
  type ActionType,
  FooterToolbar,
  PageContainer,
  type ProColumns,
  ProTable,
} from '@ant-design/pro-components';
import { history, request, useIntl } from '@umijs/max';
import { App as AntdApp, Button, Dropdown, Space, Tag, Tooltip } from 'antd';
import dayjs from 'dayjs';
import React, { useMemo, useRef, useState } from 'react';
import {
  type BatchActionResult,
  proTableSortParams,
  requestErrorMessage,
} from '@/utils/request';
import './index.less';

interface Paper {
  id: number;
  title: string;
  description?: string;
  status: 'DRAFT' | 'PUBLISHED' | string;
  created_by: number;
  created_at: string;
  updated_at: string;
  question_count?: number;
  total_score?: number;
}

const PAPER_STATUS_KEYS = ['DRAFT', 'PUBLISHED'] as const;

const PapersPageContent: React.FC = () => {
  const intl = useIntl();
  const { message, modal } = AntdApp.useApp();
  const actionRef = useRef<ActionType>(null);
  const [selectedRows, setSelectedRows] = useState<Paper[]>([]);

  const statusLabelMap: Record<string, string> = useMemo(
    () => ({
      DRAFT: intl.formatMessage({
        id: 'pages.papers.status.DRAFT',
        defaultMessage: '草稿',
      }),
      PUBLISHED: intl.formatMessage({
        id: 'pages.papers.status.PUBLISHED',
        defaultMessage: '已发布',
      }),
    }),
    [intl],
  );

  const statusValueEnum = useMemo(
    () =>
      Object.fromEntries(
        PAPER_STATUS_KEYS.map((status) => [
          status,
          { text: statusLabelMap[status] },
        ]),
      ),
    [statusLabelMap],
  );

  const confirmDelete = (paper: Paper) => {
    modal.confirm({
      title: intl.formatMessage({
        id: 'pages.papers.deleteConfirmTitle',
        defaultMessage: '确认删除',
      }),
      content: intl.formatMessage(
        {
          id: 'pages.papers.deleteConfirmContent',
          defaultMessage: '确定要删除试卷「{title}」吗？此操作不可撤销。',
        },
        { title: paper.title },
      ),
      okText: intl.formatMessage({
        id: 'pages.papers.delete',
        defaultMessage: '删除',
      }),
      okType: 'danger',
      cancelText: intl.formatMessage({
        id: 'pages.papers.cancel',
        defaultMessage: '取消',
      }),
      onOk: async () => {
        try {
          await request(`/api/admin/papers/${paper.id}`, {
            method: 'DELETE',
            skipErrorHandler: true,
          });
          message.success(
            intl.formatMessage({
              id: 'pages.papers.deleteSuccess',
              defaultMessage: '试卷已删除',
            }),
          );
          actionRef.current?.reload();
        } catch (error) {
          message.error(
            requestErrorMessage(error) ||
              intl.formatMessage({
                id: 'pages.papers.deleteError',
                defaultMessage: '删除试卷失败',
              }),
          );
        }
      },
    });
  };

  const showBatchResult = (result?: BatchActionResult) => {
    if (!result) {
      return;
    }
    if (result.failed_count > 0) {
      modal.warning({
        title: intl.formatMessage({
          id: 'pages.batch.partialFailure',
          defaultMessage: '部分操作失败',
        }),
        content: (
          <div>
            <p>
              {intl.formatMessage(
                {
                  id: 'pages.batch.summary',
                  defaultMessage: '成功 {success} 项，失败 {failed} 项。',
                },
                {
                  success: result.success_count,
                  failed: result.failed_count,
                },
              )}
            </p>
            <ul className="paper-batch-failures">
              {result.failures.slice(0, 5).map((failure) => (
                <li key={failure.id}>
                  #{failure.id}: {failure.reason}
                </li>
              ))}
            </ul>
          </div>
        ),
      });
      return;
    }
    message.success(
      intl.formatMessage(
        {
          id: 'pages.batch.success',
          defaultMessage: '成功处理 {count} 项',
        },
        { count: result.success_count },
      ),
    );
  };

  const runBatchDeletePapers = () => {
    modal.confirm({
      title: intl.formatMessage({
        id: 'pages.papers.batchDeleteConfirmTitle',
        defaultMessage: '确认批量删除',
      }),
      content: intl.formatMessage(
        {
          id: 'pages.papers.batchDeleteConfirmContent',
          defaultMessage:
            '确定要删除已选择的 {count} 份试卷吗？此操作不可撤销。',
        },
        { count: selectedRows.length },
      ),
      okText: intl.formatMessage({
        id: 'pages.papers.delete',
        defaultMessage: '删除',
      }),
      okType: 'danger',
      cancelText: intl.formatMessage({
        id: 'pages.papers.cancel',
        defaultMessage: '取消',
      }),
      onOk: async () => {
        try {
          const response = await request<{
            code: number;
            data: BatchActionResult;
          }>('/api/admin/papers/batch', {
            method: 'DELETE',
            data: { ids: selectedRows.map((item) => item.id) },
            skipErrorHandler: true,
          });
          showBatchResult(response.data);
          setSelectedRows([]);
          actionRef.current?.reload();
        } catch (error) {
          message.error(
            requestErrorMessage(error) ||
              intl.formatMessage({
                id: 'pages.papers.deleteError',
                defaultMessage: '删除试卷失败',
              }),
          );
        }
      },
    });
  };

  const columns: ProColumns<Paper>[] = [
    {
      title: intl.formatMessage({
        id: 'pages.papers.search.keyword',
        defaultMessage: '关键词',
      }),
      dataIndex: 'keyword',
      valueType: 'text',
      hideInTable: true,
      order: 100,
      fieldProps: {
        allowClear: true,
        placeholder: intl.formatMessage({
          id: 'pages.papers.search.placeholder',
          defaultMessage: '搜索试卷标题、描述...',
        }),
      },
    },
    {
      title: intl.formatMessage({
        id: 'pages.papers.columns.title',
        defaultMessage: '试卷',
      }),
      dataIndex: 'title',
      key: 'title',
      width: 440,
      search: false,
      render: (_: unknown, paper: Paper) => (
        <div className="paper-title-cell">
          <div className="paper-title-main">
            <Tooltip title={paper.title}>
              <button
                type="button"
                className="paper-title-button"
                onClick={(event) => {
                  event.stopPropagation();
                  history.push(`/content/papers/${paper.id}`);
                }}
              >
                {paper.title}
              </button>
            </Tooltip>
            <div className="paper-title-desc">{paper.description || '-'}</div>
          </div>
        </div>
      ),
    },
    {
      title: intl.formatMessage({
        id: 'pages.papers.columns.status',
        defaultMessage: '状态',
      }),
      dataIndex: 'status',
      key: 'status',
      width: 112,
      valueType: 'select',
      valueEnum: statusValueEnum,
      render: (_: unknown, paper: Paper) => (
        <Tag
          className={`paper-status-tag paper-status-${paper.status.toLowerCase()}`}
        >
          {statusLabelMap[paper.status] || paper.status}
        </Tag>
      ),
    },
    {
      title: intl.formatMessage({
        id: 'pages.papers.columns.questionCount',
        defaultMessage: '题量',
      }),
      dataIndex: 'question_count',
      key: 'question_count',
      width: 100,
      search: false,
      render: (_: unknown, paper: Paper) => paper.question_count ?? '-',
    },
    {
      title: intl.formatMessage({
        id: 'pages.papers.columns.totalScore',
        defaultMessage: '总分',
      }),
      dataIndex: 'total_score',
      key: 'total_score',
      width: 100,
      search: false,
      render: (_: unknown, paper: Paper) => paper.total_score ?? '-',
    },
    {
      title: intl.formatMessage({
        id: 'pages.papers.columns.updatedAt',
        defaultMessage: '更新时间',
      }),
      dataIndex: 'updated_at',
      key: 'updated_at',
      width: 168,
      search: false,
      sorter: true,
      render: (_: unknown, paper: Paper) => (
        <span className="paper-date">
          {dayjs(paper.updated_at).format('YYYY-MM-DD HH:mm')}
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
      render: (_: unknown, paper: Paper) => (
        <div
          className="paper-actions-cell"
          onClick={(e) => e.stopPropagation()}
        >
          <Dropdown
            menu={{
              items: [
                {
                  key: 'edit',
                  label: intl.formatMessage({
                    id: 'pages.papers.edit',
                    defaultMessage: '编辑',
                  }),
                  icon: <EditOutlined />,
                  onClick: () => history.push(`/content/papers/${paper.id}`),
                },
                {
                  key: 'delete',
                  label: intl.formatMessage({
                    id: 'pages.papers.delete',
                    defaultMessage: '删除',
                  }),
                  icon: <DeleteOutlined />,
                  danger: true,
                  onClick: () => confirmDelete(paper),
                },
              ],
            }}
            trigger={['click']}
          >
            <a onClick={(e) => e.preventDefault()}>
              <Space size={4}>
                {intl.formatMessage({
                  id: 'pages.papers.more',
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
        id: 'menu.content.papers',
        defaultMessage: '试卷',
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
            id: 'pages.papers.description',
            defaultMessage: '创建和维护考试试卷，配置试题顺序与分值。',
          })}
        </p>
      }
    >
      <ProTable<Paper>
        actionRef={actionRef}
        cardBordered={{
          search: true,
          table: true,
        }}
        columns={columns}
        columnsState={{
          persistenceKey: 'examora-papers-table-columns',
          persistenceType: 'localStorage',
        }}
        columnEmptyText="-"
        dateFormatter="string"
        debounceTime={300}
        defaultSize="middle"
        headerTitle={intl.formatMessage({
          id: 'pages.papers.listTitle',
          defaultMessage: '试卷列表',
        })}
        options={{
          density: true,
          fullScreen: false,
          reload: true,
          setting: true,
        }}
        rowKey="id"
        rowSelection={{
          selectedRowKeys: selectedRows.map((item) => item.id),
          onChange: (_, rows) => setSelectedRows(rows),
        }}
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
            id: 'pages.papers.search.searchText',
            defaultMessage: '查询',
          }),
          resetText: intl.formatMessage({
            id: 'pages.papers.search.resetText',
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
        request={async (params, sort) => {
          try {
            const sortParams = proTableSortParams(sort);
            const response = await request<{
              code: number;
              data: { items: Paper[]; total: number };
            }>('/api/admin/papers', {
              params: {
                page: params.current,
                page_size: params.pageSize,
                ...(params.keyword ? { keyword: params.keyword } : {}),
                ...(params.status ? { status: params.status } : {}),
                ...sortParams,
              },
            });

            return {
              data: response.data?.items || [],
              total: response.data?.total || 0,
              success: true,
            };
          } catch (_error) {
            message.error(
              intl.formatMessage({
                id: 'pages.papers.fetchError',
                defaultMessage: '获取试卷列表失败',
              }),
            );
            return { data: [], total: 0, success: false };
          }
        }}
        pagination={{
          defaultPageSize: 20,
          showSizeChanger: true,
          pageSizeOptions: [10, 20, 50, 100],
          showTotal: (total) =>
            intl.formatMessage(
              {
                id: 'pages.papers.total',
                defaultMessage: '共 {total} 条',
              },
              { total },
            ),
        }}
        revalidateOnFocus={false}
        scroll={{ x: 1000 }}
        tableLayout="fixed"
        toolBarRender={() => [
          <Button
            key="create"
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => history.push('/content/papers/new')}
          >
            {intl.formatMessage({
              id: 'pages.papers.create',
              defaultMessage: '新建试卷',
            })}
          </Button>,
        ]}
      />
      {selectedRows.length > 0 && (
        <FooterToolbar
          extra={intl.formatMessage(
            {
              id: 'pages.batch.selected',
              defaultMessage: '已选择 {count} 项',
            },
            { count: selectedRows.length },
          )}
        >
          <Button
            danger
            icon={<DeleteOutlined />}
            onClick={runBatchDeletePapers}
          >
            {intl.formatMessage({
              id: 'pages.papers.delete',
              defaultMessage: '删除',
            })}
          </Button>
        </FooterToolbar>
      )}
    </PageContainer>
  );
};

const PapersPage: React.FC = () => (
  <AntdApp>
    <PapersPageContent />
  </AntdApp>
);

export default PapersPage;
