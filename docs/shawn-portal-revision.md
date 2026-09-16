# ABLE portal revision - September 15, 2026

## Recovery point

Before these changes: hosted version 13, source commit `a76f3f91d57ecd73ff59e033cc267bc25396d9ed`. The repository has a GitHub remote at `Bamechi/able1selfTECHVERSION`. Existing program responses and fashion records are retained. No database migration or data deletion is part of this revision.

## Member experience

- Member login, /member, profile, settings, program, plan, messages, community, and AI Guide remain.
- Analyze starts with existing business/brand versus starting something new; the following prompt adapts. Both continue through ABLE.
- Personality is an in-app, original 16-type reflection: 48 balanced-direction statements plus four preference questions used for ties. Thirteen short pages, five-point responses, saved between pages, deterministic result and percentage splits. It is explicitly not the proprietary MBTI or 16Personalities instrument. Existing hand-entered types remain in historical data.
- Analyze includes birth chart, working rhythm, strengths, and five self-discovery prompts.
- Brand asks directly for LLC/entity, EIN, trademark registration, insurance, bank account, contracts, permits, and bookkeeping; digital assets and support priorities use checkboxes. These are inventories, not a legal compliance determination.
- The full Brand Ledger remains an optional detailed review. The normal flow reviews the member's checklist and moves on.
- Leverage includes trusted contacts, introductions, discovery channels, personally solved problem, solution, audience, offer, evidence, pricing/delivery cost, relatable story, concise profile statement, CTA, referrals, and repeat cadence.
- Embark retains launch, 90-day milestones, habits and accountability; adds the first dated action, useful partnerships/environment, and a named accountability partner.
- My profile displays the actual saved responses by A/B/L/E, personality result, chart, positioning and action plan, with print/save-PDF formatting.
- Quiet light surfaces, restrained blue interaction color, system typography, smaller headings, flat sections, real checkboxes, concise copy, and reduced-motion support.
- A brief first-visit logo reveal replaces the long ornamental introduction. Existing public site content and imagery stay.

## Separate A1 fashion site: source of truth

Only the Members Only fashion dashboard and its fashion Admin Console entry are removed from ABLE navigation. The actual member login is unchanged.

Preserve for the separate site: client selector; membership overview; next working session with Shawn; measurement profile with units and completion; custom sizing; design/canvas/vision board assets and notes; orders with planning/design/production/fitting/delivery stages; approvals; delivery schedule; client profile/settings; admin client management, orders, meetings and review tools; upload ownership and protected assets.

Existing implementation is preserved in Git at the recovery commit above, `app/member/page.tsx` (`ClientPortal` and related types), `lib/client-portal-store.ts`, `app/api/client-portal/**`, database schema/migrations, and the MEMBER_UPLOADS storage binding. Current records and protected APIs remain intact. Do not link to a new fashion destination until its real URL is configured. Building and migrating that separate site is future work.
