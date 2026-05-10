import { PlusOutlined } from "@ant-design/icons";
import { PageContainer } from "@ant-design/pro-components";
import { request, useIntl } from "@umijs/max";
import { App as AntdApp, Button, Card, Table, Tag } from "antd";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import React, { useEffect, useState } from "react";

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

const ExamList: React.FC = () => {
  const intl = useIntl();
  const { message } = AntdApp.useApp();
  const [loading, setLoading] = useState(false);
  const [exams, setExams] = useState<Exam[]>([]);
  const [total, setTotal] = useState(0);

  const fetchExams = async () => {
    setLoading(true);
    try {
      const response = await request<{
        code: number;
        data: { items: Exam[]; total: number };
      }>("/api/admin/exams", { params: { page: 1, page_size: 100 } });
      if (response.data) {
        setExams(response.data.items || []);
        setTotal(response.data.total || 0);
      }
    } catch (_error) {
      message.error(
        intl.formatMessage({
          id: "pages.exams.fetchError",
          defaultMessage: "获取考试列表失败",
        }),
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExams();
  }, []);

  const statusColors: Record<string, string> = {
    DRAFT: "default",
    PUBLISHED: "green",
    RUNNING: "blue",
    CLOSED: "red",
    ARCHIVED: "gray",
  };

  const columns: ColumnsType<Exam> = [
    {
      title: intl.formatMessage({
        id: "pages.exams.columns.id",
        defaultMessage: "ID",
      }),
      dataIndex: "id",
      key: "id",
      width: 80,
    },
    {
      title: intl.formatMessage({
        id: "pages.exams.columns.title",
        defaultMessage: "考试名称",
      }),
      dataIndex: "title",
      key: "title",
    },
    {
      title: intl.formatMessage({
        id: "pages.exams.columns.status",
        defaultMessage: "状态",
      }),
      dataIndex: "status",
      key: "status",
      render: (status: string) => (
        <Tag color={statusColors[status] || "default"}>{status}</Tag>
      ),
    },
    {
      title: intl.formatMessage({
        id: "pages.exams.columns.duration",
        defaultMessage: "时长(分钟)",
      }),
      dataIndex: "duration_minutes",
      key: "duration_minutes",
      width: 100,
    },
    {
      title: intl.formatMessage({
        id: "pages.exams.columns.startTime",
        defaultMessage: "开始时间",
      }),
      dataIndex: "start_time",
      key: "start_time",
      render: (time: string) =>
        time ? dayjs(time).format("YYYY-MM-DD HH:mm") : "-",
    },
    {
      title: intl.formatMessage({
        id: "pages.exams.columns.endTime",
        defaultMessage: "结束时间",
      }),
      dataIndex: "end_time",
      key: "end_time",
      render: (time: string) =>
        time ? dayjs(time).format("YYYY-MM-DD HH:mm") : "-",
    },
    {
      title: intl.formatMessage({
        id: "pages.exams.columns.createdAt",
        defaultMessage: "创建时间",
      }),
      dataIndex: "created_at",
      key: "created_at",
      render: (time: string) => dayjs(time).format("YYYY-MM-DD HH:mm"),
    },
    {
      title: intl.formatMessage({
        id: "common.actions",
        defaultMessage: "操作",
      }),
      key: "action",
      width: 120,
      render: (_, record) =>
        record.status === "DRAFT" && (
          <Button
            type="link"
            onClick={() =>
              (window.location.href = `/exams/${record.id}/publish`)
            }
          >
            {intl.formatMessage({
              id: "pages.exams.publish",
              defaultMessage: "发布",
            })}
          </Button>
        ),
    },
  ];

  return (
    <PageContainer
      title={intl.formatMessage({
        id: "menu.exams",
        defaultMessage: "考试管理",
      })}
      content={intl.formatMessage({
        id: "pages.exams.description",
        defaultMessage:
          "创建和管理考试，设置考试时间、时长和参与考生，支持线上监考。",
      })}
    >
      <Card>
        <div className="mb-4 flex justify-between">
          <h2>
            {intl.formatMessage({
              id: "pages.exams.listTitle",
              defaultMessage: "考试列表",
            })}
          </h2>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => (window.location.href = "/exams/create")}
          >
            {intl.formatMessage({
              id: "pages.exams.create",
              defaultMessage: "创建考试",
            })}
          </Button>
        </div>
        <Table
          columns={columns}
          dataSource={exams}
          loading={loading}
          rowKey="id"
          pagination={{ total, pageSize: 100 }}
        />
      </Card>
    </PageContainer>
  );
};

export default ExamList;
