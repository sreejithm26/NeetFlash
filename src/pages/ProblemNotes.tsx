import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { ApiService } from '../services/api';
import { DrawingCanvas } from '../components/ui/DrawingCanvas';
import { Button } from '../components/ui/Button';
import classes from './ProblemNotes.module.css';
import { ArrowLeft } from 'lucide-react';

export const ProblemNotes: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const problem = useStore(state => state.problems.find(p => p.id === id));
  
  const [strokes, setStrokes] = useState<any[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  
  useEffect(() => {
    if (id) {
      ApiService.getDrawing(id).then(res => {
        setStrokes(res.strokes || []);
        setIsLoaded(true);
      }).catch(err => {
        console.error("Failed to load drawing", err);
        setIsLoaded(true);
      });
    }
  }, [id]);

  if (!problem) {
    return <div className={classes.container}>Problem not found</div>;
  }

  const handleSave = (newStrokes: any[]) => {
    if (id) {
      ApiService.updateDrawing(id, newStrokes);
    }
  };

  return (
    <div className={classes.container}>
      <header className={classes.header}>
        <div>
          <h1 className={classes.title}>Notes: {problem.title}</h1>
          <p className={classes.subtitle}>Use your Apple Pencil to sketch out algorithms</p>
        </div>
        <Button variant="ghost" onClick={() => navigate(`/problem/${id}`)}>
          <ArrowLeft size={16} style={{ marginRight: '8px' }} />
          Back to Problem
        </Button>
      </header>

      <div style={{ flex: 1, minHeight: '600px', width: '100%', position: 'relative' }}>
        {!isLoaded ? (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            Loading notes...
          </div>
        ) : (
          <DrawingCanvas 
            initialStrokes={strokes}
            onSave={handleSave}
          />
        )}
      </div>
    </div>
  );
};
