import { PageContainer } from '@ant-design/pro-components';
import { API_PATHS } from '@examora/types';
import { history, request, useIntl } from '@umijs/max';
import {
  Alert,
  App as AntdApp,
  Button,
  Card,
  DatePicker,
  Descriptions,
  Form,
  InputNumber,
  Space,
} from 'antd';
import type dayjs from 'dayjs';
import React, { useEffect, useState } from 'react';
import { StatusTag } from '@/components';
import { requestErrorMessage } from '@/utils/request';

interface Exam {
  id: number;
  title: string;
  description: string;
  paper_id?: number;
  status: string;
  duration_minutes: number;
}

const ExamPublishContent: React.FC = () => {
  const intl = useIntl();
  const { message } = AntdApp.useApp();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [exam, setExam] = useState<Exam | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const pathParts = window.location.pathname.split('/');
  const examId = pathParts[pathParts.length - 2];

  useEffect(() => {
    if (!examId) return;

    setLoading(true);
    request<{ code: number; data: Exam }>(API_PATHS.admin.exam(examId), {
      method: 'GET',
      skipErrorHandler: true,
    })
      .then((response) => {
        if (response.data) {
          setExam(response.data);
          form.setFieldsValue({
            duration_minutes: response.data.duration_minutes || 60,
          });
        }
      })
      .catch((error) =>
        message.error(
          requestErrorMessage(error) ||
            intl.formatMessage({
              id: 'pages.exams.publish.fetchError',
              defaultMessage: '获取考试信息失败',
            }),
        ),
      )
      .finally(() => setLoading(false));
  }, [examId, form]);

  const handleSubmit = async (values: {
    start_time: dayjs.Dayjs;
    end_time: dayjs.Dayjs;
    duration_minutes: number;
  }) => {
    if (!examId) return;

    setSubmitting(true);
    try {
      const response = await request<{ code: number; message: string }>(
        API_PATHS.admin.examPublish(examId),
        {
          method: 'POST',
          skipErrorHandler: true,
          data: {
            start_time: values.start_time.toISOString(),
            end_time: values.end_time.toISOString(),
            duration_minutes: values.duration_minutes,
          },
        },
      );
      if (response.code === 0) {
        message.success(
          intl.formatMessage({
            id: 'pages.exams.publish.success',
            defaultMessage: '考试发布成功',
          }),
        );
        history.push(`/examination/exams/${examId}`);
      } else {
        message.error(
          response.message ||
            intl.formatMessage({
              id: 'pages.exams.publish.fail',
              defaultMessage: '发布失败',
            }),
        );
      }
    } catch (error) {
      message.error(
        requestErrorMessage(error) ||
          intl.formatMessage({
            id: 'pages.exams.publish.error',
            defaultMessage: '发布考试失败',
          }),
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PageContainer
      loading={loading}
      title={intl.formatMessage({
        id: 'pages.exams.publish.title',
        defaultMessage: '发布考试',
      })}
    >
      <Card>
        {exam && (
          <Space direction="vertical" size={16} style={{ width: '100%' }}>
            <Descriptions
              column={{ xs: 1, sm: 2, md: 3 }}
              items={[
                {
                  key: 'title',
                  label: intl.formatMessage({
                    id: 'pages.exams.columns.title',
                    defaultMessage: '考试名称',
                  }),
                  children: exam.title,
                },
                {
                  key: 'status',
                  label: intl.formatMessage({
                    id: 'pages.exams.columns.status',
                    defaultMessage: '状态',
                  }),
                  children: <StatusTag>{exam.status}</StatusTag>,
                },
                {
                  key: 'paper',
                  label: intl.formatMessage({
                    id: 'pages.exams.columns.paper',
                    defaultMessage: '试卷 ID',
                  }),
                  children: exam.paper_id ?? '-',
                },
              ]}
            />
            {!exam.paper_id && (
              <Alert
                type="warning"
                showIcon
                message={intl.formatMessage({
                  id: 'pages.exams.publish.noPaperWarning',
                  defaultMessage:
                    '该考试尚未绑定试卷，发布前请先在考试中选择试卷。',
                })}
              />
            )}
            {exam.status !== 'DRAFT' && (
              <Alert
                type="info"
                showIcon
                message={intl.formatMessage({
                  id: 'pages.exams.publish.statusWarning',
                  defaultMessage: '只有草稿状态的考试可以发布。',
                })}
              />
            )}
          </Space>
        )}
        <Form
          form={form}
          layout="vertical"
          variant="outlined"
          onFinish={handleSubmit}
          initialValues={{ duration_minutes: 60 }}
        >
          {exam && (
            <div className="mb-6 mt-6">
              <h3>{exam.title}</h3>
              {exam.description && (
                <p className="text-gray-500">{exam.description}</p>
              )}
            </div>
          )}

          <Form.Item
            name="duration_minutes"
            label={intl.formatMessage({
              id: 'pages.exams.publish.durationLabel',
              defaultMessage: '考试时长（分钟）',
            })}
            rules={[
              {
                required: true,
                message: intl.formatMessage({
                  id: 'pages.exams.publish.durationRequired',
                  defaultMessage: '请输入考试时长',
                }),
              },
            ]}
          >
            <InputNumber min={1} max={480} style={{ width: 200 }} />
          </Form.Item>

          <Form.Item
            name="start_time"
            label={intl.formatMessage({
              id: 'pages.exams.publish.startTimeLabel',
              defaultMessage: '开始时间',
            })}
            rules={[
              {
                required: true,
                message: intl.formatMessage({
                  id: 'pages.exams.publish.startTimeRequired',
                  defaultMessage: '请选择开始时间',
                }),
              },
            ]}
          >
            <DatePicker showTime format="YYYY-MM-DD HH:mm" />
          </Form.Item>

          <Form.Item
            name="end_time"
            label={intl.formatMessage({
              id: 'pages.exams.publish.endTimeLabel',
              defaultMessage: '结束时间',
            })}
            rules={[
              {
                required: true,
                message: intl.formatMessage({
                  id: 'pages.exams.publish.endTimeRequired',
                  defaultMessage: '请选择结束时间',
                }),
              },
            ]}
          >
            <DatePicker showTime format="YYYY-MM-DD HH:mm" />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={submitting}
              disabled={!exam?.paper_id || exam?.status !== 'DRAFT'}
            >
              {intl.formatMessage({
                id: 'common.publish',
                defaultMessage: '发布',
              })}
            </Button>
            <Button
              className="ml-4"
              onClick={() => history.push('/examination/exams')}
            >
              {intl.formatMessage({
                id: 'common.cancel',
                defaultMessage: '取消',
              })}
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </PageContainer>
  );
};

const ExamPublish: React.FC = () => (
  <AntdApp>
    <ExamPublishContent />
  </AntdApp>
);

export default ExamPublish;
