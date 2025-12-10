import { useState, useCallback, useRef } from 'react';

interface RateLimitConfig {
  maxMessages: number;
  windowMs: number;
}

export const useRateLimiter = (config: RateLimitConfig) => {
  const messageTimestamps = useRef<number[]>([]);
  const [isRateLimited, setIsRateLimited] = useState(false);
  const [retryAfter, setRetryAfter] = useState(0);

  const checkRateLimit = useCallback(() => {
    const now = Date.now();
    const windowStart = now - config.windowMs;
    
    // Remove old timestamps outside the window
    messageTimestamps.current = messageTimestamps.current.filter(
      timestamp => timestamp > windowStart
    );

    // Check if limit exceeded
    if (messageTimestamps.current.length >= config.maxMessages) {
      const oldestTimestamp = messageTimestamps.current[0];
      const retryMs = (oldestTimestamp + config.windowMs) - now;
      
      setIsRateLimited(true);
      setRetryAfter(Math.ceil(retryMs / 1000));
      
      // Auto-reset when window expires
      setTimeout(() => {
        setIsRateLimited(false);
        setRetryAfter(0);
      }, retryMs);
      
      return false;
    }

    // Add current timestamp
    messageTimestamps.current.push(now);
    return true;
  }, [config.maxMessages, config.windowMs]);

  const reset = useCallback(() => {
    messageTimestamps.current = [];
    setIsRateLimited(false);
    setRetryAfter(0);
  }, []);

  return { checkRateLimit, isRateLimited, retryAfter, reset };
};
