import {
  CheckSquareOutlined,
  CodeOutlined,
  DeleteOutlined,
  DownOutlined,
  FileTextOutlined,
  FormOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import {
  type ActionType,
  FooterToolbar,
  PageContainer,
  type ProColumns,
  ProTable,
} from '@ant-design/pro-components';
import type { AdminQuestion, QuestionType } from '@examora/types';
import {
  API_PATHS,
  DIFFICULTY_OPTIONS,
  QUESTION_STATUS_OPTIONS,
  QUESTION_TYPE_OPTIONS,
} from '@examora/types';
import { history, request, useIntl } from '@umijs/max';
import {
  App as AntdApp,
  Button,
  Dropdown,
  Modal,
  Space,
  Switch,
  Tooltip,
} from 'antd';
import dayjs from 'dayjs';
import React, { useMemo, useRef, useState } from 'react';
import { StatusTag } from '@/components';
import {
  type BatchActionResult,
  proTableSortParams,
  requestErrorMessage,
} from '@/utils/request';
import './index.less';

const questionTypeIcon = (type: QuestionType) => {
  if (type === 'PROGRAMMING') return <CodeOutlined />;
  if (type === 'MULTIPLE_CHOICE' || type === 'TRUE_FALSE')
    return <CheckSquareOutlined />;
  if (type === 'FILL_BLANK' || type === 'SHORT_ANSWER') return <FormOutlined />;
  return <FileTextOutlined />;
};

interface QuestionsPageContentProps {
  fixedType?: QuestionType;
}

export const QuestionsPageContent: React.FC<QuestionsPageContentProps> = ({
  fixedType,
}) => {
  const intl = useIntl();
  const { message, modal } = AntdApp.useApp();
  const actionRef = useRef<ActionType>(null);
  const [selectedRows, setSelectedRows] = useState<AdminQuestion[]>([]);
  const isProgrammingOnly = fixedType === 'PROGRAMMING';

  // i18n label maps
  const typeLabelMap = useMemo(
    () =>
      Object.fromEntries(
        QUESTION_TYPE_OPTIONS.map((t) => [
          t.value,
          intl.formatMessage({
            id: `pages.questions.types.${t.value}`,
            defaultMessage: t.label,
          }),
        ]),
      ),
    [intl],
  );

  const difficultyLabelMap = useMemo(
    () =>
      Object.fromEntries(
        DIFFICULTY_OPTIONS.map((d) => [
          d.value,
          intl.formatMessage({
            id: `pages.questions.difficulty.${d.value}`,
            defaultMessage: d.label,
          }),
        ]),
      ),
    [intl],
  );

  const statusLabelMap = useMemo(
    () =>
      Object.fromEntries(
        QUESTION_STATUS_OPTIONS.map((s) => [
          s.value,
          intl.formatMessage({
            id: `pages.questions.status.${s.value}`,
            defaultMessage: s.label,
          }),
        ]),
      ),
    [intl],
  );

  const notSetLabel = intl.formatMessage({
    id: 'pages.questions.form.notSet',
    defaultMessage: '未设置',
  });

  const noContentLabel = intl.formatMessage({
    id: 'pages.questions.form.noContent',
    defaultMessage: '暂无题干',
  });

  // valueEnums for ProTable
  const typeValueEnum = useMemo(
    () =>
      Object.fromEntries(
        QUESTION_TYPE_OPTIONS.map((t) => [
          t.value,
          { text: typeLabelMap[t.value] },
        ]),
      ),
    [typeLabelMap],
  );

  const difficultyValueEnum = useMemo(
    () =>
      Object.fromEntries(
        DIFFICULTY_OPTIONS.map((d) => [
          d.value,
          { text: difficultyLabelMap[d.value] },
        ]),
      ),
    [difficultyLabelMap],
  );

  const statusValueEnum = useMemo(
    () =>
      Object.fromEntries(
        QUESTION_STATUS_OPTIONS.map((s) => [
          s.value,
          { text: statusLabelMap[s.value] },
        ]),
      ),
    [statusLabelMap],
  );

  const confirmDelete = (question: AdminQuestion) => {
    Modal.confirm({
      title: intl.formatMessage({
        id: 'pages.questions.deleteConfirmTitle',
        defaultMessage: '确认删除',
      }),
      content: intl.formatMessage(
        {
          id: 'pages.questions.deleteConfirmContent',
          defaultMessage: '确定要删除题目「{title}」吗？此操作不可撤销。',
        },
        { title: question.title },
      ),
      okText: intl.formatMessage({
        id: 'pages.questions.delete',
        defaultMessage: '删除',
      }),
      okType: 'danger',
      cancelText: intl.formatMessage({
        id: 'pages.questions.cancel',
        defaultMessage: '取消',
      }),
      onOk: async () => {
        try {
          await request(API_PATHS.admin.question(question.id), {
            method: 'DELETE',
            skipErrorHandler: true,
          });
          message.success(
            intl.formatMessage({
              id: 'pages.questions.deleteSuccess',
              defaultMessage: '题目已删除',
            }),
          );
          actionRef.current?.reload();
        } catch (error) {
          const code =
            (
              error as {
                info?: { errorCode?: number };
                response?: { status?: number };
              }
            )?.info?.errorCode ||
            (error as { response?: { status?: number } })?.response?.status;
          if (code === 40900 || code === 409) {
            message.error(
              intl.formatMessage({
                id: 'pages.questions.deleteRefError',
                defaultMessage: '该题已被试卷引用，不能删除',
              }),
            );
            return;
          }
          message.error(
            intl.formatMessage({
              id: 'pages.questions.deleteError',
              defaultMessage: '删除题目失败',
            }),
          );
        }
      },
    });
  };

  const confirmToggleStatus = (question: AdminQuestion) => {
    const next = question.status === 'DRAFT' ? 'PUBLISHED' : 'DRAFT';
    const isPublishing = next === 'PUBLISHED';
    const label = isPublishing
      ? intl.formatMessage({
          id: 'pages.questions.status.PUBLISHED',
          defaultMessage: '已发布',
        })
      : intl.formatMessage({
          id: 'pages.questions.status.DRAFT',
          defaultMessage: '草稿',
        });
    Modal.confirm({
      title: intl.formatMessage({
        id: isPublishing
          ? 'pages.questions.publishConfirmTitle'
          : 'pages.questions.unpublishConfirmTitle',
        defaultMessage: isPublishing ? '确认发布' : '确认下架',
      }),
      content: intl.formatMessage(
        {
          id: isPublishing
            ? 'pages.questions.publishConfirmContent'
            : 'pages.questions.unpublishConfirmContent',
          defaultMessage: isPublishing
            ? '确定要发布题目「{title}」吗？'
            : '确定要下架题目「{title}」吗？',
        },
        { title: question.title },
      ),
      okText: intl.formatMessage({
        id: isPublishing
          ? 'pages.questions.publish'
          : 'pages.questions.unpublish',
        defaultMessage: isPublishing ? '发布' : '下架',
      }),
      cancelText: intl.formatMessage({
        id: 'pages.questions.cancel',
        defaultMessage: '取消',
      }),
      onOk: async () => {
        try {
          await request(API_PATHS.admin.question(question.id), {
            method: 'PATCH',
            data: { status: next },
            skipErrorHandler: true,
          });
          message.success(
            intl.formatMessage(
              {
                id: 'pages.questions.statusUpdateSuccess',
                defaultMessage: '状态已更新为「{status}」',
              },
              { status: label },
            ),
          );
          actionRef.current?.reload();
        } catch (error) {
          message.error(
            requestErrorMessage(error) ||
              intl.formatMessage({
                id: 'pages.questions.statusUpdateError',
                defaultMessage: '状态更新失败',
              }),
          );
        }
      },
    });
  };

  const reloadAndClearSelection = () => {
    setSelectedRows([]);
    actionRef.current?.reload();
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
            <ul className="question-batch-failures">
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

  const runBatchQuestionStatus = (status: 'DRAFT' | 'PUBLISHED') => {
    const isPublishing = status === 'PUBLISHED';
    modal.confirm({
      title: intl.formatMessage({
        id: isPublishing
          ? 'pages.questions.batchPublishConfirmTitle'
          : 'pages.questions.batchUnpublishConfirmTitle',
        defaultMessage: isPublishing ? '确认批量发布' : '确认批量下架',
      }),
      content: intl.formatMessage(
        {
          id: 'pages.questions.batchStatusConfirmContent',
          defaultMessage: '将处理已选择的 {count} 道题目。',
        },
        { count: selectedRows.length },
      ),
      okText: intl.formatMessage({
        id: isPublishing
          ? 'pages.questions.publish'
          : 'pages.questions.unpublish',
        defaultMessage: isPublishing ? '发布' : '下架',
      }),
      cancelText: intl.formatMessage({
        id: 'pages.questions.cancel',
        defaultMessage: '取消',
      }),
      onOk: async () => {
        try {
          const response = await request<{
            code: number;
            data: BatchActionResult;
          }>(API_PATHS.admin.questionBatchStatus, {
            method: 'PATCH',
            data: { ids: selectedRows.map((item) => item.id), status },
            skipErrorHandler: true,
          });
          showBatchResult(response.data);
          reloadAndClearSelection();
        } catch (error) {
          message.error(
            requestErrorMessage(error) ||
              intl.formatMessage({
                id: 'pages.questions.statusUpdateError',
                defaultMessage: '状态更新失败',
              }),
          );
        }
      },
    });
  };

  const runBatchDeleteQuestions = () => {
    modal.confirm({
      title: intl.formatMessage({
        id: 'pages.questions.batchDeleteConfirmTitle',
        defaultMessage: '确认批量删除',
      }),
      content: intl.formatMessage(
        {
          id: 'pages.questions.batchDeleteConfirmContent',
          defaultMessage:
            '确定要删除已选择的 {count} 道题目吗？此操作不可撤销。',
        },
        { count: selectedRows.length },
      ),
      okText: intl.formatMessage({
        id: 'pages.questions.delete',
        defaultMessage: '删除',
      }),
      okType: 'danger',
      cancelText: intl.formatMessage({
        id: 'pages.questions.cancel',
        defaultMessage: '取消',
      }),
      onOk: async () => {
        try {
          const response = await request<{
            code: number;
            data: BatchActionResult;
          }>(API_PATHS.admin.questionBatch, {
            method: 'DELETE',
            data: { ids: selectedRows.map((item) => item.id) },
            skipErrorHandler: true,
          });
          showBatchResult(response.data);
          reloadAndClearSelection();
        } catch (error) {
          message.error(
            requestErrorMessage(error) ||
              intl.formatMessage({
                id: 'pages.questions.deleteError',
                defaultMessage: '删除题目失败',
              }),
          );
        }
      },
    });
  };

  const columns: ProColumns<AdminQuestion>[] = [
    {
      title: intl.formatMessage({
        id: 'pages.questions.search.keyword',
        defaultMessage: '关键词',
      }),
      dataIndex: 'keyword',
      valueType: 'text',
      hideInTable: true,
      order: 100,
      fieldProps: {
        allowClear: true,
        placeholder: intl.formatMessage({
          id: 'pages.questions.search.placeholder',
          defaultMessage: '搜索标题、题干...',
        }),
      },
    },
    {
      title: intl.formatMessage({
        id: 'pages.questions.columns.title',
        defaultMessage: '题目',
      }),
      dataIndex: 'title',
      key: 'title',
      width: 460,
      search: false,
      render: (_: unknown, question: AdminQuestion) => (
        <div className="question-title-cell">
          <div className="question-type-icon" aria-hidden="true">
            {questionTypeIcon(question.type)}
          </div>
          <div className="question-title-main">
            <Tooltip title={question.title}>
              <button
                type="button"
                className="question-title-button"
                onClick={(event) => {
                  event.stopPropagation();
                  history.push(`/content/library/questions/${question.id}`);
                }}
              >
                {question.title}
              </button>
            </Tooltip>
            <div className="question-title-desc">
              {(question.content?.text as string) || noContentLabel}
            </div>
          </div>
        </div>
      ),
    },
    {
      title: intl.formatMessage({
        id: 'pages.questions.columns.type',
        defaultMessage: '题型',
      }),
      dataIndex: 'type',
      key: 'type',
      width: 118,
      search: fixedType ? false : undefined,
      valueType: 'select',
      valueEnum: typeValueEnum,
      render: (_: unknown, question: AdminQuestion) => (
        <StatusTag>{typeLabelMap[question.type] || question.type}</StatusTag>
      ),
    },
    {
      title: intl.formatMessage({
        id: 'pages.questions.columns.difficulty',
        defaultMessage: '难度',
      }),
      dataIndex: 'difficulty',
      key: 'difficulty',
      width: 112,
      valueType: 'select',
      valueEnum: difficultyValueEnum,
      render: (_: unknown, question: AdminQuestion) =>
        question.difficulty ? (
          <StatusTag
            tone={
              question.difficulty === 'HARD'
                ? 'danger'
                : question.difficulty === 'MEDIUM'
                  ? 'warning'
                  : 'success'
            }
          >
            {difficultyLabelMap[question.difficulty] || question.difficulty}
          </StatusTag>
        ) : (
          <span className="question-muted">{notSetLabel}</span>
        ),
    },
    {
      title: intl.formatMessage({
        id: 'pages.questions.columns.status',
        defaultMessage: '状态',
      }),
      dataIndex: 'status',
      key: 'status',
      width: 118,
      valueType: 'select',
      valueEnum: statusValueEnum,
      render: (_: unknown, question: AdminQuestion) => {
        const isPublished = question.status === 'PUBLISHED';
        return (
          <span className="question-status-cell">
            <Switch
              checked={isPublished}
              size="small"
              aria-label={intl.formatMessage({
                id: isPublished
                  ? 'pages.questions.switchToDraft'
                  : 'pages.questions.switchToPublished',
              })}
              onChange={() => confirmToggleStatus(question)}
            />
            <span className="question-status-label">
              {statusLabelMap[question.status] || question.status}
            </span>
          </span>
        );
      },
    },
    {
      title: intl.formatMessage({
        id: 'pages.questions.columns.updatedAt',
        defaultMessage: '更新时间',
      }),
      dataIndex: 'updated_at',
      key: 'updated_at',
      width: 168,
      search: false,
      sorter: true,
      render: (_: unknown, question: AdminQuestion) => (
        <span className="question-date">
          {dayjs(question.updated_at).format('YYYY-MM-DD HH:mm')}
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
      render: (_: unknown, question: AdminQuestion) => (
        <div
          className="question-actions-cell"
          onClick={(e) => e.stopPropagation()}
        >
          <Dropdown
            menu={{
              items: [
                {
                  key: 'delete',
                  label: intl.formatMessage({
                    id: 'pages.questions.delete',
                    defaultMessage: '删除',
                  }),
                  icon: <DeleteOutlined />,
                  danger: true,
                  onClick: () => confirmDelete(question),
                },
              ],
            }}
            trigger={['click']}
          >
            <a onClick={(e) => e.preventDefault()}>
              <Space size={4}>
                {intl.formatMessage({
                  id: 'pages.questions.more',
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
        id: isProgrammingOnly
          ? 'menu.content.programming'
          : 'menu.content.library.questions',
        defaultMessage: isProgrammingOnly ? '编程题' : '题目管理',
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
            id: isProgrammingOnly
              ? 'pages.programming.description'
              : 'pages.questions.description',
            defaultMessage: isProgrammingOnly
              ? '集中维护编程题、代码模板与测试用例，用于在线评测。'
              : '创建和管理考试题目、答案与编程用例。',
          })}
        </p>
      }
    >
      <ProTable<AdminQuestion>
        actionRef={actionRef}
        cardBordered={{
          search: true,
          table: true,
        }}
        columns={columns}
        columnsState={{
          persistenceKey: isProgrammingOnly
            ? 'examora-programming-questions-table-columns'
            : 'examora-questions-table-columns',
          persistenceType: 'localStorage',
        }}
        columnEmptyText="-"
        dateFormatter="string"
        debounceTime={300}
        defaultSize="middle"
        headerTitle={intl.formatMessage({
          id: isProgrammingOnly
            ? 'pages.programming.listTitle'
            : 'pages.questions.listTitle',
          defaultMessage: isProgrammingOnly ? '编程题列表' : '题目列表',
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
            id: 'pages.questions.search.searchText',
            defaultMessage: '查询',
          }),
          resetText: intl.formatMessage({
            id: 'pages.questions.search.resetText',
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
              data: { items: AdminQuestion[]; total: number };
            }>(API_PATHS.admin.questions, {
              params: {
                page: params.current,
                page_size: params.pageSize,
                ...(params.keyword ? { keyword: params.keyword } : {}),
                ...(fixedType || params.type
                  ? { type: fixedType || params.type }
                  : {}),
                ...(params.difficulty ? { difficulty: params.difficulty } : {}),
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
                id: 'pages.questions.fetchError',
                defaultMessage: '获取题目列表失败',
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
                id: 'pages.questions.total',
                defaultMessage: '共 {total} 条',
              },
              { total },
            ),
        }}
        revalidateOnFocus={false}
        scroll={{ x: 1100 }}
        tableLayout="fixed"
        toolBarRender={() => [
          <Button
            key="create"
            type="primary"
            icon={<PlusOutlined />}
            onClick={() =>
              history.push(
                fixedType
                  ? `/content/library/questions/new?type=${fixedType}`
                  : '/content/library/questions/new',
              )
            }
          >
            {intl.formatMessage({
              id: isProgrammingOnly
                ? 'pages.programming.create'
                : 'pages.questions.create',
              defaultMessage: isProgrammingOnly ? '新建编程题' : '新建题目',
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
          <Button onClick={() => runBatchQuestionStatus('PUBLISHED')}>
            {intl.formatMessage({
              id: 'pages.questions.publish',
              defaultMessage: '发布',
            })}
          </Button>
          <Button onClick={() => runBatchQuestionStatus('DRAFT')}>
            {intl.formatMessage({
              id: 'pages.questions.unpublish',
              defaultMessage: '下架',
            })}
          </Button>
          <Button
            danger
            icon={<DeleteOutlined />}
            onClick={runBatchDeleteQuestions}
          >
            {intl.formatMessage({
              id: 'pages.questions.delete',
              defaultMessage: '删除',
            })}
          </Button>
        </FooterToolbar>
      )}
    </PageContainer>
  );
};

const QuestionsPage: React.FC = () => (
  <AntdApp>
    <QuestionsPageContent />
  </AntdApp>
);

export default QuestionsPage;
