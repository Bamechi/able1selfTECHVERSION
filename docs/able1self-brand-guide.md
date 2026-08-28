# Able1Self Website Brand Guide

## Brand Position

Able1Self is a premium self-development operating system. The website should feel precise, private, intelligent, and quietly luxurious: less motivational seminar, more high-end personal command center.

The brand promise is:

> Know yourself. Build what comes next.

Everything on the site should reinforce four ideas:

- Self-knowledge before action.
- Clarity over noise.
- Professional identity as something designed.
- Progress as a tracked, accountable system.

## Visual Personality

Use a restrained, cinematic, high-contrast look. The interface should feel like a private members portal, an executive profile dashboard, and a luxury atelier system living inside one brand.

Preferred qualities:

- Dark, focused, minimal.
- Premium but not flashy.
- Structured, modular, and grid-based.
- Human enough to include real portraiture.
- Data-aware without feeling corporate-generic.

Avoid:

- Bright startup gradients.
- Oversized decorative blobs or generic abstract art.
- Stock wellness imagery.
- Tiny text.
- Overly playful colors.
- Busy card stacks with no hierarchy.

## Logo Usage

The primary mark is the Able1Self triangular A symbol. Use it as a quiet authority mark, not as oversized decoration unless it is part of a deliberate lockup or loading state.

Logo treatments:

- White logo on black for public and member dark surfaces.
- Black logo on light paper surfaces.
- Lime or gold accent only when the mark is being used as a system signal or premium badge.
- Keep clear space equal to at least half the logo height.

Do not:

- Place the logo over visually noisy images without a dark overlay.
- Stretch or crop the mark.
- Use the logo as a replacement for real founder/client photography where a person should be shown.

## Color System

### Core Public Site Palette

Use this palette for the homepage, marketing sections, assessment flow, and core ABLE framework pages.

| Token | Hex | Use |
| --- | --- | --- |
| Ink | `#07100e` | Main dark background, hero sections |
| Ink Raised | `#0d1916` | Elevated dark cards, progress ring interiors |
| Ink Soft | `#14241f` | Dark secondary panels |
| Paper | `#f2f5f1` | Light page sections |
| White | `#ffffff` | Primary text on dark |
| Gray | `#65716c` | Secondary body text on light |
| Line | `#d6ded9` | Light dividers and borders |
| Line Dark | `rgba(255, 255, 255, 0.13)` | Dark dividers and borders |
| Lime | `#c4ff4a` | Primary CTA, active indicators, progress |
| Mint | `#69ecc1` | Secondary accent, scan lines, highlighted words |

### Member Portal Palette

Use this palette for the member-only dashboard, admin workspace, measurements, order/profile-inspired screens, and concierge experiences.

| Token | Hex | Use |
| --- | --- | --- |
| Portal Black | `#060607` | Portal background |
| Portal Panel | `#101011` | Modal shells and dark cards |
| Charcoal | `#111112` | Buttons, strong dark surfaces |
| Soft White | `#f5f5f2` | Light workspace panels |
| Cloud White | `#ffffff` | Inputs and primary light cards |
| Stone Line | `#cececc` | Light panel borders |
| Muted Gray | `#77777a` | Utility labels and metadata |
| Deep Gold | `#b89942` | Premium membership accents |
| Pale Gold | `#d9c27a` | Badges, icons, subtle highlights |
| On Track Green | `#2d9657` | Positive plan status |
| Off Track Red | `#c94e4e` | Negative plan status |

Use green and red only for accountability state. Do not use them decoratively.

## Typography

### Primary Typeface

Use Manrope across the website.

CSS stack:

```css
font-family: "Manrope", "Helvetica Neue", sans-serif;
```

Manrope gives the site its clean, premium, interface-forward voice. It should be used for headings, body copy, buttons, forms, dashboard data, and member portal UI.

### Utility Typeface

Use a system monospace stack for labels, counters, eyebrow text, sequence IDs, timestamps, and tiny operational metadata.

CSS stack:

```css
font-family: "SFMono-Regular", "Roboto Mono", "IBM Plex Mono", monospace;
```

Use monospace sparingly. It should feel like instrumentation: stage numbers, module IDs, status labels, profile percentages, timestamps, and audit-style metadata.

### Type Rules

- Body text minimum: `16px`.
- Member portal body: `16px-17px`.
- Buttons: `14px-15px`.
- Utility labels: `12px-13px`, uppercase, generous tracking.
- Large public headings: `72px-150px` on desktop when space allows.
- Modal/assessment headings: `36px-56px`.
- Portal headings: `28px-72px`, depending on panel size.
- Avoid text under `12px` except purely decorative metadata.

Large display headings may use tight line-height around `0.98`. Body copy should sit between `1.55` and `1.7`.

## Layout Principles

The site should feel like a system of panels and stages.

Core layout moves:

- Full-width dark bands for public storytelling sections.
- Split hero layouts with strong contrast and real imagery.
- Grid-based dashboards with clear numeric/profile signals.
- Thin borders, precise dividers, and stable spacing.
- Subtle glass effects on dark panels.
- Large negative space around important statements.

Spacing should feel intentional:

- Page section padding: `90px-160px` desktop.
- Portal panel padding: `24px-40px`.
- Card gaps: `12px-24px`.
- Form fields: minimum `48px-52px` tall.
- Border radius: usually `5px-8px` for tools and cards.
- Larger cinematic containers may go up to `16px-28px` when they act as hero/device shells.

## Imagery

Use real people and real outputs whenever possible.

Founder imagery:

