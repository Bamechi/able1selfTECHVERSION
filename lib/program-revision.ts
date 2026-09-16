import type { ProgramModule, Question } from './program-data';

const text = (key: string, prompt: string, required = true): Question => ({ key, prompt, required, guidance: '', type: 'text', control: 'longtext', scoring: 'FLAVOR' });
const multi = (key: string, prompt: string, options: string[], max = options.length): Question => ({ key, prompt, options, max, required: true, guidance: 'Select all that apply.', type: 'choice', control: 'multi', scoring: 'FLAVOR' });
const choice = (key: string, prompt: string, options: string[]): Question => ({ key, prompt, options, required: true, guidance: '', type: 'choice', control: 'choice', scoring: 'FLAVOR' });

export function reviseProgram(modules: ProgramModule[]): ProgramModule[] {
  const find = (module: ProgramModule, keys: string[]) => keys.map(key => module.questions.find(q => q.key === key)!).filter(Boolean);
  return modules.map(module => {
    let questions = module.questions;
    if (module.key === 'A1') questions = [
      choice('a1_pathway', 'Where are you starting?', ['I have a business or brand', 'I am starting something new']),
      text('a1_direction', 'What do you do, and who do you serve?'),
      { key: 'a1_assessment', prompt: 'Your personality', guidance: '', type: 'text', control: 'personality', scoring: 'FLAVOR', required: true },
      ...find(module, ['a1_strengths', 'a1_pace', 'a1_risk']),
    ];
    if (module.key === 'A2') questions = find(module, ['a2_birth', 'a2_energy_calc', 'a2_energy_time', 'a2_recharge']);
    if (module.key === 'A3') questions = [
      text('a3_self', 'Who are you beyond your work?'),
      text('a3_becoming', 'Who are you becoming?'),
      text('a3_dream', 'What do you most want to build or achieve?'),
      multi('a3_gifts', 'What do people come to you for?', ['Advice', 'Ideas', 'Making things', 'Solving problems', 'Encouragement', 'Leadership', 'Connections', 'Teaching', 'Something else'], 3),
      text('a3_contribution', 'What would the world miss without your contribution?'),
    ];
    if (module.key === 'B1') questions = find(module, ['b1_room_read', 'b1_color', 'b1_compliment', 'b1_arch_calc', 'b1_contexts']);
    if (module.key === 'B2') questions = [
      multi('b2_business_setup', 'Which business foundations do you have?', ['LLC or registered entity', 'EIN / tax ID', 'Trademark registration', 'Business insurance', 'Business bank account', 'Client contracts', 'Required licenses / permits', 'Bookkeeping system', 'None yet', 'Not sure']),
      multi('b2_digital_assets', 'Which brand assets are ready?', ['Website', 'Domain name', 'Professional email', 'Social profiles', 'Logo and visual identity', 'Bio / headshot', 'Portfolio / testimonials', 'Booking / checkout link', 'Email list', 'None yet']),
      text('b2_presence', 'Your website or main profile link', false),
      multi('b2_support', 'Where would support help most?', ['Legal setup', 'Brand strategy', 'Website', 'Content / media', 'Funding preparation', 'AI / operations', 'No support needed right now']),
    ];
    if (module.key === 'B3') questions = [text('b3_why', 'Why does this work matter to you?'), ...find(module, ['b3_who', 'b3_what', 'b3_how', 'b3_voice', 'b3_statement_calc', 'b3_edit']).map(q => ({ ...q, required: q.key === 'b3_edit' ? false : q.required }))];
    // The full ledger stays available as an optional detailed review, rather than a compulsory 46-question audit.
    if (module.key === 'B4') return { ...module, description: 'Review your brand foundations. Add detail where it helps.', questions: questions.map(q => ({ ...q, required: false })) };
    if (module.key === 'L1') questions = [
      { ...find(module, ['l1_top5'])[0], prompt: 'Who already trusts you and could benefit from your offer?', guidance: 'Up to five people or groups.' },
      text('l1_secondary', 'Who could those people introduce you to?', false),
      multi('l1_channels', 'Where can new people discover you?', ['Social posts', 'Interviews / podcasts', 'Events', 'Referrals', 'Email', 'Search', 'Communities', 'Partnerships']),
      ...find(module, ['l1_doors']),
    ];
    if (module.key === 'L2') questions = [
      text('l2_problem', 'What problem have you solved for yourself?'),
      text('l2_solution', 'What worked, and what can you help someone avoid?'),
      text('l2_past_self', 'Who is facing that same problem today?'),
      ...find(module, ['l2_skills', 'l2_assets', 'l2_model']),
      text('l2_offer', 'What product or service turns that solution into an offer?'),
      text('l2_proof', 'What result shows your solution works?'),
      text('l2_price', 'What will you charge, and what will it cost to deliver?'),
      ...find(module, ['l2_revenue_calc']),
    ];
    if (module.key === 'L3') questions = [
      text('l3_story', 'What moment in your story will make someone say, "That is me"?'),
      text('l3_profile_line', 'In one sentence: who do you help, and with what?'),
      choice('l3_action', 'What should an interested person do next?', ['Book a call', 'Buy / order', 'Join a program', 'Send an inquiry', 'Join a waitlist']),
      text('l3_action_link', 'Where can they take that next step?', false),
      ...find(module, ['l3_ecosystem', 'l3_referral']),
      choice('l3_rhythm', 'How often will you share your story or offer?', ['Twice a week', 'Weekly', 'Every two weeks', 'Monthly']),
    ];
    if (module.key === 'E1') questions = [...find(module, ['e1_goal', 'e1_horizon', 'e1_activation', 'e1_success']), text('e1_next_action', 'What is the first action, and when will you do it?')];
    if (module.key === 'E2') questions = [...find(module, ['e2_m1', 'e2_m2', 'e2_m3', 'e2_weekly', 'e2_derailer', 'e2_if_stuck']), text('e2_alignment', 'Which partnership or environment would move you forward?', false)];
    if (module.key === 'E3') questions = [text('e3_partner', 'Who will you check in with?'), ...find(module, ['e3_checkin', 'e3_momentum', 'e3_support', 'e3_commitment'])];
    const descriptions: Record<string, string> = { A1: 'Your starting point, personality, and strengths.', A2: 'Your birth chart and working rhythm.', A3: 'Five reflections on who you are becoming.', B2: 'Your business foundations and digital presence.', L1: 'Your existing network and next audience.', L2: 'Turn a solution you know into an offer.', L3: 'Connect your story to a clear next step.', E1: 'Choose your goal and first action.' };
    return { ...module, ...(module.key === 'B2' ? { title: 'Build Your Presence', deliverable: 'Business & Brand Foundations' } : {}), description: descriptions[module.key] ?? module.description, questions };
  });
}
