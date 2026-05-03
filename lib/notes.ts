import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { NoteRecord } from "@/types/note";

export async function createNote(uid: string) {
  return addDoc(collection(db, `users/${uid}/notes`), {
    ownerUid: uid,
    title: "Untitled",
    body: "",
    tags: [],
    shared: false,
    shareExpiresAt: null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function updateNote(
  uid: string,
  id: string,
  data: Partial<NoteRecord>,
) {
  return updateDoc(doc(db, `users/${uid}/notes/${id}`), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteNote(uid: string, id: string) {
  return deleteDoc(doc(db, `users/${uid}/notes/${id}`));
}

export function watchNotes(uid: string, callback: (docs: NoteRecord[]) => void) {
  const notesQuery = query(
    collection(db, `users/${uid}/notes`),
    orderBy("updatedAt", "desc"),
  );

  return onSnapshot(notesQuery, (snapshot) => {
    callback(
      snapshot.docs.map((noteDoc) => ({
        id: noteDoc.id,
        ...(noteDoc.data() as Omit<NoteRecord, "id">),
      })),
    );
  });
}
