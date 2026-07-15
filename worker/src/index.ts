import { Hono } from 'hono';
import { cors } from 'hono/cors';

export interface Env {
  DB: D1Database;
  DRAWINGS: KVNamespace;
}

const app = new Hono<{ Bindings: Env }>();

app.use('/api/*', cors());

app.onError((err, c) => {
  console.error('Worker Error:', err);
  return c.json({ error: err.message }, 500);
});

// LeetCode GraphQL Proxy
app.post('/api/leetcode', async (c) => {
  try {
    const body = await c.req.json();
    const res = await fetch('https://leetcode.com/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      body: JSON.stringify(body)
    });
    const data = await res.json();
    return c.json(data);
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

// GET all problems
app.get('/api/problems', async (c) => {
  try {
    const { results: problems } = await c.env.DB.prepare('SELECT * FROM problems ORDER BY addedAt DESC').all();
    
    // Parse tags JSON
    const parsedProblems = problems.map(p => ({
      ...p,
      tags: p.tags ? JSON.parse(p.tags as string) : [],
      isFavorite: Boolean(p.isFavorite)
    }));

    // Fetch flashcards
    const { results: flashcards } = await c.env.DB.prepare('SELECT * FROM flashcards').all();
    
    // Nest sm2Data for the frontend
    const nestedFlashcards = flashcards.map((f: any) => ({
      id: f.id,
      problemId: f.problemId,
      title: f.title,
      front: f.front,
      back: f.back,
      sm2Data: {
        nextReview: f.nextReview,
        interval: f.interval,
        easeFactor: f.easeFactor,
        repetitions: f.repetitions
      }
    }));

    return c.json({
      problems: parsedProblems,
      flashcards: nestedFlashcards
    });
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

// POST new problem
app.post('/api/problems', async (c) => {
  const body = await c.req.json();
  const { id, problemNumber, title, difficulty, description, explanation, pattern, tags, url, imageUrl, patternCode, notes, isFavorite, addedAt, flashcards } = body;

  try {
    // Insert problem
    await c.env.DB.prepare(`
      INSERT OR REPLACE INTO problems (id, problemNumber, title, difficulty, description, explanation, pattern, tags, url, imageUrl, patternCode, notes, isFavorite, addedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id, problemNumber || null, title, difficulty, description || null, explanation || null, pattern || null, 
      JSON.stringify(tags || []), url || null, imageUrl || null, patternCode || null, notes || null, isFavorite ? 1 : 0, addedAt
    ).run();

    // Insert flashcards
    if (flashcards && flashcards.length > 0) {
      const stmt = c.env.DB.prepare(`
        INSERT OR REPLACE INTO flashcards (id, problemId, title, front, back, nextReview, interval, easeFactor, repetitions)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      
      const batch = flashcards.map((f: any) => {
        const sm2 = f.sm2Data || { nextReview: new Date().toISOString(), interval: 0, easeFactor: 2.5, repetitions: 0 };
        return stmt.bind(
          f.id, 
          f.problemId, 
          f.title, 
          f.front, 
          f.back, 
          sm2.nextReview, 
          sm2.interval, 
          sm2.easeFactor, 
          sm2.repetitions
        );
      });
      
      await c.env.DB.batch(batch);
    }

    return c.json({ success: true });
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

// PUT update problem
app.put('/api/problems/:id', async (c) => {
  const id = c.req.param('id');
  const updates = await c.req.json();
  
  try {
    const fields = Object.keys(updates).map(k => `${k} = ?`).join(', ');
    const values = Object.values(updates);
    
    // Handle tags stringification if present
    const tagsIndex = Object.keys(updates).indexOf('tags');
    if (tagsIndex !== -1) {
      values[tagsIndex] = JSON.stringify(values[tagsIndex]);
    }
    // Handle isFavorite boolean
    const favIndex = Object.keys(updates).indexOf('isFavorite');
    if (favIndex !== -1) {
      values[favIndex] = values[favIndex] ? 1 : 0;
    }

    await c.env.DB.prepare(`UPDATE problems SET ${fields} WHERE id = ?`)
      .bind(...values, id)
      .run();
      
    return c.json({ success: true });
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

// DELETE problem
app.delete('/api/problems/:id', async (c) => {
  const id = c.req.param('id');
  try {
    await c.env.DB.prepare(`DELETE FROM problems WHERE id = ?`).bind(id).run();
    // Flashcards delete on cascade
    // We should also delete drawing from KV
    await c.env.DRAWINGS.delete(id);
    return c.json({ success: true });
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

// PUT update flashcard
app.put('/api/flashcards/:id', async (c) => {
  const id = c.req.param('id');
  const updates = await c.req.json();
  
  try {
    const fields = Object.keys(updates).map(k => `${k} = ?`).join(', ');
    const values = Object.values(updates);
    
    await c.env.DB.prepare(`UPDATE flashcards SET ${fields} WHERE id = ?`)
      .bind(...values, id)
      .run();
      
    return c.json({ success: true });
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

// GET drawing for a problem
app.get('/api/problems/:id/drawing', async (c) => {
  const id = c.req.param('id');
  const drawing = await c.env.DRAWINGS.get(id);
  
  if (!drawing) {
    return c.json({ strokes: [] });
  }
  
  return c.json({ strokes: JSON.parse(drawing) });
});

// PUT drawing for a problem
app.put('/api/problems/:id/drawing', async (c) => {
  const id = c.req.param('id');
  const { strokes } = await c.req.json();
  
  await c.env.DRAWINGS.put(id, JSON.stringify(strokes));
  return c.json({ success: true });
});

export default app;
