import React from 'react';
import clsx from 'clsx';
import classes from './Card.module.css';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  glass?: boolean;
}

export const Card: React.FC<CardProps> = ({ children, className, glass, ...props }) => {
  return (
    <div className={clsx(classes.card, glass && classes.glass, className)} {...props}>
      {children}
    </div>
  );
};
