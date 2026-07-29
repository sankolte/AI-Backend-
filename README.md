# AI Backend — Full-Stack AI Chat Platform

A full-stack AI chat application with user authentication, persistent conversations, and real-time streaming responses from OpenAI. Users can sign up, start multiple chat sessions, pick an AI model, and receive streamed replies — similar to ChatGPT-style interfaces.

---

## What We Have Built So Far

| Layer | Status | Description |
|-------|--------|-------------|
| **Backend API** | ✅ Complete | Express 5 REST API with chat CRUD, messaging, and SSE streaming |
| **Database** | ✅ Complete | PostgreSQL via Prisma — Users, Chats, Messages |
| **Authentication** | ✅ Complete | Clerk auth (JWT) + webhook sync to local DB |
| **AI Integration** | ✅ Complete | OpenAI streaming completions (GPT-4o, GPT-4o Mini, o1, o3-mini) |
| **Frontend** | ✅ Complete | React 19 + Vite chat UI with sidebar, dark/light theme |
| **Deployment** | ✅ Configured | Backend on Vercel (serverless), frontend on Vercel |

---

## Main Purpose

This project is an **AI-powered chat workspace** where:

1. Users **sign up / sign in** through Clerk (no custom password handling).
2. Each user gets a **personal dashboard** with a list of conversations.
3. Users can **create, rename, delete, and switch** between chats.
4. Messages are **saved to PostgreSQL** and sent to **OpenAI** for AI replies.
5. AI responses are **streamed in real time** (Server-Sent Events) so text appears token-by-token.
6. Users can **choose the OpenAI model** per session (GPT-4o, GPT-4o Mini, o1, o3-mini).

---

## Tech Stack

### Backend
- **Node.js** + **Express 5** (ES modules)
- **Prisma 7** + **PostgreSQL** (Neon-compatible)
- **Clerk** (`@clerk/express`) — authentication
- **OpenAI SDK** — AI completions
- **Zod** — request validation
- **Svix** — Clerk webhook signature verification

### Frontend
- **React 19** + **Vite 8**
- **React Router 7** — routing
- **Clerk React** — auth UI & session tokens
- **Lucide React** — icons
- Custom CSS with **dark / light theme** support

### Deployment
- **Vercel** — both backend (serverless via `api/index.js`) and frontend

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND (React)                         │
│  Landing → Sign In/Up → Dashboard (ChatWorkspace)               │
│       ↓ Clerk JWT          ↓ fetch + SSE stream                 │
└──────────────────────────────┬──────────────────────────────────┘
                               │ HTTPS (Bearer token)
┌──────────────────────────────▼──────────────────────────────────┐
│                     BACKEND (Express on Vercel)                   │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────────────────┐  │
│  │ Clerk Auth  │  │ Controllers  │  │ Services                │  │
│  │ Middleware  │→ │ chat, user   │→ │ chat.service, ai.service│  │
│  └─────────────┘  └──────────────┘  └───────────┬─────────────┘  │
│                                                    │               │
│  ┌─────────────────────────────────────────────────▼───────────┐  │
│  │              Prisma ORM → PostgreSQL                        │  │
│  │              Users → Chats → Messages                       │  │
│  └─────────────────────────────────────────────────────────────┘  │
│                                                    │               │
│  ┌─────────────────────────────────────────────────▼───────────┐  │
│  │              OpenAI API (streaming chat completions)        │  │
│  └─────────────────────────────────────────────────────────────┘  │
└───────────────────────────────────────────────────────────────────┘

