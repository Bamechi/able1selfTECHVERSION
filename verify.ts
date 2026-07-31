import { readFileSync } from "node:fs";
/**
 * VERIFICATION HARNESS — Able1Self identity engine
 * Run: npx tsx verify.ts
 * Checks: determinism, reachability of all 16 archetypes, graceful partial data,
 * profile assembly, matching, and calculator correctness.
 */

import {
  programModules,
  questionMap,
  stages,
  isModuleUnlocked,
  isStageUnlocked,
  nextModule,
  overallProgress,
  requiredQuestionKeys,
  CORE_VALUES,
} from "./lib/program-data";

import {
  resolveIdentity,
  resolveStyleArchetype,
  resolvePalette,
  resolveIncomeStreams,
  resolveEnergyProfile,
  assembleBrandStatement,
  assembleProfile,
  partnerMatchScore,
  buildGuideContext,
  sunSign,
  lifePath,
  expressionNumber,
  ARCHETYPES,
  type AnswerSet,
} from "./lib/identity-engine";

let pass = 0;
let fail = 0;
function check(name: string, condition: boolean, detail = "") {
  if (condition) {
    pass += 1;
  } else {
    fail += 1;
    console.log(`  FAIL — ${name}${detail ? ` :: ${detail}` : ""}`);
  }
}

console.log("\n=== 1. STRUCTURE ===");
check("12 modules", programModules.length === 12, String(programModules.length));
check("4 stages", stages.length === 4);
const allKeys = programModules.flatMap((m) => m.questions.map((q) => q.key));
check("no duplicate question keys", new Set(allKeys).size === allKeys.length);
console.log(`  questions total: ${allKeys.length}`);
const scoredCount = programModules
  .flatMap((m) => m.questions)
  .filter((q) => q.scoring === "SCORED").length;
const flavorCount = programModules
  .flatMap((m) => m.questions)
  .filter((q) => q.scoring === "FLAVOR").length;
console.log(`  SCORED: ${scoredCount}   FLAVOR: ${flavorCount}`);
check(
  "every choice/multi/rank question has options",
  programModules
    .flatMap((m) => m.questions)
    .filter((q) => ["choice", "multi", "rank"].includes(q.control))
    .every((q) => (q.options?.length ?? 0) > 0),
);
check(
  "legacy type is always renderable",
  programModules
    .flatMap((m) => m.questions)
    .every((q) => ["choice", "text", "scale"].includes(q.type)),
);
check("20 core values", CORE_VALUES.length === 20);
check("A1 required keys resolve", requiredQuestionKeys("A1").length > 0);

console.log("\n=== 2. SCORING MAPS MATCH REAL OPTIONS ===");
// Every option string referenced by the engine must exist in the question bank.
const engineSource = readFileSync(
  new URL("./lib/identity-engine.ts", import.meta.url),
  "utf8",
);
const referencedKeys = [
  "a1_social_energy", "a1_plan_spont", "a1_decide", "a1_strengths", "a1_pace",
  "a1_risk", "a2_birth", "a2_element", "a2_recharge", "a2_drains", "a3_values",
  "a3_theme", "a3_driver", "b1_room_read", "b1_wardrobe", "b1_color",
  "b1_compliment", "b2_boldness", "b3_who", "b3_what", "b3_how", "b3_edit",
  "l2_skills", "l2_assets",
];
for (const key of referencedKeys) {
  check(`engine key "${key}" exists in bank`, Boolean(questionMap[key]));
}
// spot-check that engine option strings appear verbatim in the bank
const bankOptions = new Set(
  programModules.flatMap((m) => m.questions.flatMap((q) => q.options ?? [])),
);
const quotedInEngine = [...engineSource.matchAll(/"([^"\\]{6,})":\s*"[IOVMRBSC]"/g)].map(
  (m) => m[1],
);
const orphans = quotedInEngine.filter((o) => !bankOptions.has(o));
check("no orphaned option strings in axis maps", orphans.length === 0, orphans.join(" | "));
console.log(`  axis vote mappings checked: ${quotedInEngine.length}`);

