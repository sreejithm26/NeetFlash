import React, { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { Button } from '../components/ui/Button';
import { ProblemCard } from '../components/ui/ProblemCard';
import classes from './CategoryDetail.module.css';
import type { Problem } from '../types';

export const CategoryDetail: React.FC = () => {
  const { pattern } = useParams<{ pattern: string }>();
  const navigate = useNavigate();
  const problems = useStore(state => state.problems);

  const decodedPattern = pattern ? decodeURIComponent(pattern) : '';

  const categoryProblems = useMemo(() => {
    if (decodedPattern === 'Favorites') {
      return problems.filter(p => p.isFavorite);
    }
    return problems.filter(p => p.pattern === decodedPattern);
  }, [problems, decodedPattern]);

  const groupedProblems = useMemo(() => {
    const groups: Record<string, Problem[]> = {};
    categoryProblems.forEach(p => {
      const sub = p.subPattern || 'General';
      if (!groups[sub]) groups[sub] = [];
      groups[sub].push(p);
    });
    
    // Sort groups alphabetically, but ensure 'General' is always first
    return Object.entries(groups).sort(([a], [b]) => {
      if (a === 'General') return -1;
      if (b === 'General') return 1;
      return a.localeCompare(b);
    });
  }, [categoryProblems]);

  if (!decodedPattern) {
    return null;
  }

  return (
    <div className={classes.container}>
      <Button variant="ghost" onClick={() => navigate(-1)} className={classes.backButton}>
        ← Back to Dashboard
      </Button>

      <header className={classes.header}>
        <h1 className={classes.title}>
          {decodedPattern === 'Favorites' ? '❤️ Favorites' : `${decodedPattern} Problems`}
        </h1>
      </header>

      {categoryProblems.length === 0 ? (
        <div className={classes.emptyState}>
          <p>No problems found in this category.</p>
        </div>
      ) : (
        <div className={classes.groupsContainer}>
          {groupedProblems.map(([subPattern, groupProblems]) => (
            <div key={subPattern} className={classes.subgroup}>
              <h2 className={classes.subTitle}>
                {subPattern} <span style={{ opacity: 0.5, fontSize: '14px', marginLeft: '8px' }}>({groupProblems.length})</span>
              </h2>
              <div className={classes.problemsList}>
                {groupProblems.map(problem => (
                  <ProblemCard key={problem.id} problem={problem} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
