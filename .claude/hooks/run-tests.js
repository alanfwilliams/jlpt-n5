#!/usr/bin/env node
/**
 * Headless test runner for jlpt-n5.
 *
 * Loads curriculum.js and lib.js via Node's vm module (so top-level `var`
 * declarations become globals) then exercises every pure function that the
 * QUnit suite in tests.html covers.
 *
 * Exit 0  → all tests passed
 * Exit 1  → one or more tests failed
 */
"use strict";

const vm   = require("vm");
const fs   = require("fs");
const path = require("path");

// ── locate project root ───────────────────────────────────────────────────────
const projectDir = process.env.CLAUDE_PROJECT_DIR ||
  path.resolve(__dirname, "..", "..");

// ── browser-API stubs ─────────────────────────────────────────────────────────
// speechSynthesis absent → buildExercises skips "listen" exercises (deterministic)
global.window = { speechSynthesis: undefined };

// ── load scripts into global scope ───────────────────────────────────────────
vm.runInThisContext(fs.readFileSync(path.join(projectDir, "curriculum.js"), "utf8"));
vm.runInThisContext(fs.readFileSync(path.join(projectDir, "lib.js"),        "utf8"));

// ── minimal test harness ──────────────────────────────────────────────────────
var _pass = 0, _fail = 0;

function test(name, fn) {
  var failures = [];
  var assert = {
    equal: function (a, b, m) {
      if (a !== b)
        failures.push((m ? m + " — " : "") + "expected " + JSON.stringify(b) + ", got " + JSON.stringify(a));
    },
    ok: function (v, m) { if (!v) failures.push(m || "expected truthy, got " + v); },
    notOk: function (v, m) { if (v)  failures.push(m || "expected falsy, got "  + v); },
    deepEqual: function (a, b, m) {
      if (JSON.stringify(a) !== JSON.stringify(b))
        failures.push((m || "deepEqual") + "\n    got: " + JSON.stringify(a) + "\n    exp: " + JSON.stringify(b));
    },
    notStrictEqual: function (a, b, m) {
      if (a === b) failures.push(m || "expected different references");
    },
  };
  try {
    fn(assert);
    if (failures.length === 0) {
      _pass++;
    } else {
      _fail++;
      console.error("  FAIL  " + name);
      failures.forEach(function (f) { console.error("         " + f); });
    }
  } catch (e) {
    _fail++;
    console.error("  ERROR " + name + ": " + e.message);
  }
}

// ── 1. sm2Update ──────────────────────────────────────────────────────────────
test("sm2Update: null card uses SM-2 defaults", function (a) {
  var r = sm2Update(null, 3);
  a.equal(r.reps, 1); a.equal(r.interval, 1);
  a.ok(typeof r.due === "number", "due is a number");
});
test("sm2Update: reps=0 grade>=3 → interval=1, reps=1", function (a) {
  var r = sm2Update({ interval: 1, ef: 2.5, reps: 0 }, 3);
  a.equal(r.interval, 1); a.equal(r.reps, 1);
});
test("sm2Update: reps=1 grade>=3 → interval=6, reps=2", function (a) {
  var r = sm2Update({ interval: 1, ef: 2.5, reps: 1 }, 3);
  a.equal(r.interval, 6); a.equal(r.reps, 2);
});
test("sm2Update: reps=2 grade>=3 → interval=round(interval*ef)", function (a) {
  var r = sm2Update({ interval: 6, ef: 2.5, reps: 2 }, 3);
  a.equal(r.interval, 15); a.equal(r.reps, 3);
});
test("sm2Update: grade<3 resets reps=0 and interval=1", function (a) {
  var r = sm2Update({ interval: 15, ef: 2.5, reps: 5 }, 2);
  a.equal(r.reps, 0); a.equal(r.interval, 1);
});
test("sm2Update: grade=5 increases EF", function (a) {
  var r = sm2Update({ interval: 1, ef: 2.5, reps: 1 }, 5);
  a.ok(r.ef > 2.5, "ef=" + r.ef);
});
test("sm2Update: grade=3 decreases EF", function (a) {
  var r = sm2Update({ interval: 1, ef: 2.5, reps: 1 }, 3);
  a.ok(r.ef < 2.5, "ef=" + r.ef);
});
test("sm2Update: EF never below 1.3", function (a) {
  var c = { interval: 1, ef: 1.3, reps: 2 };
  for (var i = 0; i < 5; i++) {
    c = sm2Update(c, 3);
    a.ok(c.ef >= 1.3, "iter " + i + " ef=" + c.ef);
  }
});
test("sm2Update: due is interval days from now", function (a) {
  var before = Date.now();
  var r = sm2Update({ interval: 1, ef: 2.5, reps: 1 }, 3); // interval → 6
  var after  = Date.now();
  var ms = 86400000;
  a.ok(r.due >= before + 6 * ms && r.due <= after + 6 * ms, "due ~6 days out");
});
test("sm2Update: does not mutate input", function (a) {
  var c = { interval: 6, ef: 2.5, reps: 2 };
  sm2Update(c, 5);
  a.equal(c.interval, 6); a.equal(c.ef, 2.5); a.equal(c.reps, 2);
});

