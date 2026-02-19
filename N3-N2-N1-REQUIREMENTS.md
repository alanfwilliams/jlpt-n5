# JLPT N3 / N2 / N1 — Implementation Requirements

> **Status:** N3 is fully implemented (days 661–960, phases 15–20, all tests passing).
> This document now serves as the implementation plan for **N2 and N1** only.
> N3 sections are retained for reference.

This document describes what was built to extend the course through N3, and what remains to be built for N2 and N1 readiness.

---

## 1. Scope overview

| Level | New Vocabulary | New Kanji | New Grammar | New Days | Day Range | Status |
|-------|---------------|-----------|-------------|----------|-----------|--------|
| N3 | ~1,500 words | ~170 kanji | ~120 patterns | 300 | 661–960 | ✅ Complete |
| N2 | ~3,000 words | ~200 kanji | ~180 patterns | 360 | 961–1320 | Planned |
| N1 | ~4,000 words | ~300 kanji | ~220 patterns | 400 | 1321–1720 | Planned |
| **Total** | **~8,500 words** | **~670 kanji** | **~520 patterns** | **1,060** | **661–1720** | |

**Cumulative totals at each level (including N5+N4 base):**

| Level | Total Vocab | Total Kanji | Total Grammar |
|-------|------------|-------------|---------------|
| N3 | ~3,500 | ~350 | ~250 |
| N2 | ~6,500 | ~550 | ~430 |
| N1 | ~10,500 | ~850 | ~650 |

---

## 2. Curriculum phases

### Full phase map (phases 15–32)

| Phase | Days | Name | Content |
|-------|------|------|---------|
| **N3** | | | |
| 15 | 661–690 | N4 Review | 30-day consolidation bridge to N3 |
| 16 | 691–770 | N3 Vocabulary | ~1,500 words across 80 days (~18 words/day) |
| 17 | 771–820 | N3 Verbs & Adjectives | Transitive/intransitive pairs, compound verbs, conjugation forms |
| 18 | 821–895 | N3 Grammar | ~120 grammar patterns across 75 days |
| 19 | 896–930 | N3 Kanji | ~170 new kanji across 35 days (~5 kanji/day) |
| 20 | 931–960 | N3 Test Prep | Mixed review, mock tests, reading practice |
| **N2** | | | |
| 21 | 961–990 | N3 Review | 30-day consolidation bridge to N2 |
| 22 | 991–1090 | N2 Vocabulary | ~3,000 words across 100 days (~30 words/day) |
| 23 | 1091–1140 | N2 Verbs & Expressions | Compound verbs, set phrases, idiomatic expressions |
| 24 | 1141–1230 | N2 Grammar | ~180 grammar patterns across 90 days |
| 25 | 1231–1275 | N2 Kanji | ~200 new kanji across 45 days (~4–5 kanji/day) |
| 26 | 1276–1320 | N2 Test Prep | Mixed review, full-length mock tests, timed reading |
| **N1** | | | |
| 27 | 1321–1350 | N2 Review | 30-day consolidation bridge to N1 |
| 28 | 1351–1470 | N1 Vocabulary | ~4,000 words across 120 days (~33 words/day) |
| 29 | 1471–1530 | N1 Verbs & Expressions | Literary verbs, four-character idioms, classical remnants |
| 30 | 1531–1640 | N1 Grammar | ~220 grammar patterns across 110 days |
| 31 | 1641–1690 | N1 Kanji | ~300 new kanji across 50 days (~6 kanji/day) |
| 32 | 1691–1720 | N1 Test Prep | Full-length mock exams, timed reading, listening strategy |

### Phase constants to add

```javascript
// PHASE_COLORS
// N3
15: '#7f8c8d',   // N4 Review — grey
16: '#0984e3',   // N3 Vocabulary — bright blue
17: '#d63031',   // N3 Verbs & Adjectives — crimson
18: '#6c5ce7',   // N3 Grammar — violet
19: '#e17055',   // N3 Kanji — terracotta
20: '#00b894',   // N3 Test Prep — emerald
// N2
21: '#636e72',   // N3 Review — dark grey
22: '#00cec9',   // N2 Vocabulary — teal
23: '#e84393',   // N2 Verbs & Expressions — hot pink
24: '#fdcb6e',   // N2 Grammar — gold
25: '#d35400',   // N2 Kanji — burnt orange
26: '#6ab04c',   // N2 Test Prep — leaf green
// N1
27: '#95a5a6',   // N2 Review — silver
28: '#0652DD',   // N1 Vocabulary — deep blue
29: '#c0392b',   // N1 Verbs & Expressions — dark red
30: '#8854d0',   // N1 Grammar — deep purple
31: '#e15f41',   // N1 Kanji — flame
32: '#10ac84',   // N1 Test Prep — jade

// PHASE_BG — lighter tints of the above for card backgrounds

// PHASE_NAMES
15: 'N4 Review',
16: 'N3 Vocabulary',  17: 'N3 Verbs & Adjectives',
18: 'N3 Grammar',     19: 'N3 Kanji',
20: 'N3 Test Prep',
21: 'N3 Review',
22: 'N2 Vocabulary',  23: 'N2 Verbs & Expressions',
24: 'N2 Grammar',     25: 'N2 Kanji',
26: 'N2 Test Prep',
27: 'N2 Review',
28: 'N1 Vocabulary',  29: 'N1 Verbs & Expressions',
30: 'N1 Grammar',     31: 'N1 Kanji',
32: 'N1 Test Prep'
```

