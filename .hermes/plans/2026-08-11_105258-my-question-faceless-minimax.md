# My Question Faceless MiniMax Video Implementation Plan

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.

**Goal:** Replace the My Question talking-head proof and paid-deliverable description with a transparent faceless Editorial Card Atlas video system narrated exclusively by MiniMax Speech 2.8 HD through OpenRouter, then verify the local product experience without deploying.

**Architecture:** Build the sample in a separate deterministic HyperFrames project at `/Users/main/videos/my-question-faceless`, freeze all narration and media locally, and copy only reviewed web outputs into the clean Next.js worktree. Protect checkout with a new narration-readiness gate because MiniMax becomes a fulfillment dependency. Keep mechanics, interpretation, captions, and final delivery human-reviewed.

**Tech Stack:** OpenRouter `/api/v1/audio/speech`, `minimax/speech-2.8-hd`, Bun/TypeScript, HyperFrames 0.7.106, GSAP, SVG/CSS, ffmpeg/ffprobe, Next.js 15.1.6, Playwright, Cloudflare Pages conventions.

**Approved specification:** `docs/superpowers/specs/2026-08-11-my-question-faceless-video-design.md`

**Hard constraints:** No deployment. No Mistral or silent voice fallback. No talking-head media in the final proof. Never commit API keys. Do not mark proof, sample, captions, Blueprint sample, operations, D1, or narration ready without separate evidence. Keep checkout fail closed.

---

## Current context and assumptions

- Worktree: `/Users/main/cardology-myquestion`
- Branch: `feature/my-question-launch`
- Existing page: `app/myquestion/page.tsx`
- Existing internal public-preview assets: `public/media/my-question/creator-demo.*`
- Existing focused verification: `bun test scripts/my-question-*.test.ts scripts/elroy-widget.test.ts`, `bunx tsc --noEmit`, `bun run build`
- HyperFrames CLI currently available as `0.7.106`.
- Reference project: `/Users/main/videos/ai-cardology-faceless`
- Source script: `/Users/main/Documents/My Question - Sample Reading Script.md`
- Current spoken text: approximately 5,232 characters; estimated MiniMax cost `$0.52` per full generation at the current `$0.0001` per-character OpenRouter rate.
- Initial MiniMax stock voice candidate: `English_Graceful_Lady`. It must pass a single smoke request. If OpenRouter rejects the ID or the result is not warm and grounded, stop and resolve another current MiniMax stock voice; do not change models.
- OpenRouter currently shows MiniMax provider logging. Customer production must remain gated until processing terms, disclosure, and acceptable data minimization are confirmed.

---

### Task 1: Freeze the implementation baseline

**Objective:** Prove the existing worktree is understood and green before faceless-video changes.

**Files:**
- Read: `docs/superpowers/specs/2026-08-11-my-question-faceless-video-design.md`
- Read: `app/myquestion/page.tsx`
- Read: `app/myquestion/checkout/route.ts`
- Read: `.env.example`

**Step 1: Record the branch and dirty tree**

Run:

```bash
git status --short --branch
git log -3 --oneline --decorate
```

Expected: branch `feature/my-question-launch`; faceless design commit `1a19fee` at or behind `HEAD`; existing My Question implementation remains intentionally uncommitted.

**Step 2: Run focused tests**

```bash
bun test scripts/my-question-*.test.ts scripts/elroy-widget.test.ts
```

Expected: all focused tests pass.

**Step 3: Run compiler and build**

```bash
bunx tsc --noEmit
bun run build
```

Expected: both exit `0`.

**Step 4: Preserve evidence**

Write command outputs under:

`/Users/main/Library/Caches/hermes/my-question-faceless-qa-20260811/baseline/`

Do not commit baseline logs.

---

### Task 2: Add red tests for faceless public truth and narration readiness

**Objective:** Prevent human-recorded claims and prevent checkout from opening without narration readiness.

