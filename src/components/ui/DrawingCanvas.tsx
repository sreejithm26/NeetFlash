import React, { useRef, useState, useEffect } from 'react';
import { getStroke } from 'perfect-freehand';
import { Undo2, Redo2, Target, Hand, PenLine, Lock, Unlock } from 'lucide-react';
import classes from './DrawingCanvas.module.css';
import { Button } from './Button';

// Utility to convert perfect-freehand stroke points to SVG path string
const getSvgPathFromStroke = (stroke: number[][]) => {
  if (!stroke.length) return '';

  const d = stroke.reduce(
    (acc, [x0, y0], i, arr) => {
      const [x1, y1] = arr[(i + 1) % arr.length];
      acc.push(x0, y0, (x0 + x1) / 2, (y0 + y1) / 2);
      return acc;
    },
    ['M', ...stroke[0], 'Q']
  );

  d.push('Z');
  return d.join(' ');
};

interface DrawingCanvasProps {
  initialStrokes?: any[];
  onSave?: (strokes: any[]) => void;
  defaultLocked?: boolean;
}

const EMPTY_ARRAY: any[] = [];
const COLORS = ['#1a1a1a', '#2563eb', '#dc2626', '#16a34a'];

// Legacy support: converts raw arrays to objects with colors
const normalizeStrokes = (input: any[]): any[] => {
  return input.map(s => Array.isArray(s) ? { points: s, color: '#1a1a1a' } : s);
};

