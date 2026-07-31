# Able1Self production account setup

Able1Self is intentionally split into two services:

- **Supabase Auth** handles real member registration, email confirmation, login, and password recovery.
- **Cloudflare D1** stores each member's answers, profile, identity result, plan, messages, settings, and progress. This part is already built.

You do not need to recreate the portal tables in Supabase to launch. Keeping the existing D1 data layer avoids an unnecessary database migration while giving members real Supabase accounts.

## 1. Create the production project

1. In Supabase, choose **New project**.
2. Name it `able1self-production` so it is not confused with the three generic projects already in the organization.
3. Choose the region closest to most members.
4. Generate and securely save the database password.
5. Wait for project provisioning to finish.

## 2. Configure email accounts

1. Open **Authentication → Sign In / Providers → Email**.
2. Keep **Email + password** enabled.
3. Keep **Confirm email** enabled for public signups.
4. In the general authentication settings, keep **Allow new users to sign up** enabled.
5. Under password security, require at least 8 characters. Stronger requirements are recommended for production.

The local pilot accounts can use `vanta` for testing as requested. Do not use that password for production accounts: it is short, shared, and below the recommended minimum.

## 3. Add the allowed URLs

Open **Authentication → URL Configuration**.

Set **Site URL** to the final site origin, for example:

```text
https://able1self.com
```

Add these **Redirect URLs** using the same production origin:

```text
https://able1self.com/auth/complete
https://able1self.com/reset-password
```

Keep these while testing locally:

```text
http://localhost:3000/auth/complete
http://localhost:3000/reset-password
```

## 4. Configure production email delivery

Open **Authentication → SMTP Settings** and connect a transactional email provider such as Resend, Postmark, SendGrid, or Amazon SES.

1. Verify the Able1Self sending domain with the provider.
2. Add the provider's SPF and DKIM DNS records.
3. Add a DMARC record for the domain.
4. Enter the SMTP host, port, username, password, sender email, and sender name in Supabase.
5. Customize the confirmation and password-recovery templates under **Authentication → Email Templates**.
6. Send a real confirmation and password-reset test before launch.

Supabase's default email service is for limited testing only and cannot reliably deliver production member email.

## 5. Copy the two connection values

Use the project's **Connect** dialog or **Settings → API Keys**.

Copy:

```text
SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
SUPABASE_PUBLISHABLE_KEY=sb_publishable_YOUR_KEY
```

Use the publishable key. Do **not** place a secret key or legacy `service_role` key in the website configuration.

## 6. Add deployment variables

In the Able1Self hosting environment, add:

```text
SUPABASE_URL
SUPABASE_PUBLISHABLE_KEY
AUTH_SESSION_SECRET
```

`AUTH_SESSION_SECRET` must be a new random value at least 32 characters long. It should not be the local development value.

The deployment must also retain the existing `DB` D1 binding. That database is what stores portal progress.

Do not add `PREVIEW_ACCOUNTS_JSON`, `DEMO_LOGIN_EMAIL`, or `DEMO_LOGIN_PASSWORD` to production. When Supabase is configured, the site automatically uses Supabase instead of pilot credentials.

## 7. Create the initial real members

After SMTP is working, the cleanest flow is to have each person use **Create account** on the Able1Self login screen. They will receive a confirmation email and begin with a private empty profile.

For a manually provisioned account, open **Authentication → Users → Add user**, create the user with a unique temporary password, and require them to reset it. Create:

- `shawndaniels2015@gmail.com`
- `19keys@19keys.com`

The local versions of both accounts already work with `vanta`. Use unique production passwords rather than copying the local testing password.

## 8. Launch test

Before opening enrollment, verify all of the following on the deployed domain:

1. Create a brand-new account.
2. Receive and complete email confirmation.
3. Sign in and begin A1.
4. Answer one question, sign out, sign back in, and confirm the answer remains.
5. Request a password reset and set a new password.
6. Confirm one member cannot see another member's profile or progress.
7. Confirm the incomplete-profile reminder opens the correct next question.

## Official Supabase references

- Password authentication: https://supabase.com/docs/guides/auth/passwords
- Authentication configuration: https://supabase.com/docs/guides/auth/general-configuration
- Redirect URLs: https://supabase.com/docs/guides/auth/redirect-urls
- Production SMTP: https://supabase.com/docs/guides/auth/auth-smtp
- API keys: https://supabase.com/docs/guides/getting-started/api-keys
- Password security: https://supabase.com/docs/guides/auth/password-security