// ── 2. checkTyping ────────────────────────────────────────────────────────────
test("checkTyping: exact match", function (a) { a.ok(checkTyping("cat", ["cat"])); });
test("checkTyping: case-insensitive (user)", function (a) { a.ok(checkTyping("CAT", ["cat"])); });
test("checkTyping: case-insensitive (answer)", function (a) { a.ok(checkTyping("cat", ["CAT"])); });
test("checkTyping: trims whitespace", function (a) { a.ok(checkTyping("  cat  ", ["cat"])); });
test("checkTyping: wrong answer fails", function (a) { a.notOk(checkTyping("dog", ["cat"])); });
test("checkTyping: empty string fails", function (a) { a.notOk(checkTyping("", ["cat"])); });
test("checkTyping: slash alternative (first part)", function (a) { a.ok(checkTyping("sake",   ["sake/salmon"])); });
test("checkTyping: slash alternative (second part)", function (a) { a.ok(checkTyping("salmon", ["sake/salmon"])); });
test("checkTyping: comma alternative (first part)", function (a) { a.ok(checkTyping("flower", ["flower,nose"])); });
test("checkTyping: comma alternative (second part)", function (a) { a.ok(checkTyping("nose",   ["flower,nose"])); });
test("checkTyping: matches any entry in answers array", function (a) { a.ok(checkTyping("bird", ["cat", "bird", "fish"])); });
test("checkTyping: no match fails", function (a) { a.notOk(checkTyping("horse", ["cat", "dog"])); });

// ── 3. cardId ─────────────────────────────────────────────────────────────────
test("cardId: vocab format", function (a) { a.equal(cardId("v", 1, 0),   "v_1_0");   });
test("cardId: char format",  function (a) { a.equal(cardId("c", 14, 3),  "c_14_3");  });
test("cardId: large values", function (a) { a.equal(cardId("v", 365, 99),"v_365_99");});

// ── 4. addDayCards ────────────────────────────────────────────────────────────
var _sampleLesson = { day: 1,
  vocab: [["いえ","いえ","house"], ["あお","あお","blue"]],
  chars: [["あ","a"], ["い","i"]] };

test("addDayCards: adds vocab and char cards", function (a) {
  var r = addDayCards({}, _sampleLesson);
  a.ok(r["v_1_0"]); a.ok(r["v_1_1"]); a.ok(r["c_1_0"]); a.ok(r["c_1_1"]);
});
test("addDayCards: initial SM-2 values", function (a) {
  var c = addDayCards({}, _sampleLesson)["v_1_0"];
  a.equal(c.interval, 1); a.equal(c.ef, 2.5); a.equal(c.reps, 0);
});
test("addDayCards: does not overwrite existing card", function (a) {
  var ex = { interval: 10, ef: 1.8, reps: 7, due: 999 };
  var r  = addDayCards({ "v_1_0": ex }, _sampleLesson);
  a.deepEqual(r["v_1_0"], ex);
});
test("addDayCards: empty lesson produces no cards", function (a) {
  a.equal(Object.keys(addDayCards({}, { day: 99, vocab: [], chars: [] })).length, 0);
});

