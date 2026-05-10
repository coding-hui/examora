import {
  ArrowLeftOutlined,
  ClockCircleOutlined,
  DatabaseOutlined,
  DeleteOutlined,
  HolderOutlined,
  MinusCircleOutlined,
  PlusOutlined,
  SaveOutlined,
} from "@ant-design/icons";
import { PageContainer } from "@ant-design/pro-components";
import { history, request } from "@umijs/max";
import {
  App as AntdApp,
  Badge,
  Button,
  Checkbox,
  Col,
  Empty,
  Form,
  Input,
  InputNumber,
  Popconfirm,
  Radio,
  Row,
  Select,
  Space,
  Tag,
} from "antd";
import dayjs from "dayjs";
import React, { useEffect, useState } from "react";
import "./index.less";

/* ============================================================
   Types
   ============================================================ */

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
  id?: number;
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
  created_at: string;
  updated_at: string;
}

interface QuestionEnvelope {
  code: number;
  data: AdminQuestion;
}

/* ============================================================
   Constants
   ============================================================ */

const QUESTION_TYPES: Record<QuestionType, string> = {
  SINGLE_CHOICE: "单选题",
  MULTIPLE_CHOICE: "多选题",
  TRUE_FALSE: "判断题",
  FILL_BLANK: "填空题",
  SHORT_ANSWER: "简答题",
  PROGRAMMING: "编程题",
};

const DIFFICULTIES: Record<string, string> = {
  EASY: "简单",
  MEDIUM: "中等",
  HARD: "困难",
};

const DIFFICULTY_TAGS: Record<string, string> = {
  EASY: "qdiff-easy",
  MEDIUM: "qdiff-medium",
  HARD: "qdiff-hard",
};

const STATUS_LABELS: Record<QuestionStatus, string> = {
  DRAFT: "草稿",
  PUBLISHED: "已发布",
};

const DIFFICULTY_OPTIONS = [
  { label: "简单", value: "EASY" },
  { label: "中等", value: "MEDIUM" },
  { label: "困难", value: "HARD" },
];

const STATUS_OPTIONS = [
  { label: "草稿", value: "DRAFT" },
  { label: "已发布", value: "PUBLISHED" },
];

/* ============================================================
   Sub-components
   ============================================================ */

const SectionTitle: React.FC<{
  children: React.ReactNode;
  style?: React.CSSProperties;
}> = ({ children, style }) => (
  <h3 className="qdetail-section-title" style={style}>
    {children}
  </h3>
);

const setRowDragImage = (event: React.DragEvent<HTMLElement>) => {
  const source = event.currentTarget;
  const clone = source.cloneNode(true) as HTMLElement;
  const rect = source.getBoundingClientRect();

  clone.classList.add("qdetail-row-drag-image");
  clone.style.width = `${rect.width}px`;
  clone.style.position = "fixed";
  clone.style.top = "-10000px";
  clone.style.left = "-10000px";
  clone.style.pointerEvents = "none";
  document.body.appendChild(clone);

  event.dataTransfer.setDragImage(clone, 12, rect.height / 2);
  window.setTimeout(() => clone.remove(), 0);
};

const OptionAnswerControl: React.FC<{
  type: "SINGLE_CHOICE" | "MULTIPLE_CHOICE";
  optionIndex: number;
  onAnswerChange: () => void;
}> = ({ type, optionIndex, onAnswerChange }) => {
  const form = Form.useFormInstance();
  const optionKey = Form.useWatch(["content", "options", optionIndex, "key"], {
    form,
    preserve: true,
  }) as string | undefined;
  const choice = Form.useWatch(["answer", "choice"], {
    form,
    preserve: true,
  }) as string | undefined;
  const choices =
    (Form.useWatch(["answer", "choices"], {
      form,
      preserve: true,
    }) as string[] | undefined) || [];
  const answerKey = optionKey?.trim();

  if (type === "SINGLE_CHOICE") {
    return (
      <Radio
        checked={Boolean(answerKey) && choice === answerKey}
        disabled={!answerKey}
        aria-label={`设为正确答案 ${answerKey || optionIndex + 1}`}
        onChange={() => {
          if (answerKey) form.setFieldValue(["answer", "choice"], answerKey);
          onAnswerChange();
        }}
      />
    );
  }

  return (
    <Checkbox
      checked={answerKey ? choices.includes(answerKey) : false}
      disabled={!answerKey}
      aria-label={`切换正确答案 ${answerKey || optionIndex + 1}`}
      onChange={(event) => {
        if (!answerKey) return;
        const nextChoices = event.target.checked
          ? Array.from(new Set([...choices, answerKey]))
          : choices.filter((item) => item !== answerKey);
        form.setFieldValue(["answer", "choices"], nextChoices);
        onAnswerChange();
      }}
    />
  );
};

