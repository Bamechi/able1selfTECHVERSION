"use client";
/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import {
  type CSSProperties,
  type FormEvent,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  type ProgramModule,
  type Question,
  programModules,
} from "../../lib/program-data";

type PortalView =
  | "overview"
  | "program"
  | "profile"
  | "plan"
  | "community"
  | "messages"
  | "settings";

type MemberData = {
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
    answer: string;
    updated_at: string;
  }>;
  plan: Array<{
    id: number;
    title: string;
    due_date: string;
    status: string;
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
  { id: "community", label: "The Room", symbol: "◌" },
  { id: "messages", label: "Messages", symbol: "↗" },
  { id: "settings", label: "Settings", symbol: "⌘" },
];

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

function AnswerField({
  question,
  value,
  onChange,
}: {
  question: Question;
  value: string;
  onChange: (value: string) => void;
}) {
  if (question.type === "choice") {
    return (
      <div className="assessment-options">
        {question.options?.map((option) => (
          <button
            className={value === option ? "selected" : ""}
            key={option}
            type="button"
            onClick={() => onChange(option)}
          >
            <span>{value === option ? "●" : "○"}</span>
            {option}
          </button>
        ))}
      </div>
    );
  }

  if (question.type === "scale") {
    return (
      <div className="assessment-scale">
        <div>
          {Array.from({ length: 10 }, (_, index) => `${index + 1}`).map(
            (number) => (
              <button
                className={value === number ? "selected" : ""}
                key={number}
                type="button"
                onClick={() => onChange(number)}
              >
                {number}
              </button>
            ),
          )}
        </div>
        <p>
          <span>Low alignment</span>
          <span>High alignment</span>
        </p>
      </div>
    );
  }

  return (
    <textarea
      className="assessment-textarea"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder="Write what is true for you—not what sounds impressive."
      rows={7}
    />
  );
}

