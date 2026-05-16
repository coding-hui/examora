import { DownOutlined, PlusOutlined, StopOutlined } from '@ant-design/icons';
import {
  type ActionType,
  FooterToolbar,
  PageContainer,
  type ProColumns,
  ProTable,
} from '@ant-design/pro-components';
import type { AdminPaper, AdminPaperPageResponse } from '@examora/types';
import { API_PATHS } from '@examora/types';
import { history, request, useIntl } from '@umijs/max';
import {
  App as AntdApp,
  Button,
  Dropdown,
  Form,
  Input,
  InputNumber,
  Modal,
  Select,
  Space,
} from 'antd';
import dayjs from 'dayjs';
import React, { useMemo, useRef, useState } from 'react';
import { StatusTag, type StatusTagTone } from '@/components';
import type { BatchActionResult } from '@/utils/request';
import { requestErrorMessage } from '@/utils/request';
import {
  buildExamPayload,
  type ExamFormValues,
  paperOptionLabel,
} from '../ExamForm/model';
import './index.less';

interface Exam {
  id: number;
  title: string;
  description: string;
  paper_id?: number;
  status: string;
  start_time?: string;
  end_time?: string;
  duration_minutes: number;
  created_at: string;
}

const EXAM_STATUS_KEYS = [
  'DRAFT',
  'PUBLISHED',
  'RUNNING',
  'CLOSED',
  'ARCHIVED',
] as const;

const statusTones: Record<string, StatusTagTone> = {
  DRAFT: 'neutral',
  PUBLISHED: 'info',
  RUNNING: 'success',
  CLOSED: 'warning',
  ARCHIVED: 'neutral',
};

