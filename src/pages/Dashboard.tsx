import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { ProblemCard } from '../components/ui/ProblemCard';
import { LeetCodeStats } from '../components/dashboard/LeetCodeStats';
import classes from './Dashboard.module.css';

export const Dashboard: React.FC = () => {
  const problems = useStore(state => state.problems);
  const navigate = useNavigate();

  const favoriteCount = useMemo(() => {
    return problems.filter(p => p.isFavorite).length;
  }, [problems]);

  const categories = useMemo(() => {
    const counts: Record<string, number> = {};
    problems.forEach(p => {
      if (p.pattern) {
        counts[p.pattern] = (counts[p.pattern] || 0) + 1;
      }
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [problems]);

  const displayedProblems = problems;

  return (
    <div className={classes.container}>
      <header className={classes.header}>
        <h1 className={classes.title}>Dashboard</h1>
        <Button onClick={() => navigate('/add')}>Add Problem</Button>
      </header>

      <LeetCodeStats />

      {(categories.length > 0 || favoriteCount > 0) && (
        <>
          <h2 className={classes.sectionTitle} style={{ marginTop: '32px' }}>Problem Categories</h2>
          <div className={classes.categoryGrid}>
            {favoriteCount > 0 && (
              <Card 
                key="Favorites" 
                className={`${classes.categoryCard} ${classes.categoryFavorites}`}
                onClick={() => navigate('/category/Favorites')}
              >
                <div className={classes.categoryName}>❤️ Favorites</div>
                <Badge variant="neutral">
                  {favoriteCount} Problem{favoriteCount !== 1 ? 's' : ''}
                </Badge>
              </Card>
            )}
            {categories.map(([pattern, count]) => (
              <Card 
                key={pattern} 
                className={classes.categoryCard}
                onClick={() => navigate(`/category/${encodeURIComponent(pattern)}`)}
              >
                <div className={classes.categoryName}>{pattern}</div>
                <Badge variant="neutral">
                  {count} Problem{count !== 1 ? 's' : ''}
                </Badge>
              </Card>
            ))}
          </div>
        </>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '32px 0 16px' }}>
        <h2 className={classes.sectionTitle} style={{ margin: 0, flex: 1 }}>
          Recent Problems
        </h2>
      </div>

      <div className={classes.problemsList}>
        {displayedProblems.length === 0 ? (
          <div className={classes.emptyState}>
            <p>No problems found.</p>
          </div>
        ) : (
          displayedProblems.map(problem => (
            <ProblemCard key={problem.id} problem={problem} />
          ))
        )}
      </div>
    </div>
  );
};