**Files:**
- Create: `scripts/my-question-faceless-truth.test.ts`
- Modify later: `app/myquestion/page.tsx`
- Modify later: `app/terms-of-service/page.tsx`
- Modify later: `app/privacy-policy/page.tsx`
- Modify later: `app/myquestion/checkout/route.ts`
- Modify later: `.env.example`

**Step 1: Write the failing truth test**

Use this structure:

```ts
import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";

const read = (path: string) =>
  readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

describe("My Question faceless truth", () => {
  const page = read("app/myquestion/page.tsx");
  const terms = read("app/terms-of-service/page.tsx");
  const privacy = read("app/privacy-policy/page.tsx");
  const checkout = read("app/myquestion/checkout/route.ts");
  const env = read(".env.example");

  test("discloses the actual faceless and synthetic format", () => {
    expect(page).toContain("Faceless sample reading");
    expect(page).toContain("AI-generated narration");
    expect(page).toContain("Mechanics verified");
    expect(page).toContain("Interpretation human-reviewed");
  });

  test("removes obsolete human-recorded proof claims", () => {
    const publicTruth = `${page}\n${terms}`;
    expect(publicTruth).not.toMatch(
      /human-recorded|personally recorded|created by a real person|creator demonstration|BIGVU/i,
    );
  });

  test("documents and enforces narration readiness", () => {
    expect(env).toContain("MY_QUESTION_NARRATION_READY=false");
    expect(page).toContain("MY_QUESTION_NARRATION_READY");
    expect(checkout).toContain("MY_QUESTION_NARRATION_READY");
    expect(privacy).toMatch(/OpenRouter/i);
    expect(privacy).toMatch(/MiniMax/i);
  });
});
```

**Step 2: Verify red state**

```bash
bun test scripts/my-question-faceless-truth.test.ts
```

Expected: FAIL because the page still claims human recording and the narration gate does not exist.

Do not edit production files yet.

---

### Task 3: Scaffold the isolated HyperFrames project

**Objective:** Create a reproducible composition workspace without changing the web application.

**Files:**
- Create directory: `/Users/main/videos/my-question-faceless/`
- Create: `BRIEF.md`
- Create: `SCRIPT.md`
- Create: `assets/vo.txt`
- Create: `assets/voice-config.json`
- Create: `scene-map.json`
- Create: `scripts/validate-script.mjs`
- Create: `scripts/validate-script.test.ts`

**Step 1: Scaffold**

Run from `/Users/main`:

```bash
npx hyperframes init "videos/my-question-faceless" \
  --non-interactive \
  --example=blank \
  --skill=general-video
```

Expected: a project containing `index.html`, `package.json`, `hyperframes.json`, and agent instructions.

**Step 2: Pin the CLI**

Set project scripts to `hyperframes@0.7.106` for `preview`, `check`, and `render`.

**Step 3: Write BRIEF.md**

Copy the approved intent, proof disclosure, visual tokens, no-face rule, MiniMax-only rule, 9:16 target, and no-deploy constraint from the design spec.

**Step 4: Write a failing script validator test**

Test that production narration:

- is below MiniMax's 10,000-character request limit;
- contains no `[ON CAMERA]` cues;
- contains no sentence claiming the AI voice personally used its own birthday;
- includes the reflection-not-prediction boundary;
- includes all verified cards and dates;
- includes the synthetic narration disclosure in `BRIEF.md`, not in spoken copy unless editorially desired.

**Step 5: Run red**

```bash
bun test scripts/validate-script.test.ts
```

Expected: FAIL before `assets/vo.txt` is complete.

**Step 6: Create the rewritten third-person script**

Rewrite only what is needed for synthetic-narrator honesty. Preserve verified mechanics, interpretation, practical exercise, and takeaway. Remove camera cues.

**Step 7: Run green and count cost**

```bash
bun test scripts/validate-script.test.ts
node scripts/validate-script.mjs --json
```

Expected: PASS and JSON containing character count, word count, estimated duration, and current MiniMax estimated cost.

**Step 8: Commit the isolated project**