---

## 3. Lesson data structure

Each new day object follows the existing format:

```javascript
{
  day: 661,
  phaseNum: 15,
  phaseName: 'N4 Review',
  week: 95,              // continue sequential week numbering
  title: '...',
  intro: '...',
  type: 'vocab' | 'lesson' | 'grammar' | 'kanji' | 'review' | 'verbs' | 'reading',
  vocab: [[jp, reading, en], ...],    // always 3-element arrays
  chars: [[kanji, reading], ...],     // always 2-element arrays
  grammar: { pattern, meaning, example_jp, example_en },
  practice: '...',
  tip: '...'
}
```

### New `type` value: `"reading"`

N3 introduces paragraph-level reading comprehension. Add a `"reading"` type for days that focus on reading passages. The existing `type` field remains a string (never an array). This type is used across N3, N2, and N1 with increasing passage complexity.

---

# Part I — JLPT N3

N3 sits between the basic (N5/N4) and intermediate-advanced (N2/N1) levels. Learners must understand Japanese used in everyday situations and can to some extent follow Japanese used in a variety of contexts.

---

## 4. N3 Vocabulary (Phase 16 — days 691–770)

### Categories to cover

N3 vocabulary spans significantly more abstract and contextual words than N4. Organise by topic clusters:

- **Daily life & routines** — 通勤 (commuting), 家事 (housework), 習慣 (habit)
- **Emotions & opinions** — 感動 (being moved), 不満 (dissatisfaction), 印象 (impression)
- **Work & society** — 経験 (experience), 責任 (responsibility), 関係 (relationship)
- **Nature & environment** — 環境 (environment), 季節 (season), 地震 (earthquake)
- **Health & body** — 症状 (symptoms), 治療 (treatment), 体調 (physical condition)
- **Media & communication** — 情報 (information), 報告 (report), 記事 (article)
- **Education & learning** — 研究 (research), 成績 (grades), 卒業 (graduation)
- **Travel & directions** — 観光 (sightseeing), 交通 (traffic), 出発 (departure)
- **Abstract concepts** — 原因 (cause), 結果 (result), 条件 (condition)
- **Adverbs & conjunctions** — たとえば (for example), やはり (as expected), つまり (in short)

### Vocab entry format

Same 3-element array as N5/N4:

```javascript
vocab: [
  ['経験', 'けいけん', 'experience'],
  ['責任', 'せきにん', 'responsibility'],
  ['環境', 'かんきょう', 'environment'],
]
```

---

## 5. N3 Verbs & Adjectives (Phase 17 — days 771–820)

### Key topics

- **Transitive/intransitive pairs** — 上げる/上がる, 下げる/下がる, 始める/始まる, 集める/集まる
- **Compound verbs** — 思い出す, 取り消す, 引き受ける, 見つける
- **Potential form** — 食べられる, 読める, 話せる
- **Passive form** — 食べられる, 読まれる, 言われる
- **Causative form** — 食べさせる, 読ませる, 行かせる
- **Causative-passive** — 食べさせられる, 行かせられる
- **Volitional form** — 食べよう, 行こう, しよう
- **na-adjective patterns** — 重要な, 正確な, 複雑な
- **i-adjective patterns** — 激しい, 素晴らしい, 恐ろしい

### Lesson structure

Each verb day should include:
- 3–5 new verbs or adjectives in `vocab`
- A `grammar` field showing the conjugation pattern being taught
- `practice` section with conjugation drills
- `tip` highlighting common mistakes or mnemonics

---

## 6. N3 Grammar (Phase 18 — days 821–895)

### Key N3 grammar patterns (~120)