Clerk Webhook (user.created / updated / deleted) → syncs Users table
```

---

## Project Structure

```
AI Backend/
├── api/
│   └── index.js                 # Vercel serverless entry → exports Express app
├── DB/
│   └── db.config.js             # Prisma client + pg pool adapter
├── prisma/
│   ├── schema.prisma            # User, Chat, Message models
│   └── migrations/              # Database migration history
├── src/
│   ├── app.js                   # Express app setup, CORS, routes, error handler
│   ├── server.js                # Local dev server (nodemon)
│   ├── controllers/
│   │   ├── chat.controller.js   # Chat & message HTTP handlers
│   │   ├── userController.js    # User CRUD handlers
│   │   └── webhookController.js # Clerk webhook (Svix verified)
│   ├── middlewares/
│   │   ├── authMiddleware.js    # requireAuth — extracts clerkId from JWT
│   │   └── validateMiddleware.js# User create/update Zod validation
│   ├── routes/
│   │   ├── chat.routes.js       # /api/v1/chats/*
│   │   ├── userRoute.js         # /api/user/*
│   │   └── webhookRoute.js      # /api/webhook/clerk (raw body)
│   ├── services/
│   │   ├── chat.service.js      # Business logic: chats, messages, SSE stream
│   │   └── ai.service.js        # OpenAI streaming wrapper
│   ├── validations/
│   │   ├── chat.validation.js   # Zod schemas for chat endpoints
│   │   └── message.validation.js# Zod schemas for message endpoints
│   ├── schema/
│   │   └── user.schema.js       # Zod schemas for user endpoints
│   └── utils/
│       ├── expressError.js      # Custom error class (statusCode + message)
│       └── wrapAsync.js         # Async route error wrapper
├── frontend/
│   ├── src/
│   │   ├── App.jsx              # Routes + ClerkProvider + ThemeProvider
│   │   ├── pages/
│   │   │   ├── Landing.jsx      # Marketing landing page
│   │   │   ├── SignInPage.jsx   # Clerk sign-in
│   │   │   ├── SignUpPage.jsx   # Clerk sign-up
│   │   │   ├── Dashboard.jsx    # Wrapper for ChatWorkspace
│   │   │   └── ChatWorkspace.jsx# Main chat UI (state + API calls)
│   │   ├── components/
│   │   │   ├── chat/            # ChatSidebar, ChatHeader, ChatMessage, etc.
│   │   │   ├── Layout.jsx       # App shell (nav, footer)
│   │   │   ├── ProtectedRoute.jsx
│   │   │   └── ThemeToggle.jsx
│   │   ├── context/
│   │   │   └── ThemeContext.jsx # Dark/light mode
│   │   └── utils/
│   │       └── api.js           # All backend API + SSE stream helpers
│   └── vercel.json
├── package.json                 # Backend dependencies
└── vercel.json                  # Backend Vercel rewrites
```

---

## Database Schema

Three related tables managed by Prisma:

```
User                          Chat                         Message
─────────────────────         ─────────────────────        ─────────────────────
id (UUID, PK)                 id (UUID, PK)                id (UUID, PK)
name                          title (optional)             role ("user"|"assistant")
email (unique)                userId → User.id             content
clerkId (unique)              createdAt, updatedAt         chatId → Chat.id
createdAt, updatedAt          messages[]                   createdAt
chats[]
```

- **Cascade deletes**: Deleting a User removes their Chats; deleting a Chat removes its Messages.
- **Clerk sync**: `clerkId` links the Clerk account to the local `User` row.

---

## Authentication Flow

1. User signs up / signs in via **Clerk** on the frontend.
2. Frontend calls protected API routes with `Authorization: Bearer <Clerk JWT>`.
3. Backend `requireAuth` middleware uses `@clerk/express` to verify the token and set `req.clerkId`.
4. **Webhook** (`POST /api/webhook/clerk`): Clerk sends `user.created`, `user.updated`, `user.deleted` events → backend upserts/deletes the local User record.
5. **Fallback provisioning**: If a user is authenticated but not yet in the DB (e.g. webhook delay), `chat.service.js` auto-creates a minimal User record on first chat action.

---

## AI Chat Flow (Streaming)

When a user sends a message from the dashboard:

1. **Frontend** (`ChatWorkspace.jsx`):
   - If no active chat → creates one via `POST /api/v1/chats`.
   - Optimistically adds user + empty assistant messages to the UI.
   - Calls `streamMessage()` → `POST /api/v1/chats/:chatId/messages/stream`.

2. **Backend** (`chat.service.js` → `streamMessage`):
   - Saves the user message to the database.
   - Loads the last **15 messages** as conversation context.
   - Sets **SSE headers** and streams OpenAI chunks to the client.
   - On completion, saves the full assistant reply and sends a `done` event.

3. **SSE event types**:
   | Event | Payload | Purpose |
   |-------|---------|---------|
   | `user_message` | Saved user Message object | Replace temp ID with real DB ID |
   | `chunk` | `{ content: "..." }` | Incremental AI text |
   | `done` | Saved assistant Message object | Final message + stream end |
   | `error` | `{ message: "..." }` | AI or server error |
   | `[DONE]` | — | Stream closed |

4. **Frontend** parses SSE lines and updates the assistant bubble in real time.

---

## API Reference

### Health
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/` | No | Root status |
| GET | `/api/health` | No | Health check |

### Users (`/api/user`)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/` | No | Create user in DB (after Clerk signup) |
| GET | `/me` | Yes | Current user profile + chats |
| GET | `/:id` | Yes | Get user by ID |
| PUT | `/:id` | Yes | Update name/email |
| DELETE | `/:id` | Yes | Delete user |

