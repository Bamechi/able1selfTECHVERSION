/**
 * ABLE1SELF — IDENTITY ENGINE
 * Deterministic scoring: answers in, a defined result out.
 *
 * Version 2.0 — July 31, 2026 — B. Amechi (High Lvl Management)
 *
 * CORE PRINCIPLE
 *   Same answers always produce the same profile. The engine types the member.
 *   The LLM never types anyone — it writes and coaches on top of a result that
 *   is already decided. Determinism is what makes the profile trustworthy and
 *   what makes "your type" repeatable enough to build a brand on.
 *
 * FOUR AXES → 2^4 = 16 CORE IDENTITY ARCHETYPES
 *   1 Energy    Inward / Outward     I / O   where you draw power
 *   2 Drive     Visionary / Maker    V / M   future & meaning vs craft & results
 *   3 Presence  Refined / Bold       R / B   restraint vs statement
 *   4 Motion    Steady / Catalyst    S / C   patient builder vs fast igniter
 *
 * RESOLUTION
 *   Axes 1, 2 and 4 resolve inside Analyze → a PROVISIONAL archetype after Stage A.
 *   Axis 3 resolves inside Brand → the FINAL archetype locks when Brand completes.
 *
 * DEPENDENCIES: none. Pure functions. Safe on server or client.
 */

import {
  calculateAstrology,
  elementForSign,
  explainPosition,
  type AstrologyChart,
  type BirthInput,
} from "./astrology-engine";
import {
  calculateLifePath,
  describeLifePath,
  LIFE_PATH_MEANINGS,
} from "./life-paths";
import { describeSignalTension, scoreBrandSignal } from "./brand-signal";
import { scoreBrandLedger } from "./brand-ledger";

/* ============================================================
   TYPES
   ============================================================ */

export type BirthData = BirthInput;

export type AnswerValue = string | string[] | number | BirthData | null | undefined;

export type AnswerSet = Record<string, AnswerValue>;

export type AxisKey = "energy" | "drive" | "presence" | "motion";

export type AxisResult = {
  axis: AxisKey;
  label: string;
  letter: string;
  poleName: string;
  scores: Record<string, number>;
  resolvedBy: "score" | "primary-tiebreak" | "default";
  confidence: number; // 0-1, how decisive the win was
};

export type Archetype = {
  code: string;
  name: string;
  tagline: string;
  identity: string;
  edge: string;
  strengths: string[];
  blindSpots: string[];
  idealRooms: string[];
  monetizationTilt: string;
  howToShowUp: string;
  partnerFit: string[];
};

export type IdentityResult = {
  code: string;
  archetype: Archetype;
  axes: AxisResult[];
  provisional: boolean;
  confidence: number;
};

/* ============================================================
   SCALE NORMALISATION
   Works whether the UI ships a 1-5 or a 1-10 slider.
   ============================================================ */

function normalizeScale(value: AnswerValue, min = 1, max = 5): number | null {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return null;
  if (max === min) return null;
  const clamped = Math.min(Math.max(n, min), max);
  return (clamped - min) / (max - min); // 0 = low pole, 1 = high pole
}

function asArray(value: AnswerValue): string[] {
  if (Array.isArray(value)) return value.filter((v): v is string => typeof v === "string");
  if (typeof value === "string" && value.length) return [value];
  return [];
}

function asString(value: AnswerValue): string {
  return typeof value === "string" ? value : "";
}

/* ============================================================
   AXIS SCORING MAPS
   Every entry is keyed to the exact option string in program-data.ts.
   Change an option there, change it here. Nowhere else.
   ============================================================ */

type PoleVote = Record<string, string>; // option text -> pole letter

const AXIS_DEFS: Record<
  AxisKey,
  {
    label: string;
    poles: [string, string];
    poleNames: [string, string];
    /** the question that breaks a tie */
    primary: { key: string; kind: "scale"; lowPole: string; highPole: string };
    /** choice / multi questions that each add +1 to a pole */
    votes: Array<{ key: string; map: PoleVote }>;
    /** additional scale questions worth +1 */
    scales?: Array<{ key: string; lowPole: string; highPole: string }>;
    /** stage that must be complete before this axis is trustworthy */
    resolvesIn: "A" | "B";
  }
> = {
  energy: {
    label: "Energy",
    poles: ["I", "O"],
    poleNames: ["Inward", "Outward"],
    resolvesIn: "A",
    primary: {
      key: "a1_social_energy",
      kind: "scale",
      lowPole: "I",
      highPole: "O",
    },
    votes: [
      {
        key: "a2_recharge",
        map: {
          "Solitude and stillness": "I",
          "Creating or building something": "I",
          "Movement and physical challenge": "O",
          "Deep conversation with a few people": "O",
        },
      },
      {
        key: "a2_drains",
        map: {
          "Small talk": "I",
          Crowds: "I",
          "Sitting still": "O",
          Repetition: "O",
        },
      },
      {
        key: "a1_strengths",
        map: {
          "Reading people": "O",
          "Bringing people together": "O",
          Persuasion: "O",
          "Craft / attention to detail": "I",
          "Strategy / seeing ahead": "I",
          "Ideas / imagination": "I",
        },
      },
    ],
  },

  drive: {
    label: "Drive",
    poles: ["V", "M"],
    poleNames: ["Visionary", "Maker"],
    resolvesIn: "A",
    // a3_theme is a choice, so the primary tiebreak is handled specially below
    primary: {
      key: "a3_theme_pseudo_scale",
      kind: "scale",
      lowPole: "V",
      highPole: "M",
    },
    votes: [
      {
        key: "a3_theme",
        map: {
          "Reinvention — becoming someone new": "V",
          "Liberation — breaking free of an old story": "V",
          "Mastery — going deeper in my craft": "M",
          "Legacy — building something that lasts": "M",
          // Alignment is deliberately neutral
        },
      },
      {
        key: "a3_driver",
        map: {
          "A vision only I can see": "V",
          "Escaping who I used to be": "V",
          "Proving something to myself": "M",
          "Proving something to others": "M",
          "Providing for people I love": "M",
        },
      },
      {
        key: "a1_decide",
        map: {
          "A gut read of the moment": "V",
          "Logic and analysis": "M",
          "Values and how people are affected": "M",
        },
      },
      {
        key: "a1_pace",
        map: {
          "Whenever inspiration hits": "V",
          "Steady daily consistency": "M",
          "Deadline-driven bursts": "M",
        },
      },
      {
        key: "a1_strengths",
        map: {
          "Strategy / seeing ahead": "V",
          "Ideas / imagination": "V",
          "Craft / attention to detail": "M",
          "Getting things done": "M",
        },
      },
    ],
  },

  presence: {
    label: "Presence",
    poles: ["R", "B"],
    poleNames: ["Refined", "Bold"],
    resolvesIn: "B",
    primary: {
      key: "b2_boldness",
      kind: "scale",
      lowPole: "R",
      highPole: "B",
    },
    votes: [
      {
        key: "b1_room_read",
        map: {
          "Refined and understated": "R",
          "Warm and approachable": "R",
          "Bold and unforgettable": "B",
          "Sharp and authoritative": "B",
          "Creative and original": "B",
        },
      },
      {
        key: "b1_wardrobe",
        map: {
          "A few perfect timeless pieces": "R",
          "Comfort that still looks intentional": "R",
          "Structured, tailored, precise": "R",
          "Statement items that turn heads": "B",
          "Unexpected mixes and texture": "B",
        },
      },
      {
        key: "b1_color",
        map: {
          "Black, ivory, camel — quiet luxury": "R",
          "Earth tones and soft neutrals": "R",
          "Charcoal, navy, crisp white": "R",
          "Deep jewel tones and contrast": "B",
          "Whatever breaks the rules": "B",
        },
      },
      {
        key: "b1_compliment",
        map: {
          "You always look so put-together.": "R",
          "You seem so comfortable in your skin.": "R",
          "You have such a signature look.": "B",
          "You look like you're in charge.": "B",
          "I could never pull that off — but you do.": "B",
        },
      },
    ],
  },

  motion: {
    label: "Motion",
    poles: ["S", "C"],
    poleNames: ["Steady", "Catalyst"],
    resolvesIn: "A",
    primary: {
      key: "a1_risk",
      kind: "scale",
      lowPole: "S",
      highPole: "C",
    },
    votes: [
      {
        key: "a1_pace",
        map: {
          "Steady daily consistency": "S",
          "Sprints of intense focus": "C",
          "Deadline-driven bursts": "C",
          "Whenever inspiration hits": "C",
        },
      },
      {
        key: "a2_derived_element",
        map: {
          "Earth — grounded, building, patient": "S",
          "Fire — drive, passion, action": "C",
          "Air — ideas, connection, movement": "C",
          // Water is deliberately neutral
        },
      },
      {
        key: "a1_strengths",
        map: {
          "Staying calm under pressure": "S",
          "Craft / attention to detail": "S",
          Persuasion: "C",
          "Ideas / imagination": "C",
        },
      },
    ],
    scales: [{ key: "a1_plan_spont", lowPole: "S", highPole: "C" }],
  },
};

