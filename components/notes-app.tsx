"use client";

import { useEffect, useMemo, useState } from "react";
import clsx from "clsx";
import Image from "next/image";
import ReactMarkdown from "react-markdown";
import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
} from "firebase/auth";
import { doc, setDoc, Timestamp } from "firebase/firestore";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth, db, isFirebaseConfigured } from "@/lib/firebase";
import {
  createNote,
  deleteNote,
  updateNote,
  watchNotes,
} from "@/lib/notes";
import type { NoteRecord } from "@/types/note";

const shareDurations = [
  { label: "24 hours", hours: 24 },
  { label: "3 days", hours: 72 },
  { label: "7 days", hours: 168 },
];

function formatDate(value: NoteRecord["updatedAt"] | NoteRecord["shareExpiresAt"]) {
  if (!value) {
    return "Just now";
  }

  const rawDate =
    value instanceof Timestamp
      ? value.toDate()
      : value instanceof Date
        ? value
        : null;

  if (!rawDate) {
    return "Just now";
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(rawDate);
}

function AuthPanel() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submitLabel = mode === "signin" ? "Sign in" : "Create account";

  const handleEmailAuth = () => {
    setError(null);
    setIsSubmitting(true);

    void (async () => {
      try {
        if (mode === "signin") {
          await signInWithEmailAndPassword(auth, email, password);
        } else {
          await createUserWithEmailAndPassword(auth, email, password);
        }
      } catch (authError) {
        setError(
          authError instanceof Error ? authError.message : "Authentication failed.",
        );
      } finally {
        setIsSubmitting(false);
      }
    })();
  };

  const handleGoogleAuth = () => {
    setError(null);
    setIsSubmitting(true);

    void (async () => {
      try {
        await signInWithPopup(auth, new GoogleAuthProvider());
      } catch (authError) {
        setError(
          authError instanceof Error ? authError.message : "Google sign-in failed.",
        );
      } finally {
        setIsSubmitting(false);
      }
    })();
  };

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl items-center px-4 py-6 sm:px-6 sm:py-10">
      <section className="grid w-full gap-4 rounded-[2rem] border border-line/80 bg-card p-4 shadow-[var(--shadow)] backdrop-blur md:gap-6 md:p-8 lg:grid-cols-[1.15fr_0.9fr]">
        <div className="rounded-[1.7rem] bg-[linear-gradient(135deg,rgba(26,32,44,0.95),rgba(72,84,110,0.92))] p-6 text-white md:p-8">
          <div className="flex items-center gap-3">
            <Image
              alt="Glow Notes logo"
              className="rounded-2xl"
              height={52}
              priority
              src="/logo.webp"
              width={52}
            />
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.28em] text-white/70">
                Glow Notes
              </p>
              <p className="mt-1 text-sm text-white/70">Notes that stay easy to find.</p>
            </div>
          </div>
          <h1 className="mt-6 max-w-md text-3xl font-semibold tracking-tight sm:text-4xl md:text-5xl">
            Keep your notes tidy, searchable, and ready to share.
          </h1>
          <p className="mt-5 max-w-lg text-sm leading-7 text-white/78 sm:text-base">
            Save quick thoughts, organize them with tags, and send a time-limited
            link whenever you need to share something.
          </p>
          <div className="mt-8 grid gap-3 text-sm text-white/78 sm:grid-cols-2 xl:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-white/6 p-4">
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-white/55">Write</p>
              <p className="mt-2">Capture ideas in a clean, distraction-free space.</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/6 p-4">
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-white/55">Find</p>
              <p className="mt-2">Use search and tags to pull up the right note fast.</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/6 p-4">
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-white/55">Share</p>
              <p className="mt-2">Send a note with a link that can expire automatically.</p>
            </div>
          </div>
        </div>

        <div className="rounded-[1.7rem] border border-line/70 bg-card-strong p-5 sm:p-6">
          <p className="font-mono text-sm uppercase tracking-[0.26em] text-muted">Welcome</p>
          <h2 className="mt-4 text-2xl font-semibold tracking-tight">
            Sign in to your notes
          </h2>
          <p className="mt-3 text-sm leading-6 text-muted">
            Pick the sign-in method you prefer and continue where you left off.
          </p>

          <div className="mt-8 flex gap-2 rounded-full bg-black/4 p-1">
            {(["signin", "signup"] as const).map((nextMode) => (
              <button
                key={nextMode}
                className={clsx(
                  "flex-1 rounded-full px-4 py-2 text-sm transition",
                  mode === nextMode
                    ? "bg-accent text-white"
                    : "text-muted hover:text-foreground",
                )}
                onClick={() => setMode(nextMode)}
                type="button"
              >
                {nextMode === "signin" ? "Sign in" : "Create account"}
              </button>
            ))}
          </div>

          <div className="mt-6 space-y-4">
            <label className="block">
              <span className="mb-2 block text-sm font-medium">Email</span>
              <input
                className="w-full rounded-2xl border border-line bg-white/70 px-4 py-3 outline-none transition focus:border-accent"
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                type="email"
                value={email}
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium">Password</span>
              <input
                className="w-full rounded-2xl border border-line bg-white/70 px-4 py-3 outline-none transition focus:border-accent"
                onChange={(event) => setPassword(event.target.value)}
                placeholder="At least 6 characters"
                type="password"
                value={password}
              />
            </label>
          </div>

          {error ? (
            <p className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm text-danger">
              {error}
            </p>
          ) : null}

          <div className="mt-6 space-y-3">
            <button
              className="w-full rounded-2xl bg-accent px-4 py-3 font-medium text-white transition hover:bg-accent-strong disabled:opacity-60"
              disabled={isSubmitting}
              onClick={handleEmailAuth}
              type="button"
            >
              {submitLabel}
            </button>

            <button
              className="w-full rounded-2xl border border-line bg-white px-4 py-3 font-medium transition hover:bg-black/2 disabled:opacity-60"
              disabled={isSubmitting}
              onClick={handleGoogleAuth}
              type="button"
            >
              Continue with Google
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}

