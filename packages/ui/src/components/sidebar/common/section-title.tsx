import React from 'react';

interface SectionTitleProps {
  title: string;
}

const SectionTitle: React.FC<SectionTitleProps> = ({ title }) => {
  return (
    <div className="mb-2">
      <span className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">{title}</span>
    </div>
  );
};

export default SectionTitle;