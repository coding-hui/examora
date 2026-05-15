import React from 'react';

export const SectionTitle: React.FC<{
  children: React.ReactNode;
  style?: React.CSSProperties;
}> = ({ children, style }) => (
  <h3 className="qdetail-section-title" style={style}>
    {children}
  </h3>
);
