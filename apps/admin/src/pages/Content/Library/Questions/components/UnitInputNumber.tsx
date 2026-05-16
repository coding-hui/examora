import { Button, InputNumber, Space } from 'antd';
import React from 'react';

export const UnitInputNumber: React.FC<
  React.ComponentProps<typeof InputNumber> & { unit: string }
> = ({ unit, style, ...props }) => (
  <Space.Compact style={{ width: '100%' }}>
    <InputNumber {...props} style={{ ...style, width: '100%' }} />
    <Button disabled tabIndex={-1}>
      {unit}
    </Button>
  </Space.Compact>
);
