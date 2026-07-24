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
      className={`bg-white rounded-2xl shadow-[0_2px_16px_rgba(15,23,42,0.05)] p-5 md:p-6 transition-all duration-300 hover:shadow-[0_6px_24px_rgba(15,23,42,0.08)] ${className}`}
    >
      {children}
    </div>
  );
}

export default React.memo(Card);
