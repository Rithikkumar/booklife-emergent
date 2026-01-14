# BookPassing Application - Product Requirements Document

## App Overview
**BookPassing** is a book-sharing platform where users:
1. Register physical books with unique tracking codes
2. Pass books to other readers and track their journey around the world
3. Join communities of readers with shared interests
4. Attend live book discussion classes
5. Follow books and see where they travel

## Tech Stack
- **Frontend:** React, Vite, TypeScript, Tailwind CSS, shadcn/ui
- **Backend:** Supabase (PostgreSQL, Authentication, Realtime)
- **Geocoding:** OpenStreetMap Nominatim API
- **Book Covers:** OpenLibrary + Google Books APIs
- **Mobile:** Capacitor for push notifications

---

## Database Schema (27 Tables)

### Core Tables
| Table | Purpose | Status |
|-------|---------|--------|
| `profiles` | User accounts with privacy settings | ✅ Ready |
| `user_books` | Registered books with location, code, status | ✅ Ready |
| `book_passes` | Track each book transfer event | ✅ Ready (new) |
| `book_codes` | Pre-generated codes for books | ✅ Ready |
| `followed_books` | Books users are tracking | ✅ Ready |

### Community Tables
| Table | Purpose | Status |
|-------|---------|--------|
| `communities` | Community groups | ✅ Ready |
| `community_members` | Membership with roles | ✅ Ready |
| `community_messages` | Community chat | ✅ Ready |
| `community_join_requests` | Private community requests | ✅ Ready |
| `community_typing_indicators` | Real-time typing | ✅ Ready |
| `community_recommendations` | AI recommendations | ⚠️ Not used |
| `user_community_interactions` | Analytics | ⚠️ Not used |

### Messaging Tables
| Table | Purpose | Status |
|-------|---------|--------|
| `conversations` | DM threads | ✅ Ready |
| `direct_messages` | DM messages | ✅ Ready |
| `chat_rooms` | Group chat rooms | ✅ Ready |
| `chat_messages` | Group messages | ✅ Ready |
| `chat_room_members` | Room membership | ✅ Ready |

### Book Classes Tables
| Table | Purpose | Status |
|-------|---------|--------|
| `book_classes` | Live discussion classes | ✅ Ready |
| `class_participants` | Class attendees | ✅ Ready |
| `class_chat_messages` | In-class chat | ✅ Ready |
| `class_meeting_credentials` | Encrypted meeting links | ✅ Ready |
| `email_notifications` | Class email alerts | ✅ Ready |
| `credential_access_log` | Security audit log | ✅ Ready |

### Social Tables
| Table | Purpose | Status |
|-------|---------|--------|
| `followers` | User follows | ✅ Ready |
| `book_story_reactions` | Reactions to book stories | ✅ Ready |
| `book_story_comments` | Comments on stories | ✅ Ready |
| `notifications` | In-app notifications | ⚠️ Table exists, not populated |

---

## Recent Changes (January 13-14, 2025)

### Database Migrations Applied
1. **Added to `user_books`:**
   - `status` (available/in_transit/passed/lost/archived)
   - `original_owner_id` (FK to profiles)
   - `pass_count` (integer)
   - `last_passed_at` (timestamp)

2. **Created `book_passes` table:**
   - Tracks each book transfer with from/to users
   - Includes location data for journey mapping

3. **Added 28 Foreign Key constraints** for data integrity
4. **Added 25+ Performance indexes** for faster queries

### Code Improvements
1. **Chat System Audit (P0-P3):**
   - Fixed N+1 query problems (100 queries → 3)
   - Added rate limiting to DMs
   - Added optimistic UI updates
   - Added sessionStorage caching
   - Fixed typing indicator memory leaks
   - Centralized constants in `/src/constants/chat.ts`

2. **Console.log Cleanup:**
   - Replaced 183 console statements with logger utility
   - Production-safe logging

3. **UI Fixes:**
   - Fixed duplicate "Messages" header

4. **Community Recommendations System (NEW):**
   - Created `/src/hooks/useCommunityGrowth.ts`
   - Rule-based recommendation algorithm:
     - Tag matching (content-based)
     - Popularity scoring
     - Activity scoring
   - Client-side fallback when Edge Function unavailable
   - Caches recommendations for 24 hours
   - Tracks: views, joins, leaves, messages, reactions

5. **User Interaction Analytics (NEW):**
   - Tracks community views, joins, leaves
   - Weekly growth calculation (new members, messages)
   - Fixed unstable "Community growing" numbers (removed Math.random())
   - Real growth data now passed to CommunityActivity component

6. **Files Created/Modified:**
   - `/src/hooks/useCommunityGrowth.ts` - NEW
   - `/src/hooks/useCommunityRecommendations.ts` - Updated with client-side fallback
   - `/src/hooks/useCommunityDetails.ts` - Added interaction tracking
   - `/src/components/communities/CommunityActivity.tsx` - Fixed random numbers
   - `/src/pages/CommunityDetail.tsx` - Integrated growth tracking

---

## Production Readiness Assessment

### ✅ READY FOR PRODUCTION
- User authentication & profiles
- Book registration with codes
- Book journey tracking
- Communities with messaging
- Direct messaging (DMs)
- Group chat rooms
- Book classes with participants
- Book following
- Story reactions
- Email notifications for classes

### ⚠️ OPTIONAL FEATURES (Not Critical)
- In-app notification bell (table exists, not populated)
- Community recommendations (table exists, not used)
- User interaction tracking (table exists, not used)

### 📋 RECOMMENDED ENHANCEMENTS
1. Populate `notifications` table when events occur
2. Test book passing flow end-to-end
3. Consider implementing recommendation system

---

## Key Files Reference
- `/src/hooks/useDirectMessages.ts` - DM logic (optimized)
- `/src/hooks/useChat.ts` - Community chat logic
- `/src/hooks/useBookJourney.ts` - Book journey tracking
- `/src/constants/chat.ts` - Chat configuration
- `/src/utils/logger.ts` - Production logging
- `/src/utils/bookCovers.tsx` - Cover image fetching
- `/src/pages/RegisterBook.tsx` - Book registration flow
