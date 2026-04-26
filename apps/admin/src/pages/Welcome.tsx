import {
  BookOutlined,
  FileTextOutlined,
  TeamOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { PageContainer } from '@ant-design/pro-components';
import { useIntl } from '@umijs/max';
import { Card, Col, Row, Statistic, Typography } from 'antd';
import React from 'react';

interface QuickLinkProps {
  title: string;
  icon: React.ReactNode;
  href: string;
  description: string;
}

const QuickLink: React.FC<QuickLinkProps> = ({
  title,
  icon,
  href,
  description,
}) => (
  <Card hoverable className="h-full">
    <a href={href} target="_blank" rel="noreferrer" className="block">
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-blue-500 text-2xl text-white">
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <h4 className="mb-1 mt-0 text-base font-semibold">{title}</h4>
          <p className="mb-0 text-sm text-gray-500">{description}</p>
        </div>
      </div>
    </a>
  </Card>
);

const Welcome: React.FC = () => {
  const intl = useIntl();

  return (
    <PageContainer>
      <div className="rounded-lg border border-solid border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-[#141414]">
        <div className="mb-8 text-center">
          <Typography.Title level={2} className="mb-2">
            {intl.formatMessage({
              id: 'pages.welcome.title',
              defaultMessage: 'Examora 考试管理系统',
            })}
          </Typography.Title>
          <Typography.Paragraph type="secondary">
            {intl.formatMessage({
              id: 'pages.welcome.subtitle',
              defaultMessage: '欢迎使用在线考试管理平台',
            })}
          </Typography.Paragraph>
        </div>

        <Row gutter={[16, 16]} className="mb-6">
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title={intl.formatMessage({
                  id: 'pages.welcome.stats.students',
                  defaultMessage: '考生数量',
                })}
                value={0}
                prefix={<UserOutlined />}
                suffix="人"
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title={intl.formatMessage({
                  id: 'pages.welcome.stats.exams',
                  defaultMessage: '考试数量',
                })}
                value={0}
                prefix={<FileTextOutlined />}
                suffix="场"
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title={intl.formatMessage({
                  id: 'pages.welcome.stats.papers',
                  defaultMessage: '试卷数量',
                })}
                value={0}
                prefix={<BookOutlined />}
                suffix="份"
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title={intl.formatMessage({
                  id: 'pages.welcome.stats.questions',
                  defaultMessage: '题目数量',
                })}
                value={0}
                prefix={<TeamOutlined />}
                suffix="道"
              />
            </Card>
          </Col>
        </Row>

        <Typography.Title level={4} className="mb-4">
          {intl.formatMessage({
            id: 'pages.welcome.quickAccess',
            defaultMessage: '快捷入口',
          })}
        </Typography.Title>

        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={8}>
            <QuickLink
              title={intl.formatMessage({
                id: 'pages.welcome.links.userManage',
                defaultMessage: '用户管理',
              })}
              icon={<UserOutlined />}
              href="/admin"
              description={intl.formatMessage({
                id: 'pages.welcome.links.userManage.desc',
                defaultMessage: '管理考生和教师账户',
              })}
            />
          </Col>
          <Col xs={24} sm={12} md={8}>
            <QuickLink
              title={intl.formatMessage({
                id: 'pages.welcome.links.examManage',
                defaultMessage: '考试管理',
              })}
              icon={<FileTextOutlined />}
              href="/admin"
              description={intl.formatMessage({
                id: 'pages.welcome.links.examManage.desc',
                defaultMessage: '创建和管理考试',
              })}
            />
          </Col>
          <Col xs={24} sm={12} md={8}>
            <QuickLink
              title={intl.formatMessage({
                id: 'pages.welcome.links.paperManage',
                defaultMessage: '试卷管理',
              })}
              icon={<BookOutlined />}
              href="/admin"
              description={intl.formatMessage({
                id: 'pages.welcome.links.paperManage.desc',
                defaultMessage: '管理试卷和题目',
              })}
            />
          </Col>
        </Row>
      </div>
    </PageContainer>
  );
};

export default Welcome;