// ── 5. getDueCards ────────────────────────────────────────────────────────────
test("getDueCards: past-due card returned", function (a) {
  var srs = { "v_1_0": { due: Date.now() - 1000 }, "v_1_1": { due: Date.now() + 99999 } };
  a.deepEqual(getDueCards(srs), ["v_1_0"]);
});
test("getDueCards: nothing due → empty", function (a) {
  a.equal(getDueCards({ "v_1_0": { due: Date.now() + 99999 } }).length, 0);
});
test("getDueCards: all due → all returned", function (a) {
  var p = Date.now() - 1000;
  a.equal(getDueCards({ "v_1_0": {due:p}, "v_1_1": {due:p}, "c_1_0": {due:p} }).length, 3);
});
test("getDueCards: returns ID strings", function (a) {
  a.equal(typeof getDueCards({ "v_1_0": { due: Date.now() - 1 } })[0], "string");
});

// ── 6. cardToItem ─────────────────────────────────────────────────────────────
test("cardToItem: vocab card fields", function (a) {
  var item = cardToItem("v_1_0", {});
  a.equal(item.type, "vocab"); a.equal(item.front, "いえ");
  a.equal(item.back, "house"); a.equal(item.day, 1);
});
test("cardToItem: char card fields", function (a) {
  var item = cardToItem("c_1_0", {});
  a.equal(item.type, "char"); a.equal(item.front, "あ"); a.equal(item.back, "a");
});
test("cardToItem: reading=null when same as front", function (a) {
  a.equal(cardToItem("v_1_0", {}).reading, null);
});
test("cardToItem: out-of-range day → null", function (a) {
  a.equal(cardToItem("v_9999_0", {}), null);
});
test("cardToItem: out-of-range vocab index → null", function (a) {
  a.equal(cardToItem("v_1_999", {}), null);
});
test("cardToItem: out-of-range char index → null", function (a) {
  a.equal(cardToItem("c_1_999", {}), null);
});

// ── 7. rndShuffle ─────────────────────────────────────────────────────────────
test("rndShuffle: same length", function (a) {
  a.equal(rndShuffle([1,2,3,4,5]).length, 5);
});
test("rndShuffle: same elements", function (a) {
  var arr = ["a","b","c","d"];
  a.deepEqual(rndShuffle(arr).slice().sort(), arr.slice().sort());
});
test("rndShuffle: does not mutate original", function (a) {
  var arr = [1,2,3]; rndShuffle(arr);
  a.deepEqual(arr, [1,2,3]);
});
test("rndShuffle: empty array", function (a) { a.deepEqual(rndShuffle([]), []); });
test("rndShuffle: returns new reference", function (a) {
  var arr = [1,2,3];
  a.notStrictEqual(rndShuffle(arr), arr);
});

// ── 8. buildExercises ─────────────────────────────────────────────────────────
test("buildExercises: at most 5 exercises", function (a) {
  a.ok(buildExercises(curriculum[0]).length <= 5);
});
test("buildExercises: empty lesson → 0 exercises", function (a) {
  a.equal(buildExercises({ day: 1, vocab: [], chars: [] }).length, 0);
});
test("buildExercises: mc correct index in bounds (10 runs)", function (a) {
  for (var i = 0; i < 10; i++) {
    buildExercises(curriculum[0])
      .filter(function (e) { return e.type === "mc"; })
      .forEach(function (mc) {
        a.ok(mc.correct >= 0 && mc.correct < mc.options.length,
          "correct=" + mc.correct + " options=" + mc.options.length);
      });
  }
});

// ── 9. srsReview ──────────────────────────────────────────────────────────────
test("srsReview: quality=0 resets reps and interval", function (a) {
  var r = srsReview({ interval: 15, ease: 2.5, reps: 5, due: 0 }, 0);
  a.equal(r.reps, 0); a.equal(r.interval, 1);
});
test("srsReview: quality=1, reps=1 → interval=6", function (a) {
  var r = srsReview({ interval: 1, ease: 2.5, reps: 1, due: 0 }, 1);
  a.equal(r.interval, 6);
});
test("srsReview: quality=3 increases ease", function (a) {
  var r = srsReview({ interval: 1, ease: 2.5, reps: 0, due: 0 }, 3);
  a.ok(r.ease > 2.5, "ease=" + r.ease);
});
test("srsReview: ease never below 1.3", function (a) {
  var c = { interval: 1, ease: 1.3, reps: 2, due: 0 };
  for (var i = 0; i < 5; i++) {
    c = srsReview(c, 1);
    a.ok(c.ease >= 1.3, "iter " + i + " ease=" + c.ease);
  }
});
test("srsReview: does not mutate input", function (a) {
  var c = { interval: 6, ease: 2.5, reps: 2, due: 0 };
  srsReview(c, 3);
  a.equal(c.interval, 6); a.equal(c.ease, 2.5);
});
test("srsReview: returns new object", function (a) {
  var c = { interval: 1, ease: 2.5, reps: 0, due: 0 };
  a.notStrictEqual(srsReview(c, 3), c);
});

