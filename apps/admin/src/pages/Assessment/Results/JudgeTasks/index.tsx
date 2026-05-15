import { PageContainer } from '@ant-design/pro-components';
import { history } from '@umijs/max';
import { Button, Card, Result } from 'antd';
import React from 'react';

const Index: React.FC = () => {
  return (
    <PageContainer content="查看编程题目的评测任务状态和执行结果，监控系统判题服务的运行情况。">
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
