/**
 * ABLE1SELF — PROGRAM DATA
 * Full question bank for the member portal: 4 stages, 14 modules, every question,
 * every option, every scoring tag.
 *
 * Version 2.0 — July 31, 2026 — B. Amechi (High Lvl Management)
 * Replaces the placeholder 3-question-per-module set.
 *
 * DESIGN RULE (do not break this):
 *   Anything that determines a result is STRUCTURED (choice / multi / rank / scale).
 *   Free text is FLAVOR — it personalizes the AI's writing, it never decides the type.
 *
 * BACKWARD COMPATIBILITY:
 *   `type` is kept as the legacy render primitive ("choice" | "text" | "scale") so the
 *   existing renderer keeps working with zero changes. `control` is the real widget.
 *   Upgrade the renderer to switch on `control` when ready; until then every question
 *   degrades gracefully to a choice, a text field, or a slider.
 */

import { rejectionBrands, signalPairs } from "./brand-signal";
import { brandLedgerItems } from "./brand-ledger";

export type QuestionControl =
  | "choice" // pick one
  | "multi" // pick up to N
  | "rank" // pick and order top N
  | "scale" // 1-5 slider with pole labels
  | "text" // single line
  | "longtext" // paragraph
  | "birth" // birth date + time + city (composite)
  | "mbti" // 4-letter type entry, or link out to the free test
  | "derived"; // read-only computed result rendered inline

/** SCORED feeds the engine. FLAVOR feeds the AI only. DERIVED is output, not input. */
export type ScoreTag = "SCORED" | "FLAVOR" | "DERIVED";

export type Question = {
  key: string;
  prompt: string;
  guidance: string;
  /** Legacy render primitive. Safe fallback for the current renderer. */
  type: "choice" | "text" | "scale";
  /** Real widget. Switch on this once the renderer is upgraded. */
  control: QuestionControl;
  scoring: ScoreTag;
  options?: string[];
  /** multi: max selections */
  max?: number;
  /** rank: how many to pick, in order */
  rank?: number;
  scaleMin?: number;
  scaleMax?: number;
  scaleLow?: string;
  scaleHigh?: string;
  stateLabels?: string[];
  /** derived: which computed block to render */
  derivedKey?: string;
  /** external resource, e.g. the free 16Personalities test */
  link?: { label: string; url: string };
  required?: boolean;
};

export type ProgramModule = {
  key: string;
  stage: "A" | "B" | "L" | "E";
  stageName: string;
  order: number;
  title: string;
  description: string;
  /** the profile section this module writes when marked complete */
  deliverable: string;
  questions: Question[];
};

export type Stage = {
  key: "A" | "B" | "L" | "E";
  name: string;
  order: number;
  whatItDoes: string;
  /** intentionally open-ended — ship as a stem, do not complete the sentence */
  transformationPromise: string;
  quote: { text: string; attribution: string; status: "LOCKED" | "PROPOSED" };
};

/* ============================================================
   STAGES — the four-stage spine, with the stage-opening quotes
   ============================================================ */

export const stages: Stage[] = [
  {
    key: "A",
    name: "Analyze",
    order: 1,
    whatItDoes:
      "Deep self-awareness — personality, values, energy, story.",
    transformationPromise: "By the end, I will know…",
    quote: {
      text: "If you're taught you can't do anything, you won't do anything. I was taught I can do everything.",
      attribution: "Kanye West",
      status: "LOCKED",
    },
  },
  {
    key: "B",
    name: "Brand",
    order: 2,
    whatItDoes:
      "Define identity, image, presence, and the story the world sees.",
    transformationPromise: "By the end, I will have…",
    quote: {
      text: "Fashion is a form of self-expression.",
      attribution: "Virgil Abloh",
      status: "PROPOSED",
    },
  },
  {
    key: "L",
    name: "Leverage",
    order: 3,
    whatItDoes:
      "Map network, relationships, and opportunity. Position for access.",
    transformationPromise: "By the end, I will understand…",
    quote: {
      text: "We tend to network up when we really should be networking across.",
      attribution: "Issa Rae",
      status: "LOCKED",
    },
  },
  {
    key: "E",
    name: "Embark",
    order: 4,
    whatItDoes:
      "Reverse-engineer the vision into a real 90-day blueprint and execute.",
    transformationPromise: "By the end, I am ready to…",
    quote: {
      text: "Goals without action aren't goals. They're just dreams.",
      attribution: "Kobe Bryant",
      status: "PROPOSED",
    },
  },
];

export const stageMap = Object.fromEntries(
  stages.map((stage) => [stage.key, stage]),
) as Record<Stage["key"], Stage>;

/* ============================================================
   SHARED OPTION BANKS
   ============================================================ */

