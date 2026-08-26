"use client";
/* eslint-disable @next/next/no-img-element */

import { useEffect, useState } from "react";
import { AuthModal } from "./member-experience";

type Audience = "entrepreneur" | "corporate";

const audiences = {
  entrepreneur: {
    label: "I’m building a business",
    headline: "Turn self-knowledge into better business decisions.",
    copy: "Clarify what you are uniquely built to do, how you create value, which relationships matter, and what to execute over the next 90 days.",
    outcomes: [
      "A clear founder position",
      "A map of skills and revenue paths",
      "A focused 90-day execution plan",
    ],
  },
  corporate: {
    label: "I’m building my career",
    headline: "Make your next move from clarity—not pressure.",
    copy: "Understand your patterns, define the value you bring, strengthen how you communicate it, and make career decisions that fit who you are.",
    outcomes: [
      "A stronger professional identity",
      "A map of relationships and opportunities",
      "A practical career action plan",
    ],
  },
};

const stages = [
  {
    letter: "A",
    name: "Analyze",
    summary: "Understand yourself before you decide what comes next.",
    detail:
      "Identify the patterns, values, strengths, energy, and experiences that shape how you think and operate.",
    modules: ["Know Your Type", "Know Your Energy", "Know Your Story"],
    output: "Self-discovery profile",
  },
  {
    letter: "B",
    name: "Brand",
    summary: "Turn what you know into a clear professional identity.",
    detail:
      "Define the value you bring, how you communicate it, and the reputation you want your work to create.",
    modules: [
      "Position Your Value",
      "Build Your Presence",
      "Your Brand Statement",
    ],
    output: "Professional positioning",
  },
  {
    letter: "L",
    name: "Leverage",
    summary: "Use the skills, relationships, and access you already have.",
    detail:
      "Map your network, identify opportunity paths, and connect your abilities to real ways of creating value.",
    modules: ["Map Your Network", "The Revenue Path", "Ecosystem & Referrals"],
    output: "Opportunity roadmap",
  },
  {
    letter: "E",
    name: "Embark",
    summary: "Choose a direction and put it into motion.",
    detail:
      "Reverse-engineer one meaningful goal into a focused 90-day plan with accountability built in.",
    modules: [
      "Your Launch Moment",
      "Your First 90 Days",
      "Your Accountability System",
    ],
    output: "90-day action plan",
  },
];

const faqs = [
  {
    question: "What is Able1Self?",
    answer:
      "Able1Self is a guided self-development program built around the four-stage ABLE framework: Analyze, Brand, Leverage, and Embark. It helps you understand yourself, define your value, recognize your opportunities, and build a plan you can act on.",
  },
  {
    question: "Who is the program for?",
    answer:
      "It is designed for entrepreneurs, professionals, emerging leaders, and anyone at an inflection point who wants to make their next move with more clarity and intention.",
  },
  {
    question: "Is the program self-paced?",
    answer:
      "Yes. The twelve core modules combine focused video lessons, written reflection, assessments, and practical exercises. Premium and VIP access add human review and coaching support.",
  },
  {
    question: "What do I receive at the end?",
    answer:
      "You receive a Personalized Identity Profile that brings together your strengths, values, decision patterns, professional positioning, network map, opportunity paths, and 90-day action plan.",
  },
  {
    question: "How does the community work?",
    answer:
      "Every enrolled member joins The Room, a private space for sharing progress, asking for feedback, and connecting with an accountability partner. Community participation is there to support the work—not distract from it.",
  },
  {
    question: "How long does it take?",
    answer:
      "The program is self-paced. Most people can complete the core work in several weeks, then use the Embark stage to execute their 90-day plan.",
  },
];

function Arrow() {
  return <span aria-hidden="true">↗</span>;
}

function Logo() {
  return (
    <a className="logo" href="#top" aria-label="Able1Self home">
      <img
        className="brand-symbol"
        src="/able1self-logo.png"
        alt=""
        aria-hidden="true"
      />
      <span className="brand-name">ABLE1SELF</span>
    </a>
  );
}

