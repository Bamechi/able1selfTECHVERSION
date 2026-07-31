"use client";
/* eslint-disable @next/next/no-img-element */

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";

export default function ResetPassword() {
  const [accessToken, setAccessToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    queueMicrotask(() => {
      const hash = new URLSearchParams(window.location.hash.slice(1));
      setAccessToken(hash.get("access_token") ?? "");
    });
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (password !== confirmation) {
      setMessage("The two passwords do not match.");
      return;
    }
    setLoading(true);
    setMessage("");
    try {
      const response = await fetch("/api/auth/update-password", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ accessToken, password }),
      });
      const result = (await response.json()) as { ok?: boolean; error?: string };
      if (!response.ok || !result.ok) {
        throw new Error(result.error ?? "Unable to update your password.");
      }
      window.location.replace("/member");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to update your password.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="recovery-page">
      <section>
        <img src="/able1self-logo.png" alt="" />
        <span>ABLE / ACCOUNT RECOVERY</span>
        <h1>Choose a new password.</h1>
        <p>Use at least eight characters and a password you do not use elsewhere.</p>
        {accessToken ? (
          <form onSubmit={submit}>
            <label>
              <span>NEW PASSWORD</span>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                minLength={8}
                autoComplete="new-password"
                required
              />
            </label>
            <label>
              <span>CONFIRM PASSWORD</span>
              <input
                type="password"
                value={confirmation}
                onChange={(event) => setConfirmation(event.target.value)}
                minLength={8}
                autoComplete="new-password"
                required
              />
            </label>
            {message && <p role="status">{message}</p>}
            <button type="submit" disabled={loading}>
              {loading ? "Updating…" : "Update password →"}
            </button>
          </form>
        ) : (
          <p>This reset link is incomplete or has expired.</p>
        )}
        <Link href="/?login=1">Return to sign in →</Link>
      </section>
    </main>
  );
}