/* ============================================================
   AXIS RESOLUTION
   ============================================================ */

export function scoreAxis(axis: AxisKey, answers: AnswerSet): AxisResult {
  const def = AXIS_DEFS[axis];
  const [poleA, poleB] = def.poles;
  const scores: Record<string, number> = { [poleA]: 0, [poleB]: 0 };

  // choice / multi votes
  for (const vote of def.votes) {
    for (const selected of asArray(answers[vote.key])) {
      const pole = vote.map[selected];
      if (pole) scores[pole] += 1;
    }
  }

  // secondary scales
  for (const scale of def.scales ?? []) {
    const norm = normalizeScale(answers[scale.key]);
    if (norm === null) continue;
    if (norm < 0.4) scores[scale.lowPole] += 1;
    else if (norm > 0.6) scores[scale.highPole] += 1;
  }

  // primary question — worth 2, and it breaks ties
  let primaryPole: string | null = null;
  if (axis === "drive") {
    const theme = asString(answers["a3_theme"]);
    if (theme.startsWith("Reinvention") || theme.startsWith("Liberation")) primaryPole = "V";
    else if (theme.startsWith("Mastery") || theme.startsWith("Legacy")) primaryPole = "M";
  } else {
    const norm = normalizeScale(answers[def.primary.key]);
    if (norm !== null) {
      if (norm < 0.4) primaryPole = def.primary.lowPole;
      else if (norm > 0.6) primaryPole = def.primary.highPole;
    }
  }
  if (primaryPole) scores[primaryPole] += 2;

  const a = scores[poleA];
  const b = scores[poleB];
  let letter = poleA;
  let resolvedBy: AxisResult["resolvedBy"] = "score";

  if (a > b) letter = poleA;
  else if (b > a) letter = poleB;
  else if (primaryPole) {
    letter = primaryPole;
    resolvedBy = "primary-tiebreak";
  } else {
    letter = poleA; // documented default: first pole wins a neutral tie
    resolvedBy = "default";
  }

  const total = a + b;
  const confidence = total === 0 ? 0 : Math.abs(a - b) / total;
  const poleIndex = letter === poleA ? 0 : 1;

  return {
    axis,
    label: def.label,
    letter,
    poleName: def.poleNames[poleIndex],
    scores,
    resolvedBy,
    confidence: Number(confidence.toFixed(2)),
  };
}

/**
 * Resolve the member's core identity archetype.
 * `brandComplete` false → Presence is not yet trustworthy and the result is
 * returned as PROVISIONAL. Show it as "forming", not as final.
 */
export function resolveIdentity(
  answers: AnswerSet,
  brandComplete = false,
): IdentityResult {
  const axes: AxisResult[] = [
    scoreAxis("energy", answers),
    scoreAxis("drive", answers),
    scoreAxis("presence", answers),
    scoreAxis("motion", answers),
  ];
  const code = axes.map((a) => a.letter).join("");
  const archetype = ARCHETYPES[code] ?? ARCHETYPES["IVRS"];
  const relevant = brandComplete ? axes : axes.filter((a) => a.axis !== "presence");
  const confidence =
    relevant.reduce((sum, a) => sum + a.confidence, 0) / relevant.length;

  return {
    code,
    archetype,
    axes,
    provisional: !brandComplete,
    confidence: Number(confidence.toFixed(2)),
  };
}

/* ============================================================
   THE 16 CORE IDENTITY ARCHETYPES
   ============================================================ */

