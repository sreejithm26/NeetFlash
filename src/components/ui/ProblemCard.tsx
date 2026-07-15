import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from './Card';
import { Badge } from './Badge';
import { useStore } from '../../store/useStore';
import type { Problem } from '../../types';
import classes from './ProblemCard.module.css';

interface ProblemCardProps {
  problem: Problem;
}

export const ProblemCard: React.FC<ProblemCardProps> = ({ problem }) => {
  const navigate = useNavigate();
  const toggleFavorite = useStore(state => state.toggleFavorite);

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleFavorite(problem.id);
  };

  return (
    <div 
      onClick={() => navigate(`/problem/${problem.id}`)}
      style={{ cursor: 'pointer' }}
    >
      <Card className={classes.problemCard}>
        <div className={classes.problemHeader}>
          <h3 className={classes.problemTitle}>
            {problem.problemNumber ? `${problem.problemNumber}. ` : ''}{problem.title}
          </h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button 
              className={`${classes.favButton} ${problem.isFavorite ? classes.favActive : ''}`}
              onClick={handleFavoriteClick}
              title={problem.isFavorite ? "Remove from Favorites" : "Add to Favorites"}
            >
              {problem.isFavorite ? '♥' : '♡'}
            </button>
            <Badge variant={problem.difficulty === 'Easy' ? 'success' : problem.difficulty === 'Medium' ? 'warning' : 'danger'}>
              {problem.difficulty}
            </Badge>
          </div>
        </div>
        <div className={classes.problemMeta}>
          {problem.pattern && <span className={classes.pattern}>{problem.pattern}</span>}
          {problem.tags?.map(tag => (
            <Badge key={tag} variant="neutral">{tag}</Badge>
          ))}
        </div>
      </Card>
    </div>
  );
};
