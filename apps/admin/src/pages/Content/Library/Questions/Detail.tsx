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
import { history, request, useIntl } from "@umijs/max";
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
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import dayjs from "dayjs";
import React, { useEffect, useMemo, useState } from "react";
import type { AdminQuestion, QuestionType } from "@examora/types";
import {
  DIFFICULTY_LABELS,
  DIFFICULTY_OPTIONS,
  QUESTION_STATUS_LABELS,
  QUESTION_STATUS_OPTIONS,
  QUESTION_TYPE_LABELS,
  QUESTION_TYPE_OPTIONS,
} from "@examora/types";
import "./index.less";

interface QuestionOption {
  key: string;
  text: string;
}

interface QuestionEnvelope {
  code: number;
  data: AdminQuestion;
}

const DIFFICULTY_TAGS: Record<string, string> = {
  EASY: "qdiff-easy",
  MEDIUM: "qdiff-medium",
  HARD: "qdiff-hard",
};

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

interface SortableItemWrapperProps {
  id: string;
  children: (handlers: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    listeners: any;
    setActivatorNodeRef: (node: HTMLElement | null) => void;
  }) => React.ReactNode;
}

const SortableItemWrapper: React.FC<SortableItemWrapperProps> = ({
  id,
  children,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
  } = useSortable({ id });

  const style: React.CSSProperties = {
    transform: CSS.Translate.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      {children({ listeners, setActivatorNodeRef })}
    </div>
  );
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
  const intl = useIntl();
  const form = Form.useFormInstance();
  const options: QuestionOption[] =
    Form.useWatch(["content", "options"], form) || [];
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );

  return (
    <Form.List name={["content", "options"]}>
      {(fields, { add, remove, move }) => {
        const items = fields.map((f) => String(f.key));

        const handleDragStart = (event: DragStartEvent) =>
          setActiveId(event.active.id as string);
        const handleDragEnd = (event: DragEndEvent) => {
          setActiveId(null);
          const { active, over } = event;
          if (over && active.id !== over.id) {
            const oldIndex = items.indexOf(active.id as string);
            const newIndex = items.indexOf(over.id as string);
            move(oldIndex, newIndex);
            // Reassign sequential keys (A-H) after reorder
            setTimeout(() => {
              const reordered: QuestionOption[] =
                form.getFieldValue(["content", "options"]) || [];
              const SEQ = "ABCDEFGH";
              // Capture answer by matching old key → text
              const choice = form.getFieldValue(["answer", "choice"]) as
                | string
                | undefined;
              const choices =
                (form.getFieldValue(["answer", "choices"]) as
                  | string[]
                  | undefined) || [];
              const selectedText = choice
                ? reordered.find((o) => o.key === choice)?.text
                : undefined;
              const selectedTexts =
                type === "MULTIPLE_CHOICE"
                  ? choices
                      .map((c) => reordered.find((o) => o.key === c)?.text)
                      .filter(Boolean)
                  : [];
              // Reassign keys
              reordered.forEach((_, i) => {
                form.setFieldValue(["content", "options", i, "key"], SEQ[i]);
              });
              // Restore answer by matching text → index → new key
              if (selectedText) {
                const idx = reordered.findIndex((o) => o.text === selectedText);
                if (idx >= 0)
                  form.setFieldValue(["answer", "choice"], SEQ[idx]);
              }
              if (selectedTexts.length > 0) {
                const newKeys = selectedTexts
                  .map((t) => {
                    const idx = reordered.findIndex((o) => o.text === t);
                    return idx >= 0 ? SEQ[idx] : "";
                  })
                  .filter(Boolean);
                form.setFieldValue(["answer", "choices"], newKeys);
              }
            }, 0);
          }
        };

        const activeIndex = activeId ? items.indexOf(activeId) : -1;

        return (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            modifiers={[restrictToVerticalAxis]}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={items}
              strategy={verticalListSortingStrategy}
            >
              <div className="qdetail-options-edit">
                {fields.map(({ key, name, ...restField }) => (
                  <SortableItemWrapper key={key} id={String(key)}>
                    {({ listeners, setActivatorNodeRef }) => (
                      <div className="qdetail-option-edit-row">
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
                          <Input
                            placeholder="A"
                            className="qdetail-option-edit-key"
                          />
                        </Form.Item>
                        <Form.Item
                          {...restField}
                          name={[name, "text"]}
                          rules={[
                            {
                              required: true,
                              message: intl.formatMessage({
                                id: "pages.questions.form.options.optionRequired",
                                defaultMessage: "请输入选项内容",
                              }),
                            },
                          ]}
                          style={{ marginBottom: 0, flex: 1 }}
                        >
                          <Input
                            placeholder={intl.formatMessage({
                              id: "pages.questions.form.options.optionPlaceholder",
                              defaultMessage: "选项内容",
                            })}
                            className="qdetail-option-edit-text"
                          />
                        </Form.Item>
                        <button
                          type="button"
                          className="qdetail-edit-row-drag"
                          ref={setActivatorNodeRef}
                          {...listeners}
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
                    )}
                  </SortableItemWrapper>
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
                    {intl.formatMessage({
                      id: "pages.questions.form.options.addOption",
                      defaultMessage: "添加选项",
                    })}
                  </Button>
                )}
              </div>
            </SortableContext>
            <DragOverlay>
              {activeId !== null && activeIndex >= 0 && fields[activeIndex] && (
                <div className="qdetail-option-edit-row qdetail-drag-overlay">
                  <span className="qdetail-edit-row-index">
                    #{activeIndex + 1}
                  </span>
                  <span
                    style={{
                      width: 42,
                      textAlign: "center",
                      fontWeight: 600,
                      fontSize: 14,
                      lineHeight: "32px",
                    }}
                  >
                    {options[activeIndex]?.key || ""}
                  </span>
                  <span
                    style={{
                      flex: 1,
                      padding: "4px 11px",
                      fontSize: 14,
                      lineHeight: "24px",
                    }}
                  >
                    {options[activeIndex]?.text || ""}
                  </span>
                  <span className="qdetail-edit-row-drag">
                    <HolderOutlined />
                  </span>
                </div>
              )}
            </DragOverlay>
          </DndContext>
        );
      }}
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
  const intl = useIntl();
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
                  {intl.formatMessage(
                    {
                      id: "pages.questions.form.testCase.number",
                      defaultMessage: "用例 {n}",
                    },
                    { n: (name as number) + 1 },
                  )}
                </span>
                <TestCasePreview
                  optionIndex={name as number}
                  fieldName="input"
                  fallback={intl.formatMessage({
                    id: "pages.questions.form.testCase.noInput",
                    defaultMessage: "无输入",
                  })}
                />
                <TestCasePreview
                  optionIndex={name as number}
                  fieldName="expected_output"
                  fallback={intl.formatMessage({
                    id: "pages.questions.form.testCase.noExpected",
                    defaultMessage: "未填写预期输出",
                  })}
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
                    <Checkbox>
                      {intl.formatMessage({
                        id: "pages.questions.form.sample",
                        defaultMessage: "示例",
                      })}
                    </Checkbox>
                  </Form.Item>
                  <Form.Item
                    {...restField}
                    name={[name, "is_hidden"]}
                    valuePropName="checked"
                    noStyle
                  >
                    <Checkbox>
                      {intl.formatMessage({
                        id: "pages.questions.form.hidden",
                        defaultMessage: "隐藏",
                      })}
                    </Checkbox>
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
                        label={intl.formatMessage({
                          id: "pages.questions.form.input",
                          defaultMessage: "标准输入",
                        })}
                        style={{ marginBottom: 0 }}
                      >
                        <Input.TextArea
                          rows={2}
                          placeholder={intl.formatMessage({
                            id: "pages.questions.form.testCase.inputPlaceholder",
                            defaultMessage: "测试输入",
                          })}
                        />
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={12}>
                      <Form.Item
                        {...restField}
                        name={[name, "expected_output"]}
                        label={intl.formatMessage({
                          id: "pages.questions.form.expectedOutput",
                          defaultMessage: "预期输出",
                        })}
                        style={{ marginBottom: 0 }}
                      >
                        <Input.TextArea
                          rows={2}
                          placeholder={intl.formatMessage({
                            id: "pages.questions.form.testCase.expectedOutputPlaceholder",
                            defaultMessage: "预期输出",
                          })}
                        />
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
                    {advancedCase === name
                      ? intl.formatMessage({
                          id: "pages.questions.form.testCase.hideAdvanced",
                          defaultMessage: "收起高级设置",
                        })
                      : intl.formatMessage({
                          id: "pages.questions.form.testCase.advancedSettings",
                          defaultMessage: "高级设置",
                        })}
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

const TrueFalseAnswerEdit: React.FC = () => {
  const intl = useIntl();
  return (
    <Form.Item name={["answer", "correct"]} className="qdetail-answer-field">
      <Radio.Group className="qdetail-truefalse-edit">
        <Radio value={true}>
          {intl.formatMessage({
            id: "pages.questions.form.true",
            defaultMessage: "正确",
          })}
        </Radio>
        <Radio value={false}>
          {intl.formatMessage({
            id: "pages.questions.form.false",
            defaultMessage: "错误",
          })}
        </Radio>
      </Radio.Group>
    </Form.Item>
  );
};

const FillBlankAnswerEdit: React.FC = () => <FillBlankAnswerList />;

const FillBlankAnswerList: React.FC = () => {
  const intl = useIntl();
  const form = Form.useFormInstance();
  const blanks: string[] = Form.useWatch(["answer", "blanks"], form) || [];
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );

  return (
    <Form.List name={["answer", "blanks"]}>
      {(fields, { add, remove, move }) => {
        const items = fields.map((f) => String(f.key));

        const handleDragStart = (event: DragStartEvent) =>
          setActiveId(event.active.id as string);
        const handleDragEnd = (event: DragEndEvent) => {
          setActiveId(null);
          const { active, over } = event;
          if (over && active.id !== over.id) {
            const oldIndex = items.indexOf(active.id as string);
            const newIndex = items.indexOf(over.id as string);
            move(oldIndex, newIndex);
          }
        };

        const activeIndex = activeId ? items.indexOf(activeId) : -1;

        return (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            modifiers={[restrictToVerticalAxis]}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={items}
              strategy={verticalListSortingStrategy}
            >
              <div className="qdetail-blank-edit">
                {fields.map(({ key, name, ...restField }) => (
                  <SortableItemWrapper key={key} id={String(key)}>
                    {({ listeners, setActivatorNodeRef }) => (
                      <div className="qdetail-blank-edit-row">
                        <span className="qdetail-edit-row-index">
                          #{(name as number) + 1}
                        </span>
                        <Form.Item
                          {...restField}
                          name={[name]}
                          rules={[
                            {
                              required: true,
                              message: intl.formatMessage({
                                id: "pages.questions.form.answer.blankRequired",
                                defaultMessage: "请输入答案内容",
                              }),
                            },
                          ]}
                          style={{ marginBottom: 0, flex: 1 }}
                        >
                          <Input
                            placeholder={intl.formatMessage({
                              id: "pages.questions.form.answer.blankPlaceholder",
                              defaultMessage: "答案内容",
                            })}
                            className="qdetail-blank-edit-input"
                          />
                        </Form.Item>
                        <button
                          type="button"
                          className="qdetail-edit-row-drag"
                          ref={setActivatorNodeRef}
                          {...listeners}
                          aria-label={`拖拽排序第 ${
                            (name as number) + 1
                          } 空答案`}
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
                    )}
                  </SortableItemWrapper>
                ))}
                <Button
                  type="dashed"
                  onClick={() => add()}
                  icon={<PlusOutlined />}
                  size="small"
                  block
                  className="qdetail-blank-edit-add"
                >
                  {intl.formatMessage({
                    id: "pages.questions.form.answer.addBlank",
                    defaultMessage: "添加填空",
                  })}
                </Button>
              </div>
            </SortableContext>
            <DragOverlay>
              {activeId !== null && activeIndex >= 0 && fields[activeIndex] && (
                <div className="qdetail-blank-edit-row qdetail-drag-overlay">
                  <span className="qdetail-edit-row-index">
                    #{activeIndex + 1}
                  </span>
                  <span
                    style={{
                      flex: 1,
                      padding: "4px 11px",
                      fontSize: 14,
                      lineHeight: "24px",
                    }}
                  >
                    {blanks[activeIndex] || ""}
                  </span>
                  <span className="qdetail-edit-row-drag">
                    <HolderOutlined />
                  </span>
                </div>
              )}
            </DragOverlay>
          </DndContext>
        );
      }}
    </Form.List>
  );
};

const ShortAnswerEdit: React.FC = () => {
  const intl = useIntl();
  return (
    <Form.Item name={["answer", "reference"]} className="qdetail-answer-field">
      <Input.TextArea
        rows={4}
        placeholder={intl.formatMessage({
          id: "pages.questions.form.answerReferencePlaceholder",
          defaultMessage: "输入参考答案或评分要点",
        })}
        className="qdetail-reference-textarea"
      />
    </Form.Item>
  );
};

/* ============================================================
   Main Component
   ============================================================ */

const QuestionsDetailContent: React.FC = () => {
  const intl = useIntl();
  const { message } = AntdApp.useApp();
  const [form] = Form.useForm();
  const questionId = history.location.pathname.split("/").filter(Boolean).pop();
  const isNew = questionId === "new";
  const [question, setQuestion] = useState<AdminQuestion | null>(null);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  // Effective type: from form field in create mode, from fetched question in edit mode
  const watchType = Form.useWatch("type", form) as QuestionType | undefined;
  const effectiveType: QuestionType | undefined = isNew
    ? watchType
    : question?.type;

  const fetchQuestion = async () => {
    if (!questionId || isNew) return;
    setLoading(true);
    try {
      const response = await request<QuestionEnvelope>(
        `/api/admin/questions/${questionId}`,
      );
      setQuestion(response.data);
    } catch (_error) {
      message.error(
        intl.formatMessage({
          id: "pages.questions.detailError",
          defaultMessage: "获取题目详情失败",
        }),
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isNew) {
      form.resetFields();
      form.setFieldsValue({
        status: "DRAFT",
        time_limit_ms: 2000,
        memory_limit_mb: 256,
        content: { text: "" },
      });
      setLoading(false);
      setIsDirty(false);
      return;
    }
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
    try {
      await form.validateFields();
      const values = form.getFieldsValue(true);
      const questionType = isNew ? values.type : question?.type;

      if (isNew) {
        const payload = { ...values };
        if (questionType !== "PROGRAMMING") {
          delete payload.time_limit_ms;
          delete payload.memory_limit_mb;
          delete payload.language;
          delete payload.starter_code;
          delete payload.test_cases;
        }
        setSaving(true);
        const response = await request<QuestionEnvelope>(
          "/api/admin/questions",
          { method: "POST", data: payload },
        );
        message.success(
          intl.formatMessage({
            id: "pages.questions.createSuccess",
            defaultMessage: "创建成功",
          }),
        );
        history.push(`/content/library/questions/${response.data.id}`);
        return;
      }

      if (!question) return;
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
      message.success(
        intl.formatMessage({
          id: "pages.questions.saveSuccess",
          defaultMessage: "保存成功",
        }),
      );
      setIsDirty(false);
      fetchQuestion();
    } catch (error) {
      if ((error as { errorFields?: unknown[] }).errorFields) return;
      message.error(
        isNew
          ? intl.formatMessage({
              id: "pages.questions.createError",
              defaultMessage: "创建失败",
            })
          : intl.formatMessage({
              id: "pages.questions.saveError",
              defaultMessage: "保存失败",
            }),
      );
    } finally {
      setSaving(false);
    }
  };

  const cancelEdit = () => {
    if (isNew) {
      form.resetFields();
      form.setFieldsValue({
        status: "DRAFT",
        time_limit_ms: 2000,
        memory_limit_mb: 256,
        content: { text: "" },
      });
      setIsDirty(false);
      return;
    }
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
      message.success(
        intl.formatMessage({
          id: "pages.questions.deleteSuccess",
          defaultMessage: "题目已删除",
        }),
      );
      history.push("/content/library/questions");
    } catch (error) {
      const maybe = error as {
        info?: { errorCode?: number };
        response?: { status?: number };
      };
      const code = maybe.info?.errorCode || maybe.response?.status;
      message.error(
        code === 40900 || code === 409
          ? intl.formatMessage({
              id: "pages.questions.deleteRefError",
              defaultMessage: "该题已被试卷引用，不能删除",
            })
          : intl.formatMessage({
              id: "pages.questions.deleteError",
              defaultMessage: "删除题目失败",
            }),
      );
    }
  };

  const pageTitle = isNew
    ? intl.formatMessage({
        id: "pages.questions.pageTitleNew",
        defaultMessage: "新建题目",
      })
    : loading
      ? intl.formatMessage({
          id: "pages.questions.loading",
          defaultMessage: "加载中...",
        })
      : question?.title ||
        intl.formatMessage({
          id: "pages.questions.pageTitleDetail",
          defaultMessage: "题目详情",
        });
  const isProgramming = effectiveType === "PROGRAMMING";

  const metaInfoBar =
    question && !isNew ? (
      <Space wrap size={[8, 8]} className="qdetail-meta-row">
        <code className="qdetail-id-code">#{question.id}</code>
        <Tag className="question-type-tag">
          {QUESTION_TYPE_LABELS[question.type]}
        </Tag>
        {question.difficulty && (
          <span
            className={`question-diff-tag ${
              DIFFICULTY_TAGS[question.difficulty] || ""
            }`}
          >
            {DIFFICULTY_LABELS[question.difficulty] || question.difficulty}
          </span>
        )}
        <Badge
          status={question.status === "PUBLISHED" ? "success" : "default"}
          text={QUESTION_STATUS_LABELS[question.status]}
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
          {intl.formatMessage({
            id: "pages.questions.updatedAt",
            defaultMessage: "更新于",
          })}{" "}
          {dayjs(question.updated_at).format("YYYY-MM-DD HH:mm")}
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
      {!loading && !question && !isNew ? (
        <div className="qdetail-wrap">
          <Empty
            description={intl.formatMessage({
              id: "pages.questions.emptyState",
              defaultMessage: "题目不存在",
            })}
          />
        </div>
      ) : question || isNew ? (
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
              {!isNew && (
                <Popconfirm
                  title={intl.formatMessage({
                    id: "pages.questions.deleteTitle",
                    defaultMessage: "删除题目",
                  })}
                  description={intl.formatMessage({
                    id: "pages.questions.deleteDescription",
                    defaultMessage: "确定删除该题目？",
                  })}
                  okText={intl.formatMessage({
                    id: "pages.questions.delete",
                    defaultMessage: "删除",
                  })}
                  cancelText={intl.formatMessage({
                    id: "pages.questions.cancel",
                    defaultMessage: "取消",
                  })}
                  okButtonProps={{ danger: true }}
                  onConfirm={deleteQuestion}
                >
                  <Button
                    danger
                    icon={<DeleteOutlined />}
                    aria-label={intl.formatMessage({
                      id: "pages.questions.deleteTitle",
                      defaultMessage: "删除题目",
                    })}
                  >
                    {intl.formatMessage({
                      id: "pages.questions.delete",
                      defaultMessage: "删除",
                    })}
                  </Button>
                </Popconfirm>
              )}
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
                {/* ===== Type (create mode only) ===== */}
                {isNew && (
                  <div className="qdetail-section">
                    <SectionTitle>
                      {intl.formatMessage({
                        id: "pages.questions.form.type",
                        defaultMessage: "题型",
                      })}
                    </SectionTitle>
                    <Form.Item
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
                      style={{ marginBottom: 0 }}
                    >
                      <Select
                        placeholder={intl.formatMessage({
                          id: "pages.questions.form.typeRequired",
                          defaultMessage: "请选择题型",
                        })}
                        options={QUESTION_TYPE_OPTIONS}
                        onChange={() => {
                          // Reset answer fields when type changes
                          form.setFieldValue("answer", undefined);
                          form.setFieldValue("content", { text: "" });
                          setTimeout(() => setIsDirty(true), 0);
                        }}
                      />
                    </Form.Item>
                  </div>
                )}

                {/* ===== Basic Info ===== */}
                {effectiveType && (
                  <div className="qdetail-section">
                    <SectionTitle>
                      {intl.formatMessage({
                        id: "pages.questions.form.section.basicInfo",
                        defaultMessage: "基本信息",
                      })}
                    </SectionTitle>
                    <Form.Item
                      name="title"
                      label={intl.formatMessage({
                        id: "pages.questions.form.title",
                        defaultMessage: "标题",
                      })}
                      rules={[
                        {
                          required: true,
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
                    <Row gutter={[12, 8]}>
                      <Col xs={12} sm={8} md={6} lg={4}>
                        <Form.Item
                          name="difficulty"
                          label={intl.formatMessage({
                            id: "pages.questions.form.difficulty",
                            defaultMessage: "难度",
                          })}
                          style={{ marginBottom: 0 }}
                        >
                          <Select
                            placeholder={intl.formatMessage({
                              id: "pages.questions.form.difficultyPlaceholder",
                              defaultMessage: "选择难度",
                            })}
                            options={DIFFICULTY_OPTIONS}
                            size="small"
                          />
                        </Form.Item>
                      </Col>
                      <Col xs={12} sm={8} md={6} lg={4}>
                        <Form.Item
                          name="status"
                          label={intl.formatMessage({
                            id: "pages.questions.form.status",
                            defaultMessage: "状态",
                          })}
                          style={{ marginBottom: 0 }}
                        >
                          <Select
                            placeholder={intl.formatMessage({
                              id: "pages.questions.form.status",
                              defaultMessage: "状态",
                            })}
                            options={QUESTION_STATUS_OPTIONS}
                            size="small"
                          />
                        </Form.Item>
                      </Col>
                    </Row>
                  </div>
                )}

                {/* ===== Question Body ===== */}
                {effectiveType && (
                  <div className="qdetail-section">
                    <SectionTitle>
                      {intl.formatMessage({
                        id: "pages.questions.form.contentText",
                        defaultMessage: "题干",
                      })}
                    </SectionTitle>
                    <Form.Item
                      name={["content", "text"]}
                      rules={[
                        {
                          required: true,
                          message: intl.formatMessage({
                            id: "pages.questions.form.contentTextRequired",
                            defaultMessage: "请输入题干",
                          }),
                        },
                      ]}
                      style={{ marginBottom: 0 }}
                    >
                      <Input.TextArea
                        rows={4}
                        placeholder={intl.formatMessage({
                          id: "pages.questions.form.contentTextPlaceholder",
                          defaultMessage: "输入题干内容",
                        })}
                        className="qdetail-body-textarea"
                      />
                    </Form.Item>
                  </div>
                )}

                {/* ===== Options ===== */}
                {(effectiveType === "SINGLE_CHOICE" ||
                  effectiveType === "MULTIPLE_CHOICE") && (
                  <div className="qdetail-section">
                    <SectionTitle>
                      {intl.formatMessage({
                        id: "pages.questions.form.options",
                        defaultMessage: "选项",
                      })}
                    </SectionTitle>
                    <OptionsEdit
                      type={effectiveType}
                      onAnswerChange={handleValuesChange}
                    />
                  </div>
                )}

                {/* ===== Answer ===== */}
                {effectiveType &&
                  effectiveType !== "SINGLE_CHOICE" &&
                  effectiveType !== "MULTIPLE_CHOICE" && (
                    <div className="qdetail-section">
                      <SectionTitle>
                        {intl.formatMessage({
                          id: "pages.questions.form.answerReference",
                          defaultMessage: "参考答案",
                        })}
                      </SectionTitle>
                      {effectiveType === "TRUE_FALSE" && (
                        <TrueFalseAnswerEdit />
                      )}
                      {effectiveType === "FILL_BLANK" && (
                        <FillBlankAnswerEdit />
                      )}
                      {effectiveType === "SHORT_ANSWER" && <ShortAnswerEdit />}
                      {effectiveType === "PROGRAMMING" && (
                        <div className="qdetail-answer-hint">
                          {intl.formatMessage({
                            id: "pages.questions.form.programmingHint",
                            defaultMessage:
                              "编程题无固定标准答案，以测试用例判分为准。",
                          })}
                        </div>
                      )}
                    </div>
                  )}

                {/* ===== Programming ===== */}
                {effectiveType === "PROGRAMMING" && (
                  <div className="qdetail-section">
                    <SectionTitle>
                      {intl.formatMessage({
                        id: "pages.questions.form.section.programmingConfig",
                        defaultMessage: "编程配置",
                      })}
                    </SectionTitle>
                    <Row className="qdetail-program-config" gutter={[12, 8]}>
                      <Col xs={24} md={10} lg={8}>
                        <Form.Item
                          name="language"
                          label={intl.formatMessage({
                            id: "pages.questions.form.language",
                            defaultMessage: "语言",
                          })}
                          style={{ marginBottom: 0 }}
                        >
                          <Input
                            placeholder={intl.formatMessage({
                              id: "pages.questions.form.languagePlaceholder",
                              defaultMessage: "选择语言",
                            })}
                          />
                        </Form.Item>
                      </Col>
                      <Col xs={12} md={7} lg={5}>
                        <Form.Item
                          name="time_limit_ms"
                          label={intl.formatMessage({
                            id: "pages.questions.form.timeLimit",
                            defaultMessage: "时间限制(ms)",
                          })}
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
                          label={intl.formatMessage({
                            id: "pages.questions.form.memoryLimit",
                            defaultMessage: "内存限制(MB)",
                          })}
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
                      {intl.formatMessage({
                        id: "pages.questions.form.starterCode",
                        defaultMessage: "代码模板",
                      })}
                    </SectionTitle>
                    <Form.Item name="starter_code" style={{ marginBottom: 0 }}>
                      <Input.TextArea
                        rows={6}
                        placeholder={intl.formatMessage({
                          id: "pages.questions.form.starterCodePlaceholder",
                          defaultMessage: "可选，输入候选人初始代码",
                        })}
                        className="qdetail-code-textarea"
                      />
                    </Form.Item>

                    <SectionTitle style={{ marginTop: 20 }}>
                      {intl.formatMessage({
                        id: "pages.questions.form.testCase",
                        defaultMessage: "测试用例",
                      })}
                    </SectionTitle>
                    <TestCasesEdit />
                  </div>
                )}
              </Form>

              {/* ===== Footer meta (inside paper) — edit mode only ===== */}
              {!isNew && question && (
                <div className="qdetail-footer-meta-bar">
                  <span className="qdetail-footer-meta">
                    {intl.formatMessage({
                      id: "pages.questions.createdAt",
                      defaultMessage: "创建于",
                    })}{" "}
                    {dayjs(question.created_at).format("YYYY-MM-DD HH:mm")}
                    &nbsp;·&nbsp;{" "}
                    {intl.formatMessage({
                      id: "pages.questions.updatedAt",
                      defaultMessage: "更新于",
                    })}{" "}
                    {dayjs(question.updated_at).format("YYYY-MM-DD HH:mm")}
                  </span>
                </div>
              )}
            </div>

            {/* ===== Sticky actions (outside paper, fixed to bottom) ===== */}
            {isDirty && (
              <div className="qdetail-sticky-footer">
                <span className="qdetail-dirty-text">
                  {isNew
                    ? intl.formatMessage({
                        id: "pages.questions.unsavedNew",
                        defaultMessage: "题目尚未保存",
                      })
                    : intl.formatMessage({
                        id: "pages.questions.unsavedEdit",
                        defaultMessage: "有未保存修改",
                      })}
                </span>
                <Space>
                  <Button
                    type="primary"
                    icon={<SaveOutlined />}
                    loading={saving}
                    onClick={saveQuestion}
                  >
                    {isNew
                      ? intl.formatMessage({
                          id: "pages.questions.create",
                          defaultMessage: "新建题目",
                        })
                      : intl.formatMessage({
                          id: "pages.questions.save",
                          defaultMessage: "保存",
                        })}
                  </Button>
                  <Button onClick={cancelEdit}>
                    {intl.formatMessage({
                      id: "pages.questions.revertChanges",
                      defaultMessage: "还原修改",
                    })}
                  </Button>
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
