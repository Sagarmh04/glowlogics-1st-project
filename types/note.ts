import type { Timestamp } from "firebase/firestore";

export type NoteRecord = {
  id: string;
  ownerUid: string;
  title: string;
  body: string;
  tags: string[];
  shared: boolean;
  shareExpiresAt: Timestamp | Date | null;
  createdAt: Timestamp | Date | null;
  updatedAt: Timestamp | Date | null;
};
