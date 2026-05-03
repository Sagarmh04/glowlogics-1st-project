"use client";

import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import { doc, onSnapshot, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { NoteRecord } from "@/types/note";

function isAvailable(note: NoteRecord) {
  if (!note.shared) {
    return false;
  }

  if (!(note.shareExpiresAt instanceof Timestamp)) {
    return false;
  }

  return note.shareExpiresAt.toMillis() > Date.now();
}

export function ShareNoteView({ noteId, uid }: { noteId: string; uid: string }) {
  const [note, setNote] = useState<NoteRecord | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "missing">("loading");

  useEffect(() => {
    const unsubscribe = onSnapshot(
      doc(db, `users/${uid}/notes/${noteId}`),
      (snapshot) => {
        if (!snapshot.exists()) {
          setNote(null);
          setStatus("missing");
          return;
        }

        const nextNote = {
          id: snapshot.id,
          ownerUid: uid,
          ...snapshot.data(),
        } as NoteRecord;

        if (!isAvailable(nextNote)) {
          setNote(null);
          setStatus("missing");
          return;
        }

        setNote(nextNote);
        setStatus("ready");
      },
      () => {
        setNote(null);
        setStatus("missing");
      },
    );

    return unsubscribe;
  }, [noteId, uid]);

  if (status === "loading") {
    return (
      <main className="flex min-h-screen items-center justify-center px-6">
        <div className="rounded-full border border-line bg-card px-6 py-3 text-sm text-muted shadow-[var(--shadow)]">
          Loading shared note...
        </div>
      </main>
    );
  }

  if (status === "missing" || !note) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-3xl items-center px-6 py-10">
        <section className="w-full rounded-[2rem] border border-line bg-card p-8 shadow-[var(--shadow)]">
          <p className="font-mono text-sm uppercase tracking-[0.28em] text-muted">
            Share unavailable
          </p>
          <h1 className="mt-5 text-3xl font-semibold tracking-tight">
            This link is invalid, private, or expired.
          </h1>
          <p className="mt-4 text-sm leading-7 text-muted">
            The Firestore rules only allow public reads while the note is marked as
            shared and the expiry timestamp has not passed.
          </p>
        </section>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-4xl px-6 py-10">
      <article className="w-full rounded-[2rem] border border-line bg-card p-8 shadow-[var(--shadow)]">
        <p className="font-mono text-sm uppercase tracking-[0.28em] text-muted">
          Shared note
        </p>
        <h1 className="mt-5 text-4xl font-semibold tracking-tight">{note.title}</h1>
        <div className="mt-4 flex flex-wrap gap-2">
          {note.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-accent-soft px-3 py-1 text-xs text-accent-strong"
            >
              #{tag}
            </span>
          ))}
        </div>
        <article className="prose prose-stone mt-8 max-w-none prose-headings:tracking-tight prose-p:text-foreground/88">
          <ReactMarkdown>{note.body}</ReactMarkdown>
        </article>
      </article>
    </main>
  );
}