const ExamListContent: React.FC = () => {
  const intl = useIntl();
  const { message, modal } = AntdApp.useApp();
  const [createForm] = Form.useForm<ExamFormValues>();
  const actionRef = useRef<ActionType>(null);
  const [selectedRows, setSelectedRows] = useState<Exam[]>([]);
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [papersLoading, setPapersLoading] = useState(false);
  const [papers, setPapers] = useState<AdminPaper[]>([]);

  const statusLabelMap: Record<string, string> = useMemo(
    () => ({
      DRAFT: intl.formatMessage({
        id: 'pages.exams.status.DRAFT',
        defaultMessage: '草稿',
      }),
      PUBLISHED: intl.formatMessage({
        id: 'pages.exams.status.PUBLISHED',
        defaultMessage: '已发布',
      }),
      RUNNING: intl.formatMessage({
        id: 'pages.exams.status.RUNNING',
        defaultMessage: '进行中',
      }),
      CLOSED: intl.formatMessage({
        id: 'pages.exams.status.CLOSED',
        defaultMessage: '已结束',
      }),
      ARCHIVED: intl.formatMessage({
        id: 'pages.exams.status.ARCHIVED',
        defaultMessage: '已归档',
      }),
    }),
    [intl],
  );

  const statusValueEnum = useMemo(
    () =>
      Object.fromEntries(
        EXAM_STATUS_KEYS.map((status) => [
          status,
          { text: statusLabelMap[status] },
        ]),
      ),
    [statusLabelMap],
  );

  const closableSelectedRows = selectedRows.filter((record) =>
    ['PUBLISHED', 'RUNNING'].includes(record.status),
  );

  const paperOptions = useMemo(
    () =>
      papers.map((paper) => ({
        label: paperOptionLabel(paper),
        value: paper.id,
      })),
    [papers],
  );

  const loadPapers = async () => {
    setPapersLoading(true);
    try {
      const response = await request<{
        code: number;
        data: AdminPaperPageResponse;
      }>(API_PATHS.admin.papers, {
        method: 'GET',
        skipErrorHandler: true,
        params: { page: 1, page_size: 100 },
      });
      setPapers(response.data?.items || []);
    } catch (error) {
      message.error(
        requestErrorMessage(error) ||
          intl.formatMessage({
            id: 'pages.exams.form.loadError',
            defaultMessage: '加载考试配置失败',
          }),
      );
    } finally {
      setPapersLoading(false);
    }
  };

  const openCreateModal = () => {
    createForm.resetFields();
    createForm.setFieldsValue({ duration_minutes: 60 });
    setCreateOpen(true);
    loadPapers();
  };

  const createExam = async () => {
    const values = await createForm.validateFields();
    setCreating(true);
    try {
      await request(API_PATHS.admin.exams, {
        method: 'POST',
        skipErrorHandler: true,
        data: buildExamPayload(values),
      });
      message.success(
        intl.formatMessage({
          id: 'pages.exams.createSuccess',
          defaultMessage: '考试已创建',
        }),
      );
      setCreateOpen(false);
      actionRef.current?.reload();
    } catch (error) {
      message.error(
        requestErrorMessage(error) ||
          intl.formatMessage({
            id: 'pages.exams.createError',
            defaultMessage: '创建考试失败',
          }),
      );
    } finally {
      setCreating(false);
    }
  };

  const showBatchResult = (result?: BatchActionResult) => {
    if (!result) {
      return;
    }
    if (result.failed_count > 0) {
      modal.warning({
        title: intl.formatMessage({
          id: 'pages.batch.partialFailure',
          defaultMessage: '部分操作失败',
        }),
        content: (
          <div>
            <p>
              {intl.formatMessage(
                {
                  id: 'pages.batch.summary',
                  defaultMessage: '成功 {success} 项，失败 {failed} 项。',
                },
                {
                  success: result.success_count,
                  failed: result.failed_count,
                },
              )}
            </p>
            <ul>
              {result.failures.slice(0, 5).map((failure) => (
                <li key={failure.id}>
                  #{failure.id}: {failure.reason}
                </li>
              ))}
            </ul>
          </div>
        ),
      });
      return;
    }
    message.success(
      intl.formatMessage(
        {
          id: 'pages.batch.success',
          defaultMessage: '成功处理 {count} 项',
        },
        { count: result.success_count },
      ),
    );
  };

  const runBatchCloseExams = () => {
    modal.confirm({
      title: intl.formatMessage({
        id: 'pages.exams.batchCloseConfirmTitle',
        defaultMessage: '确认批量关闭',
      }),
      content: intl.formatMessage(
        {
          id: 'pages.exams.batchCloseConfirmContent',
          defaultMessage: '将关闭已选择的 {count} 场可关闭考试。',
        },
        { count: closableSelectedRows.length },
      ),
      okText: intl.formatMessage({
        id: 'pages.exams.close',
        defaultMessage: '关闭',
      }),
      okType: 'danger',
      cancelText: intl.formatMessage({
        id: 'pages.questions.cancel',
        defaultMessage: '取消',
      }),
      onOk: async () => {
        try {
          const response = await request<{
            code: number;
            data: BatchActionResult;
          }>(API_PATHS.admin.examBatchClose, {
            method: 'POST',
            data: { ids: closableSelectedRows.map((item) => item.id) },
            skipErrorHandler: true,
          });
          showBatchResult(response.data);
          setSelectedRows([]);
          actionRef.current?.reload();
        } catch (error) {
          message.error(
            requestErrorMessage(error) ||
              intl.formatMessage({
                id: 'pages.exams.closeError',
                defaultMessage: '关闭考试失败',
              }),
          );
        }
      },
    });
  };

  const columns: ProColumns<Exam>[] = [
    {
      title: intl.formatMessage({
        id: 'pages.exams.columns.id',
        defaultMessage: 'ID',
      }),
      dataIndex: 'id',
      key: 'id',
      width: 80,
      search: false,
    },
    {
      title: intl.formatMessage({
        id: 'pages.exams.columns.title',
        defaultMessage: '考试名称',
      }),
      dataIndex: 'title',
      key: 'title',
      search: false,
      render: (_: unknown, record) => record.title,
    },
    {
      title: intl.formatMessage({
        id: 'pages.exams.columns.status',
        defaultMessage: '状态',
      }),
      dataIndex: 'status',
      key: 'status',
      valueType: 'select',
      valueEnum: statusValueEnum,
      width: 120,
      search: false,
      render: (_: unknown, record) => (
        <StatusTag tone={statusTones[record.status] || 'neutral'}>
          {statusLabelMap[record.status] || record.status}
        </StatusTag>
      ),
    },
    {
      title: intl.formatMessage({
        id: 'pages.exams.columns.duration',
        defaultMessage: '时长(分钟)',
      }),
      dataIndex: 'duration_minutes',
      key: 'duration_minutes',
      width: 120,
      search: false,
    },
    {
      title: intl.formatMessage({
        id: 'pages.exams.columns.startTime',
        defaultMessage: '开始时间',
      }),
      dataIndex: 'start_time',
      key: 'start_time',
      width: 170,
      search: false,
      render: (_: unknown, record) =>
        record.start_time
          ? dayjs(record.start_time).format('YYYY-MM-DD HH:mm')
          : '-',
    },
    {
      title: intl.formatMessage({
        id: 'pages.exams.columns.endTime',
        defaultMessage: '结束时间',
      }),
      dataIndex: 'end_time',
      key: 'end_time',
      width: 170,
      search: false,
      render: (_: unknown, record) =>
        record.end_time
          ? dayjs(record.end_time).format('YYYY-MM-DD HH:mm')
          : '-',
    },
    {
      title: intl.formatMessage({
        id: 'pages.exams.columns.createdAt',
        defaultMessage: '创建时间',
      }),
      dataIndex: 'created_at',
      key: 'created_at',
      width: 170,
      search: false,
      render: (_: unknown, record) =>
        dayjs(record.created_at).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: intl.formatMessage({
        id: 'common.actions',
        defaultMessage: '操作',
      }),
      key: 'action',
      valueType: 'option',
      width: 120,
      render: (_: unknown, record) =>
        record.status === 'DRAFT'
          ? [
              <div
                key="publish"
                className="exam-actions-cell"
                onClick={(e) => e.stopPropagation()}
              >
                <Dropdown
                  menu={{
                    items: [
                      {
                        key: 'detail',
                        label: intl.formatMessage({
                          id: 'common.view',
                          defaultMessage: '查看',
                        }),
                        onClick: () =>
                          history.push(`/examination/exams/${record.id}`),
                      },
                      {
                        key: 'publish',
                        label: intl.formatMessage({
                          id: 'pages.exams.publish',
                          defaultMessage: '发布',
                        }),
                        onClick: () =>
                          history.push(
                            `/examination/exams/${record.id}/publish`,
                          ),
                      },
                      {
                        key: 'edit',
                        label: intl.formatMessage({
                          id: 'pages.exams.edit',
                          defaultMessage: '编辑',
                        }),
                        onClick: () =>
                          history.push(`/examination/exams/${record.id}/edit`),
                      },
                    ],
                  }}
                  trigger={['click']}
                >
                  <a onClick={(e) => e.preventDefault()}>
                    <Space size={4}>
                      {intl.formatMessage({
                        id: 'pages.exams.more',
                        defaultMessage: '更多',
                      })}
                      <DownOutlined />
                    </Space>
                  </a>
                </Dropdown>
              </div>,
            ]
          : [
              <Button
                key="detail"
                type="link"
                onClick={() => history.push(`/examination/exams/${record.id}`)}
              >
                {intl.formatMessage({
                  id: 'common.view',
                  defaultMessage: '查看',
                })}
              </Button>,
            ],
    },
  ];

  return (
    <PageContainer
      title={intl.formatMessage({
        id: 'menu.examination.exams',
        defaultMessage: '考试管理',
      })}
      content={intl.formatMessage({
        id: 'pages.exams.description',
        defaultMessage:
          '创建和管理考试，设置考试时间、时长和参与用户，支持线上监考。',
      })}
    >
      <ProTable<Exam>
        actionRef={actionRef}
        cardBordered={{
          search: true,
          table: true,
        }}
        columns={columns}
        columnsState={{
          persistenceKey: 'examora-exams-table-columns',
          persistenceType: 'localStorage',
        }}
        columnEmptyText="-"
        dateFormatter="string"
        debounceTime={300}
        defaultSize="middle"
        headerTitle={intl.formatMessage({
          id: 'pages.exams.listTitle',
          defaultMessage: '考试列表',
        })}
        options={{
          density: true,
          fullScreen: false,
          reload: true,
          setting: true,
        }}
        rowKey="id"
        rowSelection={{
          selectedRowKeys: selectedRows.map((item) => item.id),
          onChange: (_, rows) => setSelectedRows(rows),
        }}
        search={false}
        request={async (params) => {
          try {
            const response = await request<{
              code: number;
              data: { items: Exam[]; total: number };
            }>(API_PATHS.admin.exams, {
              skipErrorHandler: true,
              params: {
                page: params.current,
                page_size: params.pageSize,
              },
            });
            return {
              data: response.data?.items || [],
              total: response.data?.total || 0,
              success: true,
            };
          } catch (_error) {
            message.error(
              intl.formatMessage({
                id: 'pages.exams.fetchError',
                defaultMessage: '获取考试列表失败',
              }),
            );
            return { data: [], total: 0, success: false };
          }
        }}
        toolBarRender={() => [
          <Button
            key="create"
            type="primary"
            icon={<PlusOutlined />}
            onClick={openCreateModal}
          >
            {intl.formatMessage({
              id: 'pages.exams.create',
              defaultMessage: '创建考试',
            })}
          </Button>,
        ]}
      />
      <Modal
        width={640}
        title={intl.formatMessage({
          id: 'pages.exams.create',
          defaultMessage: '创建考试',
        })}
        open={createOpen}
        okText={intl.formatMessage({
          id: 'pages.exams.create',
          defaultMessage: '创建考试',
        })}
        cancelText={intl.formatMessage({
          id: 'common.cancel',
          defaultMessage: '取消',
        })}
        confirmLoading={creating}
        destroyOnHidden
        onOk={createExam}
        onCancel={() => setCreateOpen(false)}
      >
        <Form<ExamFormValues> form={createForm} layout="vertical">
          <Form.Item
            name="title"
            label={intl.formatMessage({
              id: 'pages.exams.form.title',
              defaultMessage: '考试名称',
            })}
            rules={[
              {
                required: true,
                whitespace: true,
                message: intl.formatMessage({
                  id: 'pages.exams.form.titleRequired',
                  defaultMessage: '请输入考试名称',
                }),
              },
            ]}
          >
            <Input maxLength={120} />
          </Form.Item>
          <div className="exam-create-grid">
            <Form.Item
              name="paper_id"
              label={intl.formatMessage({
                id: 'pages.exams.form.paper',
                defaultMessage: '关联试卷',
              })}
              rules={[
                {
                  required: true,
                  message: intl.formatMessage({
                    id: 'pages.exams.form.paperRequired',
                    defaultMessage: '请选择试卷',
                  }),
                },
              ]}
            >
              <Select
                loading={papersLoading}
                options={paperOptions}
                optionFilterProp="label"
                showSearch
                placeholder={intl.formatMessage({
                  id: 'pages.exams.form.paperPlaceholder',
                  defaultMessage: '选择一份试卷',
                })}
              />
            </Form.Item>
            <Form.Item
              label={intl.formatMessage({
                id: 'pages.exams.form.duration',
                defaultMessage: '默认时长(分钟)',
              })}
              required
            >
              <Space.Compact style={{ width: '100%' }}>
                <Form.Item
                  name="duration_minutes"
                  noStyle
                  rules={[
                    {
                      required: true,
                      message: intl.formatMessage({
                        id: 'pages.exams.form.durationRequired',
                        defaultMessage: '请输入考试时长',
                      }),
                    },
                  ]}
                >
                  <InputNumber min={1} max={1440} style={{ width: '100%' }} />
                </Form.Item>
                <Input
                  aria-label={intl.formatMessage({
                    id: 'pages.exams.form.durationUnit',
                    defaultMessage: '分钟',
                  })}
                  disabled
                  value={intl.formatMessage({
                    id: 'pages.exams.form.durationUnit',
                    defaultMessage: '分钟',
                  })}
                  style={{ width: 56 }}
                />
              </Space.Compact>
            </Form.Item>
          </div>
          <Form.Item
            name="description"
            label={intl.formatMessage({
              id: 'pages.exams.form.descriptionField',
              defaultMessage: '考试说明',
            })}
          >
            <Input.TextArea rows={3} maxLength={1000} showCount />
          </Form.Item>
        </Form>
      </Modal>
      {selectedRows.length > 0 && (
        <FooterToolbar
          extra={intl.formatMessage(
            {
              id: 'pages.batch.selected',
              defaultMessage: '已选择 {count} 项',
            },
            { count: selectedRows.length },
          )}
        >
          <Button
            danger
            disabled={closableSelectedRows.length === 0}
            icon={<StopOutlined />}
            onClick={runBatchCloseExams}
          >
            {intl.formatMessage({
              id: 'pages.exams.close',
              defaultMessage: '关闭',
            })}
          </Button>
        </FooterToolbar>
      )}
    </PageContainer>
  );
};

const ExamList: React.FC = () => (
  <AntdApp>
    <ExamListContent />
  </AntdApp>
);

export default ExamList;
