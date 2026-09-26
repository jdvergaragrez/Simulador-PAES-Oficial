import React from 'react';

interface CardProps {
  id?: string;
  children: React.ReactNode;
  className?: string;
}

function Card({ id, children, className = '' }: CardProps) {
  return (
    <div
      id={id}
      className={`bg-white rounded-2xl border border-[#E7E5E1] p-5 md:p-6 transition-colors duration-300 ${className}`}
    >
      {children}
    </div>
  );
}

export default React.memo(Card);
