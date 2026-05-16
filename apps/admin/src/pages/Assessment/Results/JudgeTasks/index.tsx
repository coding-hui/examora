import { EyeOutlined } from '@ant-design/icons';
import {
  PageContainer,
  type ProColumns,
  ProTable,
} from '@ant-design/pro-components';
import type {
  AdminJudgeTask,
  AdminJudgeTaskPageResponse,
} from '@examora/types';
import { useIntl } from '@umijs/max';
import {
  App as AntdApp,
  Button,
  Descriptions,
  Drawer,
  Space,
  Spin,
  Typography,
} from 'antd';
import dayjs from 'dayjs';
import React, { useEffect, useState } from 'react';
import { StatusTag, statusToneFromAntdColor } from '@/components';
import { fetchEnvelope } from '@/utils/apiEnvelope';
import { requestErrorMessage } from '@/utils/request';
import {
  judgeTaskDurationLabel,
  judgeTaskStatusTone,
  summarizeJudgeTask,
} from './model';

const { Paragraph } = Typography;
const JUDGE_TASKS_PATH = '/api/v1/judge/tasks';
const judgeTaskPath = (taskID: number | string) =>
  `/api/v1/judge/tasks/${taskID}`;

const JudgeTasksContent: React.FC = () => {
  const intl = useIntl();
  const { message } = AntdApp.useApp();
  const [tasks, setTasks] = useState<AdminJudgeTask[]>([]);
  const [taskTotal, setTaskTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [detail, setDetail] = useState<AdminJudgeTask | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);

  const fetchTasks = React.useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchEnvelope<AdminJudgeTaskPageResponse>(
        `${JUDGE_TASKS_PATH}?page=1&page_size=100`,
      );
      setTasks(data.items || []);
      setTaskTotal(data.total || 0);
    } catch (error) {
      message.error(
        requestErrorMessage(error) ||
          intl.formatMessage({
            id: 'pages.judgeTasks.fetchError',
            defaultMessage: '加载判题任务失败',
          }),
      );
    } finally {
      setLoading(false);
    }
  }, [intl, message]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const openDetail = async (record: AdminJudgeTask) => {
    setDetailOpen(true);
    setDetailLoading(true);
    try {
      const data = await fetchEnvelope<AdminJudgeTask>(
        judgeTaskPath(record.id),
      );
      setDetail(data);
    } catch (error) {
      message.error(
        requestErrorMessage(error) ||
          intl.formatMessage({
            id: 'pages.judgeTasks.detailLoadError',
            defaultMessage: '加载判题任务详情失败',
          }),
      );
    } finally {
      setDetailLoading(false);
    }
  };

  const columns: ProColumns<AdminJudgeTask>[] = [
    { title: 'ID', dataIndex: 'id', width: 80, search: false },
    {
      title: intl.formatMessage({
        id: 'pages.judgeTasks.columns.submission',
        defaultMessage: '提交ID',
      }),
      dataIndex: 'submission_id',
      width: 100,
      search: false,
    },
    {
      title: intl.formatMessage({
        id: 'pages.judgeTasks.columns.question',
        defaultMessage: '题目ID',
      }),
      dataIndex: 'question_id',
      width: 100,
      search: false,
    },
    {
      title: intl.formatMessage({
        id: 'pages.judgeTasks.columns.language',
        defaultMessage: '语言',
      }),
      dataIndex: 'language',
      width: 110,
      search: false,
    },
    {
      title: intl.formatMessage({
        id: 'pages.judgeTasks.columns.status',
        defaultMessage: '状态',
      }),
      dataIndex: 'status',
      width: 150,
      search: false,
      render: (_, record) => (
        <StatusTag
          tone={statusToneFromAntdColor(judgeTaskStatusTone(record.status))}
        >
          {record.status}
        </StatusTag>
      ),
    },
    {
      title: intl.formatMessage({
        id: 'pages.judgeTasks.columns.retry',
        defaultMessage: '重试',
      }),
      dataIndex: 'retry_count',
      width: 90,
      search: false,
      render: (_, record) => `${record.retry_count}/${record.max_retry_count}`,
    },
    {
      title: intl.formatMessage({
        id: 'pages.judgeTasks.columns.summary',
        defaultMessage: '摘要',
      }),
      search: false,
      ellipsis: true,
      render: (_, record) => summarizeJudgeTask(record),
    },
    {
      title: intl.formatMessage({
        id: 'pages.judgeTasks.columns.createdAt',
        defaultMessage: '创建时间',
      }),
      dataIndex: 'created_at',
      width: 180,
      search: false,
      render: (_, record) =>
        dayjs(record.created_at).format('YYYY-MM-DD HH:mm:ss'),
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

  return (
    <PageContainer
      title={intl.formatMessage({
        id: 'menu.assessment.judgeTasks',
        defaultMessage: '判题任务',
      })}
      content={intl.formatMessage({
        id: 'pages.judgeTasks.description',
        defaultMessage: '查看异步判题任务、重试次数、运行耗时和沙箱摘要。',
      })}
    >
      <ProTable<AdminJudgeTask>
        rowKey="id"
        columns={columns}
        dataSource={tasks}
        loading={loading}
        pagination={{ total: taskTotal, pageSize: 20 }}
        search={false}
        options={{ reload: fetchTasks, density: true, setting: true }}
        cardBordered={{ table: true }}
        columnEmptyText="-"
      />
      <Drawer
        size="large"
        open={detailOpen}
        title={intl.formatMessage({
          id: 'pages.judgeTasks.detailTitle',
          defaultMessage: '判题任务详情',
        })}
        onClose={() => setDetailOpen(false)}
      >
        <Spin spinning={detailLoading}>
          {detail && (
            <Space direction="vertical" size={16} style={{ width: '100%' }}>
              <Descriptions bordered size="small" column={2}>
                <Descriptions.Item label="ID">{detail.id}</Descriptions.Item>
                <Descriptions.Item label="Submission">
                  {detail.submission_id}
                </Descriptions.Item>
                <Descriptions.Item label="Question">
                  {detail.question_id}
                </Descriptions.Item>
                <Descriptions.Item label="User">
                  {detail.user_id}
                </Descriptions.Item>
                <Descriptions.Item label="Language">
                  {detail.language}
                </Descriptions.Item>
                <Descriptions.Item label="Status">
                  <StatusTag
                    tone={statusToneFromAntdColor(
                      judgeTaskStatusTone(detail.status),
                    )}
                  >
                    {detail.status}
                  </StatusTag>
                </Descriptions.Item>
                <Descriptions.Item label="Retry">
                  {detail.retry_count}/{detail.max_retry_count}
                </Descriptions.Item>
                <Descriptions.Item label="Duration">
                  {judgeTaskDurationLabel(detail)}
                </Descriptions.Item>
              </Descriptions>
              <Paragraph copyable>{summarizeJudgeTask(detail)}</Paragraph>
            </Space>
          )}
        </Spin>
      </Drawer>
    </PageContainer>
  );
};

const JudgeTasks: React.FC = () => (
  <AntdApp>
    <JudgeTasksContent />
  </AntdApp>
);

export default JudgeTasks;
