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
      className={`tarjeta bg-white rounded-[24px] p-5 md:p-6 transition-colors duration-300 ${className}`}
    >
      {children}
    </div>
  );
}

export default React.memo(Card);
