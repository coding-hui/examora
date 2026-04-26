import { CheckCircleTwoTone } from '@ant-design/icons';
import { PageContainer } from '@ant-design/pro-components';
import { useIntl } from '@umijs/max';
import { Card, Result, Typography } from 'antd';
import React from 'react';

const Admin: React.FC = () => {
  const intl = useIntl();
  return (
    <PageContainer
      content={intl.formatMessage({
        id: 'pages.admin.subPage.title',
        defaultMessage: 'This page can only be viewed by admin',
      })}
    >
      <Card>
        <Result
          icon={<CheckCircleTwoTone twoToneColor="#52c41a" />}
          title={intl.formatMessage({
            id: 'pages.admin.subPage.title',
          })}
          subTitle={intl.formatMessage({
            id: 'pages.welcome.alertMessage',
          })}
        />
        <Typography.Paragraph>
          {intl.formatMessage({
            id: 'pages.admin.description',
            defaultMessage:
              'You have admin access to the exam management system.',
          })}
        </Typography.Paragraph>
      </Card>
    </PageContainer>
  );
};

export default Admin;
