import { displayNameFromEmail } from "./auth-accounts";
import { getRuntimeEnv } from "./runtime";

type SupabaseUser = {
  email?: string;
  user_metadata?: Record<string, unknown>;
};

type SupabaseAuthResponse = {
  access_token?: string;
  user?: SupabaseUser;
  error?: string;
  error_description?: string;
  msg?: string;
  message?: string;
};

function configuration() {
  const runtime = getRuntimeEnv();
  const url = runtime?.SUPABASE_URL?.replace(/\/$/, "");
  const key =
    runtime?.SUPABASE_PUBLISHABLE_KEY || runtime?.SUPABASE_ANON_KEY;
  return url && key ? { url, key } : null;
}

export function isSupabaseConfigured() {
  return Boolean(configuration());
}

function headers(key: string, accessToken?: string) {
  return {
    apikey: key,
    "content-type": "application/json",
    ...(accessToken ? { authorization: `Bearer ${accessToken}` } : {}),
  };
}

async function readResponse(response: Response) {
  const payload = (await response.json().catch(() => ({}))) as SupabaseAuthResponse;
  if (!response.ok) {
    throw new Error(
      payload.msg ||
        payload.message ||
        payload.error_description ||
        payload.error ||
        "The account service could not complete this request.",
    );
  }
  return payload;
}

function userIdentity(user: SupabaseUser | undefined) {
  const email = user?.email?.trim().toLowerCase();
  if (!email) throw new Error("The account service did not return an email.");
  const metadataName =
    typeof user?.user_metadata?.display_name === "string"
      ? user.user_metadata.display_name.trim()
      : typeof user?.user_metadata?.full_name === "string"
        ? user.user_metadata.full_name.trim()
        : "";
  return {
    email,
    name:
      metadataName ||
      displayNameFromEmail(email),
  };
}

export async function signInWithSupabase(email: string, password: string) {
  const config = configuration();
  if (!config) throw new Error("Supabase authentication is not configured.");
  const response = await fetch(
    `${config.url}/auth/v1/token?grant_type=password`,
    {
      method: "POST",
      headers: headers(config.key),
      body: JSON.stringify({ email, password }),
    },
  );
  const payload = await readResponse(response);
  return userIdentity(payload.user);
}

export async function signUpWithSupabase(input: {
  email: string;
  password: string;
  name: string;
  redirectTo: string;
}) {
  const config = configuration();
  if (!config) throw new Error("Public account creation is not configured yet.");
  const response = await fetch(
    `${config.url}/auth/v1/signup?redirect_to=${encodeURIComponent(input.redirectTo)}`,
    {
      method: "POST",
      headers: headers(config.key),
      body: JSON.stringify({
        email: input.email,
        password: input.password,
        data: { display_name: input.name },
      }),
    },
  );
  const payload = await readResponse(response);
  return {
    ...userIdentity(payload.user),
    emailConfirmed: Boolean(payload.access_token),
  };
}

export async function requestSupabasePasswordReset(
  email: string,
  redirectTo: string,
) {
  const config = configuration();
  if (!config) return false;
  const response = await fetch(
    `${config.url}/auth/v1/recover?redirect_to=${encodeURIComponent(redirectTo)}`,
    {
      method: "POST",
      headers: headers(config.key),
      body: JSON.stringify({ email }),
    },
  );
  await readResponse(response);
  return true;
}

export async function verifySupabaseAccessToken(accessToken: string) {
  const config = configuration();
  if (!config) throw new Error("Supabase authentication is not configured.");
  const response = await fetch(`${config.url}/auth/v1/user`, {
    headers: headers(config.key, accessToken),
  });
  const user = (await readResponse(response)) as SupabaseUser;
  return userIdentity(user);
}

export async function updateSupabasePassword(
  accessToken: string,
  password: string,
) {
  const config = configuration();
  if (!config) throw new Error("Supabase authentication is not configured.");
  const response = await fetch(`${config.url}/auth/v1/user`, {
    method: "PUT",
    headers: headers(config.key, accessToken),
    body: JSON.stringify({ password }),
  });
  const user = (await readResponse(response)) as SupabaseUser;
  return userIdentity(user);
}
