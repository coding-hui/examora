import {
  ArrowLeftOutlined,
  DeleteOutlined,
  EditOutlined,
} from '@ant-design/icons';
import { PageContainer } from '@ant-design/pro-components';
import { history, request } from '@umijs/max';
import {
  App as AntdApp,
  Button,
  Card,
  Col,
  Empty,
  Popconfirm,
  Row,
  Skeleton,
  Space,
  Tag,
} from 'antd';
import dayjs from 'dayjs';
import React, { useEffect, useState } from 'react';

type QuestionType =
  | 'SINGLE_CHOICE'
  | 'MULTIPLE_CHOICE'
  | 'TRUE_FALSE'
  | 'FILL_BLANK'
  | 'SHORT_ANSWER'
  | 'PROGRAMMING';

type QuestionStatus = 'DRAFT' | 'PUBLISHED';

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

const QUESTION_TYPES: Record<QuestionType, string> = {
  SINGLE_CHOICE: '单选题',
  MULTIPLE_CHOICE: '多选题',
  TRUE_FALSE: '判断题',
  FILL_BLANK: '填空题',
  SHORT_ANSWER: '简答题',
  PROGRAMMING: '编程题',
};

const DIFFICULTIES: Record<string, string> = {
  EASY: '简单',
  MEDIUM: '中等',
  HARD: '困难',
};

const STATUS_LABELS: Record<QuestionStatus, string> = {
  DRAFT: '草稿',
  PUBLISHED: '已发布',
};

const STATUS_COLORS: Record<QuestionStatus, string> = {
  DRAFT: 'default',
  PUBLISHED: 'green',
};

const preStyle: React.CSSProperties = {
  margin: 0,
  padding: '12px 14px',
  border: '1px solid #f0f0f0',
  borderRadius: 8,
  background: '#fafafa',
  whiteSpace: 'pre-wrap',
  wordBreak: 'break-word',
};

const questionInitial = (question: AdminQuestion) =>
  (question.title || QUESTION_TYPES[question.type])
    .trim()
    .slice(0, 1)
    .toUpperCase();

const answerText = (question: AdminQuestion) => {
  const answer = question.answer || {};
  if (question.type === 'SINGLE_CHOICE') {
    return String(answer.choice || '-');
  }
  if (question.type === 'MULTIPLE_CHOICE') {
    return Array.isArray(answer.choices) ? answer.choices.join(', ') : '-';
  }
  if (question.type === 'TRUE_FALSE') {
    return answer.correct === true
      ? '正确'
      : answer.correct === false
        ? '错误'
        : '-';
  }
  if (question.type === 'FILL_BLANK') {
    return Array.isArray(answer.blanks) ? answer.blanks.join('\n') : '-';
  }
  if (question.type === 'SHORT_ANSWER') {
    return String(answer.reference || '-');
  }
  return JSON.stringify(answer, null, 2);
};

const DetailRow: React.FC<{ label: string; children: React.ReactNode }> = ({
  label,
  children,
}) => (
  <div style={{ marginBottom: 22 }}>
    <div style={{ marginBottom: 8, fontWeight: 600 }}>{label}</div>
    {children}
  </div>
);