export const ARCHETYPES: Record<string, Archetype> = {
  IVRS: {
    code: "IVRS",
    name: "The Sage Architect",
    tagline: "A quiet strategist building a lasting vision.",
    identity:
      "You think in decades while everyone around you thinks in quarters. You do your best work alone, in silence, drawing the blueprint long before anyone sees a building. When you finally speak, people listen — because you never speak before you know.",
    edge: "Long-game clarity. You can see the whole board.",
    strengths: [
      "Sees the second and third consequence of a decision before others see the first",
      "Builds systems that keep working after you leave the room",
      "Credibility that compounds — you are rarely wrong in public",
    ],
    blindSpots: [
      "You over-plan and under-announce — the world can't buy what it can't see",
      "You mistake being right for being chosen",
      "Waiting for the perfect conditions is still a decision",
    ],
    idealRooms: [
      "Strategy and advisory tables",
      "Small rooms of decision-makers",
      "Long-form writing, essays, frameworks",
    ],
    monetizationTilt:
      "Advisory, frameworks, and high-ticket consulting. Sell the thinking, not the hours.",
    howToShowUp:
      "Restraint is your signal. One immaculate point of view, published consistently, beats a feed full of noise. Your image should read: nothing here is accidental.",
    partnerFit: ["OMBC", "OVBC", "OMRC"],
  },
  IVRC: {
    code: "IVRC",
    name: "The Mystic",
    tagline: "A private visionary who moves in sudden, elegant leaps.",
    identity:
      "You process internally and then move without warning. Where others need proof, you need a feeling — and your feelings have a track record. Your life looks like long quiet stretches punctuated by decisions that shock the people around you.",
    edge: "Intuition. You arrive at conclusions before the data does.",
    strengths: [
      "Reads a room, a market, or a person faster than analysis can",
      "Comfortable making the leap other people won't make",
      "Creates work with an atmosphere people can't quite name",
    ],
    blindSpots: [
      "You don't show your reasoning, so people can't follow or fund you",
      "Your leaps look reckless from outside — build the receipts",
      "Long quiet stretches can become disappearing acts",
    ],
    idealRooms: [
      "Creative direction and taste-led work",
      "Founder and artist circles",
      "One-to-one, high-trust conversations",
    ],
    monetizationTilt:
      "Taste as a product — creative direction, curation, premium one-to-one work with very few clients.",
    howToShowUp:
      "Scarcity suits you. Say less, show finished things, and let the gaps between appearances do work. Your image should feel considered, never explained.",
    partnerFit: ["OMRS", "OMBS", "IMRS"],
  },
  IVBS: {
    code: "IVBS",
    name: "The Prophet",
    tagline: "Deep conviction, expressed boldly, built patiently.",
    identity:
      "You believe something most people don't, and you are willing to say it out loud and then wait years to be proven right. You are not loud for attention — you are loud because the message matters more than your comfort.",
    edge: "Belief that converts. People change their minds around you.",
    strengths: [
      "Moves people with conviction rather than pressure",
      "Stays with an unpopular position long enough for it to become obvious",
      "Attracts a following that is loyal rather than large",
    ],
    blindSpots: [
      "Certainty can shade into refusing good counter-evidence",
      "You may build an audience faster than you build an offer",
      "You take disagreement personally when it isn't",
    ],
    idealRooms: [
      "Stages, pulpits, keynote formats",
      "Long-form audio and video",
      "Movement and community building",
    ],
    monetizationTilt:
      "Message-led business — speaking, a signature program, a community that pays to stay close to the belief.",
    howToShowUp:
      "One idea, repeated with total consistency, in a visual identity that does not change. Repetition is not boring — it is how a belief becomes a brand.",
    partnerFit: ["OMRC", "OMRS", "IMBC"],
  },
  IVBC: {
    code: "IVBC",
    name: "The Revolutionary",
    tagline: "A disruptive idealist who breaks the frame.",
    identity:
      "You cannot leave a broken system alone. You see the rule, you see who the rule protects, and something in you refuses to comply quietly. You move fast, you make enemies, and you make things that would not otherwise exist.",
    edge: "Reinvention. You are unafraid to destroy a working thing to build a better one.",
    strengths: [
      "Names the thing everyone else is avoiding",
      "Moves before consensus, which is often the only time it's possible",
      "Draws talented people who were bored somewhere else",
    ],
    blindSpots: [
      "You burn bridges you will need later",
      "Constant reinvention prevents compounding — some things should be left alone",
      "You confuse resistance with proof that you're right",
    ],
    idealRooms: [
      "Zero-to-one ventures",
      "Cultural and creative disruption",
      "Rooms where the incumbent is complacent",
    ],
    monetizationTilt:
      "New-category products and provocative IP. Charge for the thing nobody else will make.",
    howToShowUp:
      "Contrast is the strategy. Your image should visibly refuse the uniform of your industry — deliberately, not carelessly.",
    partnerFit: ["OMRS", "IMRS", "OMBS"],
  },
  IMRS: {
    code: "IMRS",
    name: "The Craftsman",
    tagline: "Quiet mastery and refined, durable work.",
    identity:
      "You are the person others quietly rely on to do it properly. You are not chasing attention; you are chasing the standard. Given time and the right material, what you make outlasts what everyone else shipped that year.",
    edge: "Depth of skill. The work speaks with no help from you.",
    strengths: [
      "A standard of quality that becomes its own reputation",
      "Deep, durable expertise that cannot be quickly copied",
      "Trustworthy under pressure — you don't cut corners",
    ],
    blindSpots: [
      "You undercharge because the work feels easy to you",
      "You wait to be discovered instead of being known",
      "Perfectionism disguised as standards will cost you the launch",
    ],
    idealRooms: [
      "Studios, workshops, technical teams",
      "Client work with few clients and deep trust",
      "Teaching your craft to serious students",
    ],
    monetizationTilt:
      "Premium done-for-you work at a small client count, plus a high-priced teaching product for people who want your standard.",
    howToShowUp:
      "Let the work be the proof and keep your presentation immaculate and plain. Document the process — the making is the marketing.",
    partnerFit: ["OVBC", "OMBC", "OVRC"],
  },
  IMRC: {
    code: "IMRC",
    name: "The Alchemist",
    tagline: "Transforms through skill, in intense bursts.",
    identity:
      "You go quiet, you go deep, and you come back with something finished. Your output is not steady — it arrives. You take raw, unpromising inputs and turn them into things people did not think were possible.",
    edge: "Turning inputs into gold. Nothing is wasted material to you.",
    strengths: [
      "Extraordinary output in concentrated windows",
      "Solves problems others declared unsolvable",
      "Works across disciplines and steals well from all of them",
    ],
    blindSpots: [
      "Unpredictable cadence makes you hard to hire and hard to follow",
      "Between bursts you doubt whether the last one was real",
      "You resist process, and process is what makes bursts repeatable",
    ],
    idealRooms: [
      "R&D and prototype work",
      "Creative studios with real deadlines",
      "Turnaround and rescue projects",
    ],
    monetizationTilt:
      "Project-based premium engagements and transformation work — priced on outcome, never on time.",
    howToShowUp:
      "Show the before and after. Your brand is evidence of transformation, so publish the drop, not the daily.",
    partnerFit: ["OMRS", "OVRS", "OMBS"],
  },
  IMBS: {
    code: "IMBS",
    name: "The Artisan-King",
    tagline: "Masterful, expressive, and built to last.",
    identity:
      "You make things with a signature on them. The craft is serious and so is the statement — you refuse to choose between substance and presence. What you build is recognisable across a room and still holds up under inspection.",
    edge: "Signature craft. People can identify your work without your name on it.",
    strengths: [
      "Combines genuine mastery with a memorable aesthetic",
      "Builds a body of work rather than a series of jobs",
      "Commands premium pricing without discounting",
    ],
    blindSpots: [
      "You resist collaboration that would scale you",
      "Attachment to the signature can block necessary evolution",
      "You take longer than the market wants to wait",
    ],
    idealRooms: [
      "Luxury, fashion, design, and craft categories",
      "Collector and connoisseur audiences",
      "Brand partnerships where taste is the asset",
    ],
    monetizationTilt:
      "A branded product line or signature service with a waiting list. Scarcity plus signature equals margin.",
    howToShowUp:
      "Own one visual signature and never abandon it. Consistency across years is what turns a style into an asset.",
    partnerFit: ["OMRC", "OVRS", "OMBC"],
  },
  IMBC: {
    code: "IMBC",
    name: "The Maverick",
    tagline: "A skilled rule-breaker who ships.",
    identity:
      "You have the receipts and you still don't follow the playbook. You work fast, you work well, and you have very little patience for permission. People underestimate the discipline behind what looks like defiance.",
    edge: "Bold execution. You ship what other people are still discussing.",
    strengths: [
      "Speed with actual quality behind it",
      "Comfortable being disliked in service of the outcome",
      "Finds the shortcut that turns out to be the right road",
    ],
    blindSpots: [
      "You skip the alignment work and pay for it later",
      "Independence hardens into isolation",
      "You start the next thing before monetizing the last one",
    ],
    idealRooms: [
      "Founding teams and skunkworks",
      "Competitive, fast-moving categories",
      "Anywhere the incumbent is slow",
    ],
    monetizationTilt:
      "Own the product. Equity and ownership, not fees — your value is in the upside you create.",
    howToShowUp:
      "Show receipts, not opinions. Publish what you shipped and what it did. Your image should read capable first, unconventional second.",
    partnerFit: ["OVRS", "IMRS", "OMRS"],
  },
  OVRS: {
    code: "OVRS",
    name: "The Diplomat",
    tagline: "Connects people to a refined vision, steadily.",
    identity:
      "You move between worlds. You can hold a vision and hold a room at the same time, and you get people who disagree to build the same thing. Your influence is quiet, cumulative and very hard to displace.",
    edge: "Trusted influence. You are the person both sides call.",
    strengths: [
      "Builds coalitions that outlast individual relationships",
      "Translates a big idea into language each audience can accept",
      "Rarely burns a bridge, which compounds over a career",
    ],
    blindSpots: [
      "Consensus-seeking softens a position that needed an edge",
      "You carry other people's agendas further than your own",
      "Being liked can quietly replace being paid",
    ],
    idealRooms: [
      "Partnerships, BD, and alliance building",
      "Boards, associations, and industry bodies",
      "Cross-functional leadership",
    ],
    monetizationTilt:
      "Partnership and brokerage economics — deal fees, advisory retainers, and equity for access.",
    howToShowUp:
      "Polished, warm, and unmistakably senior. Your image should make an introduction feel like an upgrade for both parties.",
    partnerFit: ["IMBC", "IVBC", "IMRC"],
  },
  OVRC: {
    code: "OVRC",
    name: "The Evangelist",
    tagline: "Spreads the vision fast and elegantly.",
    identity:
      "You can make an idea travel. You take something complicated and hand it to a stranger in a sentence they remember. When you get behind something, the room moves — and you move to the next room.",
    edge: "Persuasion. You compress conviction into language that spreads.",
    strengths: [
      "Turns abstract ideas into shareable language",
      "Builds audience quickly across new channels",
      "Creates momentum other people can ride",
    ],
    blindSpots: [
      "You promote before the product is ready",
      "Novelty-chasing costs you the depth that makes it durable",
      "You may become known for someone else's idea",
    ],
    idealRooms: [
      "Marketing, launch, and go-to-market leadership",
      "Podcasts, stages, and press",
      "Community and movement growth",
    ],
    monetizationTilt:
      "Audience monetization and launch economics — courses, sponsorships, and revenue-share on what you make travel.",
    howToShowUp:
      "High-frequency, high-polish. Show up often and always look expensive doing it — the medium is part of the message.",
    partnerFit: ["IMRS", "IMRC", "IVRS"],
  },
  OVBS: {
    code: "OVBS",
    name: "The Luminary",
    tagline: "A visible leader who builds a movement.",
    identity:
      "People organize around you. You hold a vision publicly, you carry the weight of being watched, and you don't flinch. You are building something bigger than a business and everyone around you knows it.",
    edge: "Gravity. People arrange their plans around yours.",
    strengths: [
      "Attracts talent, capital, and attention without chasing",
      "Holds a long vision in public under pressure",
      "Creates belonging — people join you, not just your product",
    ],
    blindSpots: [
      "Everything routes through you, which caps the whole thing",
      "Public identity can outgrow private capacity",
      "Dissent stops reaching you long before it stops existing",
    ],
    idealRooms: [
      "Founder and CEO seats",
      "Movements, institutions, and cohorts",
      "Major stages and cultural platforms",
    ],
    monetizationTilt:
      "Own the platform. Membership, community, and equity — monetize belonging, not attention.",
    howToShowUp:
      "Iconic and consistent. Uniform-level repetition of one look, so that any photo from any year is recognisably you.",
    partnerFit: ["IMRS", "IMRC", "OMRS"],
  },
  OVBC: {
    code: "OVBC",
    name: "The Firestarter",
    tagline: "A charismatic igniter of rooms.",
    identity:
      "Energy moves when you walk in. You can start almost anything — a project, a movement, a room full of strangers — and you can do it today. The question of your life is never whether it starts. It's whether it finishes.",
    edge: "Energy. You create momentum out of nothing.",
    strengths: [
      "Zero-to-one social and creative momentum",
      "Recruits people into an idea in a single conversation",
      "Genuinely fearless about the first move",
    ],
    blindSpots: [
      "You leave a trail of started things",
      "Momentum can substitute for a working model",
      "You take the room's energy as evidence and skip the numbers",
    ],
    idealRooms: [
      "Launches, live events, and activations",
      "Sales and front-line growth",
      "Early-stage teams that need heat",
    ],
    monetizationTilt:
      "Front-end offers and live formats — events, launches, sales roles. Pair with an operator who closes the back end.",
    howToShowUp:
      "Loud and unmissable, but pick one signature so the boldness reads as identity rather than volume.",
    partnerFit: ["IMRS", "IVRS", "OMRS"],
  },
  OMRS: {
    code: "OMRS",
    name: "The Steward",
    tagline: "A reliable master who serves and elevates others.",
    identity:
      "You are the reason things run. You take responsibility that nobody assigned you, and the people around you perform better than they would have alone. Your name is on less than it should be.",
    edge: "Dependability. You are the safest pair of hands in the room.",
    strengths: [
      "Delivers consistently, at quality, without drama",
      "Develops other people's capability as a by-product",
      "Trusted with what matters most",
    ],
    blindSpots: [
      "You take the credit last and it costs you real money",
      "Service becomes self-erasure",
      "You stay in a role you outgrew because leaving feels like abandonment",
    ],
    idealRooms: [
      "Operations and chief-of-staff seats",
      "Client service and account leadership",
      "Team and talent development",
    ],
    monetizationTilt:
      "Retainers, fractional leadership, and long-term client relationships. Price on responsibility held, not tasks done.",
    howToShowUp:
      "Understated authority. Your image should say safe hands — and your marketing must say your name out loud, because you won't by instinct.",
    partnerFit: ["IVBC", "OVBC", "IMRC"],
  },
  OMRC: {
    code: "OMRC",
    name: "The Operator",
    tagline: "Gets polished results, fast.",
    identity:
      "You take the chaos and hand back a working machine, quickly. You are not precious about how it looks in progress as long as it looks right when it's done. Speed and standards are not in tension for you.",
    edge: "Execution at pace. You compress timelines without dropping quality.",
    strengths: [
      "Turns ambiguity into a plan within a day",
      "Ships fast without leaving a mess behind",
      "Makes other people's ideas real",
    ],
    blindSpots: [
      "You solve the presented problem instead of the real one",
      "You out-execute your own strategy and end up busy",
      "You build other people's assets and not your own",
    ],
    idealRooms: [
      "COO and head-of-delivery seats",
      "Scaling teams and turnarounds",
      "Agency and studio leadership",
    ],
    monetizationTilt:
      "Productized services and fractional operating roles. Package the repeatable machine and sell it more than once.",
    howToShowUp:
      "Sharp, current, efficient. Your image should read expensive and quick — the visual equivalent of a fast decision.",
    partnerFit: ["IVRS", "IVBS", "IMBS"],
  },
  OMBS: {
    code: "OMBS",
    name: "The Sovereign",
    tagline: "A commanding builder. The ruler archetype.",
    identity:
      "You take the seat. You build the structure, you set the terms, and you carry the consequences without complaining about them. Authority isn't something you're seeking — it's something you already behave as though you have.",
    edge: "Command. You make the decision the room was waiting for.",
    strengths: [
      "Decides under uncertainty and owns the outcome",
      "Builds durable institutions rather than projects",
      "Sets a standard that others organize around",
    ],
    blindSpots: [
      "Control blocks the scale you say you want",
      "Certainty in public makes it hard to change course in private",
      "You confuse loyalty with agreement",
    ],
    idealRooms: [
      "Ownership and board seats",
      "Category leadership",
      "High-stakes negotiation",
    ],
    monetizationTilt:
      "Ownership economics — equity, licensing, and holding structures. Own the asset, not the assignment.",
    howToShowUp:
      "Tailored, deliberate, expensive. Every element intentional. Your presence should settle a room rather than compete in it.",
    partnerFit: ["IVRC", "IMRC", "IVBC"],
  },
  OMBC: {
    code: "OMBC",
    name: "The Champion",
    tagline: "A bold performer who wins in public.",
    identity:
      "You get better when people are watching. You want the ball at the end of the game, and you have done the unglamorous work that earns you the right to ask for it. Competition sharpens you rather than rattling you.",
    edge: "Presence under pressure. You perform when it counts.",
    strengths: [
      "Raises your level in high-stakes, visible moments",
      "Converts — closes deals, rooms, and stages",
      "Recovers from public failure faster than most",
    ],
    blindSpots: [
      "Without a scoreboard you drift",
      "You mistake winning the moment for building the asset",
      "The performance can outrun the preparation",
    ],
    idealRooms: [
      "Sales leadership and pitch rooms",
      "Stage, camera, and competition formats",
      "Category-defining public launches",
    ],
    monetizationTilt:
      "Performance-based upside — commission, endorsement, and high-ticket closing. Get paid on results, not on presence.",
    howToShowUp:
      "Bold and camera-ready with a signature others can imitate. Build a look that photographs — you will be photographed.",
    partnerFit: ["IVRS", "IMRS", "IVRC"],
  },
};

