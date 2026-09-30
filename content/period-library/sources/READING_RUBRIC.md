# Reading rubric (draft 1)

What `lint_reading.py` cannot check. The linter is the gate: banned words, dashes,
length, markdown, "you will". A reading that fails lint is invalid and never reaches
this rubric.

This file is the question set for Jev. Booleans are gates inside the score. Scored
dimensions are where a reading can be a 6 or a 9.

## Booleans (each false costs the whole band)

B1. answers_their_question
    The reading is about the question asked, not about the cards in general.
    The reader's own words appear in the opening.

B2. shape_in_order
    Open, your card, this year's focus, what the year is asking, the two filters,
    putting it on the question, keep an eye out for, closing line.

B3. cards_named_properly
    Every card appears as number and suit with its meaning given the first time.
    No "a court card in your spread".

B4. no_verdict
    If the question is yes or no, the reading does not answer yes or no.
    It shows which yes and which no the cards describe.

B5. no_prohibited_content
    No health, legal, or financial advice. No predicted death, pregnancy, breakup.

## Scored dimensions (0-4 each)

S1. clean_mirror
    0: shadow reads as a character defect, or there is a dunk or a diagnosis.
    2: behavior is named but the cost is vague or missing.
    4: every shadow is an observable behavior with a specific price attached.

S2. their_idea
    0: states the conclusion outright.
    2: gestures at the conclusion, then explains it anyway.
    4: describes the pattern so precisely the reader gets there first, stops one
       sentence early, and asks the question with one obvious answer.

S3. concrete_signals
    0: the watch list is mood ("a moment of ease", "a shift in energy").
    2: signals are events but not checkable ("a conversation about money").
    4: three signals a person could tick off ("someone asks you to cover a shift
       you did not sign up for"), each tied to a named card.

S4. evidence_not_assertion
    0: claims about the person with no card behind them.
    2: cards are named but the reasoning does not connect them to the question.
    4: the fork is reasoned out loud with the cards as visible evidence.

S5. plain_and_close
    0: textbook or mystic register, long sentences, reads generic.
    2: plain but flat, could be about anyone with that birth card.
    4: seventh-grade plain, short sentences, and specific enough that only this
       person with this question would recognize it.

S6. ending_earned
    0: trails off, or the closing line is longer than a screenshot.
    2: ends cleanly but the last line is forgettable.
    4: short enough to screenshot, and it lands because the reading built to it.

## Score

Any boolean false: score = 0. The attempt is not a candidate.
Otherwise: score = sum(S1..S6), range 0 to 24.

Report per-dimension scores, never just the total. The total is for Dream-RSI.
The breakdown is how you find out which voice change did what.

## Open questions for Cass

- Is S2 (their_idea) worth double weight? It is the thing the voice doc argues
  hardest for, and right now it counts the same as the watch list.
- Should S5 split into "plain" and "specific to this person"? They fail for
  different reasons and the fix is different.
- B4 may be too strict for questions that are not really yes or no.
