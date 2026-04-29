import { request, useIntl } from '@umijs/max';
import { Button, Card, DatePicker, Form, InputNumber, message } from 'antd';
import type dayjs from 'dayjs';
import React, { useEffect, useState } from 'react';

interface Exam {
  id: number;
  title: string;
  description: string;
  paper_id?: number;
  status: string;
  duration_minutes: number;
}

const ExamPublish: React.FC = () => {
  const intl = useIntl();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [exam, setExam] = useState<Exam | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Get exam ID from URL path: /exams/:id/publish
  const pathParts = window.location.pathname.split('/');
  const examId = pathParts[pathParts.length - 2]; // 'publish' is last, id is second to last

  useEffect(() => {
    if (!examId) return;

    setLoading(true);
    request<{ code: number; data: Exam }>(`/api/admin/exams/${examId}`, {
      method: 'GET',
    })
      .then((response) => {
        if (response.data) {
          setExam(response.data);
          form.setFieldsValue({
            duration_minutes: response.data.duration_minutes || 60,
          });
        }
      })
      .catch(() => message.error('获取考试信息失败'))
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
        `/api/admin/exams/${examId}/publish`,
        {
          method: 'POST',
          data: {
            start_time: values.start_time.toISOString(),
            end_time: values.end_time.toISOString(),
            duration_minutes: values.duration_minutes,
          },
        },
      );
      if (response.code === 0) {
        message.success('考试发布成功');
        window.location.href = '/exams';
      } else {
        message.error(response.message || '发布失败');
      }
    } catch {
      message.error('发布考试失败');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card loading={loading} title="发布考试">
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={{ duration_minutes: 60 }}
      >
        {exam && (
          <div className="mb-6">
            <h3>{exam.title}</h3>
            {exam.description && (
              <p className="text-gray-500">{exam.description}</p>
            )}
          </div>
        )}

        <Form.Item
          name="duration_minutes"
          label="考试时长（分钟）"
          rules={[{ required: true, message: '请输入考试时长' }]}
        >
          <InputNumber min={1} max={480} style={{ width: 200 }} />
        </Form.Item>

        <Form.Item
          name="start_time"
          label="开始时间"
          rules={[{ required: true, message: '请选择开始时间' }]}
        >
          <DatePicker showTime format="YYYY-MM-DD HH:mm" />
        </Form.Item>

        <Form.Item
          name="end_time"
          label="结束时间"
          rules={[{ required: true, message: '请选择结束时间' }]}
        >
          <DatePicker showTime format="YYYY-MM-DD HH:mm" />
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit" loading={submitting}>
            {intl.formatMessage({
              id: 'common.publish',
              defaultMessage: '发布',
            })}
          </Button>
          <Button
            className="ml-4"
            onClick={() => (window.location.href = '/exams')}
          >
            {intl.formatMessage({
              id: 'common.cancel',
              defaultMessage: '取消',
            })}
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
};

export default ExamPublish;
