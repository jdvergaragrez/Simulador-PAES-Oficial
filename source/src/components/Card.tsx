import React from 'react';

interface CardProps {
  id?: string;
  children: React.ReactNode;
  className?: string;
}

export default function Card({ id, children, className = '' }: CardProps) {
  return (
    <div
      id={id}
      className={`bg-white rounded-3xl shadow-[0_4px_20px_rgba(15,23,42,0.04)] p-5 md:p-6 transition-all duration-300 ${className}`}
    >
      {children}
    </div>
  );
}
