import { Tag, type TagProps } from 'antd';
import React from 'react';

export type StatusTagTone =
  | 'neutral'
  | 'info'
  | 'success'
  | 'warning'
  | 'danger';

export function statusToneFromAntdColor(color?: string): StatusTagTone {
  if (color === 'success' || color === 'green') return 'success';
  if (color === 'processing' || color === 'blue' || color === 'cyan') {
    return 'info';
  }
  if (color === 'warning' || color === 'orange' || color === 'gold') {
    return 'warning';
  }
  if (color === 'error' || color === 'red') return 'danger';
  return 'neutral';
}

interface StatusTagProps extends Omit<TagProps, 'color'> {
  tone?: StatusTagTone;
}

const StatusTag: React.FC<StatusTagProps> = ({
  tone = 'neutral',
  className,
  children,
  ...props
}) => (
  <Tag
    {...props}
    className={['examora-status-tag', `examora-status-tag-${tone}`, className]
      .filter(Boolean)
      .join(' ')}
  >
    {children}
  </Tag>
);

export default StatusTag;
