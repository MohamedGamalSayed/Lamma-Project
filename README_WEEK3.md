# Week 3 — Servers, Channels & Real-Time Chat

## What's new
- **Servers**: create a server, list your servers, join a server
- **Channels**: create channels inside a server, list channels, get message history
- **Real-time chat**: Socket.IO — send/receive messages live
- A **test-client.html** page so you can see live chat working in a browser,
  without needing the real React frontend yet

## Setup steps

### 1. Run the new database tables
- Open Supabase → **SQL Editor** → **New query**
- Copy the contents of `src/config/schema_week3.sql`
- Paste and **Run** (choose "Run without RLS" if asked, same as before)
- This creates: `servers`, `channels`, `memberships`, `messages`

### 2. Install the new dependency
```bash
npm install
```
(socket.io was added to package.json — this pulls it in)

### 3. Start the server
```bash
npm start
```
You should see:
```
Server running on http://localhost:5000
Socket.IO ready for real-time connections
```

## Testing the new REST endpoints (servers & channels)

All of these need `Authorization: Bearer YOUR_TOKEN` header — get a token by
logging in first (same as Week 1).

**Create a server:**
```bash
curl -X POST http://localhost:5000/api/servers -H "Content-Type: application/json" -H "Authorization: Bearer YOUR_TOKEN" -d "{\"name\":\"My First Server\"}"
```
This also auto-creates a default "general" channel — note the `defaultChannel.id`
in the response, you'll need it below.

**List your servers:**
```bash
curl http://localhost:5000/api/servers -H "Authorization: Bearer YOUR_TOKEN"
```

**List channels in a server** (replace `1` with your server's id):
```bash
curl http://localhost:5000/api/servers/1/channels -H "Authorization: Bearer YOUR_TOKEN"
```

## Testing real-time chat (the actual fun part)

1. Open `test-client.html` directly in your browser (just double-click the file,
   or right click → Open with → your browser)
2. Paste your JWT token (from login) into the token field
3. Type the channel ID from the server you created (probably `1` if it's your first)
4. Click **Connect & Join Channel**
5. Type a message, hit Enter

**To really see "real-time" in action:** open the same `test-client.html` file
in **two separate browser windows** (or two tabs), connect both with tokens
from two different logged-in users, join the same channel ID in both, and send
a message from one — it should instantly appear in the other, with no refresh.

## What this proves
If two windows can chat live with each other, you have a genuinely working
real-time chat system — the hardest technical part of this whole project.
Everything after this (media, roles, mobile) builds on top of this working core.

## Next (Week 6)
Media uploads (images, GIFs) and emoji reactions.
