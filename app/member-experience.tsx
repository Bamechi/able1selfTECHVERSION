"use client";
/* eslint-disable @next/next/no-img-element */

import { FormEvent, useState } from "react";

type AuthMode = "login" | "forgot" | "signup";
type PortalView =
  | "overview"
  | "program"
  | "profile"
  | "community"
  | "messages"
  | "settings";

export function AuthModal({
  onClose,
  onAuthenticated,
}: {
  onClose: () => void;
  onAuthenticated: (email: string) => void;
}) {
  const [mode, setMode] = useState<AuthMode>("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch(
        mode === "login"
          ? "/api/auth/login"
          : mode === "signup"
            ? "/api/auth/signup"
            : "/api/auth/forgot-password",
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(
            mode === "forgot"
              ? { email }
              : mode === "signup"
                ? { name, email, password }
                : { email, password },
          ),
        },
      );
      const result = (await response.json()) as {
        ok?: boolean;
        error?: string;
        message?: string;
        authenticated?: boolean;
      };

      if (!response.ok || !result.ok) {
        setMessage(result.error ?? "Something went wrong. Please try again.");
        return;
      }

      if (mode === "login" || (mode === "signup" && result.authenticated)) {
        onAuthenticated(email);
      } else {
        setMessage(
          result.message ??
            "Check your inbox for the next secure step.",
        );
      }
    } catch {
      setMessage("The sign-in service is unavailable. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-overlay" role="dialog" aria-modal="true">
      <button
        className="auth-backdrop"
        type="button"
        aria-label="Close sign in"
        onClick={onClose}
      />
      <section className={`auth-panel auth-panel-${mode}`}>
        <div className="auth-ambient" aria-hidden="true" />
        <header className="auth-header">
          <a className="auth-brand" href="#top" onClick={onClose}>
            <img src="/able1self-logo.png" alt="" />
            <span>ABLE1SELF</span>
          </a>
          <button
            className="auth-close"
            type="button"
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </header>

        <div className="auth-copy">
          <span className="auth-kicker">
            {mode === "login"
              ? "MEMBER ACCESS"
              : mode === "signup"
                ? "CREATE YOUR ACCOUNT"
                : "ACCOUNT RECOVERY"}
          </span>
          <h2>
            {mode === "login"
              ? "Continue your evolution."
              : mode === "signup"
                ? "Begin with clarity."
                : "Reset your access."}
          </h2>
          <p>
            {mode === "login"
              ? "Return to your profile, program progress, community, and next action."
              : mode === "signup"
                ? "Create a secure member profile. Your answers and progress will stay connected to this account."
                : "Enter your account email. We’ll send a secure reset link."}
          </p>
        </div>

        <form className="auth-form" onSubmit={submit}>
          {mode === "signup" && (
            <label>
              <span>Your name</span>
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                autoComplete="name"
                required
              />
            </label>
          )}
          <label>
            <span>Email address</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              required
            />
          </label>

          {mode !== "forgot" && (
            <label>
              <span>Password</span>
              <div className="password-field">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoComplete={mode === "signup" ? "new-password" : "current-password"}
                  minLength={mode === "signup" ? 8 : undefined}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </label>
          )}

          {mode === "login" && (
            <button
              className="forgot-link"
              type="button"
              onClick={() => {
                setMode("forgot");
                setMessage("");
              }}
            >
              Forgot password?
            </button>
          )}

          {message && (
            <p className="auth-message" role="status">
              {message}
            </p>
          )}

          <button className="auth-submit" type="submit" disabled={loading}>
            {loading
              ? "Working…"
              : mode === "login"
                ? "Enter member portal →"
                : mode === "signup"
                  ? "Create account →"
                  : "Request reset →"}
          </button>
        </form>

        {mode === "login" && (
          <button
            className="auth-return auth-create"
            type="button"
            onClick={() => {
              setMode("signup");
              setMessage("");
            }}
          >
            New to Able1Self? Create an account →
          </button>
        )}

        {mode !== "login" && (
          <button
            className="auth-return"
            type="button"
            onClick={() => {
              setMode("login");
              setMessage("");
            }}
          >
            ← Back to sign in
          </button>
        )}

        <footer className="auth-footer">
          <span>Encrypted access</span>
          <span>ABLE / MEMBER OS</span>
        </footer>
      </section>
    </div>
  );
}

const portalNavigation: Array<{
  id: PortalView;
  label: string;
  symbol: string;
}> = [
  { id: "overview", label: "Home", symbol: "⌂" },
  { id: "program", label: "Program", symbol: "◫" },
  { id: "profile", label: "My profile", symbol: "◎" },
  { id: "community", label: "The Room", symbol: "◌" },
  { id: "messages", label: "Messages", symbol: "↗" },
  { id: "settings", label: "Settings", symbol: "⌘" },
];