Organise into thematic groups across the 75 grammar days:

**Conditionals & hypotheticals**
- ～としたら / ～とすれば (supposing that)
- ～ないことには (unless)
- ～さえ～ば (if only / as long as)

**Cause & reason**
- ～おかげで (thanks to)
- ～せいで (because of — negative)
- ～以上 (since / given that)
- ～ことから (from the fact that)

**Contrast & concession**
- ～にもかかわらず (despite)
- ～くせに (even though — critical tone)
- ～一方で (on the other hand)
- ～ものの (although)

**Extent & degree**
- ～ほど (to the extent that)
- ～くらい / ぐらい (about / to the degree)
- ～ば～ほど (the more... the more...)

**Hearsay & appearance**
- ～ようだ / ～みたいだ (it seems)
- ～らしい (apparently)
- ～っぽい (seems like / -ish)
- ～とのことだ (I hear that)

**Time & sequence**
- ～うちに (while / before it's too late)
- ～たとたん (the moment that)
- ～次第 (as soon as)
- ～て以来 (ever since)

**Intention & decision**
- ～ことにする (decide to)
- ～ことになる (it has been decided that)
- ～つもりで (with the intention of)
- ～ようにする (make an effort to)

**Obligation & permission**
- ～わけにはいかない (cannot afford to)
- ～ざるを得ない (have no choice but to)
- ～べきだ (should)
- ～ことはない (there's no need to)

**Listing & examples**
- ～をはじめ (starting with)
- ～にかけて (from... through)
- ～にわたって (over / spanning)
- ～を中心に (centered around)

**Formal expressions**
- ～において (in / at — formal)
- ～に対して (toward / in contrast to)
- ～に関して (regarding)
- ～について (concerning)
- ～によると (according to)
- ～に基づいて (based on)

### Grammar entry format

Same as existing:

```javascript
grammar: {
  pattern: '～おかげで',
  meaning: 'thanks to ~',
  example_jp: '先生のおかげで日本語が上手になりました。',
  example_en: 'Thanks to my teacher, my Japanese improved.'
}
```

---

## 7. N3 Kanji (Phase 19 — days 896–930)

### Target: ~170 new kanji

N3 introduces kanji with multiple readings and more abstract meanings. Group by theme:

- **People & roles** — 客, 婦, 婚, 相, 係, 届
- **Actions** — 預, 払, 届, 逃, 届, 届
- **Nature** — 湖, 港, 島, 畑, 砂, 届
- **Feelings** — 悲, 届, 届, 届, 届, 届
- **Society** — 届, 届, 届, 届, 届, 届

Each kanji day teaches ~5 kanji using the `chars` field:

```javascript
chars: [
  ['届', 'とど(ける)'],
  ['預', 'あず(ける)'],
  ...
]
```

### Multiple readings

N3 kanji often have both on'yomi and kun'yomi readings that are actively used. The `chars` format supports a single reading string — use the most common reading and introduce alternates in the `vocab` entries and `tip` text.

---

## 8. N3 Test Prep (Phase 20 — days 931–960)

- Mixed review exercises pulling from all N3 content
- Simulated test sections: vocabulary, grammar, reading comprehension
- Timed practice drills
- Common mistake review and test-taking strategies

---

# Part II — JLPT N2

N2 tests the ability to understand Japanese used in everyday situations and in a variety of circumstances to a certain degree. Passing N2 is a common requirement for employment in Japan.

---

## 9. N2 Vocabulary (Phase 22 — days 991–1090)

### Categories to cover

N2 vocabulary is significantly larger and more nuanced. ~3,000 new words organised by domain:

- **Business & economics** — 契約 (contract), 利益 (profit), 投資 (investment), 経営 (management), 売上 (sales), 株式 (stock), 景気 (economic conditions)
- **Politics & law** — 選挙 (election), 法律 (law), 政治 (politics), 権利 (rights), 制度 (system), 裁判 (trial), 議論 (debate)
- **Science & technology** — 実験 (experiment), 技術 (technology), 開発 (development), 発明 (invention), 人工 (artificial), 遺伝 (heredity)
- **Medicine & health** — 診断 (diagnosis), 手術 (surgery), 処方 (prescription), 免疫 (immunity), 感染 (infection), 予防 (prevention)
- **Psychology & emotions** — 意識 (consciousness), 性格 (personality), 態度 (attitude), 欲望 (desire), 孤独 (loneliness), 緊張 (tension)
- **Culture & arts** — 伝統 (tradition), 芸術 (art), 文化 (culture), 作品 (work/piece), 展示 (exhibition), 演奏 (performance)
- **Environment & geography** — 気候 (climate), 汚染 (pollution), 災害 (disaster), 資源 (resources), 半島 (peninsula), 大陸 (continent)
- **Abstract & formal** — 本質 (essence), 概念 (concept), 傾向 (tendency), 矛盾 (contradiction), 前提 (premise), 要素 (element)
- **Onomatopoeia** — ぺらぺら (fluently), ぐっすり (soundly), じろじろ (staring), のんびり (leisurely), ぎりぎり (barely), うっかり (carelessly)
- **Set phrases & collocations** — 手を打つ (take measures), 気が済む (be satisfied), 腕を磨く (hone one's skills), 目を通す (look over)

### Lesson pacing

~30 words per day across 100 days. Group related words (e.g. synonyms, antonyms, word families) within the same lesson for better retention.

---

## 10. N2 Verbs & Expressions (Phase 23 — days 1091–1140)

### Key topics

- **Advanced compound verbs** — 取り組む (tackle), 見落とす (overlook), 打ち合わせる (arrange), 申し込む (apply), 受け止める (accept/catch), 繰り返す (repeat)
- **Honorific/humble verb pairs** — いらっしゃる/参る, おっしゃる/申す, 召し上がる/いただく, ご覧になる/拝見する
- **Idiomatic verb expressions** — 気にする (worry about), 気がつく (notice), 手に入れる (obtain), 口にする (mention/eat), 身につける (acquire)
- **Verbs with する/なる patterns** — 満足する (be satisfied), 成功する (succeed), 実現する (realise), 反対する (oppose)
- **Formal written verbs** — 述べる (state), 示す (indicate), 占める (occupy), 果たす (fulfil), 及ぶ (reach/extend)
- **Nuanced adjective groups** — 適切な (appropriate), 莫大な (enormous), 顕著な (remarkable), 微妙な (subtle), 深刻な (serious)

---

## 11. N2 Grammar (Phase 24 — days 1141–1230)

### Key N2 grammar patterns (~180)

**Formality & written style**
- ～にほかならない (nothing other than)
- ～に違いない (there's no doubt that)
- ～に過ぎない (merely / nothing more than)
- ～に限る (nothing beats / it's best to)
- ～に限らず (not limited to)
- ～もさることながら (not only... but also)

**Emphasis & extent**
- ～どころか (far from)
- ～ばかりか (not only)
- ～からには / ～以上は (now that / since)
- ～ものなら (if one could)
- ～ないものか (isn't there some way to)
- ～といっても (even though I say)

**Reasoning & judgement**
- ～わけだ (that's why / no wonder)
- ～わけがない (there's no way)
- ～わけではない (it doesn't mean that)
- ～というものだ (that's what it means to)
- ～というものではない (it's not necessarily)
- ～とは限らない (not necessarily)

**Tendency & habit**
- ～がちだ (tend to)
- ～きる / ～きれない (completely / can't completely)
- ～つつある (in the process of)
- ～つつも (while / even though)
- ～っぱなし (leaving in a state)
- ～かねる (find it difficult to)
- ～かねない (might well / liable to)

**Concession & contrast**
- ～たところで (even if)
- ～ようが / ～ようと (no matter how)
- ～にしろ / ～にせよ (whether... or)
- ～ながらも (while / although)
- ～と思いきや (just when I thought)

**Scope & limits**
- ～に限って (only when / it's always)
- ～をもとに (based on)
- ～を問わず (regardless of)
- ～を通じて / ～を通して (through / throughout)
- ～に沿って (along / in line with)
- ～に応じて (depending on / in response to)

**Causation & relation**
- ～あまり (so much that)
- ～末に (after / at the end of)
- ～上で (in / when / for the purpose of)
- ～上は (now that)
- ～上に (on top of / in addition to)
- ～からこそ (precisely because)

**Quotation & hearsay**
- ～とか (I heard that)
- ～ということだ (it means that / I heard that)
- ～と言えば (speaking of)
- ～かと思うと (just when I thought)
- ～ものだ (used to / it's natural that)

---

## 12. N2 Kanji (Phase 25 — days 1231–1275)

### Target: ~200 new kanji

N2 kanji include many abstract and compound-forming characters. Group by usage:

- **Government & law** — 裁, 憲, 権, 議, 税, 政, 党, 省, 庁, 制
- **Economy & business** — 株, 融, 債, 益, 損, 銘, 為, 額, 貿, 輸
- **Science & medicine** — 菌, 症, 脳, 腸, 肺, 臓, 胃, 酸, 素, 析
- **Abstract & literary** — 抽, 概, 象, 哲, 倫, 観, 仮, 矛, 盾, 弦
- **Emotions & character** — 誠, 恥, 憎, 嫉, 慕, 悔, 嘆, 憂, 慎, 謙
- **Nature & geography** — 沼, 崖, 岳, 峡, 湾, 滝, 霧, 霜, 雷, 虹

### Compound word focus

N2 kanji lessons should emphasise jukugo (compound words) alongside individual characters. Each kanji day includes:
- 4–5 new kanji in `chars`
- 3–5 compound words using those kanji in `vocab`
- `tip` explaining on'yomi vs kun'yomi usage in compounds

---

## 13. N2 Test Prep (Phase 26 — days 1276–1320)

- Full-length simulated N2 test sections
- Timed reading with passage lengths matching real exam (~500–800 characters)
- Listening comprehension strategy (using TTS for practice dialogues)
- Grammar cloze tests mixing N3 and N2 patterns
- Kanji reading/writing drills under time pressure
- Common error analysis and test-taking strategy tips

---

# Part III — JLPT N1

N1 is the highest level and tests the ability to understand Japanese in a variety of circumstances. It covers complex written Japanese including newspapers, literary works, and academic texts.

---

## 14. N1 Vocabulary (Phase 28 — days 1351–1470)

### Categories to cover

N1 vocabulary is the largest set. ~4,000 new words spanning formal, literary, and specialised domains:

- **Formal & written** — 概ね (generally), 辛うじて (barely), 予め (in advance), 敢えて (daringly), 一概に (unconditionally), 万が一 (by any chance)
- **Academic & research** — 論文 (thesis), 仮説 (hypothesis), 検証 (verification), 分析 (analysis), 統計 (statistics), 文献 (literature/reference)
- **Law & governance** — 条例 (ordinance), 施行 (enforcement), 審議 (deliberation), 判決 (ruling), 訴訟 (lawsuit), 改正 (amendment)
- **Economics & finance** — 景気 (economy), 不況 (recession), 為替 (exchange rate), 物価 (prices), 歳入 (revenue), 赤字 (deficit)
- **Philosophy & thought** — 概念 (concept), 本質 (essence), 普遍 (universal), 抽象 (abstract), 存在 (existence), 意義 (significance)
- **Literary & archaic** — 余儀なく (unavoidably), 甚だ (extremely), 如何 (how/what), 所以 (reason), 即ち (namely), 寧ろ (rather)
- **Four-character idioms (四字熟語)** — 一石二鳥 (killing two birds), 自業自得 (reap what you sow), 以心伝心 (telepathy), 前代未聞 (unprecedented), 試行錯誤 (trial and error)
- **Proverbs & sayings** — 猿も木から落ちる (even experts fail), 七転び八起き (perseverance), 石の上にも三年 (patience pays off)
- **Onomatopoeia (advanced)** — しんみり (quietly/sentimentally), まごまご (hesitantly), おどおど (nervously), てきぱき (efficiently), めきめき (rapidly improving)
- **Newspaper vocabulary** — 見出し (headline), 社説 (editorial), 特派員 (correspondent), 世論 (public opinion), 動向 (trends)

### Lesson pacing

~33 words per day across 120 days. Cluster by register (formal written, spoken, literary) so learners build contextual awareness.

---

## 15. N1 Verbs & Expressions (Phase 29 — days 1471–1530)

### Key topics

- **Literary & archaic verbs** — 赴く (proceed to), 施す (carry out), 講じる (take measures), 促す (urge), 遂げる (accomplish), 覆す (overturn), 培う (cultivate), 潤う (moisten/benefit)
- **Classical Japanese remnants** — ～ざる (negative — 止むを得ざる), ～なり (classical copula), ～べし (should/must — classical), ～如し (like — 如何にも)
- **Keigo mastery** — Double-honorific avoidance, business keigo sequences, written keigo (拝啓/敬具, 貴社/弊社), telephone keigo patterns
- **Four-character idiom verbs** — 一蹴する (dismiss), 黙認する (tacitly approve), 痛感する (keenly feel), 断行する (carry out decisively)
- **Nuanced synonym groups** — 変える/換える/代える/替える, 聞く/聴く/効く/利く, 計る/測る/量る/図る
- **Formal adjective expressions** — 顕著な (remarkable), 膨大な (vast), 多大な (great), 甚大な (enormous), 著しい (striking), 目覚ましい (remarkable)
- **Written-style set expressions** — ～を余儀なくされる (be forced to), ～の一途をたどる (continue on a path of), ～に拍車をかける (accelerate)

---

## 16. N1 Grammar (Phase 30 — days 1531–1640)

### Key N1 grammar patterns (~220)

**Formal & written expressions**
- ～たりとも～ない (not even one)
- ～をもって (by means of / as of)
- ～を余儀なくされる (be compelled to)
- ～をものともせず (in defiance of)
- ～ともなると / ～ともなれば (when it comes to being)
- ～ならでは (unique to / only possible with)
- ～あっての (only because of)

**Emphasis & assertion**
- ～てやまない (never cease to)
- ～に堪えない (unbearable / deeply moved)
- ～極まりない / ～極まる (extremely)
- ～ずにはいられない (can't help but)
- ～てならない (can't help feeling)
- ～ないではいられない (can't help but)
- ～といったらない (indescribably)

**Negation & limitation**
- ～ないまでも (even if not)
- ～ずとも (even without)
- ～まじき (unbecoming of — literary)
- ～べからず (must not — literary)
- ～ものを (if only — regret)
- ～ならいざ知らず (maybe for... but)

**Condition & concession (advanced)**
- ～ようものなら (if one were to)
- ～たが最後 (once you do... it's over)
- ～であれ / ～であろうと (even if / no matter)
- ～とあって (because / given that — situation)
- ～とあれば (if it's for the sake of)
- ～ともあろう (for someone of such standing)

**Degree & comparison**
- ～んばかりに (as if about to)
- ～が如く (as if — literary)
- ～にも増して (more than)
- ～に至っては (as for — extreme case)
- ～たるや (when it comes to — emphasis)
- ～といい～といい (whether... or... — both)

**Reasoning & basis**
- ～をもってすれば (given / with)
- ～からある / ～からする (at least / as much as)
- ～ゆえに (because — literary)
- ～ことゆえ (because — humble)
- ～手前 (considering that / since)
- ～とあっては (given that)

**Simultaneous & sequence (advanced)**
- ～なり (as soon as — instant)
- ～そばから (as fast as)
- ～が早いか (no sooner than)
- ～や否や (the moment that)
- ～かたわら (while also)
- ～がてら (while / on the occasion of)

**Classical & literary patterns**
- ～まい (won't / probably not)
- ～べく (in order to)
- ～べくもない (there's no way to)
- ～んがため (in order to — literary)
- ～ざるを得ない (have no choice but to)
- ～かたがた (for the dual purpose of)

---

## 17. N1 Kanji (Phase 31 — days 1641–1690)

### Target: ~300 new kanji

N1 adds the remaining joyo kanji with many rare readings and literary uses:

- **Literary & archaic** — 曖, 昧, 朦, 朧, 蒼, 碧, 燦, 爛, 煌, 耀
- **Formal documents** — 謄, 膳, 璽, 勅, 詔, 赦, 轄, 禄, 叙, 勲
- **Nature (poetic)** — 霞, 霧, 靄, 朧, 雫, 瀬, 淵, 峻, 嶺, 巌
- **Body & medicine** — 膝, 肘, 踵, 腱, 靭, 脊, 髄, 腫, 瘍, 疾
- **Character & virtue** — 廉, 恭, 倹, 篤, 寛, 勤, 慈, 惻, 忍, 堅
- **Compounds & business** — 斡, 旋, 頓, 挫, 措, 捗, 践, 礎, 鍛, 錬

### Approach

N1 kanji days should emphasise:
- Multiple readings (on/kun) with example compound words
- Distinguishing visually similar kanji (e.g. 土/士, 未/末, 己/已/巳)
- Kanji etymology where useful for memorisation
- Written-context reading (newspaper, formal letters)

---

## 18. N1 Test Prep (Phase 32 — days 1691–1720)

- Full-length N1 mock exams (vocabulary, grammar, reading, listening)
- Newspaper article reading with comprehension questions (~800–1200 characters)
- Essay-length passage analysis
- Speed reading drills with timed comprehension checks
- Listening strategy for fast-paced dialogues and monologues
- Cross-level grammar review (distinguishing N3/N2/N1 similar patterns)
- Final review of all ~850 kanji, ~10,500 vocabulary, ~650 grammar patterns

---

# Part IV — New Features (shared across N3/N2/N1)

---

## 19. Reading comprehension

### New lesson field: `passage`

Add an optional `passage` field for reading-focused days:

```javascript
{
  day: 935,
  type: 'reading',
  passage: {
    text_jp: '昨日、友達と一緒に映画を見に行きました。...',
    text_en: 'Yesterday, I went to see a movie with my friend. ...',
    questions: [
      {
        question_jp: '誰と映画を見に行きましたか。',
        question_en: 'Who did they go see a movie with?',
        answer: '友達'
      }
    ]
  }
}
```

### Passage complexity by level

| Level | Passage Length | Source Style | Questions per Passage |
|-------|--------------|-------------|----------------------|
| N3 | 200–400 characters | Everyday topics, simple narratives | 2–3 |
| N2 | 400–800 characters | News articles, opinion pieces, instructions | 3–4 |
| N1 | 800–1200 characters | Newspaper editorials, academic essays, literary excerpts | 4–5 |

### Implementation requirements

- Add `passage` rendering to `DayView` component in `index.html`
- Display Japanese text with furigana toggle (show/hide readings above kanji)
- Show comprehension questions after reading
- Add a `"reading"` exercise type to `buildExercises()` in `lib.js`
- Test coverage for passage rendering and reading exercises

---

## 20. Exercise system updates (`lib.js`)

### Existing exercise types (no changes needed)

- `mc` — multiple choice
- `typing` — type the answer
- `listen` — TTS listening comprehension

### New exercise types to add

| Type | Introduced at | Description |
|------|--------------|-------------|
| `reading` | N3 | Read a passage, answer comprehension questions |
| `conjugation` | N3 | Given a verb + target form, type the conjugation |
| `pair_match` | N3 | Match transitive/intransitive verb pairs |
| `fill_blank` | N3 | Sentence with grammar slot, choose correct pattern |
| `synonym` | N2 | Choose the word closest in meaning |
| `reorder` | N2 | Arrange scrambled words into correct sentence order |
| `error_find` | N2 | Identify the grammatical error in a sentence |
| `kanji_reading` | N2 | Given a sentence, select correct reading for underlined kanji |
| `passage_cloze` | N1 | Fill in blanks within a reading passage |
| `register` | N1 | Choose the appropriate formality level for context |
| `paraphrase` | N1 | Select the sentence with the same meaning |

### Changes to `buildExercises()`

- Increase exercise cap from 5 to 6–8 for N3, 8–10 for N2/N1 lessons
- Add generation logic for all new exercise types
- Ensure `checkTyping()` handles longer answers with kanji input
- Prioritise exercise types that match the current lesson `type`

---

## 21. SRS updates

### No structural changes needed

The existing SM-2 implementation (`srsReview`, `srsAddCards`, `srsDueCards`) handles all levels without modification. Card IDs use the `cardId(type, day, idx)` format which scales to any day number.

### Tuning considerations

| Level | Consideration |
|-------|--------------|
| N3 | Adjust initial intervals for kanji that build on N5/N4 radicals |
| N2 | Add "mature card" threshold to deprioritise well-known cards |
| N2 | Introduce "leech detection" for cards repeatedly failed |
| N1 | Add context-aware review — show kanji in compound words, not isolation |
| All | Consider daily review cap (e.g. 50 due cards/day) to prevent overwhelm at higher day counts |

---

## 22. UI updates (`index.html`)

### Overview calendar

- The `Overview` component grid already renders all days dynamically from the `curriculum` array
- Phase legend auto-extends if `PHASE_NAMES` is updated
- Verify the grid renders correctly at 1720 days (currently 660)
- Consider adding a level filter/tab (N5 | N4 | N3 | N2 | N1) to avoid overwhelming the calendar view

### Progress bar

- Already calculates percentage from `completed.size / curriculum.length` — scales automatically
- Consider showing per-level progress in addition to overall progress

### Level selector

- Add a level indicator/nav so users can jump between N5–N1 sections
- Show level completion badges (e.g. "N5 Complete", "N4 Complete")

### UI string localisation

Add new `UI_STRINGS` entries for vocabulary introduced at each level:

```javascript
// N3 additions
reading_passage: { en: 'Reading', ja: '読解', since: 935 },
conjugate:       { en: 'Conjugate', ja: '活用', since: 775 },

// N2 additions
synonym:         { en: 'Synonym', ja: '類義語', since: 1100 },
reorder:         { en: 'Reorder', ja: '並べ替え', since: 1150 },

// N1 additions
editorial:       { en: 'Editorial', ja: '社説', since: 1700 },
mock_exam:       { en: 'Mock Exam', ja: '模擬試験', since: 1695 },
```

### Furigana toggle

- Add a toggle button above reading passages and vocab sections to show/hide furigana
- Render furigana using `<ruby>` / `<rt>` HTML tags
- Store preference in `localStorage`
- For N1, default furigana to off (learners should be reading kanji directly)

---

## 23. Test updates (`tests.html`)

### Curriculum data integrity

Update existing integrity tests:
- Change expected total days from 660 to 1720
- Add phase range assertions for phases 15–32
- Add week range assertions (weeks up to ~246)
- Validate `passage` field structure on `type: 'reading'` days

### New test modules

| Module | Tests |
|--------|-------|
| `buildExercises (N3+ types)` | Verify all 11 new exercise types generate correctly |
| `passage rendering` | Validate passage field structure, question/answer format, length bounds |
| `furigana` | Test ruby tag generation from kanji + reading pairs |
| `conjugation exercises` | Validate verb form targets, accepted answers |
| `level boundaries` | Verify day ranges for each JLPT level don't overlap |

### Regression protection

- All existing tests must continue to pass
- N5/N4 lesson data must remain untouched
- Phase constants for phases 1–14 must not change

---

## 24. Content authoring guidelines

To maintain consistency across all 1720 days:

1. **`type` must be a string** — never an array (see day 85 bug)
2. **`vocab` entries must be 3-element arrays** — `[japanese, reading, english]` (see days 86–97 bug)
3. **`chars` entries must be 2-element arrays** — `[character, reading]` (see day 173 bug)
4. **`week` values must equal `Math.ceil(day / 7)`** — no manual week numbering (see day 365 bug)
5. **Meaning fields must not be empty strings** — every vocab and char entry needs a valid English meaning (see days 253–308 bug)
6. **Grammar `example_jp` must use the taught pattern** — the example sentence should clearly demonstrate the grammar point
7. **`intro` text should reference prior knowledge** — connect new material to what was learned at lower levels
8. **N2/N1 grammar examples must use level-appropriate vocabulary** — don't introduce unknown words in grammar examples
9. **Passages must include both `text_jp` and `text_en`** — always provide translations
10. **Four-character idioms need literal + figurative meanings** — e.g. "one stone two birds → killing two birds with one stone"

---

## 25. File changes summary

| File | Changes | Status |
|------|---------|--------|
| `curriculum.js` | N3 days 661–960, phases 15–20 ✅; still needs N2/N1 days 961–1720, phases 21–32 | N3 done |
| `lib.js` | Add 11 new exercise types to `buildExercises()`, increase exercise caps, add furigana helper | Planned |
| `index.html` | Passage rendering, furigana toggle, level selector/filter, reading exercise UI, per-level progress | Planned |
| `tests.html` | Update day count checks as levels are added, add phase range checks, new exercise type tests | Ongoing |
| `CLAUDE.md` | Updated with 960-day curriculum structure and current test coverage | ✅ Done |
| `README.md` | Updated with N5/N4/N3 curriculum overview | ✅ Done |

---

## 26. Implementation order

### Phase A — N3 (days 661–960) ✅ Complete

1. ✅ Phase constants 15–20 in `curriculum.js`
2. ✅ N4 Review days (661–690)
3. ✅ N3 Vocabulary days (691–770)
4. ✅ N3 Verbs & Adjectives days (771–820)
5. ✅ N3 Grammar days (821–895)
6. ✅ N3 Kanji days (896–930)
7. N3 reading comprehension feature (`passage` field, `DayView`, `buildExercises`) — planned
8. New exercise types: `reading`, `conjugation`, `pair_match`, `fill_blank` — planned
9. ✅ N3 Test Prep days (931–960)
10. ✅ Tests for N3 curriculum data integrity

### Phase B — N2 (days 961–1320)

11. Phase constants 21–26 in `curriculum.js`
12. N3 Review days (961–990)
13. N2 Vocabulary days (991–1090)
14. N2 Verbs & Expressions days (1091–1140)
15. N2 Grammar days (1141–1230)
16. N2 Kanji days (1231–1275)
17. New exercise types: `synonym`, `reorder`, `error_find`, `kanji_reading`
18. N2 Test Prep days (1276–1320)
19. UI level selector and per-level progress
20. Tests for N2 content and features

### Phase C — N1 (days 1321–1720)

21. Phase constants 27–32 in `curriculum.js`
22. N2 Review days (1321–1350)
23. N1 Vocabulary days (1351–1470)
24. N1 Verbs & Expressions days (1471–1530)
25. N1 Grammar days (1531–1640)
26. N1 Kanji days (1641–1690)
27. New exercise types: `passage_cloze`, `register`, `paraphrase`
28. N1 Test Prep days (1691–1720)
29. Final UI polish, overview calendar at scale, furigana defaults
30. Full regression test suite for all 1720 days
31. Update `CLAUDE.md` and `README.md`