If the scaffold creates its own git repository, commit there:

```bash
git add BRIEF.md SCRIPT.md assets/vo.txt assets/voice-config.json scene-map.json scripts package.json hyperframes.json
git commit -m "docs: define My Question faceless composition"
```

Do not add generated audio.

---

### Task 4: Implement and test the MiniMax-only OpenRouter client

**Objective:** Generate deterministic local audio while failing closed on configuration, HTTP, content-type, or empty-output errors.

**Files:**
- Create: `/Users/main/videos/my-question-faceless/scripts/openrouter-tts.mjs`
- Create: `/Users/main/videos/my-question-faceless/scripts/openrouter-tts.test.ts`
- Modify: `/Users/main/videos/my-question-faceless/package.json`
- Create: `/Users/main/videos/my-question-faceless/.gitignore`

**Step 1: Write failing tests with a mocked fetch**

Cover:

- missing `OPENROUTER_API_KEY`;
- hard-coded model is exactly `minimax/speech-2.8-hd`;
- request goes to `https://openrouter.ai/api/v1/audio/speech`;
- body contains `input`, `voice`, and `response_format: "mp3"`;
- non-2xx response fails without writing a file;
- non-audio or empty response fails without writing a file;
- successful response uses atomic temporary-file rename;
- no fallback model is accepted.

**Step 2: Verify red**

```bash
bun test scripts/openrouter-tts.test.ts
```

Expected: FAIL because the client does not exist.

**Step 3: Implement the minimal client**

Core request shape:

```js
const response = await fetch("https://openrouter.ai/api/v1/audio/speech", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
    "HTTP-Referer": "https://cardblueprints.com",
    "X-Title": "Card Blueprints My Question",
  },
  body: JSON.stringify({
    model: "minimax/speech-2.8-hd",
    input,
    voice,
    response_format: "mp3",
  }),
});
```

Require explicit `--input`, `--output`, and `--voice`. Never log the key or request authorization header.

**Step 4: Add scripts**

```json
{
  "voice:smoke": "node scripts/openrouter-tts.mjs --input assets/smoke.txt --output assets/vo-smoke.raw.mp3 --voice English_Graceful_Lady",
  "voice:full": "node scripts/openrouter-tts.mjs --input assets/vo.txt --output assets/vo-raw.mp3 --voice English_Graceful_Lady"
}
```

**Step 5: Run green**

```bash
bun test scripts/openrouter-tts.test.ts
```

Expected: all client tests pass without external API calls.

**Step 6: Ignore generated and secret-bearing files**

Ignore `.env*`, `assets/*.mp3`, `assets/*.wav`, `renders/`, `qa/`, and temporary response files.

**Step 7: Commit**

```bash
git add scripts/openrouter-tts.mjs scripts/openrouter-tts.test.ts package.json .gitignore
git commit -m "feat: add fail-closed MiniMax narration client"
```

---

### Task 5: Generate and verify the single MiniMax smoke sample

**Objective:** Confirm one MiniMax stock voice, pronunciation, and response integrity before the paid full request.

**Files:**
- Create: `assets/smoke.txt`
- Generate: `assets/vo-smoke.raw.mp3`
- Generate: `qa/voice-smoke.json`

**Step 1: Confirm secret without printing it**

```bash
test -n "$OPENROUTER_API_KEY"
```

Expected: exit `0`. If not, stop and configure the secret outside source control.

**Step 2: Use a representative passage**

The smoke text must include `Eight of Diamonds`, `Planetary Ruling Card`, `Queen of Spades`, `July 23 through September 12`, and one reflective sentence.

**Step 3: Generate once**

```bash
bun run voice:smoke
```

Expected: a non-empty MP3. No second model or provider call.

**Step 4: Inspect technically**

```bash
ffprobe -v error -show_entries format=duration,size:stream=codec_name,sample_rate,channels -of json assets/vo-smoke.raw.mp3
shasum -a 256 assets/vo-smoke.raw.mp3
```