function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="flex min-h-[280px] flex-col items-center justify-center rounded-[1.8rem] border border-dashed border-line bg-white/50 px-6 py-8 text-center sm:min-h-[340px]">
      <p className="font-mono text-xs uppercase tracking-[0.28em] text-muted">
        No note open
      </p>
      <h2 className="mt-4 text-2xl font-semibold tracking-tight">
        Start your first note
      </h2>
      <p className="mt-3 max-w-md text-sm leading-6 text-muted">
        Create something new, keep it organized with tags, and share it when you
        need to.
      </p>
      <button
        className="mt-6 rounded-full bg-accent px-5 py-3 font-medium text-white transition hover:bg-accent-strong"
        onClick={onCreate}
        type="button"
      >
        Create note
      </button>
    </div>
  );
}

function NoteWorkspace({
  note,
  userUid,
  onDeleteSuccess,
}: {
  note: NoteRecord;
  userUid: string;
  onDeleteSuccess: () => void;
}) {
  const [draft, setDraft] = useState({
    title: note.title,
    body: note.body,
    tagsText: note.tags.join(", "),
  });
  const [isDirty, setIsDirty] = useState(false);
  const [saveMessage, setSaveMessage] = useState("Saved");
  const [shareHours, setShareHours] = useState(24);
  const [actionError, setActionError] = useState<string | null>(null);
  const shareLink =
    note.shared && typeof window !== "undefined"
      ? `${window.location.origin}/share/${encodeURIComponent(note.ownerUid)}/${encodeURIComponent(note.id)}`
      : "";

  useEffect(() => {
    if (!isDirty) {
      return;
    }

    const timeoutId = window.setTimeout(async () => {
      try {
        const tags = draft.tagsText
          .split(",")
          .map((tag) => tag.trim().toLowerCase())
          .filter(Boolean);

        await updateNote(userUid, note.id, {
          title: draft.title.trim() || "Untitled",
          body: draft.body,
          tags,
        });

        setSaveMessage("Saved");
        setIsDirty(false);
      } catch (error) {
        setSaveMessage("Save failed");
        setActionError(error instanceof Error ? error.message : "Failed to save.");
      }
    }, 700);

    return () => window.clearTimeout(timeoutId);
  }, [draft, isDirty, note.id, userUid]);

  const handleDeleteNote = async () => {
    if (!window.confirm(`Delete "${note.title}"?`)) {
      return;
    }

    setActionError(null);

    try {
      await deleteNote(userUid, note.id);
      onDeleteSuccess();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Failed to delete note.");
    }
  };

  const handleShare = async () => {
    setActionError(null);

    try {
      if (note.shared) {
        await updateNote(userUid, note.id, {
          shared: false,
          shareExpiresAt: null,
        });
        return;
      }

      const response = await fetch("/api/share-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uid: userUid,
          noteId: note.id,
          expiresInHours: shareHours,
        }),
      });

      if (!response.ok) {
        throw new Error("Could not generate share link.");
      }

      const payload = (await response.json()) as {
        expiresAt: string;
        shareUrl: string;
      };

      await updateNote(userUid, note.id, {
        shared: true,
        shareExpiresAt: Timestamp.fromDate(new Date(payload.expiresAt)),
      });

      await navigator.clipboard.writeText(payload.shareUrl);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Failed to update sharing.");
    }
  };

  const handleCopyShareLink = async () => {
    if (!shareLink) {
      return;
    }

    await navigator.clipboard.writeText(shareLink);
  };

  return (
    <>
      <section className="rounded-[1.6rem] border border-line bg-card-strong p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.28em] text-muted">
              Note
            </p>
            <p className="mt-2 text-sm text-muted">{saveMessage}</p>
          </div>
          <button
            className="rounded-full border border-red-200 bg-red-50 px-4 py-2 text-sm text-danger transition hover:bg-red-100"
            onClick={() => void handleDeleteNote()}
            type="button"
          >
            Delete
          </button>
        </div>

        <div className="mt-5 space-y-4">
          <input
            className="w-full rounded-[1.4rem] border border-line bg-white px-4 py-4 text-2xl font-semibold tracking-tight outline-none transition focus:border-accent sm:text-3xl"
            onChange={(event) => {
              setDraft((current) => ({ ...current, title: event.target.value }));
              setSaveMessage("Saving...");
              setIsDirty(true);
            }}
            placeholder="Untitled"
            value={draft.title}
          />

          <input
            className="w-full rounded-[1.2rem] border border-line bg-white px-4 py-3 text-sm outline-none transition focus:border-accent"
            onChange={(event) => {
              setDraft((current) => ({
                ...current,
                tagsText: event.target.value,
              }));
              setSaveMessage("Saving...");
              setIsDirty(true);
            }}
            placeholder="Tags, separated, by, commas"
            value={draft.tagsText}
          />

          <textarea
            className="min-h-[280px] w-full rounded-[1.4rem] border border-line bg-white px-4 py-4 text-base leading-7 outline-none transition focus:border-accent sm:min-h-[360px] lg:min-h-[460px]"
            onChange={(event) => {
              setDraft((current) => ({ ...current, body: event.target.value }));
              setSaveMessage("Saving...");
              setIsDirty(true);
            }}
            placeholder="Write in markdown..."
            value={draft.body}
          />
        </div>
      </section>

      <section className="rounded-[1.6rem] border border-line bg-card-strong p-4">
        <div className="rounded-[1.4rem] border border-line bg-white/75 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.28em] text-muted">
                Share
              </p>
              <h2 className="mt-2 text-xl font-semibold tracking-tight">
                Share this note
              </h2>
            </div>
            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
              <select
                className="rounded-full border border-line bg-white px-3 py-2 text-sm outline-none"
                onChange={(event) => setShareHours(Number(event.target.value))}
                value={shareHours}
              >
                {shareDurations.map((duration) => (
                  <option key={duration.hours} value={duration.hours}>
                    {duration.label}
                  </option>
                ))}
              </select>
              <button
                className={clsx(
                  "rounded-full px-4 py-2 text-sm font-medium transition",
                  note.shared
                    ? "bg-black text-white hover:bg-black/80"
                    : "bg-accent text-white hover:bg-accent-strong",
                )}
                onClick={() => void handleShare()}
                type="button"
              >
                {note.shared ? "Disable share" : "Enable share"}
              </button>
            </div>
          </div>

          <p className="mt-4 text-sm leading-6 text-muted">
            Turn sharing on to create a link that works until its expiry time.
          </p>

          {note.shared && note.shareExpiresAt ? (
            <p className="mt-3 text-sm text-success">
              Expires {formatDate(note.shareExpiresAt)}
            </p>
          ) : null}

          {shareLink ? (
            <div className="mt-4 space-y-3">
              <input
                className="w-full rounded-2xl border border-line bg-white px-4 py-3 text-sm outline-none"
                readOnly
                value={shareLink}
              />
              <button
                className="rounded-full border border-line px-4 py-2 text-sm transition hover:bg-black/4"
                onClick={() => void handleCopyShareLink()}
                type="button"
              >
                Copy link
              </button>
            </div>
          ) : null}
        </div>

        {actionError ? (
          <p className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm text-danger">
            {actionError}
          </p>
        ) : null}

        <div className="mt-4 rounded-[1.4rem] border border-line bg-white/80 p-5">
          <p className="font-mono text-xs uppercase tracking-[0.28em] text-muted">
            Preview
          </p>
          <article className="prose prose-stone mt-4 max-w-none prose-headings:tracking-tight prose-p:text-foreground/88">
            <ReactMarkdown>{draft.body || "_Nothing to preview yet._"}</ReactMarkdown>
          </article>
        </div>
      </section>
    </>
  );
}

