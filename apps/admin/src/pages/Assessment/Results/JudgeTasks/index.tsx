import { PageContainer } from '@ant-design/pro-components';
import { history, useIntl } from '@umijs/max';
import { Button, Card, Result } from 'antd';
import React from 'react';

const Index: React.FC = () => {
  const intl = useIntl();

  return (
    <PageContainer
      content={intl.formatMessage({
        id: 'pages.comingSoon.judgeTasks.description',
      })}
    >
      <Card>
        <Result
          status="info"
          title={intl.formatMessage({ id: 'pages.comingSoon.shortTitle' })}
          subTitle={intl.formatMessage({
            id: 'pages.comingSoon.shortDescription',
          })}
          extra={
            <Button
              type="primary"
              onClick={() => history.push('/overview/dashboard')}
            >
              {intl.formatMessage({ id: 'pages.comingSoon.backDashboard' })}
            </Button>
          }
        />
      </Card>
    </PageContainer>
  );
};

export default Index;