export const ARCHETYPE_LIST = Object.values(ARCHETYPES);

/* ============================================================
   STYLE ARCHETYPE (1 of 5) — Brand stage, B1
   ============================================================ */

export const STYLE_ARCHETYPES = [
  "The Icon of Restraint",
  "The Statement Maker",
  "The Approachable Original",
  "The Authority",
  "The Creative Maverick",
] as const;

export type StyleArchetype = (typeof STYLE_ARCHETYPES)[number];

const STYLE_VOTES: Record<string, StyleArchetype> = {
  // b1_room_read
  "Refined and understated": "The Icon of Restraint",
  "Bold and unforgettable": "The Statement Maker",
  "Warm and approachable": "The Approachable Original",
  "Sharp and authoritative": "The Authority",
  "Creative and original": "The Creative Maverick",
  // b1_wardrobe
  "A few perfect timeless pieces": "The Icon of Restraint",
  "Statement items that turn heads": "The Statement Maker",
  "Comfort that still looks intentional": "The Approachable Original",
  "Structured, tailored, precise": "The Authority",
  "Unexpected mixes and texture": "The Creative Maverick",
  // b1_color
  "Black, ivory, camel — quiet luxury": "The Icon of Restraint",
  "Deep jewel tones and contrast": "The Statement Maker",
  "Earth tones and soft neutrals": "The Approachable Original",
  "Charcoal, navy, crisp white": "The Authority",
  "Whatever breaks the rules": "The Creative Maverick",
  // b1_compliment
  "You always look so put-together.": "The Icon of Restraint",
  "You have such a signature look.": "The Statement Maker",
  "You seem so comfortable in your skin.": "The Approachable Original",
  "You look like you're in charge.": "The Authority",
  "I could never pull that off — but you do.": "The Creative Maverick",
};

