import { ProCard, ProDescriptions } from '@ant-design/pro-components';
import { useIntl, useModel } from '@umijs/max';
import { Tag } from 'antd';
import React from 'react';
import useStyles from '../style';

const BaseView: React.FC = () => {
  const intl = useIntl();
  const { styles } = useStyles();
  const { initialState } = useModel('@@initialState');
  const user = initialState?.currentUser;

  return (
    <div className={styles.baseView}>
      <ProCard
        title={intl.formatMessage({
          id: 'pages.account.settings.base.title',
          defaultMessage: '基础资料',
        })}
      >
        <ProDescriptions
          column={1}
          dataSource={user || {}}
          emptyText="-"
          columns={[
            {
              title: intl.formatMessage({
                id: 'pages.account.settings.base.username',
                defaultMessage: '用户名',
              }),
              dataIndex: 'username',
            },
            {
              title: intl.formatMessage({
                id: 'pages.account.settings.base.displayName',
                defaultMessage: '显示名称',
              }),
              dataIndex: 'display_name',
            },
            {
              title: intl.formatMessage({
                id: 'pages.account.settings.base.externalSubject',
                defaultMessage: '外部身份',
              }),
              dataIndex: 'external_subject',
              render: (_: unknown, entity: Record<string, unknown>) =>
                (entity.external_subject as string) ||
                intl.formatMessage({
                  id: 'pages.account.settings.base.localAccount',
                  defaultMessage: '本地账号',
                }),
            },
            {
              title: intl.formatMessage({
                id: 'pages.account.settings.base.role',
                defaultMessage: '角色',
              }),
              dataIndex: 'roles',
              render: (_: unknown, entity: Record<string, unknown>) => {
                const roles = entity.roles as string[];
                return roles?.length
                  ? roles.map((role) => <Tag key={role}>{role}</Tag>)
                  : '-';
              },
            },
          ]}
        />
      </ProCard>
    </div>
  );
};

export default BaseView;