// ── 10. srsAddCards ───────────────────────────────────────────────────────────
test("srsAddCards: adds vocab card with embedded data", function (a) {
  var cards = {};
  srsAddCards({ day: 5, vocab: [["ねこ","ねこ","cat"]], chars: [] }, cards);
  a.ok(cards["v_5_0"]);
  a.equal(cards["v_5_0"].front, "ねこ");
  a.equal(cards["v_5_0"].back,  "cat");
  a.equal(cards["v_5_0"].type,  "vocab");
});
test("srsAddCards: adds char card with embedded data", function (a) {
  var cards = {};
  srsAddCards({ day: 5, vocab: [], chars: [["な","na"]] }, cards);
  a.ok(cards["c_5_0"]);
  a.equal(cards["c_5_0"].front, "な");
  a.equal(cards["c_5_0"].back,  "na");
});
test("srsAddCards: initial values interval=1, ease=2.5, reps=0", function (a) {
  var cards = {};
  srsAddCards({ day: 5, vocab: [["ねこ","ねこ","cat"]], chars: [] }, cards);
  var c = cards["v_5_0"];
  a.equal(c.interval, 1); a.equal(c.ease, 2.5); a.equal(c.reps, 0);
});
test("srsAddCards: does not overwrite existing card", function (a) {
  var ex = { interval: 14, ease: 1.9, reps: 8, due: 42,
             front: "ねこ", back: "cat", type: "vocab", id: "v_5_0" };
  var cards = { "v_5_0": ex };
  srsAddCards({ day: 5, vocab: [["ねこ","ねこ","cat"]], chars: [] }, cards);
  a.deepEqual(cards["v_5_0"], ex);
});
test("srsAddCards: returns true when cards added", function (a) {
  a.equal(srsAddCards({ day: 5, vocab: [["ねこ","ねこ","cat"]], chars: [] }, {}), true);
});
test("srsAddCards: returns false when all cards exist", function (a) {
  var cards = {};
  srsAddCards({ day: 5, vocab: [["ねこ","ねこ","cat"]], chars: [] }, cards);
  a.equal(srsAddCards({ day: 5, vocab: [["ねこ","ねこ","cat"]], chars: [] }, cards), false);
});

// ── 11. srsDueCards ───────────────────────────────────────────────────────────
test("srsDueCards: returns card objects (not IDs)", function (a) {
  var past = { id: "v_1_0", due: Date.now() - 1000 };
  var r = srsDueCards({ "v_1_0": past, "v_1_1": { id: "v_1_1", due: Date.now() + 99999 } });
  a.equal(r.length, 1); a.deepEqual(r[0], past);
});
test("srsDueCards: empty when none due", function (a) {
  a.equal(srsDueCards({ "v_1_0": { due: Date.now() + 99999 } }).length, 0);
});
test("srsDueCards: empty cards → empty", function (a) { a.equal(srsDueCards({}).length, 0); });
test("srsDueCards: all overdue → all returned", function (a) {
  var p = Date.now() - 1000;
  a.equal(srsDueCards({ "v_1_0":{due:p}, "v_1_1":{due:p}, "c_1_0":{due:p} }).length, 3);
});

// ── 12. Curriculum data integrity ─────────────────────────────────────────────
test("curriculum: not empty and has at least N2 (1320 lessons)", function (a) {
  a.ok(curriculum.length >= 1320, "should have at least 1320 lessons (N5 through N2 complete)");
});

test("curriculum: sequential day numbers starting from 1", function (a) {
  var failures = [];
  curriculum.forEach(function (l, i) { if (l.day !== i + 1) failures.push("idx" + i + "→day" + l.day); });
  a.equal(failures.length, 0, failures.join("; "));
});

test("curriculum: no duplicate day numbers", function (a) {
  a.equal(new Set(curriculum.map(function (l) { return l.day; })).size, curriculum.length);
});

