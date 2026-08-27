export type LifePathMeaning = {
  title: string;
  reading: string;
  strength: string;
  watch: string;
  brandMove: string;
};

export const LIFE_PATH_MEANINGS: Record<number, LifePathMeaning> = {
  1: { title: "The Pioneer", reading: "Beginnings, individuality, and ambition shape your path. You are at your best when you can originate the direction and work on your own terms.", strength: "Independent leadership and early recognition of new possibilities.", watch: "Trying to carry every important task alone or starting before finishing.", brandMove: "Own a clear point of view and make your name synonymous with the category you lead." },
  2: { title: "The Diplomat", reading: "Cooperation, relationships, and practical empathy shape your path. You make people feel understood and help a group move toward a shared vision.", strength: "Trust-building, mediation, and calm execution under pressure.", watch: "Suppressing your needs to preserve peace or absorbing everyone else's strain.", brandMove: "Build through partnerships, testimonials, and a reputation for making complex rooms work." },
  3: { title: "The Creator", reading: "Self-expression, imagination, and play shape your path. Your voice and creative perspective are meant to be translated into visible work.", strength: "Storytelling, communication, design, and connecting detail to the big picture.", watch: "Scattering your attention or forcing productivity when restoration would improve the work.", brandMove: "Create a repeatable publishing format that lets your voice become the recognizable asset." },
  4: { title: "The Builder", reading: "Stability, structure, and useful work shape your path. You create the foundations that allow people and organizations to thrive.", strength: "Patience, judgement, memory, fairness, and attention to detail.", watch: "Doing essential work that remains invisible or resisting a calculated change.", brandMove: "Productize your method and show the system behind the result, not only the finished work." },
  5: { title: "The Catalyst", reading: "Freedom, adaptability, and experience shape your path. You learn by moving, exploring, and introducing new energy into a fixed situation.", strength: "Versatility, persuasion, curiosity, and rapid reinvention.", watch: "Confusing movement with progress or leaving before the compounding phase begins.", brandMove: "Build a flexible brand platform around one constant promise, then let formats and channels evolve." },
  6: { title: "The Steward", reading: "Responsibility, beauty, and service shape your path. You naturally improve the environments and people entrusted to your care.", strength: "Taste, teaching, loyalty, and creating a sense of belonging.", watch: "Over-functioning for others or allowing high standards to become control.", brandMove: "Make care visible through a signature client experience, clear standards, and proof of transformation." },
  7: { title: "The Seeker", reading: "Wisdom, analysis, and spiritual understanding shape your path. Depth matters more to you than noise, and solitude is part of how you produce value.", strength: "Research, discernment, concentration, and specialist insight.", watch: "Withholding your work until it feels complete or becoming isolated from the people it serves.", brandMove: "Publish fewer, deeper pieces and turn your specialist knowledge into a named intellectual property." },
  8: { title: "The Executive", reading: "Power, stewardship, and material mastery shape your path. You are equipped to organize resources and build outcomes at meaningful scale.", strength: "Strategy, resilience, financial judgement, and ownership.", watch: "Measuring worth only through achievement or holding too tightly to control.", brandMove: "Lead with measurable outcomes, a strong offer ladder, and assets that earn beyond your direct time." },
  9: { title: "The Humanitarian", reading: "Compassion, idealism, and completion shape your path. Your strongest work connects personal talent to a purpose larger than yourself.", strength: "Empathy, creative vision, generosity, and unifying people around meaning.", watch: "Giving without boundaries or remaining attached to a chapter that is ready to close.", brandMove: "Make the mission concrete: name the people served, the change created, and the proof that it works." },
  11: { title: "The Illuminator", reading: "The master vibration of intuition and inspiration asks you to translate heightened perception into language other people can use.", strength: "Vision, sensitivity, symbolic thinking, and cultural signal detection.", watch: "Nervous-system overload, self-doubt, or living in possibility without a delivery structure.", brandMove: "Build a protected platform for your ideas and pair inspiration with a consistent publishing rhythm." },
  22: { title: "The Master Builder", reading: "The master vibration of practical vision asks you to turn a large idea into an institution, method, or durable system.", strength: "Long-range thinking, coordination, and making ambitious work operational.", watch: "Carrying the scale of the vision as pressure or delaying until every piece is available.", brandMove: "Document the method, build the team, and design the entity so the work can outlive your direct effort." },
  33: { title: "The Master Teacher", reading: "The master vibration of service asks you to lift others through compassion, insight, and an example that can travel farther than you do.", strength: "Teaching, healing perspective, practical wisdom, and service at scale.", watch: "Sacrificing your own path by becoming indispensable to everyone else's.", brandMove: "Turn your guidance into a curriculum with boundaries, a community, and a clear path to independence." },
};

function reduceNumber(value: number) {
  let result = value;
  while (result > 9 && result !== 11 && result !== 22 && result !== 33) {
    result = String(result).split("").reduce((sum, digit) => sum + Number(digit), 0);
  }
  return result;
}

export function calculateLifePath(dateISO?: string) {
  if (!dateISO) return null;
  const digits = dateISO.replace(/\D/g, "");
  if (digits.length !== 8) return null;
  return reduceNumber(digits.split("").reduce((sum, digit) => sum + Number(digit), 0));
}

export function describeLifePath(value: number | null) {
  return value ? LIFE_PATH_MEANINGS[value] ?? null : null;
}