export function NotesApp() {
  const [user, authLoading] = useAuthState(auth);
  const [notes, setNotes] = useState<NoteRecord[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!user) {
      return;
    }

    const userRef = doc(db, `users/${user.uid}`);
    void setDoc(
      userRef,
      {
        email: user.email ?? null,
        displayName: user.displayName ?? null,
        updatedAt: Timestamp.now(),
      },
      { merge: true },
    );

    const unsubscribe = watchNotes(user.uid, (nextNotes) => {
      setNotes(nextNotes);

      setSelectedId((currentSelectedId) => {
        if (currentSelectedId && nextNotes.some((note) => note.id === currentSelectedId)) {
          return currentSelectedId;
        }

        return nextNotes[0]?.id ?? null;
      });
    });

    return unsubscribe;
  }, [user]);

  const selectedNote = useMemo(
    () => notes.find((note) => note.id === selectedId) ?? null,
    [notes, selectedId],
  );

  const filteredNotes = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return notes;
    }

    return notes.filter((note) => {
      const haystack = `${note.title} ${note.body} ${note.tags.join(" ")}`.toLowerCase();
      return haystack.includes(query);
    });
  }, [notes, search]);

  const handleCreateNote = async () => {
    if (!user) {
      return;
    }

    try {
      const ref = await createNote(user.uid);
      setSelectedId(ref.id);
    } catch {
      setSelectedId(null);
    }
  };

  if (!isFirebaseConfigured) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-3xl items-center px-4 py-8 sm:px-6 sm:py-10">
        <section className="w-full rounded-[2rem] border border-line bg-card p-8 shadow-[var(--shadow)]">
          <p className="font-mono text-sm uppercase tracking-[0.28em] text-muted">
            Setup needed
          </p>
          <h1 className="mt-5 text-3xl font-semibold tracking-tight">
            Add your app settings before opening Glow Notes.
          </h1>
          <p className="mt-4 text-sm leading-7 text-muted">
            Copy your values into <code>.env.local</code> using <code>.env.example</code>
            as a guide.
          </p>
        </section>
      </main>
    );
  }

  if (authLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <div className="rounded-full border border-line bg-card px-6 py-3 text-sm text-muted shadow-[var(--shadow)]">
          Checking authentication...
        </div>
      </main>
    );
  }

  if (!user) {
    return <AuthPanel />;
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-[1500px] px-3 py-3 sm:px-4 sm:py-4 md:px-6 md:py-6">
      <section className="grid w-full gap-4 rounded-[2rem] border border-line/70 bg-card p-3 shadow-[var(--shadow)] backdrop-blur sm:p-4 xl:grid-cols-[320px_minmax(0,1fr)_420px]">
        <aside className="rounded-[1.6rem] border border-line bg-card-strong p-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <Image
                alt="Glow Notes logo"
                className="rounded-xl"
                height={40}
                src="/logo.webp"
                width={40}
              />
              <p className="font-mono text-xs uppercase tracking-[0.28em] text-muted">
                Glow Notes
              </p>
              <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">Your notes</h1>
            </div>
            <button
              className="rounded-full border border-line px-3 py-2 text-sm transition hover:bg-black/4"
              onClick={() => {
                setSelectedId(null);
                void signOut(auth);
              }}
              type="button"
            >
              Sign out
            </button>
          </div>

          <div className="mt-5 rounded-2xl bg-white/70 p-4">
            <p className="text-sm font-medium">{user.displayName ?? user.email}</p>
            <p className="mt-1 text-xs text-muted">{user.email ?? "Signed in"}</p>
          </div>

          <div className="mt-5 flex flex-col gap-2 sm:flex-row xl:flex-col">
            <button
              className="rounded-full bg-accent px-4 py-3 text-sm font-medium text-white transition hover:bg-accent-strong sm:flex-1 xl:flex-none"
              onClick={() => void handleCreateNote()}
              type="button"
            >
              New note
            </button>
            <input
              className="w-full rounded-full border border-line bg-white/80 px-4 py-3 text-sm outline-none transition focus:border-accent"
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search notes or tags"
              value={search}
            />
          </div>

          <div className="mt-5 space-y-3">
            {filteredNotes.length > 0 ? (
              filteredNotes.map((note) => (
                <button
                  key={note.id}
                  className={clsx(
                    "w-full rounded-[1.4rem] border px-4 py-4 text-left transition",
                    selectedId === note.id
                      ? "border-accent bg-accent-soft"
                      : "border-line bg-white/65 hover:bg-white",
                  )}
                  onClick={() => setSelectedId(note.id)}
                  type="button"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">{note.title}</p>
                      <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted">
                        {note.body || "Empty note"}
                      </p>
                    </div>
                    {note.shared ? (
                      <span className="rounded-full bg-white px-2 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-accent">
                        Shared
                      </span>
                    ) : null}
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {note.tags.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full bg-black/5 px-2 py-1 text-xs text-muted"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                  <p className="mt-3 text-xs text-muted">
                    Updated {formatDate(note.updatedAt)}
                  </p>
                </button>
              ))
            ) : (
              <div className="rounded-[1.4rem] border border-dashed border-line bg-white/55 px-4 py-8 text-center text-sm text-muted">
                No notes match your search.
              </div>
            )}
          </div>
        </aside>

        {selectedNote ? (
          <NoteWorkspace
            key={selectedNote.id}
            note={selectedNote}
            onDeleteSuccess={() => setSelectedId(null)}
            userUid={user.uid}
          />
        ) : (
          <>
            <section className="rounded-[1.6rem] border border-line bg-card-strong p-4">
              <EmptyState onCreate={() => void handleCreateNote()} />
            </section>
            <section className="rounded-[1.6rem] border border-line bg-card-strong p-4">
              <div className="flex min-h-full items-center justify-center rounded-[1.8rem] border border-dashed border-line bg-white/50 px-6 text-center text-sm text-muted">
                Sharing and preview will appear after you open a note.
              </div>
            </section>
          </>
        )}
      </section>
    </main>
  );
}
