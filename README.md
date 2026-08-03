# Chat App Backend — Week 1 (Auth)

## What's here
- Signup / Login with hashed passwords (bcrypt) + JWT tokens
- A protected `/me` route to prove the auth flow works end-to-end

## Setup steps

### 1. Create a free Supabase project
- Go to https://supabase.com → New Project (free tier)
- Once created, go to **Project Settings → Database → Connection string**
- Copy the connection string (URI format)

### 2. Configure environment
```bash
cp .env.example .env
```
Open `.env` and paste:
- your Supabase connection string into `DATABASE_URL`
- any long random string into `JWT_SECRET` (e.g. run `openssl rand -hex 32` to generate one)

### 3. Create the users table
- In Supabase, go to **SQL Editor**
- Paste the contents of `src/config/schema.sql` and run it

### 4. Install & run
```bash
npm install
npm start
```
You should see: `Server running on http://localhost:5000`

## Testing it (use Postman, Insomnia, or curl)

**Signup:**
```bash
curl -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","email":"test@example.com","password":"password123"}'
```
You'll get back a `user` object and a `token`.

**Login:**
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

**Test the protected route** (replace TOKEN with the one you got back):
```bash
curl http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer TOKEN"
```
If this returns your user info, Week 1 is officially done — signup, login,
and protected routes all work end-to-end.

## Next (Week 3)
We'll add `servers`, `channels`, and `messages` tables, plus Socket.IO for
real-time chat.
