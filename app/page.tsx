"use client";

import { useEffect, useRef, useState } from "react";

const FRAME_COUNT = 160;

const stages = [
  {
    letter: "A",
    name: "Analyze",
    descriptor: "Know the person beneath the performance.",
    promise: "By the end, I will know…",
    quote:
      "If you're taught you can't do anything, you won't do anything. I was taught I can do everything.",
    attribution: "Kanye West",
    modules: ["Know Your Type", "Know Your Energy", "Know Your Story"],
    deliverable: "Your self-discovery profile",
  },
  {
    letter: "B",
    name: "Brand",
    descriptor: "Define the image, presence, and story the world sees.",
    promise: "By the end, I will have…",
    quote: "Fashion is a form of self-expression.",
    attribution: "Virgil Abloh",
    modules: ["Define Your Image", "The Image Plan", "Your Brand Statement"],
    deliverable: "Your personal image plan",
  },
  {
    letter: "L",
    name: "Leverage",
    descriptor: "Map your relationships, assets, and access.",
    promise: "By the end, I will understand…",
    quote: "We tend to network up when we really should be networking across.",
    attribution: "Issa Rae",
    modules: ["Map Your Network", "The Revenue Path", "Ecosystem & Referrals"],
    deliverable: "Your monetization roadmap",
  },
  {
    letter: "E",
    name: "Embark",
    descriptor: "Reverse-engineer the vision and move.",
    promise: "By the end, I am ready to…",
    quote: "Goals without action aren't goals. They're just dreams.",
    attribution: "Kobe Bryant",
    modules: [
      "Your Launch Moment",
      "Your First 90 Days",
      "Your Accountability Structure",
    ],
    deliverable: "Your 90-day blueprint",
  },
];

const faqs = [
  {
    q: "What is the ABLE Program?",
    a: "ABLE is a four-stage personal evolution system built to align who you are, how you show up, what you can leverage, and where you go next. You move through Analyze, Brand, Leverage, and Embark in order.",
  },
  {
    q: "Is the program self-paced or live?",
    a: "The twelve core modules are self-paced and combine concise video lessons, written reflection prompts, and downloadable workbooks. Premium and VIP access add human review and coaching support.",
  },
  {
    q: "What do I receive at the end?",
    a: "You leave with a Personalized Identity Profile: your personality snapshot, energy profile, style archetype, color palette, brand statement, network map, monetization roadmap, and 90-day blueprint assembled in one strategic document.",
  },
  {
    q: "Do I need to buy Able1Self clothing?",
    a: "No. The program and the fashion house are connected by the same philosophy, but they are separate purchases. The clothing is an expression of the work—not a requirement for doing it.",
  },
  {
    q: "How does the community work?",
    a: "Every enrolled member enters The Room, a private member board for sharing wins, asking for feedback, and staying in motion. You can also message other members and connect with an accountability partner.",
  },
  {
    q: "What happens after I finish?",
    a: "Your profile becomes a living blueprint. VIP members receive lifetime updates and first access to Able Society, while every graduate leaves with a concrete execution plan and an accountability structure for the next chapter.",
  },
];

function ArrowIcon() {
  return (
    <span aria-hidden="true" className="arrow-icon">
      ↗
    </span>
  );
}

function Wordmark() {
  return (
    <a className="wordmark" href="#top" aria-label="Able1Self home">
      ABLE<span>1</span>SELF
    </a>
  );
}

