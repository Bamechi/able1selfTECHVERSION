"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

export function ThemeToggle() {
  const [dark, setDark] = useState(true);
  useEffect(() => {
    const sync = () => setDark(document.documentElement.dataset.theme !== "light");
    sync();
    window.addEventListener("able-theme", sync);
    return () => window.removeEventListener("able-theme", sync);
  }, []);
  function toggle() {
    const next = dark ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    try { localStorage.setItem("able-theme", next); } catch { /* Private browsing may disable storage. */ }
    window.dispatchEvent(new Event("able-theme"));
  }
  return <button className="theme-toggle" type="button" onClick={toggle} aria-label={`Switch to ${dark ? "light" : "dark"} mode`} title={`Switch to ${dark ? "light" : "dark"} mode`}>
    {dark ? <Sun size={20} /> : <Moon size={20} />}
  </button>;
}
