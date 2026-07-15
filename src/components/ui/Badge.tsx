import React from 'react';
import clsx from 'clsx';
import classes from './Badge.module.css';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'neutral' | 'success' | 'warning' | 'danger' | 'primary';
}

export const Badge: React.FC<BadgeProps> = ({ children, variant = 'neutral', className, ...props }) => {
  return (
    <span className={clsx(classes.badge, classes[variant], className)} {...props}>
      {children}
    </span>
  );
};
