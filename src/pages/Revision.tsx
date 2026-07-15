import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { calculateSM2 } from '../utils/sm2';
import { Flashcard } from '../components/flashcards/Flashcard';
import { Button } from '../components/ui/Button';
import classes from './Revision.module.css';

export const Revision: React.FC = () => {
  const flashcards = useStore(state => state.flashcards);
  const updateFlashcardSM2 = useStore(state => state.updateFlashcardSM2);
  const navigate = useNavigate();

  const [flipped, setFlipped] = useState(false);

  const dueCards = useMemo(() => {
    const now = new Date().toISOString();
    return flashcards.filter(c => c.sm2Data.nextReviewDate <= now);
  }, [flashcards]);

  const currentIndex = 0;

  const currentCard = dueCards[currentIndex];

  const handleScore = useCallback((score: number) => {
    if (!currentCard) return;
    
    const newSM2Data = calculateSM2(score, currentCard.sm2Data);
    updateFlashcardSM2(currentCard.id, newSM2Data);
    
    setFlipped(false);
    // Don't advance currentIndex because the array size will shrink as cards are updated
    // dueCards is technically memoized on flashcards, so it updates and removes the current card if it's no longer due.
  }, [currentCard, updateFlashcardSM2]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === ' ') {
      e.preventDefault();
      setFlipped(prev => !prev);
    } else if (flipped) {
      if (e.key === '1') handleScore(1);
      if (e.key === '2') handleScore(3);
      if (e.key === '3') handleScore(4);
      if (e.key === '4') handleScore(5);
    }
  }, [flipped, handleScore]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  if (dueCards.length === 0) {
    return (
      <div className={classes.container}>
        <div className={classes.emptyState}>
          <h2>You're all caught up!</h2>
          <p>No more flashcards to review right now.</p>
          <Button onClick={() => navigate('/')}>Back to Dashboard</Button>
        </div>
      </div>
    );
  }

  return (
    <div className={classes.container}>
      <header className={classes.header}>
        <h2>Revision Session</h2>
        <span>{dueCards.length} cards remaining</span>
      </header>

      <div className={classes.cardWrapper}>
        <Flashcard 
          front={currentCard.front} 
          back={currentCard.back} 
          flipped={flipped} 
          onClick={() => setFlipped(!flipped)}
        />
      </div>

      <div className={classes.controls}>
        {!flipped ? (
          <Button size="lg" onClick={() => setFlipped(true)}>
            Show Answer (Space)
          </Button>
        ) : (
          <div className={classes.scoreButtons}>
            <Button variant="danger" onClick={() => handleScore(1)}>Again (1)</Button>
            <Button variant="warning" onClick={() => handleScore(3)}>Hard (2)</Button>
            <Button variant="primary" onClick={() => handleScore(4)}>Good (3)</Button>
            <Button variant="success" onClick={() => handleScore(5)}>Easy (4)</Button>
          </div>
        )}
      </div>
    </div>
  );
};