const QuestionsDetailContent: React.FC = () => {
  const { message } = AntdApp.useApp();
  const questionId = history.location.pathname.split('/').filter(Boolean).pop();
  const [question, setQuestion] = useState<AdminQuestion | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchQuestion = async () => {
    if (!questionId) {
      return;
    }
    setLoading(true);
    try {
      const response = await request<QuestionEnvelope>(
        `/api/admin/questions/${questionId}`,
      );
      setQuestion(response.data);
    } catch (_error) {
      message.error('获取题目详情失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestion();
  }, [questionId]);

  const deleteQuestion = async () => {
    if (!question) {
      return;
    }
    try {
      await request(`/api/admin/questions/${question.id}`, {
        method: 'DELETE',
        skipErrorHandler: true,
      });
      message.success('题目已删除');
      history.push('/content/library/questions');
    } catch (error) {
      const maybe = error as {
        info?: { errorCode?: number };
        response?: { status?: number };
      };
      const code = maybe.info?.errorCode || maybe.response?.status;
      message.error(
        code === 40900 || code === 409
          ? '该题已被试卷引用，不能删除'
          : '删除题目失败',
      );
    }
  };

  return (
    <PageContainer title={false}>
      <Button
        type="link"
        icon={<ArrowLeftOutlined />}
        onClick={() => history.push('/content/library/questions')}
        style={{ paddingInline: 0, marginBottom: 20 }}
      >
        返回题目管理
      </Button>

      {loading ? (
        <Card style={{ borderRadius: 8 }}>
          <Skeleton active paragraph={{ rows: 8 }} />
        </Card>
      ) : !question ? (
        <Card style={{ borderRadius: 8 }}>
          <Empty description="题目不存在" />
        </Card>
      ) : (
        <>
          <Card
            styles={{ body: { padding: '28px 32px' } }}
            style={{ borderRadius: 8, marginBottom: 24 }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                gap: 20,
                alignItems: 'center',
              }}
            >
              <Space size={18}>
                <div
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: 8,
                    display: 'grid',
                    placeItems: 'center',
                    background: '#f5f3ff',
                    color: '#6d28d9',
                    fontWeight: 700,
                    fontSize: 28,
                  }}
                >
                  {questionInitial(question)}
                </div>
                <div>
                  <h2 style={{ margin: 0, fontSize: 24, lineHeight: 1.25 }}>
                    {question.title}
                  </h2>
                  <Space size={10} style={{ marginTop: 8 }}>
                    <span style={{ color: '#737373' }}>Question ID</span>
                    <code
                      style={{
                        padding: '4px 10px',
                        borderRadius: 6,
                        background: '#f5f5f5',
                      }}
                    >
                      {question.id}
                    </code>
                    <Tag color={STATUS_COLORS[question.status]}>
                      {STATUS_LABELS[question.status]}
                    </Tag>
                  </Space>
                </div>
              </Space>
              <Space>
                <Button
                  icon={<EditOutlined />}
                  onClick={() => history.push('/content/library/questions')}
                >
                  返回列表编辑
                </Button>
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
              </Space>
            </div>
          </Card>

          <Card
            styles={{ body: { padding: '0 32px' } }}
            style={{ borderRadius: 8 }}
          >
            <Row gutter={32} style={{ borderBottom: '1px solid #f0f0f0' }}>
              <Col span={7} style={{ paddingBlock: 28 }}>
                <div
                  style={{
                    color: '#737373',
                    fontSize: 13,
                    fontWeight: 700,
                    letterSpacing: 1,
                  }}
                >
                  BASIC
                </div>
                <p style={{ color: '#737373', marginTop: 12 }}>
                  题目的基础属性和候选人可见题干。
                </p>
              </Col>
              <Col span={17} style={{ paddingBlock: 28 }}>
                <Row gutter={16}>
                  <Col span={12}>
                    <DetailRow label="题型">
                      {QUESTION_TYPES[question.type]}
                    </DetailRow>
                  </Col>
                  <Col span={12}>
                    <DetailRow label="难度">
                      {question.difficulty
                        ? DIFFICULTIES[question.difficulty] ||
                          question.difficulty
                        : '-'}
                    </DetailRow>
                  </Col>
                </Row>
                <Row gutter={16}>
                  <Col span={12}>
                    <DetailRow label="时间限制">
                      {question.time_limit_ms}ms
                    </DetailRow>
                  </Col>
                  <Col span={12}>
                    <DetailRow label="内存限制">
                      {question.memory_limit_mb}MB
                    </DetailRow>
                  </Col>
                </Row>
                <DetailRow label="题干">
                  <pre style={preStyle}>{question.content?.text || '-'}</pre>
                </DetailRow>
                {!!question.content?.options?.length && (
                  <DetailRow label="选项">
                    <Space orientation="vertical" style={{ width: '100%' }}>
                      {question.content.options.map((option) => (
                        <div
                          key={option.key}
                          style={{
                            padding: '10px 12px',
                            border: '1px solid #f0f0f0',
                            borderRadius: 8,
                          }}
                        >
                          <strong>{option.key}.</strong> {option.text}
                        </div>
                      ))}
                    </Space>
                  </DetailRow>
                )}
              </Col>
            </Row>

            <Row gutter={32}>
              <Col span={7} style={{ paddingBlock: 28 }}>
                <div
                  style={{
                    color: '#737373',
                    fontSize: 13,
                    fontWeight: 700,
                    letterSpacing: 1,
                  }}
                >
                  ANSWER
                </div>
                <p style={{ color: '#737373', marginTop: 12 }}>
                  管理端可见的标准答案和编程题测试数据。
                </p>
              </Col>
              <Col span={17} style={{ paddingBlock: 28 }}>
                <DetailRow label="答案">
                  <pre style={preStyle}>{answerText(question)}</pre>
                </DetailRow>
                {question.type === 'PROGRAMMING' && (
                  <>
                    <Row gutter={16}>
                      <Col span={12}>
                        <DetailRow label="语言">
                          {question.language || '-'}
                        </DetailRow>
                      </Col>
                      <Col span={12}>
                        <DetailRow label="更新时间">
                          {dayjs(question.updated_at).format(
                            'YYYY-MM-DD HH:mm',
                          )}
                        </DetailRow>
                      </Col>
                    </Row>
                    <DetailRow label="代码模板">
                      <pre
                        style={{
                          ...preStyle,
                          fontFamily:
                            'ui-monospace, SFMono-Regular, Menlo, monospace',
                        }}
                      >
                        {question.starter_code || '-'}
                      </pre>
                    </DetailRow>
                    <DetailRow label="测试用例">
                      <Space orientation="vertical" style={{ width: '100%' }}>
                        {(question.test_cases || []).map((testCase, index) => (
                          <Card key={testCase.id || index} size="small">
                            <Space style={{ marginBottom: 10 }}>
                              <strong>用例 {index + 1}</strong>
                              {testCase.is_sample && (
                                <Tag color="blue">示例</Tag>
                              )}
                              {testCase.is_hidden && (
                                <Tag color="orange">隐藏</Tag>
                              )}
                              <span style={{ color: '#737373' }}>
                                {testCase.time_limit_ms}ms /{' '}
                                {testCase.memory_limit_mb}MB
                              </span>
                            </Space>
                            <Row gutter={12}>
                              <Col span={12}>
                                <pre style={preStyle}>
                                  {testCase.input || '(空输入)'}
                                </pre>
                              </Col>
                              <Col span={12}>
                                <pre style={preStyle}>
                                  {testCase.expected_output || '(空输出)'}
                                </pre>
                              </Col>
                            </Row>
                          </Card>
                        ))}
                      </Space>
                    </DetailRow>
                  </>
                )}
              </Col>
            </Row>
          </Card>
        </>
      )}
    </PageContainer>
  );
};

const QuestionsDetail: React.FC = () => (
  <AntdApp>
    <QuestionsDetailContent />
  </AntdApp>
);

export default QuestionsDetail;