**Step 5: Listen and decide**

Pass only if the voice is warm, grounded, feminine, intelligible, and not theatrical. If the exact MiniMax voice ID fails, resolve a different current MiniMax stock voice and repeat one smoke request. Never switch models.

**Step 6: Record selection**

Persist model, voice ID, request character count, timestamp, SHA-256, duration, and pass/fail in `qa/voice-smoke.json`. Do not record secrets.

---

### Task 6: Generate, normalize, and transcribe the full narration

**Objective:** Freeze one complete MiniMax narration suitable for deterministic animation.

**Files:**
- Generate: `assets/vo-raw.mp3`
- Generate: `assets/vo-final.wav`
- Generate: `assets/vo-final.mp3`
- Generate: `transcript.json`
- Generate: `assets/vo-final.en.vtt`
- Generate: `qa/audio.json`

**Step 1: Generate full narration once**

```bash
bun run voice:full
```

Expected: one complete MiniMax MP3 and cost close to the current character estimate.

**Step 2: Verify coverage before normalization**

Run `ffprobe`, decode with ffmpeg, and confirm duration is between 300 and 420 seconds. Reject truncated output.

**Step 3: Normalize in two passes**

Use ffmpeg `loudnorm` targeting:

- integrated loudness: `-16 LUFS`;
- true peak: `-1.5 dBTP`;
- LRA: `7`.

Preserve a 48 kHz master. Write measured and post-normalization values to `qa/audio.json`.

**Step 4: Transcribe word timings**

```bash
npx hyperframes transcribe assets/vo-final.mp3 -d . --json --model small.en -l en
```

If HyperFrames transcription fails, use the installed media-use transcription script; do not invent timings.

**Step 5: Build and human-correct VTT**

Create captions from word timings, then compare beginning-to-end against `assets/vo.txt`. Correct names, card ranks/suits, dates, punctuation, and cue boundaries.

**Step 6: Verify captions**

Add a deterministic script that rejects overlapping cues, invalid timestamps, empty cues, missing opening/closing words, and duration beyond the audio endpoint.

**Step 7: Commit text and config only**

Commit corrected script, transcript metadata if suitable, scene map, and validators. Keep raw/generated audio out of git unless the user explicitly approves asset versioning.

---

### Task 7: Build the Editorial Card Atlas composition foundation

**Objective:** Create the deterministic 9:16 visual system and timing skeleton.

**Files:**
- Modify: `/Users/main/videos/my-question-faceless/index.html`
- Create: `/Users/main/videos/my-question-faceless/compositions/components/card-atlas.css`
- Create: `/Users/main/videos/my-question-faceless/compositions/components/cards.js`
- Modify: `/Users/main/videos/my-question-faceless/scene-map.json`

**Step 1: Load implementation skills before editing**

Load `hyperframes`, `hyperframes-core`, `hyperframes-animation`, `hyperframes-keyframes`, `hyperframes-cli`, and `programmatic-faceless-vo` as routed by the HyperFrames skill. Do not improvise framework contracts.

**Step 2: Set deterministic composition bounds**

Use a 720×1280 root. Set root `data-duration` from the verified narration duration. Add one local `<audio>` element on a high track index.

**Step 3: Implement visual tokens**

Define:

- ivory paper;
- ink;
- oxblood;
- bronze;
- restrained texture;
- safe-area inset;
- serif display and readable sans body;
- caption-safe lower region.

Do not use remote photos or unseeded randomness.

**Step 4: Implement reusable SVG card renderer**

Support `8♦`, `5♣`, `Q♠`, `2♠`, and `2♦`. Ensure suit color, corner labels, pips, contrast, and scaling are deterministic.

**Step 5: Add all 15 scene containers**

Use IDs `scene-01` through `scene-15`. Every timed element must have `class="clip"`, `data-start`, `data-duration`, and `data-track-index`.

**Step 6: Register paused timelines**

Register every GSAP timeline in `window.__timelines`; no unbounded repeats, `Date.now`, or `Math.random`.

