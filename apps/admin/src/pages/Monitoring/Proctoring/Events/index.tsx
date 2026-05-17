import { EyeOutlined, ReloadOutlined } from '@ant-design/icons';
import {
  PageContainer,
  type ProColumns,
  ProTable,
} from '@ant-design/pro-components';
import type {
  AdminClientEvent,
  AdminClientEventPageResponse,
  AdminExam,
  AdminExamPageResponse,
} from '@examora/types';
import { API_PATHS } from '@examora/types';
import { useIntl } from '@umijs/max';
import {
  App as AntdApp,
  Button,
  Descriptions,
  Drawer,
  Empty,
  Select,
  Space,
  Spin,
  Typography,
} from 'antd';
import dayjs from 'dayjs';
import React, { useEffect, useMemo, useState } from 'react';
import { fetchEnvelope } from '@/utils/apiEnvelope';
import { requestErrorMessage } from '@/utils/request';

const { Text } = Typography;

const EventsContent: React.FC = () => {
  const intl = useIntl();
  const { message } = AntdApp.useApp();
  const [exams, setExams] = useState<AdminExam[]>([]);
  const [examID, setExamID] = useState<number>();
  const [events, setEvents] = useState<AdminClientEvent[]>([]);
  const [eventTotal, setEventTotal] = useState(0);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [detail, setDetail] = useState<AdminClientEvent | null>(null);

  useEffect(() => {
    fetchEnvelope<AdminExamPageResponse>(
      `${API_PATHS.admin.exams}?page=1&page_size=100`,
    )
      .then((data) => {
        const items = data.items || [];
        setExams(items);
        setExamID((current) => current ?? items[0]?.id);
      })
      .catch((error) =>
        message.error(
          requestErrorMessage(error) ||
            intl.formatMessage({
              id: 'pages.events.examsLoadError',
              defaultMessage: '加载考试列表失败',
            }),
        ),
      );
  }, [intl, message]);

  const examOptions = useMemo(
    () => exams.map((exam) => ({ label: exam.title, value: exam.id })),
    [exams],
  );

  const fetchEvents = React.useCallback(async () => {
    if (!examID) return;
    setEventsLoading(true);
    try {
      const data = await fetchEnvelope<AdminClientEventPageResponse>(
        `${API_PATHS.admin.examEvents(examID)}?page=1&page_size=100`,
      );
      setEvents(data.items || []);
      setEventTotal(data.total || 0);
    } catch (error) {
      message.error(
        requestErrorMessage(error) ||
          intl.formatMessage({
            id: 'pages.events.fetchError',
            defaultMessage: '加载审计事件失败',
          }),
      );
    } finally {
      setEventsLoading(false);
    }
  }, [examID, intl, message]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const columns: ProColumns<AdminClientEvent>[] = [
    { title: 'ID', dataIndex: 'id', width: 80, search: false },
    {
      title: intl.formatMessage({
        id: 'pages.events.columns.user',
        defaultMessage: '用户ID',
      }),
      dataIndex: 'user_id',
      width: 120,
      search: false,
    },
    {
      title: intl.formatMessage({
        id: 'pages.events.columns.device',
        defaultMessage: '设备',
      }),
      dataIndex: 'device_id',
      width: 180,
      search: false,
      ellipsis: true,
      render: (_, record) => record.device_id || '-',
    },
    {
      title: intl.formatMessage({
        id: 'pages.events.columns.type',
        defaultMessage: '事件类型',
      }),
      dataIndex: 'event_type',
      width: 180,
      search: false,
    },
    {
      title: intl.formatMessage({
        id: 'pages.events.columns.createdAt',
        defaultMessage: '时间',
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
          onClick={() => setDetail(record)}
        >
          {intl.formatMessage({ id: 'common.view', defaultMessage: '查看' })}
        </Button>,
      ],
    },
  ];

  return (
    <PageContainer
      title={intl.formatMessage({
        id: 'menu.examination.events',
        defaultMessage: '审计事件',
      })}
      content={intl.formatMessage({
        id: 'pages.events.description',
        defaultMessage: '按考试查看桌面端上报的审计事件和设备信息。',
      })}
      extra={[
        <Button key="refresh" icon={<ReloadOutlined />} onClick={fetchEvents}>
          {intl.formatMessage({ id: 'common.refresh', defaultMessage: '刷新' })}
        </Button>,
      ]}
    >
      <Space direction="vertical" size={16} style={{ width: '100%' }}>
        <Select
          showSearch
          allowClear
          style={{ width: 360, maxWidth: '100%' }}
          options={examOptions}
          value={examID}
          onChange={setExamID}
          optionFilterProp="label"
          placeholder={intl.formatMessage({
            id: 'pages.events.examPlaceholder',
            defaultMessage: '选择考试',
          })}
        />
        {examID ? (
          <ProTable<AdminClientEvent>
            rowKey="id"
            columns={columns}
            dataSource={events}
            loading={eventsLoading}
            pagination={{ total: eventTotal, pageSize: 20 }}
            search={false}
            options={{ reload: fetchEvents, density: true, setting: true }}
            cardBordered={{ table: true }}
            columnEmptyText="-"
          />
        ) : (
          <Empty
            description={intl.formatMessage({
              id: 'pages.events.emptyExam',
              defaultMessage: '请选择考试查看审计事件',
            })}
          />
        )}
      </Space>
      <Drawer
        size={520}
        open={!!detail}
        title={intl.formatMessage({
          id: 'pages.events.detailTitle',
          defaultMessage: '事件详情',
        })}
        onClose={() => setDetail(null)}
      >
        <Spin spinning={false}>
          {detail && (
            <Descriptions bordered size="small" column={1}>
              <Descriptions.Item label="ID">{detail.id}</Descriptions.Item>
              <Descriptions.Item label="Exam">
                {detail.exam_id}
              </Descriptions.Item>
              <Descriptions.Item label="User">
                {detail.user_id}
              </Descriptions.Item>
              <Descriptions.Item label="Device">
                {detail.device_id || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="Type">
                {detail.event_type}
              </Descriptions.Item>
              <Descriptions.Item label="Payload">
                <Text code>{JSON.stringify(detail.payload)}</Text>
              </Descriptions.Item>
            </Descriptions>
          )}
        </Spin>
      </Drawer>
    </PageContainer>
  );
};

const Events: React.FC = () => (
  <AntdApp>
    <EventsContent />
  </AntdApp>
);

export default Events;