/** A3 core values — pick and order 5. */
export const CORE_VALUES = [
  "Freedom",
  "Mastery",
  "Family",
  "Wealth",
  "Integrity",
  "Creativity",
  "Impact",
  "Faith",
  "Discipline",
  "Loyalty",
  "Adventure",
  "Peace",
  "Recognition",
  "Knowledge",
  "Health",
  "Independence",
  "Community",
  "Justice",
  "Beauty",
  "Legacy",
] as const;

export const MBTI_TYPES = [
  "INTJ", "INTP", "ENTJ", "ENTP",
  "INFJ", "INFP", "ENFJ", "ENFP",
  "ISTJ", "ISFJ", "ESTJ", "ESFJ",
  "ISTP", "ISFP", "ESTP", "ESFP",
] as const;

/* ============================================================
   THE QUESTION BANK — 14 MODULES
   ============================================================ */

export const programModules: ProgramModule[] = [
  /* ===================== STAGE A — ANALYZE ===================== */
  {
    key: "A1",
    stage: "A",
    stageName: "Analyze",
    order: 1,
    title: "Know Your Type",
    description:
      "Identify the pattern you naturally use to make decisions, spend energy, and create momentum.",
    deliverable: "Personality Snapshot",
    questions: [
      {
        key: "a1_mbti",
        prompt: "Your personality type",
        guidance:
          "If you know your 16Personalities / Myers-Briggs type, select it. If not, take the free test and come back with your four letters.",
        type: "choice",
        control: "mbti",
        scoring: "FLAVOR",
        options: [...MBTI_TYPES, "I don't know it yet"],
        link: {
          label: "Take the free test →",
          url: "https://www.16personalities.com/free-personality-test",
        },
      },
      {
        key: "a1_social_energy",
        prompt: "After a big social event, you feel…",
        guidance: "Answer for how you actually feel, not how you think you should.",
        type: "scale",
        control: "scale",
        scoring: "SCORED",
        scaleMin: 1,
        scaleMax: 5,
        scaleLow: "Drained, need to recharge alone",
        scaleHigh: "Energized, wanting more",
        required: true,
      },
      {
        key: "a1_plan_spont",
        prompt: "You'd rather…",
        guidance: "There is no better answer here. Only a truer one.",
        type: "scale",
        control: "scale",
        scoring: "SCORED",
        scaleMin: 1,
        scaleMax: 5,
        scaleLow: "Have a clear plan",
        scaleHigh: "Keep options open",
        required: true,
      },
      {
        key: "a1_decide",
        prompt: "When you make a hard decision, you lead with…",
        guidance: "Think of the last genuinely difficult call you made.",
        type: "choice",
        control: "choice",
        scoring: "SCORED",
        options: [
          "Logic and analysis",
          "Values and how people are affected",
          "A gut read of the moment",
          "A blend depending on the stakes",
        ],
        required: true,
      },
      {
        key: "a1_strengths",
        prompt: "Which of these feel most like your natural strengths?",
        guidance: "Pick up to three. Choose what comes easily, not what you've trained.",
        type: "choice",
        control: "multi",
        scoring: "SCORED",
        max: 3,
        options: [
          "Reading people",
          "Strategy / seeing ahead",
          "Getting things done",
          "Ideas / imagination",
          "Bringing people together",
          "Craft / attention to detail",
          "Persuasion",
          "Staying calm under pressure",
        ],
        required: true,
      },
      {
        key: "a1_pace",
        prompt: "Your natural work rhythm is…",
        guidance: "How the work actually gets done when nobody is watching.",
        type: "choice",
        control: "choice",
        scoring: "SCORED",
        options: [
          "Sprints of intense focus",
          "Steady daily consistency",
          "Deadline-driven bursts",
          "Whenever inspiration hits",
        ],
        required: true,
      },
      {
        key: "a1_risk",
        prompt: "Your relationship with risk:",
        guidance: "Measured against how you actually behave with money, moves, and opportunity.",
        type: "scale",
        control: "scale",
        scoring: "SCORED",
        scaleMin: 1,
        scaleMax: 5,
        scaleLow: "Careful, measured",
        scaleHigh: "Bold, high-tolerance",
        required: true,
      },
      {
        key: "a1_friend_line",
        prompt: "In one sentence, how would your closest friend describe you?",
        guidance: "Their words, not your resume.",
        type: "text",
        control: "longtext",
        scoring: "FLAVOR",
      },
    ],
  },
  {
    key: "A2",
    stage: "A",
    stageName: "Analyze",
    order: 2,
    title: "Know Your Energy",
    description:
      "Understand the rhythms, environments, and forces that expand or drain you.",
    deliverable: "Energy Profile",
    questions: [
      {
        key: "a2_birth",
        prompt: "Your birth details",
        guidance:
          "Enter the exact local birth time and choose the matching city. Your Sun, Moon, Rising, element, and Life Path are calculated from these details.",
        type: "text",
        control: "birth",
        scoring: "SCORED",
        required: true,
      },
      {
        key: "a2_energy_calc",
        prompt: "Your calculated energy signature",
        guidance: "Computed from your birth data and full birth name.",
        type: "text",
        control: "derived",
        scoring: "DERIVED",
        derivedKey: "energy_calc",
      },
      {
        key: "a2_energy_time",
        prompt: "When is your energy highest?",
        guidance: "Your real peak, not your scheduled one.",
        type: "scale",
        control: "scale",
        scoring: "FLAVOR",
        scaleMin: 1,
        scaleMax: 5,
        scaleLow: "Early morning",
        scaleHigh: "Late night",
      },
      {
        key: "a2_recharge",
        prompt: "You recharge most through…",
        guidance: "What actually restores you after a hard week.",
        type: "choice",
        control: "choice",
        scoring: "SCORED",
        options: [
          "Solitude and stillness",
          "Movement and physical challenge",
          "Deep conversation with a few people",
          "Creating or building something",
        ],
        required: true,
      },
      {
        key: "a2_drains",
        prompt: "What drains you fastest?",
        guidance: "Pick up to three.",
        type: "choice",
        control: "multi",
        scoring: "SCORED",
        max: 3,
        options: [
          "Small talk",
          "Rigid routine",
          "Conflict",
          "Being micromanaged",
          "Ambiguity",
          "Sitting still",
          "Crowds",
          "Repetition",
        ],
        required: true,
      },
      {
        key: "a2_element_note",
        prompt: "When do you feel most alive and in your element? Describe the moment.",
        guidance: "A specific scene beats a general statement.",
        type: "text",
        control: "longtext",
        scoring: "FLAVOR",
      },
    ],
  },
  {
    key: "A3",
    stage: "A",
    stageName: "Analyze",
    order: 3,
    title: "Know Your Story",
    description:
      "Find the values and turning points that explain how you became who you are.",
    deliverable: "Self-Discovery Profile",
    questions: [
      {
        key: "a3_values",
        prompt: "Choose your five core values, in order.",
        guidance:
          "Pick the five you would not compromise. Order matters — the first is the one you'd protect last.",
        type: "choice",
        control: "rank",
        scoring: "SCORED",
        rank: 5,
        options: [...CORE_VALUES],
        required: true,
      },
      {
        key: "a3_theme",
        prompt: "Which life theme resonates most right now?",
        guidance: "Where you actually are, not where you'd like to be.",
        type: "choice",
        control: "choice",
        scoring: "SCORED",
        options: [
          "Reinvention — becoming someone new",
          "Mastery — going deeper in my craft",
          "Liberation — breaking free of an old story",
          "Legacy — building something that lasts",
          "Alignment — closing the gap between inside and outside",
        ],
        required: true,
      },
      {
        key: "a3_driver",
        prompt: "Be honest — what drives you most?",
        guidance: "The honest answer is more useful than the flattering one.",
        type: "choice",
        control: "choice",
        scoring: "SCORED",
        options: [
          "Proving something to myself",
          "Proving something to others",
          "Providing for people I love",
          "A vision only I can see",
          "Escaping who I used to be",
        ],
        required: true,
      },
      {
        key: "a3_defining",
        prompt:
          "Name a defining moment that shaped who you are. What happened, and what did it teach you?",
        guidance: "This is the raw material your profile narrative is written from.",
        type: "text",
        control: "longtext",
        scoring: "FLAVOR",
      },
      {
        key: "a3_proud",
        prompt:
          "What is an accomplishment you're genuinely proud of that most people don't know about?",
        guidance: "Quiet wins count double here.",
        type: "text",
        control: "longtext",
        scoring: "FLAVOR",
      },
      {
        key: "a3_gap",
        prompt:
          "Where does the person you present to the world differ from who you actually are?",
        guidance: "This gap is the whole reason the program exists.",
        type: "text",
        control: "longtext",
        scoring: "FLAVOR",
      },
      {
        key: "a3_dream",
        prompt: "If you knew you couldn't fail, what would you build?",
        guidance: "One line. Be specific.",
        type: "text",
        control: "text",
        scoring: "FLAVOR",
      },
    ],
  },

  /* ===================== STAGE B — BRAND ===================== */
  {
    key: "B0",
    stage: "B",
    stageName: "Brand",
    order: 4,
    title: "Brand Signal",
    description:
      "Reveal the brand instinct you choose before strategy, language, or convention can interfere.",
    deliverable: "Brand Signal Code",
    questions: [
      ...signalPairs.map((pair, index): Question => ({
        key: pair.key,
        prompt: `${pair.a.label} or ${pair.b.label}?`,
        guidance: `Choose on instinct. Pair ${String(index + 1).padStart(2, "0")} of 16.`,
        type: "choice",
        control: "choice",
        scoring: "SCORED",
        options: [pair.a.label, pair.b.label],
        required: true,
      })),
      {
        key: "sp_rejections",
        prompt: "Which two brands are least like the signal you want to send?",
        guidance: "Choose exactly two. Rejection sharpens the result.",
        type: "choice",
        control: "multi",
        scoring: "SCORED",
        options: [...rejectionBrands],
        max: 2,
        required: true,
      },
      {
        key: "sp_result",
        prompt: "Your Brand Signal",
        guidance: "A four-letter code generated from all 16 choices and your rejection pass.",
        type: "text",
        control: "derived",
        scoring: "DERIVED",
        derivedKey: "brand_signal",
      },
    ],
  },
  {
    key: "B1",
    stage: "B",
    stageName: "Brand",
    order: 5,
    title: "Define Your Image",
    description:
      "Translate who you are into how you are read — the signal you send before you speak.",
    deliverable: "Style Archetype",
    questions: [
      {
        key: "b1_room_read",
        prompt: "Walking into a room, you want to read as…",
        guidance: "The impression you want, not the one you currently make.",
        type: "choice",
        control: "choice",
        scoring: "SCORED",
        options: [
          "Refined and understated",
          "Bold and unforgettable",
          "Warm and approachable",
          "Sharp and authoritative",
          "Creative and original",
        ],
        required: true,
      },
      {
        key: "b1_wardrobe",
        prompt: "Your ideal wardrobe is built on…",
        guidance: "What you'd build if budget were not the constraint.",
        type: "choice",
        control: "choice",
        scoring: "SCORED",
        options: [
          "A few perfect timeless pieces",
          "Statement items that turn heads",
          "Comfort that still looks intentional",
          "Structured, tailored, precise",
          "Unexpected mixes and texture",
        ],
        required: true,
      },
      {
        key: "b1_color",
        prompt: "Your color instinct leans…",
        guidance: "This generates your palette.",
        type: "choice",
        control: "choice",
        scoring: "SCORED",
        options: [
          "Black, ivory, camel — quiet luxury",
          "Deep jewel tones and contrast",
          "Earth tones and soft neutrals",
          "Charcoal, navy, crisp white",
          "Whatever breaks the rules",
        ],
        required: true,
      },
      {
        key: "b1_compliment",
        prompt: "A compliment you'd love to hear:",
        guidance: "Pick the one that would actually land.",
        type: "choice",
        control: "choice",
        scoring: "SCORED",
        options: [
          "You always look so put-together.",
          "You have such a signature look.",
          "You seem so comfortable in your skin.",
          "You look like you're in charge.",
          "I could never pull that off — but you do.",
        ],
        required: true,
      },
      {
        key: "b1_arch_calc",
        prompt: "Your style archetype",
        guidance: "Scored from your four image instincts above.",
        type: "text",
        control: "derived",
        scoring: "DERIVED",
        derivedKey: "style_archetype",
      },
      {
        key: "b1_contexts",
        prompt: "Where does your image need to perform most?",
        guidance: "Pick up to three. This drives your recommendations.",
        type: "choice",
        control: "multi",
        scoring: "SCORED",
        max: 3,
        options: [
          "Boardrooms / clients",
          "Stage / camera / content",
          "Social & nightlife",
          "Dating",
          "Everyday / working from home",
          "Events & red carpets",
        ],
        required: true,
      },
      {
        key: "b1_current_look",
        prompt: "What does your current look communicate about you — accurately or not?",
        guidance: "Honest audit. The gap is the work.",
        type: "text",
        control: "longtext",
        scoring: "FLAVOR",
      },
    ],
  },
  {
    key: "B2",
    stage: "B",
    stageName: "Brand",
    order: 6,
    title: "The Image Plan",
    description:
      "Turn the archetype into a wardrobe direction, a palette, and a buying order.",
    deliverable: "Image Plan",
    questions: [
      {
        key: "b2_palette_calc",
        prompt: "Your generated color palette",
        guidance: "Mapped from your color instinct in B1.",
        type: "text",
        control: "derived",
        scoring: "DERIVED",
        derivedKey: "color_palette",
      },
      {
        key: "b2_boldness",
        prompt: "How bold should your image go?",
        guidance: "This sets the volume on every recommendation you receive.",
        type: "scale",
        control: "scale",
        scoring: "SCORED",
        scaleMin: 1,
        scaleMax: 5,
        scaleLow: "Quiet and timeless",
        scaleHigh: "Loud and directional",
        required: true,
      },
      {
        key: "b2_silhouette",
        prompt: "Your preferred silhouette:",
        guidance: "How clothing should sit on you.",
        type: "choice",
        control: "choice",
        scoring: "SCORED",
        options: [
          "Tailored and fitted",
          "Relaxed and draped",
          "Structured with sharp lines",
          "Layered and textured",
        ],
        required: true,
      },
      {
        key: "b2_invest",
        prompt: "Which pieces are worth investing in first for you?",
        guidance: "Pick up to four. This becomes your buying order.",
        type: "choice",
        control: "multi",
        scoring: "SCORED",
        max: 4,
        options: [
          "A perfect tailored jacket",
          "Statement outerwear",
          "Quality footwear",
          "Elevated basics (tees / knits)",
          "One signature accessory",
          "A sharp suit",
          "Eyewear",
          "Fragrance",
        ],
        required: true,
      },
      {
        key: "b2_budget",
        prompt: "Realistic monthly wardrobe budget",
        guidance: "Guides the specificity of your recommendations. A range is fine.",
        type: "text",
        control: "text",
        scoring: "FLAVOR",
      },
      {
        key: "b2_presence",
        prompt:
          "Your digital presence: what should someone feel in the first three seconds of your profile?",
        guidance: "Same standard as a room — but faster.",
        type: "text",
        control: "longtext",
        scoring: "FLAVOR",
      },
    ],
  },
  {
    key: "B3",
    stage: "B",
    stageName: "Brand",
    order: 7,
    title: "Your Brand Statement",
    description:
      "Compress the whole identity into three sentences a stranger can repeat.",
    deliverable: "Personal Brand Statement",
    questions: [
      {
        key: "b3_who",
        prompt: "I help / serve… (who)",
        guidance: "Be narrower than feels comfortable.",
        type: "text",
        control: "text",
        scoring: "SCORED",
        required: true,
      },
      {
        key: "b3_what",
        prompt: "…do or become… (what transformation)",
        guidance: "The change, not the service.",
        type: "text",
        control: "text",
        scoring: "SCORED",
        required: true,
      },
      {
        key: "b3_how",
        prompt: "…through / because of… (your unique way)",
        guidance: "The thing only you bring.",
        type: "text",
        control: "text",
        scoring: "SCORED",
        required: true,
      },
      {
        key: "b3_voice",
        prompt: "Your brand voice is…",
        guidance: "How your writing and speaking should sound.",
        type: "choice",
        control: "choice",
        scoring: "SCORED",
        options: [
          "Calm and authoritative",
          "Warm and encouraging",
          "Sharp and provocative",
          "Visionary and poetic",
          "Straight-talking and practical",
        ],
        required: true,
      },
      {
        key: "b3_statement_calc",
        prompt: "Your assembled positioning statement",
        guidance: "Built from your three answers above.",
        type: "text",
        control: "derived",
        scoring: "DERIVED",
        derivedKey: "brand_statement",
      },
      {
        key: "b3_edit",
        prompt: "Edit the generated statement in your own words.",
        guidance: "Optional. If you rewrite it, your version is the one that ships.",
        type: "text",
        control: "longtext",
        scoring: "FLAVOR",
      },
    ],
  },
  {
    key: "B4",
    stage: "B",
    stageName: "Brand",
    order: 8,
    title: "Brand Ledger",
    description:
      "Score the brand as an owned business asset, then focus on the three moves with the highest leverage.",
    deliverable: "Brand Asset Ledger",
    questions: [
      ...brandLedgerItems.map((item): Question => ({
        key: item.key,
        prompt: item.prompt,
        guidance: "Choose the state that is true today. This is an operating audit, not an aspiration.",
        type: "scale",
        control: "scale",
        scoring: "SCORED",
        scaleMin: 0,
        scaleMax: 3,
        scaleLow: item.states[0],
        scaleHigh: item.states[3],
        stateLabels: [...item.states],
        required: true,
      })),
      {
        key: "ledger_result",
        prompt: "Your Brand Ledger",
        guidance: "A weighted score out of 1,000 with exactly three priority moves.",
        type: "text",
        control: "derived",
        scoring: "DERIVED",
        derivedKey: "brand_ledger",
      },
    ],
  },

  /* ===================== STAGE L — LEVERAGE ===================== */
  {
    key: "L1",
    stage: "L",
    stageName: "Leverage",
    order: 9,
    title: "Map Your Network",
    description:
      "See the access you already have — and the doors you have not asked to open.",
    deliverable: "Network Map",
    questions: [
      {
        key: "l1_top5",
        prompt:
          "List five people already in your network who could open a door. Who are they, and what door?",
        guidance: "Names and doors. One per line.",
        type: "text",
        control: "longtext",
        scoring: "FLAVOR",
        required: true,
      },
      {
        key: "l1_mentors",
        prompt:
          "Name three virtual mentors — people you don't know personally whose path you'd study.",
        guidance: "You are allowed to learn from people who don't know you exist.",
        type: "text",
        control: "longtext",
        scoring: "FLAVOR",
      },
      {
        key: "l1_net_style",
        prompt: "Your networking comfort:",
        guidance: "Honest. This changes what we ask you to do.",
        type: "choice",
        control: "choice",
        scoring: "SCORED",
        options: [
          "I build deep 1:1 relationships",
          "I work rooms and events well",
          "I connect online / in DMs",
          "I avoid it — this is a growth area",
        ],
        required: true,
      },
      {
        key: "l1_partner",
        prompt: "For your accountability partner, you want someone who is…",
        guidance: "This is the matching input. It determines who you get paired with.",
        type: "choice",
        control: "choice",
        scoring: "SCORED",
        options: [
          "Ahead of me — pulls me up",
          "At my level — grows with me",
          "Complementary — different strengths",
          "Tough — holds me to it",
        ],
        required: true,
      },
      {
        key: "l1_doors",
        prompt: "Where do you most need doors opened?",
        guidance: "Pick up to three. This routes your ecosystem matches.",
        type: "choice",
        control: "multi",
        scoring: "SCORED",
        max: 3,
        options: [
          "Clients / customers",
          "Capital / investors",
          "Collaborators",
          "Mentorship",
          "Media / audience",
          "Talent / team",
          "Distribution / partners",
        ],
        required: true,
      },
    ],
  },
  {
    key: "L2",
    stage: "L",
    stageName: "Leverage",
    order: 10,
    title: "The Revenue Path",
    description:
      "Convert identity into income — the three routes your current skills and assets already support.",
    deliverable: "Monetization Roadmap",
    questions: [
      {
        key: "l2_skills",
        prompt:
          "Which of these do you do well enough that people already ask you for it?",
        guidance: "Pick up to four. Only what people already come to you for.",
        type: "choice",
        control: "multi",
        scoring: "SCORED",
        max: 4,
        options: [
          "Creating content",
          "Advising / consulting",
          "Designing / making",
          "Teaching / speaking",
          "Selling / closing",
          "Building products",
          "Organizing / operating",
          "Connecting people",
        ],
        required: true,
      },
      {
        key: "l2_assets",
        prompt: "What assets do you already have?",
        guidance: "Pick up to four. Assets you have today, not ones you're building.",
        type: "choice",
        control: "multi",
        scoring: "SCORED",
        max: 4,
        options: [
          "An audience",
          "A specialized skill",
          "Industry relationships",
          "Capital",
          "A proven result / track record",
          "Time & energy",
          "A unique story",
          "Access to a community",
        ],
        required: true,
      },
      {
        key: "l2_revenue_calc",
        prompt: "Your top three income streams",
        guidance: "Matched from your skills against your assets.",
        type: "text",
        control: "derived",
        scoring: "DERIVED",
        derivedKey: "income_streams",
      },
      {
        key: "l2_model",
        prompt: "Which income model fits you best right now?",
        guidance: "Right now — not in three years.",
        type: "choice",
        control: "choice",
        scoring: "SCORED",
        options: [
          "Services / done-for-you",
          "Coaching / consulting",
          "Digital products / courses",
          "Physical product / brand",
          "Content / audience monetization",
          "Partnerships / affiliate",
        ],
        required: true,
      },
      {
        key: "l2_goal",
        prompt: "Twelve-month income goal from this identity",
        guidance: "A number. Specific beats safe.",
        type: "text",
        control: "text",
        scoring: "SCORED",
        required: true,
      },
      {
        key: "l2_blocker",
        prompt: "What's actually stopping you from monetizing this already?",
        guidance: "The real answer, not the polite one.",
        type: "text",
        control: "longtext",
        scoring: "FLAVOR",
      },
    ],
  },
  {
    key: "L3",
    stage: "L",
    stageName: "Leverage",
    order: 11,
    title: "Ecosystem & Referrals",
    description:
      "Plug into the member network so opportunity finds you without you chasing it.",
    deliverable: "Opportunity List",
    questions: [
      {
        key: "l3_ideal_customer",
        prompt: "Your ideal customer, in one line (who plus what they need)",
        guidance: "This field is what other members are matched against.",
        type: "text",
        control: "text",
        scoring: "SCORED",
        required: true,
      },
      {
        key: "l3_ideal_service",
        prompt: "The one service or offer you want to be known for",
        guidance: "One. Not a menu.",
        type: "text",
        control: "text",
        scoring: "SCORED",
        required: true,
      },
      {
        key: "l3_ecosystem",
        prompt: "Where do you want to plug into the Able1Self ecosystem?",
        guidance: "Pick up to three. This drives your referral matches.",
        type: "choice",
        control: "multi",
        scoring: "SCORED",
        max: 3,
        options: [
          "Get referred to other members",
          "Refer members I trust",
          "Collaborate on projects",
          "Find an accountability partner",
          "Offer my service to the community",
          "Access member-only opportunities",
        ],
        required: true,
      },
      {
        key: "l3_referral",
        prompt:
          "Who could refer you business regularly, and what would make it easy for them to?",
        guidance: "Make the ask concrete enough that someone could act on it today.",
        type: "text",
        control: "longtext",
        scoring: "FLAVOR",
      },
      {
        key: "l3_endorsement",
        prompt:
          "What would someone who's worked with you say about you? Write your future testimonial.",
        guidance: "Write it as if it already happened.",
        type: "text",
        control: "longtext",
        scoring: "FLAVOR",
      },
    ],
  },

  /* ===================== STAGE E — EMBARK ===================== */
  {
    key: "E1",
    stage: "E",
    stageName: "Embark",
    order: 12,
    title: "Your Launch Moment",
    description:
      "Name the one public move that makes the new identity real to other people.",
    deliverable: "Activation Goal",
    questions: [
      {
        key: "e1_goal",
        prompt: "Your ONE goal for this launch",
        guidance: "Specific and measurable. If you can't tell whether you hit it, rewrite it.",
        type: "text",
        control: "text",
        scoring: "SCORED",
        required: true,
      },
      {
        key: "e1_horizon",
        prompt: "Time horizon:",
        guidance: "The window you're holding yourself to.",
        type: "choice",
        control: "choice",
        scoring: "SCORED",
        options: ["90 days", "6 months", "9 months", "12 months"],
        required: true,
      },
      {
        key: "e1_activation",
        prompt: "Your public activation move will be…",
        guidance: "The visible act that announces the change.",
        type: "choice",
        control: "choice",
        scoring: "SCORED",
        options: [
          "Launch content / a series",
          "A signature offer",
          "An event or talk",
          "A collaboration / feature",
          "A rebrand reveal",
        ],
        required: true,
      },
      {
        key: "e1_visibility",
        prompt: "How ready are you to be visible?",
        guidance: "This calibrates how aggressive your 90-day plan gets.",
        type: "scale",
        control: "scale",
        scoring: "SCORED",
        scaleMin: 1,
        scaleMax: 5,
        scaleLow: "It terrifies me",
        scaleHigh: "Put me on stage",
        required: true,
      },
      {
        key: "e1_success",
        prompt: "How will you KNOW this worked? Describe the finish line.",
        guidance: "Write the scene. What is happening around you when it's done?",
        type: "text",
        control: "longtext",
        scoring: "FLAVOR",
      },
    ],
  },
  {
    key: "E2",
    stage: "E",
    stageName: "Embark",
    order: 13,
    title: "Your First 90 Days",
    description:
      "Reverse-engineer the goal into three months, each with one outcome that matters.",
    deliverable: "90-Day Blueprint",
    questions: [
      {
        key: "e2_m1",
        prompt: "Month 1 — the ONE outcome",
        guidance: "One. Not a list.",
        type: "text",
        control: "text",
        scoring: "SCORED",
        required: true,
      },
      {
        key: "e2_m2",
        prompt: "Month 2 — the ONE outcome",
        guidance: "It should only be possible if Month 1 happened.",
        type: "text",
        control: "text",
        scoring: "SCORED",
        required: true,
      },
      {
        key: "e2_m3",
        prompt: "Month 3 — the ONE outcome",
        guidance: "This one should be visible to other people.",
        type: "text",
        control: "text",
        scoring: "SCORED",
        required: true,
      },
      {
        key: "e2_weekly",
        prompt: "Which habits will you commit to weekly?",
        guidance: "Pick up to four. These become your tracker.",
        type: "choice",
        control: "multi",
        scoring: "SCORED",
        max: 4,
        options: [
          "Publish content",
          "Reach out to five people",
          "Sales conversations",
          "Skill practice",
          "Review metrics",
          "Work on the offer",
          "Physical training",
          "Community engagement",
        ],
        required: true,
      },
      {
        key: "e2_derailer",
        prompt: "What most likely derails you?",
        guidance: "Name it now and we build the nudge that catches it.",
        type: "choice",
        control: "choice",
        scoring: "SCORED",
        options: [
          "Losing momentum",
          "Perfectionism",
          "Fear of visibility",
          "Time / other commitments",
          "Money pressure",
          "Self-doubt",
        ],
        required: true,
      },
      {
        key: "e2_if_stuck",
        prompt: "When you get stuck, what will you do to get moving again?",
        guidance: "Write the instruction you'll need on your worst day.",
        type: "text",
        control: "longtext",
        scoring: "FLAVOR",
      },
    ],
  },
  {
    key: "E3",
    stage: "E",
    stageName: "Embark",
    order: 14,
    title: "Your Accountability Structure",
    description:
      "Build the system that keeps this alive after the program ends.",
    deliverable: "Accountability Plan",
    questions: [
      {
        key: "e3_checkin",
        prompt: "Ideal check-in rhythm with your partner:",
        guidance: "This sets your reminder cadence.",
        type: "choice",
        control: "choice",
        scoring: "SCORED",
        options: ["Daily", "Twice a week", "Weekly", "Every two weeks"],
        required: true,
      },
      {
        key: "e3_momentum",
        prompt: "What keeps you most accountable?",
        guidance: "What has actually worked for you before.",
        type: "choice",
        control: "choice",
        scoring: "SCORED",
        options: [
          "Someone expecting an update",
          "Public commitment",
          "Tracking numbers / streaks",
          "Money on the line",
          "Community energy",
        ],
        required: true,
      },
      {
        key: "e3_support",
        prompt: "What support do you want ongoing?",
        guidance: "Pick up to three.",
        type: "choice",
        control: "multi",
        scoring: "SCORED",
        max: 3,
        options: [
          "Accountability partner",
          "The member community",
          "Coaching from Shawn",
          "Monthly check-in prompts",
          "Progress dashboard nudges",
          "Live sessions",
        ],
        required: true,
      },
      {
        key: "e3_commitment",
        prompt:
          "Write your commitment — the promise you're making to yourself, starting now.",
        guidance: "This appears on your finished profile. Write it like you mean it.",
        type: "text",
        control: "longtext",
        scoring: "FLAVOR",
        required: true,
      },
    ],
  },
];