**Step 7: Run check**

```bash
npm run check
```

Expected: no errors. Review every warning before continuing.

**Step 8: Commit foundation**

```bash
git add index.html compositions scene-map.json
git commit -m "feat: establish Editorial Card Atlas composition"
```

---

### Task 8: Author scenes in three verified groups

**Objective:** Build the complete visual story without losing sync or introducing track overlap.

**Files:**
- Modify: `index.html`
- Modify: `scene-map.json`
- Create snapshots under: `qa/snapshots/`

**Step 1: Scenes 1–5**

Implement question/date, reflection boundary, 8♦, 5♣, and the traction-versus-escape tension.

Run:

```bash
npm run check
npx hyperframes@0.7.106 snapshot --at <five scene midpoints>
```

Inspect snapshots; fix contrast, clipping, and safe margins. Commit:

```bash
git commit -am "feat: animate My Question opening cards"
```

**Step 2: Scenes 6–10**

Implement Q♠ annual theme, transition, Jupiter timeline, repeated Twos, and 2♠.

Repeat check, midpoint snapshots, inspection, fixes, and commit:

```bash
git commit -am "feat: animate My Question timing sequence"
```

**Step 3: Scenes 11–15**

Implement 2♦ exchange, synthesis, seven-day exercise, takeaway, and final Card Blueprints frame.

Repeat check, midpoint snapshots, inspection, fixes, and commit:

```bash
git commit -am "feat: complete My Question faceless reading"
```

**Step 4: Timing audit**

Validate that narration-driven scenes cover the full audio duration, adjacent same-track scenes abut, and no unintended gaps or overlaps exist.

---

### Task 9: Render and forensically review the draft

**Objective:** Produce real draft evidence before any page integration.

**Files:**
- Generate: `renders/my-question-faceless-draft.mp4`
- Generate: `qa/contact-sheet.jpg`
- Generate: `qa/ffprobe.json`
- Generate: `qa/loudness.txt`
- Generate: `qa/visual-events.txt`
- Generate: `qa/review.md`

**Step 1: Final pre-render check**

```bash
npm run check
```

Expected: zero errors.

**Step 2: Render draft**

```bash
export PRODUCER_BROWSER_GPU_MODE=hardware
npx hyperframes@0.7.106 render . -q draft -o renders/my-question-faceless-draft.mp4
```

**Step 3: Collect objective media evidence**

Run:

- `ffprobe` for duration, dimensions, codecs, frame rate, sample rate, channels, and size;
- `loudnorm` or `ebur128` verification;
- `blackdetect`;
- `freezedetect` with `n=0.003:d=1.2`;
- chronological contact sheet;
- OCR scan for accidental UI or watermark text.

**Step 4: Review beginning to end**

Check narration sync, all card labels, caption timing, visual pacing, safe areas, and final-frame hold. Write only observed findings to `qa/review.md`.

**Step 5: Fix confirmed findings**

Make narrow fixes, rerun `npm run check`, rerender, and refresh evidence. Do not waive confirmed errors.

**Step 6: User review gate**

Open the local draft for user review. Do not integrate it into the product page until the user approves the visual and narration direction.

---

### Task 10: Produce final web assets and Desktop review package

**Objective:** Create optimized, attributable local deliverables without publication approval.

**Files:**
- Generate: `renders/my-question-faceless-review.mp4`
- Generate: `renders/my-question-faceless-web.mp4`
- Generate: `renders/my-question-faceless-poster.webp`
- Copy: `assets/vo-final.en.vtt`
- Copy review package to: `/Users/main/Desktop/hermes-outputs/my-question-faceless-20260811/`

**Step 1: Render the 720×1280 review master**

Use H.264 High profile, yuv420p, AAC, square pixels, and `+faststart`.

**Step 2: Produce web derivative**

