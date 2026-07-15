export const AI_PROMPT = `You are an expert FAANG interviewer.
Given the following LeetCode problem:
1. Generate a step-by-step explanation of the optimal solution using very simple bullet points.
2. Generate exactly the following high-value revision flashcards that help the user step-by-step approach the problem. DO NOT generate cards that ask "What was the solution?"

Generate these specific cards (strictly follow this structure):
1. Pattern Recognition (Front: "What pattern does this problem belong to? What clues indicate this?" Back: Pattern name, Recognition clues list, Key observation)
2. Problem Restatement (Front: "What is this problem actually asking?" Back: Strip the story, explain the core task simply)
3. Core Insight (Front: "What is the key insight that unlocks the optimal solution?" Back: The crucial observation)
4. Brute Force (Front: "What is the brute-force approach and why is it too slow?" Back: Approach + Time Complexity + Why it fails)
5. Optimal Algorithm (Front: "What algorithm solves this optimally?" Back: Numbered list of steps. NO CODE.)
6. Time & Space Complexity (Front: "Complexity?" Back: Time: O(x), Space: O(y))
7. Common Mistakes (Front: "What mistakes are easy to make?" Back: Bulleted list of common pitfalls)
8. Edge Cases (Front: "What edge cases should I think about?" Back: Bulleted list of edge cases)
9. Follow-up Variations (Front: "What interview follow-ups are common?" Back: Bulleted list of follow-ups)
10. Similar Problems (Front: "Which problems use the same idea?" Back: List of 2-3 similar LeetCode problems)
11. One-Line Memory Hook (Front: "What's the one thing to remember?" Back: "30-second revision" punchy sentence)
12. Pattern-Specific Cards (Optional, 1-2 cards if applicable. e.g. DP state/recurrence, Binary Search predicate, Sliding Window invariant, Graph BFS vs DFS reasoning, Union Find use-case)

Rules:
Do not repeat the entire problem.
Focus on recognition and step-by-step intuition.
Generate high-quality interview revision notes.
Keep flashcard answers ultra-concise and punchy.
CRITICAL: DO NOT use LaTeX or math delimiters like $ or $$. Use standard markdown backticks for variables and math (e.g., use \`O(N^2)\` instead of $O(N^2)$).
CRITICAL: You MUST select "pattern" and "subPattern" STRICTLY from this taxonomy. Do not invent your own:
- Arrays (Basic Array, Prefix Sum, Difference Array, Kadane, Two Pointers, Sliding Window, Dutch National Flag, Cyclic Sort, Merge Intervals, Sweep Line)
- Hashing (Frequency Count, Hash Map, Hash Set, Prefix Hashing)
- String (KMP, Rabin Karp, Z Algorithm, Trie, Rolling Hash, String Matching)
- Linked List (Fast Slow Pointer, Reverse, Merge, Cycle Detection, Random Pointer)
- Stack (Monotonic Increasing, Monotonic Decreasing, Expression Evaluation, Min Stack)
- Queue (Monotonic Queue, Circular Queue)
- Heap (Min Heap, Max Heap, Top K, Merge K, Median, Priority Queue)
- Binary Search (Search Answer, Lower Bound, Upper Bound, Binary Search on Answer, Rotated Array, Peak Element)
- Tree (DFS, BFS, Diameter, LCA, BST, Tree DP, Tree Construction, Serialization)
- Graph (DFS, BFS, Topological Sort, Union Find, MST, Dijkstra, Bellman Ford, Floyd Warshall, SCC, Bridges, Articulation Point)
- Dynamic Programming (1D DP, 2D DP, Knapsack, LIS, LCS, Partition DP, Digit DP, Interval DP, State Compression DP, Bitmask DP, Tree DP)
- Greedy (Interval Scheduling, Jump Game, Huffman, Sorting Greedy)
- Backtracking (Subsets, Permutations, Combinations, Sudoku, N Queens)
- Bit Manipulation (XOR, Bitmask, Counting Bits)
- Math (GCD, Prime, Combinatorics, Modular Arithmetic)
- Design (LRU, LFU, Cache, Iterator)
- Advanced (Segment Tree, Fenwick Tree, Sparse Table, Trie, Suffix Array, Suffix Automaton, Heavy Light Decomposition)

Output ONLY JSON.

Return:
{
  "metadata":{
    "title":"",
    "difficulty":"",
    "pattern":"",
    "subPattern":"",
    "tags":[],
    "companies":[],
    "explanation":""
  },
  "flashcards":[
     {
       "title":"Pattern Recognition",
       "front":"What pattern does this problem belong to?\\n\\nWhat clues indicate this?",
       "back":"..."
     }
     // ... strictly follow the 11-12 cards requested above
  ]
}`;

