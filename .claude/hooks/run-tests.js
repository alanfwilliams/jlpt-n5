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
  a.equal(cardToItem("v_999_0", {}), null);
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
test("curriculum: exactly 365 lessons", function (a) { a.equal(curriculum.length, 365); });

test("curriculum: sequential day numbers 1–365", function (a) {
  var failures = [];
  curriculum.forEach(function (l, i) { if (l.day !== i + 1) failures.push("idx" + i + "→day" + l.day); });
  a.equal(failures.length, 0, failures.join("; "));
});

test("curriculum: no duplicate day numbers", function (a) {
  a.equal(new Set(curriculum.map(function (l) { return l.day; })).size, 365);
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
  var valid = new Set(["script","lesson","grammar","kanji","review","numbers","particles","verbs"]);
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

test("curriculum: phaseNum is 1–8 on every lesson", function (a) {
  var failures = [];
  curriculum.forEach(function (l) {
    if (typeof l.phaseNum !== "number" || l.phaseNum < 1 || l.phaseNum > 8)
      failures.push("day " + l.day + " phaseNum=" + l.phaseNum);
  });
  a.equal(failures.length, 0, failures.join("\n"));
});

test("curriculum: week is 1–52 on every lesson", function (a) {
  var failures = [];
  curriculum.forEach(function (l) {
    if (typeof l.week !== "number" || l.week < 1 || l.week > 52)
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

test("curriculum: day 365 is the final lesson", function (a) {
  a.equal(curriculum[364].day, 365);
});

// ── summary ───────────────────────────────────────────────────────────────────
var total = _pass + _fail;
if (_fail === 0) {
  console.log("Tests: " + _pass + "/" + total + " passed");
} else {
  console.log("\nTests: " + _pass + " passed, " + _fail + " FAILED out of " + total);
}
process.exit(_fail > 0 ? 1 : 0);