console.log("\n=== 3. PATHWAY / UNLOCK LOGIC ===");
check("A1 unlocked at zero progress", isModuleUnlocked("A1", []));
check("A2 locked at zero progress", !isModuleUnlocked("A2", []));
check("B1 locked until Analyze done", !isModuleUnlocked("B1", ["A1", "A2"]));
check("B1 unlocked after Analyze done", isModuleUnlocked("B1", ["A1", "A2", "A3"]));
check("stage L locked mid-Brand", !isStageUnlocked("L", ["A1", "A2", "A3", "B1"]));
check("next module after A1 is A2", nextModule(["A1"]).key === "A2");
check("progress 25% after stage A", overallProgress(["A1", "A2", "A3"]) === 25);
check("progress 100% at 12", overallProgress(programModules.map((m) => m.key)) === 100);

console.log("\n=== 4. CALCULATORS ===");
check("sun sign Jan 5 = Capricorn", sunSign(1, 5) === "Capricorn", String(sunSign(1, 5)));
check("sun sign Dec 25 = Capricorn", sunSign(12, 25) === "Capricorn", String(sunSign(12, 25)));
check("sun sign Jul 31 = Leo", sunSign(7, 31) === "Leo", String(sunSign(7, 31)));
check("sun sign Mar 21 = Aries", sunSign(3, 21) === "Aries", String(sunSign(3, 21)));
check("life path 1990-05-15 = 3", lifePath("1990-05-15") === 3, String(lifePath("1990-05-15")));
check("master number 11 preserved", lifePath("1970-01-29") === 11, String(lifePath("1970-01-29")));
check("master number 22 preserved", lifePath("1900-05-07") === 22, String(lifePath("1900-05-07")));
check("non-master reduces to single digit", lifePath("1992-09-29") === 5, String(lifePath("1992-09-29")));
check("expression number computes", (expressionNumber("Brendan Amechi Okechukwu") ?? 0) > 0);
check("expression null on empty", expressionNumber("") === null);
check("life path null on bad input", lifePath("") === null);

console.log("\n=== 5. DETERMINISM + FULL ANSWER SET ===");
const full: AnswerSet = {
  a1_mbti: "INTJ",
  a1_social_energy: 2,
  a1_plan_spont: 2,
  a1_decide: "Logic and analysis",
  a1_strengths: ["Strategy / seeing ahead", "Craft / attention to detail", "Staying calm under pressure"],
  a1_pace: "Steady daily consistency",
  a1_risk: 2,
  a1_friend_line: "Calm, thinks three moves ahead.",
  a2_birth: { date: "1988-11-04", time: "06:15", city: "Chicago, IL" },
  a2_element: "Earth — grounded, building, patient",
  a2_recharge: "Solitude and stillness",
  a2_drains: ["Small talk", "Crowds", "Ambiguity"],
  a3_values: ["Mastery", "Integrity", "Legacy", "Freedom", "Family"],
  a3_theme: "Mastery — going deeper in my craft",
  a3_driver: "Proving something to myself",
  a3_defining: "Got laid off and rebuilt from scratch.",
  b1_room_read: "Refined and understated",
  b1_wardrobe: "A few perfect timeless pieces",
  b1_color: "Black, ivory, camel — quiet luxury",
  b1_compliment: "You always look so put-together.",
  b1_contexts: ["Boardrooms / clients", "Stage / camera / content"],
  b2_boldness: 2,
  b2_silhouette: "Tailored and fitted",
  b2_invest: ["A perfect tailored jacket", "Quality footwear"],
  b3_who: "senior operators",
  b3_what: "build a personal brand that outlives the job",
  b3_how: "a systems-first identity process",
  b3_voice: "Calm and authoritative",
  l1_net_style: "I build deep 1:1 relationships",
  l1_partner: "Complementary — different strengths",
  l1_doors: ["Clients / customers", "Media / audience"],
  l2_skills: ["Advising / consulting", "Teaching / speaking"],
  l2_assets: ["A specialized skill", "A proven result / track record"],
  l2_model: "Coaching / consulting",
  l2_goal: "250000",
  l3_ideal_customer: "VPs one step from the C-suite",
  l3_ideal_service: "90-day identity intensive",
  l3_ecosystem: ["Refer members I trust"],
  e1_goal: "Sign 10 clients at $10k",
  e1_horizon: "90 days",
  e1_activation: "A signature offer",
  e1_visibility: 3,
  e2_m1: "Offer built",
  e2_m2: "First 3 clients",
  e2_m3: "Case studies live",
  e2_weekly: ["Publish content", "Sales conversations"],
  e2_derailer: "Perfectionism",
  e3_checkin: "Weekly",
  e3_momentum: "Someone expecting an update",
  e3_support: ["Accountability partner"],
  e3_commitment: "I finish what I start.",
};