test("curriculum: required string fields are non-empty on every lesson", function (a) {
  var fields   = ["title", "type", "intro", "practice", "tip"];
  var failures = [];
  curriculum.forEach(function (l) {
    fields.forEach(function (f) {
      if (!l[f] || typeof l[f] !== "string" || !l[f].trim())
        failures.push("day " + l.day + " field=" + f + " value=" + JSON.stringify(l[f]));
    });
  });
  a.equal(failures.length, 0, failures.join("\n"));
});

test("curriculum: type field is always a known string value", function (a) {
  var valid = new Set(["script","lesson","grammar","kanji","review","numbers","particles","verbs","vocab","reading"]);
  var failures = [];
  curriculum.forEach(function (l) {
    if (!valid.has(l.type))
      failures.push("day " + l.day + " type=" + JSON.stringify(l.type));
  });
  a.equal(failures.length, 0, failures.join("\n"));
});

test("curriculum: vocab entries are 3-element [jp, reading, meaning] arrays", function (a) {
  var failures = [];
  curriculum.forEach(function (l) {
    (l.vocab || []).forEach(function (v, i) {
      var tag = "day " + l.day + " vocab[" + i + "]";
      if (!Array.isArray(v) || v.length !== 3) { failures.push(tag + " length=" + (Array.isArray(v) ? v.length : typeof v)); return; }
      if (!v[0] || !v[0].trim()) failures.push(tag + "[0] (jp) empty");
      if (!v[2] || !v[2].trim()) failures.push(tag + "[2] (meaning) empty");
    });
  });
  a.equal(failures.length, 0, failures.join("\n"));
});

test("curriculum: chars entries are 2-element [char, reading] arrays", function (a) {
  var failures = [];
  curriculum.forEach(function (l) {
    (l.chars || []).forEach(function (c, i) {
      var tag = "day " + l.day + " chars[" + i + "]";
      if (!Array.isArray(c) || c.length !== 2) { failures.push(tag + " length=" + (Array.isArray(c) ? c.length : typeof c)); return; }
      if (!c[0] || !c[0].trim()) failures.push(tag + "[0] (char) empty");
      if (!c[1] || !c[1].trim()) failures.push(tag + "[1] (reading) empty");
    });
  });
  a.equal(failures.length, 0, failures.join("\n"));
});

test("curriculum: phaseNum is 1–32 on every lesson (N5 through N1)", function (a) {
  var failures = [];
  curriculum.forEach(function (l) {
    if (typeof l.phaseNum !== "number" || l.phaseNum < 1 || l.phaseNum > 32)
      failures.push("day " + l.day + " phaseNum=" + l.phaseNum);
  });
  a.equal(failures.length, 0, failures.join("\n"));
});

test("curriculum: week is 1–246 on every lesson", function (a) {
  var failures = [];
  curriculum.forEach(function (l) {
    if (typeof l.week !== "number" || l.week < 1 || l.week > 246)
      failures.push("day " + l.day + " week=" + l.week);
  });
  a.equal(failures.length, 0, failures.join("\n"));
});

test("curriculum: script-type lessons have at least one char", function (a) {
  var failures = curriculum
    .filter(function (l) { return l.type === "script"; })
    .filter(function (l) { return !l.chars || l.chars.length === 0; })
    .map(function   (l) { return "day " + l.day + " \"" + l.title + "\""; });
  a.equal(failures.length, 0, failures.join("\n"));
});

test("curriculum: days 1–14 are Hiragana (phaseNum=1)", function (a) {
  var f = curriculum.slice(0, 14).filter(function (l) { return l.phaseNum !== 1; });
  a.equal(f.length, 0, f.map(function (l) { return "day " + l.day; }).join(", "));
});

test("curriculum: days 15–28 are Katakana (phaseNum=2)", function (a) {
  var f = curriculum.slice(14, 28).filter(function (l) { return l.phaseNum !== 2; });
  a.equal(f.length, 0, f.map(function (l) { return "day " + l.day; }).join(", "));
});

test("curriculum: N5 ends at day 365", function (a) {
  a.equal(curriculum[364].day, 365, "day 365 should be the last N5 lesson");
});

test("curriculum: N4 ends at day 660", function (a) {
  a.equal(curriculum[659].day, 660, "day 660 should be the last N4 lesson");
});

test("curriculum: N3 ends at day 960, N2 complete at day 1320", function (a) {
  a.equal(curriculum[959].day, 960, "day 960 should be the last N3 lesson");
  a.equal(curriculum[1319].day, 1320, "day 1320 should be the last N2 lesson");
  a.equal(curriculum[curriculum.length - 1].day, 1320, "last day in curriculum is 1320");
});

