import React from 'react';

export const SectionTitle: React.FC<{
  children: React.ReactNode;
  extra?: React.ReactNode;
}> = ({ children, extra }) => (
  <div className="pdetail-section-heading">
    <h3 className="pdetail-section-title">{children}</h3>
    {extra}
  </div>
);
