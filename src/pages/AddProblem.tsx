import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { useStore } from '../store/useStore';
import { AIService } from '../services/ai';
import { INITIAL_SM2_DATA } from '../utils/sm2';
import classes from './AddProblem.module.css';

const generateId = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
};

export const AddProblem: React.FC = () => {
  const [mode, setMode] = useState<'single' | 'batch'>('single');
  
  // Single mode state
  const [problemText, setProblemText] = useState('');
  const [problemNumber, setProblemNumber] = useState('');
  const [difficulty, setDifficulty] = useState<'Auto' | 'Easy' | 'Medium' | 'Hard'>('Auto');
  const [problemUrl, setProblemUrl] = useState<string | undefined>(undefined);
  
  // Batch mode state
  const [batchText, setBatchText] = useState('');
  const [batchProgress, setBatchProgress] = useState<{current: number, total: number, message: string} | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const addProblem = useStore(state => state.addProblem);
  const navigate = useNavigate();

  // Helper to fetch question data from LeetCode
  const fetchLeetCodeData = async (slug: string) => {
    const res = await fetch('/api/leetcode', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: `
          query questionData($titleSlug: String!) {
            question(titleSlug: $titleSlug) {
              questionFrontendId
              title
              content
              difficulty
            }
          }
        `,
        variables: { titleSlug: slug }
      })
    });
    
    if (!res.ok) throw new Error('API request failed');
    const data = await res.json();
    return data.data?.question;
  };

  // Helper to clean HTML content
  const cleanHtmlContent = (html: string) => {
    return html
      .replace(/<p>/g, '\n')
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .trim();
  };

  // Auto-fetch for single mode if user pastes a URL
  useEffect(() => {
    if (mode === 'single' && problemText.trim().startsWith('http') && problemText.includes('leetcode.com/problems/')) {
      const match = problemText.match(/leetcode\.com\/problems\/([^/\s]+)/);
      if (match) {
        const slug = match[1];
        setLoading(true);
        setError(null);
        
        fetchLeetCodeData(slug)
          .then(q => {
            if (q) {
              setProblemNumber(q.questionFrontendId);
              setDifficulty(q.difficulty);
              
              const cleanContent = cleanHtmlContent(q.content);
              setProblemText(`Title: ${q.title}\nDifficulty: ${q.difficulty}\n\n${cleanContent}`);
              setProblemUrl(problemText.trim());
            } else {
              setError('Could not find problem data for this URL.');
            }
          })
          .catch(() => {
            setError('Failed to fetch problem from URL. The Vite proxy might be restarting, please try again.');
          })
          .finally(() => {
            setLoading(false);
          });
      }
    }
  }, [problemText, mode]);

  const handleGenerateSingle = async () => {
    if (!problemText.trim()) {
      setError('Please paste the problem statement.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const result = await AIService.generateFlashcards(problemText);
      
      const problemId = generateId();
      
      const newProblem = {
        id: problemId,
        problemNumber: problemNumber ? parseInt(problemNumber, 10) : undefined,
        title: result.metadata.title,
        difficulty: difficulty === 'Auto' ? result.metadata.difficulty : difficulty,
        pattern: result.metadata.pattern,
        subPattern: result.metadata.subPattern,
        description: problemText,
        explanation: result.metadata.explanation,
        tags: result.metadata.tags || [],
        companies: result.metadata.companies || [],
        url: problemUrl,
        addedAt: new Date().toISOString(),
      };

      const newFlashcards = result.flashcards.map((card: any) => ({
        id: generateId(),
        problemId: problemId,
        title: card.title,
        front: card.front,
        back: card.back,
        sm2Data: { ...INITIAL_SM2_DATA }
      }));

      addProblem(newProblem as any, newFlashcards);
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'An error occurred during generation.');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateBatch = async () => {
    const regex = /leetcode\.com\/problems\/([^/\s]+)/g;
    const matches = [...batchText.matchAll(regex)];
    const slugs = [...new Set(matches.map(m => m[1]))];

    if (slugs.length === 0) {
      setError('No valid LeetCode problem URLs found. Please paste full URLs like https://leetcode.com/problems/two-sum/');
      return;
    }

    setLoading(true);
    setError(null);
    let successCount = 0;

    for (let i = 0; i < slugs.length; i++) {
      const slug = slugs[i];
      setBatchProgress({ current: i + 1, total: slugs.length, message: `Fetching data for ${slug}...` });
      
      try {
        const q = await fetchLeetCodeData(slug);
        if (!q) throw new Error('Question not found');

        const cleanContent = cleanHtmlContent(q.content);
        const pText = `Title: ${q.title}\nDifficulty: ${q.difficulty}\n\n${cleanContent}`;
        
        setBatchProgress({ current: i + 1, total: slugs.length, message: `Generating Flashcards for ${q.title}...` });

        const result = await AIService.generateFlashcards(pText);
        
        const problemId = generateId();
        const newProblem = {
          id: problemId,
          problemNumber: parseInt(q.questionFrontendId, 10),
          title: result.metadata.title,
          difficulty: q.difficulty, // Use actual difficulty
          pattern: result.metadata.pattern,
          subPattern: result.metadata.subPattern,
          description: pText,
          explanation: result.metadata.explanation,
          tags: result.metadata.tags || [],
          companies: result.metadata.companies || [],
          url: `https://leetcode.com/problems/${slug}/`,
          addedAt: new Date().toISOString(),
        };

        const newFlashcards = result.flashcards.map((card: any) => ({
          id: generateId(),
          problemId: problemId,
          title: card.title,
          front: card.front,
          back: card.back,
          sm2Data: { ...INITIAL_SM2_DATA }
        }));

        addProblem(newProblem as any, newFlashcards);
        successCount++;
      } catch (err: any) {
        console.error(`Error processing ${slug}:`, err);
        // Continue to the next URL, but we could accumulate errors to show at the end
      }
    }

    setLoading(false);
    setBatchProgress(null);

    if (successCount > 0) {
      navigate('/');
    } else {
      setError('Failed to process any of the provided URLs. Check console for details.');
    }
  };

  return (
    <div className={classes.container}>
      <Card className={classes.card}>
        <div className={classes.modeTabs}>
          <button 
            className={mode === 'single' ? classes.tabActive : classes.tab} 
            onClick={() => setMode('single')}
            disabled={loading}
          >
            Single Problem
          </button>
          <button 
            className={mode === 'batch' ? classes.tabActive : classes.tab} 
            onClick={() => setMode('batch')}
            disabled={loading}
          >
            Batch URLs
          </button>
        </div>

        <h2 className={classes.title}>
          {mode === 'single' ? 'Add New Problem' : 'Batch Load Problems'}
        </h2>
        <p className={classes.subtitle}>
          {mode === 'single' 
            ? 'Paste the LeetCode problem statement or URL below. Our AI will automatically categorize it and generate concise revision flashcards.'
            : 'Paste multiple LeetCode URLs (one per line). The system will automatically fetch and process them sequentially.'
          }
        </p>
        
        {mode === 'single' ? (
          <>
            <div style={{ display: 'flex', gap: '16px', marginBottom: '8px' }}>
              <div className={classes.formGroup} style={{ flex: 1 }}>
                <label className={classes.label}>Problem Number (Optional)</label>
                <input 
                  type="number"
                  className={classes.textarea}
                  style={{ minHeight: 'auto', padding: '12px' }}
                  placeholder="e.g. 1"
                  value={problemNumber}
                  onChange={(e) => setProblemNumber(e.target.value)}
                  disabled={loading}
                />
              </div>
              <div className={classes.formGroup} style={{ flex: 1 }}>
                <label className={classes.label}>Difficulty</label>
                <select 
                  className={classes.textarea}
                  style={{ minHeight: 'auto', padding: '12px', appearance: 'auto' }}
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value as any)}
                  disabled={loading}
                >
                  <option value="Auto">Auto-Detect</option>
                  <option value="Easy">Easy</option>
                  <option value="Medium">Medium</option>
                  <option value="Hard">Hard</option>
                </select>
              </div>
            </div>

            <div className={classes.formGroup}>
              <label className={classes.label}>Problem Statement or URL</label>
              <textarea 
                className={classes.textarea}
                placeholder="Paste the problem statement or URL here..."
                value={problemText}
                onChange={(e) => setProblemText(e.target.value)}
                rows={12}
                disabled={loading}
              />
            </div>
          </>
        ) : (
          <div className={classes.formGroup}>
            <label className={classes.label}>LeetCode URLs</label>
            <textarea 
              className={classes.textarea}
              placeholder="https://leetcode.com/problems/two-sum/&#10;https://leetcode.com/problems/3sum/&#10;https://leetcode.com/problems/4sum/"
              value={batchText}
              onChange={(e) => setBatchText(e.target.value)}
              rows={12}
              disabled={loading}
            />
          </div>
        )}

        {error && <div className={classes.error}>{error}</div>}

        {batchProgress && (
          <div className={classes.progressContainer}>
            <div className={classes.progressText}>
              <span>{batchProgress.message}</span>
              <span>{batchProgress.current} / {batchProgress.total}</span>
            </div>
            <div className={classes.progressBar}>
              <div 
                className={classes.progressFill} 
                style={{ width: `${(batchProgress.current / batchProgress.total) * 100}%` }}
              />
            </div>
          </div>
        )}

        <div className={classes.actions}>
          <Button variant="ghost" onClick={() => navigate('/')} disabled={loading}>Cancel</Button>
          <Button onClick={mode === 'single' ? handleGenerateSingle : handleGenerateBatch} disabled={loading}>
            {loading 
              ? (mode === 'single' ? 'Generating...' : 'Processing Batch...') 
              : (mode === 'single' ? 'Generate Flashcards' : 'Process Batch')
            }
          </Button>
        </div>
      </Card>
    </div>
  );
};