const r1 = resolveIdentity(full, true);
const r2 = resolveIdentity(full, true);
check("deterministic — same answers, same code", r1.code === r2.code);
check("archetype resolves to a real entry", Boolean(ARCHETYPES[r1.code]));
console.log(`  resolved: ${r1.code} — ${r1.archetype.name} (confidence ${r1.confidence})`);
console.log(`  axes: ${r1.axes.map((a) => `${a.label}:${a.poleName}[${a.scores[Object.keys(a.scores)[0]]}/${a.scores[Object.keys(a.scores)[1]]}] via ${a.resolvedBy}`).join("  ")}`);
check("expected IMRS for this profile", r1.code === "IMRS", r1.code);

console.log("\n=== 6. ALL 16 ARCHETYPES REACHABLE ===");
// Drive each axis to each pole with a minimal, realistic answer set.
const polar = {
  I: { a1_social_energy: 1, a2_recharge: "Solitude and stillness", a2_drains: ["Small talk", "Crowds"] },
  O: { a1_social_energy: 5, a2_recharge: "Deep conversation with a few people", a2_drains: ["Sitting still", "Repetition"] },
  V: { a3_theme: "Reinvention — becoming someone new", a3_driver: "A vision only I can see", a1_decide: "A gut read of the moment" },
  M: { a3_theme: "Mastery — going deeper in my craft", a3_driver: "Providing for people I love", a1_decide: "Logic and analysis" },
  R: { b2_boldness: 1, b1_room_read: "Refined and understated", b1_wardrobe: "A few perfect timeless pieces", b1_color: "Black, ivory, camel — quiet luxury", b1_compliment: "You always look so put-together." },
  B: { b2_boldness: 5, b1_room_read: "Bold and unforgettable", b1_wardrobe: "Statement items that turn heads", b1_color: "Deep jewel tones and contrast", b1_compliment: "You have such a signature look." },
  S: { a1_risk: 1, a1_pace: "Steady daily consistency", a2_element: "Earth — grounded, building, patient", a1_plan_spont: 1 },
  C: { a1_risk: 5, a1_pace: "Sprints of intense focus", a2_element: "Fire — drive, passion, action", a1_plan_spont: 5 },
};

const reached = new Set<string>();
for (const e of ["I", "O"] as const)
  for (const d of ["V", "M"] as const)
    for (const p of ["R", "B"] as const)
      for (const m of ["S", "C"] as const) {
        const answers: AnswerSet = { ...polar[e], ...polar[d], ...polar[p], ...polar[m] };
        const result = resolveIdentity(answers, true);
        reached.add(result.code);
        check(`${e}${d}${p}${m} reachable`, result.code === `${e}${d}${p}${m}`, `got ${result.code}`);
      }
check("all 16 codes reached", reached.size === 16, `${reached.size}`);
check("roster has 16 entries", Object.keys(ARCHETYPES).length === 16);
check(
  "every roster entry fully written",
  Object.values(ARCHETYPES).every(
    (a) =>
      a.name && a.tagline && a.identity.length > 80 && a.edge &&
      a.strengths.length === 3 && a.blindSpots.length === 3 &&
      a.idealRooms.length === 3 && a.monetizationTilt && a.howToShowUp &&
      a.partnerFit.length === 3,
  ),
);
check(
  "all partnerFit codes are valid archetypes",
  Object.values(ARCHETYPES).every((a) => a.partnerFit.every((c) => Boolean(ARCHETYPES[c]))),
);

