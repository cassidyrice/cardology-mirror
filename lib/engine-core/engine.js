/* Cardology engine — browser-side port of cli/cardology_engine.py.
 *
 * Source of truth: the Python engine at cli/. This file mirrors it line-for-line
 * for the calculation surface, and consumes data tables emitted by
 * scripts/dump_engine_data.py into public/engine_data.js.
 *
 * ESM-adapted: the math body below is byte-identical to the verified browser
 * source at /Users/clr/HomeBase/01_PROJECTS/cardology/public/engine.js. Only the
 * IIFE wrapper was replaced with ESM imports (top) and an export (bottom) so it
 * loads cleanly in Next.js (Node + Edge) without `vm` or browser globals.
 *
 * Math:
 *   Year N+1 = P applied to Year N. P has order exactly 90 on Year 0.
 *   See whitepaper at / for full derivation.
 */
import {
  P,
  YEAR_0,
  SOLAR_TO_CARD,
  PRC_DATA,
  RANK_WORDS,
  SUIT_WORDS,
  PLANET_WORDS,
  PLANET_NAMES,
  FIXED_CARDS,
  WEEKDAYS,
} from "./engine_data.js";

let cardology;
{
  "use strict";

  // ===========================================================================
  // Permutation primitives
  // ===========================================================================

  const TOTAL_CELLS = 52;
  const GRID_ROWS = 7;
  const GRID_COLS = 7;
  const GRID_CELLS = GRID_ROWS * GRID_COLS;

  function flattenSpread(spread) {
    const flat = [];
    for (const row of spread.grid) flat.push.apply(flat, row);
    flat.push.apply(flat, spread.crown);
    return flat;
  }

  function unflattenSpread(flat) {
    const grid = [];
    for (let r = 0; r < GRID_ROWS; r++) {
      grid.push(flat.slice(r * GRID_COLS, (r + 1) * GRID_COLS));
    }
    return { grid: grid, crown: flat.slice(GRID_CELLS, TOTAL_CELLS) };
  }

  function applyPermutation(flat) {
    const out = new Array(TOTAL_CELLS);
    for (let i = 0; i < TOTAL_CELLS; i++) out[i] = flat[P[i]];
    return out;
  }

  function generateSpreads(year0, count) {
    const spreads = [year0];
    let flat = flattenSpread(year0);
    for (let i = 1; i < count; i++) {
      flat = applyPermutation(flat);
      spreads.push(unflattenSpread(flat));
    }
    return spreads;
  }

  // 91 cached spreads (years 0..90 where spread 90 === spread 0)
  const SPREADS = {};
  (function () {
    const all = generateSpreads(YEAR_0, 91);
    for (let i = 0; i < 91; i++) SPREADS[String(i)] = all[i];
  })();

  function getSpread(index) {
    const k = ((index % 90) + 90) % 90; // JS modulo for negative integers
    return SPREADS[String(k)];
  }

  function cardsFrom(birthCard, spreadIndex, count) {
    return extractCards(birthCard, getSpread(spreadIndex), count || 7);
  }

  // ===========================================================================
  // Card notation helpers
  // ===========================================================================

  function getCardSuit(card) {
    if (!card) return null;
    if (card.indexOf("♥") !== -1) return "♥";
    if (card.indexOf("♣") !== -1) return "♣";
    if (card.indexOf("♦") !== -1) return "♦";
    if (card.indexOf("♠") !== -1) return "♠";
    return null;
  }

  function getCardRank(card) {
    if (!card) return null;
    const suit = getCardSuit(card);
    if (!suit) return null;
    return card.slice(0, card.length - suit.length);
  }

  function interpret(card, planet) {
    const rank = getCardRank(card);
    const suit = getCardSuit(card);
    const out = {
      card: card || null,
      rank: rank,
      rank_word: rank ? (RANK_WORDS[rank] || null) : null,
      suit: suit,
      suit_word: suit ? (SUIT_WORDS[suit] || null) : null,
    };
    if (planet != null) {
      out.planet = planet;
      out.planet_word = PLANET_WORDS[planet] || null;
    }
    return out;
  }

  // ===========================================================================
  // Date math
  // ===========================================================================

  function calculateSolarValue(month, day) {
    let sv = 55 - (2 * month + day);
    if (sv <= 0) sv += 52;
    return sv;
  }

  function getBirthCard(month, day) {
    const sv = calculateSolarValue(month, day);
    return [SOLAR_TO_CARD[String(sv)] || "Unknown", sv];
  }

  function getPlanetaryRulingCard(month, day) {
    const key = `${month}/${day}`;
    return PRC_DATA[key] || null;
  }

  function calculateAge(birthMonth, birthDay, birthYear, targetDate) {
    let birthdayThisYear;
    try {
      birthdayThisYear = new Date(targetDate.getFullYear(), birthMonth - 1, birthDay);
      if (birthdayThisYear.getMonth() !== birthMonth - 1) {
        // Feb 29 in non-leap target year
        birthdayThisYear = new Date(targetDate.getFullYear(), birthMonth - 1, birthDay - 1);
      }
    } catch (e) {
      birthdayThisYear = new Date(targetDate.getFullYear(), birthMonth - 1, birthDay - 1);
    }
    let age = targetDate >= birthdayThisYear
      ? targetDate.getFullYear() - birthYear
      : targetDate.getFullYear() - birthYear - 1;
    return age;
  }

  // ===========================================================================
  // Spread traversal
  // ===========================================================================

  function findCardInGrid(card, grid) {
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 7; c++) {
        if (grid[r][c] === card) return [r, c];
      }
    }
    return null;
  }

  function extractFromCrownStart(crownPos, crown, grid, count) {
    const collected = [];
    let ci = crownPos;
    let inCrown = true;
    let curRow, curCol;
    for (let step = 0; step < count; step++) {
      if (inCrown) {
        ci -= 1;
        if (ci < 0) {
          inCrown = false;
          curRow = 0; curCol = 6;
          collected.push(grid[curRow][curCol]);
          continue;
        }
        collected.push(crown[ci]);
      } else {
        curCol -= 1;
        if (curCol < 0) {
          curRow += 1;
          curCol = 6;
          if (curRow > 6) break;
        }
        collected.push(grid[curRow][curCol]);
      }
    }
    return collected;
  }

  function extractCards(card, spread, count) {
    count = count || 9;
    const grid = spread.grid;
    const crown = spread.crown;

    const pos = findCardInGrid(card, grid);
    if (pos === null) {
      for (let ci = 0; ci < crown.length; ci++) {
        if (crown[ci] === card) return extractFromCrownStart(ci, crown, grid, count);
      }
      return null;
    }

    let [curRow, curCol] = pos;
    const collected = [];
    let inCrown = false;
    let crownIndex = null;

    for (let step = 0; step < count; step++) {
      if (!inCrown) {
        curCol -= 1;
        if (curCol < 0) {
          curRow += 1;
          curCol = 6;
          if (curRow > 6) {
            inCrown = true;
            crownIndex = 2;
            collected.push(crown[crownIndex]);
            continue;
          }
        }
        collected.push(grid[curRow][curCol]);
      } else {
        crownIndex -= 1;
        if (crownIndex < 0) {
          inCrown = false;
          curRow = 0; curCol = 6;
          collected.push(grid[curRow][curCol]);
          continue;
        }
        collected.push(crown[crownIndex]);
      }
    }
    return collected;
  }

  // ===========================================================================
  // Active 52-day planetary period
  // ===========================================================================

  function getActivePeriod(birthMonth, birthDay, targetDate) {
    let lastBirthday;
    try {
      lastBirthday = new Date(targetDate.getFullYear(), birthMonth - 1, birthDay);
      if (lastBirthday > targetDate) {
        lastBirthday = new Date(targetDate.getFullYear() - 1, birthMonth - 1, birthDay);
      }
    } catch (e) {
      lastBirthday = new Date(targetDate.getFullYear() - 1, birthMonth - 1, birthDay - 1);
    }
    const daysSince = Math.floor((targetDate - lastBirthday) / (1000 * 60 * 60 * 24)) + 1;
    const ranges = [
      ["Mercury", 1, 52], ["Venus", 53, 104], ["Mars", 105, 156],
      ["Jupiter", 157, 208], ["Saturn", 209, 260], ["Uranus", 261, 312],
      ["Neptune", 313, 366],
    ];
    for (const [planet, start, end] of ranges) {
      if (daysSince >= start && daysSince <= end) {
        return [planet, PLANET_NAMES.indexOf(planet), daysSince];
      }
    }
    return ["Neptune", 6, daysSince];
  }

  // ===========================================================================
  // Environment / displacement (lifetime karma)
  // ===========================================================================

  function getEnvironmentDisplacement(card, spreadYear) {
    if (FIXED_CARDS.indexOf(card) !== -1) return null;
    const spirit = SPREADS["0"];
    const current = SPREADS[String(spreadYear)];
    if (!current) return null;

    function findPos(c, s) {
      for (let r = 0; r < 7; r++) {
        for (let col = 0; col < 7; col++) {
          if (s.grid[r][col] === c) return ["grid", r, col];
        }
      }
      for (let i = 0; i < s.crown.length; i++) {
        if (s.crown[i] === c) return ["crown", i];
      }
      return null;
    }

    function getAt(p, s) {
      if (p[0] === "grid") return s.grid[p[1]][p[2]];
      return s.crown[p[1]];
    }

    const spiritPos = findPos(card, spirit);
    if (!spiritPos) return null;
    const environment = getAt(spiritPos, current);

    const currentPos = findPos(card, current);
    if (!currentPos) return null;
    const displacement = getAt(currentPos, spirit);

    return { environment: environment, displacement: displacement };
  }

  // ===========================================================================
  // Fractal levels: septennial and weekly
  // ===========================================================================

  function getSeptennial(birthCard, age) {
    const cycle = Math.floor(age / 7);
    const position = age - cycle * 7;
    const spreadIndex = cycle + 1;
    const cards7 = cardsFrom(birthCard, spreadIndex, 7);
    if (!cards7) return null;
    const years = cards7.map((c, i) => Object.assign({}, interpret(c), {
      year_in_cycle: i + 1,
      age_at_start: cycle * 7 + i,
    }));
    return {
      cycle: cycle,
      spread_used: ((spreadIndex % 90) + 90) % 90,
      current_year_in_cycle: position + 1,
      current_card: cards7[position],
      current_meaning: interpret(cards7[position]),
      years: years,
    };
  }

  function getWeekly(birthCard, birthYear, birthMonth, birthDay, targetDate) {
    let birth = new Date(birthYear, birthMonth - 1, birthDay);
    if (birth.getMonth() !== birthMonth - 1) {
      birth = new Date(birthYear, birthMonth - 1, birthDay - 1);
    }
    const daysDiff = Math.floor((targetDate - birth) / (1000 * 60 * 60 * 24));
    const weeksLived = Math.floor(daysDiff / 7);
    const spreadIndex = weeksLived + 1;
    const cards7 = cardsFrom(birthCard, spreadIndex, 7);
    if (!cards7) return null;
    const days = cards7.map((c, i) => Object.assign({}, interpret(c), { weekday: WEEKDAYS[i] }));
    // JS Date.getDay() returns Sun=0..Sat=6; convert to Mon=0..Sun=6.
    const jsDay = targetDate.getDay();
    const todayIdx = (jsDay + 6) % 7;
    return {
      weeks_lived: weeksLived,
      spread_used: ((spreadIndex % 90) + 90) % 90,
      current_weekday: WEEKDAYS[todayIdx],
      current_card: cards7[todayIdx],
      current_meaning: Object.assign({}, interpret(cards7[todayIdx]), { weekday: WEEKDAYS[todayIdx] }),
      days: days,
    };
  }

  // ===========================================================================
  // Top-level blueprint
  // ===========================================================================

  function calculateBlueprint(birthMonth, birthDay, birthYear, targetDate) {
    if (!targetDate) targetDate = new Date();
    if (typeof targetDate === "string") targetDate = new Date(targetDate);

    const [bc, sv] = getBirthCard(birthMonth, birthDay);
    const prc = getPlanetaryRulingCard(birthMonth, birthDay);
    const prcPrimary = Array.isArray(prc) ? prc[0] : prc;
    const prcSecondary = (Array.isArray(prc) && prc.length > 1) ? prc[1] : null;

    const age = calculateAge(birthMonth, birthDay, birthYear, targetDate);
    const syNav = ((age % 90) + 90) % 90 + 1;
    const spreadNav = getSpread(syNav);

    const bc9 = extractCards(bc, spreadNav, 9);
    const prc9 = extractCards(prcPrimary, spreadNav, 9);

    const [apPlanet] = getActivePeriod(birthMonth, birthDay, targetDate);

    function buildPeriods(cards) {
      const periods = {};
      const n = Math.min(7, (cards || []).length);
      for (let i = 0; i < n; i++) {
        const planet = PLANET_NAMES[i];
        periods[planet] = interpret(cards[i], planet);
      }
      return periods;
    }

    const bcPeriodsDetailed = buildPeriods(bc9);
    const prcPeriodsDetailed = buildPeriods(prc9);
    const bcPeriods = {};
    const prcPeriods = {};
    for (const p of Object.keys(bcPeriodsDetailed)) bcPeriods[p] = bcPeriodsDetailed[p].card;
    for (const p of Object.keys(prcPeriodsDetailed)) prcPeriods[p] = prcPeriodsDetailed[p].card;

    return {
      archetype: {
        birth_card: bc,
        solar_value: sv,
        birth: interpret(bc),
        prc: prcPrimary,
        prc_secondary: prcSecondary,
        prc_meaning: interpret(prcPrimary),
      },
      timing: { age: age, sy_nav: syNav, crown: spreadNav.crown },
      birth_card_spread: {
        anchor: bc,
        periods: bcPeriods,
        periods_detailed: bcPeriodsDetailed,
        pluto: (bc9 && bc9.length > 7) ? bc9[7] : null,
        result: (bc9 && bc9.length > 8) ? bc9[8] : null,
      },
      prc_spread: {
        anchor: prcPrimary,
        periods: prcPeriods,
        periods_detailed: prcPeriodsDetailed,
        pluto: (prc9 && prc9.length > 7) ? prc9[7] : null,
        result: (prc9 && prc9.length > 8) ? prc9[8] : null,
      },
      active_period: {
        planet: apPlanet,
        planet_word: PLANET_WORDS[apPlanet] || null,
        bc: bcPeriods[apPlanet] ? interpret(bcPeriods[apPlanet], apPlanet) : null,
        prc: prcPeriods[apPlanet] ? interpret(prcPeriods[apPlanet], apPlanet) : null,
      },
      septennial: {
        bc: getSeptennial(bc, age),
        prc: getSeptennial(prcPrimary, age),
      },
      weekly: {
        bc: getWeekly(bc, birthYear, birthMonth, birthDay, targetDate),
        prc: getWeekly(prcPrimary, birthYear, birthMonth, birthDay, targetDate),
      },
      karma: { bc_lifetime: getEnvironmentDisplacement(bc, 1) },
    };
  }

  // ===========================================================================
  // Public API
  // ===========================================================================

  cardology = {
    // primitives
    P: P,
    SPREADS: SPREADS,
    getSpread: getSpread,
    cardsFrom: cardsFrom,
    // notation
    getCardSuit: getCardSuit,
    getCardRank: getCardRank,
    interpret: interpret,
    // calculation
    getBirthCard: getBirthCard,
    getPlanetaryRulingCard: getPlanetaryRulingCard,
    calculateAge: calculateAge,
    extractCards: extractCards,
    getActivePeriod: getActivePeriod,
    getEnvironmentDisplacement: getEnvironmentDisplacement,
    getSeptennial: getSeptennial,
    getWeekly: getWeekly,
    calculateBlueprint: calculateBlueprint,
    // data (read-only references)
    RANK_WORDS: RANK_WORDS,
    SUIT_WORDS: SUIT_WORDS,
    PLANET_WORDS: PLANET_WORDS,
    PLANET_NAMES: PLANET_NAMES,
    WEEKDAYS: WEEKDAYS,
  };
}

export { cardology };
export default cardology;