test("curriculum: N2 phase boundaries (phases 21–26)", function (a) {
  // Phase 21: N3 Review days 961–990
  var ph21 = curriculum.slice(960, 990).filter(function (l) { return l.phaseNum !== 21; });
  a.equal(ph21.length, 0, "days 961–990 all phaseNum=21");
  // Phase 22: N2 Vocabulary days 991–1090
  var ph22 = curriculum.slice(990, 1090).filter(function (l) { return l.phaseNum !== 22; });
  a.equal(ph22.length, 0, "days 991–1090 all phaseNum=22");
  // Phase 23: N2 Verbs days 1091–1140
  var ph23 = curriculum.slice(1090, 1140).filter(function (l) { return l.phaseNum !== 23; });
  a.equal(ph23.length, 0, "days 1091–1140 all phaseNum=23");
  // Phase 24: N2 Grammar days 1141–1230
  var ph24 = curriculum.slice(1140, 1230).filter(function (l) { return l.phaseNum !== 24; });
  a.equal(ph24.length, 0, "days 1141–1230 all phaseNum=24");
  // Phase 25: N2 Kanji days 1231–1275
  var ph25 = curriculum.slice(1230, 1275).filter(function (l) { return l.phaseNum !== 25; });
  a.equal(ph25.length, 0, "days 1231–1275 all phaseNum=25");
  // Phase 26: N2 Test Prep days 1276–1320
  var ph26 = curriculum.slice(1275, 1320).filter(function (l) { return l.phaseNum !== 26; });
  a.equal(ph26.length, 0, "days 1276–1320 all phaseNum=26");
});

test("curriculum: N4 starts at day 366 (if present)", function (a) {
  if (curriculum.length > 365) {
    a.equal(curriculum[365].day, 366, "day 366 should be the first N4 lesson");
    a.ok(curriculum[365].phaseNum >= 9, "N4 lessons should have phaseNum 9+");
  } else {
    a.ok(true, "N4 not yet added");
  }
});

// ── 13. Phase constants ────────────────────────────────────────────────────────
var EXPECTED_PHASE_NAMES = {
  1: 'Hiragana', 2: 'Katakana', 3: 'Foundations',
  4: 'Vocabulary', 5: 'Verbs', 6: 'Grammar',
  7: 'Kanji', 8: 'Test Prep',
  9: 'N5 Review', 10: 'N4 Vocabulary', 11: 'N4 Verbs',
  12: 'N4 Grammar', 13: 'N4 Kanji', 14: 'N4 Test Prep',
  15: 'N4 Review', 16: 'N3 Vocabulary', 17: 'N3 Verbs & Adjectives',
  18: 'N3 Grammar', 19: 'N3 Kanji', 20: 'N3 Test Prep',
  21: 'N3 Review', 22: 'N2 Vocabulary', 23: 'N2 Verbs & Expressions',
  24: 'N2 Grammar', 25: 'N2 Kanji', 26: 'N2 Test Prep'
};
var PHASE_NUMS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20,
                 21, 22, 23, 24, 25, 26];

test("PHASE_COLORS: defined with all phase keys as non-empty strings", function (a) {
  a.ok(typeof PHASE_COLORS === "object" && PHASE_COLORS !== null, "PHASE_COLORS is an object");
  PHASE_NUMS.forEach(function (p) {
    a.ok(typeof PHASE_COLORS[p] === "string" && PHASE_COLORS[p].length > 0,
      "PHASE_COLORS[" + p + "] is a non-empty string");
  });
});

test("PHASE_BG: defined with all phase keys as non-empty strings", function (a) {
  a.ok(typeof PHASE_BG === "object" && PHASE_BG !== null, "PHASE_BG is an object");
  PHASE_NUMS.forEach(function (p) {
    a.ok(typeof PHASE_BG[p] === "string" && PHASE_BG[p].length > 0,
      "PHASE_BG[" + p + "] is a non-empty string");
  });
});

test("PHASE_NAMES: defined with correct names for all phases", function (a) {
  a.ok(typeof PHASE_NAMES === "object" && PHASE_NAMES !== null, "PHASE_NAMES is an object");
  PHASE_NUMS.forEach(function (p) {
    a.equal(PHASE_NAMES[p], EXPECTED_PHASE_NAMES[p], "PHASE_NAMES[" + p + "]");
  });
});

