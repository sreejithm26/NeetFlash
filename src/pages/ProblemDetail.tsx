import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { AIService } from '../services/ai';
import { Flashcard } from '../components/flashcards/Flashcard';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import 'highlight.js/styles/github-dark.css';
import classes from './ProblemDetail.module.css';

export const ProblemDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const problem = useStore(state => state.problems).find(p => p.id === id);
  const flashcards = useStore(state => state.flashcards).filter(f => f.problemId === id);
  
  const [flippedCards, setFlippedCards] = useState<Record<string, boolean>>({});
  const [isReviewMode, setIsReviewMode] = useState(false);
  const [reviewIndex, setReviewIndex] = useState(0);
  const [reviewFlipped, setReviewFlipped] = useState(false);
  const [direction, setDirection] = useState<'left' | 'right' | null>(null);
  
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);
  
  const [isGeneratingCode, setIsGeneratingCode] = useState(false);
  const [codeError, setCodeError] = useState<string | null>(null);

  const handleGenerateInfographic = async () => {
    if (!problem) return;
    setIsGeneratingImage(true);
    setImageError(null);
    try {
      const base64 = await AIService.generateInfographic(problem);
      useStore.getState().updateProblemImage(problem.id, base64);
    } catch (err: any) {
      setImageError(err.message || 'Failed to generate infographic.');
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const handleGenerateCode = async () => {
    if (!problem) return;
    setIsGeneratingCode(true);
    setCodeError(null);
    try {
      const code = await AIService.generatePatternCode(problem.description || problem.explanation || '', problem.pattern);
      useStore.getState().updatePatternCode(problem.id, code);
    } catch (err: any) {
      setCodeError(err.message || 'Failed to generate code.');
    } finally {
      setIsGeneratingCode(false);
    }
  };

  const handlePrev = useCallback(() => {
    if (reviewIndex > 0) {
      setDirection('left');
      setReviewIndex(prev => prev - 1);
      setReviewFlipped(false);
    }
  }, [reviewIndex]);

  const handleNext = useCallback(() => {
    if (reviewIndex < flashcards.length - 1) {
      setDirection('right');
      setReviewIndex(prev => prev + 1);
      setReviewFlipped(false);
    }
  }, [reviewIndex, flashcards.length]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isReviewMode) return;
      if (e.key === 'Escape') setIsReviewMode(false);
      if (e.key === ' ') {
        e.preventDefault();
        setReviewFlipped(prev => !prev);
      }
      if (e.key === 'ArrowRight') {
        handleNext();
      }
      if (e.key === 'ArrowLeft') {
        handlePrev();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isReviewMode, handleNext, handlePrev]);

  if (!problem) {
    return (
      <div className={classes.container}>
        <div className={classes.notFound}>
          <h2>Problem Not Found</h2>
          <p>This problem may have been deleted or does not exist.</p>
          <Button onClick={() => navigate('/')}>Return to Dashboard</Button>
        </div>
      </div>
    );
  }

  const toggleFlip = (cardId: string) => {
    setFlippedCards(prev => ({ ...prev, [cardId]: !prev[cardId] }));
  };

  if (isReviewMode) {
    const currentCard = flashcards[reviewIndex];
    return (
      <div className={classes.reviewModal}>
        <div className={classes.reviewHeader}>
          <h2>Card {reviewIndex + 1} of {flashcards.length}</h2>
          <Button variant="ghost" onClick={() => setIsReviewMode(false)}>Close (Esc)</Button>
        </div>
        
        <div className={classes.carouselContainer}>
          {/* Left side click/prev card */}
          <div 
            className={`${classes.carouselSide} ${classes.carouselLeft} ${reviewIndex > 0 ? '' : classes.carouselSideDisabled}`}
            onClick={handlePrev}
          >
            {reviewIndex > 0 && (
              <div className={classes.scaledCardWrapper} key={`prev-${reviewIndex}`}>
                <Flashcard
                  front={flashcards[reviewIndex - 1].front}
                  back={flashcards[reviewIndex - 1].back}
                  flipped={false}
                  onClick={() => {}}
                />
              </div>
            )}
          </div>

          {/* Active Card */}
          <div 
            key={reviewIndex} 
            className={`${classes.carouselActive} ${
              direction === 'left' 
                ? classes.slideFromLeft 
                : direction === 'right' 
                  ? classes.slideFromRight 
                  : ''
            }`}
          >
            <Flashcard
              front={currentCard.front}
              back={currentCard.back}
              flipped={reviewFlipped}
              onClick={() => setReviewFlipped(!reviewFlipped)}
            />
          </div>

          {/* Right side click/next card */}
          <div 
            className={`${classes.carouselSide} ${classes.carouselRight} ${reviewIndex < flashcards.length - 1 ? '' : classes.carouselSideDisabled}`}
            onClick={handleNext}
          >
            {reviewIndex < flashcards.length - 1 && (
              <div className={classes.scaledCardWrapper} key={`next-${reviewIndex}`}>
                <Flashcard
                  front={flashcards[reviewIndex + 1].front}
                  back={flashcards[reviewIndex + 1].back}
                  flipped={false}
                  onClick={() => {}}
                />
              </div>
            )}
          </div>
        </div>
        
        <div className={classes.reviewControls}>
          <Button 
            variant="ghost" 
            onClick={handlePrev}
            disabled={reviewIndex === 0}
          >
            ← Previous
          </Button>
          <Button onClick={() => setReviewFlipped(!reviewFlipped)}>
            Flip (Space)
          </Button>
          <Button 
            variant="ghost" 
            onClick={handleNext}
            disabled={reviewIndex === flashcards.length - 1}
          >
            Next →
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={classes.container}>
      <Button variant="ghost" onClick={() => navigate(-1)} className={classes.backButton}>
        ← Back
      </Button>

      <div className={classes.headerActions}>
        <h1 className={classes.title}>{problem.title}</h1>
        <div className={classes.buttonGroup} style={{ display: 'flex', gap: '12px' }}>
          {problem.url && (
            <Button variant="ghost" onClick={() => window.open(problem.url, '_blank')}>
              Open in LeetCode
            </Button>
          )}
          <Button onClick={() => navigate(`/problem/${problem.id}/notes`)}>
            View Notes
          </Button>
          {!problem.imageUrl && (
            <Button 
              variant="ghost" 
              onClick={handleGenerateInfographic} 
              disabled={isGeneratingImage}
            >
              {isGeneratingImage ? 'Generating...' : 'Generate Infographic'}
            </Button>
          )}
          {flashcards.length > 0 && (
            <Button onClick={() => { setIsReviewMode(true); setReviewIndex(0); setReviewFlipped(false); }}>
              Review Flashcards
            </Button>
          )}
          <Button 
            variant="danger"
            onClick={() => {
              if (window.confirm('Are you sure you want to delete this problem and all its flashcards? This action cannot be undone.')) {
                useStore.getState().deleteProblem(problem.id);
                navigate('/');
              }
            }}
          >
            Delete
          </Button>
        </div>
      </div>

      <div className={classes.mainGrid}>
        <div className={classes.leftPane}>
          <Card className={classes.headerCard}>
            <div className={classes.headerContent}>
              <Badge variant={problem.difficulty === 'Easy' ? 'success' : problem.difficulty === 'Medium' ? 'warning' : 'danger'} className={classes.badge}>
                {problem.difficulty}
              </Badge>
              <div className={classes.meta}>
                {problem.pattern && <span className={classes.pattern}>{problem.pattern}</span>}
                {problem.tags?.map(tag => (
                  <Badge key={tag} variant="neutral">{tag}</Badge>
                ))}
              </div>
            </div>
            
            {problem.description && (
              <div className={classes.description}>
                <h3>Problem Statement</h3>
                <div className={classes.markdownContent}>
                  <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[[rehypeHighlight, { ignoreMissing: true }]]}>
                    {problem.description}
                  </ReactMarkdown>
                </div>
              </div>
            )}

            {problem.explanation && (
              <div className={classes.description} style={{ marginTop: '24px', paddingTop: '24px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                <h3>Step-by-Step Approach</h3>
                <div className={classes.markdownContent}>
                  <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[[rehypeHighlight, { ignoreMissing: true }]]}>
                    {problem.explanation}
                  </ReactMarkdown>
                </div>
              </div>
            )}

            {problem.notes && (
              <div className={classes.notes}>
                <h3>Notes</h3>
                <p>{problem.notes}</p>
              </div>
            )}
          </Card>
        </div>

        <div className={classes.rightPane}>
          <Card className={classes.headerCard} style={{ flex: 1, padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 className={classes.sectionTitle} style={{ margin: 0, borderBottom: 'none' }}>Pattern Code</h2>
              {!problem.patternCode && (
                <Button 
                  onClick={handleGenerateCode} 
                  disabled={isGeneratingCode}
                >
                  {isGeneratingCode ? 'Generating...' : 'Generate Code'}
                </Button>
              )}
            </div>
            
            {codeError && (
              <div className={classes.error} style={{ color: '#ef4444', marginBottom: '16px', padding: '16px', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '8px' }}>
                {codeError}
              </div>
            )}

            {problem.patternCode ? (
              <div className={classes.codeContainer}>
                <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[[rehypeHighlight, { ignoreMissing: true }]]}>
                  {problem.patternCode}
                </ReactMarkdown>
              </div>
            ) : (
              !isGeneratingCode && (
                <div className={classes.emptyState} style={{ padding: '32px 16px' }}>
                  <p>No pattern code generated yet. Click generate to create an optimal implementation based on the identified pattern.</p>
                </div>
              )
            )}
          </Card>
        </div>
      </div>

      {imageError && (
        <div className={classes.error} style={{ color: '#ef4444', marginBottom: '16px', padding: '16px', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '8px' }}>
          {imageError}
        </div>
      )}

      {problem.imageUrl && (
        <Card className={classes.headerCard} style={{ marginTop: '32px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 className={classes.sectionTitle} style={{ margin: 0 }}>Solution Infographic</h2>
            <Button 
              variant="ghost" 
              onClick={() => {
                const link = document.createElement('a');
                link.href = problem.imageUrl!;
                link.download = `${problem.title.replace(/\s+/g, '_')}_Infographic.png`;
                link.click();
              }}
            >
              Download
            </Button>
          </div>
          <div style={{ background: '#fff', padding: '16px', borderRadius: '8px', textAlign: 'center' }}>
            <img 
              src={problem.imageUrl} 
              alt="Algorithm Infographic" 
              style={{ maxWidth: '100%', height: 'auto', borderRadius: '4px' }} 
            />
          </div>
        </Card>
      )}

      <h2 className={classes.sectionTitle} style={{ marginTop: '32px' }}>All Flashcards ({flashcards.length})</h2>
      
      {flashcards.length === 0 ? (
        <div className={classes.emptyState}>
          <p>No flashcards found for this problem.</p>
        </div>
      ) : (
        <div className={classes.flashcardsGrid}>
          {flashcards.map((card, index) => (
            <div key={card.id} className={classes.flashcardWrapper}>
              <div className={classes.flashcardHeader}>Card {index + 1}</div>
              <Flashcard
                front={card.front}
                back={card.back}
                flipped={!!flippedCards[card.id]}
                onClick={() => toggleFlip(card.id)}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
