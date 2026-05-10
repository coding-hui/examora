import {
  ClockCircleOutlined,
  DatabaseOutlined,
  FileTextOutlined,
  SafetyOutlined,
  TeamOutlined,
  TrophyOutlined,
} from "@ant-design/icons";
import { PageContainer } from "@ant-design/pro-components";
import { Button, Card, Result, Space, Typography } from "antd";
import React from "react";

const moduleMeta: Record<
  string,
  {
    title: string;
    description: string;
    icon: React.ReactNode;
  }
> = {
  "/library/questions": {
    title: "题库管理",
    description: "题目列表、题型配置、答案与解析维护即将接入。",
    icon: <DatabaseOutlined />,
  },
  "/library/programming": {
    title: "编程题与测试用例",
    description: "编程题模板、样例用例、隐藏用例和运行限制将在这里管理。",
    icon: <DatabaseOutlined />,
  },
  "/papers": {
    title: "试卷管理",
    description: "组卷、题目排序、分值配置和试卷状态流转即将接入。",
    icon: <FileTextOutlined />,
  },
  "/exams/create": {
    title: "创建考试",
    description: "考试基本信息、试卷绑定和发布前配置将在这里接入。",
    icon: <FileTextOutlined />,
  },
  "/candidates": {
    title: "考生管理",
    description: "考生账号、考试授权、分组和导入导出能力即将接入。",
    icon: <TeamOutlined />,
  },
  "/proctoring/events": {
    title: "监考审计",
    description: "桌面端事件、设备绑定、异常行为记录将在这里查看。",
    icon: <SafetyOutlined />,
  },
  "/results/submissions": {
    title: "提交记录",
    description: "候选人答卷、编程提交和判分状态将在这里汇总。",
    icon: <TrophyOutlined />,
  },
  "/results/judge-tasks": {
    title: "判题任务",
    description: "异步判题任务、重试状态和沙箱结果将在这里跟踪。",
    icon: <TrophyOutlined />,
  },
};

const fallbackMeta = {
  title: "模块建设中",
  description: "该管理模块已预留导航入口，业务页面会在后续迭代接入。",
  icon: <ClockCircleOutlined />,
};

const ComingSoon: React.FC = () => {
  const meta = moduleMeta[window.location.pathname] ?? fallbackMeta;

  return (
    <PageContainer title={meta.title}>
      <Card>
        <Result
          icon={meta.icon}
          title={meta.title}
          subTitle={meta.description}
          extra={
            <Space>
              <Button type="primary" href="/dashboard">
                返回工作台
              </Button>
              <Button href="/exams">查看考试管理</Button>
            </Space>
          }
        />
        <Typography.Paragraph type="secondary" style={{ textAlign: "center" }}>
          当前入口用于固定后台信息架构，避免后续业务页面上线时反复调整主菜单。
        </Typography.Paragraph>
      </Card>
    </PageContainer>
  );
};

export default ComingSoon;
