# My Question faceless video design

**Date:** 2026-08-11  
**Status:** Approved design; implementation not started  
**Product route:** `/myquestion`  
**Visual direction:** Editorial Card Atlas  
**Voice provider:** OpenRouter  
**Voice model:** `minimax/speech-2.8-hd`

## Relationship to the launch specification

This document amends `2026-08-10-my-question-launch-design.md` only where that document requires a human-recorded or on-camera video. The approved My Question offer, price, checkout order, onboarding rules, D1 capacity, fulfillment review, delivery, privacy, legal boundaries, and launch gates remain unchanged.

The sample and paid reading format now use a faceless editorial video with MiniMax narration. Human review remains mandatory. The system must never describe synthetic narration as the creator speaking or as customer testimony.

## Objective

Replace the talking-head sample with an honest, premium faceless demonstration that accurately previews the visual and audio style of a paid My Question reading.

The video must:

- preserve the verified card mechanics and practical interpretation;
- use no face or talking-head footage;
- use a warm, grounded feminine MiniMax voice through OpenRouter;
- disclose synthetic narration clearly;
- use only deterministic, locally frozen visual assets;
- remain legible and engaging for a full 5–7 minute reading;
- be reviewed by a human before it can satisfy any sample or caption launch gate.

## Proof contract

The public proof label is:

> Faceless sample reading · AI-generated narration · Mechanics verified · Interpretation human-reviewed

The page must not claim that visitors are watching the creator read her own cards. It must call the asset a faceless sample reading or faceless demonstration.

The sample uses the creator case dated February 17, 1991 and the question:

> Why has this year been so hard? Is there anything I should be aware of?

This is a creator-case demonstration, not a customer result or testimonial. The page must not infer publication rights, outcomes, or customer endorsement from the original attached recording.

The original talking-head recording and all review derivatives remain internal. They are not publication assets and must not be copied into a deployed public bundle.

## Deliverable contract

A paid My Question video follows the same faceless format as the sample:

- 5–7 minutes;
- one focused customer question;
- personalized card mechanics and human-reviewed interpretation;
- MiniMax synthetic narration;
- Editorial Card Atlas motion graphics;
- verified captions;
- intentional Card Blueprints opening and final frame;
- private delivery through the existing fulfillment flow.

Human review remains required for the mechanics, interpretation, script, narration render, captions, visual timing, and final video. AI narration does not automate or replace interpretive review.

## Narration design

### Provider and model

Use only OpenRouter's text-to-speech endpoint with:

- model: `minimax/speech-2.8-hd`;
- one stock MiniMax voice ID selected for a warm, grounded feminine delivery;
- MP3 or PCM response frozen immediately into the local project;
- no fallback to Mistral, another OpenRouter model, a local voice, or the source recording.

The production request stops if OpenRouter, MiniMax, authentication, billing, output decoding, or file verification fails. A provider failure must not silently change the voice.

### Direction

The voice is:

- warm and grounded;
- feminine;
- reflective and natural;
- self-aware rather than mystical;
- measured rather than theatrical;
- informative rather than promotional.

Target pace is approximately 135–140 spoken words per minute. The final normalized voice target is `-16 LUFS` integrated loudness with true peak no higher than `-1.5 dBTP`.

### Script honesty

Rewrite first-person phrases that would make a synthetic voice sound as if it personally lived the experience. The opening should use a case-study frame such as:

> This demonstration uses February 17, 1991 and asks a question that has been very real for the creator: Why has this year been so hard? Is there anything I should be aware of?

The mechanics, reflection boundary, interpretive explanation, seven-day exercise, and takeaway remain intact. The narration must not add guaranteed predictions, deterministic outcomes, medical, legal, financial, crisis, mental-health, or mind-reading claims.

### Cost control

OpenRouter bills TTS per input character. At the current script length of 5,232 spoken characters and OpenRouter's current MiniMax rate of `$0.0001` per character, one full voice generation is approximately `$0.52`. One complete retry brings the expected maximum to approximately `$1.05` before future provider price changes.

Use one short MiniMax smoke sample only to verify the chosen voice ID, pronunciation, pacing, and API output. Do not generate a Mistral comparison. Generate the full narration only after the smoke sample passes technical review.

## Visual direction: Editorial Card Atlas

Use a 9:16, serif-led Card Blueprints visual system:

- ivory and warm paper fields;
- ink typography;
- oxblood annotations;
- restrained bronze accents;
- precise playing-card geometry;
- tactile paper texture;
- thin rules and editorial labels;
- controlled kinetic type;
- no photography, faces, generic stock footage, SaaS gradients, fake dashboards, or decorative AI chrome.