function IntroSequence() {
  return (
    <div className="intro-sequence" aria-hidden="true">
      <div className="intro-orb intro-orb-one" />
      <div className="intro-orb intro-orb-two" />
      <div className="intro-glass">
        <img src="/able1self-logo.png" alt="" />
      </div>
      <p>
        <span>ANALYZE</span>
        <span>BRAND</span>
        <span>LEVERAGE</span>
        <span>EMBARK</span>
      </p>
      <div className="intro-wipe" />
    </div>
  );
}

function ProgressRing({
  value,
  label,
}: {
  value: number;
  label: string;
}) {
  return (
    <div
      className="progress-ring"
      style={{ "--progress": `${value * 3.6}deg` } as React.CSSProperties}
      aria-label={`${label}: ${value}%`}
    >
      <div>
        <strong>{value}%</strong>
        <span>{label}</span>
      </div>
    </div>
  );
}

function PlatformPreview() {
  return (
    <div className="platform-preview reveal">
      <div className="preview-grid" aria-hidden="true" />
      <div className="photo-panel">
        <img
          src="/images/shawn-daniels.webp"
          alt="Shawn Daniels standing with confidence and clarity"
        />
        <div className="photo-shade" />
        <div className="photo-tag">
          <span>The transformation</span>
          <strong>Clear. Positioned. In motion.</strong>
        </div>
      </div>

      <div className="system-card stage-status">
        <div className="card-label">
          <span className="live-dot" />
          Current stage
        </div>
        <div className="stage-status-main">
          <div className="stage-badge">A</div>
          <div>
            <strong>Analyze</strong>
            <span>Module 2 of 3</span>
          </div>
        </div>
        <div className="mini-progress">
          <span style={{ width: "68%" }} />
        </div>
      </div>

      <div className="system-card profile-status">
        <ProgressRing value={72} label="Profile" />
        <div>
          <span className="card-label">Identity profile</span>
          <strong>3 insights ready</strong>
          <small>Values · Energy · Strengths</small>
        </div>
      </div>

      <div className="system-card next-action">
        <span className="card-label">Future state</span>
        <strong>Operating from self-knowledge</strong>
        <span className="action-arrow">→</span>
      </div>

      <div className="system-status">
        <span />
        <p>YOUR NEXT MOVE IS SYNCING</p>
        <b>01 / 04</b>
      </div>
    </div>
  );
}

function IdentityDashboard() {
  return (
    <div className="identity-dashboard reveal">
      <div className="dash-top">
        <div>
          <span className="product-chip">A1 / PROFILE</span>
          <h3>Your operating system</h3>
        </div>
        <div className="dash-avatar">JD</div>
      </div>

      <div className="dash-progress">
        <div>
          <span>Overall progress</span>
          <strong>68%</strong>
        </div>
        <div className="wide-progress">
          <span />
        </div>
        <div className="stage-track">
          {stages.map((stage, index) => (
            <div className={index < 2 ? "complete" : ""} key={stage.letter}>
              <span>{stage.letter}</span>
              <small>{stage.name}</small>
            </div>
          ))}
        </div>
      </div>

      <div className="dash-data-grid">
        <article>
          <span className="data-label">Core values</span>
          <strong>Autonomy / Impact / Mastery</strong>
          <div className="data-lines">
            <i style={{ width: "88%" }} />
            <i style={{ width: "68%" }} />
            <i style={{ width: "76%" }} />
          </div>
        </article>
        <article>
          <span className="data-label">Work pattern</span>
          <strong>Strategic builder</strong>
          <div className="signal-chart" aria-hidden="true">
            {[34, 60, 46, 82, 58, 92, 70, 100].map((height, index) => (
              <i style={{ height: `${height}%` }} key={index} />
            ))}
          </div>
        </article>
        <article className="action-plan">
          <div>
            <span className="data-label">90-day focus</span>
            <strong>Launch the next chapter</strong>
          </div>
          <ProgressRing value={42} label="Plan" />
        </article>
      </div>

      <div className="dash-footer">
        <span>Profile updated today</span>
        <button type="button">View full profile →</button>
      </div>
    </div>
  );
}