/** Tie-break order is fixed so the result is repeatable. */
export function resolveStyleArchetype(answers: AnswerSet): StyleArchetype | null {
  const tally = new Map<StyleArchetype, number>(
    STYLE_ARCHETYPES.map((s) => [s, 0]),
  );
  let answered = 0;
  for (const key of ["b1_room_read", "b1_wardrobe", "b1_color", "b1_compliment"]) {
    const value = asString(answers[key]);
    const style = STYLE_VOTES[value];
    if (style) {
      tally.set(style, (tally.get(style) ?? 0) + 1);
      answered += 1;
    }
  }
  if (answered === 0) return null;
  let winner: StyleArchetype = STYLE_ARCHETYPES[0];
  let best = -1;
  for (const style of STYLE_ARCHETYPES) {
    const score = tally.get(style) ?? 0;
    if (score > best) {
      best = score;
      winner = style;
    }
  }
  return winner;
}

/* ============================================================
   COLOR PALETTE — from b1_color
   ============================================================ */

export type Palette = { name: string; swatches: string[]; note: string };

const PALETTES: Record<string, Palette> = {
  "Black, ivory, camel — quiet luxury": {
    name: "Quiet Luxury",
    swatches: ["#111111", "#F3EFE6", "#C8B89A", "#8A7A5C"],
    note: "Restraint reads as expensive. Build on tone, not colour.",
  },
  "Deep jewel tones and contrast": {
    name: "Jewel Contrast",
    swatches: ["#0F0F14", "#3B1F4D", "#7A1F2B", "#C9A15A"],
    note: "One saturated tone per outfit against a near-black base.",
  },
  "Earth tones and soft neutrals": {
    name: "Grounded Neutral",
    swatches: ["#2B2419", "#8A6F4B", "#C8B79A", "#E7DDC9"],
    note: "Warmth and texture do the work. Avoid pure black.",
  },
  "Charcoal, navy, crisp white": {
    name: "Executive Sharp",
    swatches: ["#1C1F26", "#26324A", "#F6F6F6", "#9AA3B0"],
    note: "Precision palette. Fit matters more than colour here.",
  },
  "Whatever breaks the rules": {
    name: "Signature Disruption",
    swatches: ["#0D0D0F", "#E23B3B", "#2BD6C9", "#F4D35E"],
    note: "Keep the base disciplined so the disruption lands as a choice.",
  },
};

export function resolvePalette(answers: AnswerSet): Palette | null {
  const value = asString(answers["b1_color"]);
  return PALETTES[value] ?? null;
}

/* ============================================================
   ENERGY PROFILE — sun sign, life path, expression
   ============================================================ */

const ZODIAC: Array<{ sign: string; from: [number, number]; to: [number, number] }> = [
  { sign: "Capricorn", from: [12, 22], to: [1, 19] },
  { sign: "Aquarius", from: [1, 20], to: [2, 18] },
  { sign: "Pisces", from: [2, 19], to: [3, 20] },
  { sign: "Aries", from: [3, 21], to: [4, 19] },
  { sign: "Taurus", from: [4, 20], to: [5, 20] },
  { sign: "Gemini", from: [5, 21], to: [6, 20] },
  { sign: "Cancer", from: [6, 21], to: [7, 22] },
  { sign: "Leo", from: [7, 23], to: [8, 22] },
  { sign: "Virgo", from: [8, 23], to: [9, 22] },
  { sign: "Libra", from: [9, 23], to: [10, 22] },
  { sign: "Scorpio", from: [10, 23], to: [11, 21] },
  { sign: "Sagittarius", from: [11, 22], to: [12, 21] },
];

export function sunSign(month: number, day: number): string | null {
  if (!month || !day) return null;
  for (const z of ZODIAC) {
    const [fm, fd] = z.from;
    const [tm, td] = z.to;
    if (fm === tm) {
      if (month === fm && day >= fd && day <= td) return z.sign;
    } else if (fm > tm) {
      // wraps the year (Capricorn)
      if ((month === fm && day >= fd) || (month === tm && day <= td)) return z.sign;
    } else {
      if ((month === fm && day >= fd) || (month === tm && day <= td)) return z.sign;
    }
  }
  return null;
}

