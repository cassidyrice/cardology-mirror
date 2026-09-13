// Reviewed copy library for the 52xSeven Blueprint (retired from sale 2026-09-13; still rendered for past buyers).
// One light line, one shadow read, and one dare per card. Planet lines frame
// how a 52-day chapter colors the card. Deterministic — no per-visit generation.
// Tone: direct, a little spicy, shadow-first. Never predictive.

export interface CardCopy {
  /** What the card is like when it's clean. One sentence. */
  light: string;
  /** The shadow read. Blunt. One or two sentences. */
  shadow: string;
  /** One small dare for the chapter. */
  dare: string;
}

export interface PlanetCopy {
  /** What this 52-day chapter amplifies. */
  frame: string;
  /** How the planet turns up the card's shadow. */
  pressure: string;
}

export const PLANET_COPY: Record<string, PlanetCopy> = {
  Mercury: {
    frame: "Mercury is the talking chapter — plans, messages, the story you tell about yourself.",
    pressure: "Mercury makes you narrate instead of decide.",
  },
  Venus: {
    frame: "Venus is the wanting chapter — love, money you enjoy, what you let close.",
    pressure: "Venus makes you shop for comfort and call it love.",
  },
  Mars: {
    frame: "Mars is the pushing chapter — effort, friction, the fight you pick.",
    pressure: "Mars turns every shadow into a fight with somebody else.",
  },
  Jupiter: {
    frame: "Jupiter is the bigger chapter — more room, more luck, more of whatever you already are.",
    pressure: "Jupiter makes the shadow louder and more expensive.",
  },
  Saturn: {
    frame: "Saturn is the bill chapter — structure, discipline, what you actually owe.",
    pressure: "Saturn collects on every shortcut the card is tempted by.",
  },
  Uranus: {
    frame: "Uranus is the sudden chapter — surprises, freedom, the plan that breaks.",
    pressure: "Uranus makes the shadow erratic: you bolt instead of choosing.",
  },
  Neptune: {
    frame: "Neptune is the dissolving chapter — dreams, endings, what fog hides.",
    pressure: "Neptune makes the shadow slippery: you drift and call it faith.",
  },
};