const programStages = [
  {
    letter: "A",
    name: "Analyze",
    progress: 100,
    status: "Complete",
    modules: ["Know Your Type", "Know Your Energy", "Know Your Story"],
  },
  {
    letter: "B",
    name: "Brand",
    progress: 67,
    status: "In progress",
    modules: ["Position Your Value", "Build Your Presence", "Brand Statement"],
  },
  {
    letter: "L",
    name: "Leverage",
    progress: 0,
    status: "Up next",
    modules: ["Map Your Network", "The Revenue Path", "Ecosystem & Referrals"],
  },
  {
    letter: "E",
    name: "Embark",
    progress: 0,
    status: "Locked",
    modules: ["Your Launch Moment", "Your First 90 Days", "Accountability"],
  },
];

function OverviewView() {
  return (
    <>
      <div className="portal-welcome">
        <div>
          <span className="portal-eyebrow">FRIDAY / 31 JULY</span>
          <h1>
            Welcome back,
            <span>Amechi.</span>
          </h1>
          <p>Your identity profile is 68% complete. Keep the signal moving.</p>
        </div>
        <div className="portal-score">
          <div className="portal-score-ring">
            <strong>68%</strong>
            <span>PROFILE</span>
          </div>
        </div>
      </div>

      <div className="portal-stat-grid">
        <article>
          <span>Current stage</span>
          <strong>Brand</strong>
          <small>B / 02</small>
        </article>
        <article>
          <span>Modules complete</span>
          <strong>05</strong>
          <small>of 12</small>
        </article>
        <article>
          <span>Current streak</span>
          <strong>07</strong>
          <small>days</small>
        </article>
        <article>
          <span>Next milestone</span>
          <strong>Profile review</strong>
          <small>2 modules away</small>
        </article>
      </div>

      <div className="portal-main-grid">
        <article className="continue-card">
          <div className="card-topline">
            <span>CONTINUE / B2</span>
            <i>18 MIN</i>
          </div>
          <div className="continue-content">
            <div className="continue-letter">B</div>
            <div>
              <span>BRAND · MODULE 02</span>
              <h2>Build Your Presence</h2>
              <p>
                Align how you communicate, lead, and create value with the
                identity you defined.
              </p>
              <button type="button">Continue module →</button>
            </div>
          </div>
          <div className="continue-progress">
            <span style={{ width: "44%" }} />
          </div>
        </article>

        <article className="next-move-card">
          <span>NEXT MOVE</span>
          <h3>Draft your professional positioning statement.</h3>
          <p>Connect your strongest skill to the outcome people trust you to create.</p>
          <button type="button">Open exercise ↗</button>
        </article>
      </div>

      <div className="portal-lower-grid">
        <article className="profile-preview-card">
          <div className="card-topline">
            <span>IDENTITY PROFILE</span>
            <i>UPDATED TODAY</i>
          </div>
          <div className="profile-signal-row">
            {[
              ["STRATEGY", "92"],
              ["CREATION", "84"],
              ["LEADERSHIP", "78"],
              ["CONNECTION", "66"],
            ].map(([label, value]) => (
              <div key={label}>
                <span>{label}</span>
                <i>
                  <b style={{ width: `${value}%` }} />
                </i>
                <strong>{value}</strong>
              </div>
            ))}
          </div>
        </article>

        <article className="room-preview-card">
          <div className="card-topline">
            <span>THE ROOM</span>
            <i>24 ONLINE</i>
          </div>
          <p>“What changed when you stopped performing and started deciding?”</p>
          <div>
            <span>SD</span>
            <small>Shawn Daniels · 18 responses</small>
          </div>
        </article>
      </div>
    </>
  );
}

function ProgramView() {
  return (
    <div className="portal-view-stack">
      <div className="portal-page-heading">
        <span className="portal-eyebrow">YOUR CURRICULUM</span>
        <h1>The ABLE Program</h1>
        <p>Four connected stages. Twelve focused modules. One clear next move.</p>
      </div>
      <div className="portal-stage-list">
        {programStages.map((stage, stageIndex) => (
          <article key={stage.letter}>
            <div className="portal-stage-head">
              <span className="portal-stage-letter">{stage.letter}</span>
              <div>
                <small>STAGE 0{stageIndex + 1}</small>
                <h2>{stage.name}</h2>
              </div>
              <div className="portal-stage-progress">
                <span>{stage.status}</span>
                <strong>{stage.progress}%</strong>
              </div>
            </div>
            <div className="portal-stage-bar">
              <span style={{ width: `${stage.progress}%` }} />
            </div>
            <ol>
              {stage.modules.map((module, moduleIndex) => (
                <li key={module}>
                  <span>
                    {stage.letter}
                    {moduleIndex + 1}
                  </span>
                  <strong>{module}</strong>
                  <i>
                    {stage.progress === 100
                      ? "Complete"
                      : stageIndex === 1 && moduleIndex < 2
                        ? moduleIndex === 0
                          ? "Complete"
                          : "Continue →"
                        : "Locked"}
                  </i>
                </li>
              ))}
            </ol>
          </article>
        ))}
      </div>
    </div>
  );
}

