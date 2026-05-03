# Glow Notes

Small cloud note-taking app built with Next.js, Firebase Auth, Firestore, and a
lightweight Next.js API route for share link generation.

## Stack

- Next.js App Router
- Firebase Authentication
- Firestore
- Next.js Route Handlers for serverless compute
- Vercel for hosting

## Local setup

1. Install dependencies:

```bash
npm install
```

2. Create `.env.local` from `.env.example`.

3. Start the dev server:

```bash
npm run dev
```

## Required env vars

```bash
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=
```

## Manual Firebase steps

1. Apply the Firestore rules from `ai/firestore_rules.txt` in Firebase Console.
2. Keep Email/Password and Google providers enabled in Firebase Auth.
3. If Google popup auth fails, verify the app domain is listed under authorized domains.

## Features

- Email/password and Google authentication
- Create, edit, search, and delete notes
- Tags as comma-separated values
- Markdown preview
- Public share links with expiry backed by Firestore rules

## Share flow

- The app calls `POST /api/share-link` to generate the share URL and expiry.
- The client writes `shared` and `shareExpiresAt` to Firestore.
- Public read access is enforced by Firestore rules only while the note is shared
  and not expired.