Visuals must be deterministic and locally renderable. Prefer SVG, CSS, and seek-safe animation. Do not rely on remote images, unseeded randomness, real-time clocks, or generated footage.

## Scene structure

The complete reading uses approximately 12–15 contiguous scenes aligned to narration beats:

1. One-question opening and the sample date resolving onto paper.
2. Reflection boundary: structured map, not a prediction.
3. Eight of Diamonds: value, responsibility, effort, and control.
4. Five of Clubs: adaptation, options, and reopening decisions.
5. Combined tension: traction versus escape.
6. Queen of Spades annual theme: stewardship and changing responsibility.
7. Transition between the old work pattern and the next one.
8. Jupiter period timeline: July 23 through September 12.
9. Repeated Twos: choice, polarity, partnership, and balance.
10. Two of Spades: work and transformation.
11. Two of Diamonds: value, exchange, and fair contribution.
12. Synthesis: force is not the same as progress.
13. Seven-day exercise: two options, real costs, one reversible step.
14. Takeaway: choose what deserves to be carried.
15. Card Blueprints final frame with a soft product context and no hard sell.

Scenes on the same visual track must abut without unintended overlap. The opening and closing should feel related, but this is not required to be a seamless loop.

## Composition and output architecture

The production flow is:

`approved script → MiniMax smoke sample → frozen full VO → word-timed transcript → Editorial Card Atlas composition → draft render → review fixes → final render → web derivative → local page integration`

Create a separate HyperFrames project for the composition. Keep narration, transcript, scene map, source copy, render settings, and final QA evidence inside that project.

Required outputs are:

- 720×1280 H.264/AAC review master;
- smaller H.264/AAC fast-start web MP4;
- WebP poster frame;
- human-corrected WebVTT captions;
- approved script;
- scene map;
- render and QA report.

The web derivative should stay below 18 MB when practical without making typography or card details illegible.

## Landing-page integration

After the faceless draft passes review:

- replace the local talking-head source with the faceless web derivative;
- replace the poster with an Editorial Card Atlas frame;
- attach the corrected VTT track;
- update creator-demonstration wording to the approved faceless proof label;
- keep native video controls and caption access;
- preserve mobile aspect ratio and prevent layout shift;
- avoid eager downloading of the full video before visitor intent where feasible.

No media is deployment-approved merely because it appears in a local preview.

The following launch gates remain separate and fail closed:

- `MY_QUESTION_PROOF_APPROVED`;
- `MY_QUESTION_SAMPLE_APPROVED`;
- `MY_QUESTION_CAPTIONS_APPROVED`;
- `MY_QUESTION_BLUEPRINT_SAMPLE_APPROVED`;
- `MY_QUESTION_OPS_READY`;
- all existing commerce, D1, signing, notification, and product configuration gates.

## Failure behavior

- Missing OpenRouter credentials or MiniMax availability: no narration is generated.
- Invalid or empty audio response: discard the response and stop.
- Narration mismatch or mispronunciation: do not animate against it; correct and regenerate deliberately.
- Caption mismatch: sample approval stays false.
- Render, codec, playback, or accessibility failure: do not replace the current local proof asset.
- Human-review rejection: preserve the draft as an internal artifact and keep public proof gates closed.
- Any publication-rights uncertainty: do not deploy the affected source or derivative.

## Verification plan

Before local approval, verify:

1. Script mechanics against the deterministic Card Blueprints engine.
2. Synthetic disclosure and non-testimonial wording.
3. Voice identity, pronunciation, pacing, and complete-script coverage.
4. Integrated loudness, true peak, channel layout, sample rate, and clipping.
5. Word-timed transcript and human-corrected captions.
6. Early, middle, and late frames plus a chronological contact sheet.
7. Black frames, frozen intervals, blank holds, accidental overlap, and final-frame duration.
8. 9:16 dimensions, square pixels, codec compatibility, fast-start metadata, and file size.
9. Mobile and desktop playback, keyboard controls, caption access, focus behavior, overflow, and layout shift.
10. Page copy, proof gates, and checkout fail-closed behavior.
11. Independent adversarial review followed by fixes and re-review.

No deployment occurs during this work.

## Acceptance criteria

The design is complete when a reviewer can confirm all of the following:

- the sample and paid format are faceless;
- MiniMax is the only narration model;
- the narration never impersonates the creator;
- the mechanics and interpretation are complete and human-reviewed;
- the visual treatment matches Editorial Card Atlas;
- captions are accurate and accessible;
- the video has no face, talking-head footage, BIGVU mark, or unapproved source media;
- the local product page labels synthetic narration transparently;
- checkout remains fail closed until every required proof and operations gate is approved;
- the final local preview and evidence are delivered without deployment.
