import { ArrowLeftOutlined, SaveOutlined } from '@ant-design/icons';
import { PageContainer } from '@ant-design/pro-components';
import type { AdminExam, AdminPaper, AdminPaperPageResponse } from '@examora/types';
import { API_PATHS } from '@examora/types';
import { history, request, useIntl } from '@umijs/max';
import {
  App as AntdApp,
  Alert,
  Button,
  Card,
  Form,
  Input,
  InputNumber,
  Select,
  Space,
  Spin,
  Tag,
} from 'antd';
import React, { useEffect, useMemo, useState } from 'react';
import { requestErrorMessage } from '@/utils/request';
import {
  buildExamPayload,
  canEditExam,
  type ExamFormValues,
  paperOptionLabel,
} from './model';

const ExamFormContent: React.FC = () => {
  const intl = useIntl();
  const { message } = AntdApp.useApp();
  const [form] = Form.useForm<ExamFormValues>();
  const [exam, setExam] = useState<AdminExam | null>(null);
  const [papers, setPapers] = useState<AdminPaper[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const pathParts = window.location.pathname.split('/');
  const isEdit = pathParts[pathParts.length - 1] === 'edit';
  const examId = isEdit ? pathParts[pathParts.length - 2] : undefined;

  const title = intl.formatMessage({
    id: isEdit ? 'pages.exams.editTitle' : 'pages.exams.createTitle',
    defaultMessage: isEdit ? '编辑考试' : '创建考试',
  });

  const paperOptions = useMemo(
    () =>
      papers.map((paper) => ({
        label: paperOptionLabel(paper),
        value: paper.id,
      })),
    [papers],
  );

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    const papersRequest = request<{ code: number; data: AdminPaperPageResponse }>(
        API_PATHS.admin.papers,
        {
          method: 'GET',
          skipErrorHandler: true,
          params: { page: 1, page_size: 100 },
        },
      );
    const examRequest = examId
      ? request<{ code: number; data: AdminExam }>(API_PATHS.admin.exam(examId), {
          method: 'GET',
          skipErrorHandler: true,
        })
      : Promise.resolve(null);

    Promise.all([papersRequest, examRequest])
      .then(([paperResponse, examResponse]) => {
        if (!mounted) return;
        setPapers(paperResponse.data?.items || []);
        const loadedExam = examResponse?.data;
        if (loadedExam) {
          setExam(loadedExam);
          form.setFieldsValue({
            title: loadedExam.title,
            description: loadedExam.description,
            paper_id: loadedExam.paper_id || undefined,
            duration_minutes: loadedExam.duration_minutes || 60,
          });
        } else {
          form.setFieldsValue({ duration_minutes: 60 });
        }
      })
      .catch((error) =>
        message.error(
          requestErrorMessage(error) ||
            intl.formatMessage({
              id: 'pages.exams.form.loadError',
              defaultMessage: '加载考试配置失败',
            }),
        ),
      )
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [examId, form, intl, message]);

  const handleSubmit = async () => {
    const values = await form.validateFields();
    const payload = buildExamPayload(values);
    setSaving(true);
    try {
      await request(
        examId ? API_PATHS.admin.exam(examId) : API_PATHS.admin.exams,
        {
          method: examId ? 'PUT' : 'POST',
          data: payload,
          skipErrorHandler: true,
        },
      );
      message.success(
        intl.formatMessage({
          id: 'pages.exams.form.saveSuccess',
          defaultMessage: '考试已保存',
        }),
      );
      history.push('/examination/exams');
    } catch (error) {
      message.error(
        requestErrorMessage(error) ||
          intl.formatMessage({
            id: 'pages.exams.form.saveError',
            defaultMessage: '保存考试失败',
          }),
      );
    } finally {
      setSaving(false);
    }
  };

  const editable = canEditExam(exam);

  return (
    <PageContainer
      title={title}
      onBack={() => history.push('/examination/exams')}
      content={intl.formatMessage({
        id: 'pages.exams.form.description',
        defaultMessage: '配置考试基本信息并绑定试卷，保存后可在考试列表发布。',
      })}
      extra={
        exam ? (
          <Tag color={editable ? 'default' : 'green'}>{exam.status}</Tag>
        ) : null
      }
    >
      <Spin spinning={loading}>
        <Card>
          <Form<ExamFormValues>
            form={form}
            layout="vertical"
            disabled={!editable}
            onFinish={handleSubmit}
          >
            {!editable && (
              <Alert
                style={{ marginBottom: 16 }}
                type="info"
                showIcon
                message={intl.formatMessage({
                  id: 'pages.exams.form.readonlyHint',
                  defaultMessage: '已发布或已结束考试不可编辑基础配置。',
                })}
              />
            )}
            <Form.Item
              name="title"
              label={intl.formatMessage({
                id: 'pages.exams.form.title',
                defaultMessage: '考试名称',
              })}
              rules={[{ required: true, message: '请输入考试名称' }]}
            >
              <Input maxLength={120} />
            </Form.Item>
            <Form.Item
              name="description"
              label={intl.formatMessage({
                id: 'pages.exams.form.descriptionField',
                defaultMessage: '考试说明',
              })}
            >
              <Input.TextArea rows={4} maxLength={1000} showCount />
            </Form.Item>
            <Form.Item
              name="paper_id"
              label={intl.formatMessage({
                id: 'pages.exams.form.paper',
                defaultMessage: '关联试卷',
              })}
              rules={[{ required: true, message: '请选择试卷' }]}
            >
              <Select
                showSearch
                optionFilterProp="label"
                options={paperOptions}
                placeholder={intl.formatMessage({
                  id: 'pages.exams.form.paperPlaceholder',
                  defaultMessage: '选择一份试卷',
                })}
              />
            </Form.Item>
            <Form.Item
              name="duration_minutes"
              label={intl.formatMessage({
                id: 'pages.exams.form.duration',
                defaultMessage: '默认时长(分钟)',
              })}
              rules={[{ required: true, message: '请输入考试时长' }]}
            >
              <InputNumber min={1} max={1440} style={{ width: 240 }} />
            </Form.Item>
            <Form.Item>
              <Space>
                <Button
                  icon={<ArrowLeftOutlined />}
                  onClick={() => history.push('/examination/exams')}
                >
                  {intl.formatMessage({
                    id: 'common.cancel',
                    defaultMessage: '取消',
                  })}
                </Button>
                <Button
                  type="primary"
                  icon={<SaveOutlined />}
                  loading={saving}
                  htmlType="submit"
                  disabled={!editable}
                >
                  {intl.formatMessage({
                    id: 'common.save',
                    defaultMessage: '保存',
                  })}
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Card>
      </Spin>
    </PageContainer>
  );
};

const ExamForm: React.FC = () => (
  <AntdApp>
    <ExamFormContent />
  </AntdApp>
);

export default ExamForm;
