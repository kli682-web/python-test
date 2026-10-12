Forkcast

**AI-powered food discovery for University of Auckland students.**

[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)](https://vite.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-Express-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/Database-MongoDB-47A248?logo=mongodb&logoColor=white)](https://www.mongodb.com/)

Forkcast is a full-stack restaurant recommendation platform created as a six-person University of Auckland COMPSCI 732 project. It helps students decide what to eat around campus by turning natural-language requests—such as a preferred dish, cuisine, drink, or budget—into grounded recommendations from a dataset of **49 restaurants** and **1,901 menu items**.

The application combines structured filtering, keyword matching, lightweight vector retrieval, semantic ranking, and business rules. DeepSeek can generate concise explanations for the retrieved results, while a deterministic fallback keeps recommendations available when an AI API key is not configured.

## Highlights

- Conversational food and drink recommendations
- Budget-, cuisine-, dish-, and meal-type filtering
- Food-and-drink combination suggestions within a total budget
- Hybrid retrieval across menu items and restaurant information
- Structured recommendation cards with prices, ratings, addresses, and map links
- Follow-up questions when the request needs more detail
- Email/password and Google authentication foundations
- User profiles and protected API routes
- Local chat-session history in the browser
- Graceful fallback behaviour when AI or database services are unavailable
- Responsive React interface for desktop and mobile screens

## Technology Stack

| Area | Technologies |
| --- | --- |
| Front end | React 19, Vite, React Router, Tailwind CSS, Axios, Lucide React |
| Back end | Node.js, Express, REST APIs |
| Database | MongoDB, Mongoose |
| Recommendation pipeline | Query parsing, keyword retrieval, hashed vector embeddings, semantic ranking, score fusion |
| AI | DeepSeek chat completion with grounded structured output and deterministic fallback |
| Authentication | JWT, bcrypt, Google OAuth |
| Email | Resend |

## Primary Implementation

This repository contains several development snapshots. The most complete version is located at:

```text
4.8-group-project-l2hard-main/
└── group-project-l2hard-main/
    ├── Backend/
    └── Frontend/
```

The other top-level folders are earlier prototypes or feature-branch snapshots retained for development history.

## Architecture

```text
React client
    │
    │  REST / JSON
    ▼
Express API
    ├── Authentication and profile routes
    ├── Query and conversation parsing
    ├── Hybrid retrieval and score fusion
    └── Structured recommendation composer
            │
            ├── MongoDB restaurant and menu data
            └── DeepSeek API (optional explanation generation)
```

## Getting Started

### Prerequisites

- Node.js 20 or later
- npm
- MongoDB running locally or a MongoDB Atlas connection string
- A DeepSeek API key for AI-generated explanations (optional)
- Google OAuth and Resend credentials if you want to use those authentication flows

### 1. Clone the repository

```bash
git clone https://github.com/kli682-web/python-test.git
cd python-test/4.8-group-project-l2hard-main/group-project-l2hard-main
```

### 2. Configure and start the back end

```bash
cd Backend
npm install
cp .env.example .env
```

Update `Backend/.env` with your local values:

```env
MONGODB_URI=mongodb://localhost:27017/forkcast
PORT=3000
JWT_SECRET=replace-with-a-long-random-secret

# Optional AI-generated explanations
DEEPSEEK_API_KEY=
DEEPSEEK_MODEL=deepseek-chat
DEEPSEEK_API_BASE=https://api.deepseek.com/chat/completions

# Optional Google authentication
GOOGLE_CLIENT_ID=

# Optional email verification
RESEND_API_KEY=
RESEND_FROM_EMAIL=
```

Seed the restaurant and menu data, then start the API:

```bash
npm run seed
npm run dev
```

The back end runs at `http://localhost:3000`.

### 3. Start the front end

Open a second terminal:

```bash
cd 4.8-group-project-l2hard-main/group-project-l2hard-main/Frontend
npm install
npm run dev
```

Open `http://localhost:5173` in your browser. Vite proxies `/api` requests to the Express server on port `3000`.

> On Windows PowerShell, replace `cp .env.example .env` with `Copy-Item .env.example .env`.

## Useful Commands

### Back end

```bash
npm run dev                  # Start the API server
npm run seed                 # Import restaurant and menu data into MongoDB
node src/scripts/reindexRag.js  # Rebuild the retrieval index
```

### Front end

```bash
npm run dev      # Start the Vite development server
npm run build    # Create a production build
npm run lint     # Run ESLint
npm run preview  # Preview the production build
```

## API Overview

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/api/test` | Check API availability |
| `POST` | `/api/ai/chat` | Generate grounded recommendations |
| `POST` | `/api/ai/title` | Generate a conversation title |
| `POST` | `/api/auth/login` | Sign in with email and password |
| `POST` | `/api/auth/send-code` | Send an email verification code |
| `POST` | `/api/auth/verify-code` | Verify a code and register an account |
| `POST` | `/api/auth/google` | Sign in with Google |
| `GET/PUT` | `/api/profile` | Read or update the authenticated user's profile |

## My Contribution

Kehan Li (Adam) contributed primarily to the front-end and user-facing integration work:

- Set up reusable React and Vite front-end foundations
- Built login and registration interfaces
- Integrated user profile and favourites features with back-end REST APIs
- Handled guest and signed-in user states
- Added graceful front-end behaviour when MongoDB was unavailable
- Collaborated through feature branches, pull requests, and code review

## Team

Forkcast was developed by Team L2HARD:

- Runyu Han
- Jiayi He
- Alan Ho
- Kehan Li
- Zhenyu Luo
- Yuxin Wu

## Project Context

This repository is an academic team project and a portfolio record. It is not currently presented as a production service. Before a public deployment, move all client IDs and service configuration into environment variables, restrict allowed origins, add automated tests, and review authentication and data-handling settings.