function ModulePlayer({
  module,
  data,
  saving,
  onClose,
  onSave,
  onComplete,
}: {
  module: ProgramModule;
  data: MemberData;
  saving: boolean;
  onClose: () => void;
  onSave: (
    moduleKey: string,
    questionKey: string,
    answer: string,
  ) => Promise<void>;
  onComplete: (moduleKey: string) => Promise<void>;
}) {
  const firstIncomplete = module.questions.findIndex(
    (question) =>
      !data.responses.some(
        (response) =>
          response.question_key === question.key && response.answer.trim(),
      ),
  );
  const [questionIndex, setQuestionIndex] = useState(
    firstIncomplete === -1 ? 0 : firstIncomplete,
  );
  const question = module.questions[questionIndex];
  const savedAnswer =
    data.responses.find((response) => response.question_key === question.key)
      ?.answer ?? "";
  const [answer, setAnswer] = useState(savedAnswer);
  const answeredCount = module.questions.filter((item) =>
    data.responses.some(
      (response) =>
        response.question_key === item.key && response.answer.trim(),
    ),
  ).length;

  async function saveAndMove(direction: -1 | 1) {
    if (answer.trim()) {
      await onSave(module.key, question.key, answer);
    }
    const nextIndex = Math.max(
      0,
      Math.min(module.questions.length - 1, questionIndex + direction),
    );
    const nextQuestion = module.questions[nextIndex];
    setAnswer(
      data.responses.find(
        (response) => response.question_key === nextQuestion.key,
      )?.answer ?? "",
    );
    setQuestionIndex(nextIndex);
  }

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
            {module.key} / {module.stageName}
          </span>
          <strong>{module.title}</strong>
          <div>
            {module.questions.map((item, index) => (
              <i
                className={
                  index === questionIndex
                    ? "active"
                    : data.responses.some(
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
            QUESTION 0{questionIndex + 1} / 0{module.questions.length}
          </span>
          <h2>{question.prompt}</h2>
          <p>{question.guidance}</p>
          <AnswerField question={question} value={answer} onChange={setAnswer} />
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
          <span>{saving ? "Saving securely…" : "Your work is saved as you move."}</span>
          {questionIndex < module.questions.length - 1 ? (
            <button
              className="module-primary"
              type="button"
              disabled={saving || !answer.trim()}
              onClick={() => saveAndMove(1)}
            >
              Save & continue →
            </button>
          ) : (
            <button
              className="module-primary"
              type="button"
              disabled={
                saving ||
                !answer.trim() ||
                answeredCount +
                  (savedAnswer.trim() ? 0 : answer.trim() ? 1 : 0) <
                  module.questions.length
              }
              onClick={async () => {
                if (answer.trim()) {
                  await onSave(module.key, question.key, answer);
                }
                await onComplete(module.key);
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

export default function MemberPage() {
  const [data, setData] = useState<MemberData | null>(null);
  const [view, setView] = useState<PortalView>("overview");
  const [activeModule, setActiveModule] = useState<ProgramModule | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    void loadMember();
  }, []);

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
          {navigation.map((item) => (
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

      <section className="portal-main">
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
              onOpenModule={setActiveModule}
              onNavigate={setView}
            />
          )}
          {view === "program" && (
            <Program data={data} onOpenModule={setActiveModule} />
          )}
          {view === "profile" && <Profile data={data} />}
          {view === "plan" && (
            <Plan data={data} saving={saving} mutate={mutate} />
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
          module={activeModule}
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
            await mutate({ action: "complete_module", moduleKey });
            setActiveModule(null);
            setView("overview");
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
            Your profile is {data.profile.overallProgress}% complete. Continue
            with one clear next move.
          </p>
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
          <strong>{data.profile.completedModules}/12</strong>
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
            <div className="continue-letter">{currentModule.stage}</div>
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
            Twelve focused modules. Your progress and every response are saved.
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
            progress.reduce((sum, item) => sum + (item?.progress ?? 0), 0) / 3,
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
                  return (
                    <li key={module.key}>
                      <span>{module.key}</span>
                      <div>
                        <strong>{module.title}</strong>
                        <small>
                          {item?.status === "complete"
                            ? "Complete"
                            : item?.status === "in_progress"
                              ? `${item.progress}% saved`
                              : "Ready to begin"}
                        </small>
                      </div>
                      <button type="button" onClick={() => onOpenModule(module)}>
                        {item?.status === "complete" ? "Review" : "Open"} →
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

function Profile({ data }: { data: MemberData }) {
  const insights = [
    ["WORK PATTERN", data.insights.workPattern],
    ["NATURAL VALUE", data.insights.naturalValue],
    ["ENERGY SOURCE", data.insights.energySource],
    ["POSITIONING", data.insights.positioning],
    ["NETWORK SIGNAL", data.insights.network],
    ["90-DAY DIRECTION", data.insights.direction],
  ];
  return (
    <div className="portal-view-stack">
      <div className="portal-page-heading">
        <span className="portal-eyebrow">PERSONALIZED IDENTITY PROFILE</span>
        <h1>Your operating system.</h1>
        <p>
          This living profile is generated from your real program responses.
        </p>
      </div>
      <section className="identity-hero-card live-identity-hero">
        <div>
          <span>{initials(data.profile.displayName)}</span>
          <p>PROFILE / {data.profile.overallProgress}% BUILT</p>
        </div>
        <h2>{data.profile.displayName}</h2>
        <strong>
          {data.profile.professionalTitle || "Your professional identity is forming"}
        </strong>
        <p>
          {data.profile.bio ||
            "Add your current context in Settings, then complete the program to connect it to your strengths, position, and direction."}
        </p>
      </section>
      <div className="identity-profile-grid live-profile-grid">
        {insights.map(([label, value], index) => (
          <article key={label}>
            <span>0{index + 1} / {label}</span>
            <p>{value}</p>
            <i>{value.includes("Complete") || value.includes("Still") ? "FORMING" : "REVEALED"}</i>
          </article>
        ))}
      </div>
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
                    <p>{response.answer}</p>
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
  const [dueDate, setDueDate] = useState("");
  async function submit(event: FormEvent) {
    event.preventDefault();
    await mutate({ action: "add_plan_item", title, dueDate });
    setTitle("");
    setDueDate("");
  }
  return (
    <div className="portal-view-stack">
      <div className="portal-page-heading">
        <span className="portal-eyebrow">EMBARK / EXECUTION SYSTEM</span>
        <h1>Your 90-day plan.</h1>
        <p>Capture commitments, set dates, and close the loop as you execute.</p>
      </div>
      <form className="plan-compose" onSubmit={submit}>
        <label>
          <span>THE NEXT MOVE</span>
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="What will you complete?"
            required
          />
        </label>
        <label>
          <span>TARGET DATE</span>
          <input
            type="date"
            value={dueDate}
            onChange={(event) => setDueDate(event.target.value)}
          />
        </label>
        <button type="submit" disabled={saving}>
          {saving ? "Saving…" : "Add commitment →"}
        </button>
      </form>
      <section className="plan-board">
        <header>
          <span>COMMITMENT</span>
          <span>DATE</span>
          <span>STATUS</span>
        </header>
        {data.plan.length ? (
          data.plan.map((item) => (
            <article
              className={item.status === "complete" ? "complete" : ""}
              key={item.id}
            >
              <label>
                <input
                  type="checkbox"
                  checked={item.status === "complete"}
                  onChange={() =>
                    mutate({
                      action: "toggle_plan_item",
                      id: item.id,
                      status:
                        item.status === "complete" ? "open" : "complete",
                    })
                  }
                />
                <i />
                <strong>{item.title}</strong>
              </label>
              <span>{item.due_date || "Open"}</span>
              <div>
                <em>{item.status}</em>
                <button
                  type="button"
                  onClick={() =>
                    mutate({ action: "delete_plan_item", id: item.id })
                  }
                  aria-label={`Delete ${item.title}`}
                >
                  ×
                </button>
              </div>
            </article>
          ))
        ) : (
          <p className="empty-state">
            Add your first concrete move above. Keep it specific and finishable.
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
                    <strong>{item.author_name}</strong>
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
          <p>saved conversations in your pilot community.</p>
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
        <p>Your pilot conversation is private to this account and saved.</p>
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
        <p>Manage the context and signals attached to your pilot profile.</p>
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
            ["Module reminders", moduleReminders, setModuleReminders],
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

async function logoutFromSettings() {
  await fetch("/api/auth/logout", { method: "POST" });
  window.location.assign("/");
}
