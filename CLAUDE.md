# CLAUDE.md — jlpt-n5

## Project overview

A free, self-contained, zero-dependency interactive Japanese course from zero to JLPT N3 in 960 days (N5 + N4 + N3 complete; N2/N1 planned).
Everything runs in the browser with no build step and no installation required.

## Repository structure

```
jlpt-n5/
├── index.html          # Application shell — React components + localStorage logic
├── curriculum.js       # 960-day lesson data array + phase colour/name constants
├── lib.js              # Pure utility functions: SM-2, card helpers, exercises
├── tests.html          # QUnit browser test suite (open directly, no server)
├── README.md           # User-facing documentation
├── N3-N2-N1-REQUIREMENTS.md  # Implementation plan for N2/N1 (N3 complete)
└── .nojekyll           # Disables Jekyll processing for GitHub Pages
```

`curriculum.js` and `lib.js` are loaded by both `index.html` (app) and `tests.html`
(test suite), making the pure functions testable without a build step.

## Running the app

Open `index.html` directly in a browser — no server needed.

```bash
# macOS
open index.html

# Linux
xdg-open index.html
```

## Tech stack

- **React 18** loaded from CDN (`cdnjs.cloudflare.com`) — no npm or bundler
- **Vanilla CSS** inlined in `<style>` tags
- **Web Speech API** for text-to-speech (Japanese voice)
- **localStorage** for progress persistence
- **No build step, no transpilation, no dependencies to install**

## Linting

HTML can be validated with:

```bash
npx html-validate index.html
```

## Tests

**Tests must pass before every commit and push.**  The pre-commit hook enforces
this automatically — any `git commit` or `git push` Bash call is blocked when
the test suite reports failures.

### Running tests

**In the browser (full suite):**
```
open tests.html        # macOS
xdg-open tests.html    # Linux
```

**Headlessly via Node.js (CI / hooks):**
```bash
node .claude/hooks/run-tests.js
```

### Test coverage — 14 modules

| Module | What is tested |
|---|---|
| `sm2Update` | All interval branches, EF formula, 1.3 clamp, due-date, no mutation |
| `checkTyping` | Exact, case, whitespace, `/` and `,` alternatives, multi-answer |
| `cardId` | ID string format |
| `addDayCards` | Card creation, initial values, no-overwrite guard |
| `getDueCards` | Past/future filtering, returns ID strings |
| `cardToItem` | Vocab/char field resolution, null reading, OOB → null |
| `rndShuffle` | Length, elements, no mutation, new reference |
| `buildExercises` | ≤5 cap, empty lesson, MC bounds, typing answers |
| `srsReview` | Quality→grade mapping, EF clamp, no mutation, new object |
| `srsAddCards` | Embedded card data, no-overwrite, bool return value |
| `srsDueCards` | Returns objects not IDs, due/not-due filtering |
| **Curriculum integrity** | 960 sequential days, required fields, type validity, vocab/chars structure, phase/week ranges, N5/N4/N3 boundary checks |
| **Phase constants** | PHASE_COLORS, PHASE_BG, PHASE_NAMES defined and correct for all 20 active phases |
| **React render** | index.html inline script executes, App/DayView/Overview/ReviewMode render without error |

## Curriculum structure

| Days      | Phase | Name                                               |
|-----------|-------|----------------------------------------------------|
| 1–14      | 1     | Hiragana (46 characters)                           |
| 15–28     | 2     | Katakana (46 characters)                           |
| 29–84     | 3     | Foundations (numbers, particles, basic sentences)  |
| 85–140    | 4     | Vocabulary (~200 N5 words)                         |
| 141–182   | 5     | Verbs (て-form, ます-form, conjugation)            |
| 183–252   | 6     | Grammar Patterns (particles, conditionals, keigo)  |
| 253–308   | 7     | Kanji (~100 N5 kanji)                              |
| 309–365   | 8     | Test Prep (N5 review & JLPT prep)                  |
| 366–395   | 9     | N5 Review (bridge to N4)                           |
| 396–455   | 10    | N4 Vocabulary (~300 words)                         |
| 456–500   | 11    | N4 Verbs                                           |
| 501–555   | 12    | N4 Grammar Patterns                                |
| 556–620   | 13    | N4 Kanji (~175 kanji)                              |
| 621–660   | 14    | N4 Test Prep                                       |
| 661–690   | 15    | N4 Review (bridge to N3)                           |
| 691–770   | 16    | N3 Vocabulary (~1,500 words)                       |
| 771–820   | 17    | N3 Verbs & Adjectives                              |
| 821–895   | 18    | N3 Grammar Patterns (~120 patterns)                |
| 896–930   | 19    | N3 Kanji (~170 kanji)                              |
| 931–960   | 20    | N3 Test Prep                                       |

Phase constants for N2 (phases 21–26) and N1 (phases 27–32) are defined in
`curriculum.js` but lesson data for those levels has not yet been added.
See `N3-N2-N1-REQUIREMENTS.md` for the full N2/N1 implementation plan.

## Key implementation notes

- All 960 day definitions live in `curriculum.js` — the first 365 as a JSON array literal, days 366–960 appended via `curriculum.push()` calls
- Two SM-2 implementations exist side-by-side: `sm2Update` (older, used by `ReviewView`) and `srsReview` (newer, used by `ReviewMode` + `App`). Both use `ease`/`ef` for the same concept.
- Quiz state, SRS card data, and completed-day flags are stored in `localStorage`
- The lesson view, overview calendar, and review flashcard deck are separate React components in `index.html`
- TTS is triggered via `window.speechSynthesis` using `lang: 'ja-JP'`
- Pure utility functions (`sm2Update`, `checkTyping`, `cardId`, `buildExercises`, etc.) live in `lib.js` and are tested headlessly by `.claude/hooks/run-tests.js`

## Browser compatibility

| Browser       | Lessons | TTS          | Speech recognition |
|---------------|---------|--------------|--------------------|
| Chrome / Edge | Yes     | Yes          | Yes                |
| Safari        | Yes     | Yes          | Yes                |
| Firefox       | Yes     | Limited      | No                 |

## Deployment

Hosted on GitHub Pages — push to `main`, enable Pages from repo Settings (branch: main, root `/`).
Live URL pattern: `https://<username>.github.io/jlpt-n5`
