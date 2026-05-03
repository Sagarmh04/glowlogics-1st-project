import { ShareNoteView } from "@/components/share-note-view";

type SharePageProps = {
  params: Promise<{
    uid: string;
    noteId: string;
  }>;
};

export default async function SharePage({ params }: SharePageProps) {
  const { uid, noteId } = await params;

  return <ShareNoteView uid={uid} noteId={noteId} />;
}