```bash
ffmpeg -y -i renders/my-question-faceless-review.mp4 \
  -vf "scale=480:-2:flags=lanczos" \
  -c:v libx264 -preset slow -crf 27 -pix_fmt yuv420p \
  -c:a aac -b:a 96k -movflags +faststart \
  renders/my-question-faceless-web.mp4
```

Target below 18 MB when possible without illegible text.

**Step 3: Produce poster**

Extract an intentional Editorial Card Atlas frame, convert it to WebP, and verify exact dimensions.

**Step 4: Create review package**

Copy review master, web MP4, poster, corrected VTT, approved script, design spec, and QA report to the Desktop output folder. Label every file `INTERNAL REVIEW — NOT PUBLICATION APPROVED` in the manifest.

---

### Task 11: Update page, legal truth, privacy, and checkout gate using TDD

**Objective:** Make the public description match the actual faceless deliverable and block payment until narration operations are ready.

**Files:**
- Modify: `app/myquestion/page.tsx`
- Modify: `app/myquestion/checkout/route.ts`
- Modify: `app/terms-of-service/page.tsx`
- Modify: `app/privacy-policy/page.tsx`
- Modify: `.env.example`
- Test: `scripts/my-question-faceless-truth.test.ts`

**Step 1: Confirm red test still fails**

```bash
bun test scripts/my-question-faceless-truth.test.ts
```

**Step 2: Update `.env.example`**

Add:

```dotenv
# True only after MiniMax access, privacy handling, and fulfillment procedure are verified.
MY_QUESTION_NARRATION_READY=false
```

Never add `OPENROUTER_API_KEY` to the deploy application unless runtime generation is deliberately designed later; current generation is an offline fulfillment operation.

**Step 3: Add fail-closed gate**

Require `MY_QUESTION_NARRATION_READY` in both:

- page-level `checkoutOpen`;
- checkout route `checkoutEnabled` composition.

Add or extend service/route tests so absence and false values return checkout unavailable and create no Stripe session.

**Step 4: Update page truth**

Change metadata, schema, hero, CTA, video aria-label, figcaption, proof strip, order heading, and FAQ where needed. Required disclosure:

`Faceless sample reading · AI-generated narration · Mechanics verified · Interpretation human-reviewed`

Remove `human-recorded`, `personally recorded`, `created by a real person`, `creator demonstration`, and BIGVU-specific publication notes.

**Step 5: Update product terms**

Describe the paid product as a personalized, human-reviewed, faceless 5–7 minute private video with AI-generated narration. Do not imply fully automated interpretation.

**Step 6: Update privacy disclosure**

Document that approved narration text may be processed by OpenRouter and MiniMax solely to synthesize audio. State the actual data-minimization policy and provider logging/retention only after verifying current terms. Do not promise zero retention without evidence.

For paid scripts, omit customer name, raw birthdate, email, and unrelated third-party details from TTS input. Avoid repeating the exact question when a faithful non-identifying paraphrase works. If provider processing terms are not acceptable, keep `MY_QUESTION_NARRATION_READY=false` and block launch.

**Step 7: Run green tests**

```bash
bun test scripts/my-question-faceless-truth.test.ts
bun test scripts/my-question-*.test.ts scripts/elroy-widget.test.ts
```

Expected: all pass.

**Step 8: Commit source changes only**

```bash
git add .env.example app/myquestion/page.tsx app/myquestion/checkout/route.ts \
  app/terms-of-service/page.tsx app/privacy-policy/page.tsx \
  scripts/my-question-faceless-truth.test.ts
git commit -m "feat: describe faceless My Question delivery"
```

---

### Task 12: Integrate only the approved local media

**Objective:** Replace the local proof asset without implying publication approval.

**Files:**
- Add: `public/media/my-question/faceless-sample.mp4`
- Add: `public/media/my-question/faceless-sample-poster.webp`
- Add: `public/media/my-question/faceless-sample.en.vtt`
- Remove locally: `public/media/my-question/creator-demo.mp4`
- Remove locally: `public/media/my-question/creator-demo-poster.webp`
- Remove locally: `public/media/my-question/creator-demo.en.vtt`
- Modify: `app/myquestion/page.tsx`