const OptionsEdit: React.FC<{
  type: "SINGLE_CHOICE" | "MULTIPLE_CHOICE";
  onAnswerChange: () => void;
}> = ({ type, onAnswerChange }) => {
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);

  return (
    <Form.List name={["content", "options"]}>
      {(fields, { add, remove, move }) => (
        <div className="qdetail-options-edit">
          {fields.map(({ key, name, ...restField }) => (
            <div
              key={key}
              className="qdetail-option-edit-row"
              draggable
              onDragStart={(event) => {
                const target = event.target as HTMLElement;
                if (!target.closest(".qdetail-edit-row-drag")) {
                  event.preventDefault();
                  return;
                }
                event.dataTransfer.effectAllowed = "move";
                event.dataTransfer.setData("text/plain", String(name));
                setRowDragImage(event);
                setDraggingIndex(name as number);
              }}
              onDragEnd={() => setDraggingIndex(null)}
              onDragOver={(event) => event.preventDefault()}
              onDrop={() => {
                if (draggingIndex === null || draggingIndex === name) return;
                move(draggingIndex, name);
                setDraggingIndex(null);
              }}
            >
              <span className="qdetail-edit-row-index">
                #{(name as number) + 1}
              </span>
              <OptionAnswerControl
                type={type}
                optionIndex={name as number}
                onAnswerChange={onAnswerChange}
              />
              <Form.Item
                {...restField}
                name={[name, "key"]}
                rules={[{ required: true, message: "" }]}
                style={{ marginBottom: 0 }}
              >
                <Input placeholder="A" className="qdetail-option-edit-key" />
              </Form.Item>
              <Form.Item
                {...restField}
                name={[name, "text"]}
                rules={[{ required: true, message: "请输入选项内容" }]}
                style={{ marginBottom: 0, flex: 1 }}
              >
                <Input
                  placeholder="选项内容"
                  className="qdetail-option-edit-text"
                />
              </Form.Item>
              <button
                type="button"
                className="qdetail-edit-row-drag"
                aria-label={`拖拽排序选项 ${(name as number) + 1}`}
              >
                <HolderOutlined />
              </button>
              <Button
                type="text"
                danger
                size="small"
                icon={<MinusCircleOutlined />}
                aria-label={`删除选项 ${(name as number) + 1}`}
                onClick={() => remove(name)}
                className="qdetail-option-edit-del"
              />
            </div>
          ))}
          {fields.length < 8 && (
            <Button
              type="dashed"
              onClick={() => add()}
              block
              icon={<PlusOutlined />}
              size="small"
              className="qdetail-option-edit-add"
            >
              添加选项
            </Button>
          )}
        </div>
      )}
    </Form.List>
  );
};

const TestCasePreview: React.FC<{
  optionIndex: number;
  fieldName: "input" | "expected_output";
  fallback: string;
}> = ({ optionIndex, fieldName, fallback }) => {
  const form = Form.useFormInstance();
  const value = Form.useWatch(["test_cases", optionIndex, fieldName], {
    form,
    preserve: true,
  }) as string | undefined;
  const text = value?.trim();

  return <span className="qdetail-testcase-preview">{text || fallback}</span>;
};

