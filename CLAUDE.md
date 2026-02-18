# CLAUDE.md — jlpt-n5

## Project overview

A free, self-contained, zero-dependency interactive Japanese course from zero to JLPT N5 in 365 days.
Everything runs in the browser with no build step and no installation required.

## Repository structure

```
jlpt-n5/
├── index.html          # Application shell — React components + localStorage logic
├── curriculum.js       # 365-day lesson data array + phase colour/name constants
├── lib.js              # Pure utility functions: SM-2, card helpers, exercises
├── tests.html          # QUnit browser test suite (open directly, no server)
├── README.md           # User-facing documentation
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

**In the browser (full suite, 92 tests):**
```
open tests.html        # macOS
xdg-open tests.html    # Linux
```

**Headlessly via Node.js (CI / hooks):**
```bash
node .claude/hooks/run-tests.js
```

### Test coverage — 12 modules

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
| **Curriculum integrity** | 365 sequential days, required fields, type validity, vocab/chars structure, phase/week ranges |

### Known failing tests (data bugs to fix)

The test suite currently flags 5 real data bugs in `curriculum.js`.  These tests
will fail until the underlying data is corrected:

| Days | Bug |
|---|---|
| 85 | `type` field is an array instead of a string |
| 86–97 | `vocab` entries are 2-element `[jp, en]` instead of `[jp, reading, en]` |
| 253–308 | `vocab[1][2]` (meaning) is an empty string on kanji days |
| 173 | `chars[4]` is a 3-element array instead of the expected 2-element |
| 365 | `week = 53` (calendar weeks only go to 52) |

## Curriculum structure

| Days      | Phase                                              |
|-----------|----------------------------------------------------|
| 1–14      | Hiragana (46 characters)                           |
| 15–28     | Katakana (46 characters)                           |
| 29–84     | Foundations (numbers, particles, basic sentences)  |
| 85–140    | Core N5 Vocabulary (~200 words)                    |
| 141–182   | Essential Verbs (て-form, ます-form, conjugation)  |
| 183–252   | Grammar Patterns (particles, conditionals, keigo)  |
| 253–308   | Kanji (~100 N5 kanji)                              |
| 309–365   | Review & JLPT Test Prep                            |

## Key implementation notes

- All 365 day definitions live in `curriculum.js` as a `curriculum` array
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
