/**
 * Chat System Configuration Constants
 * Centralized configuration for both Direct Messages and Chat Rooms
 */

export const CHAT_CONFIG = {
  // Rate limiting
  RATE_LIMIT_WINDOW: 60000, // 1 minute in milliseconds
  RATE_LIMIT_MAX: 15, // Maximum messages per window
  
  // Pagination
  MESSAGES_PER_PAGE: 50,
  
  // Caching
  CACHE_EXPIRY: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
  MAX_CACHED_MESSAGES: 100,
  
  // Typing indicators
  TYPING_TIMEOUT: 2000, // Stop typing indicator after 2s of inactivity
  TYPING_DISPLAY_TIMEOUT: 5000, // Auto-clear typing display after 5s
  
  // Message limits
  MAX_MESSAGE_LENGTH: 2000,
  
  // Quick reactions available in chat
  QUICK_REACTIONS: ['❤️', '👍', '😂', '😮', '😢', '🙏'] as const,
} as const;

// Type for quick reactions
export type QuickReaction = typeof CHAT_CONFIG.QUICK_REACTIONS[number];
