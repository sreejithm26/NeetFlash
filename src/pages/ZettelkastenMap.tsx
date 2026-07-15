import React, { useMemo, useRef, useState, useEffect, useCallback } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import { useNavigate } from 'react-router-dom';
import { Focus } from 'lucide-react';
import { useStore } from '../store/useStore';
import classes from './ZettelkastenMap.module.css';

interface GraphNode {
  id: string;
  name: string;
  group: number; // 0: Root, 1: Pattern, 2: SubPattern, 3: Problem
  val: number;
  link?: string;
  color: string;
}

interface GraphLink {
  source: string;
  target: string;
}

export function ZettelkastenMap() {
  const problems = useStore(state => state.problems);
  const navigate = useNavigate();
  const graphRef = useRef<any>();
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight
        });
      }
    };
    
    // Initial size
    updateDimensions();
    
    // Sometimes the container takes a moment to fully render
    const timeout = setTimeout(updateDimensions, 100);
    
    window.addEventListener('resize', updateDimensions);
    return () => {
      window.removeEventListener('resize', updateDimensions);
      clearTimeout(timeout);
    };
  }, []);

  const graphData = useMemo(() => {
    const nodes: GraphNode[] = [];
    const links: GraphLink[] = [];
    const nodeIds = new Set<string>();

    const addNode = (node: GraphNode) => {
      if (!nodeIds.has(node.id)) {
        nodes.push(node);
        nodeIds.add(node.id);
      }
    };

    // Root Node
    addNode({ id: 'ROOT', name: 'LeetCode', group: 0, val: 35, color: '#f43f5e' }); // rose-500

    problems.forEach(problem => {
      const patternId = `pattern-${problem.pattern}`;
      const hasSub = !!problem.subPattern;
      const subPatternId = hasSub ? `subpattern-${problem.pattern}-${problem.subPattern}` : null;
      const problemId = `problem-${problem.id}`;

      // Pattern Node
      addNode({ 
        id: patternId, 
        name: problem.pattern, 
        group: 1, 
        val: 20, 
        link: `/category/${problem.pattern}`, 
        color: '#8b5cf6' // violet-500
      });
      links.push({ source: 'ROOT', target: patternId });

      // SubPattern Node
      if (hasSub && subPatternId) {
        addNode({ 
          id: subPatternId, 
          name: problem.subPattern!, 
          group: 2, 
          val: 12, 
          color: '#3b82f6' // blue-500
        });
        links.push({ source: patternId, target: subPatternId });
      }

      // Problem Node
      addNode({ 
        id: problemId, 
        name: problem.title, 
        group: 3, 
        val: 6, 
        link: `/problem/${problem.id}`,
        color: '#10b981' // emerald-500
      });

      // Connect problem to subpattern or pattern
      links.push({ source: subPatternId || patternId, target: problemId });
    });

    // Deduplicate links
    const uniqueLinks = links.filter((link, index, self) => 
      index === self.findIndex((t) => t.source === link.source && t.target === link.target)
    );

    return { nodes, links: uniqueLinks };
  }, [problems]);

  // Adjust physics for better layout
  useEffect(() => {
    if (graphRef.current) {
      // Stronger repulsion to separate nodes
      graphRef.current.d3Force('charge').strength(-400);
      // Custom link distances based on hierarchy
      graphRef.current.d3Force('link').distance((link: any) => {
        if (link.source.id === 'ROOT') return 120;
        if (link.source.group === 1) return 80;
        return 40;
      });
    }
  }, [graphData]); // Re-apply if data changes

  const handleNodeClick = useCallback((node: any) => {
    if (node.link) {
      navigate(node.link);
    }
  }, [navigate]);

  const handleRecenter = useCallback(() => {
    if (graphRef.current) {
      graphRef.current.zoomToFit(600, 80); // 600ms duration, 80px padding
    }
  }, []);

  return (
    <div className={classes.container}>
      <div className={classes.header}>
        <h1 className={classes.title}>Knowledge Graph</h1>
      </div>
      <div className={classes.mapWrapper} ref={containerRef}>
        <button 
          className={classes.recenterBtn} 
          onClick={handleRecenter} 
          title="Recenter Graph"
        >
          <Focus size={20} />
        </button>
        <ForceGraph2D
          ref={graphRef}
          width={dimensions.width}
          height={dimensions.height}
          graphData={graphData}
          nodeRelSize={4}
          nodeVal="val"
          nodeLabel="name"
          nodeColor="color"
          onNodeClick={handleNodeClick}
          linkWidth={2}
          linkColor={() => 'rgba(255, 255, 255, 0.15)'}
          d3VelocityDecay={0.15}
          cooldownTicks={100}
          onEngineStop={() => {
            // Initial center on first load
            graphRef.current?.zoomToFit(400, 80);
          }}
          nodeCanvasObject={(node: any, ctx, globalScale) => {
            const r = Math.sqrt(Math.max(0, node.val || 1)) * 4;
            
            // Add a glowing effect
            ctx.shadowColor = node.color;
            ctx.shadowBlur = 10 * globalScale;
            
            // Draw node circle
            ctx.beginPath();
            ctx.arc(node.x, node.y, r, 0, 2 * Math.PI, false);
            ctx.fillStyle = node.color;
            ctx.fill();
            
            // Clear shadow for text
            ctx.shadowBlur = 0;

            // Draw label
            const showLabel = globalScale > 1.2 || node.group <= 1;
            
            if (showLabel) {
              const label = node.name;
              const fontSize = Math.max(12 / globalScale, 4);
              
              ctx.font = `600 ${fontSize}px Inter, sans-serif`;
              ctx.textAlign = 'center';
              ctx.textBaseline = 'top';
              
              // Text background for readability
              const textWidth = ctx.measureText(label).width;
              const paddingX = Math.max(fontSize * 0.4, 4);
              const paddingY = Math.max(fontSize * 0.2, 2);
              const bgHeight = fontSize + paddingY * 2;
              
              ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
              
              // Check if roundRect exists (it should in modern browsers), fallback to fillRect
              if (ctx.roundRect) {
                ctx.beginPath();
                ctx.roundRect(
                  node.x - textWidth / 2 - paddingX, 
                  node.y + r + 3 - paddingY, 
                  textWidth + paddingX * 2, 
                  bgHeight, 
                  4 / globalScale
                );
                ctx.fill();
              } else {
                ctx.fillRect(
                  node.x - textWidth / 2 - paddingX, 
                  node.y + r + 3 - paddingY, 
                  textWidth + paddingX * 2, 
                  bgHeight
                );
              }
              
              // Text fill
              ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
              ctx.fillText(label, node.x, node.y + r + 3);
            }
          }}
          nodePointerAreaPaint={(node: any, color, ctx) => {
            const r = Math.sqrt(Math.max(0, node.val || 1)) * 4;
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(node.x, node.y, r + 8, 0, 2 * Math.PI, false); // larger hit area
            ctx.fill();
          }}
        />
      </div>
    </div>
  );
}
