import { App as AntdApp } from 'antd';
import React from 'react';
import { QuestionsPageContent } from '../Questions';

const ProgrammingPage: React.FC = () => (
  <AntdApp>
    <QuestionsPageContent fixedType="PROGRAMMING" />
  </AntdApp>
);

export default ProgrammingPage;
