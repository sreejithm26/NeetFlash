import React, { useMemo, useRef, useEffect } from 'react';
import { useStore } from '../../store/useStore';
import { Card } from '../ui/Card';
import classes from './LeetCodeStats.module.css';

// LeetCode's actual problem counts (approximate/real)
const TOTAL_EASY = 954;
const TOTAL_MEDIUM = 2084;
const TOTAL_HARD = 953;
const TOTAL_PROBLEMS = TOTAL_EASY + TOTAL_MEDIUM + TOTAL_HARD;

export const LeetCodeStats: React.FC = () => {
  const problems = useStore(state => state.problems);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollLeft = scrollRef.current.scrollWidth;
    }
  }, []);

  // Difficulty counts
  const easyCount = useMemo(() => problems.filter(p => p.difficulty === 'Easy').length, [problems]);
  const mediumCount = useMemo(() => problems.filter(p => p.difficulty === 'Medium').length, [problems]);
  const hardCount = useMemo(() => problems.filter(p => p.difficulty === 'Hard').length, [problems]);
  const totalCount = problems.length;

  // Ratios
  const easyRatio = Math.min(easyCount / TOTAL_EASY, 1);
  const mediumRatio = Math.min(mediumCount / TOTAL_MEDIUM, 1);
  const hardRatio = Math.min(hardCount / TOTAL_HARD, 1);
  const totalRatio = Math.min(totalCount / TOTAL_PROBLEMS, 1);

  // Circle Gauge Math
  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - totalRatio * circumference;

  // Heatmap generation
  const { heatmapData, totalActiveDays, maxStreak } = useMemo(() => {
    const today = new Date();
    today.setHours(23, 59, 59, 999); // End of today

    // Sunday of 52 weeks ago
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - 364 - today.getDay());
    startDate.setHours(0, 0, 0, 0);

    // Map problems to dates (YYYY-MM-DD)
    const solvedCounts: Record<string, number> = {};
    problems.forEach(p => {
      if (p.addedAt) {
        const dateStr = p.addedAt.split('T')[0];
        solvedCounts[dateStr] = (solvedCounts[dateStr] || 0) + 1;
      }
    });

    // Generate 371 cells (53 weeks * 7 days)
    const cells = [];
    let activeDays = 0;
    const activeDatesList: string[] = [];

    for (let i = 0; i < 371; i++) {
      const cellDate = new Date(startDate);
      cellDate.setDate(startDate.getDate() + i);
      const dateStr = cellDate.toISOString().split('T')[0];
      const count = solvedCounts[dateStr] || 0;
      
      const isFuture = cellDate > today;

      if (count > 0 && !isFuture) {
        activeDays++;
        activeDatesList.push(dateStr);
      }

      // Determine visual intensity level
      let level = 0;
      if (count === 1) level = 1;
      else if (count === 2) level = 2;
      else if (count >= 3 && count <= 4) level = 3;
      else if (count >= 5) level = 4;

      cells.push({
        date: dateStr,
        count,
        level: isFuture ? -1 : level,
        formattedDate: cellDate.toLocaleDateString(undefined, { 
          month: 'short', 
          day: 'numeric', 
          year: 'numeric' 
        })
      });
    }

    // Calculate max streak
    let currentStreak = 0;
    let computedMaxStreak = 0;
    const sortedUniqueDates = Array.from(new Set(activeDatesList)).sort();

    if (sortedUniqueDates.length > 0) {
      currentStreak = 1;
      computedMaxStreak = 1;
      
      for (let i = 1; i < sortedUniqueDates.length; i++) {
        const prev = new Date(sortedUniqueDates[i - 1]);
        const curr = new Date(sortedUniqueDates[i]);
        
        // Calculate difference in days
        const diffTime = Math.abs(curr.getTime() - prev.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays === 1) {
          currentStreak++;
        } else if (diffDays > 1) {
          computedMaxStreak = Math.max(computedMaxStreak, currentStreak);
          currentStreak = 1;
        }
      }
      computedMaxStreak = Math.max(computedMaxStreak, currentStreak);
    }

    return {
      heatmapData: cells,
      totalActiveDays: activeDays,
      maxStreak: computedMaxStreak
    };
  }, [problems]);

  // Labels for the heatmap months
  const monthLabels = useMemo(() => {
    const labels = [];
    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - 364 - today.getDay());

    let lastMonth = -1;
    for (let i = 0; i < 53; i++) {
      const cellDate = new Date(startDate);
      cellDate.setDate(startDate.getDate() + i * 7);
      const month = cellDate.getMonth();
      if (month !== lastMonth) {
        labels.push({
          name: cellDate.toLocaleDateString(undefined, { month: 'short' }),
          index: i
        });
        lastMonth = month;
      }
    }
    return labels;
  }, []);

  return (
    <div className={classes.statsContainer}>
      {/* Solved Stats Card */}
      <Card className={classes.solvedCard}>
        <div className={classes.circularProgress}>
          <svg className={classes.progressSvg} viewBox="0 0 100 100">
            <defs>
              <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#7c3aed" />
                <stop offset="100%" stopColor="#f43f5e" />
              </linearGradient>
            </defs>
            <circle
              className={classes.progressBackground}
              cx="50"
              cy="50"
              r={radius}
              strokeWidth="8"
            />
            <circle
              className={classes.progressValue}
              cx="50"
              cy="50"
              r={radius}
              strokeWidth="8"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
            />
          </svg>
          <div className={classes.progressText}>
            <span className={classes.solvedNum}>{totalCount}</span>
            <span className={classes.totalNum}>/{TOTAL_PROBLEMS}</span>
            <span className={classes.solvedLabel}>Solved</span>
          </div>
        </div>

        <div className={classes.difficultyBreakdown}>
          {/* Easy Row */}
          <div>
            <div className={classes.diffRow}>
              <span className={`${classes.diffName} ${classes.diffEasy}`}>Easy</span>
              <span className={classes.diffCount}>
                <strong className={classes.diffCountAccent}>{easyCount}</strong>/{TOTAL_EASY}
              </span>
            </div>
            <div className={classes.progressBarContainer}>
              <div 
                className={`${classes.progressBar} ${classes.barEasy}`} 
                style={{ width: `${easyRatio * 100}%` }}
              />
            </div>
          </div>

          {/* Medium Row */}
          <div>
            <div className={classes.diffRow}>
              <span className={`${classes.diffName} ${classes.diffMedium}`}>Medium</span>
              <span className={classes.diffCount}>
                <strong className={classes.diffCountAccent}>{mediumCount}</strong>/{TOTAL_MEDIUM}
              </span>
            </div>
            <div className={classes.progressBarContainer}>
              <div 
                className={`${classes.progressBar} ${classes.barMedium}`} 
                style={{ width: `${mediumRatio * 100}%` }}
              />
            </div>
          </div>

          {/* Hard Row */}
          <div>
            <div className={classes.diffRow}>
              <span className={`${classes.diffName} ${classes.diffHard}`}>Hard</span>
              <span className={classes.diffCount}>
                <strong className={classes.diffCountAccent}>{hardCount}</strong>/{TOTAL_HARD}
              </span>
            </div>
            <div className={classes.progressBarContainer}>
              <div 
                className={`${classes.progressBar} ${classes.barHard}`} 
                style={{ width: `${hardRatio * 100}%` }}
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Heatmap Card */}
      <Card className={classes.heatmapCard}>
        <div className={classes.heatmapHeader}>
          <h3 className={classes.cardTitle}>{problems.length} Solved in the past one year</h3>
          <div className={classes.heatmapStats}>
            <span className={classes.heatmapStatItem}>
              Total active days: <strong className={classes.heatmapStatVal}>{totalActiveDays}</strong>
            </span>
            <span className={classes.heatmapStatItem}>
              Max streak: <strong className={classes.heatmapStatVal}>{maxStreak} days</strong>
            </span>
          </div>
        </div>

        <div ref={scrollRef} className={classes.heatmapGridWrapper}>
          <div className={classes.heatmapMonths}>
            {monthLabels.map((lbl, idx) => (
              <span 
                key={idx} 
                className={classes.monthLabel}
                style={{ marginLeft: idx === 0 ? `${lbl.index * 14}px` : undefined }}
              >
                {lbl.name}
              </span>
            ))}
          </div>
          <div 
            className={classes.heatmapGrid}
            style={{
              gridTemplateColumns: 'repeat(53, 11px)',
              gridAutoFlow: 'column'
            }}
          >
            {heatmapData.map((cell, idx) => (
              <div
                key={idx}
                className={`${classes.heatmapCell} ${
                  cell.level === -1 
                    ? '' 
                    : cell.level === 0 
                      ? classes.cellLvl0 
                      : cell.level === 1 
                        ? classes.cellLvl1 
                        : cell.level === 2 
                          ? classes.cellLvl2 
                          : cell.level === 3 
                            ? classes.cellLvl3 
                            : classes.cellLvl4
                }`}
                style={{ visibility: cell.level === -1 ? 'hidden' : 'visible' }}
              >
                <div className={classes.heatmapTooltip}>
                  <strong>{cell.count} solved</strong> on {cell.formattedDate}
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
};
