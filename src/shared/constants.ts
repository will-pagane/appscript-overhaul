/**
 * Storage key for chrome.storage.sync - NEVER hardcode this value elsewhere
 */
export const STORAGE_KEY = 'highlightTerms';

/**
 * Log prefix for all console statements
 */
export const LOG_PREFIX = '[Highlight Extension]';

/**
 * Polling interval for Monaco detection fallback (ms)
 */
export const POLL_INTERVAL_MS = 500;

/**
 * Timeout for Monaco detection polling (ms)
 */
export const POLL_TIMEOUT_MS = 10000;

/**
 * Debounce delay for editor content changes (ms)
 */
export const DEBOUNCE_MS = 150;

/**
 * Delay before starting polling fallback for Monaco detection (ms)
 */
export const POLL_START_DELAY_MS = 2000;
