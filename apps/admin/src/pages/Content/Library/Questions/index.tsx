import {
  CheckSquareOutlined,
  CodeOutlined,
  DeleteOutlined,
  DownOutlined,
  FileTextOutlined,
  FormOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import {
  type ActionType,
  PageContainer,
  type ProColumns,
  ProTable,
} from "@ant-design/pro-components";
import { history, request, useIntl } from "@umijs/max";
import {
  App as AntdApp,
  Badge,
  Button,
  Divider,
  Dropdown,
  Modal,
  Space,
  Tag,
  Tooltip,
} from "antd";
import dayjs from "dayjs";
import React, { useMemo, useRef, useState } from "react";
import type { AdminQuestion, QuestionType } from "@examora/types";
import {
  DIFFICULTY_OPTIONS,
  QUESTION_STATUS_BADGE,
  QUESTION_STATUS_OPTIONS,
  QUESTION_TYPE_OPTIONS,
} from "@examora/types";
import "./index.less";

const DIFFICULTY_CLASS: Record<string, string> = {
  EASY: "question-diff-tag-easy",
  MEDIUM: "question-diff-tag-medium",
  HARD: "question-diff-tag-hard",
};

const questionTypeIcon = (type: QuestionType) => {
  if (type === "PROGRAMMING") return <CodeOutlined />;
  if (type === "MULTIPLE_CHOICE" || type === "TRUE_FALSE")
    return <CheckSquareOutlined />;
  if (type === "FILL_BLANK" || type === "SHORT_ANSWER") return <FormOutlined />;
  return <FileTextOutlined />;
};

const QuestionsPageContent: React.FC = () => {
  const intl = useIntl();
  const { message } = AntdApp.useApp();
  const actionRef = useRef<ActionType>(null);
  const [tableLoading, setTableLoading] = useState(false);

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
        ])
      ),
    [intl]
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
        ])
      ),
    [intl]
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
        ])
      ),
    [intl]
  );

  const notSetLabel = intl.formatMessage({
    id: "pages.questions.form.notSet",
    defaultMessage: "未设置",
  });

  const noContentLabel = intl.formatMessage({
    id: "pages.questions.form.noContent",
    defaultMessage: "暂无题干",
  });

  // valueEnums for ProTable
  const typeValueEnum = useMemo(
    () =>
      Object.fromEntries(
        QUESTION_TYPE_OPTIONS.map((t) => [
          t.value,
          { text: typeLabelMap[t.value] },
        ])
      ),
    [typeLabelMap]
  );

  const difficultyValueEnum = useMemo(
    () =>
      Object.fromEntries(
        DIFFICULTY_OPTIONS.map((d) => [
          d.value,
          { text: difficultyLabelMap[d.value] },
        ])
      ),
    [difficultyLabelMap]
  );

  const statusValueEnum = useMemo(
    () =>
      Object.fromEntries(
        QUESTION_STATUS_OPTIONS.map((s) => [
          s.value,
          { text: statusLabelMap[s.value] },
        ])
      ),
    [statusLabelMap]
  );

  const confirmDelete = (question: AdminQuestion) => {
    Modal.confirm({
      title: intl.formatMessage({
        id: "pages.questions.deleteConfirmTitle",
        defaultMessage: "确认删除",
      }),
      content: intl.formatMessage(
        {
          id: "pages.questions.deleteConfirmContent",
          defaultMessage: "确定要删除题目「{title}」吗？此操作不可撤销。",
        },
        { title: question.title }
      ),
      okText: intl.formatMessage({
        id: "pages.questions.delete",
        defaultMessage: "删除",
      }),
      okType: "danger",
      cancelText: intl.formatMessage({
        id: "pages.questions.cancel",
        defaultMessage: "取消",
      }),
      onOk: async () => {
        try {
          await request(`/api/admin/questions/${question.id}`, {
            method: "DELETE",
            skipErrorHandler: true,
          });
          message.success(
            intl.formatMessage({
              id: "pages.questions.deleteSuccess",
              defaultMessage: "题目已删除",
            })
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
                id: "pages.questions.deleteRefError",
                defaultMessage: "该题已被试卷引用，不能删除",
              })
            );
            return;
          }
          message.error(
            intl.formatMessage({
              id: "pages.questions.deleteError",
              defaultMessage: "删除题目失败",
            })
          );
        }
      },
    });
  };

  const columns: ProColumns<AdminQuestion>[] = [
    {
      title: intl.formatMessage({
        id: "pages.questions.search.keyword",
        defaultMessage: "关键词",
      }),
      dataIndex: "keyword",
      valueType: "text",
      hideInTable: true,
      order: 100,
      fieldProps: {
        allowClear: true,
        placeholder: intl.formatMessage({
          id: "pages.questions.search.placeholder",
          defaultMessage: "搜索标题、题干...",
        }),
      },
    },
    {
      title: intl.formatMessage({
        id: "pages.questions.columns.title",
        defaultMessage: "题目",
      }),
      dataIndex: "title",
      key: "title",
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
        id: "pages.questions.columns.type",
        defaultMessage: "题型",
      }),
      dataIndex: "type",
      key: "type",
      width: 118,
      valueType: "select",
      valueEnum: typeValueEnum,
      render: (_: unknown, question: AdminQuestion) => (
        <Tag className="question-type-tag">
          {typeLabelMap[question.type] || question.type}
        </Tag>
      ),
    },
    {
      title: intl.formatMessage({
        id: "pages.questions.columns.difficulty",
        defaultMessage: "难度",
      }),
      dataIndex: "difficulty",
      key: "difficulty",
      width: 112,
      valueType: "select",
      valueEnum: difficultyValueEnum,
      render: (_: unknown, question: AdminQuestion) =>
        question.difficulty ? (
          <Tag
            className={`question-diff-tag ${
              DIFFICULTY_CLASS[question.difficulty] || ""
            }`}
          >
            {difficultyLabelMap[question.difficulty] || question.difficulty}
          </Tag>
        ) : (
          <span className="question-muted">{notSetLabel}</span>
        ),
    },
    {
      title: intl.formatMessage({
        id: "pages.questions.columns.status",
        defaultMessage: "状态",
      }),
      dataIndex: "status",
      key: "status",
      width: 118,
      valueType: "select",
      valueEnum: statusValueEnum,
      render: (_: unknown, question: AdminQuestion) => (
        <Badge
          className="question-status-badge"
          status={QUESTION_STATUS_BADGE[question.status]}
          text={statusLabelMap[question.status] || question.status}
        />
      ),
    },
    {
      title: intl.formatMessage({
        id: "pages.questions.columns.updatedAt",
        defaultMessage: "更新时间",
      }),
      dataIndex: "updated_at",
      key: "updated_at",
      width: 168,
      search: false,
      sorter: true,
      render: (_: unknown, question: AdminQuestion) => (
        <span className="question-date">
          {dayjs(question.updated_at).format("YYYY-MM-DD HH:mm")}
        </span>
      ),
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
      render: (_: unknown, question: AdminQuestion) => (
        <div
          className="question-actions-cell"
          onClick={(e) => e.stopPropagation()}
        >
          <a
            onClick={() =>
              history.push(`/content/library/questions/${question.id}`)
            }
          >
            {intl.formatMessage({
              id: "pages.questions.edit",
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
                    id: "pages.questions.delete",
                    defaultMessage: "删除",
                  }),
                  icon: <DeleteOutlined />,
                  danger: true,
                  onClick: () => confirmDelete(question),
                },
              ],
            }}
            trigger={["click"]}
          >
            <a onClick={(e) => e.preventDefault()}>
              <Space size={4}>
                {intl.formatMessage({
                  id: "pages.questions.more",
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
        id: "menu.content.library.questions",
        defaultMessage: "题目管理",
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
            id: "pages.questions.description",
            defaultMessage: "创建和管理考试题目、答案与编程用例。",
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
          persistenceKey: "examora-questions-table-columns",
          persistenceType: "localStorage",
        }}
        columnEmptyText="-"
        dateFormatter="string"
        debounceTime={300}
        defaultSize="middle"
        headerTitle={intl.formatMessage({
          id: "pages.questions.listTitle",
          defaultMessage: "题目列表",
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
            id: "pages.questions.search.searchText",
            defaultMessage: "查询",
          }),
          resetText: intl.formatMessage({
            id: "pages.questions.search.resetText",
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
        request={async (params, sort) => {
          try {
            const sortField = Object.keys(sort)[0] || "updated_at";
            const sortOrder = sort[sortField] === "ascend" ? "asc" : "desc";
            const response = await request<{
              code: number;
              data: { items: AdminQuestion[]; total: number };
            }>("/api/admin/questions", {
              params: {
                page: params.current,
                page_size: params.pageSize,
                ...(params.keyword ? { keyword: params.keyword } : {}),
                ...(params.type ? { type: params.type } : {}),
                ...(params.difficulty ? { difficulty: params.difficulty } : {}),
                ...(params.status ? { status: params.status } : {}),
                sort_field: sortField,
                sort_order: sortOrder,
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
                id: "pages.questions.fetchError",
                defaultMessage: "获取题目列表失败",
              })
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
                id: "pages.questions.total",
                defaultMessage: "共 {total} 条",
              },
              { total }
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
            onClick={() => history.push("/content/library/questions/new")}
          >
            {intl.formatMessage({
              id: "pages.questions.create",
              defaultMessage: "新建题目",
            })}
          </Button>,
        ]}
        onRow={(question) => ({
          onClick: () =>
            history.push(`/content/library/questions/${question.id}`),
          style: { cursor: "pointer" },
        })}
      />
    </PageContainer>
  );
};

const QuestionsPage: React.FC = () => (
  <AntdApp>
    <QuestionsPageContent />
  </AntdApp>
);

export default QuestionsPage;