**Step 1: Copy reviewed assets**

Copy from the final HyperFrames render package. Verify SHA-256, dimensions, duration, and size after copy.

**Step 2: Update video sources**

Point `<video>`, poster, caption track, Open Graph image, alt text, and aria-label to the faceless filenames.

**Step 3: Keep approval gates false**

Local media presence does not authorize `MY_QUESTION_SAMPLE_APPROVED=true` or `MY_QUESTION_CAPTIONS_APPROVED=true`.

**Step 4: Verify page build**

```bash
bunx tsc --noEmit
bun run build
```

Expected: exit `0`.

**Step 5: Commit only after explicit media approval**

Do not commit binary public assets until the user approves the final media and rights/disclosure package.

---

### Task 13: Validate local browser, accessibility, performance, and fail-closed commerce paths

**Objective:** Prove the integrated local experience works on desktop and mobile without creating a real payment.

**Files:**
- Create or modify: `scripts/my-question-browser.test.ts`
- Generate evidence: `/Users/main/Library/Caches/hermes/my-question-faceless-qa-20260811/browser/`

**Step 1: Start production-like local server**

Build and run on an unused local port with all launch gates false.

**Step 2: Desktop and mobile checks**

Test at minimum:

- 1440×900;
- 390×844;
- 360×800.

Verify no overflow, readable disclosure, visible native controls, correct poster, playable MP4, accessible captions, and no layout shift from media dimensions.

**Step 3: Keyboard and accessibility checks**

Verify skip link, headings, focus order, video control access, caption availability, color contrast, reduced-motion behavior, and no critical axe violations.

**Step 4: Fail-closed checkout checks**

With `MY_QUESTION_NARRATION_READY=false`, verify:

- order form communicates unavailable state;
- checkout endpoint returns 503;
- no Stripe session is created;
- no D1 order is created.

With a fully fake local test harness only, verify that all gates must be true before checkout preparation can proceed. Do not call live Stripe.

**Step 5: Performance checks**

Measure page load with video preload `metadata` or weaker. Confirm the full MP4 is not eagerly downloaded beyond expected metadata behavior and record page/video transfer sizes.

**Step 6: Capture evidence**

Save screenshots, browser test output, accessibility output, and performance summary.

---

### Task 14: Run independent adversarial review and repair confirmed findings

**Objective:** Challenge truthfulness, privacy, accessibility, media integrity, and commerce safety before delivery.

**Files:**
- Generate: `docs/reviews/2026-08-11-my-question-faceless-adversarial-review.md`
- Modify only files implicated by confirmed findings.

**Step 1: Dispatch independent reviewers**

Use separate review seats for:

- product/spec compliance and synthetic-media truth;
- visual/video forensics and captions;
- privacy/security/commerce fail-closed behavior.

Give reviewers the approved spec, plan, relevant source paths, local URL, and evidence. Require concrete file/line/frame evidence.

**Step 2: Triage findings**

Classify each as confirmed, unconfirmed, duplicate, or accepted tradeoff. Never fix speculative claims without reproducing them.

**Step 3: Fix confirmed issues**

Use TDD for code defects and regenerate only affected media stages for media defects.

**Step 4: Re-review**

The independent reviewer must verify each confirmed fix. Unresolved critical or high findings block delivery and keep gates false.

---

### Task 15: Run final verification and deliver local preview without deployment

**Objective:** Deliver a working local artifact and evidence package while explicitly preserving launch blocks.

**Files:**
- Final evidence: `/Users/main/Library/Caches/hermes/my-question-faceless-qa-20260811/final/`
- Desktop package: `/Users/main/Desktop/hermes-outputs/my-question-faceless-20260811/`

**Step 1: Run complete source verification**

```bash
bun test scripts/my-question-*.test.ts scripts/elroy-widget.test.ts
bunx tsc --noEmit
bun run build
```

