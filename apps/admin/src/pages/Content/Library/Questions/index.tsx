import {
  CheckSquareOutlined,
  CodeOutlined,
  DeleteOutlined,
  EditOutlined,
  FileTextOutlined,
  FormOutlined,
  MoreOutlined,
  PlusOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import { PageContainer } from "@ant-design/pro-components";
import { history, request } from "@umijs/max";
import {
  App as AntdApp,
  Badge,
  Button,
  Card,
  Col,
  Drawer,
  Dropdown,
  Empty,
  Form,
  Input,
  InputNumber,
  Modal,
  Pagination,
  Row,
  Select,
  Space,
  Switch,
  Table,
  Tag,
  Tooltip,
} from "antd";
import type { ColumnsType, TableProps } from "antd/es/table";
import dayjs from "dayjs";
import React, { useEffect, useMemo, useRef, useState } from "react";
import type { InputRef } from "antd";
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

interface PageEnvelope {
  code: number;
  data: {
    items: AdminQuestion[];
    total: number;
    page: number;
    page_size: number;
  };
}

interface QuestionEnvelope {
  code: number;
  data: AdminQuestion;
}

interface FilterValues {
  keyword?: string;
  type?: QuestionType;
  difficulty?: string;
  status?: QuestionStatus;
}

type QuestionSortField = "updated_at";
type QuestionSortOrder = "asc" | "desc";

interface QuestionSort {
  field: QuestionSortField;
  order: QuestionSortOrder;
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

const typeLabel = (type: QuestionType) =>
  QUESTION_TYPES.find((item) => item.value === type)?.label || type;

const statusLabel = (status: QuestionStatus) =>
  STATUSES.find((item) => item.value === status)?.label || status;

const difficultyLabel = (difficulty?: string) =>
  DIFFICULTIES.find((item) => item.value === difficulty)?.label ||
  difficulty ||
  "未设置";

const filterOptions = <T extends string>(
  items: Array<{ label: string; value: T }>
) => items.map((item) => ({ text: item.label, value: item.value }));

const selectedTableFilter = <T extends string>(
  value?: Array<React.Key | boolean> | null
): T | undefined => {
  const selected = value?.[0];
  return selected === undefined || typeof selected === "boolean"
    ? undefined
    : (String(selected) as T);
};

const antdSortOrder = (order: QuestionSortOrder) =>
  order === "asc" ? "ascend" : "descend";

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

const errorCode = (error: unknown): number | undefined => {
  const maybe = error as {
    info?: { errorCode?: number };
    response?: { status?: number };
  };
  return maybe.info?.errorCode || maybe.response?.status;
};

const newTestCaseKey = () =>
  `case-${Date.now()}-${Math.random().toString(36).slice(2)}`;

const questionTypeIcon = (type: QuestionType) => {
  if (type === "PROGRAMMING") {
    return <CodeOutlined />;
  }
  if (type === "MULTIPLE_CHOICE" || type === "TRUE_FALSE") {
    return <CheckSquareOutlined />;
  }
  if (type === "FILL_BLANK" || type === "SHORT_ANSWER") {
    return <FormOutlined />;
  }
  return <FileTextOutlined />;
};

const QuestionsPageContent: React.FC = () => {
  const { message } = AntdApp.useApp();
  const [filterForm] = Form.useForm<FilterValues>();
  const [questionForm] = Form.useForm<QuestionFormValues>();
  const searchInputRef = useRef<InputRef>(null);
  const [questions, setQuestions] = useState<AdminQuestion[]>([]);
  const [testCases, setTestCases] = useState<AdminTestCase[]>([]);
  const [filters, setFilters] = useState<FilterValues>({});
  const [sortState, setSortState] = useState<QuestionSort>({
    field: "updated_at",
    order: "desc",
  });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<AdminQuestion | null>(null);

  const questionType = Form.useWatch("type", questionForm);
  const optionsText = Form.useWatch("options_text", questionForm);

  const answerOptions = useMemo(
    () =>
      parseOptions(optionsText).map((item) => ({
        label: `${item.key}. ${item.text}`,
        value: item.key,
      })),
    [optionsText]
  );

  const fetchQuestions = async () => {
    setLoading(true);
    try {
      const response = await request<PageEnvelope>("/api/admin/questions", {
        params: {
          ...filters,
          sort_field: sortState.field,
          sort_order: sortState.order,
          page,
          page_size: pageSize,
        },
      });
      setQuestions(response.data?.items || []);
      setTotal(response.data?.total || 0);
    } catch (_error) {
      message.error("获取题目列表失败");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, [filters, sortState, page, pageSize]);

  const fetchQuestionDetail = async (id: number) => {
    const response = await request<QuestionEnvelope>(
      `/api/admin/questions/${id}`
    );
    return response.data;
  };

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
      }))
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
      const detail = await fetchQuestionDetail(record.id);
      setEditing(detail);
      questionForm.resetFields();
      fillQuestionForm(detail);
      setDrawerOpen(true);
    } catch (_error) {
      message.error("获取题目详情失败");
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
        message.error("请至少添加一个测试用例");
        return;
      }
      if (
        values.type === "PROGRAMMING" &&
        testCases.some((item) => !item.expected_output.trim())
      ) {
        message.error("请填写每个测试用例的预期输出");
        return;
      }
      setSaving(true);
      const payload = buildPayload(values);
      await request(
        editing ? `/api/admin/questions/${editing.id}` : "/api/admin/questions",
        {
          method: editing ? "PUT" : "POST",
          data: payload,
        }
      );
      message.success(editing ? "题目已保存" : "题目已创建");
      setDrawerOpen(false);
      fetchQuestions();
    } catch (error) {
      if (errorCode(error) !== undefined) {
        message.error(editing ? "保存题目失败" : "创建题目失败");
      }
    } finally {
      setSaving(false);
    }
  };

  const deleteQuestion = (id: number) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除该题目吗？此操作不可撤销。',
      okText: '删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        try {
          await request(`/api/admin/questions/${id}`, {
            method: 'DELETE',
            skipErrorHandler: true,
          });
          message.success('题目已删除');
          fetchQuestions();
        } catch (error) {
          if (errorCode(error) === 40900 || errorCode(error) === 409) {
            message.error('该题已被试卷引用，不能删除');
            return;
          }
          message.error('删除题目失败');
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
    value: AdminTestCase[K]
  ) => {
    setTestCases((items) =>
      items.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [key]: value } : item
      )
    );
  };

  const removeTestCase = (index: number) => {
    setTestCases((items) =>
      items
        .filter((_, itemIndex) => itemIndex !== index)
        .map((item, itemIndex) => ({ ...item, sort_order: itemIndex }))
    );
  };

  const submitFilters = (values: FilterValues) => {
    setFilters((current) => ({
      ...current,
      keyword: values.keyword?.trim() || undefined,
    }));
    setPage(1);
  };

  const handleTableChange: TableProps<AdminQuestion>["onChange"] = (
    _pagination,
    tableFilters,
    tableSorter
  ) => {
    setFilters((current) => ({
      ...current,
      type: selectedTableFilter<QuestionType>(tableFilters.type),
      difficulty: selectedTableFilter<string>(tableFilters.difficulty),
      status: selectedTableFilter<QuestionStatus>(tableFilters.status),
    }));

    const sorter = Array.isArray(tableSorter) ? undefined : tableSorter;
    if (sorter?.field) {
      setSortState({
        field: sorter.field as QuestionSortField,
        order: sorter.order === "ascend" ? "asc" : "desc",
      });
    } else {
      setSortState((prev) => ({
        field: "updated_at",
        order: prev.order === "asc" ? "desc" : "asc",
      }));
    }
    setPage(1);
  };

  const columns: ColumnsType<AdminQuestion> = [
    {
      title: "题目",
      dataIndex: "title",
      key: "title",
      width: 460,
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
              {question.content?.text || "暂无题干"}
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "题型",
      dataIndex: "type",
      key: "type",
      width: 118,
      filters: filterOptions(QUESTION_TYPES),
      filteredValue: filters.type ? [filters.type] : null,
      filterMultiple: false,
      render: (type: QuestionType) => (
        <Tag className="question-type-tag">{typeLabel(type)}</Tag>
      ),
    },
    {
      title: "难度",
      dataIndex: "difficulty",
      key: "difficulty",
      width: 112,
      filters: filterOptions(DIFFICULTIES),
      filteredValue: filters.difficulty ? [filters.difficulty] : null,
      filterMultiple: false,
      render: (difficulty?: string) =>
        difficulty ? (
          <Tag
            className={`question-diff-tag ${
              DIFFICULTY_CLASS[difficulty] || ""
            }`}
          >
            {difficultyLabel(difficulty)}
          </Tag>
        ) : (
          <span className="question-muted">未设置</span>
        ),
    },
    {
      title: "状态",
      dataIndex: "status",
      key: "status",
      width: 118,
      filters: filterOptions(STATUSES),
      filteredValue: filters.status ? [filters.status] : null,
      filterMultiple: false,
      render: (status: QuestionStatus) => (
        <Badge
          className="question-status-badge"
          status={STATUS_BADGE[status]}
          text={statusLabel(status)}
        />
      ),
    },
    {
      title: "更新时间",
      dataIndex: "updated_at",
      key: "updated_at",
      width: 168,
      sorter: true,
      sortOrder:
        sortState.field === "updated_at"
          ? antdSortOrder(sortState.order)
          : null,
      render: (value: string) => (
        <span className="question-date">
          {dayjs(value).format("YYYY-MM-DD HH:mm")}
        </span>
      ),
    },
    {
      title: "操作",
      key: "actions",
      width: 70,
      fixed: "right" as const,
      render: (_: unknown, question: AdminQuestion) => (
        <div onClick={(e) => e.stopPropagation()}>
          <Dropdown
            menu={{
              items: [
                {
                  key: "delete",
                  label: "删除",
                  icon: <DeleteOutlined />,
                  danger: true,
                  onClick: () => deleteQuestion(question.id),
                },
              ],
            }}
            trigger={["click"]}
          >
            <Button type="text" size="small" icon={<MoreOutlined />} />
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
            label="选项"
            name="options_text"
            rules={[{ required: true, message: "请输入题目选项" }]}
          >
            <Input.TextArea
              rows={5}
              placeholder={"A. 选项一\nB. 选项二\nC. 选项三"}
            />
          </Form.Item>
          {questionType === "SINGLE_CHOICE" ? (
            <Form.Item
              label="正确答案"
              name="answer_single"
              rules={[{ required: true, message: "请选择正确答案" }]}
            >
              <Select options={answerOptions} placeholder="选择一个正确选项" />
            </Form.Item>
          ) : (
            <Form.Item
              label="正确答案"
              name="answer_multiple"
              rules={[{ required: true, message: "请选择正确答案" }]}
            >
              <Select
                mode="multiple"
                options={answerOptions}
                placeholder="选择多个正确选项"
              />
            </Form.Item>
          )}
        </>
      );
    }

    if (questionType === "TRUE_FALSE") {
      return (
        <Form.Item
          label="正确答案"
          name="answer_true_false"
          rules={[{ required: true, message: "请选择正确答案" }]}
        >
          <Select
            options={[
              { label: "正确", value: "true" },
              { label: "错误", value: "false" },
            ]}
          />
        </Form.Item>
      );
    }

    if (questionType === "FILL_BLANK") {
      return (
        <Form.Item
          label="填空答案"
          name="answer_blanks"
          rules={[{ required: true, message: "请输入填空答案" }]}
        >
          <Input.TextArea rows={3} placeholder="每行一个空的答案" />
        </Form.Item>
      );
    }

    if (questionType === "SHORT_ANSWER") {
      return (
        <Form.Item
          label="参考答案"
          name="answer_reference"
          rules={[{ required: true, message: "请输入参考答案" }]}
        >
          <Input.TextArea rows={5} placeholder="输入参考答案或评分要点" />
        </Form.Item>
      );
    }

    return null;
  };

  const renderProgrammingFields = () => {
    if (questionType !== "PROGRAMMING") {
      return null;
    }

    return (
      <>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label="语言"
              name="language"
              rules={[{ required: true, message: "请选择语言" }]}
            >
              <Select options={LANGUAGES} placeholder="选择语言" />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item
              label="时间限制(ms)"
              name="time_limit_ms"
              rules={[{ required: true, message: "请输入时间限制" }]}
            >
              <InputNumber min={1} max={30000} style={{ width: "100%" }} />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item
              label="内存限制(MB)"
              name="memory_limit_mb"
              rules={[{ required: true, message: "请输入内存限制" }]}
            >
              <InputNumber min={1} max={4096} style={{ width: "100%" }} />
            </Form.Item>
          </Col>
        </Row>
        <Form.Item label="代码模板" name="starter_code">
          <Input.TextArea
            rows={6}
            placeholder="可选，输入候选人初始代码"
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
              title={`测试用例 ${index + 1}`}
              extra={
                <Button
                  type="text"
                  danger
                  size="small"
                  onClick={() => removeTestCase(index)}
                >
                  删除
                </Button>
              }
            >
              <Row gutter={12}>
                <Col span={12}>
                  <Input.TextArea
                    value={item.input}
                    rows={3}
                    placeholder="标准输入"
                    onChange={(event) =>
                      updateTestCase(index, "input", event.target.value)
                    }
                  />
                </Col>
                <Col span={12}>
                  <Input.TextArea
                    value={item.expected_output}
                    rows={3}
                    placeholder="预期输出"
                    onChange={(event) =>
                      updateTestCase(
                        index,
                        "expected_output",
                        event.target.value
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
                    <span>示例</span>
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
                    <span>隐藏</span>
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
            添加测试用例
          </Button>
        </Space>
      </>
    );
  };

  return (
    <PageContainer
      title="题目"
      content={
        <p style={{ margin: 0, color: '#6b7280', fontSize: 14 }}>
          创建和管理考试题目、答案与编程用例，支持单选题、多选题、判断题、填空题、简答题和编程题。
        </p>
      }
    >
      <Card style={{ marginTop: 8 }}>
        <div className="flex justify-between" style={{ marginBottom: 16 }}>
          <Space size={12}>
            <Input
              ref={searchInputRef}
              allowClear
              prefix={<SearchOutlined style={{ color: '#1f2937', fontSize: 17 }} />}
              placeholder="搜索标题、题干或标签..."
              style={{ width: 320, height: 40, borderRadius: 8 }}
              onPressEnter={() => filterForm.submit()}
              className="question-search-input"
            />
            <Button type="default" onClick={() => filterForm.submit()}>
              搜索
            </Button>
          </Space>
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate} style={{ borderRadius: 8 }}>
            新建题目
          </Button>
        </div>
        <Table
            rowKey="id"
            columns={columns}
            dataSource={questions}
            loading={loading}
            scroll={{ x: 1080 }}
            locale={{
              emptyText: (
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description="暂无题目，先创建一道题"
                />
              ),
            }}
            pagination={false}
            onChange={handleTableChange}
            onRow={(question) => ({
              onClick: () =>
                history.push(`/content/library/questions/${question.id}`),
            })}
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
              onChange={(nextPage: number, nextPageSize: number) => {
                setPage(nextPageSize !== pageSize ? 1 : nextPage);
                setPageSize(nextPageSize);
              }}
            />
          </div>
        </Card>

      <Drawer
        title={editing ? "编辑题目" : "新建题目"}
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
              取消
            </Button>
            <Button type="primary" loading={saving} onClick={saveQuestion}>
              保存
            </Button>
          </Space>
        }
      >
        <Form form={questionForm} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="题型"
                name="type"
                rules={[{ required: true, message: "请选择题型" }]}
              >
                <Select options={QUESTION_TYPES} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="状态"
                name="status"
                rules={[{ required: true, message: "请选择状态" }]}
              >
                <Select options={STATUSES} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item
            label="标题"
            name="title"
            rules={[
              { required: true, whitespace: true, message: "请输入标题" },
            ]}
          >
            <Input placeholder="输入题目标题" />
          </Form.Item>
          <Form.Item
            label="题干"
            name="content_text"
            rules={[
              { required: true, whitespace: true, message: "请输入题干" },
            ]}
          >
            <Input.TextArea rows={5} placeholder="输入题干内容" />
          </Form.Item>
          <Form.Item label="难度" name="difficulty">
            <Select allowClear options={DIFFICULTIES} placeholder="选择难度" />
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
