export const personalityAxes = [
  { letters: ['E', 'I'], labels: ['Outward', 'Inward'], name: 'Social energy' },
  { letters: ['S', 'N'], labels: ['Concrete', 'Possibilities'], name: 'Information' },
  { letters: ['T', 'F'], labels: ['Logic', 'People and values'], name: 'Decisions' },
  { letters: ['J', 'P'], labels: ['Structure', 'Flexibility'], name: 'Approach' },
] as const;

// Original ABLE reflection items; this is not the proprietary MBTI or 16Personalities test.
const banks = [
  [
    'Talking with others helps me work out what I think.', 'I need quiet time after a busy social day.',
    'I usually start conversations with people I have just met.', 'I prefer to think through an idea before discussing it.',
    'A group activity often gives me more energy.', 'I enjoy long stretches of independent work.',
    'I am comfortable introducing myself in a room of strangers.', 'I prefer a few deep conversations to many short ones.',
    'I tend to share ideas while they are still forming.', 'I recharge best when I have space to myself.',
    'I look for opportunities to bring people together.', 'I would usually choose a quiet evening over a busy gathering.',
  ],
  [
    'I trust an approach more when I have seen it work.', 'I naturally imagine several ways the future could unfold.',
    'Specific examples help me learn a new skill.', 'I often notice connections between unrelated ideas.',
    'I first look at the practical details of a new idea.', 'I enjoy exploring an idea before knowing how to apply it.',
    'I notice concrete changes in my surroundings quickly.', 'I often think about what something could become.',
    'Clear facts matter more to me than a promising theory.', 'I like looking for the larger pattern behind events.',
    'I prefer instructions with tangible steps.', 'Imagining a new approach is more engaging than repeating a familiar one.',
  ],
  [
    'I start difficult decisions by comparing evidence.', 'I consider how a decision will affect relationships first.',
    'I can disagree with an idea without taking it personally.', 'A solution needs to fit my values to feel right.',
    'I prefer direct feedback that identifies what needs fixing.', 'I adjust my feedback to how the other person may receive it.',
    'Consistent standards help me make fair decisions.', 'Understanding a person\'s circumstances can change my judgment.',
    'I enjoy testing whether an argument holds together.', 'I notice when a group needs encouragement.',
    'I can set aside personal preferences to choose an efficient solution.', 'I weigh the human impact even when it makes a decision less efficient.',
  ],
  [
    'I feel more at ease when the plan is settled.', 'I like leaving room to change direction.',
    'I break a deadline into steps in advance.', 'I often find good opportunities by following an unexpected turn.',
    'Finishing one task before starting another suits me.', 'I enjoy moving between several possibilities.',
    'I prefer clear expectations before beginning a project.', 'I can begin comfortably without knowing every next step.',
    'I like making decisions early enough to prepare.', 'I prefer to gather more information before committing.',
    'A predictable routine helps me do my best work.', 'I adapt my schedule as my priorities change.',
  ],
];

export const personalityItems = banks.flatMap((items, axis) =>
  items.map((prompt, index) => ({ key: `p${axis}_${index}`, prompt, axis, direction: index % 2 === 0 ? 1 : -1 })),
);
export const personalityVersion = 'able-reflection-1';
export type PersonalityAnswers = Record<string, number>;
export function parsePersonality(value: unknown): PersonalityAnswers {
  if (typeof value !== 'string') return {};
  try {
    const parsed = JSON.parse(value);
    if (parsed.version !== personalityVersion || !parsed.answers || typeof parsed.answers !== 'object') return {};
    return Object.fromEntries(Object.entries(parsed.answers).filter(([key, answer]) =>
      (personalityItems.some(item => item.key === key) || /^tie[0-3]$/.test(key)) &&
      typeof answer === 'number' && Number.isInteger(answer) && answer >= 1 && answer <= (key.startsWith('tie') ? 2 : 5),
    )) as PersonalityAnswers;
  } catch { return {}; }
}
export function encodePersonality(answers: PersonalityAnswers) {
  return JSON.stringify({ version: personalityVersion, answers });
}
export function personalityResult(value: unknown) {
  const answers = parsePersonality(value);
  if (personalityItems.some(item => !answers[item.key]) || personalityAxes.some((_, axis) => !answers[`tie${axis}`])) return null;
  const axes = personalityAxes.map((axis, index) => {
    const score = personalityItems.filter(item => item.axis === index)
      .reduce((sum, item) => sum + (answers[item.key] - 3) * item.direction, 0);
    const first = Math.round((score + 24) / 48 * 100);
    const selected = score === 0 ? answers[`tie${index}`] - 1 : score > 0 ? 0 : 1;
    return { ...axis, first, second: 100 - first, balanced: score === 0, letter: axis.letters[selected], preference: axis.labels[selected] };
  });
  return { type: axes.map(axis => axis.letter).join(''), axes, version: personalityVersion,
    description: `You tend toward ${axes[0].preference.toLowerCase()} energy, ${axes[1].preference.toLowerCase()} information, ${axes[2].preference.toLowerCase()} in decisions, and ${axes[3].preference.toLowerCase()} in your approach.` };
}
export function isAnswered(key: string, value: unknown): boolean {
  if (key === 'a1_assessment') return Boolean(personalityResult(value));
  if (value == null) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === 'object') {
    const birth = value as Record<string, unknown>;
    if ('date' in birth || 'fullName' in birth) return ['fullName', 'date', 'time', 'city', 'country', 'timezone', 'latitude', 'longitude'].every(key => birth[key] != null && String(birth[key]).trim() !== '');
    return Object.values(birth).some(item => typeof item === 'string' && item.trim());
  }
  return true;
}
