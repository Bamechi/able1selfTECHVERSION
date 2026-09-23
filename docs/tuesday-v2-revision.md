# Tuesday V2 Revision

## Implemented
- Summary-first member profile: visible core identity, personality, astrology/numerology, the five self-reflections, brand statement/voice, business and digital assets, leverage overview, goal and timeline. Detailed questions are collapsed and excluded from printing.
- A standalone `/member/report` print view with page-safe margins, branded sections, controlled typography, and no dashboard chrome.
- Profile photo upload, replace, and remove in Settings. Photos are normalized in the browser, validated on the server, stored in the existing private bucket, and served only to the authenticated owner.
- Removed persistent topbar continuation and reminder banner; kept the normal Home/Program workflow. Removed the retake block from Settings.
- A 2.8-second opening sequence, transition into the portal, animated view/question changes, dimensional hover states, restrained glass navigation and surfaces, and reduced-motion support.
- Actual synthetic-account screenshots for the profile and messaging feature displays, with desktop window framing and generous gallery spacing.
- Larger community biography and richer messaging/composer treatment.
- AI context now includes derived signs, numerology meaning, personality summary, brand, goals, and history. No live model is configured: an owner-provided OPENAI_API_KEY is still required. No preset response is presented as live AI.
- Public signup remains invite/payment controlled. `amechi@addcolormedia.com` and `shawndaniels2015@gmail.com` are treated as comped tester accounts so the app can be tested before paid membership is enabled.
- Password reset now uses one-hour reset tokens and a backend email provider key (`RESEND_API_KEY`). The OpenAI key and email key must live in Sites environment variables, never in GitHub or browser code.

## Home / Program Decision
Kept separate as requested. Combining them later is reasonable: Program can lead with overall progress and next action, then show the four stages, profile, and target plan below. That would eliminate the duplicate overview without changing questionnaire routing.

## Deployment Architecture
The existing Vercel project is `able1self-techversion`; its related GitHub source is `Bamechi/able1selfTECHVERSION`. The older private `Bamechi/Able1self` repository is a separate static prototype and is not modified.

Vercel serves the existing application through an external rewrite, replacing the previous redirect. Cloudflare/Sites continues to run the application, authentication, D1 data, and R2 files. This is a Vercel public entry point, not a migration of the database to Vercel. Deploy backend revisions through Sites first, then deploy the matching GitHub/Vercel source. No member data or secret values belong in GitHub.

Migration 0008 adds only member-avatar metadata. Previous source baseline: `54b291df7b9ccbcd2e1d6bdb1fda5b511309c89a` (Sites version 15). Code rollback does not roll back member data.
