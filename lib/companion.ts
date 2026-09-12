export type Personality = "ENERGETIC" | "CALM" | "PLAYFUL" | "GRUMPY" | "CHAOTIC";
export type CompanionStage = "BASIC" | "ADVENTURER" | "GUARDIAN" | "ELITE" | "CELESTIAL";
export type Mood =
  | "IDLE"
  | "HAPPY"
  | "EXCITED"
  | "FOCUSED"
  | "CELEBRATING"
  | "SLEEPY"
  | "STARSTRUCK";

export const STAGES: { stage: CompanionStage; bond: number; face: string; title: string; tint: string }[] = [
  { stage: "BASIC", bond: 0, face: "🥚", title: "Hatchling", tint: "#93a4bd" },
  { stage: "ADVENTURER", bond: 60, face: "🐣", title: "Adventurer", tint: "#4c9ffe" },
  { stage: "GUARDIAN", bond: 200, face: "🦊", title: "Guardian", tint: "#b15cff" },
  { stage: "ELITE", bond: 500, face: "🐉", title: "Elite", tint: "#ffb02e" },
  { stage: "CELESTIAL", bond: 1000, face: "✨", title: "Celestial", tint: "#4ce6cf" },
];

export const stageIndex = (stage: string) => Math.max(0, STAGES.findIndex((s) => s.stage === stage));

export function stageForBond(bond: number): CompanionStage {
  let current: CompanionStage = "BASIC";
  for (const s of STAGES) if (bond >= s.bond) current = s.stage;
  return current;
}

export const stageMeta = (stage: string) => STAGES[stageIndex(stage)] ?? STAGES[0];

export function nextStage(stage: string) {
  const next = STAGES[stageIndex(stage) + 1];
  return next ?? null;
}

/** Bond earned per event. Real progress only — no idle ticking. */
export const BOND = {
  quest: 4,
  focusSession: 10,
  levelUp: 15,
  chest: 5,
  interact: 1,
} as const;

type Lines = Record<Mood, string[]>;

const VOICE: Record<Personality, Lines> = {
  ENERGETIC: {
    IDLE: ["Ready when you are!", "What's next?!", "I've got energy to burn."],
    HAPPY: ["Nice one!", "That felt good!", "More of that!"],
    EXCITED: ["LET'S GOOO!", "That was huge!", "Did you see that?!"],
    FOCUSED: ["Locked in. Go.", "I'll keep watch.", "Deep breath. Work."],
    CELEBRATING: ["WE DID IT!", "Champion!", "Unstoppable!"],
    SLEEPY: ["...still here...", "Come back soon?", "I waited up."],
    STARSTRUCK: ["It's glowing!", "That's a rare one!", "Whoa."],
  },
  CALM: {
    IDLE: ["Take your time.", "One thing at a time.", "I'm here."],
    HAPPY: ["Well done.", "Steady progress.", "That counts."],
    EXCITED: ["Quite a leap.", "That was significant.", "Momentum."],
    FOCUSED: ["Breathe. Begin.", "Stillness now.", "Just this one thing."],
    CELEBRATING: ["You earned this.", "A fine result.", "Proud of you."],
    SLEEPY: ["Rest is fine too.", "I'll be here.", "No rush."],
    STARSTRUCK: ["Remarkable.", "Rare indeed.", "Beautiful."],
  },
  PLAYFUL: {
    IDLE: ["Boop.", "Poke me, I dare you.", "I was napping. Sort of."],
    HAPPY: ["Yay!", "That's the stuff!", "Hehe, nice."],
    EXCITED: ["WOOOO!", "Again! Again!", "That was so cool!"],
    FOCUSED: ["Shh. Working.", "Quiet mode. Mostly.", "I'll behave. Probably."],
    CELEBRATING: ["PARTY!", "Confetti time!", "You're the best!"],
    SLEEPY: ["Zzz... hm? Oh, hi.", "Nap interrupted.", "Five more minutes."],
    STARSTRUCK: ["Shiny!!", "Ooooh.", "Mine? Ours?"],
  },
  GRUMPY: {
    IDLE: ["Hmph.", "Still waiting.", "Don't mind me."],
    HAPPY: ["...fine, that was good.", "Acceptable.", "Hmph. Not bad."],
    EXCITED: ["Okay, that WAS impressive.", "Don't let it go to your head.", "Fine. I'm impressed."],
    FOCUSED: ["Finally, some quiet.", "Work. I'll wait.", "Don't waste it."],
    CELEBRATING: ["I suppose you earned it.", "Don't gloat.", "...alright, well done."],
    SLEEPY: ["You left.", "Typical.", "I wasn't worried."],
    STARSTRUCK: ["...that's actually rare.", "Huh. Nice.", "Don't lose it."],
  },
  CHAOTIC: {
    IDLE: ["What if we did something weird?", "I ate a star earlier.", "Reality is optional."],
    HAPPY: ["Chaos approves!", "Delicious!", "The prophecy said this!"],
    EXCITED: ["AAAAAA!", "THE NUMBERS WENT UP!", "I'm vibrating!"],
    FOCUSED: ["I'll contain myself. Barely.", "Focus? Weird. Okay.", "Quiet chaos. New concept."],
    CELEBRATING: ["ASCENSION!", "THE STARS ALIGN!", "WE BROKE IT!"],
    SLEEPY: ["I dreamt in colours you can't see.", "Time is soup.", "Did you leave? Rude."],
    STARSTRUCK: ["IT SHINES WITH FORBIDDEN LIGHT!", "Precious!", "The glow speaks!"],
  },
};

export function companionLine(personality: string, mood: Mood, seed = Date.now()) {
  const voice = VOICE[(personality as Personality) in VOICE ? (personality as Personality) : "PLAYFUL"];
  const lines = voice[mood] ?? voice.IDLE;
  return lines[Math.abs(Math.floor(seed)) % lines.length];
}

export const PERSONALITIES: { key: Personality; label: string; blurb: string; icon: string }[] = [
  { key: "ENERGETIC", label: "Energetic", blurb: "Loud, fast, always ready", icon: "⚡" },
  { key: "CALM", label: "Calm", blurb: "Steady and reassuring", icon: "🌙" },
  { key: "PLAYFUL", label: "Playful", blurb: "Silly and affectionate", icon: "🎈" },
  { key: "GRUMPY", label: "Grumpy", blurb: "Secretly proud of you", icon: "☁️" },
  { key: "CHAOTIC", label: "Chaotic", blurb: "Unhinged, in a good way", icon: "🌀" },
];

/** Mood derived from real activity rather than stored state. */
export function moodFrom(opts: {
  lastInteracted: Date;
  focusActive: boolean;
  now?: Date;
}): Mood {
  if (opts.focusActive) return "FOCUSED";
  const hours = ((opts.now ?? new Date()).getTime() - opts.lastInteracted.getTime()) / 3_600_000;
  if (hours > 20) return "SLEEPY";
  if (hours < 0.1) return "HAPPY";
  return "IDLE";
}
