import {
  ArrowDownOutlined,
  ArrowLeftOutlined,
  ArrowUpOutlined,
  DeleteOutlined,
  DownOutlined,
  HolderOutlined,
  PlusOutlined,
  RightOutlined,
  SaveOutlined,
} from '@ant-design/icons';
import {
  PageContainer,
  type ProColumns,
  ProTable,
} from '@ant-design/pro-components';
import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  DragOverlay,
  type DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { AdminPaperOutline, AdminQuestion } from '@examora/types';
import { DIFFICULTY_OPTIONS, QUESTION_TYPE_OPTIONS } from '@examora/types';
import { history, request, useIntl } from '@umijs/max';
import {
  App as AntdApp,
  Badge,
  Button,
  Drawer,
  Form,
  Input,
  InputNumber,
  Popconfirm,
  Select,
  Space,
  Tooltip,
} from 'antd';
import dayjs from 'dayjs';
import React, { useEffect, useMemo, useState } from 'react';
import { requestErrorMessage } from '@/utils/request';
import {
  moveQuestionWithinSection,
  normalizeQuestions,
  normalizeSections,
  type PaperQuestion,
  type PaperSectionState,
} from './model';
import './index.less';

interface PaperFormValues {
  title: string;
  description?: string;
  status: 'DRAFT' | 'PUBLISHED';
}

interface Paper extends PaperFormValues {
  id: number;
  created_by: number;
  created_at: string;
  updated_at: string;
}

const PAPER_STATUS_KEYS = ['DRAFT', 'PUBLISHED'] as const;

const createDefaultSection = (
  intl: ReturnType<typeof useIntl>,
): PaperSectionState => ({
  client_id: `section-${Date.now()}`,
  title: intl.formatMessage({
    id: 'pages.papers.detail.defaultSectionTitle',
    defaultMessage: '第一大题',
  }),
  description: '',
  sort_order: 1,
  questions: [],
});

const questionTitle = (item: PaperQuestion) =>
  item.question?.title || item.title || `#${item.question_id}`;

const questionType = (item: PaperQuestion) => item.question?.type || item.type;

const questionDifficulty = (item: PaperQuestion) =>
  item.question?.difficulty || item.difficulty;

const sectionQuestionCount = (section: PaperSectionState) =>
  section.questions.length;

const sectionTotalScore = (section: PaperSectionState) =>
  section.questions.reduce((total, item) => total + Number(item.score || 0), 0);

const compactSectionSummary = (section: PaperSectionState) => {
  const count = sectionQuestionCount(section);
  const score = Number(sectionTotalScore(section).toFixed(1));
  const locale =
    typeof window === 'undefined'
      ? ''
      : localStorage.getItem('umi_locale') || '';
  if (locale.toLowerCase().startsWith('zh')) {
    return `${count}题 · ${score}分`;
  }
  return `${count} questions · ${score} points`;
};

const scoreKey = (sectionKey: string, questionID: number) =>
  `${sectionKey}-${questionID}`;

const questionDragId = (sectionKey: string, questionID: number) =>
  `question:${sectionKey}:${questionID}`;

const parseQuestionDragId = (id: string) => {
  const index = id.lastIndexOf(':');
  if (!id.startsWith('question:') || index < 0) return undefined;
  return {
    sectionKey: id.slice('question:'.length, index),
    questionID: Number(id.slice(index + 1)),
  };
};

const SectionTitle: React.FC<{
  children: React.ReactNode;
  extra?: React.ReactNode;
}> = ({ children, extra }) => (
  <div className="pdetail-section-heading">
    <h3 className="pdetail-section-title">{children}</h3>
    {extra}
  </div>
);

interface SortableQuestionWrapperProps {
  id: string;
  children: (handlers: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    listeners: any;
    setActivatorNodeRef: (node: HTMLElement | null) => void;
  }) => React.ReactNode;
}

