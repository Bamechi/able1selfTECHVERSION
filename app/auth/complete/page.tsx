"use client";
/* eslint-disable @next/next/no-img-element */

import { useEffect, useState } from "react";
import Link from "next/link";

export default function CompleteAccount() {
  const [message, setMessage] = useState("Confirming your Able1Self account…");

  useEffect(() => {
    queueMicrotask(() => {
      const hash = new URLSearchParams(window.location.hash.slice(1));
      const accessToken = hash.get("access_token");
      const type = hash.get("type");
      if (type === "recovery") {
        window.location.replace(`/reset-password${window.location.hash}`);
        return;
      }
      if (!accessToken) {
        setMessage("This confirmation link is incomplete or has expired.");
        return;
      }
      void fetch("/api/auth/accept-token", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ accessToken }),
      })
        .then(async (response) => {
          const result = (await response.json()) as { ok?: boolean; error?: string };
          if (!response.ok || !result.ok) {
            throw new Error(result.error ?? "Unable to confirm this account.");
          }
          window.location.replace("/member");
        })
        .catch((error: Error) => setMessage(error.message));
    });
  }, []);

  return (
    <main className="recovery-page">
      <section>
        <img src="/able1self-logo.png" alt="" />
        <span>ABLE / SECURE ACCESS</span>
        <h1>One moment.</h1>
        <p>{message}</p>
        <Link href="/?login=1">Return to sign in →</Link>
      </section>
    </main>
  );
}
