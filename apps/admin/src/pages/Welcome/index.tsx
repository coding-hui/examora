import {
  AlertOutlined,
  ArrowRightOutlined,
  AuditOutlined,
  BarChartOutlined,
  BookOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CodeOutlined,
  DatabaseOutlined,
  FileProtectOutlined,
  FireOutlined,
  ProjectOutlined,
  SafetyOutlined,
  SolutionOutlined,
  TeamOutlined,
  ThunderboltOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { PageContainer } from '@ant-design/pro-components';
import { useIntl } from '@umijs/max';
import {
  Badge,
  Button,
  Card,
  Col,
  Progress,
  Row,
  Space,
  Statistic,
  Timeline,
  Typography,
} from 'antd';
import React from 'react';
import { StatusTag } from '@/components';
import TrendLineChart from './TrendLineChart';
import './welcome.less';

const { Text, Title } = Typography;

const Welcome: React.FC = () => {
  const intl = useIntl();
  const f = (id: string, values?: Record<string, string | number>) =>
    intl.formatMessage({ id }, values);
  const metricTone = (tone: string) => {
    if (tone === 'amber') return 'warning';
    if (tone === 'green') return 'success';
    return 'info';
  };
  const weekDays = [
    f('pages.dashboard.week.mon'),
    f('pages.dashboard.week.tue'),
    f('pages.dashboard.week.wed'),
    f('pages.dashboard.week.thu'),
    f('pages.dashboard.week.fri'),
    f('pages.dashboard.week.sat'),
    f('pages.dashboard.week.sun'),
  ];

  const stats = [
    {
      key: 'candidates',
      label: f('pages.dashboard.stats.candidates.label'),
      value: 1247,
      trend: '+12.8%',
      caption: f('pages.dashboard.stats.candidates.caption'),
      icon: <UserOutlined />,
      tone: 'blue',
      chartColor: '#18181b',
      trendData: [
        { label: weekDays[0], value: 1018 },
        { label: weekDays[1], value: 1042 },
        { label: weekDays[2], value: 1096 },
        { label: weekDays[3], value: 1124 },
        { label: weekDays[4], value: 1190 },
        { label: weekDays[5], value: 1216 },
        { label: weekDays[6], value: 1247 },
      ],
    },
    {
      key: 'activeExams',
      label: f('pages.dashboard.stats.activeExams.label'),
      value: 38,
      trend: f('pages.dashboard.stats.activeExams.trend'),
      caption: f('pages.dashboard.stats.activeExams.caption'),
      icon: <FireOutlined />,
      tone: 'amber',
      chartColor: '#f97316',
      trendData: [
        { label: weekDays[0], value: 24 },
        { label: weekDays[1], value: 31 },
        { label: weekDays[2], value: 28 },
        { label: weekDays[3], value: 34 },
        { label: weekDays[4], value: 38 },
        { label: weekDays[5], value: 33 },
        { label: weekDays[6], value: 38 },
      ],
    },
    {
      key: 'papers',
      label: f('pages.dashboard.stats.papers.label'),
      value: 156,
      trend: '+8',
      caption: f('pages.dashboard.stats.papers.caption'),
      icon: <FileProtectOutlined />,
      tone: 'green',
      chartColor: '#22c55e',
      trendData: [
        { label: weekDays[0], value: 132 },
        { label: weekDays[1], value: 138 },
        { label: weekDays[2], value: 139 },
        { label: weekDays[3], value: 144 },
        { label: weekDays[4], value: 150 },
        { label: weekDays[5], value: 152 },
        { label: weekDays[6], value: 156 },
      ],
    },
    {
      key: 'questions',
      label: f('pages.dashboard.stats.questions.label'),
      value: 2843,
      trend: '92%',
      caption: f('pages.dashboard.stats.questions.caption'),
      icon: <DatabaseOutlined />,
      tone: 'violet',
      chartColor: '#404040',
      trendData: [
        { label: weekDays[0], value: 2660 },
        { label: weekDays[1], value: 2704 },
        { label: weekDays[2], value: 2748 },
        { label: weekDays[3], value: 2768 },
        { label: weekDays[4], value: 2812 },
        { label: weekDays[5], value: 2824 },
        { label: weekDays[6], value: 2843 },
      ],
    },
  ];

  const loadTrendSeries = [
    {
      key: 'online',
      label: f('pages.dashboard.series.online'),
      color: '#18181b',
      showArea: true,
      data: [
        { label: '08:00', value: 18 },
        { label: '10:00', value: 42 },
        { label: '12:00', value: 37 },
        { label: '14:00', value: 68 },
        { label: '16:00', value: 84 },
        { label: '18:00', value: 61 },
        { label: '20:00', value: 45 },
      ],
    },
    {
      key: 'queue',
      label: f('pages.dashboard.series.queue'),
      color: '#f97316',
      dashed: true,
      data: [
        { label: '08:00', value: 22 },
        { label: '10:00', value: 54 },
        { label: '12:00', value: 48 },
        { label: '14:00', value: 72 },
        { label: '16:00', value: 126 },
        { label: '18:00', value: 98 },
        { label: '20:00', value: 66 },
      ],
    },
    {
      key: 'risk',
      label: f('pages.dashboard.series.risk'),
      color: '#ef4444',
      data: [
        { label: '08:00', value: 2 },
        { label: '10:00', value: 6 },
        { label: '12:00', value: 5 },
        { label: '14:00', value: 9 },
        { label: '16:00', value: 7 },
        { label: '18:00', value: 4 },
        { label: '20:00', value: 3 },
      ],
    },
  ];

  const exams = [
    {
      key: 'math-final',
      name: f('pages.dashboard.exams.math'),
      progress: 78,
      active: 45,
      total: 120,
      status: f('pages.dashboard.status.running'),
      risk: f('pages.dashboard.risk.low'),
      riskLevel: 'low',
    },
    {
      key: 'python',
      name: f('pages.dashboard.exams.python'),
      progress: 45,
      active: 12,
      total: 60,
      status: f('pages.dashboard.status.running'),
      risk: f('pages.dashboard.risk.watch'),
      riskLevel: 'watch',
    },
    {
      key: 'physics',
      name: f('pages.dashboard.exams.physics'),
      progress: 100,
      active: 0,
      total: 80,
      status: f('pages.dashboard.status.closed'),
      risk: f('pages.dashboard.risk.normal'),
      riskLevel: 'normal',
    },
  ];

  const activities = [
    {
      key: 'a1',
      text: f('pages.dashboard.activities.a1'),
      meta: f('pages.dashboard.activities.5m'),
      color: '#262626',
    },
    {
      key: 'a2',
      text: f('pages.dashboard.activities.a2'),
      meta: f('pages.dashboard.activities.8m'),
      color: '#f97316',
    },
    {
      key: 'a3',
      text: f('pages.dashboard.activities.a3'),
      meta: f('pages.dashboard.activities.12m'),
      color: '#22c55e',
    },
    {
      key: 'a4',
      text: f('pages.dashboard.activities.a4'),
      meta: f('pages.dashboard.activities.15m'),
      color: '#262626',
    },
  ];

  const judgeQueues = [
    {
      key: 'waiting',
      label: f('pages.dashboard.queue.waiting'),
      value: 126,
      percent: 64,
      color: '#18181b',
    },
    {
      key: 'running',
      label: f('pages.dashboard.queue.running'),
      value: 18,
      percent: 42,
      color: '#f97316',
    },
    {
      key: 'failed',
      label: f('pages.dashboard.queue.failed'),
      value: 7,
      percent: 18,
      color: '#ef4444',
    },
  ];

  const shortcuts = [
    {
      key: 'users',
      label: f('pages.dashboard.shortcuts.users'),
      path: '/system/settings/users',
      icon: <SolutionOutlined />,
    },
    {
      key: 'exams',
      label: f('pages.dashboard.shortcuts.exams'),
      path: '/examination/exams',
      icon: <ProjectOutlined />,
    },
    {
      key: 'papers',
      label: f('pages.dashboard.shortcuts.papers'),
      path: '/content/papers',
      icon: <BookOutlined />,
    },
    {
      key: 'questions',
      label: f('pages.dashboard.shortcuts.questions'),
      path: '/content/library/questions',
      icon: <DatabaseOutlined />,
    },
    {
      key: 'programming',
      label: f('pages.dashboard.shortcuts.programming'),
      path: '/content/library/programming',
      icon: <CodeOutlined />,
    },
    {
      key: 'submissions',
      label: f('pages.dashboard.shortcuts.submissions'),
      path: '/examination/submissions',
      icon: <AuditOutlined />,
    },
  ];

  return (
    <PageContainer className="dashboard-container">
      <div className="dashboard-page">
        <section className="dashboard-hero">
          <div className="hero-main">
            <div className="hero-title-row">
              <Title level={2} className="hero-title">
                {f('pages.dashboard.hero.title')}
              </Title>
              <Space size={8} wrap className="hero-kicker">
                <span className="hero-status-dot" />
                <span>{f('pages.dashboard.hero.kicker')}</span>
                <StatusTag className="hero-product-tag">
                  Examora Admin
                </StatusTag>
              </Space>
            </div>
            <Text className="hero-subtitle">
              {f('pages.dashboard.hero.subtitle')}
            </Text>
            <div className="hero-pulse">
              <span>
                <strong>45</strong>
                {f('pages.dashboard.hero.online')}
              </span>
              <span>
                <strong>9</strong>
                {f('pages.dashboard.hero.risk')}
              </span>
              <span>
                <strong>126</strong>
                {f('pages.dashboard.hero.queue')}
              </span>
            </div>
          </div>
          <Space size={12} wrap className="hero-actions">
            <Button
              href="/examination/exams/create"
              type="primary"
              icon={<ProjectOutlined />}
            >
              {f('pages.dashboard.actions.createExam')}
            </Button>
            <Button href="/examination/events" icon={<SafetyOutlined />}>
              {f('pages.dashboard.actions.viewMonitoring')}
            </Button>
          </Space>
        </section>

        <Row gutter={[16, 16]} className="stats-row">
          {stats.map((stat) => (
            <Col xs={24} sm={12} xl={6} key={stat.key}>
              <Card
                className={`metric-card metric-card-${stat.tone}`}
                variant="borderless"
              >
                <div className="metric-card-header">
                  <span className="metric-icon">{stat.icon}</span>
                  <StatusTag tone={metricTone(stat.tone)}>
                    {stat.trend}
                  </StatusTag>
                </div>
                <Statistic
                  title={stat.label}
                  value={stat.value}
                  styles={{ content: { fontSize: 30 } }}
                />
                <Text className="metric-caption">{stat.caption}</Text>
                <TrendLineChart
                  compact
                  ariaLabel={f('pages.dashboard.chart.weekAria', {
                    label: stat.label,
                  })}
                  data={stat.trendData}
                  color={stat.chartColor}
                  height={52}
                  showArea
                />
              </Card>
            </Col>
          ))}
        </Row>

        <Row gutter={[16, 16]} className="content-row">
          <Col span={24}>
            <Card
              className="dashboard-card load-trend-card"
              title={
                <Space>
                  <BarChartOutlined />
                  {f('pages.dashboard.load.title')}
                </Space>
              }
              extra={
                <Text type="secondary">{f('pages.dashboard.load.range')}</Text>
              }
            >
              <div className="load-trend-layout">
                <div className="load-trend-summary">
                  <div>
                    <Text type="secondary">
                      {f('pages.dashboard.load.peakOnline')}
                    </Text>
                    <strong>84</strong>
                    <span>{f('pages.dashboard.load.peakOnlineCaption')}</span>
                  </div>
                  <div>
                    <Text type="secondary">
                      {f('pages.dashboard.load.peakQueue')}
                    </Text>
                    <strong>126</strong>
                    <span>{f('pages.dashboard.load.peakQueueCaption')}</span>
                  </div>
                  <div>
                    <Text type="secondary">
                      {f('pages.dashboard.load.riskEvents')}
                    </Text>
                    <strong>9</strong>
                    <span>{f('pages.dashboard.load.riskEventsCaption')}</span>
                  </div>
                </div>
                <TrendLineChart
                  ariaLabel={f('pages.dashboard.load.aria')}
                  series={loadTrendSeries}
                  height={210}
                  showGrid
                  showLegend
                  showDots
                />
              </div>
            </Card>
          </Col>
        </Row>

        <Row gutter={[16, 16]} className="content-row">
          <Col xs={24} xl={15}>
            <Card
              className="dashboard-card progress-card"
              title={
                <Space>
                  <BarChartOutlined />
                  {f('pages.dashboard.progress.title')}
                </Space>
              }
              extra={
                <Button
                  type="link"
                  href="/examination/exams"
                  icon={<ArrowRightOutlined />}
                  iconPlacement="end"
                >
                  {f('pages.dashboard.progress.allExams')}
                </Button>
              }
            >
              {exams.map((exam) => (
                <div key={exam.key} className="exam-item">
                  <div className="exam-main">
                    <div>
                      <Text strong className="exam-name">
                        {exam.name}
                      </Text>
                      <div className="exam-meta">
                        <span>
                          <TeamOutlined />{' '}
                          {f('pages.dashboard.progress.activeCount', {
                            count: exam.active,
                          })}
                        </span>
                        <span>
                          <ClockCircleOutlined />{' '}
                          {f('pages.dashboard.progress.duration', {
                            count: exam.total,
                          })}
                        </span>
                      </div>
                    </div>
                    <Space size={8} wrap>
                      <StatusTag
                        tone={exam.key === 'physics' ? 'success' : 'info'}
                      >
                        {exam.status}
                      </StatusTag>
                      <StatusTag
                        tone={
                          exam.riskLevel === 'watch' ? 'warning' : 'success'
                        }
                      >
                        {exam.risk}
                      </StatusTag>
                    </Space>
                  </div>
                  <Progress
                    percent={exam.progress}
                    strokeColor={exam.progress === 100 ? '#22c55e' : '#18181b'}
                    railColor="#f4f4f5"
                    size={{ height: 10 }}
                  />
                </div>
              ))}
            </Card>
          </Col>

          <Col xs={24} xl={9}>
            <Card
              className="dashboard-card risk-card"
              title={
                <Space>
                  <AlertOutlined />
                  {f('pages.dashboard.risk.title')}
                </Space>
              }
              extra={
                <StatusTag tone="warning">
                  {f('pages.dashboard.risk.watchCount')}
                </StatusTag>
              }
            >
              <div className="risk-summary">
                <Progress
                  type="circle"
                  percent={91}
                  size={118}
                  strokeColor="#22c55e"
                  railColor="#f4f4f5"
                />
                <div>
                  <Text className="risk-label">
                    {f('pages.dashboard.risk.healthLabel')}
                  </Text>
                  <Title level={3} className="risk-title">
                    {f('pages.dashboard.risk.healthTitle')}
                  </Title>
                  <Text className="risk-copy">
                    {f('pages.dashboard.risk.healthCopy')}
                  </Text>
                </div>
              </div>
              <div className="risk-grid">
                <div>
                  <Text type="secondary">
                    {f('pages.dashboard.risk.offscreen')}
                  </Text>
                  <strong>6</strong>
                </div>
                <div>
                  <Text type="secondary">
                    {f('pages.dashboard.risk.network')}
                  </Text>
                  <strong>3</strong>
                </div>
                <div>
                  <Text type="secondary">
                    {f('pages.dashboard.risk.review')}
                  </Text>
                  <strong>2</strong>
                </div>
              </div>
            </Card>
          </Col>
        </Row>

        <Row gutter={[16, 16]} className="content-row">
          <Col xs={24} lg={8}>
            <Card
              className="dashboard-card"
              title={
                <Space>
                  <ThunderboltOutlined />
                  {f('pages.dashboard.queue.title')}
                </Space>
              }
            >
              <Space orientation="vertical" size={16} className="queue-list">
                {judgeQueues.map((item) => (
                  <div key={item.key} className="queue-item">
                    <div className="queue-header">
                      <Text>{item.label}</Text>
                      <Text strong>{item.value}</Text>
                    </div>
                    <Progress
                      percent={item.percent}
                      showInfo={false}
                      strokeColor={item.color}
                      railColor="#f4f4f5"
                    />
                  </div>
                ))}
              </Space>
            </Card>
          </Col>

          <Col xs={24} lg={8}>
            <Card
              className="dashboard-card"
              title={
                <Space>
                  <FireOutlined />
                  {f('pages.dashboard.activities.title')}
                </Space>
              }
              extra={
                <Badge
                  status="processing"
                  text={f('pages.dashboard.hero.kicker')}
                />
              }
            >
              <Timeline
                className="activity-timeline"
                items={activities.map((item) => ({
                  key: item.key,
                  color: item.color,
                  content: (
                    <div className="activity-item">
                      <Text>{item.text}</Text>
                      <Text type="secondary">{item.meta}</Text>
                    </div>
                  ),
                }))}
              />
            </Card>
          </Col>

          <Col xs={24} lg={8}>
            <Card
              className="dashboard-card shortcut-card"
              title={
                <Space>
                  <CheckCircleOutlined />
                  {f('pages.dashboard.shortcuts.title')}
                </Space>
              }
            >
              <div className="shortcut-grid">
                {shortcuts.map((item) => (
                  <a href={item.path} className="shortcut" key={item.key}>
                    <span className="shortcut-icon">{item.icon}</span>
                    <span>{item.label}</span>
                  </a>
                ))}
              </div>
            </Card>
          </Col>
        </Row>
      </div>
    </PageContainer>
  );
};

export default Welcome;
