import React from 'react';
import { DrawingCanvas } from '../components/ui/DrawingCanvas';
import classes from './Scratchpad.module.css';

export const Scratchpad: React.FC = () => {
  return (
    <div className={classes.container}>
      <h1 className={classes.title}>Scratchpad</h1>
      <p className={classes.subtitle}>Test your Apple Pencil here! (Drawings are not saved)</p>
      <div style={{ flex: 1, minHeight: '600px', width: '100%' }}>
        <DrawingCanvas />
      </div>
    </div>
  );
};