const TestCasesEdit: React.FC = () => {
  const form = Form.useFormInstance();
  const [activeCase, setActiveCase] = useState<number | null>(null);
  const [advancedCase, setAdvancedCase] = useState<number | null>(null);

  const deleteCase = (index: number, remove: (index: number) => void) => {
    remove(index);
    setActiveCase((current) => (current === index ? null : current));
    setAdvancedCase((current) => (current === index ? null : current));
  };

  return (
    <Form.List name="test_cases">
      {(fields, { add, remove }) => (
        <div className="qdetail-testcase-list">
          <div className="qdetail-testcase-toolbar">
            <span className="qdetail-testcase-count">
              共 {fields.length} 个用例
            </span>
            <Button
              type="dashed"
              onClick={() => {
                add({
                  input: "",
                  expected_output: "",
                  time_limit_ms: form.getFieldValue("time_limit_ms") || 2000,
                  memory_limit_mb: form.getFieldValue("memory_limit_mb") || 256,
                  is_sample: fields.length === 0,
                  is_hidden: fields.length !== 0,
                  sort_order: fields.length,
                });
                setActiveCase(fields.length);
                setAdvancedCase(null);
              }}
              icon={<PlusOutlined />}
              size="small"
            >
              添加用例
            </Button>
          </div>
          {fields.map(({ key, name, ...restField }) => (
            <div
              key={key}
              className={`qdetail-testcase-item ${
                activeCase === name ? "qdetail-testcase-item-active" : ""
              }`}
            >
              <button
                type="button"
                className="qdetail-testcase-summary"
                onClick={() =>
                  setActiveCase((current) => (current === name ? null : name))
                }
              >
                <span className="qdetail-testcase-title">
                  用例 {(name as number) + 1}
                </span>
                <TestCasePreview
                  optionIndex={name as number}
                  fieldName="input"
                  fallback="无输入"
                />
                <TestCasePreview
                  optionIndex={name as number}
                  fieldName="expected_output"
                  fallback="未填写预期输出"
                />
              </button>
              <div className="qdetail-testcase-actions">
                <Space size={12} wrap>
                  <Form.Item
                    {...restField}
                    name={[name, "is_sample"]}
                    valuePropName="checked"
                    noStyle
                  >
                    <Checkbox>示例</Checkbox>
                  </Form.Item>
                  <Form.Item
                    {...restField}
                    name={[name, "is_hidden"]}
                    valuePropName="checked"
                    noStyle
                  >
                    <Checkbox>隐藏</Checkbox>
                  </Form.Item>
                </Space>
                <Button
                  type="text"
                  danger
                  size="small"
                  icon={<MinusCircleOutlined />}
                  aria-label={`删除测试用例 ${(name as number) + 1}`}
                  onClick={() => deleteCase(name as number, remove)}
                  className="qdetail-testcase-delete"
                />
              </div>
              {activeCase === name && (
                <div className="qdetail-testcase-fields">
                  <Row gutter={[12, 8]}>
                    <Col xs={24} md={12}>
                      <Form.Item
                        {...restField}
                        name={[name, "input"]}
                        label="输入"
                        style={{ marginBottom: 0 }}
                      >
                        <Input.TextArea rows={2} placeholder="测试输入" />
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={12}>
                      <Form.Item
                        {...restField}
                        name={[name, "expected_output"]}
                        label="预期输出"
                        style={{ marginBottom: 0 }}
                      >
                        <Input.TextArea rows={2} placeholder="预期输出" />
                      </Form.Item>
                    </Col>
                  </Row>
                  <button
                    type="button"
                    className="qdetail-testcase-advanced-toggle"
                    onClick={() =>
                      setAdvancedCase((current) =>
                        current === name ? null : name,
                      )
                    }
                  >
                    {advancedCase === name ? "收起高级设置" : "高级设置"}
                  </button>
                  {advancedCase === name && (
                    <div className="qdetail-testcase-advanced">
                      <Row gutter={[12, 8]}>
                        <Col xs={12} sm={6}>
                          <Form.Item
                            {...restField}
                            name={[name, "time_limit_ms"]}
                            label="时间限制"
                            style={{ marginBottom: 0 }}
                          >
                            <InputNumber
                              min={0}
                              style={{ width: "100%" }}
                              addonAfter="ms"
                            />
                          </Form.Item>
                        </Col>
                        <Col xs={12} sm={6}>
                          <Form.Item
                            {...restField}
                            name={[name, "memory_limit_mb"]}
                            label="内存限制"
                            style={{ marginBottom: 0 }}
                          >
                            <InputNumber
                              min={0}
                              style={{ width: "100%" }}
                              addonAfter="MB"
                            />
                          </Form.Item>
                        </Col>
                      </Row>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </Form.List>
  );
};

const TrueFalseAnswerEdit: React.FC = () => (
  <Form.Item name={["answer", "correct"]} className="qdetail-answer-field">
    <Radio.Group className="qdetail-truefalse-edit">
      <Radio value={true}>正确</Radio>
      <Radio value={false}>错误</Radio>
    </Radio.Group>
  </Form.Item>
);

const FillBlankAnswerEdit: React.FC = () => <FillBlankAnswerList />;

const FillBlankAnswerList: React.FC = () => {
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);

  return (
    <Form.List name={["answer", "blanks"]}>
      {(fields, { add, remove, move }) => (
        <div className="qdetail-blank-edit">
          {fields.map(({ key, name, ...restField }) => (
            <div
              key={key}
              className="qdetail-blank-edit-row"
              draggable
              onDragStart={(event) => {
                const target = event.target as HTMLElement;
                if (!target.closest(".qdetail-edit-row-drag")) {
                  event.preventDefault();
                  return;
                }
                event.dataTransfer.effectAllowed = "move";
                event.dataTransfer.setData("text/plain", String(name));
                setRowDragImage(event);
                setDraggingIndex(name as number);
              }}
              onDragEnd={() => setDraggingIndex(null)}
              onDragOver={(event) => event.preventDefault()}
              onDrop={() => {
                if (draggingIndex === null || draggingIndex === name) return;
                move(draggingIndex, name);
                setDraggingIndex(null);
              }}
            >
              <span className="qdetail-edit-row-index">
                #{(name as number) + 1}
              </span>
              <Form.Item
                {...restField}
                name={[name]}
                rules={[{ required: true, message: "请输入答案内容" }]}
                style={{ marginBottom: 0, flex: 1 }}
              >
                <Input
                  placeholder="答案内容"
                  className="qdetail-blank-edit-input"
                />
              </Form.Item>
              <button
                type="button"
                className="qdetail-edit-row-drag"
                aria-label={`拖拽排序第 ${(name as number) + 1} 空答案`}
              >
                <HolderOutlined />
              </button>
              <Button
                type="text"
                danger
                size="small"
                icon={<MinusCircleOutlined />}
                aria-label={`删除第 ${(name as number) + 1} 空答案`}
                onClick={() => remove(name)}
                className="qdetail-blank-edit-del"
              />
            </div>
          ))}
          <Button
            type="dashed"
            onClick={() => add()}
            icon={<PlusOutlined />}
            size="small"
            block
            className="qdetail-blank-edit-add"
          >
            添加填空
          </Button>
        </div>
      )}
    </Form.List>
  );
};

const ShortAnswerEdit: React.FC = () => (
  <Form.Item name={["answer", "reference"]} className="qdetail-answer-field">
    <Input.TextArea
      rows={4}
      placeholder="请输入参考答案"
      className="qdetail-reference-textarea"
    />
  </Form.Item>
);

/* ============================================================
   Main Component
   ============================================================ */

const QuestionsDetailContent: React.FC = () => {
  const { message } = AntdApp.useApp();
  const [form] = Form.useForm();
  const questionId = history.location.pathname.split("/").filter(Boolean).pop();
  const [question, setQuestion] = useState<AdminQuestion | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  const fetchQuestion = async () => {
    if (!questionId) return;
    setLoading(true);
    try {
      const response = await request<QuestionEnvelope>(
        `/api/admin/questions/${questionId}`,
      );
      setQuestion(response.data);
    } catch (_error) {
      message.error("获取题目详情失败");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestion();
  }, [questionId]);

  useEffect(() => {
    if (question) {
      form.setFieldsValue({
        title: question.title,
        difficulty: question.difficulty,
        status: question.status,
        time_limit_ms: question.time_limit_ms,
        memory_limit_mb: question.memory_limit_mb,
        content: question.content,
        answer: question.answer,
        language: question.language,
        starter_code: question.starter_code,
        test_cases: question.test_cases || [],
      });
      setIsDirty(false);
    }
  }, [question, form]);

  const handleValuesChange = () => {
    setIsDirty(true);
  };

  const saveQuestion = async () => {
    if (!question) return;
    try {
      await form.validateFields();
      const values = form.getFieldsValue(true);
      const payload = {
        ...values,
        type: question.type,
      };
      if (question.type !== "PROGRAMMING") {
        delete payload.time_limit_ms;
        delete payload.memory_limit_mb;
        delete payload.language;
        delete payload.starter_code;
        delete payload.test_cases;
      }
      setSaving(true);
      await request(`/api/admin/questions/${question.id}`, {
        method: "PUT",
        data: payload,
      });
      message.success("保存成功");
      setIsDirty(false);
      fetchQuestion();
    } catch (error) {
      if ((error as { errorFields?: unknown[] }).errorFields) return;
      message.error("保存失败");
    } finally {
      setSaving(false);
    }
  };

  const cancelEdit = () => {
    if (question) {
      form.setFieldsValue({
        title: question.title,
        difficulty: question.difficulty,
        status: question.status,
        time_limit_ms: question.time_limit_ms,
        memory_limit_mb: question.memory_limit_mb,
        content: question.content,
        answer: question.answer,
        language: question.language,
        starter_code: question.starter_code,
        test_cases: question.test_cases || [],
      });
    }
    setIsDirty(false);
  };

  const deleteQuestion = async () => {
    if (!question) return;
    try {
      await request(`/api/admin/questions/${question.id}`, {
        method: "DELETE",
        skipErrorHandler: true,
      });
      message.success("题目已删除");
      history.push("/content/library/questions");
    } catch (error) {
      const maybe = error as {
        info?: { errorCode?: number };
        response?: { status?: number };
      };
      const code = maybe.info?.errorCode || maybe.response?.status;
      message.error(
        code === 40900 || code === 409
          ? "该题已被试卷引用，不能删除"
          : "删除题目失败",
      );
    }
  };

  const pageTitle = loading ? "加载中..." : question?.title || "题目详情";
  const isProgramming = question?.type === "PROGRAMMING";

  const metaInfoBar = question ? (
    <Space wrap size={[8, 8]} className="qdetail-meta-row">
      <code className="qdetail-id-code">#{question.id}</code>
      <Tag className="question-type-tag">{QUESTION_TYPES[question.type]}</Tag>
      {question.difficulty && (
        <span
          className={`question-diff-tag ${DIFFICULTY_TAGS[question.difficulty] || ""}`}
        >
          {DIFFICULTIES[question.difficulty] || question.difficulty}
        </span>
      )}
      <Badge
        status={question.status === "PUBLISHED" ? "success" : "default"}
        text={STATUS_LABELS[question.status]}
      />
      {isProgramming && (
        <>
          <span className="qdetail-meta-badge">
            <ClockCircleOutlined />
            {question.time_limit_ms}ms
          </span>
          <span className="qdetail-meta-badge">
            <DatabaseOutlined />
            {question.memory_limit_mb}MB
          </span>
        </>
      )}
      <span className="qdetail-meta-badge">
        更新于 {dayjs(question.updated_at).format("YYYY-MM-DD HH:mm")}
      </span>
    </Space>
  ) : null;

  return (
    <PageContainer
      title={false}
      breadcrumbRender={false}
      loading={loading}
      className="qdetail-page"
    >
      {!loading && !question ? (
        <div className="qdetail-wrap">
          <Empty description="题目不存在" />
        </div>
      ) : question ? (
        <>
          <div className="qdetail-hero">
            <div className="qdetail-hero-inner">
              <div className="qdetail-hero-main">
                <Button
                  type="text"
                  icon={<ArrowLeftOutlined />}
                  aria-label="返回题目列表"
                  className="qdetail-back"
                  onClick={() => history.push("/content/library/questions")}
                />
                <div className="qdetail-hero-title-block">
                  <h1 className="qdetail-hero-title">{pageTitle}</h1>
                  {metaInfoBar}
                </div>
              </div>
              <Popconfirm
                title="删除题目"
                description="确定删除该题目？"
                okText="删除"
                cancelText="取消"
                okButtonProps={{ danger: true }}
                onConfirm={deleteQuestion}
              >
                <Button danger icon={<DeleteOutlined />} aria-label="删除题目">
                  删除
                </Button>
              </Popconfirm>
            </div>
          </div>

          <div className="qdetail-wrap">
            <div className="qdetail-paper">
              <Form
                form={form}
                layout="vertical"
                className="qdetail-form"
                onValuesChange={handleValuesChange}
              >
                {/* ===== Basic Info ===== */}
                <div className="qdetail-section">
                  <SectionTitle>基本信息</SectionTitle>
                  <Form.Item
                    name="title"
                    label="标题"
                    rules={[{ required: true, message: "请输入题目标题" }]}
                  >
                    <Input
                      placeholder="请输入题目标题"
                      className="qdetail-title-input"
                    />
                  </Form.Item>
                  <Row gutter={[12, 8]}>
                    <Col xs={12} sm={8} md={6} lg={4}>
                      <Form.Item
                        name="difficulty"
                        label="难度"
                        style={{ marginBottom: 0 }}
                      >
                        <Select
                          placeholder="难度"
                          options={DIFFICULTY_OPTIONS}
                          size="small"
                        />
                      </Form.Item>
                    </Col>
                    <Col xs={12} sm={8} md={6} lg={4}>
                      <Form.Item
                        name="status"
                        label="状态"
                        style={{ marginBottom: 0 }}
                      >
                        <Select
                          placeholder="状态"
                          options={STATUS_OPTIONS}
                          size="small"
                        />
                      </Form.Item>
                    </Col>
                  </Row>
                </div>

                {/* ===== Question Body ===== */}
                <div className="qdetail-section">
                  <SectionTitle>题干</SectionTitle>
                  <Form.Item
                    name={["content", "text"]}
                    rules={[{ required: true, message: "请输入题干" }]}
                    style={{ marginBottom: 0 }}
                  >
                    <Input.TextArea
                      rows={4}
                      placeholder="请输入题干内容"
                      className="qdetail-body-textarea"
                    />
                  </Form.Item>
                </div>

                {/* ===== Options ===== */}
                {(question.type === "SINGLE_CHOICE" ||
                  question.type === "MULTIPLE_CHOICE") && (
                  <div className="qdetail-section">
                    <SectionTitle>选项</SectionTitle>
                    <OptionsEdit
                      type={question.type}
                      onAnswerChange={handleValuesChange}
                    />
                  </div>
                )}

                {/* ===== Answer ===== */}
                {question.type !== "SINGLE_CHOICE" &&
                  question.type !== "MULTIPLE_CHOICE" && (
                    <div className="qdetail-section">
                      <SectionTitle>参考答案</SectionTitle>
                      {question.type === "TRUE_FALSE" && (
                        <TrueFalseAnswerEdit />
                      )}
                      {question.type === "FILL_BLANK" && (
                        <FillBlankAnswerEdit />
                      )}
                      {question.type === "SHORT_ANSWER" && <ShortAnswerEdit />}
                      {question.type === "PROGRAMMING" && (
                        <div className="qdetail-answer-hint">
                          编程题无固定标准答案，以测试用例判分为准。
                        </div>
                      )}
                    </div>
                  )}

                {/* ===== Programming ===== */}
                {question.type === "PROGRAMMING" && (
                  <div className="qdetail-section">
                    <SectionTitle>编程配置</SectionTitle>
                    <Row className="qdetail-program-config" gutter={[12, 8]}>
                      <Col xs={24} md={10} lg={8}>
                        <Form.Item
                          name="language"
                          label="语言"
                          style={{ marginBottom: 0 }}
                        >
                          <Input placeholder="如 Go" />
                        </Form.Item>
                      </Col>
                      <Col xs={12} md={7} lg={5}>
                        <Form.Item
                          name="time_limit_ms"
                          label="时间限制"
                          style={{ marginBottom: 0 }}
                        >
                          <InputNumber
                            min={0}
                            style={{ width: "100%" }}
                            addonAfter="ms"
                          />
                        </Form.Item>
                      </Col>
                      <Col xs={12} md={7} lg={5}>
                        <Form.Item
                          name="memory_limit_mb"
                          label="内存限制"
                          style={{ marginBottom: 0 }}
                        >
                          <InputNumber
                            min={0}
                            style={{ width: "100%" }}
                            addonAfter="MB"
                          />
                        </Form.Item>
                      </Col>
                    </Row>

                    <SectionTitle style={{ marginTop: 20 }}>
                      代码模板
                    </SectionTitle>
                    <Form.Item name="starter_code" style={{ marginBottom: 0 }}>
                      <Input.TextArea
                        rows={6}
                        placeholder="请输入代码模板"
                        className="qdetail-code-textarea"
                      />
                    </Form.Item>

                    <SectionTitle style={{ marginTop: 20 }}>
                      测试用例
                    </SectionTitle>
                    <TestCasesEdit />
                  </div>
                )}
              </Form>

              {/* ===== Footer meta (inside paper) ===== */}
              <div className="qdetail-footer-meta-bar">
                <span className="qdetail-footer-meta">
                  创建于 {dayjs(question.created_at).format("YYYY-MM-DD HH:mm")}
                  &nbsp;·&nbsp; 更新于{" "}
                  {dayjs(question.updated_at).format("YYYY-MM-DD HH:mm")}
                </span>
              </div>
            </div>

            {/* ===== Sticky actions (outside paper, fixed to bottom) ===== */}
            {isDirty && (
              <div className="qdetail-sticky-footer">
                <span className="qdetail-dirty-text">有未保存修改</span>
                <Space>
                  <Button
                    type="primary"
                    icon={<SaveOutlined />}
                    loading={saving}
                    onClick={saveQuestion}
                  >
                    保存
                  </Button>
                  <Button onClick={cancelEdit}>还原修改</Button>
                </Space>
              </div>
            )}
          </div>
        </>
      ) : null}
    </PageContainer>
  );
};

const QuestionsDetail: React.FC = () => (
  <AntdApp>
    <QuestionsDetailContent />
  </AntdApp>
);

export default QuestionsDetail;
