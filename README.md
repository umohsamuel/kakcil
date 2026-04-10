# Kakcil

An AI council chatbot platform that uses democratic consensus from multiple language models. Rather than relying on a single AI for answers, Kakcil orchestrates a configurable "council" of models (GPT-4, Claude, Gemini, and others) that each generate responses, evaluate one another, and vote on the best answer.

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Database](#database)
- [API Reference](#api-reference)
- [Contributing](#contributing)
- [License](#license)

## Overview

When a user sends a message, all council members generate responses in parallel. Each model then scores the other responses on accuracy, completeness, clarity, relevance, and conciseness. The response with the most votes is selected as the final answer. Users can view all responses, inspect voting breakdowns, branch conversations from any response, and adjust their council composition at any time.

## Features

**AI Council System**

- Select which AI models form your council from providers including OpenAI, Anthropic, and Google
- Default council provided for new users (GPT-4o-mini and Gemini 2.0 Flash Lite)
- Add, remove, or reset council members at any time

**Consensus Chat**

- All council models respond simultaneously to each user message
- Multi-criteria voting determines the winning response
- Real-time streaming via Server-Sent Events
- Full conversation history with branching support

**Conversation Branching**

- Branch from any AI response to explore alternative threads
- Independent discussion trees with parent-child tracking
- Mark branches as active or inactive

**API Key Management**

- Bring your own API keys for OpenAI, Anthropic, or Google
- Keys are encrypted at rest
- Enable or disable keys without deletion

**Subscription Tiers**

- Free tier with limited daily and monthly message counts
- Plus and Pro tiers with higher limits and access to advanced models
- Payments handled through Paystack

**User Accounts**

- Registration with email verification
- JWT-based authentication with refresh tokens
- Profile management

## Tech Stack

### Backend

| Component      | Technology                                |
| -------------- | ----------------------------------------- |
| Runtime        | Bun                                       |
| Framework      | Express.js 5                              |
| Language       | TypeScript                                |
| Database       | PostgreSQL                                |
| Authentication | Passport.js, JWT                          |
| AI Integration | Vercel AI SDK (OpenAI, Anthropic, Google) |
| Payments       | Paystack                                  |
| Email          | Nodemailer                                |
| Validation     | Zod                                       |
| Security       | Helmet, bcryptjs                          |

### Frontend

| Component     | Technology               |
| ------------- | ------------------------ |
| Framework     | Next.js 16 (App Router)  |
| Language      | TypeScript               |
| Styling       | Tailwind CSS 4           |
| UI Components | Radix UI                 |
| Client State  | Zustand                  |
| Server State  | TanStack React Query     |
| Visualization | ReactFlow                |
| Markdown      | react-markdown with GFM  |
| Theming       | next-themes (dark/light) |

## Architecture

The backend follows clean architecture principles with clear separation of concerns:

```
Ports (HTTP)
  Routes, middleware, request handling
      |
Services (Business Logic)
  Authentication, Chat, Council, LLM, Subscription, Payment
      |
Adapters (Data Access)
  User, Chat, Council, LLM, Subscription, API Key adapters
      |
Domain (Entities and Repositories)
  Entity definitions, repository interfaces
      |
Infrastructure
  PostgreSQL, LLM providers, email, payments, secrets
```

## Getting Started

### Prerequisites

- [Bun](https://bun.sh) v1.2.21 or later
- [Node.js](https://nodejs.org) v18 or later (for the frontend)
- [pnpm](https://pnpm.io) (frontend package manager)
- PostgreSQL 15 or later
- Docker (optional, for containerized setup)

### Backend

```bash
cd api
bun install
cp .env                # then fill in your values
bun migrate            # run database migrations
bun dev                # starts the server on port 8080
```

### Frontend

```bash
cd ui
pnpm install
cp .env                      # then fill in your values
pnpm dev                     # starts Next.js on port 3000
```

### Docker

A `compose.yaml` is provided in the `api/` directory for running the backend and database together:

```bash
cd api
docker compose up
```

## Environment Variables

### Backend (`api/.env`)

**Server**

| Variable        | Description                             |
| --------------- | --------------------------------------- |
| `SERVER_PORT`   | Port for the API server (default: 8080) |
| `CLIENT_ORIGIN` | Allowed CORS origin for the frontend    |

**Authentication**

| Variable              | Description                         |
| --------------------- | ----------------------------------- |
| `COOKIE_EXPIRES`      | Cookie expiry in seconds            |
| `COOKIE_SECRET`       | Secret for signing cookies          |
| `JWT_SECRET`          | Secret for access tokens            |
| `JWT_EXPIRES`         | Access token expiry in seconds      |
| `REFRESH_JWT_SECRET`  | Secret for refresh tokens           |
| `REFRESH_JWT_EXPIRES` | Refresh token expiry in seconds     |
| `ENCRYPTION_KEY`      | Key used to encrypt stored API keys |

**Database**

| Variable     | Description       |
| ------------ | ----------------- |
| `PGHOST`     | PostgreSQL host   |
| `PGDATABASE` | Database name     |
| `PGUSER`     | Database user     |
| `PGPASSWORD` | Database password |
| `PGPORT`     | Database port     |

**LLM Providers** (at least one required)

| Variable                       | Description       |
| ------------------------------ | ----------------- |
| `OPENAI_API_KEY`               | OpenAI API key    |
| `ANTHROPIC_API_KEY`            | Anthropic API key |
| `GOOGLE_GENERATIVE_AI_API_KEY` | Google AI API key |

**Email**

| Variable          | Description                          |
| ----------------- | ------------------------------------ |
| `MAILER_USER`     | Email address for sending mail       |
| `MAILER_PASSWORD` | App password for the email account   |
| `MAILER_SERVICE`  | Email service provider (e.g., gmail) |

**Payments**

| Variable              | Description         |
| --------------------- | ------------------- |
| `PAYSTACK_SECRET_KEY` | Paystack secret key |

### Frontend (`ui/.env.local`)

| Variable              | Description            |
| --------------------- | ---------------------- |
| `NEXT_PUBLIC_API_URL` | URL of the backend API |

## Database

The project uses PostgreSQL with migration-based schema management. Migrations are located in `api/migrations/` and are run using:

```bash
bun migrate            # apply pending migrations
bun migrate:rollback   # roll back the last migration
```

### Schema Overview

| Table               | Purpose                                               |
| ------------------- | ----------------------------------------------------- |
| `users`             | User accounts, verification status, subscription tier |
| `chats`             | Conversation sessions                                 |
| `chat_messages`     | Messages with parent-child tracking for branching     |
| `chat_branches`     | Alternative conversation branches                     |
| `council_members`   | Per-user AI council configuration                     |
| `council_responses` | Model responses with voting scores and winner flag    |
| `user_api_keys`     | Encrypted provider API keys                           |
| `subscriptions`     | Subscription status, renewal dates, payment details   |

## API Reference

### Authentication

| Method | Endpoint              | Description              |
| ------ | --------------------- | ------------------------ |
| POST   | `/auth/register`      | Create an account        |
| POST   | `/auth/login`         | Sign in                  |
| GET    | `/auth/token/refresh` | Refresh the access token |
| GET    | `/auth/token/clear`   | Log out                  |

### Users (protected)

| Method | Endpoint                     | Description       |
| ------ | ---------------------------- | ----------------- |
| GET    | `/api/v1/users`              | List all users    |
| GET    | `/api/v1/users/id/:id`       | Get user by ID    |
| GET    | `/api/v1/users/email/:email` | Get user by email |
| PATCH  | `/api/v1/users/update`       | Update profile    |
| DELETE | `/api/v1/users/delete/:id`   | Delete account    |

### Chats (protected)

| Method | Endpoint               | Description                   |
| ------ | ---------------------- | ----------------------------- |
| POST   | `/api/v1/chats`        | Send a message to the council |
| GET    | `/api/v1/chats`        | Get conversation history      |
| POST   | `/api/v1/chats/stream` | Stream responses via SSE      |

### Council (protected)

| Method | Endpoint                 | Description                 |
| ------ | ------------------------ | --------------------------- |
| GET    | `/api/v1/council`        | Get current council members |
| POST   | `/api/v1/council`        | Update council composition  |
| GET    | `/api/v1/council/models` | List available models       |

### API Keys (protected)

| Method | Endpoint              | Description      |
| ------ | --------------------- | ---------------- |
| POST   | `/api/v1/api-key`     | Add an API key   |
| GET    | `/api/v1/api-key`     | List stored keys |
| DELETE | `/api/v1/api-key/:id` | Remove a key     |

### Subscriptions (protected)

| Method | Endpoint               | Description                    |
| ------ | ---------------------- | ------------------------------ |
| GET    | `/api/v1/subscription` | Get subscription status        |
| POST   | `/api/v1/subscription` | Create or upgrade subscription |

### Webhooks

| Method | Endpoint            | Description                    |
| ------ | ------------------- | ------------------------------ |
| POST   | `/webhook/paystack` | Paystack payment event handler |

### Health

| Method | Endpoint  | Description         |
| ------ | --------- | ------------------- |
| GET    | `/health` | Server status check |

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/your-feature`)
3. Commit your changes (`git commit -m "Add your feature"`)
4. Push to the branch (`git push origin feature/your-feature`)
5. Open a pull request

Please make sure your code passes any existing linting and type checks before submitting.

## License

This project is open source. See the repository for license details.