const SortableQuestionWrapper: React.FC<SortableQuestionWrapperProps> = ({
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

const PaperDetailContent: React.FC = () => {
  const intl = useIntl();
  const { message } = AntdApp.useApp();
  const [form] = Form.useForm<PaperFormValues>();
  const paperId = history.location.pathname.split('/').filter(Boolean).at(-1);
  const isCreate = !paperId || paperId === 'new';
  const watchedTitle = Form.useWatch('title', form) as string | undefined;
  const watchedStatus = Form.useWatch('status', form) as string | undefined;

  const [paper, setPaper] = useState<Paper | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [activeSectionKey, setActiveSectionKey] = useState<string>();
  const [editingScoreKey, setEditingScoreKey] = useState<string>();
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const [activeDragWidth, setActiveDragWidth] = useState<number>();
  const [expandedSectionKeys, setExpandedSectionKeys] = useState<Set<string>>(
    () => new Set(),
  );
  const [sections, setSections] = useState<PaperSectionState[]>(() => [
    createDefaultSection(intl),
  ]);
  const [originalSections, setOriginalSections] = useState<PaperSectionState[]>(
    [],
  );

  const typeLabelMap = useMemo(
    () =>
      Object.fromEntries(
        QUESTION_TYPE_OPTIONS.map((type) => [
          type.value,
          intl.formatMessage({
            id: `pages.questions.types.${type.value}`,
            defaultMessage: type.label,
          }),
        ]),
      ),
    [intl],
  );

  const difficultyLabelMap = useMemo(
    () =>
      Object.fromEntries(
        DIFFICULTY_OPTIONS.map((difficulty) => [
          difficulty.value,
          intl.formatMessage({
            id: `pages.questions.difficulty.${difficulty.value}`,
            defaultMessage: difficulty.label,
          }),
        ]),
      ),
    [intl],
  );

  const typeValueEnum = useMemo(
    () =>
      Object.fromEntries(
        QUESTION_TYPE_OPTIONS.map((type) => [
          type.value,
          { text: typeLabelMap[type.value] },
        ]),
      ),
    [typeLabelMap],
  );

  const paperStatusOptions = useMemo(
    () =>
      PAPER_STATUS_KEYS.map((status) => ({
        label: intl.formatMessage({
          id: `pages.papers.status.${status}`,
          defaultMessage: status,
        }),
        value: status,
      })),
    [intl],
  );

  const difficultyValueEnum = useMemo(
    () =>
      Object.fromEntries(
        DIFFICULTY_OPTIONS.map((difficulty) => [
          difficulty.value,
          { text: difficultyLabelMap[difficulty.value] },
        ]),
      ),
    [difficultyLabelMap],
  );

  const selectedQuestionIds = useMemo(
    () =>
      new Set(
        sections.flatMap((section) =>
          section.questions.map((item) => item.question_id),
        ),
      ),
    [sections],
  );

  const questionSortSensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );

  const activeDraggedQuestion = useMemo(() => {
    if (!activeDragId) return undefined;
    const parsed = parseQuestionDragId(activeDragId);
    if (!parsed) return undefined;
    const section = sections.find(
      (item) => item.client_id === parsed.sectionKey,
    );
    const question = section?.questions.find(
      (item) => item.question_id === parsed.questionID,
    );
    if (!section || !question) return undefined;
    return { sectionKey: section.client_id, question };
  }, [activeDragId, sections]);

  const questionCount = useMemo(
    () =>
      sections.reduce((total, section) => total + section.questions.length, 0),
    [sections],
  );

  const totalScore = useMemo(
    () =>
      sections.reduce(
        (total, section) => total + sectionTotalScore(section),
        0,
      ),
    [sections],
  );

  useEffect(() => {
    if (isCreate) {
      const initialSections = [createDefaultSection(intl)];
      setPaper(null);
      setSections(initialSections);
      setOriginalSections(initialSections);
      setActiveSectionKey(initialSections[0].client_id);
      setExpandedSectionKeys(new Set([initialSections[0].client_id]));
      form.setFieldsValue({ status: 'DRAFT' });
      setIsDirty(false);
      return;
    }

    let cancelled = false;
    const loadPaper = async () => {
      setLoading(true);
      try {
        const response = await request<{
          code: number;
          data: AdminPaperOutline;
        }>(`/api/admin/papers/${paperId}/outline`);
        if (cancelled) return;
        const outline = response.data;
        setPaper(outline.paper);
        form.setFieldsValue({
          title: outline.paper.title,
          description: outline.paper.description,
          status: outline.paper.status || 'DRAFT',
        });
        const nextSections = normalizeSections(
          (outline.sections || []).map((section) => ({
            client_id: `section-${section.id}`,
            id: section.id,
            paper_id: section.paper_id,
            title: section.title,
            description: section.description,
            sort_order: section.sort_order,
            questions: section.questions || [],
          })),
        );
        const effectiveSections =
          nextSections.length > 0 ? nextSections : [createDefaultSection(intl)];
        setSections(effectiveSections);
        setOriginalSections(effectiveSections);
        setActiveSectionKey(effectiveSections[0]?.client_id);
        setExpandedSectionKeys(
          effectiveSections[0]?.client_id
            ? new Set([effectiveSections[0].client_id])
            : new Set(),
        );
        setIsDirty(false);
      } catch (_error) {
        message.error(
          intl.formatMessage({
            id: 'pages.papers.detail.loadError',
            defaultMessage: '加载试卷失败',
          }),
        );
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadPaper();
    return () => {
      cancelled = true;
    };
  }, [form, intl, isCreate, message, paperId]);

  const updateSections = (
    updater: (current: PaperSectionState[]) => PaperSectionState[],
  ) => {
    setIsDirty(true);
    setSections((current) => normalizeSections(updater(current)));
  };

  const addSection = () => {
    const clientID = `section-${Date.now()}-${sections.length}`;
    updateSections((current) => [
      ...current,
      {
        client_id: clientID,
        title: intl.formatMessage(
          {
            id: 'pages.papers.detail.sectionTitleTemplate',
            defaultMessage: '第 {index} 大题',
          },
          { index: current.length + 1 },
        ),
        description: '',
        sort_order: current.length + 1,
        questions: [],
      },
    ]);
    setActiveSectionKey(clientID);
    setExpandedSectionKeys((current) => new Set([...current, clientID]));
  };

  const updateSection = (
    sectionKey: string,
    patch: Partial<Pick<PaperSectionState, 'title' | 'description'>>,
  ) => {
    updateSections((current) =>
      current.map((section) =>
        section.client_id === sectionKey ? { ...section, ...patch } : section,
      ),
    );
  };

  const removeSection = (sectionKey: string) => {
    updateSections((current) => {
      const next = current.filter(
        (section) => section.client_id !== sectionKey,
      );
      if (next.length === 0) return [createDefaultSection(intl)];
      return next;
    });
    setExpandedSectionKeys((current) => {
      const next = new Set(current);
      next.delete(sectionKey);
      return next;
    });
    if (activeSectionKey === sectionKey) {
      const fallback = sections.find(
        (section) => section.client_id !== sectionKey,
      );
      setActiveSectionKey(fallback?.client_id);
    }
  };

  const toggleSection = (sectionKey: string) => {
    setExpandedSectionKeys((current) => {
      const next = new Set(current);
      if (next.has(sectionKey)) {
        next.delete(sectionKey);
      } else {
        next.add(sectionKey);
      }
      return next;
    });
  };

  const updateQuestion = (
    sectionKey: string,
    questionID: number,
    patch: Partial<Pick<PaperQuestion, 'score' | 'sort_order'>>,
  ) => {
    updateSections((current) =>
      current.map((section) =>
        section.client_id === sectionKey
          ? {
              ...section,
              questions: normalizeQuestions(
                section.questions.map((item) =>
                  item.question_id === questionID
                    ? { ...item, ...patch }
                    : item,
                ),
              ),
            }
          : section,
      ),
    );
  };

  const handleStructureDragStart = (event: DragStartEvent) => {
    setActiveDragId(event.active.id as string);
    setActiveDragWidth(event.active.rect.current.initial?.width);
  };

  const handleStructureDragEnd = (event: DragEndEvent) => {
    setActiveDragId(null);
    setActiveDragWidth(undefined);
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const activeQuestion = parseQuestionDragId(active.id as string);
    const overQuestion = parseQuestionDragId(over.id as string);
    if (!activeQuestion || !overQuestion) return;
    if (activeQuestion.sectionKey !== overQuestion.sectionKey) return;
    const targetSection = sections.find(
      (section) => section.client_id === overQuestion.sectionKey,
    );
    const targetIndex =
      targetSection?.questions.findIndex(
        (question) => question.question_id === overQuestion.questionID,
      ) ?? -1;
    if (targetIndex < 0) return;
    updateSections((current) =>
      moveQuestionWithinSection(current, {
        sectionKey: activeQuestion.sectionKey,
        questionID: activeQuestion.questionID,
        toIndex: targetIndex,
      }),
    );
  };

  const handleStructureDragCancel = () => {
    setActiveDragId(null);
    setActiveDragWidth(undefined);
  };

  const removeQuestion = (sectionKey: string, questionID: number) => {
    updateSections((current) =>
      current.map((section) =>
        section.client_id === sectionKey
          ? {
              ...section,
              questions: normalizeQuestions(
                section.questions.filter(
                  (item) => item.question_id !== questionID,
                ),
              ),
            }
          : section,
      ),
    );
  };

  const moveSection = (sectionKey: string, offset: -1 | 1) => {
    updateSections((current) => {
      const index = current.findIndex(
        (section) => section.client_id === sectionKey,
      );
      const nextIndex = index + offset;
      if (index < 0 || nextIndex < 0 || nextIndex >= current.length)
        return current;
      const next = [...current];
      const [target] = next.splice(index, 1);
      next.splice(nextIndex, 0, target);
      return next.map((section, sortOrder) => ({
        ...section,
        sort_order: sortOrder + 1,
      }));
    });
  };

  const openPicker = (sectionKey: string) => {
    setActiveSectionKey(sectionKey);
    setPickerOpen(true);
  };

  const addPickedQuestions = (questions: AdminQuestion[]) => {
    if (!activeSectionKey || questions.length === 0) {
      setPickerOpen(false);
      return;
    }
    updateSections((current) =>
      current.map((section) => {
        if (section.client_id !== activeSectionKey) return section;
        const seen = new Set(selectedQuestionIds);
        const appended = questions
          .filter((question) => !seen.has(question.id))
          .map((question, index) => ({
            question_id: question.id,
            question,
            title: question.title,
            type: question.type,
            difficulty: question.difficulty,
            score: 5,
            sort_order: section.questions.length + index + 1,
          }));
        return {
          ...section,
          questions: normalizeQuestions([...section.questions, ...appended]),
        };
      }),
    );
    setPickerOpen(false);
  };

  const saveOutline = async (targetPaperID: number) => {
    const response = await request<{ code: number; data: AdminPaperOutline }>(
      `/api/admin/papers/${targetPaperID}/outline`,
      {
        method: 'PUT',
        skipErrorHandler: true,
        data: {
          sections: sections.map((section) => ({
            id: section.id,
            title: section.title,
            description: section.description || '',
            sort_order: section.sort_order,
            questions: section.questions.map((question) => ({
              question_id: question.question_id,
              score: Number(question.score || 0),
              sort_order: question.sort_order,
            })),
          })),
        },
      },
    );
    const outline = response.data;
    const nextSections = normalizeSections(
      (outline.sections || []).map((section) => ({
        client_id: `section-${section.id}`,
        id: section.id,
        paper_id: section.paper_id,
        title: section.title,
        description: section.description,
        sort_order: section.sort_order,
        questions: section.questions || [],
      })),
    );
    setSections(
      nextSections.length > 0 ? nextSections : [createDefaultSection(intl)],
    );
    setOriginalSections(
      nextSections.length > 0 ? nextSections : [createDefaultSection(intl)],
    );
    setActiveSectionKey(nextSections[0]?.client_id);
    setExpandedSectionKeys(
      nextSections[0]?.client_id
        ? new Set([nextSections[0].client_id])
        : new Set(),
    );
    return outline;
  };

  const save = async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);
      const paperResponse = await request<{ code: number; data: Paper }>(
        isCreate ? '/api/admin/papers' : `/api/admin/papers/${paperId}`,
        {
          method: isCreate ? 'POST' : 'PUT',
          skipErrorHandler: true,
          data: values,
        },
      );
      const outline = await saveOutline(paperResponse.data.id);
      setPaper(outline.paper);
      message.success(
        intl.formatMessage({
          id: 'pages.papers.detail.saveSuccess',
          defaultMessage: '试卷已保存',
        }),
      );
      setIsDirty(false);
      if (isCreate) {
        history.replace(`/content/papers/${paperResponse.data.id}`);
      }
    } catch (error) {
      message.error(
        requestErrorMessage(error) ||
          intl.formatMessage({
            id: 'pages.papers.detail.saveError',
            defaultMessage: '保存试卷失败',
          }),
      );
    } finally {
      setSaving(false);
    }
  };

  const cancelEdit = () => {
    if (isCreate) {
      const initialSections = [createDefaultSection(intl)];
      form.resetFields();
      form.setFieldsValue({ status: 'DRAFT' });
      setSections(initialSections);
      setOriginalSections(initialSections);
      setActiveSectionKey(initialSections[0].client_id);
      setExpandedSectionKeys(new Set([initialSections[0].client_id]));
      setIsDirty(false);
      return;
    }
    if (paper) {
      form.setFieldsValue({
        title: paper.title,
        description: paper.description,
        status: paper.status || 'DRAFT',
      });
    }
    setSections(originalSections);
    setActiveSectionKey(originalSections[0]?.client_id);
    setExpandedSectionKeys(
      originalSections[0]?.client_id
        ? new Set([originalSections[0].client_id])
        : new Set(),
    );
    setIsDirty(false);
  };

  const pickerColumns: ProColumns<AdminQuestion>[] = [
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
      ellipsis: true,
      search: false,
      render: (_: unknown, question) => (
        <div className="paper-question-title">
          <span>{question.title}</span>
          <span className="paper-question-sub">
            #{question.id} · {typeLabelMap[question.type] || question.type}
            {question.difficulty
              ? ` · ${
                  difficultyLabelMap[question.difficulty] || question.difficulty
                }`
              : ''}
          </span>
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
      valueType: 'select',
      valueEnum: typeValueEnum,
      hideInTable: true,
    },
    {
      title: intl.formatMessage({
        id: 'pages.questions.columns.difficulty',
        defaultMessage: '难度',
      }),
      dataIndex: 'difficulty',
      key: 'difficulty',
      valueType: 'select',
      valueEnum: difficultyValueEnum,
      hideInTable: true,
    },
    {
      title: intl.formatMessage({
        id: 'pages.questions.columns.updatedAt',
        defaultMessage: '更新时间',
      }),
      dataIndex: 'updated_at',
      key: 'updated_at',
      search: false,
      hideInTable: true,
    },
  ];

  const pageTitle = isCreate
    ? intl.formatMessage({
        id: 'pages.papers.detail.createTitle',
        defaultMessage: '新建试卷',
      })
    : watchedTitle ||
      paper?.title ||
      intl.formatMessage({
        id: 'pages.papers.detail.editTitle',
        defaultMessage: '编辑试卷',
      });
  const currentStatus = watchedStatus || paper?.status || 'DRAFT';
  const currentStatusLabel =
    paperStatusOptions.find((option) => option.value === currentStatus)
      ?.label || currentStatus;

  return (
    <PageContainer
      title={false}
      breadcrumbRender={false}
      loading={loading}
      className="pdetail-page"
    >
      <div className="pdetail-hero">
        <div className="pdetail-hero-inner">
          <div className="pdetail-hero-main">
            <Button
              type="text"
              icon={<ArrowLeftOutlined />}
              aria-label={intl.formatMessage({
                id: 'pages.papers.detail.back',
                defaultMessage: '返回',
              })}
              className="pdetail-back"
              onClick={() => history.push('/content/papers')}
            />
            <div className="pdetail-hero-title-block">
              <h1 className="pdetail-hero-title">{pageTitle}</h1>
              <Space wrap size={[8, 8]} className="pdetail-meta-row">
                {!isCreate && paper && (
                  <code className="pdetail-id-code">#{paper.id}</code>
                )}
                <Badge
                  status={currentStatus === 'PUBLISHED' ? 'success' : 'default'}
                  text={currentStatusLabel}
                />
                <span className="pdetail-meta-badge">
                  {intl.formatMessage({
                    id: 'pages.papers.detail.sectionCount',
                    defaultMessage: '大题',
                  })}
                  : {sections.length}
                </span>
                <span className="pdetail-meta-badge">
                  {intl.formatMessage({
                    id: 'pages.papers.detail.summary.count',
                    defaultMessage: '题量',
                  })}
                  : {questionCount}
                </span>
                <span className="pdetail-meta-badge">
                  {intl.formatMessage({
                    id: 'pages.papers.detail.summary.score',
                    defaultMessage: '总分',
                  })}
                  : {totalScore.toFixed(1)}
                </span>
                {!isCreate && paper && (
                  <span className="pdetail-meta-badge">
                    {intl.formatMessage({
                      id: 'pages.papers.updatedAt',
                      defaultMessage: '更新于',
                    })}{' '}
                    {dayjs(paper.updated_at).format('YYYY-MM-DD HH:mm')}
                  </span>
                )}
              </Space>
            </div>
          </div>
        </div>
      </div>

      <div
        className={`pdetail-wrap ${
          isDirty ? 'pdetail-wrap-with-sticky-footer' : ''
        }`}
      >
        <div className="pdetail-paper">
          <Form
            form={form}
            layout="vertical"
            initialValues={{ status: 'DRAFT' }}
            className="pdetail-form"
            onValuesChange={() => setIsDirty(true)}
          >
            <div className="pdetail-section">
              <SectionTitle>
                {intl.formatMessage({
                  id: 'pages.papers.detail.basicInfo',
                  defaultMessage: '基本信息',
                })}
              </SectionTitle>
              <div className="pdetail-basic-row">
                <Form.Item
                  label={intl.formatMessage({
                    id: 'pages.papers.detail.form.title',
                    defaultMessage: '试卷标题',
                  })}
                  name="title"
                  className="pdetail-basic-title-item"
                  rules={[
                    {
                      required: true,
                      message: intl.formatMessage({
                        id: 'pages.papers.detail.form.titleRequired',
                        defaultMessage: '请输入试卷标题',
                      }),
                    },
                  ]}
                >
                  <Input
                    className="pdetail-title-input"
                    placeholder={intl.formatMessage({
                      id: 'pages.papers.detail.form.titlePlaceholder',
                      defaultMessage: '输入试卷标题',
                    })}
                  />
                </Form.Item>
                <Form.Item
                  label={intl.formatMessage({
                    id: 'pages.papers.detail.form.status',
                    defaultMessage: '状态',
                  })}
                  name="status"
                  className="pdetail-basic-status-item"
                  rules={[
                    {
                      required: true,
                      message: intl.formatMessage({
                        id: 'pages.papers.detail.form.statusRequired',
                        defaultMessage: '请选择状态',
                      }),
                    },
                  ]}
                >
                  <Select
                    options={paperStatusOptions}
                    className="pdetail-status-select"
                  />
                </Form.Item>
              </div>
              <Form.Item
                label={intl.formatMessage({
                  id: 'pages.papers.detail.form.description',
                  defaultMessage: '试卷说明',
                })}
                name="description"
                className="pdetail-basic-description"
              >
                <Input.TextArea
                  className="pdetail-description-textarea"
                  autoSize={{ minRows: 3, maxRows: 6 }}
                  placeholder={intl.formatMessage({
                    id: 'pages.papers.detail.form.descriptionPlaceholder',
                    defaultMessage: '输入试卷说明（可选）',
                  })}
                />
              </Form.Item>
            </div>

            <div className="pdetail-section">
              <SectionTitle>
                {intl.formatMessage({
                  id: 'pages.papers.detail.paperStructure',
                  defaultMessage: '试卷内容',
                })}
              </SectionTitle>
              <div className="pdetail-structure-summary">
                {sections.length}{' '}
                {intl.formatMessage({
                  id: 'pages.papers.detail.sectionCount',
                  defaultMessage: '大题',
                })}
                {' · '}
                {questionCount}{' '}
                {intl.formatMessage({
                  id: 'pages.papers.detail.summary.count',
                  defaultMessage: '题量',
                })}
                {' · '}
                {totalScore.toFixed(1)}{' '}
                {intl.formatMessage({
                  id: 'pages.papers.detail.summary.score',
                  defaultMessage: '总分',
                })}
              </div>

              <div className="pdetail-section-list">
                {sections.map((section, sectionIndex) => {
                  const expanded = expandedSectionKeys.has(section.client_id);
                  return (
                    <div
                      className="pdetail-paper-section"
                      key={section.client_id}
                      onFocus={() => setActiveSectionKey(section.client_id)}
                    >
                      <div
                        className="pdetail-paper-section-header"
                        onClick={() => {
                          setActiveSectionKey(section.client_id);
                          toggleSection(section.client_id);
                        }}
                      >
                        <span className="pdetail-section-toggle">
                          {expanded ? <DownOutlined /> : <RightOutlined />}
                        </span>
                        <Input
                          value={section.title}
                          className="pdetail-paper-section-title-input"
                          placeholder={intl.formatMessage({
                            id: 'pages.papers.detail.sectionTitlePlaceholder',
                            defaultMessage: '输入大题标题',
                          })}
                          onClick={(event) => {
                            event.stopPropagation();
                            setActiveSectionKey(section.client_id);
                          }}
                          onChange={(event) =>
                            updateSection(section.client_id, {
                              title: event.target.value,
                            })
                          }
                        />
                        <span className="pdetail-question-summary">
                          {compactSectionSummary(section)}
                        </span>
                        <Space
                          size={2}
                          className="pdetail-paper-section-actions"
                          onClick={(event) => event.stopPropagation()}
                        >
                          <Tooltip
                            title={intl.formatMessage({
                              id: 'pages.papers.detail.moveUp',
                              defaultMessage: '上移大题',
                            })}
                          >
                            <Button
                              type="text"
                              size="small"
                              icon={<ArrowUpOutlined />}
                              disabled={sectionIndex === 0}
                              onClick={() => moveSection(section.client_id, -1)}
                            />
                          </Tooltip>
                          <Tooltip
                            title={intl.formatMessage({
                              id: 'pages.papers.detail.moveDown',
                              defaultMessage: '下移大题',
                            })}
                          >
                            <Button
                              type="text"
                              size="small"
                              icon={<ArrowDownOutlined />}
                              disabled={sectionIndex === sections.length - 1}
                              onClick={() => moveSection(section.client_id, 1)}
                            />
                          </Tooltip>
                          <Popconfirm
                            title={intl.formatMessage({
                              id: 'pages.papers.detail.removeSectionConfirm',
                              defaultMessage: '确认删除该题组？',
                            })}
                            onConfirm={() => removeSection(section.client_id)}
                          >
                            <Button
                              type="text"
                              size="small"
                              danger
                              icon={<DeleteOutlined />}
                            />
                          </Popconfirm>
                        </Space>
                      </div>

                      {expanded && (
                        <div className="pdetail-question-list">
                          {section.questions.length > 0 && (
                            <DndContext
                              sensors={questionSortSensors}
                              collisionDetection={closestCenter}
                              modifiers={[restrictToVerticalAxis]}
                              onDragStart={handleStructureDragStart}
                              onDragEnd={handleStructureDragEnd}
                              onDragCancel={handleStructureDragCancel}
                            >
                              <SortableContext
                                items={section.questions.map((item) =>
                                  questionDragId(
                                    section.client_id,
                                    item.question_id,
                                  ),
                                )}
                                strategy={verticalListSortingStrategy}
                              >
                                {section.questions.map((item, index) => {
                                  const type = questionType(item);
                                  const difficulty = questionDifficulty(item);
                                  const currentScoreKey = scoreKey(
                                    section.client_id,
                                    item.question_id,
                                  );
                                  const editingScore =
                                    editingScoreKey === currentScoreKey;
                                  return (
                                    <SortableQuestionWrapper
                                      key={item.question_id}
                                      id={questionDragId(
                                        section.client_id,
                                        item.question_id,
                                      )}
                                    >
                                      {({ listeners, setActivatorNodeRef }) => (
                                        <div className="pdetail-question-row">
                                          <span className="pdetail-question-order">
                                            #{index + 1}
                                          </span>
                                          <div className="pdetail-question-main">
                                            <Tooltip
                                              title={questionTitle(item)}
                                            >
                                              <span className="pdetail-question-title-text">
                                                {questionTitle(item)}
                                              </span>
                                            </Tooltip>
                                            <span className="paper-question-sub">
                                              #{item.question_id}
                                              {type
                                                ? ` · ${typeLabelMap[type] || type}`
                                                : ''}
                                              {difficulty
                                                ? ` · ${
                                                    difficultyLabelMap[
                                                      difficulty
                                                    ] || difficulty
                                                  }`
                                                : ''}
                                            </span>
                                          </div>
                                          {editingScore ? (
                                            <InputNumber
                                              autoFocus
                                              min={0.5}
                                              step={0.5}
                                              precision={1}
                                              value={item.score}
                                              className="pdetail-question-score-input"
                                              onBlur={() =>
                                                setEditingScoreKey(undefined)
                                              }
                                              onPressEnter={() =>
                                                setEditingScoreKey(undefined)
                                              }
                                              onChange={(value) => {
                                                updateQuestion(
                                                  section.client_id,
                                                  item.question_id,
                                                  { score: Number(value || 0) },
                                                );
                                              }}
                                            />
                                          ) : (
                                            <button
                                              type="button"
                                              className="pdetail-question-score-text"
                                              onClick={() =>
                                                setEditingScoreKey(
                                                  currentScoreKey,
                                                )
                                              }
                                            >
                                              {Number(item.score || 0).toFixed(
                                                1,
                                              )}{' '}
                                              分
                                            </button>
                                          )}
                                          <Space
                                            size={2}
                                            className="pdetail-question-actions"
                                          >
                                            <button
                                              type="button"
                                              className="pdetail-question-drag"
                                              ref={setActivatorNodeRef}
                                              {...listeners}
                                              aria-label={intl.formatMessage(
                                                {
                                                  id: 'pages.papers.detail.dragQuestion',
                                                  defaultMessage:
                                                    '拖拽排序第 {n} 题',
                                                },
                                                { n: index + 1 },
                                              )}
                                            >
                                              <HolderOutlined />
                                            </button>
                                            <Popconfirm
                                              title={intl.formatMessage({
                                                id: 'pages.papers.detail.removeQuestionConfirm',
                                                defaultMessage:
                                                  '确认移除该题目？',
                                              })}
                                              onConfirm={() =>
                                                removeQuestion(
                                                  section.client_id,
                                                  item.question_id,
                                                )
                                              }
                                            >
                                              <Button
                                                type="text"
                                                danger
                                                icon={<DeleteOutlined />}
                                              />
                                            </Popconfirm>
                                          </Space>
                                        </div>
                                      )}
                                    </SortableQuestionWrapper>
                                  );
                                })}
                              </SortableContext>
                              <DragOverlay>
                                {activeDraggedQuestion?.sectionKey ===
                                  section.client_id && (
                                  <div
                                    className="pdetail-question-row pdetail-question-drag-overlay"
                                    style={
                                      activeDragWidth
                                        ? { width: activeDragWidth }
                                        : undefined
                                    }
                                  >
                                    <span className="pdetail-question-order">
                                      #
                                    </span>
                                    <div className="pdetail-question-main">
                                      <span className="pdetail-question-title-text">
                                        {questionTitle(
                                          activeDraggedQuestion.question,
                                        )}
                                      </span>
                                      <span className="paper-question-sub">
                                        #
                                        {
                                          activeDraggedQuestion.question
                                            .question_id
                                        }
                                      </span>
                                    </div>
                                    <span className="pdetail-question-score-text">
                                      {Number(
                                        activeDraggedQuestion.question.score ||
                                          0,
                                      ).toFixed(1)}{' '}
                                      分
                                    </span>
                                    <span className="pdetail-question-drag">
                                      <HolderOutlined />
                                    </span>
                                  </div>
                                )}
                              </DragOverlay>
                            </DndContext>
                          )}
                          <Button
                            type="dashed"
                            icon={<PlusOutlined />}
                            className="pdetail-add-question-link"
                            block
                            onClick={() => openPicker(section.client_id)}
                          >
                            {intl.formatMessage({
                              id: 'pages.papers.detail.addQuestions',
                              defaultMessage: '添加题目',
                            })}
                          </Button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              <Button
                type="dashed"
                icon={<PlusOutlined />}
                className="pdetail-add-section-link"
                block
                onClick={addSection}
              >
                {intl.formatMessage({
                  id: 'pages.papers.detail.addSection',
                  defaultMessage: '新增题组',
                })}
              </Button>
            </div>
          </Form>

          {!isCreate && paper && (
            <div className="pdetail-footer-meta-bar">
              <span className="pdetail-footer-meta">
                {intl.formatMessage({
                  id: 'pages.papers.createdAt',
                  defaultMessage: '创建于',
                })}{' '}
                {dayjs(paper.created_at).format('YYYY-MM-DD HH:mm')}
                &nbsp;·&nbsp;{' '}
                {intl.formatMessage({
                  id: 'pages.papers.updatedAt',
                  defaultMessage: '更新于',
                })}{' '}
                {dayjs(paper.updated_at).format('YYYY-MM-DD HH:mm')}
              </span>
            </div>
          )}
        </div>

        {isDirty && (
          <div className="pdetail-sticky-footer">
            <span className="pdetail-dirty-text">
              {isCreate
                ? intl.formatMessage({
                    id: 'pages.papers.unsavedNew',
                    defaultMessage: '试卷尚未保存',
                  })
                : intl.formatMessage({
                    id: 'pages.papers.unsavedEdit',
                    defaultMessage: '有未保存修改',
                  })}
            </span>
            <Space>
              <Button
                type="primary"
                icon={<SaveOutlined />}
                loading={saving}
                onClick={save}
              >
                {isCreate
                  ? intl.formatMessage({
                      id: 'pages.papers.create',
                      defaultMessage: '新建试卷',
                    })
                  : intl.formatMessage({
                      id: 'pages.papers.detail.save',
                      defaultMessage: '保存',
                    })}
              </Button>
              <Button onClick={cancelEdit}>
                {intl.formatMessage({
                  id: 'pages.papers.revertChanges',
                  defaultMessage: '还原修改',
                })}
              </Button>
            </Space>
          </div>
        )}
      </div>

      <Drawer
        title={intl.formatMessage({
          id: 'pages.papers.detail.pickerTitle',
          defaultMessage: '添加已发布题目',
        })}
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        size="large"
        destroyOnClose
      >
        <ProTable<AdminQuestion>
          rowKey="id"
          columns={pickerColumns}
          cardBordered={{
            search: true,
            table: true,
          }}
          columnEmptyText="-"
          defaultSize="middle"
          search={{
            labelWidth: 'auto',
            defaultCollapsed: false,
          }}
          beforeSearchSubmit={(params) => ({
            ...params,
            keyword:
              typeof params.keyword === 'string'
                ? params.keyword.trim()
                : params.keyword,
          })}
          request={async (params) => {
            try {
              const response = await request<{
                code: number;
                data: { items: AdminQuestion[]; total: number };
              }>('/api/admin/questions', {
                params: {
                  page: params.current,
                  page_size: params.pageSize,
                  status: 'PUBLISHED',
                  ...(params.keyword ? { keyword: params.keyword } : {}),
                  ...(params.type ? { type: params.type } : {}),
                  ...(params.difficulty
                    ? { difficulty: params.difficulty }
                    : {}),
                },
              });
              return {
                data: (response.data?.items || []).filter(
                  (question) => !selectedQuestionIds.has(question.id),
                ),
                total: response.data?.total || 0,
                success: true,
              };
            } catch (_error) {
              message.error(
                intl.formatMessage({
                  id: 'pages.papers.detail.questionFetchError',
                  defaultMessage: '获取题目列表失败',
                }),
              );
              return { data: [], total: 0, success: false };
            }
          }}
          pagination={{
            defaultPageSize: 10,
            showSizeChanger: true,
          }}
          rowSelection={{
            selections: false,
          }}
          tableAlertOptionRender={({ selectedRows, onCleanSelected }) => (
            <Space>
              <Button
                type="primary"
                onClick={() => {
                  addPickedQuestions(selectedRows);
                  onCleanSelected();
                }}
              >
                {intl.formatMessage(
                  {
                    id: 'pages.papers.detail.addSelected',
                    defaultMessage: '添加 {count} 题',
                  },
                  { count: selectedRows.length },
                )}
              </Button>
            </Space>
          )}
          options={{
            density: true,
            fullScreen: false,
            reload: true,
            setting: false,
          }}
          scroll={{ x: 760 }}
        />
      </Drawer>
    </PageContainer>
  );
};

const PaperDetail: React.FC = () => (
  <AntdApp>
    <PaperDetailContent />
  </AntdApp>
);

export default PaperDetail;