function ScrubHero() {
  const sectionRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imagesRef = useRef<HTMLImageElement[]>([]);
  const frameRef = useRef(0);
  const progressRef = useRef<HTMLDivElement>(null);
  const [activeChapter, setActiveChapter] = useState(0);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const section = sectionRef.current;
    const canvas = canvasRef.current;
    if (!section || !canvas) return;

    const context = canvas.getContext("2d", { alpha: false });
    if (!context) return;

    let raf = 0;
    let disposed = false;
    let loaded = 0;

    const draw = (image: HTMLImageElement) => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const width = window.innerWidth;
      const height = window.innerHeight;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      context.setTransform(dpr, 0, 0, dpr, 0, 0);

      const scale = Math.max(width / image.naturalWidth, height / image.naturalHeight);
      const drawWidth = image.naturalWidth * scale;
      const drawHeight = image.naturalHeight * scale;
      context.drawImage(
        image,
        (width - drawWidth) / 2,
        (height - drawHeight) / 2,
        drawWidth,
        drawHeight,
      );
    };

    const drawCurrent = () => {
      const image = imagesRef.current[frameRef.current];
      if (image?.complete && image.naturalWidth) draw(image);
    };

    const renderFromScroll = () => {
      raf = 0;
      const rect = section.getBoundingClientRect();
      const distance = Math.max(section.offsetHeight - window.innerHeight, 1);
      const progress = Math.min(Math.max(-rect.top / distance, 0), 1);
      const nextFrame = Math.min(
        FRAME_COUNT - 1,
        Math.floor(progress * (FRAME_COUNT - 1)),
      );

      if (nextFrame !== frameRef.current) {
        frameRef.current = nextFrame;
        drawCurrent();
      }

      if (progressRef.current) {
        progressRef.current.style.transform = `scaleY(${Math.max(progress, 0.015)})`;
      }

      const chapter = Math.min(3, Math.floor(progress * 4.02));
      setActiveChapter((current) => (current === chapter ? current : chapter));
    };

    const onScroll = () => {
      if (!raf) raf = window.requestAnimationFrame(renderFromScroll);
    };

    const first = new Image();
    first.src = "/frames/hero_001.webp";
    first.onload = () => {
      if (disposed) return;
      imagesRef.current[0] = first;
      draw(first);
      setReady(true);
    };

    const preload = () => {
      for (let index = 1; index < FRAME_COUNT; index += 1) {
        const image = new Image();
        image.decoding = "async";
        image.src = `/frames/hero_${String(index + 1).padStart(3, "0")}.webp`;
        image.onload = () => {
          loaded += 1;
          imagesRef.current[index] = image;
          if (index === frameRef.current) draw(image);
        };
        if (loaded > 20) image.fetchPriority = "low";
      }
    };

    const idle = window.setTimeout(preload, 120);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", drawCurrent);
    renderFromScroll();

    return () => {
      disposed = true;
      window.clearTimeout(idle);
      window.cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", drawCurrent);
    };
  }, []);

  return (
    <section className="scrub-hero" id="top" ref={sectionRef}>
      <div className="scrub-sticky">
        <canvas ref={canvasRef} aria-hidden="true" />
        <div className="hero-vignette" />
        <div className="film-grain" />

        <div className={`hero-loader ${ready ? "is-ready" : ""}`}>
          <span />
          <p>Tailoring the experience</p>
        </div>

        <div className="hero-frame">
          <div className="hero-kicker">The ABLE Program / Chapter 01</div>
          <div className="hero-copy">
            <p className="eyebrow">The uniform of personal evolution</p>
            <h1>
              Discover who you are.
              <em>Then dress the part.</em>
            </h1>
            <p className="hero-intro">
              Four stages to close the gap between the life you perform and the
              person you actually are.
            </p>
            <div className="hero-actions">
              <a className="button button-gold" href="#access">
                Start your ABLE journey <ArrowIcon />
              </a>
              <a className="text-link" href="#story">
                Watch the story <span aria-hidden="true">↓</span>
              </a>
            </div>
          </div>
        </div>

        <div className="scrub-meter" aria-hidden="true">
          <div className="meter-line">
            <div className="meter-progress" ref={progressRef} />
          </div>
          <div className="meter-stages">
            {stages.map((stage, index) => (
              <span
                className={index === activeChapter ? "is-active" : ""}
                key={stage.letter}
              >
                {stage.letter}
              </span>
            ))}
          </div>
        </div>

        <div className="scroll-cue" aria-hidden="true">
          <span>Scroll to become</span>
          <i />
        </div>
      </div>
    </section>
  );
}

function IdentityProfile() {
  return (
    <div className="identity-card reveal">
      <div className="identity-top">
        <div className="identity-monogram">A1</div>
        <div>
          <span>Personalized Identity Profile</span>
          <p>PRIVATE / MEMBER 0047</p>
        </div>
        <div className="profile-status">82% complete</div>
      </div>
      <div className="identity-body">
        <div className="identity-photo">
          <img
            src="/images/identity.jpg"
            alt="Able1Self member wearing a black leather jacket"
          />
          <span>Style archetype / The Architect</span>
        </div>
        <div className="identity-data">
          <div>
            <span>Analyze</span>
            <strong>Strategist / Builder</strong>
          </div>
          <div>
            <span>Brand</span>
            <strong>Quiet authority</strong>
          </div>
          <div>
            <span>Leverage</span>
            <strong>Culture × Systems</strong>
          </div>
          <div className="profile-palette" aria-label="Profile color palette">
            <span />
            <span />
            <span />
            <span />
          </div>
        </div>
      </div>
      <div className="identity-footer">
        <span>Next: build your 90-day blueprint</span>
        <button type="button">Continue →</button>
      </div>
    </div>
  );
}

