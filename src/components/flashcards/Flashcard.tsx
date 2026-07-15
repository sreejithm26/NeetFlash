import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import 'highlight.js/styles/github-dark.css';
import { Card } from '../ui/Card';
import classes from './Flashcard.module.css';

interface FlashcardProps {
  front: string;
  back: string;
  flipped: boolean;
  onClick: () => void;
}

export const Flashcard: React.FC<FlashcardProps> = ({ front, back, flipped, onClick }) => {
  // Deterministic color selection based on 'front' content
  const hash = front.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  
  const backColors = [
    { bg: '#86efac', text: '#064e3b' }, // Green
    { bg: '#fde047', text: '#713f12' }, // Yellow
    { bg: '#f9a8d4', text: '#831843' }, // Pink
    { bg: '#fdba74', text: '#7c2d12' }, // Orange
    { bg: '#d8b4fe', text: '#4c1d95' }, // Purple
    { bg: '#99f6e4', text: '#134e4a' }, // Teal
  ];
  
  const colorScheme = backColors[hash % backColors.length];

  return (
    <div className={classes.flashcard} onClick={onClick} style={{ cursor: 'pointer' }}>
      <div className={`${classes.inner} ${flipped ? classes.flipped : ''}`}>
        <Card className={classes.front}>
          <div className={classes.content}>
            <div className={classes.markdownWrapper}>
              <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[[rehypeHighlight, { ignoreMissing: true }]]}>
                {front || ''}
              </ReactMarkdown>
            </div>
          </div>
        </Card>
        
        <Card className={classes.back} style={{ backgroundColor: colorScheme.bg, color: colorScheme.text }}>
          <div className={classes.content}>
            <div className={classes.markdownWrapper}>
              <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[[rehypeHighlight, { ignoreMissing: true }]]}>
                {back || ''}
              </ReactMarkdown>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