function reduceNumber(n: number): number {
  while (n > 9 && n !== 11 && n !== 22 && n !== 33) {
    n = String(n)
      .split("")
      .reduce((sum, d) => sum + Number(d), 0);
  }
  return n;
}

/** Life Path from the birth date. Master numbers 11 / 22 / 33 are preserved. */
export const lifePath = calculateLifePath;

const LETTER_VALUES: Record<string, number> = {
  a: 1, j: 1, s: 1,
  b: 2, k: 2, t: 2,
  c: 3, l: 3, u: 3,
  d: 4, m: 4, v: 4,
  e: 5, n: 5, w: 5,
  f: 6, o: 6, x: 6,
  g: 7, p: 7, y: 7,
  h: 8, q: 8, z: 8,
  i: 9, r: 9,
};

/** Expression / Destiny number from the FULL BIRTH NAME. */
export function expressionNumber(fullName?: string): number | null {
  if (!fullName) return null;
  const letters = fullName.toLowerCase().replace(/[^a-z]/g, "");
  if (!letters.length) return null;
  const sum = letters.split("").reduce((s, ch) => s + (LETTER_VALUES[ch] ?? 0), 0);
  return reduceNumber(sum);
}

export const NUMBER_MEANINGS = LIFE_PATH_MEANINGS;

export type EnergyProfile = {
  sunSign: string | null;
  moonSign: string | null;
  risingSign: string | null;
  lifePath: number | null;
  lifePathMeaning: ReturnType<typeof describeLifePath>;
  expression: number | null;
  expressionMeaning: { title: string; reading: string } | null;
  element: string | null;
  chart: AstrologyChart | null;
  explanations: string[];
  moonRisingStatus: "calculated" | "needs_birth_time_and_city" | "verify_cusp";
};

export function resolveEnergyProfile(
  answers: AnswerSet,
  fullBirthName?: string,
): EnergyProfile {
  const birth = (answers["a2_birth"] as BirthData) ?? {};
  const chart = calculateAstrology(birth);
  const lp = calculateLifePath(birth.date);
  const ex = expressionNumber(fullBirthName);
  const explanations = chart
    ? [
        explainPosition("sun", chart.sun.sign),
        explainPosition("moon", chart.moon.sign),
        explainPosition("rising", chart.rising.sign),
      ]
    : [];
  const verifyCusp = Boolean(chart && [chart.sun, chart.moon, chart.rising].some((item) => item.cusp));
  return {
    sunSign: chart?.sun.sign ?? null,
    moonSign: chart?.moon.sign ?? null,
    risingSign: chart?.rising.sign ?? null,
    lifePath: lp,
    lifePathMeaning: describeLifePath(lp),
    expression: ex,
    expressionMeaning: ex ? NUMBER_MEANINGS[ex] ?? null : null,
    element: elementForSign(chart?.sun.sign) ?? null,
    chart,
    explanations,
    moonRisingStatus: chart
      ? verifyCusp ? "verify_cusp" : "calculated"
      : "needs_birth_time_and_city",
  };
}

/* ============================================================
   MONETIZATION — top 3 income streams from L2
   ============================================================ */

export type IncomeStream = {
  id: string;
  label: string;
  description: string;
  firstMove: string;
};

const STREAM_RULES: Array<
  IncomeStream & { skills: string[]; assets: string[] }
> = [
  {
    id: "audience",
    label: "Audience Monetization",
    description:
      "Your attention is already an asset. Convert it directly through sponsorship, affiliate, and owned offers.",
    firstMove: "Publish one recurring format weekly for 90 days and put a single offer under it.",
    skills: ["Creating content", "Teaching / speaking"],
    assets: ["An audience", "A unique story"],
  },
  {
    id: "advisory",
    label: "Consulting & Advisory",
    description:
      "People already ask your opinion. Charge for the judgement, not the deliverable.",
    firstMove: "Name one problem you solve, set a monthly retainer, and take it to five people who already trust you.",
    skills: ["Advising / consulting", "Organizing / operating"],
    assets: ["A specialized skill", "A proven result / track record", "Industry relationships"],
  },
  {
    id: "coaching",
    label: "Coaching & Cohort Programs",
    description:
      "Package the transformation you've already produced and run it for a group.",
    firstMove: "Run one paid pilot cohort of eight people at a price that makes you slightly uncomfortable.",
    skills: ["Teaching / speaking", "Advising / consulting"],
    assets: ["A proven result / track record", "Access to a community"],
  },
  {
    id: "productized",
    label: "Productized Service",
    description:
      "Turn your best repeatable work into a fixed scope at a fixed price.",
    firstMove: "Write one scope, one price, one turnaround time. Sell it three times before changing anything.",
    skills: ["Designing / making", "Building products", "Organizing / operating"],
    assets: ["A specialized skill", "Time & energy"],
  },
  {
    id: "digital",
    label: "Digital Products & Courses",
    description:
      "Sell the knowledge asset once and deliver it many times.",
    firstMove: "Presell a short, specific course to your list before you build a single lesson.",
    skills: ["Teaching / speaking", "Creating content", "Building products"],
    assets: ["An audience", "A specialized skill"],
  },
  {
    id: "brand",
    label: "Brand & Product Line",
    description:
      "Your taste becomes a product people can own.",
    firstMove: "Launch one limited drop of a single item. Prove demand before you build inventory.",
    skills: ["Designing / making", "Building products", "Selling / closing"],
    assets: ["Capital", "An audience", "A unique story"],
  },
  {
    id: "brokerage",
    label: "Deal Flow & Brokerage",
    description:
      "You know who should meet whom. Get paid for the introduction and the structure around it.",
    firstMove: "Formalize one referral agreement in writing this month, with a defined fee.",
    skills: ["Connecting people", "Selling / closing"],
    assets: ["Industry relationships", "Access to a community"],
  },
  {
    id: "equity",
    label: "Partnerships & Equity Advisory",
    description:
      "Trade your judgement and access for ownership rather than fees.",
    firstMove: "Convert one existing advisory relationship into a small equity or revenue-share position.",
    skills: ["Advising / consulting", "Selling / closing", "Connecting people"],
    assets: ["Capital", "Industry relationships", "A proven result / track record"],
  },
  {
    id: "stage",
    label: "Speaking & Stage",
    description:
      "Your story in a room, priced properly.",
    firstMove: "Write one signature talk, deliver it free three times, then set a fee and never speak free again without a reason.",
    skills: ["Teaching / speaking"],
    assets: ["A unique story", "A proven result / track record"],
  },
];

export function resolveIncomeStreams(answers: AnswerSet, top = 3): IncomeStream[] {
  const skills = new Set(asArray(answers["l2_skills"]));
  const assets = new Set(asArray(answers["l2_assets"]));
  if (skills.size === 0 && assets.size === 0) return [];

  const scored = STREAM_RULES.map((rule, index) => {
    const skillHits = rule.skills.filter((s) => skills.has(s)).length;
    const assetHits = rule.assets.filter((a) => assets.has(a)).length;
    return {
      stream: {
        id: rule.id,
        label: rule.label,
        description: rule.description,
        firstMove: rule.firstMove,
      },
      score: skillHits * 2 + assetHits,
      index, // stable tie-break: declaration order
    };
  });

  return scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .slice(0, top)
    .map((s) => s.stream);
}