export const moduleMap = Object.fromEntries(
  programModules.map((programModule) => [programModule.key, programModule]),
) as Record<string, ProgramModule>;

export const questionMap = Object.fromEntries(
  programModules.flatMap((m) => m.questions.map((q) => [q.key, q])),
) as Record<string, Question>;

/** Questions a member must answer before a module can be marked complete. */
export function requiredQuestionKeys(moduleKey: string): string[] {
  const mod = moduleMap[moduleKey];
  if (!mod) return [];
  return mod.questions
    .filter((q) => q.required && q.control !== "derived")
    .map((q) => q.key);
}

/* ============================================================
   PROGRESSION / PATHWAY LOGIC
   Stages unlock in order. Modules unlock one at a time inside a
   stage, but the whole stage stays visible (sequential-but-transparent).
   ============================================================ */

export const STAGE_ORDER: Array<Stage["key"]> = ["A", "B", "L", "E"];

export function modulesForStage(stage: Stage["key"]): ProgramModule[] {
  return programModules.filter((m) => m.stage === stage);
}

export function isStageComplete(
  stage: Stage["key"],
  completed: Set<string> | string[],
): boolean {
  const done = completed instanceof Set ? completed : new Set(completed);
  return modulesForStage(stage).every((m) => done.has(m.key));
}