function ProfileView() {
  return (
    <div className="portal-view-stack">
      <div className="portal-page-heading">
        <span className="portal-eyebrow">PERSONALIZED IDENTITY PROFILE</span>
        <h1>Your operating system</h1>
        <p>A living record of how you work, create value, and move forward.</p>
      </div>
      <div className="identity-profile-grid">
        <article className="identity-hero-card">
          <div className="identity-monogram">AM</div>
          <span>PRIMARY WORK PATTERN</span>
          <h2>Strategic Builder</h2>
          <p>
            You turn complexity into systems, connect ideas across disciplines,
            and create momentum by making the next move visible.
          </p>
          <button type="button">Download profile ↗</button>
        </article>
        <article>
          <span>CORE VALUES</span>
          <h3>Autonomy</h3>
          <h3>Impact</h3>
          <h3>Mastery</h3>
        </article>
        <article>
          <span>ENERGY MAP</span>
          <div className="energy-orbit">
            <b>84</b>
            <small>CREATIVE</small>
          </div>
        </article>
        <article>
          <span>POSITIONING</span>
          <blockquote>
            “I translate ambitious ideas into clear systems people can act on.”
          </blockquote>
        </article>
        <article>
          <span>90-DAY DIRECTION</span>
          <h3>Build and launch the next operating chapter.</h3>
          <div className="identity-plan-bar">
            <span style={{ width: "42%" }} />
          </div>
          <small>42% mapped</small>
        </article>
      </div>
    </div>
  );
}

function CommunityView() {
  return (
    <div className="portal-view-stack">
      <div className="portal-page-heading split">
        <div>
          <span className="portal-eyebrow">COMMUNITY / LIVE</span>
          <h1>The Room</h1>
          <p>Make progress in public with people doing the same work.</p>
        </div>
        <button type="button">Start a reflection +</button>
      </div>
      <div className="room-layout">
        <div className="room-feed">
          {[
            {
              initials: "SD",
              name: "Shawn Daniels",
              time: "8:42 AM",
              text: "What decision becomes easier when you stop asking who you should be and start from who you already are?",
              meta: "18 responses · 12 reflections",
            },
            {
              initials: "KM",
              name: "Kiara M.",
              time: "Yesterday",
              text: "Finished my positioning statement. It is the first time my professional story sounds like me instead of a résumé.",
              meta: "9 responses · Stage B",
            },
            {
              initials: "JC",
              name: "Jordan C.",
              time: "Tuesday",
              text: "My network map showed me three warm paths I had been overlooking. Reached out to the first one today.",
              meta: "14 responses · Stage L",
            },
          ].map((post) => (
            <article className="room-post" key={post.name + post.time}>
              <div className="room-avatar">{post.initials}</div>
              <div>
                <header>
                  <strong>{post.name}</strong>
                  <span>{post.time}</span>
                </header>
                <p>{post.text}</p>
                <footer>{post.meta}</footer>
              </div>
            </article>
          ))}
        </div>
        <aside className="room-sidebar">
          <span>ACCOUNTABILITY PARTNER</span>
          <div className="partner-avatar">JC</div>
          <h3>Jordan C.</h3>
          <p>Leverage · 67% complete</p>
          <button type="button">Send message →</button>
          <hr />
          <span>THIS WEEK</span>
          <strong>24</strong>
          <p>members moved forward</p>
        </aside>
      </div>
    </div>
  );
}

