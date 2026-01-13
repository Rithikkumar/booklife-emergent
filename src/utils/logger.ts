/**
 * Application Logger
 * 
 * Provides controlled logging that can be disabled in production.
 * All console.log/warn/error calls should use this logger instead.
 */

import { isDevelopment } from '@/constants/appConfig';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LoggerConfig {
  enabled: boolean;
  minLevel: LogLevel;
}

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

// Default configuration - disable debug/info logs in production
const config: LoggerConfig = {
  enabled: true,
  minLevel: isDevelopment ? 'debug' : 'warn',
};

/**
 * Check if a log level should be output
 */
const shouldLog = (level: LogLevel): boolean => {
  if (!config.enabled) return false;
  return LOG_LEVELS[level] >= LOG_LEVELS[config.minLevel];
};

/**
 * Format log message with timestamp and level
 */
const formatMessage = (level: LogLevel, ...args: unknown[]): unknown[] => {
  const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
  return [`[${timestamp}] [${level.toUpperCase()}]`, ...args];
};

/**
 * Application logger with controlled output
 */
export const logger = {
  /**
   * Debug level - for detailed debugging information
   * Only shown in development mode
   */
  debug: (...args: unknown[]): void => {
    if (shouldLog('debug')) {
      console.log(...formatMessage('debug', ...args));
    }
  },

  /**
   * Info level - for general information
   * Only shown in development mode by default
   */
  info: (...args: unknown[]): void => {
    if (shouldLog('info')) {
      console.log(...formatMessage('info', ...args));
    }
  },

  /**
   * Warn level - for warnings that don't prevent operation
   * Shown in all modes
   */
  warn: (...args: unknown[]): void => {
    if (shouldLog('warn')) {
      console.warn(...formatMessage('warn', ...args));
    }
  },

  /**
   * Error level - for errors that affect operation
   * Always shown
   */
  error: (...args: unknown[]): void => {
    if (shouldLog('error')) {
      console.error(...formatMessage('error', ...args));
    }
  },

  /**
   * Configure the logger
   */
  configure: (newConfig: Partial<LoggerConfig>): void => {
    Object.assign(config, newConfig);
  },

  /**
   * Disable all logging
   */
  disable: (): void => {
    config.enabled = false;
  },

  /**
   * Enable logging
   */
  enable: (): void => {
    config.enabled = true;
  },
};

// Export default for convenience
export default logger;
