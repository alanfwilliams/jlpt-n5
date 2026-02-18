"use strict";

function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
function ownKeys(e, r) { var t = Object.keys(e); if (Object.getOwnPropertySymbols) { var o = Object.getOwnPropertySymbols(e); r && (o = o.filter(function (r) { return Object.getOwnPropertyDescriptor(e, r).enumerable; })), t.push.apply(t, o); } return t; }
function _objectSpread(e) { for (var r = 1; r < arguments.length; r++) { var t = null != arguments[r] ? arguments[r] : {}; r % 2 ? ownKeys(Object(t), !0).forEach(function (r) { _defineProperty(e, r, t[r]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function (r) { Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r)); }); } return e; }
function _defineProperty(e, r, t) { return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: !0, configurable: !0, writable: !0 }) : e[r] = t, e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
function _toConsumableArray(r) { return _arrayWithoutHoles(r) || _iterableToArray(r) || _unsupportedIterableToArray(r) || _nonIterableSpread(); }
function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _iterableToArray(r) { if ("undefined" != typeof Symbol && null != r[Symbol.iterator] || null != r["@@iterator"]) return Array.from(r); }
function _arrayWithoutHoles(r) { if (Array.isArray(r)) return _arrayLikeToArray(r); }
function _slicedToArray(r, e) { return _arrayWithHoles(r) || _iterableToArrayLimit(r, e) || _unsupportedIterableToArray(r, e) || _nonIterableRest(); }
function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _unsupportedIterableToArray(r, a) { if (r) { if ("string" == typeof r) return _arrayLikeToArray(r, a); var t = {}.toString.call(r).slice(8, -1); return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? _arrayLikeToArray(r, a) : void 0; } }
function _arrayLikeToArray(r, a) { (null == a || a > r.length) && (a = r.length); for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e]; return n; }
function _iterableToArrayLimit(r, l) { var t = null == r ? null : "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"]; if (null != t) { var e, n, i, u, a = [], f = !0, o = !1; try { if (i = (t = t.call(r)).next, 0 === l) { if (Object(t) !== t) return; f = !1; } else for (; !(f = (e = i.call(t)).done) && (a.push(e.value), a.length !== l); f = !0); } catch (r) { o = !0, n = r; } finally { try { if (!f && null != t["return"] && (u = t["return"](), Object(u) !== u)) return; } finally { if (o) throw n; } } return a; } }
function _arrayWithHoles(r) { if (Array.isArray(r)) return r; }
function hasKanji(str) { return /[\u4E00-\u9FFF\u3400-\u4DBF]/.test(str); }

// ── SRS (SM-2) ───────────────────────────────────────────────────────────────
function sm2Update(card, grade) {
  var _ref = card || {},
    _ref$interval = _ref.interval,
    interval = _ref$interval === void 0 ? 1 : _ref$interval,
    _ref$ef = _ref.ef,
    ef = _ref$ef === void 0 ? 2.5 : _ref$ef,
    _ref$reps = _ref.reps,
    reps = _ref$reps === void 0 ? 0 : _ref$reps;
  if (grade >= 3) {
    if (reps === 0) interval = 1;else if (reps === 1) interval = 6;else interval = Math.round(interval * ef);
    reps++;
    ef = Math.max(1.3, ef + 0.1 - (5 - grade) * (0.08 + (5 - grade) * 0.02));
  } else {
    reps = 0;
    interval = 1;
  }
  var due = Date.now() + interval * 24 * 60 * 60 * 1000;
  return {
    interval: interval,
    ef: ef,
    reps: reps,
    due: due
  };
}
function cardId(type, day, idx) {
  return "".concat(type, "_").concat(day, "_").concat(idx);
}
function addDayCards(srs, lesson) {
  var now = Date.now();
  (lesson.vocab || []).forEach(function (v, i) {
    var id = cardId('v', lesson.day, i);
    if (!srs[id]) srs[id] = {
      interval: 1,
      ef: 2.5,
      reps: 0,
      due: now
    };
  });
  (lesson.chars || []).forEach(function (c, i) {
    var id = cardId('c', lesson.day, i);
    if (!srs[id]) srs[id] = {
      interval: 1,
      ef: 2.5,
      reps: 0,
      due: now
    };
  });
  return srs;
}
function getDueCards(srs) {
  var now = Date.now();
  return Object.entries(srs).filter(function (_ref2) {
    var _ref3 = _slicedToArray(_ref2, 2),
      c = _ref3[1];
    return c.due <= now;
  }).map(function (_ref4) {
    var _ref5 = _slicedToArray(_ref4, 1),
      id = _ref5[0];
    return id;
  });
}
function cardToItem(id, srs) {
  var parts = id.split('_');
  var type = parts[0],
    day = parseInt(parts[1]),
    idx = parseInt(parts[2]);
  var lesson = curriculum[day - 1];
  if (!lesson) return null;
  if (type === 'v') {
    var v = (lesson.vocab || [])[idx];
    if (!v) return null;
    return {
      id: id,
      type: 'vocab',
      front: v[0],
      back: v[2],
      reading: v[1] !== v[0] ? v[1] : null,
      day: day
    };
  } else {
    var c = (lesson.chars || [])[idx];
    if (!c) return null;
    return {
      id: id,
      type: 'char',
      front: c[0],
      back: c[1],
      day: day
    };
  }
}

