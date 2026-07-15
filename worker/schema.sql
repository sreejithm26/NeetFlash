DROP TABLE IF EXISTS flashcards;
DROP TABLE IF EXISTS problems;

CREATE TABLE problems (
  id TEXT PRIMARY KEY,
  problemNumber INTEGER,
  title TEXT NOT NULL,
  difficulty TEXT NOT NULL,
  description TEXT,
  explanation TEXT,
  pattern TEXT,
  tags TEXT, -- JSON string array
  url TEXT,
  imageUrl TEXT,
  patternCode TEXT,
  notes TEXT,
  isFavorite INTEGER DEFAULT 0,
  addedAt TEXT NOT NULL
);

CREATE TABLE flashcards (
  id TEXT PRIMARY KEY,
  problemId TEXT NOT NULL,
  title TEXT NOT NULL,
  front TEXT NOT NULL,
  back TEXT NOT NULL,
  nextReview TEXT NOT NULL,
  interval INTEGER NOT NULL,
  easeFactor REAL NOT NULL,
  repetitions INTEGER NOT NULL,
  FOREIGN KEY (problemId) REFERENCES problems(id) ON DELETE CASCADE
);