- Shawn Daniels should appear as a real portrait, not only the logo.
- Founder portraits on the homepage should be black and white.
- Apply grayscale, slightly increased contrast, and a slight brightness reduction.
- Keep portrait crops respectful and premium, with the face and posture clearly visible.

Recommended CSS treatment:

```css
filter: grayscale(1) contrast(1.08) brightness(0.88);
object-fit: cover;
```

Member/concierge imagery:

- Use polished garment, profile, and visual direction assets.
- Keep product images large enough to inspect.
- Dark or white gallery backgrounds are both acceptable depending on content.
- Canva references should inspire structure, not be copied literally.

Avoid:

- Placeholder logos where a person/photo is requested.
- Blurry atmospheric stock images.
- Decorative AI-looking abstractions with no product/profile relevance.

## UI Components

### Buttons

Primary public CTA:

- Lime background `#c4ff4a`.
- Dark text `#07100e`.
- Minimum height `50px`.
- Slightly rounded, usually `10px-11px`.
- Use an arrow icon or directional symbol for forward motion.

Secondary dark CTA:

- Transparent or low-opacity white background.
- White text.
- Thin white border.

Portal/admin CTA:

- Charcoal background `#111112`.
- White text.
- Radius `5px-6px`.
- Minimum height `48px-52px`.

### Cards And Panels

Use cards for actual repeated units or tools:

- profile cards
- module cards
- plan commitments
- measurement forms
- asset galleries
- admin records

Do not stack cards inside decorative cards unless the parent is a functional app shell.

Public cards on dark:

- Background: `rgba(255, 255, 255, 0.035-0.08)`.
- Border: `rgba(255, 255, 255, 0.14-0.22)`.
- Optional blur for glassy surfaces.

Portal cards on light:

- Background: `rgba(255, 255, 255, 0.55-0.62)` or `#ffffff`.
- Border: `#cececc`.
- Text: `#111112`.

### Forms

Forms should be highly legible and easy to complete.

- Inputs: minimum `48px-52px` high.
- Font size: `16px`.
- Labels: uppercase monospace, `12px-13px`.
- Borders: `#d7d7d7` or `#c8c8c4`.
- Radius: `5px-6px`.
- Use one-column layouts on mobile.

Measurement forms should live in the member profile, accessible by clicking/editing profile measurements. Measurements are not a standalone public journey.

### Progress And Status

Progress should look measured, not gamified.

Use:

- Rings for profile completion.
- Thin bars for stage progress.
- Stage labels for Analyze, Brand, Leverage, Embark.
- On-track/off-track plan states with clear green/red meaning.

Plan health:

- On track: green `#2d9657`.
- Off track: red `#c94e4e`.
- The more on-track check-ins, the greener the aggregate meter.
- The more off-track check-ins, the redder the aggregate meter.
- Each checkpoint should include status and explanation.

## Content Voice

The voice should be calm, direct, premium, and self-aware.

Write like:

- "Know yourself. Build what comes next."
- "Turn self-knowledge into better business decisions."
- "Make your next move from clarity, not pressure."
- "Your operating system."
- "Current stage."
- "Identity profile."

Avoid:

- Generic self-help hype.
- Long motivational paragraphs.
- Tech jargon without emotional meaning.
- Overexplaining how to use the interface inside the interface.

Use short, confident labels and concise supporting copy.

## Public Website Structure

The public site should prioritize:

1. Hero: promise, CTA, and visible product/profile signal.
2. ABLE framework: Analyze, Brand, Leverage, Embark.
3. Profile outcome: what the member receives.
4. Founder section: Shawn's story with real black-and-white photo.
5. Program structure and pricing/enrollment.
6. FAQ.
7. Final CTA.

The public site should sell clarity and transformation through the system, not through a generic landing page feel.

## Member Portal Structure

The member portal should feel like a private branded workspace.

Core sections:

- Dashboard: welcome, progress, next actions, reminders.
- Program: ABLE stages and module progress.
- Profile: identity profile, measurements, preferences, saved answers.
- Plan: 90-day action plan with accountability check-ins.
- Community/messages: private support and accountability.
- Admin: available only to Shawn and Amechi.

The portal should use larger text than a typical SaaS dashboard. Users should never feel like they are squinting to understand their own profile.

## Admin Experience

The admin area should feel operational and private, not public-facing.

It should include:

- Client/member selector.
- Client profile data.
- Measurements and style inputs.
- Uploaded assets.
- Plan status and check-ins.
- Admin audit trail.
- Visibility for Shawn and Amechi accounts.

Use light workspace panels for admin forms so data entry is comfortable.

## Motion And Interaction

Use subtle motion only:

- Soft intro sequence.
- Gentle grid scan.
- Progress transitions.
- Hover lift on important buttons.
- Scroll reveal when it helps pacing.

Avoid heavy animation or anything that makes the site feel like a demo instead of a working system.

## Accessibility And Responsiveness

Baseline rules:

- No body text below `16px`.
- Touch targets should be at least `44px`, preferably `48px+`.
- Forms must fit mobile width without horizontal scrolling.
- Assessment modals must have visible scrolling for long questions/options.
- Text must not overlap on desktop or mobile.
- Contrast should remain high on dark panels.
- Use real buttons for actions and clear focus states.

## Design Checklist

Before publishing a new page or component, confirm:

- It uses Manrope and the Able1Self color tokens.
- It has enough contrast.
- Body text is not tiny.
- It feels structured, premium, and useful.
- Real imagery appears where identity, founder, client, or product output is being discussed.
- CTAs are clear and not over-decorated.
- Mobile layout has no horizontal overflow.
- Member/admin tools feel like a working portal, not a marketing mockup.
- Green/red status colors are reserved for accountability.
- The ABLE framework remains visible somewhere in the experience.