export const CARD_COPY: Record<string, CardCopy> = {
  // ---- Hearts: love, family, feeling --------------------------------------
  "A♥": {
    light: "You start love. New people, new feeling, a fresh yes.",
    shadow: "You want to be wanted more than you want anyone in particular. The chase is the point and the person is the prop.",
    dare: "Stay one conversation past the moment it stops being new.",
  },
  "2♥": {
    light: "You do closeness well. Two people, one honest room.",
    shadow: "You disappear into whoever you're with and then resent them for taking up the space you handed over.",
    dare: "Make one plan this chapter that doesn't include them.",
  },
  "3♥": {
    light: "You feel three things at once and can hold all of them.",
    shadow: "You keep a spare. A backup person, a backup feeling. It's not indecision — it's insurance.",
    dare: "Pick one and let the other option actually close.",
  },
  "4♥": {
    light: "You make people feel safe. Home is wherever you are.",
    shadow: "Safe is your leash. You'll keep a dead-calm relationship over a live one because at least it's quiet.",
    dare: "Say the thing that would disturb the peace.",
  },
  "5♥": {
    light: "You know when love needs to move and you can move it.",
    shadow: "You leave before you're left. You call it growth. Half the time it's an exit with better branding.",
    dare: "Stay through one discomfort you'd normally walk out of.",
  },
  "6♥": {
    light: "You keep your word in love. People rest on that.",
    shadow: "You collect on it. Every kindness has a ledger line and you never forget a debt — or forgive one.",
    dare: "Do one thing for someone with no expectation of anything back.",
  },
  "7♥": {
    light: "You love people as they are — spiritually generous, wide open.",
    shadow: "You're disappointed in people you never actually asked anything of. The betrayal is mostly your imagination doing the work.",
    dare: "Ask out loud for what you've been quietly expecting.",
  },
  "8♥": {
    light: "You have charm on tap. Rooms tilt toward you.",
    shadow: "You use it. Feelings are leverage and you know exactly which button opens which person.",
    dare: "Get something you want without turning it on.",
  },
  "9♥": {
    light: "You give without keeping count. Big-hearted to the end.",
    shadow: "You give so no one can leave. Then you're exhausted and nobody's grateful enough. That's the bill for buying love with service.",
    dare: "Let someone give to you and don't repay it for a week.",
  },
  "10♥": {
    light: "Everyone wants you in the room. You make groups feel like family.",
    shadow: "You perform warmth for the crowd and go home empty. Popular is not the same as known.",
    dare: "Tell one person something the room doesn't know.",
  },
  "J♥": {
    light: "You sacrifice for the people you love and it looks like grace.",
    shadow: "The martyr wants an audience. If nobody sees you suffer for them, was it even love?",
    dare: "Do the kind thing and tell no one.",
  },
  "Q♥": {
    light: "You mother the world. Warm, magnetic, endlessly nurturing.",
    shadow: "You make people need you, then feel trapped by the needing. Smothering is control in a soft sweater.",
    dare: "Let someone struggle without rescuing them.",
  },
  "K♥": {
    light: "You lead with heart. People follow because they feel held.",
    shadow: "Your love has terms and you're the only one who reads the contract. Disobedience costs them your warmth.",
    dare: "Stay warm to someone who just told you no.",
  },

  // ---- Clubs: mind, ideas, learning ---------------------------------------
  "A♣": {
    light: "First idea in the room. You think of the new thing before anyone.",
    shadow: "You're addicted to the beginning. The idea is thrilling; the follow-through is someone else's problem.",
    dare: "Finish the boring middle of one thing you started.",
  },
  "2♣": {
    light: "You think best out loud, with someone. Great talker, great partner.",
    shadow: "You argue to feel close. If there's no friction, you'll manufacture some just to have something to talk about.",
    dare: "Agree with someone without adding a 'but'.",
  },
  "3♣": {
    light: "Your mind is quick and wide. You see three angles instantly.",
    shadow: "You worry as a hobby. Three options means three ways to be wrong, and you'll rehearse all of them at 2am.",
    dare: "Decide one thing in under a minute and don't revisit it.",
  },
  "4♣": {
    light: "You build mental order. Reliable, clear, hard to rattle.",
    shadow: "You're right and that's the problem. Being correct has become a place to hide from being curious.",
    dare: "Ask a question you don't already know the answer to.",
  },
  "5♣": {
    light: "You're restless in the best way — new ideas, new places, always learning.",
    shadow: "You change the subject when it gets real. Movement is how you avoid landing anywhere you could be judged.",
    dare: "Stay on one hard topic until it's actually resolved.",
  },
  "6♣": {
    light: "You mean what you say. Your word is a fixed point.",
    shadow: "You've mistaken your opinion for the truth. Stubborn feels like integrity from the inside.",
    dare: "Change your mind about one thing, publicly.",
  },
  "7♣": {
    light: "You think deeply. Spiritual mind, real insight.",
    shadow: "You doubt everything, including the good news. Skepticism is your armor against being fooled — and against being helped.",
    dare: "Take one piece of advice without dissecting it.",
  },
  "8♣": {
    light: "You focus like a laser. What you decide to learn, you master.",
    shadow: "You're not focused — you're fixated. And you'll steamroll anyone standing between you and the thing.",
    dare: "Notice who you ran over this week. Say so.",
  },
  "9♣": {
    light: "You give away what you know. A generous, finishing mind.",
    shadow: "You're done before anyone else is. So you check out, and they feel abandoned mid-sentence.",
    dare: "Stay in one conversation you've already mentally left.",
  },
  "10♣": {
    light: "You're the teacher in the room — sharp, knowing, quick.",
    shadow: "You need to be the smartest one here. If you're not learning something, it's because you're too busy proving.",
    dare: "Let someone explain something you already understand.",
  },
  "J♣": {
    light: "Your cleverest ideas come out of nowhere. Creative, mercurial, fun.",
    shadow: "Clever enough to lie to yourself. You can talk your way around any truth, especially the one about you.",
    dare: "Say the plain version of a thing you'd normally spin.",
  },
  "Q♣": {
    light: "Your intuition is a weapon. You know before you know why.",
    shadow: "You're always right and always exhausted. Nobody can keep up with your mind, and you resent them for it.",
    dare: "Ask for help with something you could do yourself.",
  },
  "K♣": {
    light: "Authority of mind. People defer to your thinking without being asked.",
    shadow: "You mistake being right for being kind. You'd rather win the point than keep the person.",
    dare: "Lose an argument on purpose and see who you become.",
  },

  // ---- Diamonds: value, money, worth --------------------------------------
  "A♦": {
    light: "You start things that make money. Ambition with a pulse.",
    shadow: "You want it all and want it first. The wanting never fills — it just changes targets.",
    dare: "Finish something before you start the next thing.",
  },
  "2♦": {
    light: "You make deals work. Partnerships that pay.",
    shadow: "Every relationship is a transaction and you're always checking the exchange rate. People can feel it.",
    dare: "Give someone the better end of a deal on purpose.",
  },
  "3♦": {
    light: "You create value from nothing. Inventive with money and worth.",
    shadow: "Two prices in your head and a refusal to pick. Indecision about your own worth is the most expensive thing you own.",
    dare: "Name your price once and don't discount it.",
  },
  "4♦": {
    light: "You build financial ground. Solid, dependable, steady.",
    shadow: "You hoard. Security has become a wall, and you're inside it counting things while life happens outside.",
    dare: "Spend on something that makes you bigger, not safer.",
  },
  "5♦": {
    light: "You know value changes and you move with it.",
    shadow: "You're never satisfied and you call it ambition. Every win is a rung, never a place to stand.",
    dare: "Sit with one thing you already have. Don't improve it.",
  },
  "6♦": {
    light: "You settle your debts. Fair, responsible, honest about money.",
    shadow: "You keep the books on everyone. And you're the only one who knows the balance is off.",
    dare: "Forgive one debt — money or otherwise — without announcing it.",
  },
  "7♦": {
    light: "You understand money as spiritual. Faith over fear when you're clean.",
    shadow: "Money fear is your weather. You talk about it constantly because worrying is easier than deciding.",
    dare: "Make one money decision without discussing it with anyone.",
  },
  "8♦": {
    light: "You have power over value. You name the price and the room agrees.",
    shadow: "You keep score. Even in bed. Power and love live in the same drawer, and when the bank account drops, so does your spine.",
    dare: "Find one thing you refuse to sell. Then act like it.",
  },
  "9♦": {
    light: "You give generously. Big-picture money, no small change.",
    shadow: "You lose things to prove you don't need them. Then you mourn them anyway and call it fate.",
    dare: "Keep something you'd normally let go of to look unbothered.",
  },
  "10♦": {
    light: "You attract abundance. Blessed with worth, and you know it.",
    shadow: "Enough is never enough and more is never it. You measure yourself by the number and the number always moves.",
    dare: "Write down what 'enough' actually is. Then stop.",
  },
  "J♦": {
    light: "You sell. Charm, hustle, a nose for value.",
    shadow: "You'll say what closes the deal. Truth is negotiable and you're a very good negotiator.",
    dare: "Tell someone the flaw in what you're offering.",
  },
  "Q♦": {
    light: "You know what's worth having. Taste, generosity, abundance.",
    shadow: "You spend to feel like yourself. And you're a little contemptuous of anyone who can't keep up.",
    dare: "Go one week without buying your mood.",
  },
  "K♦": {
    light: "You set the value. Not just rich — in charge of what rich means.",
    shadow: "You think your money is your judgment. People stop telling you the truth because you pay for the version you like.",
    dare: "Ask someone who has nothing to gain what they really think.",
  },

  // ---- Spades: work, body, will --------------------------------------------
  "A♠": {
    light: "You start the deep work. Secrets, transformation, real ambition.",
    shadow: "You want the mystery more than the answer. Being unknowable is a strategy, not a personality.",
    dare: "Tell someone a plain fact about yourself you usually hide.",
  },
  "2♠": {
    light: "You build with a partner. The work gets easier and bigger together.",
    shadow: "You're afraid of being left with the bill. So you over-function, check their work, and call control 'help'.",
    dare: "Stop doing one thing for someone they never asked for.",
  },
  "3♠": {
    light: "You can do three jobs at once and make it look like one.",
    shadow: "You push your worry — about health, about work — onto whoever is closest. Your anxiety becomes their job.",
    dare: "Carry one worry all the way to the end without handing it off.",
  },
  "4♠": {
    light: "You build things that last. Steady body, steady work.",
    shadow: "Routine is your hiding place. You call it discipline, but the point is that nothing surprising can reach you.",
    dare: "Break one routine on purpose and watch what comes up.",
  },
  "5♠": {
    light: "You change your life when it needs changing. Brave body, brave moves.",
    shadow: "You blow it up rather than fix it. New city, new job, new body — same you, packed carefully in the box.",
    dare: "Fix one thing you've been planning to escape.",
  },
  "6♠": {
    light: "You do what you said you'd do. Fate rewards your consistency.",
    shadow: "You're in a rut and you've named it karma. What you call destiny is often just the path of least resistance.",
    dare: "Do one thing this week that your pattern would never predict.",
  },
  "7♠": {
    light: "You have real faith in your body and your work. Spiritual labor.",
    shadow: "You expect to be betrayed, so you find it. And when your body objects, you treat it like a disloyal employee.",
    dare: "Rest before you're forced to.",
  },
  "8♠": {
    light: "Real power in your work and your body. When you decide, it happens.",
    shadow: "You run your love life like a job. Everyone has a role and a review, and no one's passed yet.",
    dare: "Let one relationship be unproductive on purpose.",
  },
  "9♠": {
    light: "You let go of what's finished. Endings don't scare you.",
    shadow: "You grieve pre-emptively. Everything is already ending in your head, so you never fully arrive anywhere.",
    dare: "Commit to something as if it isn't going to end.",
  },
  "10♠": {
    light: "You work harder than anyone and it shows.",
    shadow: "Work is where you hide. Busy is your alibi, and the people waiting for you know it.",
    dare: "Leave one thing unfinished and go home.",
  },
  "J♠": {
    light: "The initiate. You'll do it the long way and come out changed.",
    shadow: "The thief. You'll steal the shortcut and get caught — by the bill, by your body, by someone who trusted you.",
    dare: "Take the long way on one thing this chapter.",
  },
  "Q♠": {
    light: "Self-mastery. You do the work yourself and do it perfectly.",
    shadow: "The martyr who won't let anyone else hold the knife and then complains about their hands.",
    dare: "Hand off one task you think only you can do right.",
  },
  "K♠": {
    light: "Mastery. You've earned the authority and you use it well.",
    shadow: "You don't ask anymore — you announce. And the loneliness at the top was built by your own hands.",
    dare: "Ask for input on a decision you've already made.",
  },
};

export function cardCopy(code: string): CardCopy {
  return (
    CARD_COPY[code] ?? {
      light: "A chapter with its own weather.",
      shadow: "Every card has a shadow. This one is yours to name.",
      dare: "Notice what you avoid this chapter.",
    }
  );
}

export function planetCopy(planet: string): PlanetCopy {
  return (
    PLANET_COPY[planet] ?? {
      frame: "A 52-day chapter of your year.",
      pressure: "The chapter turns up whatever the card already carries.",
    }
  );
}