/* ============================================================
   BRAND STATEMENT
   ============================================================ */

export function assembleBrandStatement(answers: AnswerSet): string | null {
  const edited = asString(answers["b3_edit"]).trim();
  if (edited) return edited;
  const who = asString(answers["b3_who"]).trim();
  const what = asString(answers["b3_what"]).trim();
  const how = asString(answers["b3_how"]).trim();
  if (!who || !what || !how) return null;
  return `I help ${who} ${what}, through ${how}.`;
}

/* ============================================================
   ACCOUNTABILITY PARTNER MATCHING
   ============================================================ */

export type PartnerPreference =
  | "Ahead of me — pulls me up"
  | "At my level — grows with me"
  | "Complementary — different strengths"
  | "Tough — holds me to it";

/**
 * Returns a match score 0-100 between two members.
 * Higher is a better pairing. Intended as the ranking input for the
 * Leverage-stage auto-suggest, not an automatic assignment.
 */
export function partnerMatchScore(
  self: { code: string; preference: string; progress: number; doors: string[] },
  other: { code: string; preference: string; progress: number; doors: string[] },
): number {
  let score = 0;
  const selfArch = ARCHETYPES[self.code];

  // 1. Explicit preference (40 points)
  const gap = other.progress - self.progress;
  if (self.preference.startsWith("Ahead of me") && gap >= 15) score += 40;
  else if (self.preference.startsWith("At my level") && Math.abs(gap) <= 15) score += 40;
  else if (self.preference.startsWith("Complementary")) {
    const diff = countLetterDifferences(self.code, other.code);
    score += diff >= 2 ? 40 : diff * 15;
  } else if (self.preference.startsWith("Tough")) {
    // Bold + Catalyst partners hold people to it
    score += (other.code[2] === "B" ? 20 : 0) + (other.code[3] === "C" ? 20 : 0);
  }

  // 2. Engine-recommended pairing (30 points)
  if (selfArch?.partnerFit.includes(other.code)) score += 30;

  // 3. Complementary energy — one Inward, one Outward (15 points)
  if (self.code[0] !== other.code[0]) score += 15;

  // 4. Overlapping needs create something to talk about (15 points)
  const shared = self.doors.filter((d) => other.doors.includes(d)).length;
  score += Math.min(shared * 5, 15);

  return Math.min(score, 100);
}

function countLetterDifferences(a: string, b: string): number {
  let diff = 0;
  for (let i = 0; i < 4; i += 1) if (a[i] !== b[i]) diff += 1;
  return diff;
}

/* ============================================================
   PROFILE ASSEMBLY
   Twelve sections, one per module. Sections stay locked until
   their module is complete.
   ============================================================ */

export type ProfileSection = {
  key: string;
  moduleKey: string;
  stage: "A" | "B" | "L" | "E";
  title: string;
  locked: boolean;
  content: Record<string, unknown> | null;
};

export type AssembledProfile = {
  identity: IdentityResult | null;
  styleArchetype: StyleArchetype | null;
  palette: Palette | null;
  energy: EnergyProfile;
  brandSignal: ReturnType<typeof scoreBrandSignal>;
  brandLedger: ReturnType<typeof scoreBrandLedger>;
  incomeStreams: IncomeStream[];
  brandStatement: string | null;
  sections: ProfileSection[];
  completion: number;
  complete: boolean;
};

export function assembleProfile(input: {
  answers: AnswerSet;
  completedModules: string[];
  fullBirthName?: string;
}): AssembledProfile {
  const { answers, completedModules, fullBirthName } = input;
  const done = new Set(completedModules);
  const analyzeComplete = ["A1", "A2", "A3"].every((k) => done.has(k));
  const brandComplete = ["B0", "B1", "B2", "B3", "B4"].every((k) => done.has(k));
  const styleArchetype = resolveStyleArchetype(answers);
  const palette = resolvePalette(answers);
  const energy = resolveEnergyProfile(answers, fullBirthName);
  const computedAnswers: AnswerSet = {
    ...answers,
    a2_derived_element: energy.element
      ? `${energy.element} — calculated from your Sun sign`
      : null,
  };
  const identity = analyzeComplete ? resolveIdentity(computedAnswers, brandComplete) : null;
  const brandSignal = scoreBrandSignal(answers);
  const brandLedger = scoreBrandLedger(answers);
  const incomeStreams = resolveIncomeStreams(answers);
  const brandStatement = assembleBrandStatement(answers);

  const definitions: Array<{
    key: string;
    moduleKey: string;
    stage: ProfileSection["stage"];
    title: string;
    build: () => Record<string, unknown>;
  }> = [
    {
      key: "personality_snapshot",
      moduleKey: "A1",
      stage: "A",
      title: "Personality Snapshot",
      build: () => ({
        mbti: answers["a1_mbti"] ?? null,
        strengths: asArray(answers["a1_strengths"]),
        decisionStyle: answers["a1_decide"] ?? null,
        workRhythm: answers["a1_pace"] ?? null,
        riskPosture: answers["a1_risk"] ?? null,
        friendsDescription: answers["a1_friend_line"] ?? null,
      }),
    },
    {
      key: "energy_profile",
      moduleKey: "A2",
      stage: "A",
      title: "Energy Profile",
      build: () => ({ ...energy, drains: asArray(answers["a2_drains"]) }),
    },
    {
      key: "self_discovery",
      moduleKey: "A3",
      stage: "A",
      title: "Self-Discovery Profile",
      build: () => ({
        values: asArray(answers["a3_values"]),
        lifeTheme: answers["a3_theme"] ?? null,
        coreDriver: answers["a3_driver"] ?? null,
        definingMoment: answers["a3_defining"] ?? null,
        quietWin: answers["a3_proud"] ?? null,
        theGap: answers["a3_gap"] ?? null,
        ifYouCouldNotFail: answers["a3_dream"] ?? null,
      }),
    },
    {
      key: "brand_signal",
      moduleKey: "B0",
      stage: "B",
      title: "Brand Signal Code",
      build: () => ({
        ...brandSignal,
        identityTension: describeSignalTension(identity?.code, brandSignal),
      }),
    },
    {
      key: "style_archetype",
      moduleKey: "B1",
      stage: "B",
      title: "Style Archetype",
      build: () => ({
        archetype: styleArchetype,
        performanceContexts: asArray(answers["b1_contexts"]),
        currentLookAudit: answers["b1_current_look"] ?? null,
      }),
    },
    {
      key: "image_plan",
      moduleKey: "B2",
      stage: "B",
      title: "Image Plan",
      build: () => ({
        palette,
        silhouette: answers["b2_silhouette"] ?? null,
        boldness: answers["b2_boldness"] ?? null,
        buyingOrder: asArray(answers["b2_invest"]),
        budget: answers["b2_budget"] ?? null,
        digitalPresence: answers["b2_presence"] ?? null,
      }),
    },
    {
      key: "brand_statement",
      moduleKey: "B3",
      stage: "B",
      title: "Personal Brand Statement",
      build: () => ({ statement: brandStatement, voice: answers["b3_voice"] ?? null }),
    },
    {
      key: "brand_ledger",
      moduleKey: "B4",
      stage: "B",
      title: "Brand Asset Ledger",
      build: () => ({ ...brandLedger }),
    },
    {
      key: "network_map",
      moduleKey: "L1",
      stage: "L",
      title: "Network Map",
      build: () => ({
        keyContacts: answers["l1_top5"] ?? null,
        virtualMentors: answers["l1_mentors"] ?? null,
        networkingStyle: answers["l1_net_style"] ?? null,
        partnerPreference: answers["l1_partner"] ?? null,
        doorsNeeded: asArray(answers["l1_doors"]),
      }),
    },
    {
      key: "monetization_roadmap",
      moduleKey: "L2",
      stage: "L",
      title: "Monetization Roadmap",
      build: () => ({
        streams: incomeStreams,
        model: answers["l2_model"] ?? null,
        twelveMonthGoal: answers["l2_goal"] ?? null,
        statedBlocker: answers["l2_blocker"] ?? null,
      }),
    },
    {
      key: "opportunity_list",
      moduleKey: "L3",
      stage: "L",
      title: "Opportunity List",
      build: () => ({
        idealCustomer: answers["l3_ideal_customer"] ?? null,
        signatureService: answers["l3_ideal_service"] ?? null,
        ecosystemIntent: asArray(answers["l3_ecosystem"]),
        referralPath: answers["l3_referral"] ?? null,
        futureTestimonial: answers["l3_endorsement"] ?? null,
      }),
    },
    {
      key: "activation_goal",
      moduleKey: "E1",
      stage: "E",
      title: "Activation Goal",
      build: () => ({
        goal: answers["e1_goal"] ?? null,
        horizon: answers["e1_horizon"] ?? null,
        activationMove: answers["e1_activation"] ?? null,
        visibilityReadiness: answers["e1_visibility"] ?? null,
        finishLine: answers["e1_success"] ?? null,
      }),
    },
    {
      key: "ninety_day_blueprint",
      moduleKey: "E2",
      stage: "E",
      title: "90-Day Blueprint",
      build: () => ({
        month1: answers["e2_m1"] ?? null,
        month2: answers["e2_m2"] ?? null,
        month3: answers["e2_m3"] ?? null,
        weeklyHabits: asArray(answers["e2_weekly"]),
        derailer: answers["e2_derailer"] ?? null,
        unstickPlan: answers["e2_if_stuck"] ?? null,
      }),
    },
    {
      key: "accountability_plan",
      moduleKey: "E3",
      stage: "E",
      title: "Accountability Plan",
      build: () => ({
        checkInRhythm: answers["e3_checkin"] ?? null,
        momentumSource: answers["e3_momentum"] ?? null,
        ongoingSupport: asArray(answers["e3_support"]),
        commitment: answers["e3_commitment"] ?? null,
      }),
    },
  ];

  const sections: ProfileSection[] = definitions.map((def) => {
    const locked = !done.has(def.moduleKey);
    return {
      key: def.key,
      moduleKey: def.moduleKey,
      stage: def.stage,
      title: def.title,
      locked,
      content: locked ? null : def.build(),
    };
  });

  const completion = Math.round((done.size / 14) * 100);

  return {
    identity,
    styleArchetype,
    palette,
    energy,
    brandSignal,
    brandLedger,
    incomeStreams,
    brandStatement,
    sections,
    completion,
    complete: done.size === 14,
  };
}

