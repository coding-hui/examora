import {
  BarChartOutlined,
  BookOutlined,
  CodeOutlined,
  FileTextOutlined,
  ProjectOutlined,
  SafetyOutlined,
  SolutionOutlined,
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
  color: string;
}

const QuickLink: React.FC<QuickLinkProps> = ({
  title,
  icon,
  href,
  description,
  color,
}) => (
  <a href={href} style={styles.quickLinkCard}>
    <Card hoverable style={styles.card} styles={{ body: { padding: '20px' } }}>
      <div style={styles.quickLinkContent}>
        <div style={{ ...styles.quickLinkIcon, background: color }}>{icon}</div>
        <div style={styles.quickLinkText}>
          <h4 style={styles.quickLinkTitle}>{title}</h4>
          <p style={styles.quickLinkDesc}>{description}</p>
        </div>
      </div>
    </Card>
  </a>
);

const Welcome: React.FC = () => {
  const intl = useIntl();

  return (
    <PageContainer>
      <div style={styles.container}>
        {/* Hero Section */}
        <div style={styles.hero}>
          <div style={styles.heroContent}>
            <Typography.Title level={1} style={styles.heroTitle}>
              Examora
            </Typography.Title>
            <Typography.Title level={4} style={styles.heroSubtitle}>
              智能在线考试管理系统
            </Typography.Title>
            <Typography.Paragraph style={styles.heroDesc}>
              高效、安全、专业的在线考试解决方案，支持单选题、多选题、编程题等多种题型
            </Typography.Paragraph>
          </div>
        </div>

        {/* Stats Section */}
        <Row gutter={[24, 24]} style={styles.statsRow}>
          <Col xs={24} sm={12} md={6}>
            <Card style={styles.statCard}>
              <div style={styles.statContent}>
                <div
                  style={{
                    ...styles.statIcon,
                    background:
                      'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  }}
                >
                  <UserOutlined style={{ fontSize: 24, color: '#fff' }} />
                </div>
                <Statistic
                  title={<span style={styles.statTitle}>考生数量</span>}
                  value={0}
                  suffix="人"
                  valueStyle={{
                    color: '#1a1a2e',
                    fontSize: 32,
                    fontWeight: 600,
                  }}
                />
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card style={styles.statCard}>
              <div style={styles.statContent}>
                <div
                  style={{
                    ...styles.statIcon,
                    background:
                      'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                  }}
                >
                  <FileTextOutlined style={{ fontSize: 24, color: '#fff' }} />
                </div>
                <Statistic
                  title={<span style={styles.statTitle}>考试数量</span>}
                  value={0}
                  suffix="场"
                  valueStyle={{
                    color: '#1a1a2e',
                    fontSize: 32,
                    fontWeight: 600,
                  }}
                />
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card style={styles.statCard}>
              <div style={styles.statContent}>
                <div
                  style={{
                    ...styles.statIcon,
                    background:
                      'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                  }}
                >
                  <BookOutlined style={{ fontSize: 24, color: '#fff' }} />
                </div>
                <Statistic
                  title={<span style={styles.statTitle}>试卷数量</span>}
                  value={0}
                  suffix="份"
                  valueStyle={{
                    color: '#1a1a2e',
                    fontSize: 32,
                    fontWeight: 600,
                  }}
                />
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card style={styles.statCard}>
              <div style={styles.statContent}>
                <div
                  style={{
                    ...styles.statIcon,
                    background:
                      'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
                  }}
                >
                  <TeamOutlined style={{ fontSize: 24, color: '#fff' }} />
                </div>
                <Statistic
                  title={<span style={styles.statTitle}>题目数量</span>}
                  value={0}
                  suffix="道"
                  valueStyle={{
                    color: '#1a1a2e',
                    fontSize: 32,
                    fontWeight: 600,
                  }}
                />
              </div>
            </Card>
          </Col>
        </Row>

        {/* Quick Access Section */}
        <div style={styles.section}>
          <Typography.Title level={4} style={styles.sectionTitle}>
            快捷入口
          </Typography.Title>
          <Row gutter={[20, 20]}>
            <Col xs={24} sm={12} md={8}>
              <QuickLink
                title="用户管理"
                icon={<SolutionOutlined />}
                href="/system/settings/users"
                description="管理考生和教师账户"
                color="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
              />
            </Col>
            <Col xs={24} sm={12} md={8}>
              <QuickLink
                title="考试管理"
                icon={<ProjectOutlined />}
                href="/examination/exams"
                description="创建和管理考试"
                color="linear-gradient(135deg, #f093fb 0%, #f5576c 100%)"
              />
            </Col>
            <Col xs={24} sm={12} md={8}>
              <QuickLink
                title="试卷管理"
                icon={<BookOutlined />}
                href="/content/papers"
                description="管理试卷和题目"
                color="linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)"
              />
            </Col>
          </Row>
        </div>

        {/* Features Section */}
        <div style={styles.section}>
          <Typography.Title level={4} style={styles.sectionTitle}>
            系统特性
          </Typography.Title>
          <Row gutter={[20, 20]}>
            <Col xs={24} md={8}>
              <Card style={styles.featureCard}>
                <div style={styles.featureIcon}>
                  <CodeOutlined style={{ fontSize: 40, color: '#7C3AED' }} />
                </div>
                <h4 style={styles.featureTitle}>在线编程</h4>
                <p style={styles.featureDesc}>
                  支持代码编写和在线评测，自动评分
                </p>
              </Card>
            </Col>
            <Col xs={24} md={8}>
              <Card style={styles.featureCard}>
                <div style={styles.featureIcon}>
                  <BarChartOutlined
                    style={{ fontSize: 40, color: '#7C3AED' }}
                  />
                </div>
                <h4 style={styles.featureTitle}>智能分析</h4>
                <p style={styles.featureDesc}>实时统计考试数据，多维度分析</p>
              </Card>
            </Col>
            <Col xs={24} md={8}>
              <Card style={styles.featureCard}>
                <div style={styles.featureIcon}>
                  <SafetyOutlined style={{ fontSize: 40, color: '#7C3AED' }} />
                </div>
                <h4 style={styles.featureTitle}>安全可靠</h4>
                <p style={styles.featureDesc}>多种防作弊机制，保障考试公平</p>
              </Card>
            </Col>
          </Row>
        </div>
      </div>
    </PageContainer>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    padding: '0 0 24px',
  },
  hero: {
    textAlign: 'center' as const,
    padding: '48px 24px',
    marginBottom: 32,
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    borderRadius: 16,
    position: 'relative',
    overflow: 'hidden',
  },
  heroContent: {
    position: 'relative',
    zIndex: 1,
  },
  heroTitle: {
    fontSize: 48,
    fontWeight: 700,
    color: '#fff',
    marginBottom: 8,
    textShadow: '0 2px 8px rgba(0,0,0,0.15)',
  },
  heroSubtitle: {
    fontSize: 20,
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 16,
    fontWeight: 400,
  },
  heroDesc: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.8)',
    maxWidth: 600,
    margin: '0 auto',
  },
  statsRow: {
    marginBottom: 32,
  },
  statCard: {
    borderRadius: 12,
    border: 'none',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
  },
  statContent: {
    display: 'flex',
    alignItems: 'center',
    gap: 16,
  },
  statIcon: {
    width: 56,
    height: 56,
    borderRadius: 12,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statTitle: {
    color: '#666',
    fontSize: 14,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 600,
    color: '#1a1a2e',
    marginBottom: 20,
    paddingLeft: 12,
    borderLeft: '4px solid #1677ff',
  },
  quickLinkCard: {
    textDecoration: 'none',
    display: 'block',
  },
  card: {
    borderRadius: 12,
    border: 'none',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
    transition: 'all 0.3s ease',
  },
  quickLinkContent: {
    display: 'flex',
    alignItems: 'center',
    gap: 16,
  },
  quickLinkIcon: {
    width: 48,
    height: 48,
    borderRadius: 10,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 22,
    color: '#fff',
    flexShrink: 0,
  },
  quickLinkText: {
    flex: 1,
  },
  quickLinkTitle: {
    fontSize: 16,
    fontWeight: 600,
    color: '#1a1a2e',
    margin: '0 0 4px',
  },
  quickLinkDesc: {
    fontSize: 13,
    color: '#666',
    margin: 0,
  },
  featureCard: {
    borderRadius: 12,
    border: 'none',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
    textAlign: 'center' as const,
    height: '100%',
  },
  featureIcon: {
    fontSize: 40,
    marginBottom: 12,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: 600,
    color: '#1a1a2e',
    marginBottom: 8,
  },
  featureDesc: {
    fontSize: 14,
    color: '#666',
    margin: 0,
  },
};

export default Welcome;
