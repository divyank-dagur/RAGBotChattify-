# RAGBot Chattify

A full-stack AI chatbot with **Retrieval Augmented Generation (RAG)** — conversations grounded in your documents.

Built with **FastAPI** + **Next.js**, featuring real-time streaming, multi-model support, knowledge base management, and a custom "Liquid Noir" design system.

![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![FastAPI](https://img.shields.io/badge/FastAPI-0.104+-009688?logo=fastapi)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript)
![Tailwind](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss)
![Python](https://img.shields.io/badge/Python-3.9+-3776AB?logo=python)

---

## Features

### Chat
- **Real-time streaming** — Server-Sent Events (SSE) deliver tokens as they're generated
- **Multi-model support** — Switch between OpenAI (GPT-4o, GPT-4.1) and Anthropic (Claude Sonnet 4.6, Haiku 4.5)
- **Markdown rendering** — Code blocks with syntax highlighting, tables, lists, blockquotes
- **Conversation management** — Create, rename, delete, and browse chat history
- **Auto-titling** — Chats are automatically named from your first message

### RAG (Retrieval Augmented Generation)
- **Knowledge Collections** — Organize documents into named groups
- **Document ingestion** — Upload PDF, TXT, MD, CSV, JSON files
- **Vector search** — Documents are chunked, embedded, and stored in ChromaDB
- **Context-aware responses** — Attach a collection to a chat for grounded answers
- **Citation chips** — Inline source references with confidence scores and previews

### Sharing & Collaboration
- **Share links** — Generate public read-only URLs for any conversation
- **Voting** — Thumbs up/down on assistant messages

### Design
- **Liquid Noir theme** — Warm amber accents through charcoal surfaces, noise textures, glass-morphism
- **Dark / Light mode** — Full theme toggle
- **Micro-animations** — Message appear effects, streaming cursor, hover transitions
- **Responsive layout** — Collapsible sidebar, mobile-friendly

---

## Architecture

```
┌─────────────────┐         SSE Stream          ┌─────────────────┐
│                 │  ◄────────────────────────   │                 │
│   Next.js 16    │         REST API             │    FastAPI      │
│   (Frontend)    │  ────────────────────────►   │    (Backend)    │
│                 │                              │                 │
│  - React 19     │                              │  - SQLAlchemy   │
│  - Tailwind v4  │                              │  - SQLite       │
│  - shadcn/ui    │                              │  - ChromaDB     │
│  - SSE Parser   │                              │  - JWT Auth     │
└─────────────────┘                              └────────┬────────┘
                                                          │
                                                 ┌────────┴────────┐
                                                 │   LLM Providers │
                                                 │  - OpenAI API   │
                                                 │  - Anthropic API│
                                                 └─────────────────┘
```

---

## Getting Started

### Prerequisites

- Python 3.9+
- Node.js 20+
- An OpenAI or Anthropic API key

### Backend Setup

```bash
cd backend

# Create virtual environment
python3 -m venv .venv
source .venv/bin/activate

# Install dependencies
pip install --upgrade pip
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env and add your API keys

# Start the server
uvicorn app.main:app --reload --port 8000
```

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start dev server
npm run dev
```

Open **http://localhost:3000** — register an account and start chatting.

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Create account |
| POST | `/api/auth/login` | Sign in |
| GET | `/api/auth/me` | Current user |
| GET | `/api/chats` | List conversations |
| POST | `/api/chats` | Create conversation |
| GET | `/api/chats/:id` | Get chat with messages |
| POST | `/api/chats/:id/messages` | Send message (SSE stream) |
| POST | `/api/chats/:id/share` | Generate share link |
| GET | `/api/collections` | List knowledge collections |
| POST | `/api/collections` | Create collection |
| POST | `/api/collections/:id/documents` | Upload document |
| GET | `/api/models` | List available LLMs |

---

## Project Structure

```
RAGBotChattify/
├── backend/
│   ├── app/
│   │   ├── api/            # Route handlers
│   │   ├── core/           # Auth, dependencies
│   │   ├── models/         # SQLAlchemy ORM models
│   │   ├── schemas/        # Pydantic request/response schemas
│   │   ├── services/       # LLM, streaming, RAG, ingestion
│   │   └── vector_store/   # ChromaDB integration
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── app/            # Next.js App Router pages
│   │   ├── components/     # React components
│   │   │   ├── chat/       # Chat UI (messages, input, header)
│   │   │   ├── sidebar/    # Chat history sidebar
│   │   │   ├── knowledge/  # Document management
│   │   │   ├── artifacts/  # Code/text editor panel
│   │   │   └── auth/       # Login/register forms
│   │   ├── hooks/          # Custom React hooks
│   │   └── lib/            # API client, types, utilities
│   └── Dockerfile
└── docker-compose.yml
```

---

## Deployment

### Frontend (Vercel)

1. Import the repo on [vercel.com](https://vercel.com)
2. Set **Root Directory** to `frontend`
3. Add env variable: `NEXT_PUBLIC_API_URL` = your backend URL
4. Deploy

### Backend (Render)

1. Create a new Web Service on [render.com](https://render.com)
2. Set **Root Directory** to `backend`
3. **Build Command:** `pip install -r requirements.txt`
4. **Start Command:** `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
5. Add environment variables: `OPENAI_API_KEY`, `JWT_SECRET`, `CORS_ORIGINS`

---

## Tech Stack

**Backend:** FastAPI, SQLAlchemy, SQLite, ChromaDB, Pydantic, JWT, SSE

**Frontend:** Next.js 16, React 19, TypeScript, Tailwind CSS v4, shadcn/ui, react-markdown

**AI:** OpenAI API, Anthropic API, LangChain Text Splitters

---

## License

MIT