/* ============================================================
   AI GUIDE — grounding context
   The LLM receives a decided result. It writes and coaches.
   It does not type anyone.
   ============================================================ */

export const AI_GUIDE_SYSTEM_PROMPT = `You are the Able1Self Guide — a personal development coach inside the Able1Self member portal.

WHO YOU ARE TALKING TO
You are speaking to one member. Everything in the MEMBER PROFILE block below came from their own answers and from the Able1Self identity engine. Speak as someone who knows them, not as a general assistant.

HARD RULES
1. Never re-type the member. Their Core Identity Archetype, Style Archetype, Energy Profile and income streams are already decided by the engine. Explain them, apply them, build on them — never recalculate or contradict them.
2. Ground every answer in something specific from their profile. Reference their actual values, their stated driver, their goal, their derailer. Generic advice is a failure.
3. Stay in scope: personal development, identity, image, network, monetization strategy, and execution against their own 90-day plan.
4. No medical, legal, or specific financial-product advice. If asked, say plainly that it is outside what you do and point them toward a qualified professional.
5. If they express real distress, drop the coaching frame, respond with care, and encourage them to reach out to someone qualified.
6. Give them the next action, not a lecture. End with one concrete thing they can do this week.

VOICE
Direct, warm, and specific. Lead with the answer. No filler openers. Never define something by what it is not — state what it is.`;

export function buildGuideContext(profile: AssembledProfile, displayName: string): string {
  const lines: string[] = ["MEMBER PROFILE", `Name: ${displayName}`];

  if (profile.identity) {
    const a = profile.identity.archetype;
    lines.push(
      `Core Identity Archetype: ${a.code} — ${a.name}${profile.identity.provisional ? " (PROVISIONAL — Brand stage not complete)" : ""}`,
      `Archetype identity: ${a.identity}`,
      `Their edge: ${a.edge}`,
      `Known blind spots: ${a.blindSpots.join("; ")}`,
      `Monetization tilt: ${a.monetizationTilt}`,
      `Axes: ${profile.identity.axes.map((x) => `${x.label}=${x.poleName}`).join(", ")}`,
    );
  }
  if (profile.styleArchetype) lines.push(`Style Archetype: ${profile.styleArchetype}`);
  if (profile.brandStatement) lines.push(`Brand statement: ${profile.brandStatement}`);

  const energy = profile.energy;
  if (energy.sunSign) lines.push(`Sun sign: ${energy.sunSign}`);
  if (energy.lifePath && energy.lifePathMeaning) {
    lines.push(
      `Life Path ${energy.lifePath} — ${energy.lifePathMeaning.title}: ${energy.lifePathMeaning.reading}`,
    );
  }
  if (energy.expression && energy.expressionMeaning) {
    lines.push(
      `Expression ${energy.expression} — ${energy.expressionMeaning.title}: ${energy.expressionMeaning.reading}`,
    );
  }

  for (const section of profile.sections) {
    if (section.locked || !section.content) continue;
    lines.push(`${section.title}: ${JSON.stringify(section.content)}`);
  }

  if (profile.incomeStreams.length) {
    lines.push(
      `Top income streams: ${profile.incomeStreams.map((s) => `${s.label} (first move: ${s.firstMove})`).join(" | ")}`,
    );
  }

  lines.push(`Program completion: ${profile.completion}%`);
  return lines.join("\n");
}

/* ============================================================
   NARRATIVE SYNTHESIS PROMPT
   Used once, at 100%, to write the profile's closing narrative.
   ============================================================ */

export function buildSynthesisPrompt(
  profile: AssembledProfile,
  displayName: string,
): string {
  return `${buildGuideContext(profile, displayName)}

TASK
Write ${displayName}'s Personalized Identity Profile narrative — the closing synthesis of their completed ABLE program.

Structure it in five short parts, no headings longer than four words:
1. Who they are — lead with their Core Identity Archetype and make it feel earned, using their own defining moment and top value.
2. What they've been carrying — name the gap between how they present and who they are, in their own words.
3. What they're built to do — connect their archetype and top income stream into one clear direction.
4. How they should show up — image, presence, and the rooms they belong in.
5. The next 90 days — restate their goal, their derailer, and the single move that matters most.

Close on the phrase "one self" — aligned internally and externally. That phrase is the payoff of the brand name; land it, don't explain it.

Between 500 and 700 words. Second person. No emojis. Never define anything by negation. Every claim traceable to their answers.`;
}
