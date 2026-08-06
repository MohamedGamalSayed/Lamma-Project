# Discord-like Chat App — Full Project README

Solo graduation project · Egyptian software engineering senior year · Free-tier stack
Real-time chat app (servers → channels → messages) on web + mobile from one codebase,
plus an AI-powered feature.

**Status legend:** ✅ done · 🔨 in progress · ⬜ not started

---

## Tech Stack

| Layer | Choice | Why |
|---|---|---|
| Frontend | React Native (Expo) + React Native Web | One codebase → web + Android app |
| Backend | Node.js + Express | Simple, huge community, easy to deploy free |
| Real-time | Socket.IO | Handles WebSocket reconnection/fallback for you |
| Database | PostgreSQL (Supabase free tier) | Relational fits users/servers/channels/messages well |
| Media storage | Cloudinary | Free tier, auto image optimization |
| GIFs | Giphy API (free tier) | Don't host GIFs yourself |
| Auth | JWT + bcrypt | Standard, defensible in your report |
| Hosting (web) | Vercel or Netlify | Free, auto-deploy from GitHub |
| Hosting (backend) | Railway or Render | Free tier is enough for a demo |
| Mobile build | Expo (EAS Build) | Free `.apk` builds without a paid dev account |

## Database Schema (v1)

- **users**: id, username, email, password_hash, avatar_url, created_at
- **servers**: id, name, owner_id, icon_url, created_at
- **channels**: id, server_id, name, type (text/voice)
- **memberships**: user_id, server_id, role (owner/admin/member)
- **messages**: id, channel_id, user_id, content, attachment_url, created_at
- **reactions**: id, message_id, user_id, emoji

---

## Phase 1 — Foundation (Weeks 1–2) ✅ DONE

- [x] GitHub repo, Expo project, Node/Express backend set up
- [x] PostgreSQL schema: `users`, `servers`, `channels`, `messages`
- [x] Auth: signup, login, JWT, password hashing (bcrypt)
- [x] **Milestone hit:** register/login working via API (Postman)

**Run it:**
```bash
cp .env.example .env       # fill in DATABASE_URL + JWT_SECRET
# run src/config/schema.sql in Supabase's SQL Editor
npm install
npm start
```
Test:
```bash
curl -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","email":"test@example.com","password":"password123"}'
```

---

## Phase 2 — Core Chat (Weeks 3–5) ✅ DONE

- [x] Servers + channels CRUD (create/join/list)
- [x] Socket.IO real-time messaging (send/receive text)
- [ ] Basic UI (login, server list, channel view, message input) in React Native / RNW — **not built yet, backend only so far**
- [x] **Milestone hit (backend-only):** two clients can chat live via `test-client.html`

**Run it:**
```bash
# run src/config/schema_week3.sql in Supabase's SQL Editor
npm install
npm start
```
Open `test-client.html` in two browser tabs, log in as two different users,
join the same channel ID, and send a message — it should appear instantly in both.

⚠️ **Not actually finished per the original plan** — the plan calls for a real
React Native / React Native Web UI here. Right now this milestone is only proven
through the raw REST API + `test-client.html`, not a real app screen.

---

## Phase 3 — Media (Weeks 6–7) 🔨 IN PROGRESS

- [x] Image/file upload → Cloudinary (`mediaController.js`, `mediaRoutes.js`, `config/cloudinary.js`)
- [x] GIF picker backend (Giphy API search endpoint)
- [ ] Mount `mediaRoutes` in `src/index.js` (`app.use('/api/media', mediaRoutes)`) — **still missing**
- [ ] Client-side compression before upload — not started
- [ ] Thumbnails + lazy-loading in chat UI — not started
- [ ] Emoji reactions — not started
- [ ] Commit `mediaController.js` / `mediaRoutes.js` to git — currently untracked

**Endpoints (once mounted):**
```bash
# upload (multipart, field name "file")
curl -X POST http://localhost:5000/api/media/upload \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@/path/to/image.jpg"

# gif search
curl "http://localhost:5000/api/media/gifs/search?q=cats" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Milestone (not yet hit):** send/receive images, GIFs, reactions on both web and mobile.

---

## Phase 4 — Security & Roles (Week 8) ⬜ NOT STARTED

- [ ] Role-based permissions (owner/admin/member) enforced on routes
- [ ] Rate limiting on messages/uploads
- [ ] Server-side file type/size validation (beyond multer's size cap already in `mediaController.js`)
- [ ] HTTPS + WSS everywhere (production config)

**Milestone:** non-admins can't delete others' messages; spam gets throttled.

---

## Phase 5 — Mobile Adaptation (Weeks 9–10) ⬜ NOT STARTED

- [ ] Fix cross-platform quirks (file picker, notifications, socket reconnect)
- [ ] Build Android `.apk` via Expo EAS
- [ ] Test on a real phone, not just emulator

**Milestone:** same app installed and working on an actual Android phone.

---

## Phase 6 — AI Feature (Weeks 11–12) ⬜ NOT STARTED — pick ONE

- [ ] Smart moderation (flag toxic messages via free-tier LLM API), **or**
- [ ] Arabic ↔ English auto-translate for messages, **or**
- [ ] Channel assistant bot (summarize unread messages, answer FAQs)

**Milestone:** AI feature demoable live, not just "works in theory."

---

## Phase 7 — Polish, Testing, Docs (Week 13) ⬜ NOT STARTED

- [ ] Bug fixes, UI polish
- [ ] Load test with a handful of real users (friends/classmates)
- [ ] Bandwidth before/after comparison (compression on vs off) — good data for the report
- [ ] Write final report sections as you go, not all at the end

---

## Phase 8 — Buffer (Week 14) ⬜ NOT STARTED

- [ ] Reserved for whatever inevitably breaks last minute
- [ ] Rehearse the live demo at least twice before defense

---

## Milestone Checklist (realistic checkpoints)

| Can you demo this? | By when | Status |
|---|---|---|
| Register/login working | End of Week 2 | ✅ |
| Live text chat between 2 users | End of Week 5 | ✅ (backend only, no RN UI yet) |
| Media + GIFs + reactions | End of Week 7 | 🔨 in progress |
| Secure, role-based, spam-protected | End of Week 8 | ⬜ |
| Installable on a real phone | End of Week 10 | ⬜ |
| Full AI feature working | End of Week 12 | ⬜ |
| Fully polished, demo-ready | End of Week 13 | ⬜ |

**Total: ~13–14 weeks** of steady part-time work (roughly one semester).
Weekends-only pace: expect closer to 18–20 weeks — tell your supervisor the honest number.

---

## Known Issues / Housekeeping

- ⚠️ `.env` (real Supabase DB password, Cloudinary secret, Giphy key) is currently
  **committed to git**. Add a `.gitignore` for `.env` and rotate these credentials
  if this repo has ever been pushed anywhere public.
- ⚠️ `node_modules` is also committed — add it to `.gitignore` and run
  `git rm -r --cached node_modules` to stop tracking it.
- `mediaController.js` / `mediaRoutes.js` exist on disk but aren't committed yet.

## Things to Say Explicitly in Your Report (they help, not hurt)

- "Designed to scale beyond free-tier limits with paid infrastructure" — shows production awareness.
- "iOS build treated as future work" (if no Mac available) — normal, accepted limitation.
- Bandwidth optimization numbers (with vs without compression) — concrete measurable result.
- Security decisions (hashing algorithm, rate limiting thresholds, role model) — shows engineering judgment.