test("phase constants: every phaseNum in curriculum is covered", function (a) {
  var seen = new Set(curriculum.map(function (l) { return l.phaseNum; }));
  seen.forEach(function (p) {
    a.ok(PHASE_COLORS[p], "PHASE_COLORS has key " + p);
    a.ok(PHASE_BG[p],     "PHASE_BG has key "     + p);
    a.ok(PHASE_NAMES[p],  "PHASE_NAMES has key "  + p);
  });
});

// ── 14. furiganaHTML ──────────────────────────────────────────────────────────
test("furiganaHTML: returns ruby tags for kanji word", function (a) {
  var r = furiganaHTML('食べる', 'たべる');
  a.ok(r.indexOf('<ruby>') >= 0, 'contains ruby tag');
  a.ok(r.indexOf('<rt>') >= 0, 'contains rt tag');
  a.ok(r.indexOf('たべる') >= 0, 'contains reading');
});

test("furiganaHTML: returns plain text for hiragana-only word", function (a) {
  a.equal(furiganaHTML('たべる', 'たべる'), 'たべる');
});

test("furiganaHTML: returns word when no reading provided", function (a) {
  a.equal(furiganaHTML('test', null), 'test');
  a.equal(furiganaHTML('test', ''), 'test');
});

// ── 15. dayToLevel ────────────────────────────────────────────────────────────
test("dayToLevel: N5 range (days 1–365)", function (a) {
  a.equal(dayToLevel(1), 'N5');
  a.equal(dayToLevel(365), 'N5');
});

test("dayToLevel: N4 range (days 366–660)", function (a) {
  a.equal(dayToLevel(366), 'N4');
  a.equal(dayToLevel(660), 'N4');
});

test("dayToLevel: N3 range (days 661–960)", function (a) {
  a.equal(dayToLevel(661), 'N3');
  a.equal(dayToLevel(960), 'N3');
});

test("dayToLevel: N2 range (days 961–1320)", function (a) {
  a.equal(dayToLevel(961), 'N2');
  a.equal(dayToLevel(1320), 'N2');
});

test("dayToLevel: N1 range (days 1321+)", function (a) {
  a.equal(dayToLevel(1321), 'N1');
  a.equal(dayToLevel(1720), 'N1');
});

// ── 16. exerciseCap ───────────────────────────────────────────────────────────
test("exerciseCap: N5/N4 cap is 5", function (a) {
  a.equal(exerciseCap(1), 5);
  a.equal(exerciseCap(660), 5);
});

test("exerciseCap: N3 cap is 7", function (a) {
  a.equal(exerciseCap(661), 7);
  a.equal(exerciseCap(960), 7);
});

test("exerciseCap: N2/N1 cap is 9", function (a) {
  a.equal(exerciseCap(961), 9);
  a.equal(exerciseCap(1320), 9);
});

// ── 17. buildExercises (N2 types) ─────────────────────────────────────────────
test("buildExercises N2: synonym exercise generated for N2 vocab lesson", function (a) {
  var lesson = { day: 1050, type: 'vocab', chars: [],
    vocab: [
      ['契約', 'けいやく', 'contract'], ['利益', 'りえき', 'profit'], ['投資', 'とうし', 'investment'],
      ['経営', 'けいえい', 'management'], ['売上', 'うりあげ', 'sales']
    ] };
  var exs = buildExercises(lesson);
  var types = exs.map(function (e) { return e.type; });
  a.ok(types.indexOf('synonym') >= 0, 'synonym exercise generated for N2 vocab lesson');
});

test("buildExercises N2: kanji_reading exercise for N2 kanji lesson", function (a) {
  var lesson = { day: 1240, type: 'kanji', vocab: [],
    chars: [['裁', 'さい'], ['憲', 'けん'], ['権', 'けん'], ['議', 'ぎ'], ['税', 'ぜい']] };
  var exs = buildExercises(lesson);
  var types = exs.map(function (e) { return e.type; });
  a.ok(types.indexOf('kanji_reading') >= 0, 'kanji_reading exercise generated for N2 kanji lesson');
});

test("buildExercises N2: exercise cap respected (max 9)", function (a) {
  var lesson = curriculum[1000];
  var exs = buildExercises(lesson);
  a.ok(exs.length <= 9, 'N2 exercise count ' + exs.length + ' <= 9');
});

