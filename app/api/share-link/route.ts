import { NextResponse } from "next/server";

type ShareLinkBody = {
  uid?: string;
  noteId?: string;
  expiresInHours?: number;
};

export async function POST(request: Request) {
  const body = (await request.json()) as ShareLinkBody;
  const uid = body.uid?.trim();
  const noteId = body.noteId?.trim();
  const expiresInHours = body.expiresInHours ?? 24;

  if (!uid || !noteId) {
    return NextResponse.json(
      { error: "uid and noteId are required." },
      { status: 400 },
    );
  }

  if (!Number.isFinite(expiresInHours) || expiresInHours <= 0) {
    return NextResponse.json(
      { error: "expiresInHours must be a positive number." },
      { status: 400 },
    );
  }

  const expiresAt = new Date(Date.now() + expiresInHours * 60 * 60 * 1000);
  const shareUrl = `${request.headers.get("origin") ?? new URL(request.url).origin}/share/${encodeURIComponent(uid)}/${encodeURIComponent(noteId)}`;

  return NextResponse.json({
    expiresAt: expiresAt.toISOString(),
    shareUrl,
  });
}