Expected: zero failures.

**Step 2: Run media verification**

Re-run ffprobe, loudness, black/freeze detection, caption validation, contact-sheet inspection, final-frame check, and file-size check against the exact integrated bytes.

**Step 3: Run browser verification**

Re-run desktop/mobile/keyboard/accessibility/performance/fail-closed commerce checks against the final local server.

**Step 4: Copy final deliverables**

Ensure the Desktop output folder contains:

- review MP4;
- web MP4;
- poster;
- corrected VTT;
- approved script;
- design spec;
- implementation plan;
- QA report;
- browser and adversarial evidence summary.

**Step 5: Open the verified preview**

Open `/myquestion` in the Hermes preview pane and provide the local URL.

**Step 6: Report exact launch blockers**

State that nothing was deployed and list all still-false gates. Do not claim production readiness until Stripe, D1, notifications, operations runner, Blueprint sample, MiniMax privacy/operations, proof, sample, and captions have separate evidence and approval.

---

## Files likely to change

### Cardology worktree

- `.env.example`
- `app/myquestion/page.tsx`
- `app/myquestion/checkout/route.ts`
- `app/terms-of-service/page.tsx`
- `app/privacy-policy/page.tsx`
- `scripts/my-question-faceless-truth.test.ts`
- `scripts/my-question-browser.test.ts`
- `public/media/my-question/faceless-sample.mp4`
- `public/media/my-question/faceless-sample-poster.webp`
- `public/media/my-question/faceless-sample.en.vtt`

### HyperFrames project

- `/Users/main/videos/my-question-faceless/BRIEF.md`
- `/Users/main/videos/my-question-faceless/SCRIPT.md`
- `/Users/main/videos/my-question-faceless/index.html`
- `/Users/main/videos/my-question-faceless/scene-map.json`
- `/Users/main/videos/my-question-faceless/assets/vo.txt`
- `/Users/main/videos/my-question-faceless/assets/voice-config.json`
- `/Users/main/videos/my-question-faceless/scripts/openrouter-tts.mjs`
- `/Users/main/videos/my-question-faceless/scripts/openrouter-tts.test.ts`
- `/Users/main/videos/my-question-faceless/scripts/validate-script.mjs`
- `/Users/main/videos/my-question-faceless/scripts/validate-script.test.ts`
- `/Users/main/videos/my-question-faceless/compositions/components/card-atlas.css`
- `/Users/main/videos/my-question-faceless/compositions/components/cards.js`
- generated `assets/`, `renders/`, and `qa/` files

---

## Risks and tradeoffs

1. **Provider logging and personal data:** OpenRouter currently identifies the MiniMax provider as logging. Do not accept paid work until the processing terms and privacy disclosure are acceptable. Minimize TTS input and keep narration readiness false otherwise.
2. **Proof fidelity:** A faceless sample must match paid delivery. Mixing faceless proof with a human-recorded paid promise is prohibited.
3. **Synthetic trust:** The disclosure must be readable near the video, not hidden only in legal pages.
4. **Voice quality:** MiniMax remains the only model, but the stock voice ID may need adjustment within MiniMax after one smoke test.
5. **Long narration drift:** A 5–7 minute TTS response may mispronounce card labels or truncate. Validate complete text coverage before animation.
6. **Video weight:** Long 9:16 motion graphics can exceed web budgets. Optimize a derivative, never the review master, and preserve text legibility.
7. **Caption burden:** Machine timing is only a starting point. Human correction remains mandatory.
8. **Dirty worktree:** Existing My Question source is intentionally uncommitted. Stage exact files only; never use broad `git add .`.
9. **No deployment:** Do not run `pages:deploy`, Wrangler deploy, Stripe provisioning, D1 migration, secret mutation, or promotional automation.

---

## Completion definition

This plan is complete only when the final local page uses the approved faceless MiniMax video, all source/media/browser/adversarial checks pass, the Desktop review package exists, checkout remains fail closed, and no deployment has occurred.
