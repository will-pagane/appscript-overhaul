/**
 * Configuration for a single term to highlight
 */
export interface TermConfig {
  term: string;   // The text to highlight
  color: string;  // Hex color code (e.g., "#ff69b4")
}

/**
 * Schema for chrome.storage.sync data
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

/**
 * Monaco editor instance interface
 * Minimal interface for detection and highlighting operations
 */
export interface MonacoEditorInstance {
  getModel(): unknown;
  deltaDecorations(oldDecorations: string[], newDecorations: unknown[]): string[];
  onDidChangeModelContent(listener: () => void): { dispose(): void };
  getValue(): string;
}

/**
 * Callback type for Monaco detection events
 */
export type MonacoDetectionCallback = (editor: MonacoEditorInstance) => void;
