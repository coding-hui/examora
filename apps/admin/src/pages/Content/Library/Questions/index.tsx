import {
  CheckSquareOutlined,
  CodeOutlined,
  DeleteOutlined,
  DownOutlined,
  EditOutlined,
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
  Card,
  Col,
  Divider,
  Drawer,
  Dropdown,
  Form,
  Input,
  InputNumber,
  Modal,
  Row,
  Select,
  Space,
  Switch,
  Tag,
  Tooltip,
} from "antd";
import dayjs from "dayjs";
import React, { useMemo, useRef, useState } from "react";
import "./index.less";

type QuestionType =
  | "SINGLE_CHOICE"
  | "MULTIPLE_CHOICE"
  | "TRUE_FALSE"
  | "FILL_BLANK"
  | "SHORT_ANSWER"
  | "PROGRAMMING";

type QuestionStatus = "DRAFT" | "PUBLISHED";

interface QuestionOption {
  key: string;
  text: string;
}

interface AdminTestCase {
  client_key?: string;
  id?: number;
  question_id?: number;
  input: string;
  expected_output: string;
  time_limit_ms: number;
  memory_limit_mb: number;
  is_sample: boolean;
  is_hidden: boolean;
  sort_order: number;
}

interface AdminQuestion {
  id: number;
  type: QuestionType;
  title: string;
  content: {
    text?: string;
    options?: QuestionOption[];
    [key: string]: unknown;
  };
  answer?: Record<string, unknown> | null;
  difficulty?: string;
  language?: string;
  starter_code?: string;
  time_limit_ms: number;
  memory_limit_mb: number;
  status: QuestionStatus;
  test_cases?: AdminTestCase[];
  created_by: number;
  created_at: string;
  updated_at: string;
}

interface QuestionFormValues {
  type: QuestionType;
  status: QuestionStatus;
  title: string;
  difficulty?: string;
  content_text?: string;
  options_text?: string;
  answer_single?: string;
  answer_multiple?: string[];
  answer_true_false?: "true" | "false";
  answer_blanks?: string;
  answer_reference?: string;
  language?: string;
  starter_code?: string;
  time_limit_ms: number;
  memory_limit_mb: number;
}

const QUESTION_TYPES: Array<{ label: string; value: QuestionType }> = [
  { label: "单选题", value: "SINGLE_CHOICE" },
  { label: "多选题", value: "MULTIPLE_CHOICE" },
  { label: "判断题", value: "TRUE_FALSE" },
  { label: "填空题", value: "FILL_BLANK" },
  { label: "简答题", value: "SHORT_ANSWER" },
  { label: "编程题", value: "PROGRAMMING" },
];

const DIFFICULTIES = [
  { label: "简单", value: "EASY" },
  { label: "中等", value: "MEDIUM" },
  { label: "困难", value: "HARD" },
];

const STATUSES: Array<{ label: string; value: QuestionStatus }> = [
  { label: "草稿", value: "DRAFT" },
  { label: "已发布", value: "PUBLISHED" },
];

const LANGUAGES = [
  { label: "Go", value: "GO" },
  { label: "Python", value: "PYTHON" },
  { label: "JavaScript", value: "JAVASCRIPT" },
  { label: "Java", value: "JAVA" },
  { label: "C++", value: "CPP" },
];

const STATUS_BADGE: Record<QuestionStatus, "default" | "success"> = {
  DRAFT: "default",
  PUBLISHED: "success",
};

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

const parseOptions = (value?: string): QuestionOption[] =>
  (value || "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line, index) => {
      const matched = line.match(/^([A-Za-z0-9]+)[.、)]\s*(.+)$/);
      if (matched) {
        return { key: matched[1].toUpperCase(), text: matched[2].trim() };
      }
      return { key: String.fromCharCode(65 + index), text: line };
    });

const optionsToText = (options?: QuestionOption[]) =>
  (options || []).map((item) => `${item.key}. ${item.text}`).join("\n");

