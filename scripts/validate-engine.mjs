#!/usr/bin/env node
// Parity harness: compare the pure-JS buildReading() against the Python CLI
// (engine/cardology_cli.py --json) across many birthdates x target dates and
// deep-compare every field the app uses.
//
// Run:  bunx tsx scripts/validate-engine.mjs
// (tsx is needed because it imports the TypeScript lib/reading.ts.)

import { execFileSync } from "node:child_process";
import { buildReading } from "../lib/reading.ts";

const PYTHON = process.env.CARDOLOGY_PYTHON || "python3";
const CLI = process.env.CARDOLOGY_CLI || "/Users/clr/cardology-llm/engine/cardology_cli.py";

const BIRTHDATES = [
  "1940-01-01", "1942-07-04", "1945-12-31", "1948-02-29", "1950-06-15",
  "1953-03-21", "1955-11-07", "1957-09-09", "1960-05-20", "1962-10-23",
  "1964-08-31", "1966-04-12", "1968-12-25", "1970-02-14", "1972-02-29",
  "1974-07-22", "1976-01-19", "1978-06-06", "1980-10-31", "1982-03-08",
  "1984-11-22", "1986-05-13", "1988-09-30", "1990-12-21", "1991-02-17",
  "1993-08-08", "1995-04-01", "1996-02-29", "1998-07-15", "2000-01-01",
  "2001-10-10", "2003-06-18", "2005-12-31", "2007-03-03", "2009-09-23",
  "2010-02-28", "1959-11-11", "1947-04-30", "1969-08-15", "1985-05-22",
  "2004-02-29", "1943-10-23",
];

const TARGET_DATES = ["2026-06-03", "2026-12-25"];

// The fields/paths the app actually consumes. We deep-compare the whole reading,
// but report mismatches by path for clarity.
function flatten(obj, prefix, out) {
  if (obj === null || typeof obj !== "object") {
    out[prefix] = obj;
    return out;
  }
  if (Array.isArray(obj)) {
    obj.forEach((v, i) => flatten(v, `${prefix}[${i}]`, out));
    return out;
  }
  for (const k of Object.keys(obj)) {
    flatten(obj[k], prefix ? `${prefix}.${k}` : k, out);
  }
  return out;
}

function runPython(birthdate, target) {
  const out = execFileSync(
    PYTHON,
    [CLI, "--birthdate", birthdate, "--target-date", target, "--json"],
    { encoding: "utf8", maxBuffer: 1024 * 1024 * 8 },
  );
  return JSON.parse(out);
}

let totalFields = 0;
let matchedFields = 0;
let caseCount = 0;
let casePass = 0;
const mismatchSamples = [];

for (const bd of BIRTHDATES) {
  for (const td of TARGET_DATES) {
    caseCount++;
    let py;
    try {
      py = runPython(bd, td);
    } catch (e) {
      console.log(`[python error] ${bd} @ ${td}: ${e.message}`);
      continue;
    }
    const js = buildReading(bd, td);

    const fpy = flatten(py, "", {});
    const fjs = flatten(js, "", {});
    const keys = new Set([...Object.keys(fpy), ...Object.keys(fjs)]);

    let caseMismatch = 0;
    for (const key of keys) {
      totalFields++;
      const a = fpy[key];
      const b = fjs[key];
      if (a === b || (a == null && b == null)) {
        matchedFields++;
      } else {
        caseMismatch++;
        if (mismatchSamples.length < 60) {
          mismatchSamples.push({ case: `${bd}@${td}`, key, python: a, js: b });
        }
      }
    }
    if (caseMismatch === 0) casePass++;
    else console.log(`MISMATCH  ${bd} @ ${td}: ${caseMismatch} field(s)`);
  }
}

if (mismatchSamples.length) {
  console.log("\n--- mismatch detail (first 60) ---");
  for (const m of mismatchSamples) {
    console.log(`  ${m.case}  ${m.key}\n      python: ${JSON.stringify(m.python)}\n      js    : ${JSON.stringify(m.js)}`);
  }
}

console.log("\n=========================================");
console.log(`cases:  ${casePass}/${caseCount} passed`);
console.log(`fields: ${matchedFields}/${totalFields} matched`);
const ok = casePass === caseCount && matchedFields === totalFields;
console.log(ok ? "RESULT: PASS" : "RESULT: FAIL");
console.log("=========================================");
process.exit(ok ? 0 : 1);
