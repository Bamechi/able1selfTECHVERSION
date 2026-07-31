export type Question = {
  key: string;
  prompt: string;
  guidance: string;
  type: "choice" | "text" | "scale";
  options?: string[];
};

export type ProgramModule = {
  key: string;
  stage: "A" | "B" | "L" | "E";
  stageName: string;
  order: number;
  title: string;
  description: string;
  questions: Question[];
};

export const programModules: ProgramModule[] = [
  {
    key: "A1",
    stage: "A",
    stageName: "Analyze",
    order: 1,
    title: "Know Your Type",
    description:
      "Identify the pattern you naturally use to create clarity and momentum.",
    questions: [
      {
        key: "A1_Q1",
        prompt: "When a situation is unclear, what do you naturally do first?",
        guidance: "Choose the response that sounds most like your default.",
        type: "choice",
        options: [
          "Build a system or plan",
          "Talk it through with people",
          "Experiment until something works",
          "Step back and study the pattern",
        ],
      },
      {
        key: "A1_Q2",
        prompt: "What do people consistently rely on you to do?",
        guidance: "Name the value others already recognize in you.",
        type: "text",
      },
      {
        key: "A1_Q3",
        prompt: "How confident are you in the way you make important decisions?",
        guidance: "1 means uncertain; 10 means deeply self-trusting.",
        type: "scale",
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
      "Understand the environments, rhythms, and responsibilities that expand or drain you.",
    questions: [
      {
        key: "A2_Q1",
        prompt: "Which kind of work gives you the most energy?",
        guidance: "Choose the activity you can sustain without forcing it.",
        type: "choice",
        options: [
          "Creating something new",
          "Solving a complex problem",
          "Leading and developing people",
          "Connecting people and opportunities",
        ],
      },
      {
        key: "A2_Q2",
        prompt: "What kind of work drains you even when you perform it well?",
        guidance: "Be specific about the task, environment, or expectation.",
        type: "text",
      },
      {
        key: "A2_Q3",
        prompt: "How well does your current schedule match your natural rhythm?",
        guidance: "1 means constant friction; 10 means fully aligned.",
        type: "scale",
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
      "Find the experiences and turning points that explain how you became who you are.",
    questions: [
      {
        key: "A3_Q1",
        prompt: "Which experience most changed how you see yourself?",
        guidance: "Describe what happened and what it taught you.",
        type: "text",
      },
      {
        key: "A3_Q2",
        prompt: "Which story are you ready to stop carrying forward?",
        guidance: "Name the belief or expectation that no longer fits.",
        type: "text",
      },
      {
        key: "A3_Q3",
        prompt: "Which identity feels most true in your next chapter?",
        guidance: "Choose the role you are ready to lead from.",
        type: "choice",
        options: [
          "Builder",
          "Strategist",
          "Creator",
          "Leader",
          "Connector",
          "Teacher",
        ],
      },
    ],
  },
  {
    key: "B1",
    stage: "B",
    stageName: "Brand",
    order: 4,
    title: "Position Your Value",
    description:
      "Translate your strengths into a clear promise people can understand and trust.",
    questions: [
      {
        key: "B1_Q1",
        prompt: "What problem are you unusually equipped to solve?",
        guidance: "Focus on the outcome, not your job title.",
        type: "text",
      },
      {
        key: "B1_Q2",
        prompt: "Who benefits most from the way you create value?",
        guidance: "Describe the person, team, organization, or community.",
        type: "text",
      },
      {
        key: "B1_Q3",
        prompt: "Which evidence best proves your value today?",
        guidance: "Choose the strongest form of credibility you already have.",
        type: "choice",
        options: [
          "Results I have produced",
          "People I have led",
          "Ideas or products I have created",
          "Relationships and trust I have built",
        ],
      },
    ],
  },
  {
    key: "B2",
    stage: "B",
    stageName: "Brand",
    order: 5,
    title: "Build Your Presence",
    description:
      "Align how you communicate, lead, and show up with the value you want known.",
    questions: [
      {
        key: "B2_Q1",
        prompt: "How do you want people to feel after interacting with you?",
        guidance: "Choose the emotional signal you want to leave.",
        type: "choice",
        options: [
          "Clear and focused",
          "Energized and capable",
          "Seen and understood",
          "Challenged to think bigger",
        ],
      },
      {
        key: "B2_Q2",
        prompt: "Where does your current presence underrepresent your ability?",
        guidance: "Consider meetings, online presence, communication, or leadership.",
        type: "text",
      },
      {
        key: "B2_Q3",
        prompt: "How consistently do your actions match the reputation you want?",
        guidance: "1 means rarely; 10 means consistently.",
        type: "scale",
      },
    ],
  },
  {
    key: "B3",
    stage: "B",
    stageName: "Brand",
    order: 6,
    title: "Your Brand Statement",
    description:
      "Create the concise language that connects who you are to the value you deliver.",
    questions: [
      {
        key: "B3_Q1",
        prompt: "Complete this sentence: I help people or organizations…",
        guidance: "Name the transformation or result you create.",
        type: "text",
      },
      {
        key: "B3_Q2",
        prompt: "Complete this sentence: I do that by…",
        guidance: "Describe your distinctive approach or method.",
        type: "text",
      },
      {
        key: "B3_Q3",
        prompt: "Which tone should your professional statement carry?",
        guidance: "Choose the voice that feels most credible and natural.",
        type: "choice",
        options: [
          "Direct and authoritative",
          "Warm and insightful",
          "Visionary and expansive",
          "Precise and practical",
        ],
      },
    ],
  },
  {
    key: "L1",
    stage: "L",
    stageName: "Leverage",
    order: 7,
    title: "Map Your Network",
    description:
      "See the relationships, communities, and access already surrounding your next move.",
    questions: [
      {
        key: "L1_Q1",
        prompt: "Who are the five people most connected to your next goal?",
        guidance: "List names and the perspective or access each person holds.",
        type: "text",
      },
      {
        key: "L1_Q2",
        prompt: "Which relationship have you underinvested in?",
        guidance: "Name one person and the next genuine action you can take.",
        type: "text",
      },
      {
        key: "L1_Q3",
        prompt: "How active are you in the communities relevant to your goal?",
        guidance: "1 means disconnected; 10 means deeply engaged.",
        type: "scale",
      },
    ],
  },
  {
    key: "L2",
    stage: "L",
    stageName: "Leverage",
    order: 8,
    title: "The Revenue Path",
    description:
      "Connect your abilities to practical ways of creating measurable value.",
    questions: [
      {
        key: "L2_Q1",
        prompt: "Which ability could create value immediately?",
        guidance: "Name the skill and the result it can produce.",
        type: "text",
      },
      {
        key: "L2_Q2",
        prompt: "Which value path best fits your current season?",
        guidance: "Choose the path you are most ready to test.",
        type: "choice",
        options: [
          "A service or advisory offer",
          "A product or intellectual property",
          "A leadership or career move",
          "A partnership or revenue share",
        ],
      },
      {
        key: "L2_Q3",
        prompt: "What is the smallest paid proof you could create in 30 days?",
        guidance: "Make it specific, testable, and connected to a real person.",
        type: "text",
      },
    ],
  },
  {
    key: "L3",
    stage: "L",
    stageName: "Leverage",
    order: 9,
    title: "Ecosystem & Referrals",
    description:
      "Build a repeatable relationship system that creates opportunities without forcing them.",
    questions: [
      {
        key: "L3_Q1",
        prompt: "Who already sends opportunities or people your way?",
        guidance: "List the connectors who understand your value.",
        type: "text",
      },
      {
        key: "L3_Q2",
        prompt: "What makes someone confident referring you?",
        guidance: "Name the proof, language, and experience they need.",
        type: "text",
      },
      {
        key: "L3_Q3",
        prompt: "How systematic is your relationship follow-up today?",
        guidance: "1 means accidental; 10 means consistent and thoughtful.",
        type: "scale",
      },
    ],
  },
  {
    key: "E1",
    stage: "E",
    stageName: "Embark",
    order: 10,
    title: "Your Launch Moment",
    description:
      "Choose the visible commitment that turns your direction into a real beginning.",
    questions: [
      {
        key: "E1_Q1",
        prompt: "What are you ready to make real now?",
        guidance: "Name one outcome, not a collection of possibilities.",
        type: "text",
      },
      {
        key: "E1_Q2",
        prompt: "What would make this commitment feel irreversible?",
        guidance: "Choose the action that puts your intention into the world.",
        type: "choice",
        options: [
          "Announce it publicly",
          "Invite the first customer or stakeholder",
          "Put a date on the calendar",
          "Invest money or resources",
        ],
      },
      {
        key: "E1_Q3",
        prompt: "What fear must you move with rather than wait to remove?",
        guidance: "Name it plainly so it stops operating invisibly.",
        type: "text",
      },
    ],
  },
  {
    key: "E2",
    stage: "E",
    stageName: "Embark",
    order: 11,
    title: "Your First 90 Days",
    description:
      "Reverse-engineer the goal into milestones and weekly actions you can actually execute.",
    questions: [
      {
        key: "E2_Q1",
        prompt: "What must be true 90 days from now?",
        guidance: "Describe the measurable finish line.",
        type: "text",
      },
      {
        key: "E2_Q2",
        prompt: "What are the three milestones between today and that outcome?",
        guidance: "Separate the work into visible stages.",
        type: "text",
      },
      {
        key: "E2_Q3",
        prompt: "How much focused time can you protect each week?",
        guidance: "1 means almost none; 10 means a fully protected rhythm.",
        type: "scale",
      },
    ],
  },
  {
    key: "E3",
    stage: "E",
    stageName: "Embark",
    order: 12,
    title: "Your Accountability System",
    description:
      "Design the rhythm, people, and signals that keep the plan moving when motivation changes.",
    questions: [
      {
        key: "E3_Q1",
        prompt: "Who will know whether you did what you said?",
        guidance: "Name the person and the check-in rhythm.",
        type: "text",
      },
      {
        key: "E3_Q2",
        prompt: "Which signal will tell you that momentum is slipping?",
        guidance: "Choose an early warning you can recognize quickly.",
        type: "choice",
        options: [
          "I stop protecting time",
          "I avoid sharing progress",
          "I keep changing the goal",
          "I get busy with low-value work",
        ],
      },
      {
        key: "E3_Q3",
        prompt: "What promise are you making to your future self?",
        guidance: "Write the sentence you want to return to when the work gets hard.",
        type: "text",
      },
    ],
  },
];

export const moduleMap = Object.fromEntries(
  programModules.map((module) => [module.key, module]),
) as Record<string, ProgramModule>;
