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
import {
  Badge,
  Button,
  Card,
  Col,
  Progress,
  Row,
  Space,
  Statistic,
  Tag,
  Timeline,
  Typography,
} from 'antd';
import React from 'react';
import TrendLineChart from './TrendLineChart';
import './welcome.less';

const { Text, Title } = Typography;

const Welcome: React.FC = () => {
  const stats = [
    {
      key: 'candidates',
      label: '注册考生',
      value: 1247,
      trend: '+12.8%',
      caption: '较上周新增 146 人',
      icon: <UserOutlined />,
      tone: 'blue',
      chartColor: '#18181b',
      trendData: [
        { label: '周一', value: 1018 },
        { label: '周二', value: 1042 },
        { label: '周三', value: 1096 },
        { label: '周四', value: 1124 },
        { label: '周五', value: 1190 },
        { label: '周六', value: 1216 },
        { label: '周日', value: 1247 },
      ],
    },
    {
      key: 'activeExams',
      label: '进行中考试',
      value: 38,
      trend: '45 人在线',
      caption: '覆盖 6 个考场',
      icon: <FireOutlined />,
      tone: 'amber',
      chartColor: '#f97316',
      trendData: [
        { label: '周一', value: 24 },
        { label: '周二', value: 31 },
        { label: '周三', value: 28 },
        { label: '周四', value: 34 },
        { label: '周五', value: 38 },
        { label: '周六', value: 33 },
        { label: '周日', value: 38 },
      ],
    },
    {
      key: 'papers',
      label: '试卷总数',
      value: 156,
      trend: '+8',
      caption: '本月发布试卷',
      icon: <FileProtectOutlined />,
      tone: 'green',
      chartColor: '#22c55e',
      trendData: [
        { label: '周一', value: 132 },
        { label: '周二', value: 138 },
        { label: '周三', value: 139 },
        { label: '周四', value: 144 },
        { label: '周五', value: 150 },
        { label: '周六', value: 152 },
        { label: '周日', value: 156 },
      ],
    },
    {
      key: 'questions',
      label: '题目总数',
      value: 2843,
      trend: '92%',
      caption: '题库可复用率',
      icon: <DatabaseOutlined />,
      tone: 'violet',
      chartColor: '#404040',
      trendData: [
        { label: '周一', value: 2660 },
        { label: '周二', value: 2704 },
        { label: '周三', value: 2748 },
        { label: '周四', value: 2768 },
        { label: '周五', value: 2812 },
        { label: '周六', value: 2824 },
        { label: '周日', value: 2843 },
      ],
    },
  ];

  const loadTrendSeries = [
    {
      key: 'online',
      label: '在线考生',
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
      label: '判题队列',
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
      label: '风险事件',
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
      name: '2026 春季高等数学期末考试',
      progress: 78,
      active: 45,
      total: 120,
      status: '进行中',
      risk: '低风险',
    },
    {
      key: 'python',
      name: 'Python 程序设计能力测试',
      progress: 45,
      active: 12,
      total: 60,
      status: '进行中',
      risk: '关注',
    },
    {
      key: 'physics',
      name: '大学物理模拟测试',
      progress: 100,
      active: 0,
      total: 80,
      status: '已结束',
      risk: '正常',
    },
  ];

  const activities = [
    {
      key: 'a1',
      text: '李娜提交了 Python 程序设计能力测试',
      meta: '5 分钟前',
      color: '#262626',
    },
    {
      key: 'a2',
      text: '王磊的考试被系统自动提交',
      meta: '8 分钟前',
      color: '#f97316',
    },
    {
      key: 'a3',
      text: '张伟开始作答 2026 春季高等数学',
      meta: '12 分钟前',
      color: '#22c55e',
    },
    {
      key: 'a4',
      text: '陈静提交了数据结构与算法测试',
      meta: '15 分钟前',
      color: '#262626',
    },
  ];

  const judgeQueues = [
    {
      key: 'waiting',
      label: '等待判题',
      value: 126,
      percent: 64,
      color: '#18181b',
    },
    {
      key: 'running',
      label: '执行中',
      value: 18,
      percent: 42,
      color: '#f97316',
    },
    { key: 'failed', label: '需复核', value: 7, percent: 18, color: '#ef4444' },
  ];

  const shortcuts = [
    {
      key: 'users',
      label: '用户管理',
      path: '/system/settings/users',
      icon: <SolutionOutlined />,
    },
    {
      key: 'exams',
      label: '考试管理',
      path: '/examination/exams',
      icon: <ProjectOutlined />,
    },
    {
      key: 'papers',
      label: '试卷管理',
      path: '/content/papers',
      icon: <BookOutlined />,
    },
    {
      key: 'questions',
      label: '题库管理',
      path: '/content/library/questions',
      icon: <DatabaseOutlined />,
    },
    {
      key: 'programming',
      label: '编程题库',
      path: '/content/library/programming',
      icon: <CodeOutlined />,
    },
    {
      key: 'submissions',
      label: '提交记录',
      path: '/assessment/results/submissions',
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
                考试运营工作台
              </Title>
              <Space size={8} wrap className="hero-kicker">
                <span className="hero-status-dot" />
                <span>实时运营</span>
                <Tag className="hero-product-tag" variant="filled">
                  Examora Admin
                </Tag>
              </Space>
            </div>
            <Text className="hero-subtitle">
              聚合考试进度、监考事件、题库资产与判题队列，帮助管理员快速判断今天的关键风险。
            </Text>
            <div className="hero-pulse">
              <span>
                <strong>45</strong>
                在线考生
              </span>
              <span>
                <strong>9</strong>
                风险关注
              </span>
              <span>
                <strong>126</strong>
                等待判题
              </span>
            </div>
          </div>
          <Space size={12} wrap className="hero-actions">
            <Button
              href="/examination/exams/create"
              type="primary"
              icon={<ProjectOutlined />}
            >
              新建考试
            </Button>
            <Button
              href="/monitoring/proctoring/events"
              icon={<SafetyOutlined />}
            >
              查看监控
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
                  <Tag variant="filled">{stat.trend}</Tag>
                </div>
                <Statistic
                  title={stat.label}
                  value={stat.value}
                  styles={{ content: { fontSize: 30 } }}
                />
                <Text className="metric-caption">{stat.caption}</Text>
                <TrendLineChart
                  compact
                  ariaLabel={`${stat.label} 7 日趋势`}
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
                  考试负载趋势
                </Space>
              }
              extra={<Text type="secondary">近 12 小时</Text>}
            >
              <div className="load-trend-layout">
                <div className="load-trend-summary">
                  <div>
                    <Text type="secondary">峰值在线</Text>
                    <strong>84</strong>
                    <span>16:00 达到峰值</span>
                  </div>
                  <div>
                    <Text type="secondary">队列峰值</Text>
                    <strong>126</strong>
                    <span>平均处理 42 秒</span>
                  </div>
                  <div>
                    <Text type="secondary">风险事件</Text>
                    <strong>9</strong>
                    <span>较昨日下降 18%</span>
                  </div>
                </div>
                <TrendLineChart
                  ariaLabel="近 12 小时在线考生、判题队列和风险事件趋势"
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
                  考试进度
                </Space>
              }
              extra={
                <Button
                  type="link"
                  href="/examination/exams"
                  icon={<ArrowRightOutlined />}
                  iconPlacement="end"
                >
                  全部考试
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
                          <TeamOutlined /> {exam.active} 人在考
                        </span>
                        <span>
                          <ClockCircleOutlined /> {exam.total} 分钟
                        </span>
                      </div>
                    </div>
                    <Space size={8} wrap>
                      <Tag
                        color={exam.status === '已结束' ? '#22c55e' : '#262626'}
                      >
                        {exam.status}
                      </Tag>
                      <Tag color={exam.risk === '关注' ? '#f97316' : '#262626'}>
                        {exam.risk}
                      </Tag>
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
                  监考风险
                </Space>
              }
              extra={
                <Tag color="#f97316" variant="filled">
                  需关注 9
                </Tag>
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
                  <Text className="risk-label">今日考试健康度</Text>
                  <Title level={3} className="risk-title">
                    整体稳定
                  </Title>
                  <Text className="risk-copy">
                    自动提交、离屏与网络波动事件均处于可控范围。
                  </Text>
                </div>
              </div>
              <div className="risk-grid">
                <div>
                  <Text type="secondary">离屏事件</Text>
                  <strong>6</strong>
                </div>
                <div>
                  <Text type="secondary">网络波动</Text>
                  <strong>3</strong>
                </div>
                <div>
                  <Text type="secondary">人工复核</Text>
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
                  判题队列
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
                  考试动态
                </Space>
              }
              extra={<Badge status="processing" text="实时" />}
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
                  快捷入口
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