### Chats (`/api/v1/chats`) — all require auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/` | Create new chat |
| GET | `/` | List user's chats (paginated: `page`, `limit`) |
| GET | `/:chatId` | Get chat with all messages |
| PATCH | `/:chatId` | Rename chat (`title`) |
| DELETE | `/:chatId` | Delete chat + messages |
| POST | `/:chatId/messages` | Send message (non-streaming) |
| GET | `/:chatId/messages` | Get messages (cursor pagination) |
| POST | `/:chatId/messages/stream` | Send message + stream AI reply (SSE) |

### Webhook
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/webhook/clerk` | Clerk user lifecycle events (Svix signed) |

---

## Frontend Pages & Features

| Route | Page | Description |
|-------|------|-------------|
| `/` | Landing | Hero + feature cards; CTA to sign up or dashboard |
| `/sign-in/*` | SignInPage | Clerk sign-in component |
| `/sign-up/*` | SignUpPage | Clerk sign-up component |
| `/dashboard` | Dashboard | New chat (empty state with prompt starters) |
| `/dashboard/:chatId` | Dashboard | Existing conversation |
| `/c/:chatId` | Dashboard | Alternate chat URL alias |

### Chat UI Features
- **Sidebar**: conversation list, new chat, rename, delete, collapse toggle
- **Chat header**: inline title edit, model selector (GPT-4o, GPT-4o Mini, o3-mini, o1)
- **Message feed**: user/assistant bubbles, typing indicator during stream
- **Prompt starters**: suggested prompts on empty chat
- **Theme toggle**: dark / light mode via `ThemeContext`
- **Protected routes**: unauthenticated users redirected to sign-in

---

## Environment Variables

### Backend (root `.env`)
```env
DATABASE_URL=postgresql://...          # PostgreSQL connection string
CLERK_SECRET_KEY=sk_...                # Clerk backend secret
CLERK_WEBHOOK_SECRET=whsec_...         # Clerk webhook signing secret
OPENAI_API_KEY=sk-...                  # OpenAI API key
FRONTEND_URL=https://your-app.vercel.app  # Optional CORS origin
PORT=3000                              # Local dev port
```

### Frontend (`frontend/.env`)
```env
VITE_CLERK_PUBLISHABLE_KEY=pk_...      # Clerk publishable key
VITE_API_URL=http://localhost:3000     # Backend URL (production: Vercel backend URL)
```

---

## Running Locally

### Prerequisites
- Node.js 18+
- PostgreSQL database (e.g. Neon)
- Clerk application (publishable + secret keys, webhook configured)
- OpenAI API key

### Backend
```bash
# From project root
npm install
npx prisma generate
npx prisma migrate deploy   # or: npx prisma migrate dev

npm run dev                 # Starts on http://localhost:3000
```

### Frontend
```bash
cd frontend
npm install
npm run dev                 # Starts Vite dev server (usually http://localhost:5173)
```

---

## Key Design Decisions

1. **Clerk for auth, local DB for data** — Clerk handles identity; PostgreSQL stores profiles, chats, and messages. Webhooks keep them in sync.

2. **Service layer pattern** — Controllers are thin; `chat.service.js` holds ownership checks, DB operations, and streaming logic.

3. **SSE over WebSockets** — Streaming uses Server-Sent Events for simpler HTTP-based real-time updates (works well on Vercel serverless).

4. **Auto-provision users** — Chat service creates a fallback User if Clerk auth succeeds but the webhook hasn't fired yet, avoiding 404s on first use.

5. **Conversation context window** — Only the last 15 messages are sent to OpenAI to balance context quality and token cost.

6. **Zod validation** — All chat/message/user inputs are validated before hitting business logic.

7. **Monorepo layout** — Backend at root, frontend in `/frontend`, both deployable independently to Vercel.

---

## Deployment

- **Backend**: Vercel serverless — `vercel.json` rewrites all routes to `api/index.js`, which exports the Express app.
- **Frontend**: Separate Vercel project — `frontend/vercel.json` for SPA routing.
- **Database**: Hosted PostgreSQL (migrations in `prisma/migrations/`).
- **Clerk webhook**: Point to `https://<backend-url>/api/webhook/clerk`.

---

## What's Next (Potential Extensions)

These are **not built yet** — ideas for future work:

- Message editing / regeneration
- File upload & vision (image inputs)
- RAG / document knowledge base
- Rate limiting & usage quotas
- Admin panel
- Mobile-responsive polish
- Unit / integration tests

---

## Quick Mental Model

> **Clerk** knows *who* the user is.  
> **PostgreSQL** knows *what* they said and *which chats* they have.  
> **OpenAI** generates the *AI replies*.  
> **Express** connects everything.  
> **React** is the chat interface the user sees.

That is the complete picture of what this codebase does today.
