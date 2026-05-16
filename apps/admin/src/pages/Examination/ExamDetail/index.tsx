import {
  DeleteOutlined,
  EyeOutlined,
  PlusOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import {
  PageContainer,
  type ProColumns,
  ProTable,
} from '@ant-design/pro-components';
import type {
  AdminClientEvent,
  AdminClientEventPageResponse,
  AdminExam,
  AdminExamAssignment,
  AdminExamAssignmentListResponse,
  AdminExamResult,
  AdminExamResultPageResponse,
  AdminExamSession,
  AdminExamSessionListResponse,
  AdminQuestionResult,
  AdminUser,
  AdminUserGroup,
  AdminUserGroupStudentsResponse,
  AdminUserGroupTreeResponse,
  AdminUserPageResponse,
  BatchResult,
} from '@examora/types';
import { API_PATHS } from '@examora/types';
import { history, useIntl } from '@umijs/max';
import {
  App as AntdApp,
  Button,
  Descriptions,
  Drawer,
  Empty,
  Modal,
  Segmented,
  Select,
  Space,
  Spin,
  Table,
  Tabs,
  Tag,
  Tree,
  Typography,
} from 'antd';
import type { DataNode } from 'antd/es/tree';
import dayjs from 'dayjs';
import React, { useEffect, useMemo, useState } from 'react';
import {
  formatScore,
  resultStatusTone,
} from '@/pages/Assessment/Results/Submissions/model';
import { fetchEnvelope } from '@/utils/apiEnvelope';
import { requestErrorMessage } from '@/utils/request';
import {
  canRemoveCandidate,
  examAssignmentsPath,
  examCandidatePath,
  examCandidatesPath,
  examDetailPath,
  examEventsPath,
  examResultPath,
  examResultsPath,
  examSessionsPath,
  examStatusTone,
  sessionStatusTone,
} from './model';

const { Text } = Typography;

const userGroupTreePath = '/api/v1/user-groups/tree';
const userGroupStudentsPath = (groupID: number | string) =>
  `/api/v1/user-groups/${groupID}/students`;

const toTreeData = (groups: AdminUserGroup[]): DataNode[] =>
  groups.map((group) => ({
    key: String(group.id),
    title: group.name,
    children: toTreeData(group.children || []),
  }));

const ExamDetailContent: React.FC = () => {
  const intl = useIntl();
  const examID = window.location.pathname.match(
    /\/examination\/exams\/([^/]+)/,
  )?.[1];
  const { message, modal } = AntdApp.useApp();
  const [exam, setExam] = useState<AdminExam | null>(null);
  const [examLoading, setExamLoading] = useState(false);
  const [sessions, setSessions] = useState<AdminExamSession[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [assignments, setAssignments] = useState<AdminExamAssignment[]>([]);
  const [results, setResults] = useState<AdminExamResult[]>([]);
  const [resultsTotal, setResultsTotal] = useState(0);
  const [resultsLoading, setResultsLoading] = useState(false);
  const [events, setEvents] = useState<AdminClientEvent[]>([]);
  const [eventsTotal, setEventsTotal] = useState(0);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [userGroups, setUserGroups] = useState<AdminUserGroup[]>([]);
  const [assignOpen, setAssignOpen] = useState(false);
  const [assignMode, setAssignMode] = useState<'users' | 'groups'>('users');
  const [selectedUserIDs, setSelectedUserIDs] = useState<number[]>([]);
  const [selectedGroupIDs, setSelectedGroupIDs] = useState<number[]>([]);
  const [groupCoverageCount, setGroupCoverageCount] = useState(0);
  const [assigning, setAssigning] = useState(false);
  const [resultDetail, setResultDetail] = useState<AdminExamResult | null>(
    null,
  );
  const [resultDetailOpen, setResultDetailOpen] = useState(false);
  const [resultDetailLoading, setResultDetailLoading] = useState(false);
  const [eventDetail, setEventDetail] = useState<AdminClientEvent | null>(null);

  const loadExam = React.useCallback(async () => {
    if (!examID) return;
    setExamLoading(true);
    try {
      setExam(await fetchEnvelope<AdminExam>(examDetailPath(examID)));
    } catch (error) {
      message.error(
        requestErrorMessage(error) ||
          intl.formatMessage({
            id: 'pages.examDetail.loadError',
            defaultMessage: '加载考试详情失败',
          }),
      );
    } finally {
      setExamLoading(false);
    }
  }, [examID, intl, message]);

  const loadSessions = React.useCallback(async () => {
    if (!examID) return;
    setSessionsLoading(true);
    try {
      const data = await fetchEnvelope<AdminExamSessionListResponse>(
        examSessionsPath(examID),
      );
      setSessions(data.items || []);
    } catch (error) {
      message.error(
        requestErrorMessage(error) ||
          intl.formatMessage({
            id: 'pages.examDetail.sessionsLoadError',
            defaultMessage: '加载用户列表失败',
          }),
      );
    } finally {
      setSessionsLoading(false);
    }
  }, [examID, intl, message]);

  const loadResults = React.useCallback(async () => {
    if (!examID) return;
    setResultsLoading(true);
    try {
      const data = await fetchEnvelope<AdminExamResultPageResponse>(
        `${examResultsPath(examID)}?page=1&page_size=100`,
      );
      setResults(data.items || []);
      setResultsTotal(data.total || 0);
    } catch (error) {
      message.error(
        requestErrorMessage(error) ||
          intl.formatMessage({
            id: 'pages.examDetail.resultsLoadError',
            defaultMessage: '加载答卷失败',
          }),
      );
    } finally {
      setResultsLoading(false);
    }
  }, [examID, intl, message]);

  const loadEvents = React.useCallback(async () => {
    if (!examID) return;
    setEventsLoading(true);
    try {
      const data = await fetchEnvelope<AdminClientEventPageResponse>(
        `${examEventsPath(examID)}?page=1&page_size=100`,
      );
      setEvents(data.items || []);
      setEventsTotal(data.total || 0);
    } catch (error) {
      message.error(
        requestErrorMessage(error) ||
          intl.formatMessage({
            id: 'pages.examDetail.eventsLoadError',
            defaultMessage: '加载审计事件失败',
          }),
      );
    } finally {
      setEventsLoading(false);
    }
  }, [examID, intl, message]);

  const loadUsers = React.useCallback(async () => {
    try {
      const data = await fetchEnvelope<AdminUserPageResponse>(
        `${API_PATHS.admin.users}?page=1&page_size=200`,
      );
      setUsers(data.items || []);
    } catch (error) {
      message.error(
        requestErrorMessage(error) ||
          intl.formatMessage({
            id: 'pages.examDetail.usersLoadError',
            defaultMessage: '加载用户失败',
          }),
      );
    }
  }, [intl, message]);

  const loadUserGroups = React.useCallback(async () => {
    try {
      const data =
        await fetchEnvelope<AdminUserGroupTreeResponse>(userGroupTreePath);
      setUserGroups(data.items || []);
    } catch (error) {
      message.error(
        requestErrorMessage(error) ||
          intl.formatMessage({
            id: 'pages.examDetail.groupsLoadError',
            defaultMessage: '加载用户组失败',
          }),
      );
    }
  }, [intl, message]);

  const loadAssignments = React.useCallback(async () => {
    if (!examID) return;
    try {
      const data = await fetchEnvelope<AdminExamAssignmentListResponse>(
        examAssignmentsPath(examID),
      );
      setAssignments(data.items || []);
    } catch (_error) {
      setAssignments([]);
    }
  }, [examID]);

  const refreshAll = React.useCallback(() => {
    loadExam();
    loadSessions();
    loadAssignments();
    loadResults();
    loadEvents();
  }, [loadAssignments, loadExam, loadEvents, loadResults, loadSessions]);

  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  const userMap = useMemo(() => {
    const map = new Map<number, AdminUser>();
    users.forEach((user) => {
      map.set(user.id, user);
    });
    return map;
  }, [users]);

  const assignedUserIDs = useMemo(
    () => new Set(sessions.map((session) => session.user_id)),
    [sessions],
  );

  const assignmentSourceByUserID = useMemo(() => {
    const map = new Map<number, string>();
    assignments.forEach((assignment) => {
      if (assignment.target_type === 'USER') {
        map.set(
          assignment.target_id,
          intl.formatMessage({
            id: 'pages.examDetail.directAssignment',
            defaultMessage: '直接分配',
          }),
        );
      }
    });
    return map;
  }, [assignments, intl]);

  const userOptions = useMemo(
    () =>
      users
        .filter((user) => !assignedUserIDs.has(user.id))
        .map((user) => ({
          label: user.display_name
            ? `${user.display_name} (${user.username})`
            : user.username,
          value: user.id,
        })),
    [assignedUserIDs, users],
  );

  const openAssign = async () => {
    setSelectedUserIDs([]);
    setSelectedGroupIDs([]);
    setGroupCoverageCount(0);
    setAssignMode('users');
    setAssignOpen(true);
    await Promise.all([loadUsers(), loadUserGroups()]);
  };

  const assignCandidates = async () => {
    if (
      !examID ||
      (assignMode === 'users' && selectedUserIDs.length === 0) ||
      (assignMode === 'groups' && selectedGroupIDs.length === 0)
    ) {
      return;
    }
    setAssigning(true);
    try {
      await fetchEnvelope<BatchResult>(
        assignMode === 'users'
          ? examCandidatesPath(examID)
          : examAssignmentsPath(examID),
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(
            assignMode === 'users'
              ? { ids: selectedUserIDs }
              : { user_group_ids: selectedGroupIDs },
          ),
        },
      );
      message.success(
        intl.formatMessage({
          id: 'pages.examDetail.assignSuccess',
          defaultMessage: '用户已分配',
        }),
      );
      setAssignOpen(false);
      loadSessions();
      loadAssignments();
    } catch (error) {
      message.error(
        requestErrorMessage(error) ||
          intl.formatMessage({
            id: 'pages.examDetail.assignError',
            defaultMessage: '分配用户失败',
          }),
      );
    } finally {
      setAssigning(false);
    }
  };

  const updateGroupCoverage = async (groupIDs: number[]) => {
    if (!groupIDs.length) {
      setGroupCoverageCount(0);
      return;
    }
    const responses = await Promise.all(
      groupIDs.map((groupID) =>
        fetchEnvelope<AdminUserGroupStudentsResponse>(
          `${userGroupStudentsPath(groupID)}?include_children=true`,
        ),
      ),
    );
    const covered = new Set<number>();
    responses.forEach((response) => {
      response.ids?.forEach((id) => {
        covered.add(id);
      });
    });
    setGroupCoverageCount(covered.size);
  };

  const removeCandidate = (session: AdminExamSession) => {
    if (!examID) return;
    modal.confirm({
      title: intl.formatMessage({
        id: 'pages.examDetail.removeCandidateTitle',
        defaultMessage: '移除用户',
      }),
      content: intl.formatMessage({
        id: 'pages.examDetail.removeCandidateContent',
        defaultMessage: '仅未开始考试的用户可以移除，确定继续？',
      }),
      onOk: async () => {
        await fetchEnvelope<void>(examCandidatePath(examID, session.user_id), {
          method: 'DELETE',
        });
        loadSessions();
      },
    });
  };

  const openResultDetail = async (record: AdminExamResult) => {
    setResultDetailOpen(true);
    setResultDetailLoading(true);
    try {
      setResultDetail(
        await fetchEnvelope<AdminExamResult>(examResultPath(record.id)),
      );
    } catch (error) {
      message.error(
        requestErrorMessage(error) ||
          intl.formatMessage({
            id: 'pages.examDetail.resultDetailError',
            defaultMessage: '加载答卷详情失败',
          }),
      );
    } finally {
      setResultDetailLoading(false);
    }
  };

  const sessionColumns: ProColumns<AdminExamSession>[] = [
    {
      title: intl.formatMessage({
        id: 'pages.examDetail.user',
        defaultMessage: '用户',
      }),
      dataIndex: 'user_id',
      render: (_, record) => {
        const user = userMap.get(record.user_id);
        return user?.display_name || user?.username || record.user_id;
      },
    },
    {
      title: intl.formatMessage({
        id: 'pages.examDetail.status',
        defaultMessage: '状态',
      }),
      dataIndex: 'status',
      render: (_, record) => (
        <Tag color={sessionStatusTone(record.status)}>{record.status}</Tag>
      ),
    },
    {
      title: intl.formatMessage({
        id: 'pages.examDetail.assignSource',
        defaultMessage: '来源',
      }),
      width: 120,
      render: (_, record) =>
        assignmentSourceByUserID.get(record.user_id) ||
        intl.formatMessage({
          id: 'pages.examDetail.userGroup',
          defaultMessage: '用户组',
        }),
    },
    {
      title: intl.formatMessage({
        id: 'pages.examDetail.startedAt',
        defaultMessage: '开始时间',
      }),
      dataIndex: 'started_at',
      render: (_, record) =>
        record.started_at
          ? dayjs(record.started_at).format('YYYY-MM-DD HH:mm:ss')
          : '-',
    },
    {
      title: intl.formatMessage({
        id: 'pages.examDetail.submittedAt',
        defaultMessage: '交卷时间',
      }),
      dataIndex: 'submitted_at',
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
      width: 120,
      render: (_, record) => [
        <Button
          key="remove"
          type="link"
          danger
          disabled={!canRemoveCandidate(record)}
          icon={<DeleteOutlined />}
          onClick={() => removeCandidate(record)}
        >
          {intl.formatMessage({ id: 'common.delete', defaultMessage: '删除' })}
        </Button>,
      ],
    },
  ];

  const resultColumns: ProColumns<AdminExamResult>[] = [
    { title: 'ID', dataIndex: 'id', width: 80 },
    {
      title: intl.formatMessage({
        id: 'pages.examDetail.user',
        defaultMessage: '用户',
      }),
      dataIndex: 'user_id',
    },
    {
      title: intl.formatMessage({
        id: 'pages.examDetail.status',
        defaultMessage: '状态',
      }),
      dataIndex: 'status',
      render: (_, record) => (
        <Tag color={resultStatusTone(record.status)}>{record.status}</Tag>
      ),
    },
    {
      title: intl.formatMessage({
        id: 'pages.examDetail.score',
        defaultMessage: '成绩',
      }),
      render: (_, record) => formatScore(record.score, record.max_score),
    },
    {
      title: intl.formatMessage({
        id: 'pages.examDetail.submittedAt',
        defaultMessage: '交卷时间',
      }),
      dataIndex: 'submitted_at',
      render: (_, record) =>
        dayjs(record.submitted_at).format('YYYY-MM-DD HH:mm:ss'),
    },
    {
      title: intl.formatMessage({
        id: 'common.actions',
        defaultMessage: '操作',
      }),
      valueType: 'option',
      render: (_, record) => [
        <Button
          key="detail"
          type="link"
          icon={<EyeOutlined />}
          onClick={() => openResultDetail(record)}
        >
          {intl.formatMessage({ id: 'common.view', defaultMessage: '查看' })}
        </Button>,
      ],
    },
  ];

  const eventColumns: ProColumns<AdminClientEvent>[] = [
    { title: 'ID', dataIndex: 'id', width: 80 },
    {
      title: intl.formatMessage({
        id: 'pages.examDetail.user',
        defaultMessage: '用户',
      }),
      dataIndex: 'user_id',
    },
    { title: 'Device', dataIndex: 'device_id' },
    { title: 'Type', dataIndex: 'event_type' },
    {
      title: intl.formatMessage({
        id: 'pages.examDetail.createdAt',
        defaultMessage: '时间',
      }),
      dataIndex: 'created_at',
      render: (_, record) =>
        dayjs(record.created_at).format('YYYY-MM-DD HH:mm:ss'),
    },
    {
      title: intl.formatMessage({
        id: 'common.actions',
        defaultMessage: '操作',
      }),
      valueType: 'option',
      render: (_, record) => [
        <Button key="detail" type="link" onClick={() => setEventDetail(record)}>
          {intl.formatMessage({ id: 'common.view', defaultMessage: '查看' })}
        </Button>,
      ],
    },
  ];

  const questionRows: AdminQuestionResult[] = useMemo(() => {
    if (!resultDetail) return [];
    if (resultDetail.sections?.length) {
      return resultDetail.sections.flatMap(
        (section) => section.questions || [],
      );
    }
    return resultDetail.questions || [];
  }, [resultDetail]);

  return (
    <PageContainer
      title={
        exam?.title ||
        intl.formatMessage({
          id: 'pages.examDetail.title',
          defaultMessage: '考试详情',
        })
      }
      onBack={() => history.push('/examination/exams')}
      extra={[
        <Button key="refresh" icon={<ReloadOutlined />} onClick={refreshAll}>
          {intl.formatMessage({ id: 'common.refresh', defaultMessage: '刷新' })}
        </Button>,
      ]}
    >
      <Spin spinning={examLoading}>
        <Tabs
          items={[
            {
              key: 'overview',
              label: intl.formatMessage({
                id: 'pages.examDetail.overview',
                defaultMessage: '概览',
              }),
              children: exam ? (
                <Descriptions bordered column={2}>
                  <Descriptions.Item label="ID">{exam.id}</Descriptions.Item>
                  <Descriptions.Item
                    label={intl.formatMessage({
                      id: 'pages.examDetail.status',
                      defaultMessage: '状态',
                    })}
                  >
                    <Tag color={examStatusTone(exam.status)}>{exam.status}</Tag>
                  </Descriptions.Item>
                  <Descriptions.Item
                    label={intl.formatMessage({
                      id: 'pages.examDetail.duration',
                      defaultMessage: '时长',
                    })}
                  >
                    {exam.duration_minutes} min
                  </Descriptions.Item>
                  <Descriptions.Item
                    label={intl.formatMessage({
                      id: 'pages.examDetail.paper',
                      defaultMessage: '试卷',
                    })}
                  >
                    {exam.paper_id || '-'}
                  </Descriptions.Item>
                  <Descriptions.Item
                    label={intl.formatMessage({
                      id: 'pages.examDetail.startTime',
                      defaultMessage: '开始时间',
                    })}
                  >
                    {exam.start_time
                      ? dayjs(exam.start_time).format('YYYY-MM-DD HH:mm:ss')
                      : '-'}
                  </Descriptions.Item>
                  <Descriptions.Item
                    label={intl.formatMessage({
                      id: 'pages.examDetail.endTime',
                      defaultMessage: '结束时间',
                    })}
                  >
                    {exam.end_time
                      ? dayjs(exam.end_time).format('YYYY-MM-DD HH:mm:ss')
                      : '-'}
                  </Descriptions.Item>
                  <Descriptions.Item
                    span={2}
                    label={intl.formatMessage({
                      id: 'pages.examDetail.description',
                      defaultMessage: '说明',
                    })}
                  >
                    {exam.description || '-'}
                  </Descriptions.Item>
                </Descriptions>
              ) : (
                <Empty />
              ),
            },
            {
              key: 'candidates',
              label: intl.formatMessage({
                id: 'pages.examDetail.candidates',
                defaultMessage: '用户',
              }),
              children: (
                <ProTable<AdminExamSession>
                  rowKey="id"
                  columns={sessionColumns}
                  dataSource={sessions}
                  loading={sessionsLoading}
                  search={false}
                  pagination={false}
                  options={{
                    reload: loadSessions,
                    density: true,
                    setting: true,
                  }}
                  toolBarRender={() => [
                    <Button
                      key="assign"
                      type="primary"
                      icon={<PlusOutlined />}
                      onClick={openAssign}
                    >
                      {intl.formatMessage({
                        id: 'pages.examDetail.assign',
                        defaultMessage: '分配用户',
                      })}
                    </Button>,
                  ]}
                />
              ),
            },
            {
              key: 'results',
              label: intl.formatMessage({
                id: 'pages.examDetail.results',
                defaultMessage: '答卷',
              }),
              children: (
                <ProTable<AdminExamResult>
                  rowKey="id"
                  columns={resultColumns}
                  dataSource={results}
                  loading={resultsLoading}
                  search={false}
                  pagination={{ total: resultsTotal, pageSize: 20 }}
                  options={{
                    reload: loadResults,
                    density: true,
                    setting: true,
                  }}
                />
              ),
            },
            {
              key: 'events',
              label: intl.formatMessage({
                id: 'pages.examDetail.events',
                defaultMessage: '审计事件',
              }),
              children: (
                <ProTable<AdminClientEvent>
                  rowKey="id"
                  columns={eventColumns}
                  dataSource={events}
                  loading={eventsLoading}
                  search={false}
                  pagination={{ total: eventsTotal, pageSize: 20 }}
                  options={{ reload: loadEvents, density: true, setting: true }}
                />
              ),
            },
          ]}
        />
      </Spin>
      <Modal
        title={intl.formatMessage({
          id: 'pages.examDetail.assign',
          defaultMessage: '分配用户',
        })}
        width={640}
        open={assignOpen}
        confirmLoading={assigning}
        onCancel={() => setAssignOpen(false)}
        onOk={assignCandidates}
      >
        <div style={{ display: 'grid', gap: 14 }}>
          <Segmented
            block
            value={assignMode}
            onChange={(value) => setAssignMode(value as 'users' | 'groups')}
            options={[
              {
                label: intl.formatMessage({
                  id: 'pages.examDetail.assignByUser',
                  defaultMessage: '按用户',
                }),
                value: 'users',
              },
              {
                label: intl.formatMessage({
                  id: 'pages.examDetail.assignByGroup',
                  defaultMessage: '按用户组',
                }),
                value: 'groups',
              },
            ]}
          />
          {assignMode === 'users' ? (
            <Select
              mode="multiple"
              showSearch
              allowClear
              style={{ width: '100%' }}
              options={userOptions}
              value={selectedUserIDs}
              onChange={setSelectedUserIDs}
              optionFilterProp="label"
              placeholder={intl.formatMessage({
                id: 'pages.examDetail.assignPlaceholder',
                defaultMessage: '选择未分配用户',
              })}
            />
          ) : (
            <div style={{ maxHeight: 320, overflow: 'auto' }}>
              <Tree
                checkable
                checkStrictly
                defaultExpandAll
                treeData={toTreeData(userGroups)}
                checkedKeys={selectedGroupIDs.map(String)}
                onCheck={(checked) => {
                  const keys = Array.isArray(checked)
                    ? checked
                    : checked.checked;
                  const ids = keys.map((key) => Number(key));
                  setSelectedGroupIDs(ids);
                  updateGroupCoverage(ids).catch(() =>
                    setGroupCoverageCount(0),
                  );
                }}
              />
              <Text type="secondary">
                {intl.formatMessage(
                  {
                    id: 'pages.examDetail.groupCoverage',
                    defaultMessage: '预计覆盖 {count} 名用户',
                  },
                  { count: groupCoverageCount },
                )}
              </Text>
            </div>
          )}
        </div>
      </Modal>
      <Drawer
        size="large"
        open={resultDetailOpen}
        title={intl.formatMessage({
          id: 'pages.examDetail.resultDetail',
          defaultMessage: '答卷详情',
        })}
        onClose={() => setResultDetailOpen(false)}
      >
        <Spin spinning={resultDetailLoading}>
          {resultDetail && (
            <Space direction="vertical" size={16} style={{ width: '100%' }}>
              <Descriptions bordered size="small" column={2}>
                <Descriptions.Item label="ID">
                  {resultDetail.id}
                </Descriptions.Item>
                <Descriptions.Item
                  label={intl.formatMessage({
                    id: 'pages.examDetail.user',
                    defaultMessage: '用户',
                  })}
                >
                  {resultDetail.user_id}
                </Descriptions.Item>
                <Descriptions.Item
                  label={intl.formatMessage({
                    id: 'pages.examDetail.status',
                    defaultMessage: '状态',
                  })}
                >
                  <Tag color={resultStatusTone(resultDetail.status)}>
                    {resultDetail.status}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item
                  label={intl.formatMessage({
                    id: 'pages.examDetail.score',
                    defaultMessage: '成绩',
                  })}
                >
                  {formatScore(resultDetail.score, resultDetail.max_score)}
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
                    render: (status) => <Tag>{status}</Tag>,
                  },
                  {
                    title: 'Score',
                    render: (_, row) => formatScore(row.score, row.max_score),
                  },
                  {
                    title: 'Result',
                    render: (_, row) =>
                      row.result ? (
                        <Text code>{JSON.stringify(row.result)}</Text>
                      ) : (
                        '-'
                      ),
                  },
                ]}
              />
            </Space>
          )}
        </Spin>
      </Drawer>
      <Drawer
        size={520}
        open={!!eventDetail}
        title={intl.formatMessage({
          id: 'pages.examDetail.eventDetail',
          defaultMessage: '事件详情',
        })}
        onClose={() => setEventDetail(null)}
      >
        {eventDetail && (
          <Descriptions bordered size="small" column={1}>
            <Descriptions.Item label="ID">{eventDetail.id}</Descriptions.Item>
            <Descriptions.Item label="User">
              {eventDetail.user_id}
            </Descriptions.Item>
            <Descriptions.Item label="Device">
              {eventDetail.device_id || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="Type">
              {eventDetail.event_type}
            </Descriptions.Item>
            <Descriptions.Item label="Payload">
              <Text code>{JSON.stringify(eventDetail.payload)}</Text>
            </Descriptions.Item>
          </Descriptions>
        )}
      </Drawer>
    </PageContainer>
  );
};

const ExamDetail: React.FC = () => (
  <AntdApp>
    <ExamDetailContent />
  </AntdApp>
);

export default ExamDetail;
