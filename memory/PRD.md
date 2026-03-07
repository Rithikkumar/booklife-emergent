# BookPassing Application - Product Requirements Document

## Original Problem Statement
BookPassing is a book-sharing community platform built with React/Vite/TypeScript frontend and Supabase backend. The application features book registration, journey tracking, communities, and messaging.

### Previous Audit Requests
1. Fix UI spacing on book details page
2. Improve location search to be fully global (remove hardcoded cities)
3. Conduct full code audit for hardcoded values and non-standard practices
4. Conduct specific audit of the chat system

## Tech Stack
- **Frontend:** React, Vite, TypeScript, Tailwind CSS, shadcn/ui
- **Backend:** Supabase (PostgreSQL, Authentication, Realtime)
- **Geocoding:** OpenStreetMap Nominatim API
- **Data Fetching:** Custom React Hooks + Supabase client

## Chat System Architecture

### Two Chat Systems
1. **Direct Messages (DMs)** - One-on-one conversations (`useDirectMessages.ts`)
2. **Chat Rooms** - Community/group chats (`useChat.ts`)

### Key Files
- `/app/src/hooks/useChat.ts` - Community chat logic
- `/app/src/hooks/useDirectMessages.ts` - DM logic
- `/app/src/constants/chat.ts` - Centralized chat configuration
- `/app/src/components/chat/` - Chat UI components
- `/app/src/components/messages/` - Message UI components

## What's Been Implemented

### Session: January 13, 2025

#### Chat System Audit & Fixes (P0-P3)

**P0 - Critical Performance Fixes:**
1. **N+1 Query Fix in Direct Messages** (`useDirectMessages.ts`)
   - Batch fetching of reply messages using `.in()` operator
   - Batch fetching of sender profiles
   - Reduced queries from ~100 per fetch to ~3

2. **N+1 Query Fix in Conversations List** (`useDirectMessages.ts`)
   - Batch fetching all participant profiles
   - Batch fetching last messages for all conversations
   - Batch fetching unread counts
   - Reduced queries from ~60 per 20 conversations to ~3

**P1 - Feature Parity Fixes:**
3. **Rate Limiting in Direct Messages**
   - Added 15 messages per minute limit (matching community chat)
   - Shows countdown timer when rate-limited
   - UI feedback with AlertTriangle icon

4. **Optimistic Updates in Direct Messages**
   - Messages appear instantly before server confirmation
   - Failed messages marked with visual indicator
   - Retry functionality for failed messages

5. **Caching in Direct Messages**
   - Added sessionStorage caching (24-hour expiry)
   - Caches last 100 messages per conversation
   - Caches conversation list

**P2 - Code Quality Fixes:**
6. **Typing Indicator Memory Leak Fix** (`useChat.ts`, `useDirectMessages.ts`)
   - Proper timeout tracking with Map
   - Cleanup on component unmount
   - Clear existing timeouts before creating new ones

**P3 - Cleanup & Standardization:**
7. **Centralized Chat Constants** (`/app/src/constants/chat.ts`)
   - Rate limit window/max
   - Pagination size
   - Cache expiry
   - Typing timeouts
   - Max message length
   - Quick reactions array

8. **Logger Integration - COMPLETE**
   - Replaced ALL 183 console.* statements with logger utility
   - Uses `/app/src/utils/logger.ts` for environment-aware logging
   - Production: Only warns and errors shown
   - Development: All log levels shown

9. **Type Safety Improvements**
   - Removed `any` types from MessageThreadContent.tsx
   - Added proper DirectMessage type imports
   - Added type cast for reactions: `(msg.reactions as Record<string, string[]>)`

10. **data-testid Attributes**
    - Added to ChatContainer (container, header, back-btn, messages-area, etc.)
    - Added to ChatInput (message-input, send-btn, char-count)
    - Added to ChatMessage (reaction buttons)
    - Added to MessageThreadContent (input, send button, retry buttons)

11. **Nominatim Schema Extension**
    - Added missing fields to Zod schema: quarter, locality, region, province, name
    - Proper type safety for global geocoding

#### Database Schema Migration (Applied)
- Added **28 foreign key constraints** for data integrity
- Added **25+ performance indexes** for faster queries
- Key FKs added:
  - conversations → profiles (participants)
  - direct_messages → profiles (sender)
  - chat_messages → profiles (sender)
  - followers → profiles (both directions)
  - user_books → profiles
  - And many more...

#### UI Fixes
- Fixed duplicate "Messages" header on Messages page
- Added `hideHeader` prop to ChatRoomList component

## Database Schema (Verified)
- `user_books` - Book information and ownership
- `book_journey` - Location/story points for book travel
- `profiles` - User profile data
- `direct_messages` - DM messages (FK to profiles.user_id)
- `conversations` - DM threads between users (FK to profiles.user_id)
- `chat_rooms` - Group chat rooms
- `chat_messages` - Group chat messages (FK to profiles.user_id)
- `chat_room_members` - Room membership (FK to profiles.user_id)
- `communities` - Community data
- `community_members` - Community membership
- `community_messages` - Community chat

## Environment Configuration
- All URLs, credentials from `.env` files
- Frontend: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_APP_DOMAIN`
- Project runs on port 3000 (Vite dev server)

## Pending Tasks
None - All identified issues have been resolved.

## Future/Backlog
- Consider shared base hook for DM/Chat code deduplication (P2 - optional refactor)
- Message search functionality
- Additional chat features based on user feedback
