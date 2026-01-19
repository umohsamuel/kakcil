# AI Government Council - Frontend Setup

This is the frontend application for the AI Government Council chatbot project.

## Tech Stack

- **Next.js 16** - React framework with App Router
- **TypeScript** - Strict typing
- **TanStack Query (React Query)** - Server state management and API integration
- **Zustand** - Client state management (auth)
- **Axios** - HTTP client
- **Tailwind CSS** - Styling

## Project Structure

```
ui/src/
├── app/                    # Next.js App Router pages
│   ├── chat/              # Chat interface (protected)
│   ├── login/             # Login page
│   ├── register/          # Registration page
│   └── layout.tsx         # Root layout with providers
├── components/            # Reusable components
│   ├── council-debate.tsx # Debate animation UI
│   ├── message-input.tsx  # Chat input component
│   ├── message-list.tsx   # Message display
│   ├── protected-route.tsx # Auth guard
│   └── loading.tsx        # Loading states
├── hooks/                 # Custom React hooks
│   ├── use-auth.ts       # Authentication hook
│   └── use-chat.ts       # Chat functionality hook
├── lib/                   # Utilities
│   ├── api-client.ts     # Axios instance with interceptors
│   └── query-keys.ts     # Centralized query keys
├── providers/             # React context providers
│   └── query-provider.tsx # React Query provider
├── services/              # API service layer
│   ├── auth.service.ts   # Auth endpoints
│   ├── chat.service.ts   # Chat endpoints
│   └── user.service.ts   # User endpoints
├── store/                 # Zustand stores
│   └── auth.store.ts     # Auth state
└── types/                 # TypeScript types
    ├── api.ts            # API response types
    ├── auth.ts           # Auth types
    ├── chat.ts           # Chat types
    └── user.ts           # User types
```

## Setup Instructions

1. **Install dependencies:**

   ```bash
   pnpm install
   ```

2. **Configure environment variables:**
   Copy `.env.local.example` to `.env.local` and update:

   ```bash
   NEXT_PUBLIC_API_URL=http://localhost:8080
   ```

3. **Run the development server:**

   ```bash
   pnpm dev
   ```

4. **Open the app:**
   Navigate to [http://localhost:3001](http://localhost:3001)

## Features

### Authentication Flow

- **Register**: Create a new account at `/register`
- **Login**: Sign in at `/login`
- **Protected Routes**: Chat page requires authentication
- **Auto-redirect**: Unauthenticated users redirected to login
- **Token Management**: Automatic token refresh on 401 errors

### Chat Interface

- **Real-time messaging**: Send messages to the AI council
- **Council debate animation**: Visual representation of AI models deliberating
- **Response display**: Shows the winning response from the council
- **Message history**: Maintains conversation history in state

### API Integration

- **Centralized API client**: Single axios instance with interceptors
- **Service layer**: Separate services for auth, chat, and user operations
- **Type-safe**: All API calls are fully typed
- **Query keys**: Centralized query key management for cache invalidation

## API Endpoints Used

### Authentication (`/auth`)

- `POST /auth/register` - Register new user
- `POST /auth/login` - Login user
- `GET /auth/token/refresh` - Refresh access token
- `GET /auth/token/clear` - Logout

### Chat (`/api/v1/chats`)

- `POST /api/v1/chats` - Send message to council
- `POST /api/v1/chats/stream` - Stream message (not yet implemented in UI)

### Users (`/api/v1/users`)

- `GET /api/v1/users` - Get all users
- `GET /api/v1/users/id/:id` - Get user by ID
- `GET /api/v1/users/email/:email` - Get user by email
- `PATCH /api/v1/users/update` - Update user
- `DELETE /api/v1/users/delete/:id` - Delete user

## Development Notes

- **Strict TypeScript**: All code is strictly typed
- **No backend modifications**: Frontend only consumes existing API
- **Service pattern**: Each entity has its own service class
- **Query keys object**: All query keys are centralized in `lib/query-keys.ts`
- **State management**: Auth state in Zustand, server state in React Query
- **Cookie-based auth**: Uses httpOnly cookies for security

## Future Enhancements

- Implement streaming responses for real-time chat
- Add detailed voting results display
- Show individual AI model responses
- Add conversation persistence
- Implement forgot password flow
- Add user profile management
