# Manifest Destined for Greatness

An interactive AP US History adventure game for MBA (Montgomery Bell Academy) students. Travel through nine eras of American history, master key topics, collect medallions, and compete on the leaderboard.

## Features

### Main Game (`index.html`)
- **9 regions** mapped to AP US History periods 1–9
- Each region contains **6 topics** with lesson content and 3–4 quiz questions each (178 questions total)
- **Mastery system** — answer 5 in a row correctly to master a topic and earn a rune medallion
- **Dr. Bailey avatar** on the map screen tells history puns on click
- **Cloud save** via Firebase (leaderboard + progress sync)
- **Auth** via Google sign-in

### History Munchers (`munchers.html`)
A Number Munchers-style arcade game. Navigate a 6×5 grid, munch the correct historical items, and avoid Dr. Bailey's chasing head.

- **12 history challenges:**
  - Original 13 Colonies
  - States that Seceded from the Union
  - Former Soviet Republics
  - Founding Fathers
  - New Deal Programs
  - WWI Allied Powers
  - Union Generals (Civil War)
  - Cold War Presidents
  - Gilded Age Tycoons
  - WWII Axis Powers
  - Progressive Era Reformers
  - Abolitionists
- **Controls:** Arrow keys to move, Space/Enter to munch
- **Scoring:** +10 correct, −5 wrong; 3 lives
- **Difficulty scales** each level — Dr. Bailey speeds up and tracks more aggressively; up to 4 Dr. Baileys spawn by level 10

## Regions

| Region | Period | Years |
|---|---|---|
| The Shore | Period 1 | 1491–1607 |
| The Colony | Period 2 | 1607–1754 |
| The Tavern | Period 3 | 1754–1800 |
| The Frontier | Period 4 | 1800–1848 |
| The Divided House | Period 5 | 1844–1877 |
| The Factory | Period 6 | 1865–1898 |
| The Home Front | Period 7 | 1890–1945 |
| The March | Period 8 | 1945–1980 |
| The Mall | Period 9 | 1980–Present |

## Setup

### Firebase
The game uses Firebase for authentication and leaderboard. Fill in `FIREBASE_CONFIG` in `js/bundle.js` with your project credentials:

```js
const FIREBASE_CONFIG = {
  apiKey: "...",
  authDomain: "...",
  projectId: "...",
  storageBucket: "...",
  messagingSenderId: "...",
  appId: "..."
};
```

### Running Locally
Serve the project root with any static file server, e.g.:

```bash
npx serve .
# or
python -m http.server
```

Then open `http://localhost:[port]/index.html`.

## Tech Stack
- Vanilla HTML / CSS / JavaScript (no build step)
- Firebase (Auth + Firestore)
- Georgia / Arial fonts (MBA brand)
- MBA brand colors: Cardinal `#A30046`, Silver `#9D9FA2`, Gold `#FFCF01`