// ── Helpers ─────────────────────────────────────────────────────────────────
function rndShuffle(arr) {
  var a = _toConsumableArray(arr);
  for (var i = a.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var _ref7 = [a[j], a[i]];
    a[i] = _ref7[0];
    a[j] = _ref7[1];
  }
  return a;
}
function buildExercises(lesson) {
  var exs = [];
  var allVocab = curriculum.flatMap(function (d) {
    return d.vocab || [];
  });
  var allChars = curriculum.flatMap(function (d) {
    return d.chars || [];
  });

  // Listening exercise: hear a word, pick its meaning
  if (lesson.vocab && lesson.vocab.length >= 2 && window.speechSynthesis) {
    var vocab = rndShuffle(lesson.vocab);
    var v = vocab[0];
    var wrongM = rndShuffle(allVocab.filter(function (w) {
      return w[2] && w[2].trim() && w[2] !== v[2];
    })).slice(0, 3);
    var opts = rndShuffle([v[2]].concat(_toConsumableArray(wrongM.map(function (w) {
      return w[2];
    }))));
    exs.push({
      type: 'listen',
      prompt: 'Listen and choose the meaning:',
      question: v[0],
      audio: v[0],
      options: opts,
      correct: opts.indexOf(v[2])
    });
  }

  // ── Char exercises (hiragana/katakana/kanji days) ──
  if (lesson.chars && lesson.chars.length > 0) {
    var chars = rndShuffle(lesson.chars);

    // MC: character → romaji/reading
    var c0 = chars[0];
    var wrongs = rndShuffle(allChars.filter(function (c) {
      return c[1] && c[1].trim() && c[1] !== c0[1];
    })).slice(0, 3);
    var mcOpts = rndShuffle([c0[1]].concat(_toConsumableArray(wrongs.map(function (c) {
      return c[1];
    }))));
    exs.push({
      type: 'mc',
      prompt: 'What is the reading for this character?',
      question: c0[0],
      options: mcOpts,
      correct: mcOpts.indexOf(c0[1])
    });

    // Typing: character → reading
    if (chars.length > 1) {
      var c1 = chars[1];
      exs.push({
        type: 'typing',
        prompt: 'Type the reading for this character:',
        question: c1[0],
        answers: [c1[1]],
        placeholder: 'e.g. ' + c1[1]
      });
    }
  }

  // ── Vocab exercises ──
  if (lesson.vocab && lesson.vocab.length > 0) {
    var _vocab = rndShuffle(lesson.vocab);

    // MC: word → meaning
    var v0 = _vocab[0];
    var _wrongM = rndShuffle(allVocab.filter(function (w) {
      return w[2] && w[2].trim() && w[2] !== v0[2];
    })).slice(0, 3);
    var mcM = rndShuffle([v0[2]].concat(_toConsumableArray(_wrongM.map(function (w) {
      return w[2];
    }))));
    exs.push({
      type: 'mc',
      prompt: 'What does this word mean?',
      question: v0[0],
      options: mcM,
      correct: mcM.indexOf(v0[2])
    });

    // MC: meaning → word (pick the right Japanese)
    if (_vocab.length > 1) {
      var v1 = _vocab[1];
      var wrongW = rndShuffle(allVocab.filter(function (w) {
        return w[0] && w[0].trim() && w[0] !== v1[0];
      })).slice(0, 3);
      var mcW = rndShuffle([v1[0]].concat(_toConsumableArray(wrongW.map(function (w) {
        return w[0];
      }))));
      exs.push({
        type: 'mc',
        prompt: 'Which word means "' + v1[2] + '"?',
        question: '',
        options: mcW,
        correct: mcW.indexOf(v1[0])
      });
    }

    // Typing: word → English meaning
    if (_vocab.length > 2) {
      var v2 = _vocab[2];
      var answers = v2[2].split(/[\/,]/).map(function (s) {
        return s.trim();
      }).filter(Boolean);
      exs.push({
        type: 'typing',
        prompt: 'What does this word mean? (type in English)',
        question: v2[0],
        answers: answers,
        placeholder: 'English meaning...'
      });
    }
  }

  // Listening: hear a word, pick meaning
  if (lesson.vocab && lesson.vocab.length > 0) {
    var vL = rndShuffle(lesson.vocab)[0];
    var wrongL = rndShuffle(allVocab.filter(function (w) {
      return w[2] !== vL[2];
    })).slice(0, 3);
    var mcL = rndShuffle([vL[2]].concat(_toConsumableArray(wrongL.map(function (w) {
      return w[2];
    }))));
    exs.push({
      type: 'listen',
      prompt: 'Listen and choose the meaning:',
      question: vL[0],
      audio: vL[0],
      options: mcL,
      correct: mcL.indexOf(vL[2])
    });
  }
  return rndShuffle(exs).slice(0, 5);
}
function normAns(s) {
  return s.trim().toLowerCase().replace(/[!"#$%&'()*+,./:;<=>?@[\]^_`{|}~\\]/g, '').trim();
}
function checkTyping(userAns, answers) {
  var u = userAns.trim().toLowerCase();
  var uNorm = normAns(userAns);
  return answers.some(function (a) {
    var parts = a.split(/[\/,]/).map(function (s) {
      return s.trim().toLowerCase();
    });
    var partsNorm = a.split(/[\/,]/).map(function (s) {
      return normAns(s);
    });
    return a.trim().toLowerCase() === u || parts.includes(u) || partsNorm.includes(uNorm);
  });
}

// ── SRS: SM-2 ───────────────────────────────────────────────────────────────
var SRS_KEY = 'n5_srs';
function srsLoad() {
  try {
    return JSON.parse(localStorage.getItem(SRS_KEY)) || {};
  } catch (e) {
    return {};
  }
}
function srsSave(cards) {
  try {
    localStorage.setItem(SRS_KEY, JSON.stringify(cards));
  } catch (e) {}
}
function srsAddCards(dayLesson, cards) {
  var changed = false;
  var now = Date.now();
  (dayLesson.vocab || []).forEach(function (v, i) {
    var id = "v_".concat(dayLesson.day, "_").concat(i);
    if (!cards[id]) {
      cards[id] = {
        id: id,
        type: 'vocab',
        front: v[0],
        back: v[2],
        reading: v[1],
        interval: 1,
        ease: 2.5,
        due: now,
        reps: 0
      };
      changed = true;
    }
  });
  (dayLesson.chars || []).forEach(function (c, i) {
    var id = "c_".concat(dayLesson.day, "_").concat(i);
    if (!cards[id]) {
      cards[id] = {
        id: id,
        type: 'char',
        front: c[0],
        back: c[1],
        interval: 1,
        ease: 2.5,
        due: now,
        reps: 0
      };
      changed = true;
    }
  });
  return changed;
}
function srsReview(card, quality) {
  var q = [0, 3, 4, 5][quality];
  var interval = card.interval,
    ease = card.ease,
    reps = card.reps;
  if (q < 3) {
    reps = 0;
    interval = 1;
  } else {
    if (reps === 0) interval = 1;else if (reps === 1) interval = 6;else interval = Math.round(interval * ease);
    reps += 1;
  }
  ease = Math.max(1.3, ease + 0.1 - (5 - q) * (0.08 + (5 - q) * 0.02));
  var due = Date.now() + interval * 86400000;
  return _objectSpread(_objectSpread({}, card), {}, {
    interval: interval,
    ease: ease,
    reps: reps,
    due: due
  });
}
function srsDueCards(cards) {
  var now = Date.now();
  return Object.values(cards).filter(function (c) {
    return c.due <= now;
  });
}