export function isStageUnlocked(
  stage: Stage["key"],
  completed: Set<string> | string[],
): boolean {
  const index = STAGE_ORDER.indexOf(stage);
  if (index <= 0) return true;
  return isStageComplete(STAGE_ORDER[index - 1], completed);
}

export function isModuleUnlocked(
  moduleKey: string,
  completed: Set<string> | string[],
): boolean {
  const mod = moduleMap[moduleKey];
  if (!mod) return false;
  const done = completed instanceof Set ? completed : new Set(completed);
  if (!isStageUnlocked(mod.stage, done)) return false;
  const siblings = modulesForStage(mod.stage);
  const index = siblings.findIndex((m) => m.key === moduleKey);
  if (index === 0) return true;
  return done.has(siblings[index - 1].key);
}

export function nextModule(
  completed: Set<string> | string[],
): ProgramModule {
  const done = completed instanceof Set ? completed : new Set(completed);
  const next = programModules.find(
    (m) => !done.has(m.key) && isModuleUnlocked(m.key, done),
  );
  return next ?? programModules[programModules.length - 1];
}

export function overallProgress(completed: Set<string> | string[]): number {
  const done = completed instanceof Set ? completed : new Set(completed);
  const count = programModules.filter((m) => done.has(m.key)).length;
  return Math.round((count / programModules.length) * 100);
}
