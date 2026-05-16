import {
  ClockCircleOutlined,
  DatabaseOutlined,
  FileTextOutlined,
  SafetyOutlined,
  TeamOutlined,
  TrophyOutlined,
} from '@ant-design/icons';
import { PageContainer } from '@ant-design/pro-components';
import { useIntl } from '@umijs/max';
import { Button, Card, Result, Space, Typography } from 'antd';
import React from 'react';

const moduleMeta: Record<
  string,
  {
    titleId: string;
    descriptionId: string;
    icon: React.ReactNode;
  }
> = {
  '/content/library/questions': {
    titleId: 'pages.comingSoon.questions.title',
    descriptionId: 'pages.comingSoon.questions.description',
    icon: <DatabaseOutlined />,
  },
  '/content/library/programming': {
    titleId: 'pages.comingSoon.programming.title',
    descriptionId: 'pages.comingSoon.programming.description',
    icon: <DatabaseOutlined />,
  },
  '/content/papers': {
    titleId: 'pages.comingSoon.papers.title',
    descriptionId: 'pages.comingSoon.papers.description',
    icon: <FileTextOutlined />,
  },
  '/examination/exams/create': {
    titleId: 'pages.comingSoon.examCreate.title',
    descriptionId: 'pages.comingSoon.examCreate.description',
    icon: <FileTextOutlined />,
  },
  '/examination/candidates': {
    titleId: 'pages.comingSoon.candidates.title',
    descriptionId: 'pages.comingSoon.candidates.description',
    icon: <TeamOutlined />,
  },
  '/monitoring/proctoring/events': {
    titleId: 'pages.comingSoon.events.title',
    descriptionId: 'pages.comingSoon.events.description',
    icon: <SafetyOutlined />,
  },
  '/assessment/results/submissions': {
    titleId: 'pages.comingSoon.submissions.title',
    descriptionId: 'pages.comingSoon.submissions.description',
    icon: <TrophyOutlined />,
  },
  '/assessment/results/judge-tasks': {
    titleId: 'pages.comingSoon.judgeTasks.title',
    descriptionId: 'pages.comingSoon.judgeTasks.description',
    icon: <TrophyOutlined />,
  },
};

const fallbackMeta = {
  titleId: 'pages.comingSoon.title',
  descriptionId: 'pages.comingSoon.description',
  icon: <ClockCircleOutlined />,
};

const ComingSoon: React.FC = () => {
  const intl = useIntl();
  const meta = moduleMeta[window.location.pathname] ?? fallbackMeta;
  const title = intl.formatMessage({ id: meta.titleId });
  const description = intl.formatMessage({ id: meta.descriptionId });

  return (
    <PageContainer title={title}>
      <Card>
        <Result
          icon={meta.icon}
          title={title}
          subTitle={description}
          extra={
            <Space>
              <Button type="primary" href="/overview/dashboard">
                {intl.formatMessage({ id: 'pages.comingSoon.backDashboard' })}
              </Button>
              <Button href="/examination/exams">
                {intl.formatMessage({ id: 'pages.comingSoon.viewExams' })}
              </Button>
            </Space>
          }
        />
        <Typography.Paragraph type="secondary" style={{ textAlign: 'center' }}>
          {intl.formatMessage({ id: 'pages.comingSoon.note' })}
        </Typography.Paragraph>
      </Card>
    </PageContainer>
  );
};

export default ComingSoon;
