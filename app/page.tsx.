
"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function Home() {
  const [mode, setMode] = useState<"login" | "signup">("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleAuth(e: React.FormEvent) {
    e.preventDefault();

    if (!supabase) {
      setMessage("Supabase is not configured yet.");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password
        });

        if (error) throw error;

        setMessage(
          "Registration received. Membership approval and email confirmation must be completed before access is granted."
        );
      } else {
        const { error } =
          await supabase.auth.signInWithPassword({
            email,
            password
          });

        if (error) throw error;

        setMessage(
          "Login successful. Your member access will be checked when membership approval is connected."
        );
      }
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main>
      <header className="container navbar">
        <a href="/" className="logo">
          Anonymous Hub.
        </a>

        <span className="status">YOUR VOICE MATTERS</span>
      </header>

      <section className="container hero">
        <span className="status">
          A COMMUNITY WITHOUT IDENTITIES
        </span>

        <h1>
          Speak freely.
          <br />
          <span className="highlight">
            Stay anonymous.
          </span>
        </h1>

        <p>
          Welcome to Anonymous Hub, a place where you
          can share your thoughts, join discussions and
          express yourself without revealing your
          identity to other members.
        </p>
      </section>

      <section className="container">
        <div className="card">
          <h2>Join the conversation</h2>

          <p className="muted">
            Create an account or sign in to continue.
            New memberships require administrator
            approval.
          </p>

          <div style={{
            display: "flex",
            gap: 10,
            marginBottom: 22
          }}>
            <button
              className={
                mode === "signup"
                  ? "btn"
                  : "btn btn-secondary"
              }
              onClick={() => {
                setMode("signup");
                setMessage("");
              }}
            >
              Register
            </button>

            <button
              className={
                mode === "login"
                  ? "btn"
                  : "btn btn-secondary"
              }
              onClick={() => {
                setMode("login");
                setMessage("");
              }}
            >
              Login
            </button>
          </div>

          <form onSubmit={handleAuth}>
            <label htmlFor="email">
              Email address
            </label>

            <input
              id="email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />

            <label htmlFor="password">
              Password
            </label>

            <input
              id="password"
              type="password"
              placeholder="At least 8 characters"
              minLength={8}
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />

            <button
              className="btn"
              type="submit"
              disabled={loading}
              style={{ width: "100%" }}
            >
              {loading
                ? "Please wait..."
                : mode === "signup"
                  ? "Request membership"
                  : "Sign in"}
            </button>
          </form>

          {message && (
            <p role="status" aria-live="polite">
              {message}
            </p>
          )}
        </div>
      </section>

      <section className="container">
        <div className="card">
          <h2>What you can do here</h2>

          <p>💬 Participate in public discussions.</p>
          <p>🖼️ Share pictures and videos.</p>
          <p>🎙️ Share voice messages.</p>
          <p>📁 Share documents.</p>
          <p>🛡️ Enjoy administrator-moderated discussions.</p>
        </div>
      </section>

      <footer>
        Anonymous Hub © 2026
        <br />
        Your identity is yours to protect.
      </footer>
    </main>
  );
}
