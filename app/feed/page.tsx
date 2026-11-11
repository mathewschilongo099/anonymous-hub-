
"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Post = {
  id: string;
  author_id: string;
  title: string;
  content: string;
  category: string;
  created_at: string;
  status: string;
};

type Profile = {
  id: string;
  anonymous_alias: string;
};

export default function FeedPage() {
  const router = useRouter();

  const [posts, setPosts] = useState<Post[]>([]);
  const [aliases, setAliases] = useState<Record<string, string>>({});
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("General");
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [message, setMessage] = useState("");
  const [allowed, setAllowed] = useState(false);

  const loadFeed = useCallback(async () => {
    if (!supabase) {
      setMessage("Supabase configuration is missing.");
      setLoading(false);
      return;
    }

    try {
      const { data: { user }, error: authError } =
        await supabase.auth.getUser();

      if (authError || !user) {
        router.replace("/");
        return;
      }

      // Check membership approval
      const { data: approved, error: approvalError } =
        await supabase.rpc("is_approved");

      if (approvalError) throw approvalError;

      if (!approved) {
        setAllowed(false);
        setMessage(
          "Your membership request is awaiting administrator approval."
        );
        setLoading(false);
        return;
      }

      setAllowed(true);

      // Load published discussions
      const { data, error } = await supabase
        .from("posts")
        .select(
          "id, author_id, title, content, category, created_at, status"
        )
        .eq("status", "published")
        .order("created_at", { ascending: false });

      if (error) throw error;

      const postList = (data || []) as Post[];
      setPosts(postList);

      // Load public anonymous aliases separately
      const authorIds = [
        ...new Set(postList.map(post => post.author_id))
      ];

      if (authorIds.length > 0) {
        const { data: profiles, error: profileError } =
          await supabase
            .from("profiles")
            .select("id, anonymous_alias")
            .in("id", authorIds);

        if (profileError) throw profileError;

        const aliasMap: Record<string, string> = {};

        (profiles as Profile[] || []).forEach(profile => {
          aliasMap[profile.id] = profile.anonymous_alias;
        });

        setAliases(aliasMap);
      }

    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to load discussions."
      );
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    loadFeed();
  }, [loadFeed]);

  async function createPost(e: React.FormEvent) {
    e.preventDefault();

    if (!supabase || !title.trim() || !content.trim()) {
      setMessage("Please enter a title and message.");
      return;
    }

    setPosting(true);
    setMessage("");

    try {
      const { data: { user } } =
        await supabase.auth.getUser();

      if (!user) {
        router.replace("/");
        return;
      }

      const { error } = await supabase
        .from("posts")
        .insert({
          author_id: user.id,
          title: title.trim(),
          content: content.trim(),
          category
        });

      if (error) throw error;

      setTitle("");
      setContent("");
      setCategory("General");
      setMessage("Your anonymous post has been published.");

      await loadFeed();

    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to publish your post."
      );
    } finally {
      setPosting(false);
    }
  }

  async function signOut() {
    if (!supabase) return;

    await supabase.auth.signOut();
    router.replace("/");
  }

  if (loading) {
    return (
      <main className="container" style={{ padding: 40 }}>
        Loading Anonymous Hub...
      </main>
    );
  }

  if (!allowed) {
    return (
      <main className="container" style={{ paddingTop: 60 }}>
        <div className="card">
          <h1>Membership pending</h1>
          <p className="muted">{message}</p>
          <p>
            Your account is registered, but you must
            wait for administrator approval before
            joining discussions.
          </p>
          <button className="btn btn-secondary" onClick={signOut}>
            Sign out
          </button>
        </div>
      </main>
    );
  }

  return (
    <main>
      <header className="container navbar">
        <a href="/feed" className="logo">
          Anonymous Hub.
        </a>

        <button
          className="btn btn-secondary"
          onClick={signOut}
        >
          Sign out
        </button>
      </header>

      <section className="container hero">
        <span className="status">COMMUNITY DISCUSSIONS</span>
        <h1>
          Your voice.
          <br />
          <span className="highlight">Your community.</span>
        </h1>
        <p>
          Share ideas, start conversations and
          connect with others anonymously.
        </p>
      </section>

      <section className="container">
        <div className="card">
          <h2>Create a discussion</h2>

          <form onSubmit={createPost}>
            <label htmlFor="title">Discussion title</label>
            <input
              id="title"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="What would you like to discuss?"
              maxLength={150}
              required
            />

            <label htmlFor="category">Category</label>
            <select
              id="category"
              value={category}
              onChange={e => setCategory(e.target.value)}
              style={{
                width: "100%",
                padding: 12,
                margin: "8px 0 15px",
                background: "var(--background)",
                color: "var(--text)",
                border: "1px solid var(--border)",
                borderRadius: 9
              }}
            >
              <option>General</option>
              <option>Education</option>
              <option>Entertainment</option>
              <option>Relationships</option>
              <option>Technology</option>
              <option>Business</option>
              <option>Advice</option>
            </select>

            <label htmlFor="content">Your message</label>
            <textarea
              id="content"
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="Write your thoughts here..."
              maxLength={10000}
              required
            />

            <button
              className="btn"
              type="submit"
              disabled={posting}
              style={{ width: "100%" }}
            >
              {posting ? "Publishing..." : "Publish anonymously"}
            </button>
          </form>

          {message && (
            <p role="status" aria-live="polite">{message}</p>
          )}
        </div>
      </section>

      <section className="container">
        <h2>Community discussions</h2>

        {posts.length === 0 ? (
          <div className="card">
            <h3>No discussions yet</h3>
            <p className="muted">
              Be the first to start a conversation!
            </p>
          </div>
        ) : (
          posts.map(post => (
            <article className="card" key={post.id}>
              <span className="status">{post.category}</span>

              <h3>{post.title}</h3>

              <p style={{ whiteSpace: "pre-wrap", lineHeight: 1.7 }}>
                {post.content}
              </p>

              <div
                className="muted"
                style={{ fontSize: 13 }}
              >
                {aliases[post.author_id] || "Anonymous member"}
                {" · "}
                {new Date(post.created_at).toLocaleString()}
              </div>
            </article>
          ))
        )}
      </section>

      <footer>
        Anonymous Hub © 2026
        <br />
        Speak freely. Respect everyone.
      </footer>
    </main>
  );
}