export const INFOGRAPHIC_PROMPT = `Create a clean educational infographic that explains the solution to the given algorithm/problem.

## Goal
The image should help a student understand the core idea of the solution in under one minute. Prioritize **clarity, structure, and intuition** over visual appeal.
The infographic should look like a page from a competitive programming textbook, lecture notes, or a whiteboard explanation—not a marketing poster.

## Design Principles
* White background.
* Black text with high contrast.
* Use only 2-4 soft colors to distinguish concepts.
* Large readable fonts.
* Plenty of spacing between sections.
* Simple rectangles, circles, arrows, and tables.
* Flat design only.
* No gradients, no shadows, no 3D effects.
* No mascots, people, cartoons, or decorative illustrations.
* Every visual element should communicate an algorithmic idea.

## Layout
Organize the infographic into clearly separated sections.
1. Problem Intuition: Explain what the problem is asking with a minimal visual example.
2. Core Insight: Illustrate the main algorithmic idea (e.g. DP state, Sliding Window invariant, Math property). Answer "Why does this algorithm work?"
3. State / Data Structure: Visualize the DP state, Graph, Tree, Hash map, etc.
4. Transition / Algorithm Flow: Illustrate progression with flowcharts, arrows, or step-by-step state updates.
5. Worked Example: Compactly walk through one small example highlighting what/why it changes.
6. Final Formula / Answer: Place the recurrence, formula, or final computation inside a highlighted box.
7. Complexity: Summary box with Time and Space complexity.

## Visual Rules
* Every important concept should have its own box.
* Use arrows to show dependencies and transitions.
* Prefer diagrams over paragraphs. Replace long explanations with labeled visuals.
* Keep labels short. Minimize text.
* Use consistent spacing and alignment.

## Output Style
The final result should resemble a high-quality educational page from an algorithms textbook. The focus should always be understanding the algorithm, not creating an artistic poster.`;

export const CODE_PROMPT = `You are an expert competitive programmer and technical interviewer.
Given the following LeetCode problem description and its identified algorithmic pattern, write the optimal, production-ready solution code in Python or C++.

Rules:
1. ONLY return the code. Do not wrap it in any explanation text.
2. Put the code in a standard markdown code block (e.g. \`\`\`python ... \`\`\`).
3. Include brief inline comments explaining the core logic, especially around the pattern implementation.
4. Keep the solution clean, readable, and highly optimized.`;

export const AIService = {
  generateFlashcards: async (problemText: string) => {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) throw new Error("API Key is missing in environment variables (.env)");

    // Define fallback models in case the primary one is busy
    const models = ['gemini-3.5-flash', 'gemini-3-flash-preview', 'gemini-3.1-flash-lite'];
    const maxRetries = 3;

    for (const model of models) {
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
          
          const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              contents: [
                {
                  parts: [
                    { text: AI_PROMPT },
                    { text: "Problem Statement:\n" + problemText }
                  ]
                }
              ],
              generationConfig: {
                responseMimeType: "application/json",
              }
            })
          });

          if (!response.ok) {
            const errorText = await response.text();
            
            // If it's a 503 or 429, we retry with exponential backoff
            if (response.status === 503 || response.status === 429) {
              if (attempt < maxRetries) {
                const backoffDelay = Math.pow(2, attempt) * 1000; // 2s, 4s...
                console.warn(`Model ${model} busy (503/429), retrying in ${backoffDelay}ms... (Attempt ${attempt + 1})`);
                await new Promise(resolve => setTimeout(resolve, backoffDelay));
                continue;
              }
            }
            // Throw to trigger model fallback on other errors or after max retries
            throw new Error(errorText);
          }

          const data = await response.json();
          try {
            const content = data.candidates[0].content.parts[0].text;
            return JSON.parse(content);
          } catch (e) {
            throw new Error("Failed to parse AI response into JSON");
          }
        } catch (err: any) {
          // If we exhausted retries for this model, we move to the next model in the fallback array
          if (attempt === maxRetries) {
            console.error(`Model ${model} failed: ${err.message}`);
          }
        }
      }
    }

    throw new Error("All AI models are currently busy or unavailable. Please try again later.");
  },

  generateInfographic: async (problem: any) => {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) throw new Error("API Key is missing in environment variables (.env)");
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=${apiKey}`;
    
    const problemContext = `
Problem Title: ${problem.title}
Pattern: ${problem.pattern} (${problem.subPattern})
Description:
${problem.description || problem.explanation || 'No description available.'}
`;

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: INFOGRAPHIC_PROMPT },
              { text: problemContext }
            ]
          }
        ]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      if (response.status === 429) {
        throw new Error("API Quota Exceeded for gemini-2.5-flash-image. Your current API key might not have access to this model yet on the free tier.");
      }
      throw new Error(`Image Generation Failed: ${errorText}`);
    }

    const data = await response.json();
    
    // Nano Banana and standard Gemini image generation returns inlineData
    // We need to carefully extract it depending on the exact response format of Nano Banana
    try {
      const part = data.candidates[0].content.parts[0];
      if (part.inlineData) {
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      } else {
        throw new Error("No image data found in the response.");
      }
    } catch (e) {
      throw new Error("Failed to parse the image response from Nano Banana.");
    }
  },

  generatePatternCode: async (problemText: string, pattern: string) => {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) throw new Error("API Key is missing in environment variables (.env)");

    const models = ['gemini-3.5-flash', 'gemini-3-flash-preview', 'gemini-3.1-flash-lite'];
    const maxRetries = 3;

    for (const model of models) {
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
          
          const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              contents: [
                {
                  parts: [
                    { text: CODE_PROMPT },
                    { text: "Pattern to implement: " + pattern + "\n\nProblem Statement:\n" + problemText }
                  ]
                }
              ]
            })
          });

          if (!response.ok) {
            const errorText = await response.text();
            if (response.status === 503 || response.status === 429) {
              if (attempt < maxRetries) {
                const backoffDelay = Math.pow(2, attempt) * 1000;
                await new Promise(resolve => setTimeout(resolve, backoffDelay));
                continue;
              }
            }
            throw new Error(errorText);
          }

          const data = await response.json();
          return data.candidates[0].content.parts[0].text;
        } catch (err: any) {
          if (attempt === maxRetries) {
            console.error(`Model ${model} failed: ${err.message}`);
          }
        }
      }
    }

    throw new Error("All AI models are currently busy or unavailable. Please try again later.");
  }
};
