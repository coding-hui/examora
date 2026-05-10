import {
  CheckOutlined,
  ClockCircleOutlined,
  CodeOutlined,
  DatabaseOutlined,
  DeleteOutlined,
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
  Card,
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

const OptionsEdit: React.FC = () => (
  <Form.List name={["content", "options"]}>
    {(fields, { add, remove }) => (
      <div className="qdetail-options-edit">
        {fields.map(({ key, name, ...restField }) => (
          <div key={key} className="qdetail-option-edit-row">
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
            <Button
              type="text"
              danger
              size="small"
              icon={<MinusCircleOutlined />}
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

const TestCasesEdit: React.FC = () => (
  <Form.List name="test_cases">
    {(fields, { add, remove }) => (
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {fields.map(({ key, name, ...restField }) => (
          <Card
            key={key}
            size="small"
            title={`用例 ${(name as number) + 1}`}
            className="qdetail-testcase-edit-card"
            styles={{ body: { padding: "10px 14px" } }}
            extra={
              <Button
                type="text"
                danger
                size="small"
                onClick={() => remove(name)}
              >
                删除
              </Button>
            }
          >
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 8,
                width: "100%",
              }}
            >
              <Row gutter={[12, 0]}>
                <Col span={12}>
                  <Form.Item
                    {...restField}
                    name={[name, "input"]}
                    label="输入"
                    style={{ marginBottom: 0 }}
                  >
                    <Input.TextArea rows={2} placeholder="测试输入" />
                  </Form.Item>
                </Col>
                <Col span={12}>
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
              <Row gutter={[12, 0]} style={{ marginTop: 4 }}>
                <Col span={6}>
                  <Form.Item
                    {...restField}
                    name={[name, "time_limit_ms"]}
                    style={{ marginBottom: 0 }}
                  >
                    <InputNumber
                      min={0}
                      style={{ width: "100%" }}
                      placeholder="时间(ms)"
                    />
                  </Form.Item>
                </Col>
                <Col span={6}>
                  <Form.Item
                    {...restField}
                    name={[name, "memory_limit_mb"]}
                    style={{ marginBottom: 0 }}
                  >
                    <InputNumber
                      min={0}
                      style={{ width: "100%" }}
                      placeholder="内存(MB)"
                    />
                  </Form.Item>
                </Col>
                <Col span={6}>
                  <Form.Item
                    {...restField}
                    name={[name, "is_sample"]}
                    valuePropName="checked"
                    style={{ marginBottom: 0, marginTop: 30 }}
                  >
                    <Checkbox>示例</Checkbox>
                  </Form.Item>
                </Col>
                <Col span={6}>
                  <Form.Item
                    {...restField}
                    name={[name, "is_hidden"]}
                    valuePropName="checked"
                    style={{ marginBottom: 0, marginTop: 30 }}
                  >
                    <Checkbox>隐藏</Checkbox>
                  </Form.Item>
                </Col>
              </Row>
            </div>
          </Card>
        ))}
        <Button
          type="dashed"
          onClick={() => add()}
          block
          icon={<PlusOutlined />}
          size="small"
        >
          添加测试用例
        </Button>
      </div>
    )}
  </Form.List>
);

const SingleChoiceAnswerEdit: React.FC = () => {
  const form = Form.useFormInstance();
  const options = Form.useWatch(["content", "options"], form) as
    | QuestionOption[]
    | undefined;
  return (
    <Form.Item name={["answer", "choice"]}>
      <Radio.Group>
        <div className="qdetail-answer-options">
          {(options || []).map((opt) => (
            <Radio
              key={opt.key}
              value={opt.key}
              className="qdetail-answer-radio"
            >
              <span className="qdetail-answer-key">{opt.key}</span>
              <span className="qdetail-answer-text">{opt.text}</span>
            </Radio>
          ))}
        </div>
      </Radio.Group>
    </Form.Item>
  );
};

const MultipleChoiceAnswerEdit: React.FC = () => {
  const form = Form.useFormInstance();
  const options = Form.useWatch(["content", "options"], form) as
    | QuestionOption[]
    | undefined;
  return (
    <Form.Item name={["answer", "choices"]}>
      <Checkbox.Group>
        <div className="qdetail-answer-options">
          {(options || []).map((opt) => (
            <Checkbox
              key={opt.key}
              value={opt.key}
              className="qdetail-answer-checkbox"
            >
              <span className="qdetail-answer-key">{opt.key}</span>
              <span className="qdetail-answer-text">{opt.text}</span>
            </Checkbox>
          ))}
        </div>
      </Checkbox.Group>
    </Form.Item>
  );
};

const TrueFalseAnswerEdit: React.FC = () => (
  <Form.Item name={["answer", "correct"]}>
    <Radio.Group>
      <Radio value={true}>正确</Radio>
      <Radio value={false}>错误</Radio>
    </Radio.Group>
  </Form.Item>
);

const FillBlankAnswerEdit: React.FC = () => (
  <Form.List name={["answer", "blanks"]}>
    {(fields, { add, remove }) => (
      <div className="qdetail-blank-edit">
        {fields.map(({ key, name, ...restField }) => (
          <div key={key} className="qdetail-blank-edit-row">
            <span className="qdetail-blank-edit-label">
              第{(name as number) + 1}空
            </span>
            <Form.Item {...restField} name={[name]} noStyle>
              <Input
                placeholder="答案内容"
                className="qdetail-blank-edit-input"
              />
            </Form.Item>
            <Button
              type="text"
              danger
              size="small"
              icon={<MinusCircleOutlined />}
              onClick={() => remove(name)}
            />
          </div>
        ))}
        <Button
          type="dashed"
          onClick={() => add()}
          icon={<PlusOutlined />}
          size="small"
        >
          添加填空
        </Button>
      </div>
    )}
  </Form.List>
);

const ShortAnswerEdit: React.FC = () => (
  <Form.Item name={["answer", "reference"]}>
    <Input.TextArea rows={4} placeholder="请输入参考答案" />
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
      const values = await form.validateFields();
      setSaving(true);
      await request(`/api/admin/questions/${question.id}`, {
        method: "PUT",
        data: {
          ...values,
          type: question.type,
        },
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

  const metaInfoBar = question ? (
    <Space wrap size={8}>
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
      <span className="qdetail-meta-badge">
        <ClockCircleOutlined />
        {question.time_limit_ms}ms
      </span>
      <span className="qdetail-meta-badge">
        <DatabaseOutlined />
        {question.memory_limit_mb}MB
      </span>
    </Space>
  ) : null;

  return (
    <PageContainer
      title={pageTitle}
      breadcrumbRender={false}
      loading={loading}
      header={{
        onBack: () => history.push("/content/library/questions"),
      }}
      extra={
        question ? (
          <Popconfirm
            title="删除题目"
            description="确定删除该题目？"
            okText="删除"
            cancelText="取消"
            okButtonProps={{ danger: true }}
            onConfirm={deleteQuestion}
          >
            <Button danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        ) : null
      }
      content={metaInfoBar}
    >
      {!loading && !question ? (
        <Empty description="题目不存在" />
      ) : question ? (
        <div className="qdetail-wrap">
          <div className="qdetail-paper">
            <Form
              form={form}
              layout="vertical"
              className="qdetail-form"
              onValuesChange={handleValuesChange}
            >
              {/* ===== Title ===== */}
              <div className="qdetail-section">
                <Form.Item
                  name="title"
                  rules={[{ required: true, message: "请输入题目标题" }]}
                  style={{ marginBottom: 0 }}
                >
                  <Input
                    placeholder="请输入题目标题"
                    className="qdetail-title-input"
                  />
                </Form.Item>
              </div>

              {/* ===== Basic Info ===== */}
              <div className="qdetail-section">
                <SectionTitle>基本信息</SectionTitle>
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
                  <Col xs={12} sm={8} md={6} lg={4}>
                    <Form.Item
                      name="time_limit_ms"
                      label="时间限制"
                      style={{ marginBottom: 0 }}
                    >
                      <InputNumber
                        min={0}
                        style={{ width: "100%" }}
                        placeholder="ms"
                        size="small"
                      />
                    </Form.Item>
                  </Col>
                  <Col xs={12} sm={8} md={6} lg={4}>
                    <Form.Item
                      name="memory_limit_mb"
                      label="内存限制"
                      style={{ marginBottom: 0 }}
                    >
                      <InputNumber
                        min={0}
                        style={{ width: "100%" }}
                        placeholder="MB"
                        size="small"
                      />
                    </Form.Item>
                  </Col>
                  {question.type === "PROGRAMMING" && (
                    <Col xs={12} sm={8} md={6} lg={4}>
                      <Form.Item
                        name="language"
                        label="语言"
                        style={{ marginBottom: 0 }}
                      >
                        <Input placeholder="如 Go" size="small" />
                      </Form.Item>
                    </Col>
                  )}
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
                  <OptionsEdit />
                </div>
              )}

              {/* ===== Answer ===== */}
              <div className="qdetail-section">
                <SectionTitle>参考答案</SectionTitle>
                {question.type === "SINGLE_CHOICE" && (
                  <SingleChoiceAnswerEdit />
                )}
                {question.type === "MULTIPLE_CHOICE" && (
                  <MultipleChoiceAnswerEdit />
                )}
                {question.type === "TRUE_FALSE" && <TrueFalseAnswerEdit />}
                {question.type === "FILL_BLANK" && <FillBlankAnswerEdit />}
                {question.type === "SHORT_ANSWER" && <ShortAnswerEdit />}
                {question.type === "PROGRAMMING" && (
                  <div className="qdetail-answer-hint">
                    编程题无固定标准答案，以测试用例判分为准。
                  </div>
                )}
              </div>

              {/* ===== Programming ===== */}
              {question.type === "PROGRAMMING" && (
                <div className="qdetail-section">
                  <SectionTitle>代码模板</SectionTitle>
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
              <Space>
                <Button
                  type="primary"
                  icon={<SaveOutlined />}
                  loading={saving}
                  onClick={saveQuestion}
                >
                  保存
                </Button>
                <Button onClick={cancelEdit}>取消</Button>
              </Space>
            </div>
          )}
        </div>
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