export const DrawingCanvas: React.FC<DrawingCanvasProps> = ({ initialStrokes = EMPTY_ARRAY, onSave, defaultLocked = true }) => {
  // History state for Undo/Redo
  const [history, setHistory] = useState<any[][]>([normalizeStrokes(initialStrokes)]);
  const [historyIndex, setHistoryIndex] = useState(0);
  
  // Camera / Pan / Zoom state
  const [camera, setCamera] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);
  const [mode, setMode] = useState<'draw' | 'pan'>('draw');
  const [isEditing, setIsEditing] = useState(!defaultLocked);
  
  const panPointersRef = useRef<Set<number>>(new Set());
  const panStartRef = useRef<{ pointerId: number; clientX: number; clientY: number; cameraX: number; cameraY: number } | null>(null);

  const [currentColor, setCurrentColor] = useState(COLORS[0]);
  const [currentStroke, setCurrentStroke] = useState<any[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  const strokes = history[historyIndex] || [];

  // Sync initialStrokes if they change externally (e.g. switching problems)
  useEffect(() => {
    setHistory([normalizeStrokes(initialStrokes)]);
    setHistoryIndex(0);
  }, [initialStrokes]);

  // Handle native wheel event for zooming to prevent browser scale
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    
    const handleWheelNative = (e: WheelEvent) => {
      if (e.ctrlKey) {
        e.preventDefault(); // Prevent browser zoom
      }
      
      const scaleFactor = 1 - e.deltaY * 0.005;
      const newScale = Math.min(Math.max(0.1, scale * scaleFactor), 10);
      
      const rect = container.getBoundingClientRect();
      const cursorX = e.clientX - rect.left;
      const cursorY = e.clientY - rect.top;
      
      const newX = cursorX - ((cursorX - camera.x) / scale) * newScale;
      const newY = cursorY - ((cursorY - camera.y) / scale) * newScale;
      
      setCamera({ x: newX, y: newY });
      setScale(newScale);
    };

    container.addEventListener('wheel', handleWheelNative, { passive: false });
    return () => container.removeEventListener('wheel', handleWheelNative);
  }, [scale, camera]);

  const handlePointerDown = (e: React.PointerEvent) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    if (!containerRef.current) return;
    
    // Determine if we should pan: manual mode, touch (finger on iPad), middle/right click, OR read-only mode
    const shouldPan = !isEditing || mode === 'pan' || e.pointerType === 'touch' || e.button === 1 || e.button === 2;
    
    if (shouldPan) {
      panPointersRef.current.add(e.pointerId);
      
      // If this is the active panning pointer (first one down), set it up
      if (!panStartRef.current) {
        panStartRef.current = {
          pointerId: e.pointerId,
          clientX: e.clientX,
          clientY: e.clientY,
          cameraX: camera.x,
          cameraY: camera.y
        };
      }
      return;
    }
    
    // Draw mode
    const rect = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left - camera.x) / scale;
    const y = (e.clientY - rect.top - camera.y) / scale;
    
    setCurrentStroke([[x, y, e.pressure || 0.5]]);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (panPointersRef.current.has(e.pointerId)) {
      if (panStartRef.current && panStartRef.current.pointerId === e.pointerId) {
        const dx = e.clientX - panStartRef.current.clientX;
        const dy = e.clientY - panStartRef.current.clientY;
        setCamera({
          x: panStartRef.current.cameraX + dx,
          y: panStartRef.current.cameraY + dy
        });
      }
      return; // Never draw if this is a pan pointer
    }

    if (!isEditing || e.buttons !== 1) return; // Only draw when active and editing
    if (!containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left - camera.x) / scale;
    const y = (e.clientY - rect.top - camera.y) / scale;

    setCurrentStroke(prev => [...prev, [x, y, e.pressure || 0.5]]);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    e.currentTarget.releasePointerCapture(e.pointerId);
    
    if (panPointersRef.current.has(e.pointerId)) {
      panPointersRef.current.delete(e.pointerId);
      if (panStartRef.current?.pointerId === e.pointerId) {
        panStartRef.current = null;
      }
      return;
    }
    
    if (currentStroke.length > 0) {
      const newStroke = { points: currentStroke, color: currentColor };
      const newStrokes = [...strokes, newStroke];
      
      const newHistory = [...history.slice(0, historyIndex + 1), newStrokes];
      setHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
      
      setCurrentStroke([]);
      if (onSave) onSave(newStrokes);
    }
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      if (onSave) onSave(history[newIndex]);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      if (onSave) onSave(history[newIndex]);
    }
  };

  const handleClear = () => {
    if (window.confirm("Are you sure you want to clear your drawing?")) {
      const newHistory = [...history.slice(0, historyIndex + 1), []];
      setHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
      if (onSave) onSave([]);
      setCamera({ x: 0, y: 0 }); 
      setScale(1);
    }
  };

  const strokeOptions = {
    size: 6,
    thinning: 0.7,
    smoothing: 0.8,
    streamline: 0.7,
    easing: (t: number) => t,
    start: { taper: 0, easing: (t: number) => t, cap: true },
    end: { taper: 0, easing: (t: number) => t, cap: true }
  };

  return (
    <div className={classes.wrapper}>
      <div className={classes.toolbar}>
        <div className={classes.controlsLeft}>
          <button 
            className={`${classes.iconBtn} ${isEditing ? classes.activeMode : ''}`}
            onClick={() => setIsEditing(!isEditing)}
            title={isEditing ? "Lock Canvas (Read-Only)" : "Unlock Canvas to Edit"}
            style={{ width: 'auto', padding: '0 12px', gap: '6px' }}
          >
            {isEditing ? <Unlock size={14} /> : <Lock size={14} />}
            <span style={{ fontSize: '13px', fontWeight: 600 }}>{isEditing ? 'Editing' : 'Read-Only'}</span>
          </button>

          <div className={classes.verticalDivider} />

          <button 
            className={classes.iconBtn} 
            onClick={handleUndo} 
            disabled={historyIndex === 0 || !isEditing}
            title="Undo"
          >
            <Undo2 size={16} />
          </button>
          <button 
            className={classes.iconBtn} 
            onClick={handleRedo} 
            disabled={historyIndex === history.length - 1 || !isEditing}
            title="Redo"
          >
            <Redo2 size={16} />
          </button>
          
          <div className={classes.verticalDivider} />

          <div className={classes.modeGroup} style={{ opacity: isEditing ? 1 : 0.5, pointerEvents: isEditing ? 'auto' : 'none' }}>
            <button 
              className={`${classes.iconBtn} ${mode === 'draw' ? classes.activeMode : ''}`}
              onClick={() => setMode('draw')}
              title="Draw Mode"
            >
              <PenLine size={16} />
            </button>
            <button 
              className={`${classes.iconBtn} ${mode === 'pan' ? classes.activeMode : ''}`}
              onClick={() => setMode('pan')}
              title="Pan Mode"
            >
              <Hand size={16} />
            </button>
          </div>
          
          <button 
            className={classes.iconBtn}
            onClick={() => { setCamera({ x: 0, y: 0 }); setScale(1); }}
            title="Center View"
          >
            <Target size={16} />
          </button>
        </div>

        <div className={classes.controlsGroup} style={{ opacity: isEditing ? 1 : 0.5, pointerEvents: isEditing ? 'auto' : 'none' }}>
          {COLORS.map(color => (
            <button
              key={color}
              className={`${classes.colorBtn} ${currentColor === color ? classes.active : ''}`}
              style={{ backgroundColor: color }}
              onClick={() => {
                setCurrentColor(color);
                setMode('draw'); 
              }}
              title="Select color"
            />
          ))}
        </div>

        <Button 
          variant="ghost" 
          onClick={handleClear} 
          disabled={!isEditing}
          style={{ fontSize: '13px', padding: '4px 12px', color: '#555' }}
        >
          Clear
        </Button>
      </div>
      <div 
        ref={containerRef}
        className={classes.canvasContainer}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onContextMenu={e => e.preventDefault()}
      >
        <svg className={classes.svg}>
          <g transform={`translate(${camera.x}, ${camera.y}) scale(${scale})`}>
            {strokes.map((stroke, i) => {
              const pts = Array.isArray(stroke) ? stroke : stroke.points;
              const col = Array.isArray(stroke) ? '#1a1a1a' : stroke.color;
              
              const strokeData = getStroke(pts, strokeOptions);
              const pathData = getSvgPathFromStroke(strokeData);
              return (
                <path key={i} d={pathData} fill={col} className={classes.stroke} />
              );
            })}
            {currentStroke.length > 0 && (
              <path 
                d={getSvgPathFromStroke(getStroke(currentStroke, strokeOptions))}
                fill={currentColor}
                className={classes.stroke} 
              />
            )}
          </g>
        </svg>
      </div>
    </div>
  );
};