// ── 18. passage field validation ──────────────────────────────────────────────
test("passage: all reading-type days have text_jp and text_en", function (a) {
  var failures = [];
  curriculum.forEach(function (l) {
    if (l.type !== 'reading') return;
    if (!l.passage) {
      failures.push('day ' + l.day + ': type=reading but no passage');
      return;
    }
    if (!l.passage.text_jp || !l.passage.text_jp.trim())
      failures.push('day ' + l.day + ': passage.text_jp empty');
    if (!l.passage.text_en || !l.passage.text_en.trim())
      failures.push('day ' + l.day + ': passage.text_en empty');
  });
  a.equal(failures.length, 0, failures.join('\n'));
});

// ── 20. React render smoke test ───────────────────────────────────────────────
// Extracts the inline <script> from index.html, runs it in a stubbed browser
// environment, then calls each top-level component to verify no globals are
// missing and no ReferenceError would blank the page.
(function () {
  var html;
  try {
    html = fs.readFileSync(path.join(projectDir, "index.html"), "utf8");
  } catch (e) {
    test("React render: can read index.html", function (a) {
      a.ok(false, "Could not read index.html: " + e.message);
    });
    return;
  }

  // Extract the last <script> block (the inline app code, no src= attribute)
  var allScripts = html.match(/<script>[\s\S]*?<\/script>/g) || [];
  var appBlock = allScripts[allScripts.length - 1];
  if (!appBlock) {
    test("React render: inline script found in index.html", function (a) {
      a.ok(false, "No inline <script> block found");
    });
    return;
  }
  var appCode = appBlock.replace(/^<script>/, "").replace(/<\/script>$/, "");

  // Minimal browser-API stubs
  global.React = {
    createElement: function () { return {}; },
    useState: function (init) {
      var v = typeof init === "function" ? init() : init;
      return [v, function () {}];
    },
    useEffect: function () {},
    useRef:    function () { return { current: null }; },
  };
  global.ReactDOM = {
    createRoot: function () { return { render: function () {} }; },
  };
  global.localStorage = {
    getItem: function () { return null; },
    setItem: function () {},
  };
  global.document = { getElementById: function () { return {}; } };
  // window.speechSynthesis is already undefined from the top of this file

  // Run the script — this defines App, DayView, Overview, ReviewMode, etc.
  // as globals and calls ReactDOM.createRoot(...).render(...) via stubs.
  test("React render: index.html inline script executes without error", function (a) {
    try {
      vm.runInThisContext(appCode);
      a.ok(true, "Script executed without throwing");
    } catch (e) {
      a.ok(false, "Script threw: " + e.message);
    }
  });

  // Call each top-level component to verify all referenced globals exist.
  // With the React stub, createElement returns {} without recursing into
  // children, so only the function body of each component is exercised.
  var lesson0   = curriculum[0];
  var emptySet  = new Set();
  var noop      = function () {};

  test("React render: App() renders without throwing", function (a) {
    try { App(); a.ok(true); } catch (e) { a.ok(false, e.message); }
  });

  test("React render: DayView() renders without throwing", function (a) {
    try {
      DayView({
        lesson: lesson0, dayNum: 1,
        pColor: PHASE_COLORS[1], pBg: PHASE_BG[1],
        completed: emptySet, toggleDone: noop, setDay: noop,
      });
      a.ok(true);
    } catch (e) { a.ok(false, e.message); }
  });

  test("React render: Overview() renders without throwing", function (a) {
    try {
      Overview({ curriculum: curriculum, completed: emptySet, setDay: noop, currentDay: 1 });
      a.ok(true);
    } catch (e) { a.ok(false, e.message); }
  });

  test("React render: ReviewMode() renders without throwing", function (a) {
    try {
      ReviewMode({ cards: {}, dayNum: 1, onUpdate: noop });
      a.ok(true);
    } catch (e) { a.ok(false, e.message); }
  });
}());

// ── summary ───────────────────────────────────────────────────────────────────
var total = _pass + _fail;
if (_fail === 0) {
  console.log("Tests: " + _pass + "/" + total + " passed");
} else {
  console.log("\nTests: " + _pass + " passed, " + _fail + " FAILED out of " + total);
}
process.exit(_fail > 0 ? 1 : 0);
