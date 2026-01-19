# AI Government Council - Frontend Implementation

## Overview

This document describes the complete frontend implementation for the AI Government Council chatbot project. The frontend is built with Next.js 16, TypeScript, TanStack Query, and Tailwind CSS.

## ✅ Completed Features

### 1. **Authentication System**
- ✅ Login page with email/password
- ✅ Registration page with validation
- ✅ Protected routes with auth guards
- ✅ Automatic token refresh on 401 errors
- ✅ Persistent auth state with Zustand
- ✅ Cookie-based authentication
- ✅ Auto-redirect based on auth status

### 2. **Chat Interface**
- ✅ Real-time message sending
- ✅ Message history display
- ✅ Council debate animation
- ✅ User and assistant message bubbles
- ✅ Loading states during message processing
- ✅ Error handling

### 3. **Architecture**
- ✅ Strict TypeScript typing throughout
- ✅ Service layer pattern (auth, chat, user services)
- ✅ Centralized API client with interceptors
- ✅ Centralized query keys object
- ✅ React Query for server state
- ✅ Zustand for client state
- ✅ Component-based architecture

### 4. **UI/UX**
- ✅ Responsive design with Tailwind CSS
- ✅ Loading spinners and states
- ✅ Error messages
- ✅ Smooth animations
- ✅ Council debate visualization
- ✅ Professional gradient backgrounds

## 📁 Project Structure

```
ui/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── chat/              # Chat page (protected)
│   │   ├── login/             # Login page
│   │   ├── register/          # Register page
│   │   ├── layout.tsx         # Root layout
│   │   └── page.tsx           # Home (redirects)
│   ├── components/            # React components
│   │   ├── council-debate.tsx # Debate animation
│   │   ├── loading.tsx        # Loading components
│   │   ├── message-input.tsx  # Chat input
│   │   ├── message-list.tsx   # Message display
│   │   └── protected-route.tsx # Auth guard
│   ├── hooks/                 # Custom hooks
│   │   ├── use-auth.ts       # Auth operations
│   │   └── use-chat.ts       # Chat operations
│   ├── lib/                   # Utilities
│   │   ├── api-client.ts     # Axios instance
│   │   └── query-keys.ts     # Query key factory
│   ├── providers/             # Context providers
│   │   └── query-provider.tsx # React Query setup
│   ├── services/              # API services
│   │   ├── auth.service.ts   # Auth API
│   │   ├── chat.service.ts   # Chat API
│   │   └── user.service.ts   # User API
│   ├── store/                 # State management
│   │   └── auth.store.ts     # Auth state (Zustand)
│   └── types/                 # TypeScript types
│       ├── api.ts            # API types
│       ├── auth.ts           # Auth types
│       ├── chat.ts           # Chat types
│       └── user.ts           # User types
├── .env.local                 # Environment variables
├── .env.local.example         # Example env file
├── package.json               # Dependencies
├── SETUP.md                   # Setup instructions
└── tsconfig.json              # TypeScript config
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- pnpm (or npm/yarn)
- Backend API running on port 8080

### Installation

1. **Navigate to UI directory:**
   ```bash
   cd ui
   ```

2. **Install dependencies:**
   ```bash
   pnpm install
   ```

3. **Configure environment:**
   ```bash
   cp .env.example .env
   ```
   
   Update `.env.local`:
   ```
   NEXT_PUBLIC_API_URL=http://localhost:8080
   ```

4. **Run development server:**
   ```bash
   pnpm dev
   ```

5. **Open browser:**
   Navigate to [http://localhost:3001](http://localhost:3001)

## 🔌 API Integration

### Backend Endpoints Used

#### Authentication
- `POST /auth/register` - User registration
- `POST /auth/login` - User login
- `GET /auth/token/refresh` - Refresh access token
- `GET /auth/token/clear` - Logout

#### Chat
- `POST /api/v1/chats` - Send message to AI council

#### Users (Available but not used in UI yet)
- `GET /api/v1/users` - Get all users
- `GET /api/v1/users/id/:id` - Get user by ID
- `PATCH /api/v1/users/update` - Update user

### Service Layer Pattern

Each entity has its own service class:

```typescript
// Example: auth.service.ts
export class AuthService {
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await apiClient.post<LoginResponse>("/auth/login", credentials);
    return response.data;
  }
}
```

### Query Keys Object

All query keys are centralized:

```typescript
export const queryKeys = {
  auth: {
    all: ["auth"] as const,
    currentUser: () => [...queryKeys.auth.all, "current-user"] as const,
  },
  chat: {
    all: ["chat"] as const,
    messages: () => [...queryKeys.chat.all, "messages"] as const,
  },
};
```

## 🎨 Key Features Explained

### Council Debate Animation

The `CouncilDebate` component shows a visual representation of the AI models working:
- Animated progress bars for each AI model (Google, OpenAI, Anthropic)
- Stage-by-stage progress (Analyzing → Generating → Evaluating → Scoring → Selecting)
- Pulsing indicators showing active model
- Educational tooltip explaining the process

### Protected Routes

The `ProtectedRoute` component:
- Checks authentication status from Zustand store
- Redirects to login if not authenticated
- Shows loading state during check
- Wraps protected pages (like `/chat`)

### Automatic Token Refresh

The API client includes an interceptor that:
- Catches 401 errors
- Automatically calls refresh token endpoint
- Retries the original request
- Redirects to login if refresh fails

## 🔒 Security Features

- ✅ HTTP-only cookies for tokens
- ✅ Automatic token refresh
- ✅ Protected routes
- ✅ CORS configuration
- ✅ No tokens in localStorage (uses cookies)

## 📝 Type Safety

All code is strictly typed:
- API requests and responses
- Component props
- Hook return values
- Store state
- Service methods

## 🎯 Future Enhancements

- [ ] Implement streaming responses
- [ ] Show detailed voting results
- [ ] Display individual AI model responses
- [ ] Add conversation persistence
- [ ] Implement forgot password UI
- [ ] Add user profile page
- [ ] Add conversation history sidebar
- [ ] Export conversation feature

## 🐛 Known Limitations

- Messages are stored in component state (not persisted)
- No streaming implementation yet (backend supports it)
- No detailed voting results display
- No individual model responses shown

## 📚 Technologies Used

- **Next.js 16** - React framework
- **TypeScript 5** - Type safety
- **TanStack Query 5** - Server state management
- **Zustand 5** - Client state management
- **Axios 1.13** - HTTP client
- **Tailwind CSS 4** - Styling
- **React 19** - UI library

## 🤝 Contributing

When adding new features:
1. Create types in `/types`
2. Create service methods in `/services`
3. Add query keys to `/lib/query-keys.ts`
4. Create hooks in `/hooks`
5. Build components in `/components`
6. Add pages in `/app`

## 📄 License

Same as parent project.

