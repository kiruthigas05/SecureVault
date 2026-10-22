import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
}

export const Card: React.FC<CardProps> = ({ children, className = '', hover = false, ...props }) => {
  return (
    <div
      className={`sv-card rounded-2xl p-6 shadow-xl transition-all duration-200 ${
        hover ? 'hover:shadow-2xl hover:translate-y-[-1px]' : ''
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
