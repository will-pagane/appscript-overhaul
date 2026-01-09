/**
 * Configuration for a single term to highlight
 *
 * @property colorTarget - Where to apply the color ('font' or 'background')
 *                         Defaults to 'background' if missing (backward compatibility)
 */
export interface TermConfig {
  term: string;   // The text to highlight
  color: string;  // Hex color code (e.g., "#ff69b4")
  colorTarget?: 'font' | 'background';  // Where to apply the color (optional for backward compatibility)
}

/**
 * Schema for chrome.storage.sync data
 *
 * @property terms - Array of term configurations with colorTarget support
 *                   Legacy terms without colorTarget default to 'background'
 */
export interface StorageSchema {
  terms: TermConfig[];
}

/**
 * Message format for Chrome runtime messaging
 */
export interface ChromeMessage {
  type: 'TERMS_UPDATED' | 'REFRESH_HIGHLIGHTS' | 'PING';
  payload?: unknown;
}

/**
 * Response format for Chrome message handlers
 */
export interface ChromeResponse {
  success: boolean;
  error?: string;
}

