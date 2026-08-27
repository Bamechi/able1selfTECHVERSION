"use client";
/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import {
  type ReactNode,
  type CSSProperties,
  type FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  assembleProfile,
  type AnswerSet,
  type AnswerValue,
  type Archetype,
  type AxisResult,
} from "../../lib/identity-engine";
import {
  type ProgramModule,
  type Question,
  programModules,
  stages,
} from "../../lib/program-data";
import { scoreBrandLedger } from "../../lib/brand-ledger";
import { scoreBrandSignal } from "../../lib/brand-signal";

type PortalView =
  | "overview"
  | "program"
  | "profile"
  | "plan"
  | "guide"
  | "client"
  | "admin"
  | "community"
  | "messages"
  | "settings";

type MemberData = {
  role: "member" | "admin";
  profile: {
    email: string;
    displayName: string;
    professionalTitle: string;
    bio: string;
    currentModule: string;
    overallProgress: number;
    completedModules: number;
  };
  progress: Array<{
    module_key: string;
    stage: string;
    module_order: number;
    status: string;
    progress: number;
  }>;
  responses: Array<{
    module_key: string;
    question_key: string;
    answer: AnswerValue;
    updated_at: string;
  }>;
  plan: Array<{
    id: number;
    title: string;
    why: string;
    success_metric: string;
    start_date: string;
    due_date: string;
    checkin_cadence: string;
    status: string;
  }>;
  planCheckins: Array<{
    id: number;
    plan_item_id: number;
    checkpoint_date: string;
    status: "on_track" | "off_track";
    explanation: string;
    created_at: string;
  }>;
  settings: {
    module_reminders: number | boolean;
    message_notifications: number | boolean;
    community_notifications: number | boolean;
  };
  posts: Array<{
    id: number;
    author_name: string;
    body: string;
    created_at: string;
  }>;
  messages: Array<{
    id: number;
    sender: string;
    body: string;
    created_at: string;
  }>;
  notifications: Array<{
    id: number;
    title: string;
    body: string;
    is_read: number | boolean;
    created_at: string;
  }>;
  insights: {
    workPattern: string;
    naturalValue: string;
    energySource: string;
    positioning: string;
    network: string;
    direction: string;
  };
  identity: {
    code: string;
    archetype: Archetype;
    provisional: boolean;
    confidence: number;
    axes: AxisResult[];
    computedAt: string;
  } | null;
  derived: {
    styleArchetype: string | null;
    palette: { name: string; swatches: string[]; note: string } | null;
    energy: Record<string, unknown>;
    incomeStreams: Array<{
      label: string;
      why: string;
      firstMove: string;
    }>;
    brandStatement: string | null;
    engineVersion: string;
  } | null;
  profileSections: Array<{
    key: string;
    moduleKey: string;
    stage: string;
    title: string;
    locked: boolean;
    content: Record<string, unknown>;
    updatedAt: string;
  }>;
  unlocks: Record<string, boolean>;
  birthData: Record<string, unknown> | null;
  synthesis: Record<string, unknown> | null;
};

const navigation: Array<{
  id: PortalView;
  label: string;
  symbol: string;
}> = [
  { id: "overview", label: "Home", symbol: "⌂" },
  { id: "program", label: "Program", symbol: "◫" },
  { id: "profile", label: "My profile", symbol: "◎" },
  { id: "plan", label: "90-day plan", symbol: "↗" },
  { id: "guide", label: "AI Guide", symbol: "◇" },
  { id: "client", label: "Members Only", symbol: "◆" },
  { id: "community", label: "The Room", symbol: "◌" },
  { id: "messages", label: "Messages", symbol: "↗" },
  { id: "settings", label: "Settings", symbol: "⌘" },
];

const adminNavigation: { id: PortalView; label: string; symbol: string } = {
  id: "admin",
  label: "Admin console",
  symbol: "▦",
};

const stageDetails = [
  {
    letter: "A",
    name: "Analyze",
    description: "See your patterns, energy, and story clearly.",
  },
  {
    letter: "B",
    name: "Brand",
    description: "Translate self-knowledge into a credible position.",
  },
  {
    letter: "L",
    name: "Leverage",
    description: "Map relationships, access, and opportunity paths.",
  },
  {
    letter: "E",
    name: "Embark",
    description: "Choose the move and build the 90-day system.",
  },
];

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}

function initials(name: string) {
  return (
    name
      .split(/\s+/)
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "A"
  );
}

type GeocodeResult = {
  name: string;
  admin1: string;
  country: string;
  latitude: number;
  longitude: number;
  timezone: string;
};

function BirthField({
  value,
  onChange,
}: {
  value: AnswerValue;
  onChange: (value: AnswerValue) => void;
}) {
  const birth =
    value && typeof value === "object" && !Array.isArray(value)
      ? (value as Record<string, string | number>)
      : {};
  const [results, setResults] = useState<GeocodeResult[]>([]);
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState("");
  const update = (key: string, next: string | number) =>
    onChange({ ...birth, [key]: next } as AnswerValue);

  async function resolveLocation() {
    setLocating(true);
    setLocationError("");
    try {
      const query = [birth.city, birth.state, birth.country]
        .filter(Boolean)
        .join(", ");
      const response = await fetch(`/api/geocode?q=${encodeURIComponent(query)}`);
      const payload = (await response.json()) as {
        results?: GeocodeResult[];
        error?: string;
      };
      if (!response.ok) throw new Error(payload.error ?? "Location lookup failed.");
      setResults(payload.results ?? []);
      if (!(payload.results ?? []).length) setLocationError("No matching cities found. Check the spelling and try again.");
    } catch (error) {
      setLocationError(error instanceof Error ? error.message : "Location lookup failed.");
    } finally {
      setLocating(false);
    }
  }

  return (
    <div className="assessment-birth">
      <label className="birth-wide">
        <span>FULL BIRTH NAME</span>
        <input
          value={String(birth.fullName ?? "")}
          onChange={(event) => update("fullName", event.target.value)}
          placeholder="As it appears on your birth certificate"
        />
      </label>
      <label>
        <span>BIRTH DATE</span>
        <input type="date" value={String(birth.date ?? "")} onChange={(event) => update("date", event.target.value)} />
      </label>
      <label>
        <span>LOCAL BIRTH TIME</span>
        <input type="time" value={String(birth.time ?? "")} onChange={(event) => update("time", event.target.value)} />
      </label>
      <label>
        <span>CITY</span>
        <input value={String(birth.city ?? "")} onChange={(event) => update("city", event.target.value)} placeholder="Chicago" />
      </label>
      <label>
        <span>STATE / PROVINCE</span>
        <input value={String(birth.state ?? "")} onChange={(event) => update("state", event.target.value)} placeholder="Illinois" />
      </label>
      <label className="birth-wide">
        <span>COUNTRY</span>
        <input value={String(birth.country ?? "")} onChange={(event) => update("country", event.target.value)} placeholder="United States" />
      </label>
      <button className="birth-resolve" type="button" disabled={locating || !birth.city} onClick={resolveLocation}>
        {locating ? "Finding locations..." : birth.timezone ? "Change verified location" : "Find and verify location"}
      </button>
      {locationError && <p className="birth-error">{locationError}</p>}
      {results.length > 0 && (
        <div className="birth-results" role="listbox" aria-label="Matching birth locations">
          {results.map((result) => (
            <button
              key={`${result.latitude}-${result.longitude}`}
              type="button"
              onClick={() => {
                onChange({
                  ...birth,
                  city: result.name,
                  state: result.admin1,
                  country: result.country,
                  latitude: result.latitude,
                  longitude: result.longitude,
                  timezone: result.timezone,
                } as AnswerValue);
                setResults([]);
              }}
            >
              <strong>{result.name}</strong>
              <span>{[result.admin1, result.country].filter(Boolean).join(", ")} · {result.timezone}</span>
            </button>
          ))}
        </div>
      )}
      {birth.timezone && (
        <p className="birth-verified">Location verified · {String(birth.timezone)}</p>
      )}
    </div>
  );
}