function CommunityPreview() {
  return (
    <div className="room-ui reveal" aria-label="Preview of The Room community">
      <div className="room-topbar">
        <strong>THE ROOM</strong>
        <span>24 members online</span>
      </div>
      <article className="room-post room-post-main">
        <div className="avatar">SD</div>
        <div>
          <div className="post-meta">
            <strong>Shawn Daniels</strong>
            <span className="stage-chip">A</span>
            <time>8:42 AM</time>
          </div>
          <p>
            Welcome to The Room. Start with this: what are you ready to stop
            performing?
          </p>
          <div className="post-actions">
            <span>♡ 18</span>
            <span>12 responses</span>
          </div>
        </div>
      </article>
      <article className="room-post room-post-offset">
        <div className="avatar avatar-bone">KM</div>
        <div>
          <div className="post-meta">
            <strong>Kiara M.</strong>
            <span className="stage-chip">B</span>
          </div>
          <p>Just finished my Image Plan. The mirror finally makes sense.</p>
        </div>
      </article>
      <div className="partner-card">
        <span>Accountability match</span>
        <div>
          <div className="avatar">JC</div>
          <p>
            <strong>Jordan C.</strong>
            <small>Leverage / 67% complete</small>
          </p>
          <button type="button">Message</button>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const revealItems = Array.from(
      document.querySelectorAll<HTMLElement>(".reveal"),
    );
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.12 },
    );

    revealItems.forEach((item) => observer.observe(item));
    return () => observer.disconnect();
  }, []);

  return (
    <main>
      <header className="site-header">
        <Wordmark />
        <nav className={menuOpen ? "is-open" : ""} aria-label="Primary">
          <a href="#framework" onClick={() => setMenuOpen(false)}>
            Framework
          </a>
          <a href="#story" onClick={() => setMenuOpen(false)}>
            Founder
          </a>
          <a href="#program" onClick={() => setMenuOpen(false)}>
            Program
          </a>
          <a href="#access" onClick={() => setMenuOpen(false)}>
            Access
          </a>
          <a href="#faq" onClick={() => setMenuOpen(false)}>
            FAQ
          </a>
        </nav>
        <a className="header-cta" href="#access">
          Enter the program
        </a>
        <button
          className={`menu-toggle ${menuOpen ? "is-open" : ""}`}
          type="button"
          aria-label="Toggle navigation"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((value) => !value)}
        >
          <span />
          <span />
        </button>
      </header>

      <ScrubHero />

      <section className="problem section-bone" id="philosophy">
        <div className="section-index reveal">01 / The gap</div>
        <div className="problem-grid">
          <div className="problem-statement reveal">
            <p className="eyebrow dark">The problem isn&apos;t ambition</p>
            <h2>
              Most people are dressed for a life they{" "}
              <em>never actually chose.</em>
            </h2>
          </div>
          <div className="problem-body reveal">
            <p>
              You climbed the ladder someone else built. You said yes to the
              version of success that looked right from the outside.
            </p>
            <p>
              Somewhere in there, the mirror stopped matching the person you
              actually are. Able1Self exists to close that gap—permanently.
            </p>
            <a className="text-link dark-link" href="#framework">
              Meet the framework <ArrowIcon />
            </a>
          </div>
        </div>
        <div className="stat-rail">
          <div className="reveal">
            <strong>04</strong>
            <span>stages</span>
          </div>
          <div className="reveal">
            <strong>12</strong>
            <span>modules</span>
          </div>
          <div className="reveal">
            <strong>01</strong>
            <span>aligned self</span>
          </div>
          <div className="reveal">
            <strong>90</strong>
            <span>days to move</span>
          </div>
        </div>
      </section>

      <section className="framework section-ink" id="framework">
        <div className="framework-heading">
          <div className="section-index light reveal">02 / The framework</div>
          <div className="reveal">
            <p className="eyebrow">Four stages. In order.</p>
            <h2>
              One framework.
              <br />
              Four stages. <em>One self.</em>
            </h2>
          </div>
          <p className="framework-intro reveal">
            ABLE is not a personality test or a mood board. It is the sequence
            Shawn Daniels used on himself—and on the people he coached for a
            decade—to move from performing a life to owning one.
          </p>
        </div>

        <div className="stage-list">
          {stages.map((stage, index) => (
            <article className="stage-row reveal" key={stage.letter}>
              <div className="stage-number">0{index + 1}</div>
              <div className="stage-letter">{stage.letter}</div>
              <div className="stage-copy">
                <h3>{stage.name}</h3>
                <p>{stage.descriptor}</p>
                <blockquote>
                  “{stage.quote}”
                  <cite>— {stage.attribution}</cite>
                </blockquote>
              </div>
              <div className="stage-outcome">
                <span>{stage.promise}</span>
                <small>{stage.deliverable}</small>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="story" id="story">
        <div className="story-image reveal">
          <img src="/images/founder.jpg" alt="Shawn Daniels in black tailoring" />
          <div className="image-caption">
            <span>Shawn Daniels</span>
            <span>Founder / Designer / Guide</span>
          </div>
        </div>
        <div className="story-copy">
          <div className="section-index reveal">03 / The founder</div>
          <p className="eyebrow dark reveal">From corporate to couture</p>
          <h2 className="reveal">
            He didn&apos;t chase fashion.
            <em>Fashion found him.</em>
          </h2>
          <div className="story-text reveal">
            <p>
              Shawn Daniels spent his career helping people find clarity before
              he found his own. He built a framework that got people promoted—
              then got let go himself.
            </p>
            <p>
              So he did what he had taught everyone else to do: he turned the
              framework on his own life. What emerged was not a five-year plan.
              It was a gift he had been sitting on the entire time.
            </p>
            <p>
              Able1Self is what happens when self-awareness becomes a wardrobe.
            </p>
          </div>
          <a className="button button-ink reveal" href="#program">
            Go through what changed everything <ArrowIcon />
          </a>
        </div>
      </section>

      <section className="profile section-bone" id="profile">
        <div className="profile-copy">
          <div className="section-index reveal">04 / The result</div>
          <p className="eyebrow dark reveal">Not a certificate. A blueprint.</p>
          <h2 className="reveal">
            Your Personalized
            <em>Identity Profile.</em>
          </h2>
          <p className="reveal">
            Every answer becomes signal. As you move through ABLE, a strategic
            document assembles around your own data—personality, energy, image,
            network, revenue path, and next move.
          </p>
          <ul className="profile-list reveal">
            <li>Personality snapshot + energy profile</li>
            <li>Style archetype + personal color palette</li>
            <li>Brand statement + network map</li>
            <li>Monetization roadmap + 90-day blueprint</li>
          </ul>
        </div>
        <IdentityProfile />
      </section>

      <section className="program section-ink" id="program">
        <div className="program-head">
          <div className="section-index light reveal">05 / The program</div>
          <div>
            <p className="eyebrow reveal">Self-paced. Sequential. Personal.</p>
            <h2 className="reveal">
              Twelve modules.
              <br />
              Four stages. <em>One outcome.</em>
            </h2>
          </div>
          <p className="reveal">
            Each stage unlocks the next. Every module combines a focused lesson,
            reflection prompts, and a workbook that moves your profile from
            insight to action.
          </p>
        </div>

        <div className="module-grid">
          {stages.map((stage) => (
            <article className="module-card reveal" key={stage.letter}>
              <div className="module-card-head">
                <span>{stage.letter}</span>
                <div>
                  <small>Stage {stage.letter}</small>
                  <h3>{stage.name}</h3>
                </div>
              </div>
              <ol>
                {stage.modules.map((module, index) => (
                  <li key={module}>
                    <span>
                      {stage.letter}
                      {index + 1}
                    </span>
                    {module}
                  </li>
                ))}
              </ol>
              <div className="module-result">
                <small>Walk away with</small>
                <strong>{stage.deliverable}</strong>
              </div>
            </article>
          ))}
        </div>

        <div className="program-includes reveal">
          {[
            "12 guided modules",
            "Private member community",
            "Accountability partner",
            "Smart progress nudges",
            "Downloadable workbooks",
            "Personalized Identity Profile",
          ].map((item) => (
            <span key={item}>+ {item}</span>
          ))}
        </div>
      </section>

      <section className="room section-bone" id="community">
        <div className="room-copy">
          <div className="section-index reveal">06 / The room</div>
          <p className="eyebrow dark reveal">Evolution needs witnesses</p>
          <h2 className="reveal">
            You don&apos;t
            <em>evolve alone.</em>
          </h2>
          <p className="reveal">
            Enrolling puts you in the room with everyone else doing the work—a
            private member board where you share wins, ask for feedback on your
            Image Plan, and connect with the person who keeps you moving.
          </p>
          <div className="room-features reveal">
            <span>01 / Community board</span>
            <span>02 / Direct messages</span>
            <span>03 / Accountability matching</span>
          </div>
        </div>
        <CommunityPreview />
      </section>

      <section className="access section-ink" id="access">
        <div className="access-head">
          <div className="section-index light reveal">07 / Access</div>
          <div>
            <p className="eyebrow reveal">Founding member access</p>
            <h2 className="reveal">
              Choose your level
              <em>of support.</em>
            </h2>
          </div>
          <div className="founder-note reveal">
            <span>First 50</span>
            <p>Founding members receive early enrollment access.</p>
          </div>
        </div>

        <div className="pricing-grid">
          <article className="price-card reveal">
            <div className="price-top">
              <span>01</span>
              <h3>Starter</h3>
              <p>For the self-directed builder.</p>
            </div>
            <div className="price">
              <small>$</small>297
            </div>
            <ul>
              <li>Complete 12-module program</li>
              <li>AI-generated Identity Profile</li>
              <li>Accountability partner matching</li>
              <li>Community + messaging access</li>
              <li>Email support</li>
            </ul>
            <a className="button button-outline" href="#">
              Choose Starter <ArrowIcon />
            </a>
          </article>

          <article className="price-card featured reveal">
            <div className="recommended">Recommended</div>
            <div className="price-top">
              <span>02</span>
              <h3>Premium</h3>
              <p>For insight with a human eye.</p>
            </div>
            <div className="price">
              <small>$</small>597
            </div>
            <ul>
              <li>Everything in Starter</li>
              <li>Human-reviewed Identity Profile</li>
              <li>One coaching touchpoint with Shawn</li>
              <li>Priority support</li>
              <li>Profile refinement guidance</li>
            </ul>
            <a className="button button-gold" href="#">
              Choose Premium <ArrowIcon />
            </a>
          </article>

          <article className="price-card reveal">
            <div className="price-top">
              <span>03</span>
              <h3>VIP</h3>
              <p>For a fully guided transformation.</p>
            </div>
            <div className="price">
              <small>$</small>997
            </div>
            <ul>
              <li>Everything in Premium</li>
              <li>Fully custom profile review</li>
              <li>Extended coaching access</li>
              <li>Lifetime profile updates</li>
              <li>First access to Able Society</li>
            </ul>
            <a className="button button-outline" href="#">
              Choose VIP <ArrowIcon />
            </a>
          </article>
        </div>
        <p className="payment-note reveal">
          One-time payment or three installments. Program enrollment is separate
          from Able1Self garments.
        </p>
      </section>

      <section className="faq section-bone" id="faq">
        <div className="faq-head">
          <div className="section-index reveal">08 / Questions</div>
          <p className="eyebrow dark reveal">Before you begin</p>
          <h2 className="reveal">
            Clarity,
            <em>before commitment.</em>
          </h2>
        </div>
        <div className="faq-list">
          {faqs.map((faq, index) => (
            <details className="reveal" key={faq.q}>
              <summary>
                <span>0{index + 1}</span>
                {faq.q}
                <i aria-hidden="true">+</i>
              </summary>
              <p>{faq.a}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="finale">
        <div className="finale-media" aria-hidden="true">
          <img src="/images/fabric-macro.webp" alt="" />
        </div>
        <div className="film-grain" />
        <div className="finale-content">
          <p className="eyebrow reveal">The only luxury is evolution</p>
          <h2 className="reveal">
            Become
            <em>one self.</em>
          </h2>
          <p className="reveal">
            Stop performing someone else&apos;s version of success. The next
            chapter begins with the truth.
          </p>
          <a className="button button-gold reveal" href="#access">
            Start your ABLE journey <ArrowIcon />
          </a>
        </div>
      </section>

      <footer>
        <div className="footer-top">
          <Wordmark />
          <p>The uniform of personal evolution.</p>
          <a href="#top">Return to top ↑</a>
        </div>
        <div className="footer-grid">
          <div>
            <span>Program</span>
            <a href="#framework">The ABLE Framework</a>
            <a href="#program">Curriculum</a>
            <a href="#access">Pricing</a>
            <a href="#faq">FAQ</a>
          </div>
          <div>
            <span>World</span>
            <a href="#">Bespoke consultation</a>
            <a href="#">Explore A19</a>
            <a href="#">A1 Forever</a>
            <a href="#">A1 Members Only</a>
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
          <span>Designed for becoming.</span>
        </div>
      </footer>
    </main>
  );
}
