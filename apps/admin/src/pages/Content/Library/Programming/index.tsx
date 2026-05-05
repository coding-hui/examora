import { PageContainer } from '@ant-design/pro-components';
import { history } from '@umijs/max';
import { Button, Card, Result } from 'antd';
import React from 'react';

const Index: React.FC = () => {
  return (
    <PageContainer
      content="编程题目管理，支持创建和编辑编程题目，配置测试用例用于在线评测。"
    >
      <Card>
        <Result
          status="info"
          title="即将上线"
          subTitle="该功能正在开发中，敬请期待。"
          extra={
            <Button type="primary" onClick={() => history.push('/')}>
              返回首页
            </Button>
          }
        />
      </Card>
    </PageContainer>
  );
};

export default Index;
