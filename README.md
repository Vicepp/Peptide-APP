# PepVella: Peptide Calculator & Guide

A mobile-first web app (it works on phones and desktop browsers, and can be installed to the home screen). It includes:

- Animated onboarding featuring an original mascot, "Pip"
- Email/password and Google login (Firebase Auth)
- A peptide calculator: reconstitution with a live U-100 syringe, plus half-life, steady-state and missed-dose tools
- 43 peptide breakdowns, each with overview, mechanism, research, reported protocols, PK, stacking, safety, monitoring, regulatory status and evidence-graded citations
- Lessons (Getting Started, Foundations, Steady State), the 2026 regulatory update and a glossary
- Daily read suggestions based on each user's interests, a reading plan (schedule what to read) and a private experience log
- Streaks, XP and levels. Every user's tier badge is shown in front of their name.
- **Community**: a feed (posts, likes, replies, topics) and a leaderboard for This week / Last week / This month / This year. **All time** is visible to the admin only. Members can't share links, phone numbers or emails. Only the admin can, and the admin can delete any post. This is enforced in the app and in `firestore.rules`.
- An **Admin dashboard** that lists every user who signs up or logs in, with CSV export, and lets you post optional update pop-ups
- Light theme (white with medical blue) and dark theme (black & white), switchable in **Profile → Settings**

## Run locally

```bash
npm install
npm run dev
```

Open http://localhost:5173. To try it on your phone, open the "Network" address the command prints. Your phone must be on the same Wi-Fi.

Without Firebase keys the app runs in **demo mode**, which saves data in the browser only. In demo mode, sign up with `admin@demo.com` to see the Admin dashboard.

## Connect Firebase (your database)

1. Go to https://console.firebase.google.com and create a project.
2. **Build → Authentication → Get started**, then enable **Email/Password** and **Google**.
3. **Build → Firestore Database → Create database** (production mode).
4. **Firestore → Rules**: paste in the contents of `firestore.rules`. Put **your** admin email in place of `admin@demo.com`, then click Publish.
5. **Project settings → Your apps → Web (</>)**: register the app and copy the config values.
6. Copy `.env.example` to `.env.local` and fill in the values. Set `VITE_ADMIN_EMAILS` to your email.
7. Restart `npm run dev`.

Community data is stored in `members/{uid}` (public card: name, XP, streak, no email) and in `posts/{id}` with a `comments` subcollection.

Your users are stored in Firestore under `users/{uid}`, with subcollections `schedule` and `logs`. Announcements are stored in `announcements`.

## Deploy to Vercel

1. Push this folder to a GitHub repo.
2. At https://vercel.com, choose **Add New → Project**, then import the repo. Vercel auto-detects the Vite framework, so keep the defaults.
3. Under **Environment Variables**, add every `VITE_...` value from `.env.local`.
4. Click Deploy.
5. Back in Firebase → **Authentication → Settings → Authorized domains**, add your `*.vercel.app` domain. Google login won't work until you do.

`vercel.json` already handles page refreshes on deep links.

## Updating the content

The peptide text comes from the Word reference guide. If the guide changes, regenerate the data:

```bash
python scripts/parse_doc.py "C:\path\to\PepGuide Reference Guide.docx"
```

To rename the app, change `APP_NAME` in `src/config.js`, and the name in `index.html` and `public/manifest.webmanifest`.

---
Research reference only. Not medical advice.
