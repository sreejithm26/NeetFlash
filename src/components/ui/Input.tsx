import React from 'react';
import clsx from 'clsx';
import classes from './Input.module.css';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, ...props }, ref) => {
    return (
      <div className={classes.wrapper}>
        {label && <label className={classes.label}>{label}</label>}
        <input 
          ref={ref}
          className={clsx(classes.input, error && classes.inputError, className)} 
          {...props} 
        />
        {error && <span className={classes.errorMessage}>{error}</span>}
      </div>
    );
  }
);
Input.displayName = 'Input';