const splitLines = (value?: string) =>
  (value || "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

const newTestCaseKey = () =>
  `case-${Date.now()}-${Math.random().toString(36).slice(2)}`;

const errorCode = (error: unknown): number | undefined => {
  const maybe = error as {
    info?: { errorCode?: number };
    response?: { status?: number };
  };
  return maybe.info?.errorCode || maybe.response?.status;
};

const QuestionsPageContent: React.FC = () => {
  const intl = useIntl();
  const { message } = AntdApp.useApp();
  const [questionForm] = Form.useForm<QuestionFormValues>();
  const actionRef = useRef<ActionType>(null);
  const [testCases, setTestCases] = useState<AdminTestCase[]>([]);
  const [tableLoading, setTableLoading] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<AdminQuestion | null>(null);

  const questionType = Form.useWatch("type", questionForm);
  const optionsText = Form.useWatch("options_text", questionForm);

  // i18n label maps
  const typeLabelMap = useMemo(
    () =>
      Object.fromEntries(
        QUESTION_TYPES.map((t) => [
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
        DIFFICULTIES.map((d) => [
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
        STATUSES.map((s) => [
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
    id: "pages.questions.form.notSet",
    defaultMessage: "未设置",
  });

  const noContentLabel = intl.formatMessage({
    id: "pages.questions.form.noContent",
    defaultMessage: "暂无题干",
  });

  // i18n'd select options
  const typeOptions = useMemo(
    () => QUESTION_TYPES.map((t) => ({ ...t, label: typeLabelMap[t.value] })),
    [typeLabelMap],
  );

  const difficultyOptions = useMemo(
    () =>
      DIFFICULTIES.map((d) => ({ ...d, label: difficultyLabelMap[d.value] })),
    [difficultyLabelMap],
  );

  const statusOptions = useMemo(
    () => STATUSES.map((s) => ({ ...s, label: statusLabelMap[s.value] })),
    [statusLabelMap],
  );

  // valueEnums for ProTable
  const typeValueEnum = useMemo(
    () =>
      Object.fromEntries(
        QUESTION_TYPES.map((t) => [t.value, { text: typeLabelMap[t.value] }]),
      ),
    [typeLabelMap],
  );

  const difficultyValueEnum = useMemo(
    () =>
      Object.fromEntries(
        DIFFICULTIES.map((d) => [
          d.value,
          { text: difficultyLabelMap[d.value] },
        ]),
      ),
    [difficultyLabelMap],
  );

  const statusValueEnum = useMemo(
    () =>
      Object.fromEntries(
        STATUSES.map((s) => [s.value, { text: statusLabelMap[s.value] }]),
      ),
    [statusLabelMap],
  );

  const answerOptions = useMemo(
    () =>
      parseOptions(optionsText).map((item) => ({
        label: `${item.key}. ${item.text}`,
        value: item.key,
      })),
    [optionsText],
  );

  const fillQuestionForm = (question?: AdminQuestion) => {
    const answer = question?.answer || {};
    const content = question?.content || {};
    questionForm.setFieldsValue({
      type: question?.type || "SINGLE_CHOICE",
      status: question?.status || "DRAFT",
      title: question?.title || "",
      difficulty: question?.difficulty,
      content_text: content.text || "",
      options_text: optionsToText(content.options),
      answer_single: answer.choice as string | undefined,
      answer_multiple: (answer.choices as string[] | undefined) || [],
      answer_true_false:
        typeof answer.correct === "boolean"
          ? answer.correct
            ? "true"
            : "false"
          : undefined,
      answer_blanks: Array.isArray(answer.blanks)
        ? (answer.blanks as string[]).join("\n")
        : "",
      answer_reference: answer.reference as string | undefined,
      language: question?.language,
      starter_code: question?.starter_code,
      time_limit_ms: question?.time_limit_ms || 2000,
      memory_limit_mb: question?.memory_limit_mb || 256,
    });
    setTestCases(
      (question?.test_cases || []).map((item, index) => ({
        ...item,
        client_key: item.id ? `case-${item.id}` : newTestCaseKey(),
        time_limit_ms: item.time_limit_ms || question?.time_limit_ms || 2000,
        memory_limit_mb:
          item.memory_limit_mb || question?.memory_limit_mb || 256,
        sort_order: item.sort_order ?? index,
      })),
    );
  };

  const openCreate = () => {
    setSaving(false);
    setEditing(null);
    questionForm.resetFields();
    fillQuestionForm();
    setDrawerOpen(true);
  };

  const openEdit = async (record: AdminQuestion) => {
    try {
      setSaving(false);
      const response = await request<{ code: number; data: AdminQuestion }>(
        `/api/admin/questions/${record.id}`,
      );
      const detail = response.data;
      setEditing(detail);
      questionForm.resetFields();
      fillQuestionForm(detail);
      setDrawerOpen(true);
    } catch (_error) {
      message.error(
        intl.formatMessage({
          id: "pages.questions.detailError",
          defaultMessage: "获取题目详情失败",
        }),
      );
    }
  };

  const buildPayload = (values: QuestionFormValues) => {
    const options = parseOptions(values.options_text);
    const content: Record<string, unknown> = {
      text: values.content_text || "",
    };
    if (values.type === "SINGLE_CHOICE" || values.type === "MULTIPLE_CHOICE") {
      content.options = options;
    }

    let answer: Record<string, unknown> = {};
    if (values.type === "SINGLE_CHOICE") {
      answer = { choice: values.answer_single };
    } else if (values.type === "MULTIPLE_CHOICE") {
      answer = { choices: values.answer_multiple || [] };
    } else if (values.type === "TRUE_FALSE") {
      answer = { correct: values.answer_true_false === "true" };
    } else if (values.type === "FILL_BLANK") {
      answer = { blanks: splitLines(values.answer_blanks) };
    } else if (values.type === "SHORT_ANSWER") {
      answer = { reference: values.answer_reference || "" };
    }

    return {
      type: values.type,
      title: values.title,
      content,
      answer,
      difficulty: values.difficulty,
      language: values.type === "PROGRAMMING" ? values.language : undefined,
      starter_code:
        values.type === "PROGRAMMING" ? values.starter_code || "" : undefined,
      time_limit_ms: values.time_limit_ms || 2000,
      memory_limit_mb: values.memory_limit_mb || 256,
      status: values.status,
      test_cases:
        values.type === "PROGRAMMING"
          ? testCases.map((item, index) => ({
              input: item.input,
              expected_output: item.expected_output,
              time_limit_ms: item.time_limit_ms || values.time_limit_ms || 2000,
              memory_limit_mb:
                item.memory_limit_mb || values.memory_limit_mb || 256,
              is_sample: item.is_sample,
              is_hidden: item.is_hidden,
              sort_order: index,
            }))
          : [],
    };
  };

  const saveQuestion = async () => {
    try {
      const values = await questionForm.validateFields();
      if (values.type === "PROGRAMMING" && testCases.length === 0) {
        message.error(
          intl.formatMessage({
            id: "pages.questions.needTestCase",
            defaultMessage: "请至少添加一个测试用例",
          }),
        );
        return;
      }
      if (
        values.type === "PROGRAMMING" &&
        testCases.some((item) => !item.expected_output.trim())
      ) {
        message.error(
          intl.formatMessage({
            id: "pages.questions.needExpectedOutput",
            defaultMessage: "请填写每个测试用例的预期输出",
          }),
        );
        return;
      }
      setSaving(true);
      const payload = buildPayload(values);
      await request(
        editing ? `/api/admin/questions/${editing.id}` : "/api/admin/questions",
        {
          method: editing ? "PUT" : "POST",
          data: payload,
        },
      );
      message.success(
        editing
          ? intl.formatMessage({
              id: "pages.questions.saveSuccess",
              defaultMessage: "题目已保存",
            })
          : intl.formatMessage({
              id: "pages.questions.createSuccess",
              defaultMessage: "题目已创建",
            }),
      );
      setDrawerOpen(false);
      actionRef.current?.reload();
    } catch (error) {
      if (errorCode(error) !== undefined) {
        message.error(
          editing
            ? intl.formatMessage({
                id: "pages.questions.saveError",
                defaultMessage: "保存题目失败",
              })
            : intl.formatMessage({
                id: "pages.questions.createError",
                defaultMessage: "创建题目失败",
              }),
        );
      }
    } finally {
      setSaving(false);
    }
  };

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
        { title: question.title },
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
            }),
          );
          actionRef.current?.reload();
        } catch (error) {
          if (errorCode(error) === 40900 || errorCode(error) === 409) {
            message.error(
              intl.formatMessage({
                id: "pages.questions.deleteRefError",
                defaultMessage: "该题已被试卷引用，不能删除",
              }),
            );
            return;
          }
          message.error(
            intl.formatMessage({
              id: "pages.questions.deleteError",
              defaultMessage: "删除题目失败",
            }),
          );
        }
      },
    });
  };

  const addTestCase = () => {
    setTestCases((items) => [
      ...items,
      {
        input: "",
        client_key: newTestCaseKey(),
        expected_output: "",
        time_limit_ms: questionForm.getFieldValue("time_limit_ms") || 2000,
        memory_limit_mb: questionForm.getFieldValue("memory_limit_mb") || 256,
        is_sample: items.length === 0,
        is_hidden: items.length !== 0,
        sort_order: items.length,
      },
    ]);
  };

  const updateTestCase = <K extends keyof AdminTestCase>(
    index: number,
    key: K,
    value: AdminTestCase[K],
  ) => {
    setTestCases((items) =>
      items.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [key]: value } : item,
      ),
    );
  };

  const removeTestCase = (index: number) => {
    setTestCases((items) =>
      items
        .filter((_, itemIndex) => itemIndex !== index)
        .map((item, itemIndex) => ({ ...item, sort_order: itemIndex })),
    );
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
              {question.content?.text || noContentLabel}
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
          status={STATUS_BADGE[question.status]}
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
        <div onClick={(e) => e.stopPropagation()}>
          <a onClick={() => openEdit(question)}>
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

  const renderAnswerFields = () => {
    if (
      questionType === "SINGLE_CHOICE" ||
      questionType === "MULTIPLE_CHOICE"
    ) {
      return (
        <>
          <Form.Item
            label={intl.formatMessage({
              id: "pages.questions.form.options",
              defaultMessage: "选项",
            })}
            name="options_text"
            rules={[
              {
                required: true,
                message: intl.formatMessage({
                  id: "pages.questions.form.optionsRequired",
                  defaultMessage: "请输入题目选项",
                }),
              },
            ]}
          >
            <Input.TextArea
              rows={5}
              placeholder={intl.formatMessage({
                id: "pages.questions.form.optionsPlaceholder",
                defaultMessage: "A. 选项一\nB. 选项二\nC. 选项三",
              })}
            />
          </Form.Item>
          {questionType === "SINGLE_CHOICE" ? (
            <Form.Item
              label={intl.formatMessage({
                id: "pages.questions.form.answerSingle",
                defaultMessage: "正确答案",
              })}
              name="answer_single"
              rules={[
                {
                  required: true,
                  message: intl.formatMessage({
                    id: "pages.questions.form.answerSingleRequired",
                    defaultMessage: "请选择正确答案",
                  }),
                },
              ]}
            >
              <Select
                options={answerOptions}
                placeholder={intl.formatMessage({
                  id: "pages.questions.form.answerSinglePlaceholder",
                  defaultMessage: "选择一个正确选项",
                })}
              />
            </Form.Item>
          ) : (
            <Form.Item
              label={intl.formatMessage({
                id: "pages.questions.form.answerMultiple",
                defaultMessage: "正确答案",
              })}
              name="answer_multiple"
              rules={[
                {
                  required: true,
                  message: intl.formatMessage({
                    id: "pages.questions.form.answerMultipleRequired",
                    defaultMessage: "请选择正确答案",
                  }),
                },
              ]}
            >
              <Select
                mode="multiple"
                options={answerOptions}
                placeholder={intl.formatMessage({
                  id: "pages.questions.form.answerMultiplePlaceholder",
                  defaultMessage: "选择多个正确选项",
                })}
              />
            </Form.Item>
          )}
        </>
      );
    }

    if (questionType === "TRUE_FALSE") {
      return (
        <Form.Item
          label={intl.formatMessage({
            id: "pages.questions.form.answerTrueFalse",
            defaultMessage: "正确答案",
          })}
          name="answer_true_false"
          rules={[
            {
              required: true,
              message: intl.formatMessage({
                id: "pages.questions.form.answerTrueFalseRequired",
                defaultMessage: "请选择正确答案",
              }),
            },
          ]}
        >
          <Select
            options={[
              {
                label: intl.formatMessage({
                  id: "pages.questions.form.true",
                  defaultMessage: "正确",
                }),
                value: "true",
              },
              {
                label: intl.formatMessage({
                  id: "pages.questions.form.false",
                  defaultMessage: "错误",
                }),
                value: "false",
              },
            ]}
          />
        </Form.Item>
      );
    }

    if (questionType === "FILL_BLANK") {
      return (
        <Form.Item
          label={intl.formatMessage({
            id: "pages.questions.form.answerBlanks",
            defaultMessage: "填空答案",
          })}
          name="answer_blanks"
          rules={[
            {
              required: true,
              message: intl.formatMessage({
                id: "pages.questions.form.answerBlanksRequired",
                defaultMessage: "请输入填空答案",
              }),
            },
          ]}
        >
          <Input.TextArea
            rows={3}
            placeholder={intl.formatMessage({
              id: "pages.questions.form.answerBlanksPlaceholder",
              defaultMessage: "每行一个空的答案",
            })}
          />
        </Form.Item>
      );
    }

    if (questionType === "SHORT_ANSWER") {
      return (
        <Form.Item
          label={intl.formatMessage({
            id: "pages.questions.form.answerReference",
            defaultMessage: "参考答案",
          })}
          name="answer_reference"
          rules={[
            {
              required: true,
              message: intl.formatMessage({
                id: "pages.questions.form.answerReferenceRequired",
                defaultMessage: "请输入参考答案",
              }),
            },
          ]}
        >
          <Input.TextArea
            rows={5}
            placeholder={intl.formatMessage({
              id: "pages.questions.form.answerReferencePlaceholder",
              defaultMessage: "输入参考答案或评分要点",
            })}
          />
        </Form.Item>
      );
    }

    return null;
  };

  const renderProgrammingFields = () => {
    if (questionType !== "PROGRAMMING") return null;

    return (
      <>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label={intl.formatMessage({
                id: "pages.questions.form.language",
                defaultMessage: "语言",
              })}
              name="language"
              rules={[
                {
                  required: true,
                  message: intl.formatMessage({
                    id: "pages.questions.form.languageRequired",
                    defaultMessage: "请选择语言",
                  }),
                },
              ]}
            >
              <Select
                options={LANGUAGES}
                placeholder={intl.formatMessage({
                  id: "pages.questions.form.languagePlaceholder",
                  defaultMessage: "选择语言",
                })}
              />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item
              label={intl.formatMessage({
                id: "pages.questions.form.timeLimit",
                defaultMessage: "时间限制(ms)",
              })}
              name="time_limit_ms"
              rules={[
                {
                  required: true,
                  message: intl.formatMessage({
                    id: "pages.questions.form.timeLimitRequired",
                    defaultMessage: "请输入时间限制",
                  }),
                },
              ]}
            >
              <InputNumber min={1} max={30000} style={{ width: "100%" }} />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item
              label={intl.formatMessage({
                id: "pages.questions.form.memoryLimit",
                defaultMessage: "内存限制(MB)",
              })}
              name="memory_limit_mb"
              rules={[
                {
                  required: true,
                  message: intl.formatMessage({
                    id: "pages.questions.form.memoryLimitRequired",
                    defaultMessage: "请输入内存限制",
                  }),
                },
              ]}
            >
              <InputNumber min={1} max={4096} style={{ width: "100%" }} />
            </Form.Item>
          </Col>
        </Row>
        <Form.Item
          label={intl.formatMessage({
            id: "pages.questions.form.starterCode",
            defaultMessage: "代码模板",
          })}
          name="starter_code"
        >
          <Input.TextArea
            rows={6}
            placeholder={intl.formatMessage({
              id: "pages.questions.form.starterCodePlaceholder",
              defaultMessage: "可选，输入候选人初始代码",
            })}
            style={{
              fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
            }}
          />
        </Form.Item>
        <Space orientation="vertical" style={{ width: "100%" }} size={12}>
          {testCases.map((item, index) => (
            <Card
              key={item.client_key}
              size="small"
              title={intl.formatMessage(
                {
                  id: "pages.questions.form.testCase",
                  defaultMessage: "测试用例 {index}",
                },
                { index: index + 1 },
              )}
              extra={
                <Button
                  type="text"
                  danger
                  size="small"
                  onClick={() => removeTestCase(index)}
                >
                  {intl.formatMessage({
                    id: "pages.questions.form.deleteTestCase",
                    defaultMessage: "删除",
                  })}
                </Button>
              }
            >
              <Row gutter={12}>
                <Col span={12}>
                  <Input.TextArea
                    value={item.input}
                    rows={3}
                    placeholder={intl.formatMessage({
                      id: "pages.questions.form.input",
                      defaultMessage: "标准输入",
                    })}
                    onChange={(event) =>
                      updateTestCase(index, "input", event.target.value)
                    }
                  />
                </Col>
                <Col span={12}>
                  <Input.TextArea
                    value={item.expected_output}
                    rows={3}
                    placeholder={intl.formatMessage({
                      id: "pages.questions.form.expectedOutput",
                      defaultMessage: "预期输出",
                    })}
                    onChange={(event) =>
                      updateTestCase(
                        index,
                        "expected_output",
                        event.target.value,
                      )
                    }
                  />
                </Col>
              </Row>
              <Row gutter={12} style={{ marginTop: 12 }}>
                <Col span={6}>
                  <InputNumber
                    min={1}
                    max={30000}
                    value={item.time_limit_ms}
                    addonAfter="ms"
                    style={{ width: "100%" }}
                    onChange={(value) =>
                      updateTestCase(index, "time_limit_ms", value || 2000)
                    }
                  />
                </Col>
                <Col span={6}>
                  <InputNumber
                    min={1}
                    max={4096}
                    value={item.memory_limit_mb}
                    addonAfter="MB"
                    style={{ width: "100%" }}
                    onChange={(value) =>
                      updateTestCase(index, "memory_limit_mb", value || 256)
                    }
                  />
                </Col>
                <Col span={6}>
                  <Space>
                    <span>
                      {intl.formatMessage({
                        id: "pages.questions.form.sample",
                        defaultMessage: "示例",
                      })}
                    </span>
                    <Switch
                      checked={item.is_sample}
                      onChange={(value) =>
                        updateTestCase(index, "is_sample", value)
                      }
                    />
                  </Space>
                </Col>
                <Col span={6}>
                  <Space>
                    <span>
                      {intl.formatMessage({
                        id: "pages.questions.form.hidden",
                        defaultMessage: "隐藏",
                      })}
                    </span>
                    <Switch
                      checked={item.is_hidden}
                      onChange={(value) =>
                        updateTestCase(index, "is_hidden", value)
                      }
                    />
                  </Space>
                </Col>
              </Row>
            </Card>
          ))}
          <Button
            type="dashed"
            block
            onClick={addTestCase}
            icon={<PlusOutlined />}
          >
            {intl.formatMessage({
              id: "pages.questions.form.addTestCase",
              defaultMessage: "添加测试用例",
            })}
          </Button>
        </Space>
      </>
    );
  };

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
                id: "pages.questions.total",
                defaultMessage: "共 {total} 条",
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
            onClick={openCreate}
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

      <Drawer
        title={
          editing
            ? intl.formatMessage({
                id: "pages.questions.drawerEditTitle",
                defaultMessage: "编辑题目",
              })
            : intl.formatMessage({
                id: "pages.questions.drawerCreateTitle",
                defaultMessage: "新建题目",
              })
        }
        size={820}
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
              {intl.formatMessage({
                id: "pages.questions.cancel",
                defaultMessage: "取消",
              })}
            </Button>
            <Button type="primary" loading={saving} onClick={saveQuestion}>
              {intl.formatMessage({
                id: "pages.questions.save",
                defaultMessage: "保存",
              })}
            </Button>
          </Space>
        }
      >
        <Form form={questionForm} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label={intl.formatMessage({
                  id: "pages.questions.form.type",
                  defaultMessage: "题型",
                })}
                name="type"
                rules={[
                  {
                    required: true,
                    message: intl.formatMessage({
                      id: "pages.questions.form.typeRequired",
                      defaultMessage: "请选择题型",
                    }),
                  },
                ]}
              >
                <Select options={typeOptions} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label={intl.formatMessage({
                  id: "pages.questions.form.status",
                  defaultMessage: "状态",
                })}
                name="status"
                rules={[
                  {
                    required: true,
                    message: intl.formatMessage({
                      id: "pages.questions.form.statusRequired",
                      defaultMessage: "请选择状态",
                    }),
                  },
                ]}
              >
                <Select options={statusOptions} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item
            label={intl.formatMessage({
              id: "pages.questions.form.title",
              defaultMessage: "标题",
            })}
            name="title"
            rules={[
              {
                required: true,
                whitespace: true,
                message: intl.formatMessage({
                  id: "pages.questions.form.titleRequired",
                  defaultMessage: "请输入标题",
                }),
              },
            ]}
          >
            <Input
              placeholder={intl.formatMessage({
                id: "pages.questions.form.titlePlaceholder",
                defaultMessage: "输入题目标题",
              })}
            />
          </Form.Item>
          <Form.Item
            label={intl.formatMessage({
              id: "pages.questions.form.contentText",
              defaultMessage: "题干",
            })}
            name="content_text"
            rules={[
              {
                required: true,
                whitespace: true,
                message: intl.formatMessage({
                  id: "pages.questions.form.contentTextRequired",
                  defaultMessage: "请输入题干",
                }),
              },
            ]}
          >
            <Input.TextArea
              rows={5}
              placeholder={intl.formatMessage({
                id: "pages.questions.form.contentTextPlaceholder",
                defaultMessage: "输入题干内容",
              })}
            />
          </Form.Item>
          <Form.Item
            label={intl.formatMessage({
              id: "pages.questions.form.difficulty",
              defaultMessage: "难度",
            })}
            name="difficulty"
          >
            <Select
              allowClear
              options={difficultyOptions}
              placeholder={intl.formatMessage({
                id: "pages.questions.form.difficultyPlaceholder",
                defaultMessage: "选择难度",
              })}
            />
          </Form.Item>
          {renderAnswerFields()}
          {renderProgrammingFields()}
        </Form>
      </Drawer>
    </PageContainer>
  );
};

const QuestionsPage: React.FC = () => (
  <AntdApp>
    <QuestionsPageContent />
  </AntdApp>
);

export default QuestionsPage;