function MessagesView() {
  return (
    <div className="portal-view-stack">
      <div className="portal-page-heading">
        <span className="portal-eyebrow">DIRECT MESSAGES</span>
        <h1>Accountability</h1>
        <p>Keep the work moving with the person who knows your current goal.</p>
      </div>
      <div className="message-shell">
        <aside>
          <span>CONVERSATIONS</span>
          <button className="active" type="button">
            <i>JC</i>
            <p>
              <strong>Jordan C.</strong>
              <small>That sounds like the move.</small>
            </p>
            <b>2</b>
          </button>
          <button type="button">
            <i>SD</i>
            <p>
              <strong>Shawn Daniels</strong>
              <small>Profile review ready.</small>
            </p>
          </button>
        </aside>
        <section>
          <header>
            <div className="room-avatar">JC</div>
            <p>
              <strong>Jordan C.</strong>
              <small>Accountability partner · Online</small>
            </p>
          </header>
          <div className="message-thread">
            <p className="received">
              What is the one thing you are committing to before Friday?
              <small>10:16 AM</small>
            </p>
            <p className="sent">
              I’m finishing the positioning statement and sending it to three
              trusted people for feedback.
              <small>10:21 AM</small>
            </p>
            <p className="received">
              Clear and measurable. That sounds like the move.
              <small>10:22 AM</small>
            </p>
          </div>
          <form onSubmit={(event) => event.preventDefault()}>
            <input aria-label="Message" placeholder="Write a message…" />
            <button type="submit">Send ↑</button>
          </form>
        </section>
      </div>
    </div>
  );
}

function SettingsView({ email }: { email: string }) {
  return (
    <div className="portal-view-stack">
      <div className="portal-page-heading">
        <span className="portal-eyebrow">ACCOUNT CONTROL</span>
        <h1>Settings</h1>
        <p>Manage your profile, communication, and account security.</p>
      </div>
      <div className="settings-stack">
        <section>
          <header>
            <span>PROFILE</span>
            <p>How you appear across Able1Self.</p>
          </header>
          <div className="settings-fields">
            <label>
              <span>Display name</span>
              <input defaultValue="Amechi" />
            </label>
            <label>
              <span>Email address</span>
              <input defaultValue={email} type="email" />
            </label>
          </div>
          <button type="button">Save changes</button>
        </section>
        <section>
          <header>
            <span>NOTIFICATIONS</span>
            <p>Choose which signals reach your inbox.</p>
          </header>
          {[
            "Module and milestone reminders",
            "Accountability partner messages",
            "Community responses",
          ].map((label, index) => (
            <label className="setting-toggle" key={label}>
              <span>{label}</span>
              <input type="checkbox" defaultChecked={index < 2} />
              <i />
            </label>
          ))}
        </section>
        <section>
          <header>
            <span>SECURITY</span>
            <p>Password and active session controls.</p>
          </header>
          <button className="secondary-setting" type="button">
            Change password
          </button>
        </section>
      </div>
    </div>
  );
}

export function MemberPortal({
  email,
  onClose,
  onSignOut,
}: {
  email: string;
  onClose: () => void;
  onSignOut: () => void;
}) {
  const [view, setView] = useState<PortalView>("overview");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  let content;
  if (view === "program") content = <ProgramView />;
  else if (view === "profile") content = <ProfileView />;
  else if (view === "community") content = <CommunityView />;
  else if (view === "messages") content = <MessagesView />;
  else if (view === "settings") content = <SettingsView email={email} />;
  else content = <OverviewView />;

  return (
    <div className="member-portal">
      <aside className={`portal-sidebar ${mobileNavOpen ? "open" : ""}`}>
        <div className="portal-brand">
          <img src="/able1self-logo.png" alt="" />
          <span>ABLE1SELF</span>
        </div>
        <nav aria-label="Member portal">
          {portalNavigation.map((item) => (
            <button
              className={view === item.id ? "active" : ""}
              type="button"
              key={item.id}
              onClick={() => {
                setView(item.id);
                setMobileNavOpen(false);
              }}
            >
              <span>{item.symbol}</span>
              {item.label}
              {item.id === "messages" && <i>2</i>}
            </button>
          ))}
        </nav>
        <div className="portal-user">
          <div>AM</div>
          <p>
            <strong>Amechi</strong>
            <small>{email}</small>
          </p>
          <button type="button" aria-label="Sign out" onClick={onSignOut}>
            ↗
          </button>
        </div>
      </aside>

      <div className="portal-main">
        <header className="portal-topbar">
          <button
            className="portal-menu"
            type="button"
            onClick={() => setMobileNavOpen((value) => !value)}
            aria-label="Toggle portal navigation"
          >
            ☰
          </button>
          <div>
            <span className="portal-live-dot" />
            MEMBER OS / SYNCED
          </div>
          <div className="portal-top-actions">
            <button type="button" aria-label="Notifications">
              ◌ <i>3</i>
            </button>
            <button type="button" onClick={onClose}>
              View site ↗
            </button>
          </div>
        </header>
        <main className="portal-content">{content}</main>
      </div>
    </div>
  );
}
