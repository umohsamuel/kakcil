# AI Government Council - Quick Start Guide

## 🚀 Running the Application

### Step 1: Start the Backend API

```bash
cd api
bun install  # or npm install
bun run dev  # or npm run dev
```

The backend will run on **http://localhost:8080**

### Step 2: Start the Frontend UI

```bash
cd ui
pnpm install
pnpm dev
```

The frontend will run on **http://localhost:3001**

### Step 3: Use the Application

1. **Open your browser** to [http://localhost:3001](http://localhost:3001)
2. **Register a new account** at `/register`
3. **Login** with your credentials
4. **Start chatting** with the AI Government Council!

## 📋 What You Can Do

### Authentication
- ✅ Register new account
- ✅ Login with email/password
- ✅ Automatic session management
- ✅ Logout

### Chat with AI Council
- ✅ Send messages to the council
- ✅ Watch the council debate (animated)
- ✅ Receive the best answer chosen by voting
- ✅ View conversation history

## 🎯 How It Works

1. **You ask a question** → The message is sent to the backend
2. **Three AI models respond** → Google Gemini, OpenAI GPT, and Anthropic Claude each generate an answer
3. **All models vote** → Each AI evaluates all responses based on:
   - Accuracy
   - Completeness
   - Clarity
   - Relevance
   - Conciseness
4. **Best answer wins** → The response with the highest aggregate score is returned to you

## 🔧 Configuration

### Backend (.env in /api)
Make sure your backend has the required environment variables:
- Database credentials (PostgreSQL)
- AI API keys (Google, OpenAI, Anthropic)
- JWT secrets
- Cookie secrets

### Frontend (.env.local in /ui)
```bash
NEXT_PUBLIC_API_URL=http://localhost:8080
```

## 🏗️ Architecture

```
┌─────────────────┐
│   Next.js UI    │  Port 3001
│  (TypeScript)   │
└────────┬────────┘
         │
         │ HTTP/REST
         │
┌────────▼────────┐
│   Express API   │  Port 8080
│   (TypeScript)  │
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
┌───▼──┐  ┌──▼────┐
│ DB   │  │  AI   │
│(PG)  │  │Models │
└──────┘  └───────┘
```

## 📦 Tech Stack

### Frontend
- Next.js 16 (App Router)
- TypeScript
- TanStack Query (React Query)
- Zustand (State Management)
- Tailwind CSS
- Axios

### Backend
- Express.js
- TypeScript
- PostgreSQL
- AI SDK (Vercel)
- Google Gemini
- OpenAI GPT
- Anthropic Claude

## 🎨 Features Implemented

### ✅ Complete Authentication Flow
- Registration with validation
- Login with error handling
- Protected routes
- Automatic token refresh
- Persistent sessions

### ✅ Chat Interface
- Message input with keyboard shortcuts
- Message history display
- Council debate animation
- Loading states
- Error handling

### ✅ Type Safety
- Strict TypeScript throughout
- Type-safe API calls
- Type-safe state management
- Type-safe components

### ✅ Best Practices
- Service layer pattern
- Centralized API client
- Centralized query keys
- Component composition
- Separation of concerns

## 🐛 Troubleshooting

### Backend won't start
- Check database connection
- Verify all environment variables are set
- Check if port 8080 is available

### Frontend won't start
- Check if port 3001 is available
- Verify `NEXT_PUBLIC_API_URL` is set correctly
- Run `pnpm install` again

### Can't login
- Make sure backend is running
- Check browser console for errors
- Verify CORS is configured correctly
- Check network tab for API responses

### Messages not sending
- Verify you're logged in
- Check backend logs
- Ensure AI API keys are configured
- Check network requests in browser

## 📚 Documentation

- **UI_IMPLEMENTATION.md** - Detailed frontend implementation
- **ui/SETUP.md** - Frontend setup guide
- **api/README.md** - Backend documentation

## 🎯 Next Steps

After getting the app running, you can:
1. Test the authentication flow
2. Send messages and watch the council debate
3. Explore the code structure
4. Add new features
5. Customize the UI

## 💡 Tips

- Use **Shift+Enter** in the message input for new lines
- The council debate animation shows which AI is currently "thinking"
- Each AI model is represented by a colored dot (🟢 Google, 🔵 OpenAI, 🟣 Anthropic)
- Messages are stored in component state (refresh will clear history)

## 🤝 Need Help?

Check the implementation files:
- Frontend issues → `ui/src/`
- Backend issues → `api/src/`
- Type definitions → `ui/src/types/`
- API services → `ui/src/services/`

Enjoy using the AI Government Council! 🎉