function AnswerField({
  question,
  value,
  onChange,
  derived,
}: {
  question: Question;
  value: AnswerValue;
  onChange: (value: AnswerValue) => void;
  derived?: ReactNode;
}) {
  if (question.control === "derived") {
    return <div className="assessment-derived">{derived}</div>;
  }

  if (question.control === "multi") {
    const selected = Array.isArray(value) ? value : [];
    return (
      <div className="assessment-options assessment-multi">
        {question.options?.map((option) => {
          const active = selected.includes(option);
          return (
            <button
              className={active ? "selected" : ""}
              key={option}
              type="button"
              onClick={() => {
                if (active) onChange(selected.filter((item) => item !== option));
                else if (selected.length < (question.max ?? 1)) {
                  onChange([...selected, option]);
                }
              }}
            >
              <span>{active ? "✓" : "+"}</span>
              {option}
            </button>
          );
        })}
        <p className="selection-count">
          {selected.length} / {question.max ?? 1} selected
        </p>
      </div>
    );
  }

  if (question.control === "rank") {
    const selected = Array.isArray(value) ? value : [];
    return (
      <div className="assessment-rank">
        <ol>
          {Array.from({ length: question.rank ?? 5 }, (_, index) => (
            <li key={index}>
              <span>0{index + 1}</span>
              <strong>{selected[index] ?? "Select a value below"}</strong>
              {selected[index] && (
                <button
                  type="button"
                  onClick={() =>
                    onChange(selected.filter((_, itemIndex) => itemIndex !== index))
                  }
                >
                  ×
                </button>
              )}
            </li>
          ))}
        </ol>
        <div>
          {question.options?.map((option) => (
            <button
              className={selected.includes(option) ? "selected" : ""}
              disabled={
                selected.includes(option) || selected.length >= (question.rank ?? 5)
              }
              key={option}
              type="button"
              onClick={() => onChange([...selected, option])}
            >
              {option}
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (question.control === "choice" || question.control === "mbti") {
    const selected = typeof value === "string" ? value : "";
    return (
      <div className={question.control === "mbti" ? "assessment-mbti" : ""}>
        {question.control === "mbti" && (
          <div className="mbti-note">
            <strong>Don&apos;t know your personality type yet?</strong>
            <p>
              Take the free 16Personalities test, then return here and select
              the four-letter type it gives you. This answer adds context to
              your profile and does not score your Able identity code.
            </p>
            {question.link && (
              <a href={question.link.url} rel="noreferrer" target="_blank">
                {question.link.label}
              </a>
            )}
          </div>
        )}
        <div className="assessment-options">
          {question.options?.map((option) => (
            <button
              className={selected === option ? "selected" : ""}
              key={option}
              type="button"
              onClick={() => onChange(option)}
            >
              <span>{selected === option ? "●" : "○"}</span>
              {option}
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (question.control === "scale") {
    const min = question.scaleMin ?? 1;
    const max = question.scaleMax ?? 5;
    const selected = typeof value === "number" ? value : Number(value) || 0;
    return (
      <div className="assessment-scale">
        <div>
          {Array.from({ length: max - min + 1 }, (_, index) => min + index).map(
            (number) => (
              <button
                className={selected === number ? "selected" : ""}
                key={number}
                type="button"
                onClick={() => onChange(number)}
                aria-label={question.stateLabels?.[number - min] ?? String(number)}
              >
                {number}
                {question.stateLabels && <span>{question.stateLabels[number - min]}</span>}
              </button>
            ),
          )}
        </div>
        <p>
          <span>{question.scaleLow ?? "Low"}</span>
          <span>{question.scaleHigh ?? "High"}</span>
        </p>
      </div>
    );
  }

  if (question.control === "birth") {
    return <BirthField value={value} onChange={onChange} />;
  }

  if (question.control === "text") {
    return (
      <input
        className="assessment-input"
        value={typeof value === "string" ? value : ""}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Write your answer here."
      />
    );
  }

  return (
    <textarea
      className="assessment-textarea"
      value={typeof value === "string" ? value : ""}
      onChange={(event) => onChange(event.target.value)}
      placeholder="Write what is true for you—not what sounds impressive."
      rows={7}
    />
  );
}

function hasAnswer(value: AnswerValue) {
  if (value === null || value === undefined) return false;
  if (typeof value === "string") return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === "object") {
    if ("date" in value || "fullName" in value) {
      const birth = value as Record<string, unknown>;
      return ["fullName", "date", "time", "city", "country", "timezone", "latitude", "longitude"]
        .every((key) => birth[key] !== undefined && birth[key] !== null && String(birth[key]).trim().length > 0);
    }
    return Object.values(value).some(
      (item) => typeof item === "string" && item.trim().length > 0,
    );
  }
  return true;
}

function formatAnswer(value: AnswerValue) {
  if (Array.isArray(value)) return value.join(" · ");
  if (value && typeof value === "object") {
    return Object.entries(value)
      .filter(([, item]) => Boolean(item))
      .map(([key, item]) => `${key}: ${String(item)}`)
      .join(" · ");
  }
  return String(value ?? "");
}

function ModulePlayer({
  programModule,
  data,
  saving,
  onClose,
  onSave,
  onComplete,
}: {
  programModule: ProgramModule;
  data: MemberData;
  saving: boolean;
  onClose: () => void;
  onSave: (
    moduleKey: string,
    questionKey: string,
    answer: AnswerValue,
  ) => Promise<void>;
  onComplete: (moduleKey: string) => Promise<void>;
}) {
  const firstIncomplete = programModule.questions.findIndex(
    (question) =>
      question.required &&
      !data.responses.some(
        (response) =>
          response.question_key === question.key && hasAnswer(response.answer),
      ),
  );
  const [questionIndex, setQuestionIndex] = useState(
    firstIncomplete === -1 ? 0 : firstIncomplete,
  );
  const question = programModule.questions[questionIndex];
  const savedAnswer =
    data.responses.find((response) => response.question_key === question.key)
      ?.answer ?? null;
  const [answer, setAnswer] = useState<AnswerValue>(savedAnswer);
  const requiredQuestions = programModule.questions.filter(
    (item) => item.required,
  );
  const answeredRequired = requiredQuestions.filter((item) =>
    data.responses.some(
      (response) =>
        response.question_key === item.key && hasAnswer(response.answer),
    ),
  ).length;
  const answers = Object.fromEntries(
    data.responses.map((response) => [response.question_key, response.answer]),
  ) as AnswerSet;
  const completedModules = data.progress
    .filter((item) => item.status === "complete")
    .map((item) => item.module_key);
  const assembled = assembleProfile({
    answers,
    completedModules,
    fullBirthName:
      typeof data.birthData?.full_birth_name === "string"
        ? data.birthData.full_birth_name
        : undefined,
  });

  function derivedContent() {
    if (question.derivedKey === "energy_calc") {
      return (
        <>
          <span>ENERGY SIGNATURE</span>
          <h3>
            {assembled.energy.sunSign ? `${assembled.energy.sunSign} Sun` : "Add and verify your birth details"}
          </h3>
          {assembled.energy.chart ? (
            <div className="energy-result-grid">
              <p><strong>{assembled.energy.moonSign}</strong><span>Moon</span></p>
              <p><strong>{assembled.energy.risingSign}</strong><span>Rising</span></p>
              <p><strong>{assembled.energy.element}</strong><span>Element</span></p>
              <p><strong>{assembled.energy.lifePath}</strong><span>Life Path · {assembled.energy.lifePathMeaning?.title}</span></p>
            </div>
          ) : (
            <p>Exact local time and a verified city are required for Moon and Rising.</p>
          )}
          {assembled.energy.moonRisingStatus === "verify_cusp" && (
            <p className="cusp-notice">One position is within 1° of a sign boundary. Verify the birth time before treating that sign as final.</p>
          )}
          {assembled.energy.explanations.map((explanation) => <p key={explanation}>{explanation}</p>)}
          {assembled.energy.lifePathMeaning && <p>{assembled.energy.lifePathMeaning.reading}</p>}
        </>
      );
    }
    if (question.derivedKey === "brand_signal") {
      const signal = scoreBrandSignal(answers);
      return (
        <>
          <span>BRAND SIGNAL</span>
          <h3>{signal ? `${signal.code} · ${signal.profile.name}` : "Complete all instinct pairs"}</h3>
          <p>{signal?.profile.read}</p>
          {signal && <p><strong>Best next investment:</strong> {signal.profile.buys}</p>}
        </>
      );
    }
    if (question.derivedKey === "brand_ledger") {
      const ledger = scoreBrandLedger(answers);
      return (
        <>
          <span>BRAND LEDGER</span>
          <h3>{ledger ? `${ledger.score} / 1,000 · ${ledger.band}` : "Complete the asset audit"}</h3>
          {ledger?.nextMoves.map((move, index) => (
            <p key={move.key}><strong>0{index + 1} · {move.name}</strong> · {move.move}</p>
          ))}
        </>
      );
    }
    if (question.derivedKey === "style_archetype") {
      return (
        <>
          <span>STYLE ARCHETYPE</span>
          <h3>{assembled.styleArchetype ?? "Keep answering to reveal it"}</h3>
          <p>Your outward image signal is scored separately from Core Identity.</p>
        </>
      );
    }
    if (question.derivedKey === "color_palette") {
      return (
        <>
          <span>COLOR PALETTE</span>
          <h3>{assembled.palette?.name ?? "Complete B1 to generate it"}</h3>
          {assembled.palette && (
            <div className="derived-swatches">
              {assembled.palette.swatches.map((swatch) => (
                <i key={swatch} style={{ background: swatch }} />
              ))}
            </div>
          )}
          <p>{assembled.palette?.note}</p>
        </>
      );
    }
    if (question.derivedKey === "brand_statement") {
      return (
        <>
          <span>POSITIONING STATEMENT</span>
          <h3>{assembled.brandStatement ?? "Answer who, what, and how first."}</h3>
        </>
      );
    }
    if (question.derivedKey === "income_streams") {
      return (
        <>
          <span>TOP INCOME STREAMS</span>
          <h3>
            {assembled.incomeStreams.map((stream) => stream.label).join(" · ") ||
              "Answer your skills and assets first."}
          </h3>
        </>
      );
    }
    return (
      <>
        <span>CORE IDENTITY</span>
        <h3>
          {assembled.identity
            ? `${assembled.identity.code} · ${assembled.identity.archetype.name}`
            : "Complete Analyze to reveal your Core Identity."}
        </h3>
      </>
    );
  }

  async function saveAndMove(direction: -1 | 1) {
    if (question.control !== "derived" && hasAnswer(answer)) {
      await onSave(programModule.key, question.key, answer);
    }
    const nextIndex = Math.max(
      0,
      Math.min(programModule.questions.length - 1, questionIndex + direction),
    );
    const nextQuestion = programModule.questions[nextIndex];
    setAnswer(
      data.responses.find(
        (response) => response.question_key === nextQuestion.key,
      )?.answer ?? null,
    );
    setQuestionIndex(nextIndex);
  }

  const currentCompletesRequirement =
    Boolean(question.required) && !hasAnswer(savedAnswer) && hasAnswer(answer);
  const allRequiredAnswered =
    answeredRequired + (currentCompletesRequirement ? 1 : 0) >=
    requiredQuestions.length;

  return (
    <div className="module-player-overlay" role="dialog" aria-modal="true">
      <button
        className="module-player-backdrop"
        type="button"
        onClick={onClose}
        aria-label="Close module"
      />
      <section className="module-player">
        <header>
          <div className="module-player-brand">
            <img src="/able1self-logo.png" alt="" />
            <span>ABLE / MEMBER OS</span>
          </div>
          <button type="button" onClick={onClose} aria-label="Close module">
            ×
          </button>
        </header>

        <div className="module-player-meta">
          <span>
            {programModule.key} / {programModule.stageName}
          </span>
          <strong>{programModule.title}</strong>
          <div>
            {programModule.questions.map((item, index) => (
              <i
                className={
                  index === questionIndex
                    ? "active"
                    : item.control === "derived" ||
                        data.responses.some(
                          (response) => response.question_key === item.key,
                        )
                      ? "complete"
                      : ""
                }
                key={item.key}
              />
            ))}
          </div>
        </div>

        <main>
          <span className="assessment-number">
            QUESTION {String(questionIndex + 1).padStart(2, "0")} / {" "}
            {String(programModule.questions.length).padStart(2, "0")}
          </span>
          <h2>{question.prompt}</h2>
          <p>{question.guidance}</p>
          <AnswerField
            question={question}
            value={answer}
            onChange={setAnswer}
            derived={derivedContent()}
          />
        </main>

        <footer>
          <button
            className="module-secondary"
            type="button"
            disabled={saving || questionIndex === 0}
            onClick={() => saveAndMove(-1)}
          >
            ← Previous
          </button>
          <span>
            {saving ? "Saving securely…" : "Your work is saved as you move."}
          </span>
          {questionIndex < programModule.questions.length - 1 ? (
            <button
              className="module-primary"
              type="button"
              disabled={
                saving || (Boolean(question.required) && !hasAnswer(answer))
              }
              onClick={() => saveAndMove(1)}
            >
              {question.control === "derived" || !hasAnswer(answer)
                ? "Continue →"
                : "Save & continue →"}
            </button>
          ) : (
            <button
              className="module-primary"
              type="button"
              disabled={saving || !allRequiredAnswered}
              onClick={async () => {
                if (question.control !== "derived" && hasAnswer(answer)) {
                  await onSave(programModule.key, question.key, answer);
                }
                await onComplete(programModule.key);
              }}
            >
              Complete module ✓
            </button>
          )}
        </footer>
      </section>
    </div>
  );
}

function IdentityReveal({
  mode,
  identity,
  onClose,
}: {
  mode: "provisional" | "locked";
  identity: NonNullable<MemberData["identity"]>;
  onClose: (destination: PortalView) => void;
}) {
  const archetype = identity.archetype;
  return (
    <div className="identity-reveal" role="dialog" aria-modal="true">
      <div className="identity-reveal-orb" aria-hidden="true" />
      <header>
        <img src="/able1self-logo.png" alt="" />
        <span>ABLE / IDENTITY ENGINE 2.0</span>
      </header>
      <main>
        <span>
          {mode === "provisional"
            ? "ANALYZE COMPLETE / PROVISIONAL IDENTITY"
            : "YOUR CORE IDENTITY IS LOCKED"}
        </span>
        <strong>{identity.code.split("").join(" · ")}</strong>
        <h1>{archetype.name}</h1>
        <p>{archetype.identity}</p>
        {mode === "locked" ? (
          <div className="identity-reveal-grid">
            <article>
              <span>YOUR EDGE</span>
              <p>{archetype.edge}</p>
            </article>
            <article>
              <span>WATCH FOR</span>
              <p>{archetype.blindSpots[0]}</p>
            </article>
            <article>
              <span>HOW TO SHOW UP</span>
              <p>{archetype.howToShowUp}</p>
            </article>
          </div>
        ) : (
          <p className="identity-provisional-note">
            This is your forming result. Brand resolves the Presence axis and
            locks your final four-letter code.
          </p>
        )}
      </main>
      <footer>
        <button
          type="button"
          onClick={() => onClose(mode === "locked" ? "profile" : "program")}
        >
          {mode === "locked" ? "See my full profile →" : "Continue to Brand →"}
        </button>
        {mode === "locked" && (
          <button type="button" onClick={() => onClose("program")}>
            Continue to Leverage
          </button>
        )}
      </footer>
    </div>
  );
}

function StagePrelude({
  programModule,
  onContinue,
  onClose,
}: {
  programModule: ProgramModule;
  onContinue: () => void;
  onClose: () => void;
}) {
  const stage = stages.find((item) => item.key === programModule.stage);
  return (
    <div className="stage-prelude" role="dialog" aria-modal="true">
      <button type="button" onClick={onClose} aria-label="Close stage introduction">
        ×
      </button>
      <span>STAGE 0{stage?.order} / 04</span>
      <strong aria-hidden="true">{programModule.stage}</strong>
      <h1>{stage?.name}</h1>
      <p>“{stage?.quote.text}”</p>
      <small>— {stage?.quote.attribution}</small>
      <div>
        <p>{stage?.whatItDoes}</p>
        <button type="button" onClick={onContinue}>
          Begin {programModule.title} →
        </button>
      </div>
    </div>
  );
}

export default function MemberPage() {
  const [data, setData] = useState<MemberData | null>(null);
  const [view, setView] = useState<PortalView>("overview");
  const portalMainRef = useRef<HTMLElement>(null);
  const [activeModule, setActiveModule] = useState<ProgramModule | null>(null);
  const [stagePrelude, setStagePrelude] = useState<ProgramModule | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [identityReveal, setIdentityReveal] = useState<{
    mode: "provisional" | "locked";
    identity: NonNullable<MemberData["identity"]>;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    void loadMember();
  }, []);

  useEffect(() => {
    portalMainRef.current?.scrollTo({ top: 0, behavior: "instant" });
  }, [view]);

  async function loadMember() {
    try {
      const response = await fetch("/api/member", { cache: "no-store" });
      if (response.status === 401) {
        window.location.assign("/?login=1");
        return;
      }
      const result = (await response.json()) as {
        ok?: boolean;
        data?: MemberData;
        error?: string;
      };
      if (!response.ok || !result.data) {
        throw new Error(result.error ?? "Unable to load your member portal.");
      }
      setData(result.data);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Unable to load your member portal.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function mutate(payload: Record<string, unknown>) {
    setSaving(true);
    setError("");
    try {
      const response = await fetch("/api/member", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (response.status === 401) {
        window.location.assign("/?login=1");
        throw new Error("Your session expired.");
      }
      const result = (await response.json()) as {
        ok?: boolean;
        data?: MemberData;
        error?: string;
      };
      if (!response.ok || !result.data) {
        throw new Error(result.error ?? "Unable to save your changes.");
      }
      setData(result.data);
      return result.data;
    } catch (caught) {
      const message =
        caught instanceof Error ? caught.message : "Unable to save your changes.";
      setError(message);
      throw caught;
    } finally {
      setSaving(false);
    }
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.assign("/");
  }

  function openProgramModule(programModule: ProgramModule) {
    const firstInStage = programModules.find(
      (item) => item.stage === programModule.stage,
    );
    const stageStarted = data?.progress.some(
      (item) => item.stage === programModule.stage && item.status !== "not_started",
    );
    if (firstInStage?.key === programModule.key && !stageStarted) {
      setStagePrelude(programModule);
    } else {
      setActiveModule(programModule);
    }
  }

  const currentModule = useMemo(
    () =>
      programModules.find(
        (module) => module.key === data?.profile.currentModule,
      ) ?? programModules[0],
    [data?.profile.currentModule],
  );
  const unread =
    data?.notifications.filter((notification) => !notification.is_read).length ??
    0;
  const visibleNavigation = useMemo(() => {
    if (data?.role !== "admin") return navigation;
    return [
      ...navigation.slice(0, -1),
      adminNavigation,
      navigation[navigation.length - 1],
    ];
  }, [data?.role]);

  if (loading) {
    return (
      <main className="member-loading">
        <img src="/able1self-logo.png" alt="" />
        <span>CONNECTING TO YOUR MEMBER OS</span>
        <div />
      </main>
    );
  }

  if (!data) {
    return (
      <main className="member-loading member-error">
        <img src="/able1self-logo.png" alt="" />
        <h1>Your portal could not load.</h1>
        <p>{error}</p>
        <button type="button" onClick={loadMember}>
          Try again
        </button>
      </main>
    );
  }

  return (
    <main className="member-portal live-member-portal">
      <aside className={`portal-sidebar ${menuOpen ? "open" : ""}`}>
        <Link className="portal-brand" href="/">
          <img src="/able1self-logo.png" alt="" />
          <span>ABLE1SELF</span>
        </Link>
        <nav aria-label="Member navigation">
          {visibleNavigation.map((item) => (
            <button
              className={view === item.id ? "active" : ""}
              key={item.id}
              type="button"
              onClick={() => {
                setView(item.id);
                setMenuOpen(false);
              }}
            >
              <span>{item.symbol}</span>
              {item.label}
              <i />
            </button>
          ))}
        </nav>
        <div className="portal-user">
          <div>{initials(data.profile.displayName)}</div>
          <p>
            <strong>{data.profile.displayName}</strong>
            <small>{data.profile.email}</small>
          </p>
          <button type="button" onClick={logout} aria-label="Sign out">
            ↗
          </button>
        </div>
      </aside>

      <section className="portal-main" ref={portalMainRef}>
        <header className="portal-topbar">
          <button
            className="portal-menu"
            type="button"
            onClick={() => setMenuOpen((value) => !value)}
            aria-label="Toggle portal navigation"
          >
            ☰
          </button>
          <div>
            <span className="portal-live-dot" />
            Progress saved securely
          </div>
          <div className="portal-top-actions">
            <button
              type="button"
              onClick={() => setActiveModule(currentModule)}
            >
              Continue {currentModule.key}
            </button>
            <button
              type="button"
              onClick={async () => {
                setNotificationsOpen((value) => !value);
                if (unread) {
                  await mutate({ action: "mark_notifications_read" });
                }
              }}
              aria-label="Notifications"
            >
              ◌
              {unread > 0 && <i>{unread}</i>}
            </button>
          </div>
        </header>

        {notificationsOpen && (
          <aside className="notification-drawer">
            <header>
              <div>
                <span>MEMBER SIGNALS</span>
                <h2>Notifications</h2>
              </div>
              <button
                type="button"
                onClick={() => setNotificationsOpen(false)}
              >
                ×
              </button>
            </header>
            {data.notifications.map((notification) => (
              <article key={notification.id}>
                <i />
                <div>
                  <strong>{notification.title}</strong>
                  <p>{notification.body}</p>
                  <span>{formatDate(notification.created_at)}</span>
                </div>
              </article>
            ))}
          </aside>
        )}

        <div className="portal-content">
          {data.profile.overallProgress < 100 && (
            <button
              className="portal-progress-reminder"
              type="button"
              onClick={() => openProgramModule(currentModule)}
            >
              <span>PROFILE IN PROGRESS</span>
              <div>
                <strong>
                  {data.profile.completedModules === 0
                    ? `Start with ${currentModule.title}.`
                    : `Keep going with ${currentModule.title}.`}
                </strong>
                <p>
                  Your work is saved. Continue from your next unanswered question
                  whenever you return.
                </p>
              </div>
              <em>
                {data.profile.completedModules}/{programModules.length} modules complete
              </em>
              <b>Continue profile →</b>
            </button>
          )}

          {error && (
            <div className="portal-alert" role="status">
              {error}
              <button type="button" onClick={() => setError("")}>
                ×
              </button>
            </div>
          )}

          {view === "overview" && (
            <Overview
              data={data}
              currentModule={currentModule}
              onOpenModule={openProgramModule}
              onNavigate={setView}
            />
          )}
          {view === "program" && (
            <Program data={data} onOpenModule={openProgramModule} />
          )}
          {view === "profile" && <Profile data={data} />}
          {view === "plan" && (
            <Plan data={data} saving={saving} mutate={mutate} />
          )}
          {view === "guide" && <Guide data={data} />}
          {view === "client" && <ClientPortal key="member-client-portal" />}
          {view === "admin" && data.role === "admin" && (
            <ClientPortal key="admin-client-portal" adminMode />
          )}
          {view === "community" && (
            <Community data={data} saving={saving} mutate={mutate} />
          )}
          {view === "messages" && (
            <Messages data={data} saving={saving} mutate={mutate} />
          )}
          {view === "settings" && (
            <Settings data={data} saving={saving} mutate={mutate} />
          )}
        </div>
      </section>

      {activeModule && (
        <ModulePlayer
          programModule={activeModule}
          data={data}
          saving={saving}
          onClose={() => setActiveModule(null)}
          onSave={async (moduleKey, questionKey, answer) => {
            await mutate({
              action: "save_response",
              moduleKey,
              questionKey,
              answer,
            });
          }}
          onComplete={async (moduleKey) => {
            const updated = await mutate({ action: "complete_module", moduleKey });
            if (
              updated?.identity &&
              (moduleKey === "A3" || moduleKey === "B3")
            ) {
              setIdentityReveal({
                mode: moduleKey === "A3" ? "provisional" : "locked",
                identity: updated.identity,
              });
            }
            setActiveModule(null);
            setView("overview");
          }}
        />
      )}
      {stagePrelude && (
        <StagePrelude
          programModule={stagePrelude}
          onClose={() => setStagePrelude(null)}
          onContinue={() => {
            setActiveModule(stagePrelude);
            setStagePrelude(null);
          }}
        />
      )}
      {identityReveal && (
        <IdentityReveal
          mode={identityReveal.mode}
          identity={identityReveal.identity}
          onClose={(destination) => {
            setIdentityReveal(null);
            setView(destination);
          }}
        />
      )}
    </main>
  );
}

function Overview({
  data,
  currentModule,
  onOpenModule,
  onNavigate,
}: {
  data: MemberData;
  currentModule: ProgramModule;
  onOpenModule: (module: ProgramModule) => void;
  onNavigate: (view: PortalView) => void;
}) {
  const openPlanItems = data.plan.filter((item) => item.status !== "complete");
  return (
    <div className="portal-view-stack">
      <div className="portal-welcome">
        <div>
          <span className="portal-eyebrow">
            {new Intl.DateTimeFormat("en", {
              weekday: "long",
              month: "long",
              day: "numeric",
            })
              .format(new Date())
              .toUpperCase()}
          </span>
          <h1>
            Welcome back,
            <span>{data.profile.displayName}.</span>
          </h1>
          <p>
            Your profile is {data.profile.overallProgress}% complete. Every
            completed module makes your personalized profile more useful.
          </p>
          {data.identity && (
            <button
              className="dashboard-identity-chip"
              type="button"
              onClick={() => onNavigate("profile")}
            >
              <strong>{data.identity.code}</strong>
              <span>{data.identity.archetype.name}</span>
              {data.identity.provisional && <i>PROVISIONAL</i>}
              <b>→</b>
            </button>
          )}
        </div>
        <div
          className="portal-score"
          style={
            {
              "--member-progress": `${data.profile.overallProgress * 3.6}deg`,
            } as CSSProperties
          }
        >
          <div className="portal-score-ring">
            <strong>{data.profile.overallProgress}%</strong>
            <span>PROFILE</span>
          </div>
        </div>
      </div>

      <div className="portal-stat-grid">
        <article>
          <span>Modules complete</span>
          <strong>{data.profile.completedModules}/{programModules.length}</strong>
          <small>Every response is stored</small>
        </article>
        <article>
          <span>Current stage</span>
          <strong>{currentModule.stageName}</strong>
          <small>{currentModule.key} / active</small>
        </article>
        <article>
          <span>90-day actions</span>
          <strong>{openPlanItems.length}</strong>
          <small>Open commitments</small>
        </article>
        <article>
          <span>Saved reflections</span>
          <strong>{data.responses.length}</strong>
          <small>Building your profile</small>
        </article>
      </div>

      <div className="live-overview-grid">
        <article className="continue-card">
          <header>
            <span>CONTINUE YOUR PROGRAM</span>
            <i>LIVE</i>
          </header>
          <div className="continue-content">
            <div className="continue-letter" aria-hidden="true">
              {currentModule.stage}
            </div>
            <div>
              <span>
                {currentModule.key} / {currentModule.stageName}
              </span>
              <h2>{currentModule.title}</h2>
              <p>{currentModule.description}</p>
              <button type="button" onClick={() => onOpenModule(currentModule)}>
                Open assessment →
              </button>
            </div>
          </div>
        </article>

        <article className="next-move-card">
          <span>NEXT MOVE</span>
          <h2>
            {openPlanItems[0]?.title ??
              "Add the first commitment to your 90-day action plan."}
          </h2>
          <p>
            {openPlanItems[0]?.due_date
              ? `Due ${openPlanItems[0].due_date}`
              : "Turn insight into a specific action you can finish."}
          </p>
          <button type="button" onClick={() => onNavigate("plan")}>
            Open action plan ↗
          </button>
        </article>
      </div>

      <div className="live-signal-grid">
        {[
          ["NATURAL VALUE", data.insights.naturalValue],
          ["ENERGY SOURCE", data.insights.energySource],
          ["NEXT DIRECTION", data.insights.direction],
        ].map(([label, value]) => (
          <article key={label}>
            <span>{label}</span>
            <p>{value}</p>
          </article>
        ))}
      </div>
    </div>
  );
}

function Program({
  data,
  onOpenModule,
}: {
  data: MemberData;
  onOpenModule: (module: ProgramModule) => void;
}) {
  return (
    <div className="portal-view-stack">
      <div className="portal-page-heading split">
        <div>
          <span className="portal-eyebrow">THE ABLE PROGRAM</span>
          <h1>Your complete path.</h1>
          <p>
            Fourteen focused modules. Your progress and every response are saved.
          </p>
        </div>
        <strong className="program-total">
          {data.profile.overallProgress}% <span>OVERALL</span>
        </strong>
      </div>

      <div className="portal-stage-list">
        {stageDetails.map((stage) => {
          const modules = programModules.filter(
            (module) => module.stage === stage.letter,
          );
          const progress = modules.map((module) =>
            data.progress.find((item) => item.module_key === module.key),
          );
          const stageProgress = Math.round(
            progress.reduce((sum, item) => sum + (item?.progress ?? 0), 0) / modules.length,
          );
          return (
            <article key={stage.letter}>
              <div className="portal-stage-head">
                <div className="portal-stage-letter">{stage.letter}</div>
                <div>
                  <small>STAGE {stage.letter}</small>
                  <h2>{stage.name}</h2>
                  <p>{stage.description}</p>
                </div>
                <div className="portal-stage-progress">
                  <span>
                    {stageProgress === 100
                      ? "COMPLETE"
                      : stageProgress
                        ? "IN PROGRESS"
                        : "READY"}
                  </span>
                  <strong>{stageProgress}%</strong>
                </div>
              </div>
              <div className="portal-stage-bar">
                <span style={{ width: `${stageProgress}%` }} />
              </div>
              <ol>
                {modules.map((module) => {
                  const item = data.progress.find(
                    (row) => row.module_key === module.key,
                  );
                  const unlocked =
                    Boolean(data.unlocks[module.key]) || item?.status === "complete";
                  return (
                    <li className={unlocked ? "" : "locked"} key={module.key}>
                      <span>{module.key}</span>
                      <div>
                        <strong>{module.title}</strong>
                        <small>
                          {!unlocked
                            ? "Complete the previous module"
                            : item?.status === "complete"
                            ? "Complete"
                            : item?.status === "in_progress"
                              ? `${item.progress}% saved`
                              : "Ready to begin"}
                        </small>
                      </div>
                      <button
                        type="button"
                        disabled={!unlocked}
                        onClick={() => onOpenModule(module)}
                      >
                        {!unlocked
                          ? "Locked"
                          : item?.status === "complete"
                            ? "Review"
                            : "Open"}{" "}
                        {unlocked ? "→" : ""}
                      </button>
                    </li>
                  );
                })}
              </ol>
            </article>
          );
        })}
      </div>
    </div>
  );
}

function downloadIdentityCard(identity: NonNullable<MemberData["identity"]>, data: MemberData) {
  const canvas = document.createElement("canvas");
  canvas.width = 1200;
  canvas.height = 630;
  const context = canvas.getContext("2d");
  if (!context) return;
  const gradient = context.createRadialGradient(980, 60, 10, 900, 80, 700);
  gradient.addColorStop(0, "#303033");
  gradient.addColorStop(0.45, "#111112");
  gradient.addColorStop(1, "#050505");
  context.fillStyle = gradient;
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.strokeStyle = "rgba(255,255,255,.22)";
  context.strokeRect(34, 34, canvas.width - 68, canvas.height - 68);
  context.fillStyle = "rgba(255,255,255,.48)";
  context.font = "18px monospace";
  context.fillText("ABLE1SELF / CORE IDENTITY", 86, 104);
  context.fillStyle = "#ffffff";
  context.font = "52px monospace";
  context.fillText(identity.code.split("").join("  ·  "), 84, 210);
  context.font = "76px Manrope, sans-serif";
  context.fillText(identity.archetype.name, 80, 320);
  context.fillStyle = "rgba(255,255,255,.65)";
  context.font = "30px Manrope, sans-serif";
  context.fillText(identity.archetype.tagline, 84, 390, 1020);
  const energy = data.derived?.energy ?? {};
  const energyLine = [
    energy.sunSign && `${energy.sunSign} Sun`,
    energy.moonSign && `${energy.moonSign} Moon`,
    energy.risingSign && `${energy.risingSign} Rising`,
    energy.lifePath && `Life Path ${energy.lifePath}`,
  ].filter(Boolean).join("  ·  ");
  if (energyLine) {
    context.fillStyle = "rgba(255,255,255,.72)";
    context.font = "22px Manrope, sans-serif";
    context.fillText(energyLine, 84, 454, 1020);
  }
  context.fillStyle = "rgba(255,255,255,.42)";
  context.font = "18px monospace";
  context.fillText("ONE SELF. ALIGNED.  /  ABLE1SELF.COM", 84, 536);
  const link = document.createElement("a");
  link.download = `able1self-${identity.code.toLowerCase()}.png`;
  link.href = canvas.toDataURL("image/png");
  link.click();
}

function Profile({ data }: { data: MemberData }) {
  return (
    <div className="portal-view-stack">
      <div className="portal-page-heading">
        <span className="portal-eyebrow">PERSONALIZED IDENTITY PROFILE</span>
        <h1>Your operating system.</h1>
        <p>
          This living profile is generated from your real program responses.
        </p>
      </div>
      {data.identity ? (
        <section className="core-identity-card">
          <header>
            <div>
              <span>CORE IDENTITY / ENGINE 2.0</span>
              <strong>{data.identity.code.split("").join(" · ")}</strong>
            </div>
            <div className="core-head-actions">
              {data.identity.provisional && <i>PROVISIONAL · LOCKS AFTER BRAND</i>}
              <button type="button" onClick={() => downloadIdentityCard(data.identity!, data)}>
                Download share card ↗
              </button>
            </div>
          </header>
          <h2>{data.identity.archetype.name}</h2>
          <p className="core-tagline">{data.identity.archetype.tagline}</p>
          <div className="identity-axis-strip">
            {data.identity.axes.map((axis) => (
              <article className={axis.confidence < 0.3 ? "leaning" : ""} key={axis.axis}>
                <span>{axis.label}</span>
                <strong>{axis.poleName}</strong>
                {axis.confidence < 0.3 && <small>LEANING</small>}
              </article>
            ))}
          </div>
          <p className="core-identity-copy">{data.identity.archetype.identity}</p>
          <div className="core-identity-groups">
            <details open>
              <summary>Strengths</summary>
              <ul>
                {data.identity.archetype.strengths.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </details>
            <details>
              <summary>Blind spots</summary>
              <ul>
                {data.identity.archetype.blindSpots.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </details>
            <details>
              <summary>Ideal rooms</summary>
              <ul>
                {data.identity.archetype.idealRooms.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </details>
          </div>
          <div className="identity-commercial-grid">
            <article>
              <span>MONETIZATION TILT</span>
              <p>{data.identity.archetype.monetizationTilt}</p>
            </article>
            <article>
              <span>HOW TO SHOW UP</span>
              <p>{data.identity.archetype.howToShowUp}</p>
            </article>
          </div>
          <p className="identity-clarifier">
            Core Identity describes who you are. Style Archetype describes your
            outward image signal. They are scored separately and can differ.
          </p>
        </section>
      ) : (
        <section className="identity-locked-card">
          <span>CORE IDENTITY / LOCKED</span>
          <h2>Complete Analyze to reveal your four-letter identity.</h2>
          <p>
            Energy, Drive, and Motion resolve across A1–A3. You receive a
            provisional result at 25%, then Brand locks the Presence axis.
          </p>
        </section>
      )}

      <section className="profile-deliverables">
        <header>
          <div>
            <span>YOUR PERSONALIZED PROFILE</span>
            <h2>Twelve connected deliverables.</h2>
          </div>
          <strong>{data.profile.completedModules}/{programModules.length}</strong>
        </header>
        <div>
          {data.profileSections.map((section, index) => (
            <details className={section.locked ? "locked" : ""} key={section.moduleKey}>
              <summary>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <div>
                  <small>{section.moduleKey} / STAGE {section.stage}</small>
                  <strong>{section.title}</strong>
                </div>
                <i>{section.locked ? "LOCKED" : "READY"}</i>
              </summary>
              {!section.locked && (
                <div className="deliverable-content">
                  {Object.entries(section.content).map(([key, value]) => (
                    <article key={key}>
                      <span>{key.replaceAll(/([A-Z])|_/g, " $1").trim()}</span>
                      <p>
                        {Array.isArray(value)
                          ? value.join(" · ")
                          : value && typeof value === "object"
                            ? JSON.stringify(value)
                            : String(value ?? "Still forming")}
                      </p>
                    </article>
                  ))}
                </div>
              )}
            </details>
          ))}
        </div>
      </section>
      <section className="response-vault">
        <header>
          <span>REFLECTION VAULT</span>
          <strong>{data.responses.length} saved responses</strong>
        </header>
        {data.responses.length ? (
          data.responses
            .slice()
            .reverse()
            .map((response) => {
              const programModule = programModules.find(
                (item) => item.key === response.module_key,
              );
              const question = programModule?.questions.find(
                (item) => item.key === response.question_key,
              );
              return (
                <article key={response.question_key}>
                  <span>{response.module_key}</span>
                  <div>
                    <strong>{question?.prompt}</strong>
                    <p>{formatAnswer(response.answer)}</p>
                  </div>
                </article>
              );
            })
        ) : (
          <p className="empty-state">
            Your saved reflections will appear here as you complete modules.
          </p>
        )}
      </section>
    </div>
  );
}

function Plan({
  data,
  saving,
  mutate,
}: {
  data: MemberData;
  saving: boolean;
  mutate: (payload: Record<string, unknown>) => Promise<MemberData | undefined>;
}) {
  const [title, setTitle] = useState("");
  const [why, setWhy] = useState("");
  const [successMetric, setSuccessMetric] = useState("");
  const [startDate, setStartDate] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [checkinCadence, setCheckinCadence] = useState("weekly");
  async function submit(event: FormEvent) {
    event.preventDefault();
    await mutate({
      action: "add_plan_item",
      title,
      why,
      successMetric,
      startDate,
      dueDate,
      checkinCadence,
    });
    setTitle("");
    setWhy("");
    setSuccessMetric("");
    setStartDate("");
    setDueDate("");
  }
  const onTrack = data.planCheckins.filter(
    (checkin) => checkin.status === "on_track",
  ).length;
  const offTrack = data.planCheckins.length - onTrack;
  const trackScore = data.planCheckins.length
    ? Math.round((onTrack / data.planCheckins.length) * 100)
    : 50;
  const healthTone = !data.planCheckins.length
    ? "neutral"
    : trackScore >= 60
      ? "on-track"
      : "off-track";
  return (
    <div className="portal-view-stack">
      <div className="portal-page-heading">
        <span className="portal-eyebrow">EMBARK / EXECUTION SYSTEM</span>
        <h1>Your 90-day plan.</h1>
        <p>
          Define the outcome, name why it matters, and tell the truth at every
          checkpoint. The signal gets greener when you stay on track and redder
          when the plan needs intervention.
        </p>
      </div>
      <section className={`plan-health ${healthTone}`} style={{ "--track-score": `${trackScore}%` } as CSSProperties}>
        <div>
          <span>90-DAY EXECUTION SIGNAL</span>
          <strong>{data.planCheckins.length ? `${trackScore}% on track` : "Awaiting first check-in"}</strong>
          <p>{data.plan.length} commitments · {data.planCheckins.length} checkpoints logged</p>
        </div>
        <div className="plan-health-meter" aria-label={`${trackScore}% on track`}><i /></div>
        <dl>
          <div><dt>On track</dt><dd>{onTrack}</dd></div>
          <div><dt>Off track</dt><dd>{offTrack}</dd></div>
          <div><dt>Complete</dt><dd>{data.plan.filter((item) => item.status === "complete").length}</dd></div>
        </dl>
      </section>
      <form className="plan-compose" onSubmit={submit}>
        <label className="plan-field-wide">
          <span>THE NEXT MOVE</span>
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="What will you complete?"
            required
          />
        </label>
        <label className="plan-field-wide">
          <span>WHY THIS MATTERS</span>
          <input
            value={why}
            onChange={(event) => setWhy(event.target.value)}
            placeholder="What changes when this is done?"
            required
          />
        </label>
        <label className="plan-field-wide">
          <span>PROOF OF SUCCESS</span>
          <input
            value={successMetric}
            onChange={(event) => setSuccessMetric(event.target.value)}
            placeholder="What measurable result proves completion?"
            required
          />
        </label>
        <label>
          <span>START DATE</span>
          <input
            type="date"
            value={startDate}
            onChange={(event) => setStartDate(event.target.value)}
          />
        </label>
        <label>
          <span>90-DAY TARGET</span>
          <input
            type="date"
            value={dueDate}
            onChange={(event) => setDueDate(event.target.value)}
          />
        </label>
        <label>
          <span>CHECK-IN RHYTHM</span>
          <select value={checkinCadence} onChange={(event) => setCheckinCadence(event.target.value)}>
            <option value="weekly">Every week</option>
            <option value="biweekly">Every two weeks</option>
            <option value="monthly">Every month</option>
          </select>
        </label>
        <button type="submit" disabled={saving}>
          {saving ? "Saving…" : "Build commitment →"}
        </button>
      </form>
      <section className="plan-commitments">
        {data.plan.length ? (
          data.plan.map((item) => {
            const checkins = data.planCheckins.filter(
              (checkin) => checkin.plan_item_id === item.id,
            );
            const latest = checkins[0];
            const itemOnTrack = checkins.filter(
              (checkin) => checkin.status === "on_track",
            ).length;
            return (
            <article className={`plan-commitment ${item.status === "complete" ? "complete" : ""} ${latest?.status ?? "unreported"}`} key={item.id}>
              <header>
                <label>
                  <input type="checkbox" checked={item.status === "complete"} onChange={() => mutate({ action:"toggle_plan_item", id:item.id, status:item.status === "complete" ? "open" : "complete" })} />
                  <i />
                  <span><small>COMMITMENT</small><strong>{item.title}</strong></span>
                </label>
                <div className="commitment-status">
                  <em>{latest ? latest.status.replace("_", " ") : "check-in due"}</em>
                <button
                  type="button"
                  onClick={() => mutate({ action: "delete_plan_item", id: item.id })}
                  aria-label={`Delete ${item.title}`}
                >×</button>
                </div>
              </header>
              <div className="commitment-brief">
                <p><span>Why it matters</span><strong>{item.why || "Add the reason behind this commitment."}</strong></p>
                <p><span>Proof of success</span><strong>{item.success_metric || "Define the measurable finish line."}</strong></p>
                <p><span>Window</span><strong>{item.start_date || "Start now"} → {item.due_date || "Day 90"}</strong></p>
                <p><span>Rhythm</span><strong>{item.checkin_cadence === "biweekly" ? "Every two weeks" : item.checkin_cadence === "monthly" ? "Every month" : "Every week"}</strong></p>
              </div>
              <div className="commitment-track">
                <span style={{ width: `${checkins.length ? Math.round((itemOnTrack / checkins.length) * 100) : 50}%` }} />
              </div>
              <details className="checkin-workspace">
                <summary>Log checkpoint <span>{checkins.length} recorded</span></summary>
                <form onSubmit={(event) => { event.preventDefault(); const form = new FormData(event.currentTarget); void mutate({ action:"add_plan_checkin", id:item.id, checkpointDate:form.get("checkpointDate"), status:form.get("status"), explanation:form.get("explanation") }).then(() => event.currentTarget.reset()); }}>
                  <label><span>Checkpoint date</span><input name="checkpointDate" type="date" defaultValue={new Date().toISOString().slice(0,10)} required /></label>
                  <label><span>Status</span><select name="status" defaultValue="on_track"><option value="on_track">On track</option><option value="off_track">Off track</option></select></label>
                  <label className="checkin-explanation"><span>Status and why</span><textarea name="explanation" placeholder="What happened, what is working, and what needs to change next?" required /></label>
                  <button disabled={saving}>Save checkpoint</button>
                </form>
                <div className="checkin-history">
                  {checkins.length ? checkins.map((checkin) => <article className={checkin.status} key={checkin.id}><i /><span>{checkin.checkpoint_date}</span><strong>{checkin.status.replace("_", " ")}</strong><p>{checkin.explanation}</p></article>) : <p>No checkpoints yet. Log the first honest status update above.</p>}
                </div>
              </details>
            </article>
          )})
        ) : (
          <p className="empty-state">
            Build the first 90-day commitment above. Include the reason, the
            measurable finish line, and the rhythm you will use to stay honest.
          </p>
        )}
      </section>
    </div>
  );
}

function Community({
  data,
  saving,
  mutate,
}: {
  data: MemberData;
  saving: boolean;
  mutate: (payload: Record<string, unknown>) => Promise<MemberData | undefined>;
}) {
  const [post, setPost] = useState("");
  async function submit(event: FormEvent) {
    event.preventDefault();
    await mutate({ action: "create_post", body: post });
    setPost("");
  }
  return (
    <div className="portal-view-stack">
      <div className="portal-page-heading">
        <span className="portal-eyebrow">THE ROOM / PRIVATE COMMUNITY</span>
        <h1>Move in company.</h1>
        <p>Share progress, ask for perspective, and make a clear commitment.</p>
      </div>
      <div className="room-layout live-room-layout">
        <section>
          <form className="community-compose" onSubmit={submit}>
            <div>{initials(data.profile.displayName)}</div>
            <textarea
              value={post}
              onChange={(event) => setPost(event.target.value)}
              placeholder="What are you seeing, deciding, or committing to?"
              rows={4}
              required
            />
            <button type="submit" disabled={saving}>
              {saving ? "Posting…" : "Post to The Room →"}
            </button>
          </form>
          <div className="community-feed">
            {data.posts.map((item) => (
              <article key={item.id}>
                <div>{initials(item.author_name)}</div>
                <section>
                  <header>
                    <div>
                      <strong>{item.author_name}</strong>
                      <b className="identity-code-badge">
                        {item.author_name === data.profile.displayName
                          ? data.identity?.code ?? "FORMING"
                          : item.author_name === "Shawn Daniels"
                            ? "OMBS"
                            : "IVRC"}
                      </b>
                    </div>
                    <span>{formatDate(item.created_at)}</span>
                  </header>
                  <p>{item.body}</p>
                  <footer>REFLECT · SUPPORT · CONNECT</footer>
                </section>
              </article>
            ))}
          </div>
        </section>
        <aside className="room-sidebar">
          <span>YOUR ROOM SIGNAL</span>
          <strong>{data.posts.length}</strong>
          <p>saved conversations in your private community.</p>
          <i />
          <span>ACCOUNTABILITY PARTNER</span>
          <div className="partner-card">
            <b>JC</b>
            <p>
              <strong>Jordan C.</strong>
              <span>Connected · Active</span>
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}

function Messages({
  data,
  saving,
  mutate,
}: {
  data: MemberData;
  saving: boolean;
  mutate: (payload: Record<string, unknown>) => Promise<MemberData | undefined>;
}) {
  const [message, setMessage] = useState("");
  async function submit(event: FormEvent) {
    event.preventDefault();
    await mutate({ action: "send_message", body: message });
    setMessage("");
  }
  return (
    <div className="portal-view-stack">
      <div className="portal-page-heading">
        <span className="portal-eyebrow">ACCOUNTABILITY / DIRECT MESSAGE</span>
        <h1>Keep the signal moving.</h1>
        <p>Your conversation is private to this account and saved.</p>
      </div>
      <div className="message-shell live-message-shell">
        <aside>
          <span>CONVERSATIONS</span>
          <article className="active">
            <div>JC</div>
            <p>
              <strong>Jordan C.</strong>
              <small>Accountability partner</small>
            </p>
          </article>
        </aside>
        <section>
          <header>
            <div>JC</div>
            <p>
              <strong>Jordan C.</strong>
              <span>● Active accountability match</span>
            </p>
          </header>
          <div className="message-thread">
            {data.messages.map((item) => (
              <p className={item.sender === "member" ? "sent" : ""} key={item.id}>
                <span>{item.body}</span>
                <small>{formatDate(item.created_at)}</small>
              </p>
            ))}
          </div>
          <form onSubmit={submit}>
            <input
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder="Write a specific update or commitment…"
              required
            />
            <button type="submit" disabled={saving}>
              {saving ? "Saving…" : "Send →"}
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}

type ClientPortalData = {
  role: string;
  member: { email:string; display_name:string; role:string };
  members: Array<{email:string;display_name:string;role:string}>;
  client: Record<string, unknown>;
  measurementSet: Record<string, unknown>;
  measurements: Record<string, string>;
  measurementFields: Array<[string, string]>;
  assets: Array<{id:number;category:string;filename:string;content_type:string;caption:string;created_at:string}>;
  appointments: Array<{id:number;title:string;starts_at:string;status:string;notes:string}>;
  orders: Array<{id:number;order_number:string;title:string;status:string;amount:string;tracking_url:string;notes:string}>;
  auditLog: Array<{id:number;actor_email:string;action:string;created_at:string;member_email:string;display_name:string}>;
  adminStats: {active_members:number;orders:number;appointments:number;assets:number} | null;
};

function ClientPortal({ adminMode = false }: { adminMode?: boolean }) {
  const [portal, setPortal] = useState<ClientPortalData | null>(null);
  const [tab, setTab] = useState(adminMode ? "admin" : "dashboard");
  const [target, setTarget] = useState("");
  const [measurements, setMeasurements] = useState<Record<string,string>>({});
  const [unit, setUnit] = useState("in");
  const [measurementsOpen, setMeasurementsOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [today] = useState(() => Date.now());

  const load = useCallback(async (selected?: string) => {
    setBusy(true);
    try {
      const suffix = selected ? `?member=${encodeURIComponent(selected)}` : "";
      const endpoint = adminMode ? "/api/client-portal/admin" : "/api/client-portal";
      const response = await fetch(`${endpoint}${suffix}`, { cache:"no-store" });
      const result = await response.json() as {data?:ClientPortalData;error?:string};
      if (!response.ok || !result.data) throw new Error(result.error ?? "Unable to load Members Only.");
      setPortal(result.data);
      setTarget(result.data.member.email);
      setMeasurements(result.data.measurements);
      setUnit(String(result.data.measurementSet.unit ?? "in"));
    } catch (error) { setNotice(error instanceof Error ? error.message : "Unable to load Members Only."); }
    finally { setBusy(false); }
  }, [adminMode]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  async function patch(payload: Record<string,unknown>) {
    setBusy(true); setNotice("");
    try {
      const endpoint = adminMode ? "/api/client-portal/admin" : "/api/client-portal";
      const response = await fetch(endpoint, { method:"PATCH", headers:{"content-type":"application/json"}, body:JSON.stringify({ ...payload, targetEmail:target }) });
      const result = await response.json() as {data?:ClientPortalData;error?:string};
      if (!response.ok || !result.data) throw new Error(result.error ?? "Unable to save.");
      setPortal(result.data); setMeasurements(result.data.measurements); setNotice("Saved.");
    } catch (error) { setNotice(error instanceof Error ? error.message : "Unable to save."); }
    finally { setBusy(false); }
  }

  async function upload(event: FormEvent<HTMLFormElement>, category: string) {
    event.preventDefault(); setBusy(true); setNotice("");
    const form = new FormData(event.currentTarget); form.set("category", category); form.set("member", target);
    try {
      const response = await fetch("/api/client-portal/upload", { method:"POST", body:form });
      const result = await response.json() as {data?:ClientPortalData;error?:string};
      if (!response.ok || !result.data) throw new Error(result.error ?? "Upload failed.");
      setPortal(result.data); setNotice("File uploaded."); event.currentTarget.reset();
    } catch (error) { setNotice(error instanceof Error ? error.message : "Upload failed."); }
    finally { setBusy(false); }
  }

  if (!portal) return <section className="portal-view client-portal concierge-portal"><p>{busy ? "Loading private client record..." : notice}</p></section>;
  const displayed = (value:string) => unit === "cm" && value ? (Number(value) * 2.54).toFixed(1) : value;
  const stored = (value:string) => unit === "cm" && value ? (Number(value) / 2.54).toFixed(2).replace(/0+$/, "").replace(/\.$/, "") : value;
  const tabs = ["dashboard", "profile", "sessions", "looks", "closet", "orders"];
  const completedMeasurements = Object.values(measurements).filter(Boolean).length;
  const measurementPercent = Math.round((completedMeasurements / portal.measurementFields.length) * 100);
  const profileImages = portal.assets.filter((asset) => asset.category === "profile" && asset.content_type.startsWith("image/"));
  const nextSession = portal.appointments
    .filter((appointment) => new Date(appointment.starts_at).getTime() >= today)
    .sort((a,b) => a.starts_at.localeCompare(b.starts_at))[0] ?? portal.appointments[0];
  const activeOrder = portal.orders.find((order) => order.status !== "delivered") ?? portal.orders[0];
  const orderStages = ["planning", "in production", "shipped", "delivered"];
  const orderStage = activeOrder ? Math.max(0, orderStages.indexOf(activeOrder.status)) : 0;

  const assetCollection = (category: "vision" | "closet", title: string, copy: string) => {
    const assets = portal.assets.filter((asset) => asset.category === category);
    return <div className="concierge-collection">
      <header><div><span>{category === "vision" ? "LOOK DIRECTION" : "PRIVATE CLOSET"}</span><h2>{title}</h2><p>{copy}</p></div></header>
      <form className="asset-upload concierge-upload" onSubmit={(event)=>void upload(event,category)}><input required name="file" type="file" accept="image/jpeg,image/png,image/webp,application/pdf"/><input name="caption" placeholder="Look name, fabric, fit, or styling note"/><button disabled={busy} type="submit">Add to {category === "vision" ? "lookbook" : "closet"}</button></form>
      <div className="concierge-asset-grid">{assets.length ? assets.map((asset)=><a key={asset.id} href={`/api/client-portal/asset?id=${asset.id}`} target="_blank" rel="noreferrer">
        {asset.content_type.startsWith("image/") ? <img src={`/api/client-portal/asset?id=${asset.id}`} alt={asset.caption || asset.filename} /> : <div className="asset-document">PDF</div>}
        <span>{asset.caption || asset.filename}</span><small>{asset.filename}</small>
      </a>) : <div className="concierge-empty-visual"><strong>No {category === "vision" ? "looks" : "closet pieces"} added yet.</strong><p>Upload the first visual, reference board, or fitting document above.</p></div>}</div>
    </div>;
  };

  return (
    <section className="portal-view client-portal concierge-portal">
      <header className="concierge-heading">
        <div><span>{adminMode ? "ADMIN CONSOLE / PRIVATE OPERATIONS" : "ABLE1SELF / MEMBERS ONLY"}</span><h1>{adminMode ? "Client operations." : `Welcome, ${String(portal.client.preferred_name || portal.member.display_name).split(" ")[0]}.`}</h1><p>{adminMode ? "Review every active client record, session, asset, order, and administrative change." : "Your private concierge record for profile details, sessions with Shawn, visual direction, fittings, and deliveries."}</p></div>
        {portal.role === "admin" && <label className="member-selector"><span>ACTIVE CLIENT</span><select value={target} onChange={(event) => { setMeasurementsOpen(false); void load(event.target.value); }}>
          {portal.members.map((member) => <option key={member.email} value={member.email}>{member.display_name} · {member.role}</option>)}
        </select></label>}
      </header>
      {notice && <p className="portal-notice">{notice}</p>}

      {adminMode && <section className="admin-command-center">
        <div className="admin-stat-row">
          <article><span>Active members</span><strong>{portal.adminStats?.active_members ?? portal.members.length}</strong></article>
          <article><span>Orders</span><strong>{portal.adminStats?.orders ?? 0}</strong></article>
          <article><span>Sessions</span><strong>{portal.adminStats?.appointments ?? 0}</strong></article>
          <article><span>Assets</span><strong>{portal.adminStats?.assets ?? 0}</strong></article>
        </div>
        <div className="admin-activity"><header><span>RECENT BACKEND ACTIVITY</span><strong>Audit trail</strong></header>{portal.auditLog.length ? portal.auditLog.map((entry)=><article key={entry.id}><span>{entry.action.replaceAll("_", " ")}</span><strong>{entry.display_name}</strong><p>{entry.actor_email} · {new Date(entry.created_at).toLocaleString()}</p></article>) : <p>No administrative changes have been recorded yet.</p>}</div>
      </section>}

      <section className="concierge-client-strip">
        <div className="concierge-avatar">{profileImages[0] ? <img src={`/api/client-portal/asset?id=${profileImages[0].id}`} alt={portal.member.display_name} /> : initials(portal.member.display_name)}</div>
        <div><span>PRIVATE CLIENT RECORD</span><strong>{portal.member.display_name}</strong><p>{portal.member.email}</p></div>
        <div className="concierge-measurement-status"><span>Profile readiness</span><strong>{measurementPercent}%</strong><i><b style={{width:`${measurementPercent}%`}} /></i></div>
        <div className="concierge-next-session"><span>Next session</span><strong>{nextSession ? new Date(nextSession.starts_at).toLocaleDateString("en", {month:"long",day:"numeric",year:"numeric"}) : "Not scheduled"}</strong></div>
      </section>

      <div className="client-tabs concierge-tabs" role="tablist">
        {tabs.map((item) => <button key={item} className={tab===item?"active":""} type="button" onClick={() => setTab(item)}>{item}</button>)}
      </div>

      {tab === "admin" && <div className="admin-client-entry"><span>CLIENT RECORD SELECTED</span><h2>{portal.member.display_name}</h2><p>Use the navigation above to review the client-facing dashboard, profile and measurements, sessions, visual work, closet, and orders exactly as they appear for this account.</p><button type="button" onClick={()=>setTab("dashboard")}>Open selected client dashboard</button></div>}

      {tab === "dashboard" && <div className="concierge-dashboard">
        <section className="concierge-session-banner"><div><span>NEXT SESSION WITH SHAWN</span><strong>{nextSession?.title || "Schedule the next working session"}</strong><p>{nextSession ? `${new Date(nextSession.starts_at).toLocaleString("en", {month:"long",day:"numeric",hour:"numeric",minute:"2-digit"})} · ${nextSession.notes || nextSession.status}` : "Set the next review, fitting, or visual direction session from the Sessions tab."}</p></div><button type="button" onClick={()=>setTab("sessions")}>View sessions</button></section>
        <section className="concierge-service-track"><header><span>CLIENT JOURNEY</span><strong>{activeOrder ? activeOrder.title : "Your next delivery"}</strong></header><div>{orderStages.map((stage,index)=><article className={index <= orderStage ? "active" : ""} key={stage}><i /><strong>{String(index+1).padStart(2,"0")}</strong><span>{stage}</span></article>)}</div></section>
        <div className="concierge-dashboard-grid">
          <button className="concierge-profile-card" type="button" onClick={()=>setTab("profile")}><span>PROFILE / MEASUREMENTS</span><strong>{completedMeasurements ? `${completedMeasurements} measurements saved` : "Measurements needed"}</strong><p>{completedMeasurements ? "Review or update your current fitting record." : "Open your profile and complete the fitting record when ready."}</p><b>{measurementPercent}% complete →</b></button>
          <section className="concierge-order-summary"><span>CURRENT ORDER</span><strong>{activeOrder?.title || "No active order"}</strong><p>{activeOrder ? `${activeOrder.order_number} · ${activeOrder.status}` : "Your active commission and delivery status will appear here."}</p><button type="button" onClick={()=>setTab("orders")}>View orders</button></section>
        </div>
        <section className="concierge-look-preview"><header><div><span>VISUAL DIRECTION</span><strong>Recent looks and references</strong></div><button type="button" onClick={()=>setTab("looks")}>Open lookbook</button></header><div>{portal.assets.filter((asset)=>asset.category === "vision" && asset.content_type.startsWith("image/")).slice(0,3).map((asset)=><img key={asset.id} src={`/api/client-portal/asset?id=${asset.id}`} alt={asset.caption || asset.filename} />)}{!portal.assets.some((asset)=>asset.category === "vision" && asset.content_type.startsWith("image/")) && <p>Add visual references in Looks to build this private gallery.</p>}</div></section>
      </div>}

      {tab === "profile" && <div className="client-profile-stack"><section className="profile-record-heading"><div><span>PERSONAL RECORD</span><h2>Profile and fit.</h2><p>Your measurements live here, not in the main Members Only navigation. Open the fitting record only when you need to add or update it.</p></div></section><form className="client-form" onSubmit={(event) => {event.preventDefault(); const form=new FormData(event.currentTarget); void patch({action:"save_client",preferredName:form.get("preferredName"),phone:form.get("phone"),shippingAddress:form.get("shippingAddress"),calendlyUrl:form.get("calendlyUrl"),stylistNotes:form.get("stylistNotes")});}}>
        <label><span>Preferred name</span><input name="preferredName" defaultValue={String(portal.client.preferred_name ?? "")} /></label>
        <label><span>Phone</span><input name="phone" defaultValue={String(portal.client.phone ?? "")} /></label>
        <label className="client-wide"><span>Shipping address</span><textarea name="shippingAddress" defaultValue={String(portal.client.shipping_address ?? "")} /></label>
        <label className="client-wide"><span>Calendly link</span><input name="calendlyUrl" defaultValue={String(portal.client.calendly_url ?? "")} /></label>
        <label className="client-wide"><span>Stylist notes</span><textarea name="stylistNotes" defaultValue={String(portal.client.stylist_notes ?? "")} /></label>
        <button disabled={busy} type="submit">Save profile</button>
      </form>
      <button className={`measurement-entry-card ${completedMeasurements ? "complete" : "needed"}`} type="button" onClick={()=>setMeasurementsOpen((value)=>!value)}><div><span>FIT PROFILE / {portal.measurementFields.length} POINTS</span><strong>{completedMeasurements ? "Current measurements" : "Measurements not completed"}</strong><p>{completedMeasurements ? `${completedMeasurements} of ${portal.measurementFields.length} fields saved · Last measured ${String(portal.measurementSet.measured_at || "date not recorded")}` : "Click to enter your measurements when you are ready. You can return and update them at any time."}</p></div><b>{measurementsOpen ? "Close record ↑" : completedMeasurements ? "Review and update →" : "Add measurements →"}</b></button>
      {measurementsOpen && <div className="measurements-panel profile-measurements-editor">
        <div className="measurement-meta">
          <label><span>Measurement set</span><input id="measurement-label" defaultValue={String(portal.measurementSet.label ?? "Current")} /></label>
          <label><span>Date measured</span><input id="measurement-date" type="date" defaultValue={String(portal.measurementSet.measured_at ?? "")} /></label>
          <label><span>Measured by</span><input id="measurement-by" defaultValue={String(portal.measurementSet.measured_by ?? "")} /></label>
          <div className="unit-toggle"><span>Units</span><button className={unit==="in"?"active":""} type="button" onClick={()=>setUnit("in")}>IN</button><button className={unit==="cm"?"active":""} type="button" onClick={()=>setUnit("cm")}>CM</button></div>
        </div>
        <div className="measurement-grid">{portal.measurementFields.map(([key,label], index) => <label key={key}><span>{String(index+1).padStart(2,"0")} · {label}</span><input inputMode="decimal" value={displayed(measurements[key] ?? "")} onChange={(event)=>setMeasurements({...measurements,[key]:stored(event.target.value)})}/><i>{unit}</i></label>)}</div>
        <label className="measurement-notes"><span>Notes</span><textarea id="measurement-notes" defaultValue={String(portal.measurementSet.notes ?? "")} /></label>
        <button disabled={busy} type="button" onClick={() => void patch({action:"save_measurements",measurements,unit:"in",label:(document.getElementById("measurement-label") as HTMLInputElement)?.value,measuredAt:(document.getElementById("measurement-date") as HTMLInputElement)?.value,measuredBy:(document.getElementById("measurement-by") as HTMLInputElement)?.value,notes:(document.getElementById("measurement-notes") as HTMLTextAreaElement)?.value})}>Save fitting record</button>
      </div>}
      <form className="asset-upload" onSubmit={(event)=>void upload(event,"profile")}><input required name="file" type="file" accept="image/jpeg,image/png,image/webp,application/pdf"/><input name="caption" placeholder="Profile photo or fitting document note"/><button disabled={busy} type="submit">Add profile file</button></form></div>}

      {tab === "looks" && assetCollection("vision", "Looks built with Shawn.", "Collect the references, proposed garments, fabrics, styling directions, and final selections from each working session.")}
      {tab === "closet" && assetCollection("closet", "Your private closet record.", "Keep delivered pieces, fit notes, garment details, and future combinations visible in one place.")}

      {tab === "sessions" && <div className="concierge-sessions"><header><span>WORKING SESSIONS</span><h2>Sessions with Shawn.</h2><p>Review what is scheduled and the purpose or outcome of every private working session.</p></header>{portal.role === "admin" && <form className="admin-inline-form" onSubmit={(event)=>{event.preventDefault();const form=new FormData(event.currentTarget);void patch({action:"add_appointment",title:form.get("title"),startsAt:form.get("startsAt"),notes:form.get("notes")});event.currentTarget.reset();}}><input required name="title" placeholder="Session title"/><input required name="startsAt" type="datetime-local"/><input name="notes" placeholder="Purpose, location, or preparation"/><button disabled={busy}>Schedule session</button></form>}<div className="session-ledger">{portal.appointments.length ? portal.appointments.map((item,index)=><article key={item.id}><div><span>{String(index+1).padStart(2,"0")}</span><i /></div><section><small>{new Date(item.starts_at).toLocaleString("en", {weekday:"long",month:"long",day:"numeric",hour:"numeric",minute:"2-digit"})}</small><strong>{item.title}</strong><p>{item.notes || "Session details will be added here."}</p><em>{item.status}</em></section></article>) : <p>No sessions scheduled yet.</p>}</div>{Boolean(portal.client.calendly_url) && <a className="client-command" href={String(portal.client.calendly_url)} target="_blank" rel="noreferrer">Request a time with Shawn</a>}</div>}
      {tab === "orders" && <div className="concierge-orders"><header><span>COMMISSIONS / DELIVERIES</span><h2>Orders and outcomes.</h2><p>Follow each commission from planning through production and delivery.</p></header>{portal.role === "admin" && <form className="admin-inline-form" onSubmit={(event)=>{event.preventDefault();const form=new FormData(event.currentTarget);void patch({action:"add_order",orderNumber:form.get("orderNumber"),title:form.get("title"),status:form.get("status"),amount:form.get("amount"),trackingUrl:form.get("trackingUrl"),notes:form.get("notes")});event.currentTarget.reset();}}><input required name="orderNumber" placeholder="Order number"/><input required name="title" placeholder="Order title"/><select name="status" defaultValue="planning"><option>planning</option><option>in production</option><option>shipped</option><option>delivered</option></select><input name="amount" placeholder="Amount"/><input name="trackingUrl" placeholder="Tracking URL"/><input name="notes" placeholder="Garment, fabric, fit, or delivery notes"/><button disabled={busy}>Add order</button></form>}<div className="order-card-grid">{portal.orders.length ? portal.orders.map((item)=><article key={item.id}><span>{item.order_number}</span><strong>{item.title}</strong><em className={item.status.replaceAll(" ", "-")}>{item.status}</em><p>{[item.amount,item.notes].filter(Boolean).join(" · ") || "Order details are being prepared."}</p>{item.tracking_url && <a href={item.tracking_url} target="_blank" rel="noreferrer">Track delivery</a>}</article>) : <p>No orders recorded yet.</p>}</div></div>}
    </section>
  );
}

function Guide({ data }: { data: MemberData }) {
  const [draft, setDraft] = useState("");
  const [notice, setNotice] = useState("");
  const [asking, setAsking] = useState(false);
  const starters = data.identity
    ? [
        `What does being ${data.identity.archetype.name} mean for how I sell?`,
        "Which of my blind spots is costing me the most right now?",
        "Who should my accountability partner be, and why?",
      ]
    : [
        "What should I pay attention to in Analyze?",
        "Help me make my next answer more specific.",
        "What is one action I can take this week?",
      ];
  return (
    <div className="portal-view-stack">
      <div className="portal-page-heading">
        <span className="portal-eyebrow">AI GUIDE / PROFILE-GROUNDED COACHING</span>
        <h1>Ask from your actual data.</h1>
        <p>
          The Guide reads your saved profile, applies your engine-decided Core
          Identity, and gives one concrete next action.
        </p>
      </div>
      <div className="guide-layout">
        <section className="guide-console">
          <header>
            <div className="guide-mark">◇</div>
            <div>
              <strong>Able Guide</strong>
              <span>PROFILE CONTEXT / {data.profile.overallProgress}% READY</span>
            </div>
          </header>
          <div className="guide-intro">
            <span>SYSTEM BOUNDARY</span>
            <p>
              Your archetype is decided by the identity engine. The Guide can
              explain and apply it, but it never re-types or contradicts it.
            </p>
          </div>
          <div className="guide-starters">
            {starters.map((starter) => (
              <button type="button" key={starter} onClick={() => setDraft(starter)}>
                {starter} <span>→</span>
              </button>
            ))}
          </div>
          <form
            onSubmit={async (event) => {
              event.preventDefault();
              setAsking(true); setNotice("");
              try {
                const response = await fetch("/api/guide", {method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({question:draft})});
                const result = await response.json() as {answer?:string;error?:string};
                if (!response.ok || !result.answer) throw new Error(result.error ?? "Guide request failed.");
                setNotice(result.answer);
              } catch (error) { setNotice(error instanceof Error ? error.message : "Guide request failed."); }
              finally { setAsking(false); }
            }}
          >
            <textarea
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="Ask about your identity, positioning, network, or next move…"
              rows={4}
              required
            />
            <button disabled={asking} type="submit">{asking ? "Reading your profile..." : "Ask the Guide →"}</button>
          </form>
          {notice && <p className="guide-notice">{notice}</p>}
        </section>
        <aside className="guide-context">
          <span>GROUNDING SIGNALS</span>
          <article>
            <small>CORE IDENTITY</small>
            <strong>
              {data.identity
                ? `${data.identity.code} · ${data.identity.archetype.name}`
                : "Locked until Analyze"}
            </strong>
          </article>
          <article>
            <small>PROFILE SECTIONS</small>
            <strong>
              {data.profileSections.filter((section) => !section.locked).length} / {programModules.length} ready
            </strong>
          </article>
          <article>
            <small>NEXT DIRECTION</small>
            <strong>{data.insights.direction}</strong>
          </article>
          <p>Deterministic profile mode is active. Every response is grounded in saved member data and ends with one concrete action.</p>
        </aside>
      </div>
    </div>
  );
}

function Settings({
  data,
  saving,
  mutate,
}: {
  data: MemberData;
  saving: boolean;
  mutate: (payload: Record<string, unknown>) => Promise<MemberData | undefined>;
}) {
  const [displayName, setDisplayName] = useState(data.profile.displayName);
  const [professionalTitle, setProfessionalTitle] = useState(
    data.profile.professionalTitle,
  );
  const [bio, setBio] = useState(data.profile.bio);
  const [moduleReminders, setModuleReminders] = useState(
    Boolean(data.settings.module_reminders),
  );
  const [messageNotifications, setMessageNotifications] = useState(
    Boolean(data.settings.message_notifications),
  );
  const [communityNotifications, setCommunityNotifications] = useState(
    Boolean(data.settings.community_notifications),
  );
  return (
    <div className="portal-view-stack">
      <div className="portal-page-heading">
        <span className="portal-eyebrow">MEMBER OS / SETTINGS</span>
        <h1>Your account.</h1>
        <p>Manage the context and signals attached to your member profile.</p>
      </div>
      <div className="settings-stack">
        <section>
          <header>
            <span>PROFILE CONTEXT</span>
            <p>This information appears in your personalized profile.</p>
          </header>
          <form
            className="live-settings-form"
            onSubmit={async (event) => {
              event.preventDefault();
              await mutate({
                action: "save_profile",
                displayName,
                professionalTitle,
                bio,
              });
            }}
          >
            <div className="settings-fields">
              <label>
                <span>DISPLAY NAME</span>
                <input
                  value={displayName}
                  onChange={(event) => setDisplayName(event.target.value)}
                />
              </label>
              <label>
                <span>ACCOUNT EMAIL</span>
                <input value={data.profile.email} disabled />
              </label>
              <label>
                <span>PROFESSIONAL TITLE</span>
                <input
                  value={professionalTitle}
                  onChange={(event) => setProfessionalTitle(event.target.value)}
                  placeholder="Founder, strategist, operator…"
                />
              </label>
            </div>
            <label className="settings-bio">
              <span>CURRENT CONTEXT</span>
              <textarea
                value={bio}
                onChange={(event) => setBio(event.target.value)}
                placeholder="What are you building, navigating, or moving toward?"
                rows={5}
              />
            </label>
            <button type="submit" disabled={saving}>
              {saving ? "Saving…" : "Save profile →"}
            </button>
          </form>
        </section>
        <section>
          <header>
            <span>NOTIFICATIONS</span>
            <p>Choose which signals you want active.</p>
          </header>
          {[
            ["Profile progress reminders", moduleReminders, setModuleReminders],
            [
              "Accountability messages",
              messageNotifications,
              setMessageNotifications,
            ],
            [
              "Community activity",
              communityNotifications,
              setCommunityNotifications,
            ],
          ].map(([label, value, setter]) => (
            <label className="setting-toggle" key={label as string}>
              <span>{label as string}</span>
              <input
                type="checkbox"
                checked={value as boolean}
                onChange={(event) =>
                  (setter as (value: boolean) => void)(event.target.checked)
                }
              />
              <i />
            </label>
          ))}
          <button
            type="button"
            disabled={saving}
            onClick={() =>
              mutate({
                action: "save_settings",
                moduleReminders,
                messageNotifications,
                communityNotifications,
              })
            }
          >
            {saving ? "Saving…" : "Save notification settings"}
          </button>
        </section>
        <RetakeKeyQuestions data={data} saving={saving} mutate={mutate} />
        <section className="account-security">
          <header>
            <span>SECURITY</span>
            <p>Your member session uses an encrypted, HttpOnly account cookie.</p>
          </header>
          <button type="button" onClick={() => void logoutFromSettings()}>
            Sign out of this account
          </button>
        </section>
      </div>
    </div>
  );
}

function RetakeKeyQuestions({
  data,
  saving,
  mutate,
}: {
  data: MemberData;
  saving: boolean;
  mutate: (payload: Record<string, unknown>) => Promise<MemberData | undefined>;
}) {
  const keys = ["a1_social_energy", "a3_theme", "b2_boldness", "a1_risk"];
  const questions = keys
    .map((key) => {
      const programModule = programModules.find((item) =>
        item.questions.some((question) => question.key === key),
      );
      return {
        programModule,
        question: programModule?.questions.find((question) => question.key === key),
      };
    })
    .filter(
      (item): item is { programModule: ProgramModule; question: Question } =>
        Boolean(item.programModule && item.question),
    );
  const [drafts, setDrafts] = useState<Record<string, AnswerValue>>(
    Object.fromEntries(
      keys.map((key) => [
        key,
        data.responses.find((response) => response.question_key === key)?.answer ??
          null,
      ]),
    ),
  );
  const [notice, setNotice] = useState("");

  return (
    <section className="retake-settings">
      <header>
        <span>THIS DOESN&apos;T FEEL LIKE ME</span>
        <p>
          Your result moves when your answers do. Revisit only the four questions
          that carry the most weight—no full-program retake required.
        </p>
      </header>
      <details>
        <summary>Revisit key questions →</summary>
        <div className="retake-question-list">
          {questions.map(({ programModule, question }) => (
            <article key={question.key}>
              <span>{programModule.key} / {programModule.stageName}</span>
              <h3>{question.prompt}</h3>
              <AnswerField
                question={question}
                value={drafts[question.key]}
                onChange={(value) =>
                  setDrafts((current) => ({ ...current, [question.key]: value }))
                }
              />
              <button
                type="button"
                disabled={saving || !hasAnswer(drafts[question.key])}
                onClick={async () => {
                  const oldCode = data.identity?.code;
                  const updated = await mutate({
                    action: "save_response",
                    moduleKey: programModule.key,
                    questionKey: question.key,
                    answer: drafts[question.key],
                  });
                  const nextCode = updated?.identity?.code;
                  setNotice(
                    oldCode && nextCode && oldCode !== nextCode
                      ? `Your answers moved your identity from ${oldCode} to ${nextCode}.`
                      : "Answer saved. Your identity result remains aligned.",
                  );
                }}
              >
                Save this answer
              </button>
            </article>
          ))}
          {notice && <p className="retake-notice">{notice}</p>}
        </div>
      </details>
    </section>
  );
}

async function logoutFromSettings() {
  await fetch("/api/auth/logout", { method: "POST" });
  window.location.assign("/");
}