console.log("\n=== 7. GRACEFUL PARTIAL DATA ===");
const empty = resolveIdentity({}, false);
check("empty answers do not crash", Boolean(empty.code));
check("empty answers flagged provisional", empty.provisional === true);
check("empty answers zero confidence", empty.confidence === 0);
check("style archetype null when unanswered", resolveStyleArchetype({}) === null);
check("palette null when unanswered", resolvePalette({}) === null);
check("income streams empty when unanswered", resolveIncomeStreams({}).length === 0);
check("brand statement null when incomplete", assembleBrandStatement({ b3_who: "x" }) === null);
const partialEnergy = resolveEnergyProfile({}, undefined);
check("energy profile safe when empty", partialEnergy.moonRisingStatus === "needs_birth_time_and_city");

console.log("\n=== 8. SUB-PROFILES ===");
check("style archetype resolves", resolveStyleArchetype(full) === "The Icon of Restraint", String(resolveStyleArchetype(full)));
check("palette resolves", resolvePalette(full)?.name === "Quiet Luxury");
const streams = resolveIncomeStreams(full);
check("3 income streams returned", streams.length === 3, String(streams.length));
console.log(`  streams: ${streams.map((s) => s.label).join(", ")}`);
check(
  "brand statement assembles",
  assembleBrandStatement(full) ===
    "I help senior operators build a personal brand that outlives the job, through a systems-first identity process.",
  String(assembleBrandStatement(full)),
);
check("edited statement overrides generated", assembleBrandStatement({ ...full, b3_edit: "Mine." }) === "Mine.");

console.log("\n=== 9. PROFILE ASSEMBLY ===");
const half = assembleProfile({ answers: full, completedModules: ["A1", "A2", "A3"], fullBirthName: "Test Member" });
check("12 sections always present", half.sections.length === 12);
check("locked sections carry no content", half.sections.filter((s) => s.locked).every((s) => s.content === null));
check("unlocked sections carry content", half.sections.filter((s) => !s.locked).every((s) => s.content !== null));
check("identity provisional after Analyze only", half.identity?.provisional === true);
check("completion 25%", half.completion === 25);

const done = assembleProfile({
  answers: full,
  completedModules: programModules.map((m) => m.key),
  fullBirthName: "Brendan Amechi Okechukwu",
});
check("complete flag at 12/12", done.complete === true);
check("identity final when Brand complete", done.identity?.provisional === false);
check("no locked sections at 100%", done.sections.every((s) => !s.locked));
check("sun sign computed", done.energy.sunSign === "Scorpio", String(done.energy.sunSign));
check("life path computed", done.energy.lifePath !== null);

console.log("\n=== 10. AI GUIDE CONTEXT ===");
const ctx = buildGuideContext(done, "Test Member");
check("context includes archetype", ctx.includes(done.identity!.archetype.name));
check("context includes blind spots", ctx.includes("blind spots"));
check("context includes income streams", ctx.includes("Top income streams"));
check("context is substantial", ctx.length > 1200, `${ctx.length} chars`);

console.log("\n=== 11. PARTNER MATCHING ===");
const self = { code: "IMRS", preference: "Complementary — different strengths", progress: 50, doors: ["Clients / customers"] };
const goodMatch = { code: "OVBC", preference: "At my level — grows with me", progress: 50, doors: ["Clients / customers"] };
const weakMatch = { code: "IMRC", preference: "Tough — holds me to it", progress: 50, doors: ["Capital / investors"] };
const gs = partnerMatchScore(self, goodMatch);
const ws = partnerMatchScore(self, weakMatch);
check("complementary scores higher than similar", gs > ws, `${gs} vs ${ws}`);
check("scores bounded 0-100", gs <= 100 && ws >= 0);
console.log(`  IMRS→OVBC = ${gs}   IMRS→IMRC = ${ws}`);

console.log(`\n${"=".repeat(46)}`);
console.log(`RESULT: ${pass} passed, ${fail} failed`);
console.log(`${"=".repeat(46)}\n`);
if (fail > 0) process.exit(1);
