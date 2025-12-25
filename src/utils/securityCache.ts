/**
 * Security Cache Management
 * Handles secure storage and cleanup of sensitive browser cache data
 */

const CACHE_EXPIRATION_KEY_SUFFIX = '_expires';
const DEFAULT_CACHE_EXPIRATION_MS = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Set an item in localStorage with automatic expiration
 */
export const setSecureCache = (key: string, value: string, expirationMs = DEFAULT_CACHE_EXPIRATION_MS): void => {
  try {
    localStorage.setItem(key, value);
    localStorage.setItem(`${key}${CACHE_EXPIRATION_KEY_SUFFIX}`, String(Date.now() + expirationMs));
  } catch (error) {
    console.error('Failed to set secure cache:', error);
  }
};

/**
 * Get an item from localStorage, checking expiration
 * Returns null if expired or not found
 */
export const getSecureCache = (key: string): string | null => {
  try {
    const expirationKey = `${key}${CACHE_EXPIRATION_KEY_SUFFIX}`;
    const expiration = localStorage.getItem(expirationKey);
    
    // Check if expired
    if (expiration && Date.now() > parseInt(expiration, 10)) {
      localStorage.removeItem(key);
      localStorage.removeItem(expirationKey);
      return null;
    }
    
    return localStorage.getItem(key);
  } catch (error) {
    console.error('Failed to get secure cache:', error);
    return null;
  }
};

/**
 * Remove a specific cache item and its expiration marker
 */
export const removeSecureCache = (key: string): void => {
  try {
    localStorage.removeItem(key);
    localStorage.removeItem(`${key}${CACHE_EXPIRATION_KEY_SUFFIX}`);
  } catch (error) {
    console.error('Failed to remove secure cache:', error);
  }
};

/**
 * Clear all sensitive caches on logout
 * This removes community message caches and other sensitive data
 */
export const clearSensitiveCaches = (): void => {
  try {
    const keysToRemove: string[] = [];
    
    // Find all community message caches
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        // Remove community message caches
        if (key.startsWith('community_messages_')) {
          keysToRemove.push(key);
        }
        // Remove expiration markers
        if (key.endsWith(CACHE_EXPIRATION_KEY_SUFFIX)) {
          keysToRemove.push(key);
        }
      }
    }
    
    // Remove identified keys
    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
    });
    
    // Clear session storage security logs
    sessionStorage.removeItem('securityLogs');
    
    console.log(`Cleared ${keysToRemove.length} sensitive cache entries`);
  } catch (error) {
    console.error('Failed to clear sensitive caches:', error);
  }
};

/**
 * Clean up expired cache entries
 * Should be called periodically or on app startup
 */
export const cleanupExpiredCaches = (): void => {
  try {
    const keysToRemove: string[] = [];
    const now = Date.now();
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.endsWith(CACHE_EXPIRATION_KEY_SUFFIX)) {
        const expiration = localStorage.getItem(key);
        if (expiration && now > parseInt(expiration, 10)) {
          // Remove the data key and expiration key
          const dataKey = key.replace(CACHE_EXPIRATION_KEY_SUFFIX, '');
          keysToRemove.push(dataKey);
          keysToRemove.push(key);
        }
      }
    }
    
    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
    });
    
    if (keysToRemove.length > 0) {
      console.log(`Cleaned up ${keysToRemove.length / 2} expired cache entries`);
    }
  } catch (error) {
    console.error('Failed to cleanup expired caches:', error);
  }
};
