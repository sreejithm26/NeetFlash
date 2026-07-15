import React from 'react';
import clsx from 'clsx';
import classes from './Button.module.css';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'success' | 'warning';
  size?: 'sm' | 'md' | 'lg';
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  size = 'md',
  className,
  ...props 
}) => {
  return (
    <button 
      className={clsx(classes.button, classes[variant], classes[size], className)} 
      {...props}
    >
      {children}
    </button>
  );
};