function CommunityPreview() {
  return (
    <div className="community-preview reveal">
      <div className="community-header">
        <div>
          <span className="product-chip">COMMUNITY / LIVE</span>
          <strong>The Room</strong>
        </div>
        <span className="online-count">
          <i /> 24 online
        </span>
      </div>
      <article className="community-post">
        <div className="member-avatar lime">SD</div>
        <div>
          <div className="member-meta">
            <strong>Shawn Daniels</strong>
            <span>A</span>
            <time>8:42 AM</time>
          </div>
          <p>
            What is one decision you would make differently if you trusted your
            own read of the situation?
          </p>
          <div className="post-meta">
            <span>18 responses</span>
            <span>12 reflections</span>
          </div>
        </div>
      </article>
      <article className="community-post compact">
        <div className="member-avatar">KM</div>
        <div>
          <div className="member-meta">
            <strong>Kiara M.</strong>
            <span>B</span>
          </div>
          <p>My professional statement finally sounds like me.</p>
        </div>
      </article>
      <div className="match-card">
        <span className="card-label">Accountability match</span>
        <div>
          <div className="member-avatar dark">JC</div>
          <p>
            <strong>Jordan C.</strong>
            <small>Leverage · 67% complete</small>
          </p>
          <button type="button">Message</button>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [audience, setAudience] = useState<Audience>("entrepreneur");
  const [activeStage, setActiveStage] = useState(0);
  const [introVisible, setIntroVisible] = useState(true);
  const [authOpen, setAuthOpen] = useState(false);
  const [memberEmail, setMemberEmail] = useState("");

  useEffect(() => {
    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const introTimer = window.setTimeout(
      () => setIntroVisible(false),
      reducedMotion ? 200 : 3200,
    );
    const sessionTimer = window.setTimeout(async () => {
      try {
        const response = await fetch("/api/auth/session");
        const result = (await response.json()) as {
          authenticated?: boolean;
          user?: { email?: string } | null;
        };
        if (result.authenticated && result.user?.email) {
          setMemberEmail(result.user.email);
        }
      } catch {
        // The public site remains usable if the member service is unavailable.
      }
      if (new URLSearchParams(window.location.search).get("login") === "1") {
        setAuthOpen(true);
      }
    }, 0);

    const elements = document.querySelectorAll<HTMLElement>(".reveal");
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -6% 0px" },
    );

    elements.forEach((element) => observer.observe(element));
    return () => {
      window.clearTimeout(introTimer);
      window.clearTimeout(sessionTimer);
      observer.disconnect();
    };
  }, []);

  const selectedAudience = audiences[audience];
  const selectedStage = stages[activeStage];

  function openMemberAccess() {
    if (memberEmail) window.location.assign("/member");
    else setAuthOpen(true);
  }

  function authenticate(email: string) {
    setMemberEmail(email);
    setAuthOpen(false);
    window.location.assign("/member");
  }

  return (
    <main>
      {introVisible && <IntroSequence />}
      {authOpen && (
        <AuthModal
          onClose={() => setAuthOpen(false)}
          onAuthenticated={authenticate}
        />
      )}
      <header className="site-header">
        <Logo />
        <nav className={menuOpen ? "open" : ""} aria-label="Primary navigation">
          <a href="#framework" onClick={() => setMenuOpen(false)}>
            Framework
          </a>
          <a href="#profile" onClick={() => setMenuOpen(false)}>
            Your profile
          </a>
          <a href="#founder" onClick={() => setMenuOpen(false)}>
            Founder
          </a>
          <a href="#program" onClick={() => setMenuOpen(false)}>
            Program
          </a>
          <a href="#access" onClick={() => setMenuOpen(false)}>
            Pricing
          </a>
          <button
            className="nav-login"
            type="button"
            onClick={() => {
              setMenuOpen(false);
              openMemberAccess();
            }}
          >
            {memberEmail ? "Member dashboard" : "Member login"}
          </button>
        </nav>
        <a className="nav-cta" href="#access">
          Start the program <Arrow />
        </a>
        <button
          className={`menu-toggle ${menuOpen ? "open" : ""}`}
          type="button"
          aria-label="Toggle navigation"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((value) => !value)}
        >
          <span />
          <span />
        </button>
      </header>

      <section className="hero" id="top">
        <div className="hero-grid" aria-hidden="true" />
        <div className="hero-glow" aria-hidden="true" />
        <div className="hero-copy">
          <div className="status-pill reveal">
            <span />
            The ABLE Program · Enrollment open
          </div>
          <h1 className="reveal">
            Know yourself.
            <span>Build what comes next.</span>
          </h1>
          <p className="hero-intro reveal">
            A four-stage self-development system that turns reflection into a
            clear professional identity, stronger decisions, and a plan you can
            act on.
          </p>
          <div className="hero-actions reveal">
            <a className="button primary" href="#access">
              Start your ABLE journey <Arrow />
            </a>
            <button
              className="button secondary"
              type="button"
              onClick={openMemberAccess}
            >
              {memberEmail ? "Open dashboard" : "Member login"}{" "}
              <span aria-hidden="true">→</span>
            </button>
          </div>
          <div className="built-for reveal">
            <span>Built for</span>
            <p>Entrepreneurs</p>
            <i />
            <p>Professionals</p>
            <i />
            <p>People at a crossroads</p>
          </div>
        </div>
        <PlatformPreview />
        <div className="hero-metrics">
          <div className="reveal">
            <strong>04</strong>
            <span>connected stages</span>
          </div>
          <div className="reveal">
            <strong>12</strong>
            <span>focused modules</span>
          </div>
          <div className="reveal">
            <strong>90</strong>
            <span>day action plan</span>
          </div>
        </div>
      </section>

      <section className="clarity-section">
        <div className="section-heading">
          <span className="section-label reveal">01 / Start with clarity</span>
          <h2 className="reveal">
            You don’t need more advice.
            <span>You need a clearer read on yourself.</span>
          </h2>
          <p className="reveal">
            Able1Self gives you a structured way to step back, understand the
            patterns behind your choices, and move forward with intention.
          </p>
        </div>

        <div className="audience-switcher reveal">
          <div className="audience-tabs" role="tablist" aria-label="Choose your path">
            {(Object.keys(audiences) as Audience[]).map((key) => (
              <button
                type="button"
                role="tab"
                aria-selected={audience === key}
                className={audience === key ? "active" : ""}
                key={key}
                onClick={() => setAudience(key)}
              >
                {audiences[key].label}
              </button>
            ))}
          </div>
          <div className="audience-panel" role="tabpanel">
            <div>
              <span className="product-chip">
                PATH / {audience === "entrepreneur" ? "FOUNDER" : "CAREER"}
              </span>
              <h3>{selectedAudience.headline}</h3>
              <p>{selectedAudience.copy}</p>
            </div>
            <ul>
              {selectedAudience.outcomes.map((outcome) => (
                <li key={outcome}>
                  <span>✓</span>
                  {outcome}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="framework-section" id="framework">
        <div className="framework-intro">
          <span className="section-label light reveal">02 / The framework</span>
          <h2 className="reveal">
            One system.
            <span>Four connected decisions.</span>
          </h2>
          <p className="reveal">
            Each stage answers a different question. Together, they move you
            from self-awareness to focused execution.
          </p>
        </div>

        <div className="framework-console reveal">
          <div className="stage-tabs" role="tablist" aria-label="ABLE stages">
            {stages.map((stage, index) => (
              <button
                type="button"
                role="tab"
                aria-selected={activeStage === index}
                className={activeStage === index ? "active" : ""}
                onClick={() => setActiveStage(index)}
                key={stage.letter}
              >
                <span>{stage.letter}</span>
                <div>
                  <small>0{index + 1}</small>
                  <strong>{stage.name}</strong>
                </div>
                <i />
              </button>
            ))}
          </div>

          <div className="stage-panel" role="tabpanel">
            <div className="stage-panel-head">
              <span className="stage-large">{selectedStage.letter}</span>
              <div>
                <span className="product-chip">
                  STAGE 0{activeStage + 1} / 04
                </span>
                <h3>{selectedStage.name}</h3>
              </div>
            </div>
            <p className="stage-summary">{selectedStage.summary}</p>
            <p className="stage-detail">{selectedStage.detail}</p>
            <div className="stage-modules">
              {selectedStage.modules.map((module, index) => (
                <div key={module}>
                  <span>
                    {selectedStage.letter}
                    {index + 1}
                  </span>
                  <strong>{module}</strong>
                </div>
              ))}
            </div>
            <div className="stage-output">
              <span>Output</span>
              <strong>{selectedStage.output}</strong>
            </div>
          </div>
        </div>
      </section>

      <section className="profile-section" id="profile">
        <div className="profile-copy">
          <span className="section-label reveal">03 / Your result</span>
          <h2 className="reveal">
            Your insights,
            <span>connected in one place.</span>
          </h2>
          <p className="reveal">
            As you complete the program, your Personalized Identity Profile
            becomes a working view of how you operate and where you are going.
            It is built from your answers—not generic advice.
          </p>
          <div className="profile-points reveal">
            {[
              ["01", "Strengths, values, and decision patterns"],
              ["02", "Professional positioning and brand statement"],
              ["03", "Network map and opportunity pathways"],
              ["04", "Focused 90-day action plan"],
            ].map(([number, text]) => (
              <div key={number}>
                <span>{number}</span>
                <p>{text}</p>
              </div>
            ))}
          </div>
        </div>
        <IdentityDashboard />
      </section>

      <section className="founder-section" id="founder">
        <div className="founder-signal reveal">
          <div className="founder-portrait">
            <img
              src="/images/shawn-profile.jpg"
              alt="Shawn Daniels writing in a notebook at his design table"
            />
          </div>
          <span>DESIGNED FROM LIVED EXPERIENCE</span>
          <strong>Shawn Daniels</strong>
          <p>Founder · Designer · Strategist</p>
        </div>
        <div className="founder-copy">
          <span className="section-label light reveal">04 / Why Shawn built it</span>
          <h2 className="reveal">
            A framework built
            <span>from lived experience.</span>
          </h2>
          <div className="founder-text reveal">
            <p>
              In corporate leadership, Shawn watched talented people make major
              career decisions based on expectations, influence, and
              groupthink—not a real understanding of themselves.
            </p>
            <p>
              He began building a framework that helped people get clear, lead
              with confidence, and make better moves. When Shawn later faced his
              own career transition, he used that same framework on himself.
            </p>
            <p>
              Shawn is a designer and strategist. Able1Self is the
              self-development system behind how he learned to understand his
              strengths, choose his direction, and build a life that fit.
            </p>
          </div>
          <blockquote className="reveal">
            “Now I’m opening the framework itself.”
          </blockquote>
          <a className="button light-button reveal" href="#program">
            Explore the program <Arrow />
          </a>
        </div>
      </section>

      <section className="program-section" id="program">
        <div className="program-heading">
          <div>
            <span className="section-label reveal">05 / The curriculum</span>
            <h2 className="reveal">
              Twelve modules.
              <span>One clear next move.</span>
            </h2>
          </div>
          <p className="reveal">
            Move through the stages in order. Each module combines a focused
            lesson, guided reflection, and a practical output that feeds your
            profile.
          </p>
        </div>

        <div className="module-grid">
          {stages.map((stage, stageIndex) => (
            <article className="module-card reveal" key={stage.letter}>
              <div className="module-head">
                <span>{stage.letter}</span>
                <div>
                  <small>STAGE 0{stageIndex + 1}</small>
                  <h3>{stage.name}</h3>
                </div>
              </div>
              <ol>
                {stage.modules.map((module, index) => (
                  <li key={module}>
                    <span>0{index + 1}</span>
                    {module}
                  </li>
                ))}
              </ol>
              <div className="module-output">
                <span>OUTPUT</span>
                <strong>{stage.output}</strong>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="community-section">
        <div className="community-copy">
          <span className="section-label reveal">06 / The Room</span>
          <h2 className="reveal">
            Do the work
            <span>with people who are moving too.</span>
          </h2>
          <p className="reveal">
            The Room is the private community inside Able1Self. Share progress,
            ask for perspective, connect with your accountability partner, and
            keep momentum when the work gets real.
          </p>
          <ul className="community-features reveal">
            <li>
              <span>01</span> Private member board
            </li>
            <li>
              <span>02</span> Direct messages
            </li>
            <li>
              <span>03</span> Accountability matching
            </li>
          </ul>
        </div>
        <CommunityPreview />
      </section>

      <section className="access-section" id="access">
        <div className="access-heading">
          <div>
            <span className="section-label light reveal">07 / Access</span>
            <h2 className="reveal">
              Choose the level
              <span>of support you need.</span>
            </h2>
          </div>
          <div className="founding-note reveal">
            <strong>50</strong>
            <p>Founding member places available.</p>
          </div>
        </div>

        <div className="pricing-grid">
          {[
            {
              name: "Starter",
              price: "297",
              note: "For the self-directed participant.",
              items: [
                "Complete 12-module program",
                "Personalized Identity Profile",
                "Accountability partner matching",
                "Community and messaging access",
                "Email support",
              ],
            },
            {
              name: "Premium",
              price: "597",
              note: "For insight with expert feedback.",
              featured: true,
              items: [
                "Everything in Starter",
                "Human-reviewed Identity Profile",
                "One coaching touchpoint with Shawn",
                "Priority support",
                "Profile refinement guidance",
              ],
            },
            {
              name: "VIP",
              price: "997",
              note: "For a fully supported process.",
              items: [
                "Everything in Premium",
                "Fully custom profile review",
                "Extended coaching access",
                "Lifetime profile updates",
                "First access to Able Society",
              ],
            },
          ].map((tier, index) => (
            <article
              className={`price-card reveal ${tier.featured ? "featured" : ""}`}
              key={tier.name}
            >
              {tier.featured && <span className="popular">Most popular</span>}
              <span className="price-index">0{index + 1}</span>
              <h3>{tier.name}</h3>
              <p>{tier.note}</p>
              <div className="price">
                <span>$</span>
                {tier.price}
              </div>
              <ul>
                {tier.items.map((item) => (
                  <li key={item}>
                    <span>✓</span>
                    {item}
                  </li>
                ))}
              </ul>
              <a
                className={`button ${tier.featured ? "primary" : "dark-outline"}`}
                href="#"
              >
                Choose {tier.name} <Arrow />
              </a>
            </article>
          ))}
        </div>
        <p className="payment-note reveal">
          One-time payment or three installments available.
        </p>
      </section>

      <section className="faq-section" id="faq">
        <div className="faq-heading">
          <span className="section-label reveal">08 / Questions</span>
          <h2 className="reveal">
            What you need to know
            <span>before you begin.</span>
          </h2>
        </div>
        <div className="faq-list">
          {faqs.map((faq, index) => (
            <details className="reveal" key={faq.question}>
              <summary>
                <span>0{index + 1}</span>
                {faq.question}
                <i>+</i>
              </summary>
              <p>{faq.answer}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="final-cta">
        <div className="final-grid" aria-hidden="true" />
        <div className="final-orbit" aria-hidden="true">
          <span>A</span>
          <span>B</span>
          <span>L</span>
          <span>E</span>
        </div>
        <div className="final-content">
          <span className="section-label light reveal">Your next move starts here</span>
          <h2 className="reveal">
            Understand who you are.
            <span>Build from there.</span>
          </h2>
          <p className="reveal">
            Join the next Able1Self cohort and turn insight into a direction you
            can act on.
          </p>
          <a className="button primary reveal" href="#access">
            Start your ABLE journey <Arrow />
          </a>
        </div>
      </section>

      <footer>
        <div className="footer-brand">
          <Logo />
          <p>A practical system for personal evolution.</p>
        </div>
        <div className="footer-links">
          <div>
            <span>Program</span>
            <a href="#framework">Framework</a>
            <a href="#profile">Identity Profile</a>
            <a href="#program">Curriculum</a>
            <a href="#access">Pricing</a>
          </div>
          <div>
            <span>About</span>
            <a href="#founder">Shawn Daniels</a>
            <a href="#faq">FAQ</a>
            <button type="button" onClick={openMemberAccess}>
              {memberEmail ? "Open dashboard" : "Member login"}
            </button>
          </div>
          <div>
            <span>Legal</span>
            <a href="#">Privacy</a>
            <a href="#">Terms</a>
            <a href="#">Refund policy</a>
            <a href="#">Community guidelines</a>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© 2026 Able1Self. All rights reserved.</span>
          <a href="#top">Back to top ↑</a>
        </div>
      </footer>
    </main>
  );
}
