import { EyeOutlined, ReloadOutlined } from '@ant-design/icons';
import {
  PageContainer,
  type ProColumns,
  ProTable,
} from '@ant-design/pro-components';
import type {
  AdminExam,
  AdminExamPageResponse,
  AdminExamResult,
  AdminExamResultPageResponse,
  AdminQuestionResult,
} from '@examora/types';
import { API_PATHS } from '@examora/types';
import { request, useIntl } from '@umijs/max';
import {
  App as AntdApp,
  Button,
  Descriptions,
  Drawer,
  Empty,
  Progress,
  Select,
  Space,
  Spin,
  Table,
  Typography,
} from 'antd';
import dayjs from 'dayjs';
import React, { useEffect, useMemo, useState } from 'react';
import { StatusTag, statusToneFromAntdColor } from '@/components';
import { fetchEnvelope } from '@/utils/apiEnvelope';
import { requestErrorMessage } from '@/utils/request';
import {
  formatScore,
  isResultPending,
  resultProgressPercent,
  resultStatusTone,
} from './model';

const { Text } = Typography;
const examResultsPath = (examID: number | string) =>
  `/api/v1/exams/${examID}/results`;
const examResultPath = (resultID: number | string) =>
  `/api/v1/exam-results/${resultID}`;

const SubmissionsContent: React.FC = () => {
  const intl = useIntl();
  const { message } = AntdApp.useApp();
  const [exams, setExams] = useState<AdminExam[]>([]);
  const [examID, setExamID] = useState<number>();
  const [results, setResults] = useState<AdminExamResult[]>([]);
  const [resultTotal, setResultTotal] = useState(0);
  const [resultsLoading, setResultsLoading] = useState(false);
  const [detail, setDetail] = useState<AdminExamResult | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    request<{ code: number; data: AdminExamPageResponse }>(
      API_PATHS.admin.exams,
      {
        skipErrorHandler: true,
        params: { page: 1, page_size: 100 },
      },
    )
      .then((response) => {
        const items = response.data?.items || [];
        setExams(items);
        setExamID((current) => current ?? items[0]?.id);
      })
      .catch((error) =>
        message.error(
          requestErrorMessage(error) ||
            intl.formatMessage({
              id: 'pages.results.examsLoadError',
              defaultMessage: '加载考试列表失败',
            }),
        ),
      );
  }, [intl, message]);

  const examOptions = useMemo(
    () => exams.map((exam) => ({ label: exam.title, value: exam.id })),
    [exams],
  );

  const fetchResults = React.useCallback(async () => {
    if (!examID) return;
    setResultsLoading(true);
    try {
      const data = await fetchEnvelope<AdminExamResultPageResponse>(
        `${examResultsPath(examID)}?page=1&page_size=100`,
      );
      setResults(data.items || []);
      setResultTotal(data.total || 0);
    } catch (error) {
      message.error(
        requestErrorMessage(error) ||
          intl.formatMessage({
            id: 'pages.results.fetchError',
            defaultMessage: '加载提交记录失败',
          }),
      );
    } finally {
      setResultsLoading(false);
    }
  }, [examID, intl, message]);

  useEffect(() => {
    fetchResults();
  }, [fetchResults]);

  const openDetail = async (record: AdminExamResult) => {
    setDetailOpen(true);
    setDetailLoading(true);
    try {
      const data = await fetchEnvelope<AdminExamResult>(
        examResultPath(record.id),
      );
      setDetail(data);
    } catch (error) {
      message.error(
        requestErrorMessage(error) ||
          intl.formatMessage({
            id: 'pages.results.detailLoadError',
            defaultMessage: '加载结果详情失败',
          }),
      );
    } finally {
      setDetailLoading(false);
    }
  };

  const columns: ProColumns<AdminExamResult>[] = [
    {
      title: 'ID',
      dataIndex: 'id',
      width: 80,
      search: false,
    },
    {
      title: intl.formatMessage({
        id: 'pages.results.columns.user',
        defaultMessage: '考生ID',
      }),
      dataIndex: 'user_id',
      width: 100,
      search: false,
    },
    {
      title: intl.formatMessage({
        id: 'pages.results.columns.status',
        defaultMessage: '状态',
      }),
      dataIndex: 'status',
      width: 140,
      search: false,
      render: (_, record) => (
        <StatusTag
          tone={statusToneFromAntdColor(resultStatusTone(record.status))}
        >
          {record.status}
        </StatusTag>
      ),
    },
    {
      title: intl.formatMessage({
        id: 'pages.results.columns.score',
        defaultMessage: '成绩',
      }),
      dataIndex: 'score',
      search: false,
      render: (_, record) => (
        <Space direction="vertical" size={2} style={{ width: 180 }}>
          <Text>{formatScore(record.score, record.max_score)}</Text>
          <Progress
            percent={resultProgressPercent(record)}
            size="small"
            status={isResultPending(record) ? 'active' : 'normal'}
          />
        </Space>
      ),
    },
    {
      title: intl.formatMessage({
        id: 'pages.results.columns.submittedAt',
        defaultMessage: '提交时间',
      }),
      dataIndex: 'submitted_at',
      width: 180,
      search: false,
      render: (_, record) =>
        record.submitted_at
          ? dayjs(record.submitted_at).format('YYYY-MM-DD HH:mm:ss')
          : '-',
    },
    {
      title: intl.formatMessage({
        id: 'common.actions',
        defaultMessage: '操作',
      }),
      valueType: 'option',
      width: 100,
      render: (_, record) => [
        <Button
          key="detail"
          type="link"
          icon={<EyeOutlined />}
          onClick={() => openDetail(record)}
        >
          {intl.formatMessage({ id: 'common.view', defaultMessage: '查看' })}
        </Button>,
      ],
    },
  ];

  const questionRows: AdminQuestionResult[] = useMemo(() => {
    if (!detail) return [];
    if (detail.sections?.length) {
      return detail.sections.flatMap((section) => section.questions || []);
    }
    return detail.questions || [];
  }, [detail]);

  return (
    <PageContainer
      title={intl.formatMessage({
        id: 'menu.assessment.submissions',
        defaultMessage: '提交记录',
      })}
      content={intl.formatMessage({
        id: 'pages.results.description',
        defaultMessage: '按考试查看考生提交、总分和题目判分状态。',
      })}
    >
      <ProTable<AdminExamResult>
        rowKey="id"
        columns={columns}
        dataSource={results}
        loading={resultsLoading}
        pagination={{ total: resultTotal, pageSize: 20 }}
        search={false}
        options={{ reload: fetchResults, density: true, setting: true }}
        cardBordered={{ table: true }}
        columnEmptyText="-"
        headerTitle={
          <Space>
            <Select
              style={{ width: 320 }}
              value={examID}
              options={examOptions}
              placeholder={intl.formatMessage({
                id: 'pages.results.examPlaceholder',
                defaultMessage: '选择考试',
              })}
              onChange={(value) => setExamID(value)}
            />
            <Button icon={<ReloadOutlined />} onClick={fetchResults} />
          </Space>
        }
        locale={{
          emptyText: examID ? (
            <Empty />
          ) : (
            intl.formatMessage({
              id: 'pages.results.selectExamEmpty',
              defaultMessage: '请选择考试',
            })
          ),
        }}
      />
      <Drawer
        size="large"
        open={detailOpen}
        title={intl.formatMessage({
          id: 'pages.results.detailTitle',
          defaultMessage: '提交详情',
        })}
        onClose={() => setDetailOpen(false)}
      >
        <Spin spinning={detailLoading}>
          {detail && (
            <Space direction="vertical" size={16} style={{ width: '100%' }}>
              <Descriptions bordered size="small" column={2}>
                <Descriptions.Item label="ID">{detail.id}</Descriptions.Item>
                <Descriptions.Item label="User">
                  {detail.user_id}
                </Descriptions.Item>
                <Descriptions.Item label="Status">
                  <StatusTag
                    tone={statusToneFromAntdColor(
                      resultStatusTone(detail.status),
                    )}
                  >
                    {detail.status}
                  </StatusTag>
                </Descriptions.Item>
                <Descriptions.Item label="Score">
                  {formatScore(detail.score, detail.max_score)}
                </Descriptions.Item>
              </Descriptions>
              <Table<AdminQuestionResult>
                rowKey="id"
                size="small"
                pagination={false}
                dataSource={questionRows}
                columns={[
                  { title: 'Question', dataIndex: 'question_id', width: 100 },
                  { title: 'Type', dataIndex: 'type', width: 140 },
                  {
                    title: 'Status',
                    dataIndex: 'status',
                    width: 160,
                    render: (status) => <StatusTag>{status}</StatusTag>,
                  },
                  {
                    title: 'Score',
                    render: (_, row) => formatScore(row.score, row.max_score),
                  },
                ]}
              />
            </Space>
          )}
        </Spin>
      </Drawer>
    </PageContainer>
  );
};

const Submissions: React.FC = () => (
  <AntdApp>
    <SubmissionsContent />
  </AntdApp>
);

export default Submissions;
