import { LOG_PREFIX, POLL_INTERVAL_MS, POLL_TIMEOUT_MS, POLL_START_DELAY_MS } from '../shared/constants.js';
import { MonacoEditorInstance, MonacoDetectionCallback } from '../shared/types.js';

/**
 * Module state
 */
let detectedEditor: MonacoEditorInstance | null = null;
let isDetected = false;
const callbacks: MonacoDetectionCallback[] = [];
let observer: MutationObserver | null = null;
let pollingInterval: number | null = null;
let pollingStartTimeout: number | null = null;

/**
 * Declare Monaco global type for window
 */
declare global {
  interface Window {
    monaco?: {
      editor?: {
        getEditors(): MonacoEditorInstance[];
      };
    };
  }
}

/**
 * Check if Monaco editor is available and get the instance
 * Checks window.monaco.editor.getEditors() API
 */
function checkForMonaco(): MonacoEditorInstance | null {
  try {
    // Check window.monaco.editor.getEditors() - primary and only method
    // The .monaco-editor DOM element alone is not sufficient without the API
    if (window.monaco?.editor?.getEditors) {
      const editors = window.monaco.editor.getEditors();
      if (editors && editors.length > 0) {
        return editors[0];
      }
    }
  } catch (error) {
    console.error(`${LOG_PREFIX} Error checking for Monaco:`, error);
  }

  return null;
}

/**
 * Handle successful Monaco detection
 */
function handleMonacoDetected(editor: MonacoEditorInstance, source: string): void {
  if (isDetected) {
    return; // Already detected, skip
  }

  isDetected = true;
  detectedEditor = editor;

  console.log(`${LOG_PREFIX} Monaco editor detected (${source})`);

  // Cleanup detection mechanisms
  cleanup();

  // Fire all registered callbacks
  for (const callback of callbacks) {
    try {
      callback(editor);
    } catch (error) {
      console.error(`${LOG_PREFIX} Callback error:`, error);
    }
  }
}

/**
 * Cleanup detection resources
 * Safe to call multiple times (idempotent)
 */
function cleanup(): void {
  if (observer) {
    observer.disconnect();
    observer = null;
  }

  if (pollingInterval !== null) {
    clearInterval(pollingInterval);
    pollingInterval = null;
  }

  if (pollingStartTimeout !== null) {
    clearTimeout(pollingStartTimeout);
    pollingStartTimeout = null;
  }
}

/**
 * Start polling fallback for Monaco detection
 * Uses single timeout mechanism to avoid race conditions
 */
function startPolling(): void {
  if (isDetected) {
    return; // Already detected, no need to poll
  }

  let pollCount = 0;
  const maxPolls = Math.floor(POLL_TIMEOUT_MS / POLL_INTERVAL_MS);

  pollingInterval = window.setInterval(() => {
    pollCount++;

    const editor = checkForMonaco();
    if (editor) {
      handleMonacoDetected(editor, 'polling');
      return;
    }

    // Single timeout check - no race condition
    if (pollCount >= maxPolls) {
      console.log(`${LOG_PREFIX} Monaco editor not found (timeout)`);
      cleanup();
    }
  }, POLL_INTERVAL_MS);
}

/**
 * Initialize MutationObserver for Monaco detection
 */
function initMutationObserver(): void {
  observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.addedNodes.length > 0) {
        const editor = checkForMonaco();
        if (editor) {
          handleMonacoDetected(editor, 'MutationObserver');
          return;
        }
      }
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
}

/**
 * Initialize Monaco detector
 * Sets up MutationObserver and polling fallback
 */
export function initMonacoDetector(): void {
  try {
    // Check if Monaco is already available
    const existingEditor = checkForMonaco();
    if (existingEditor) {
      handleMonacoDetected(existingEditor, 'immediate');
      return;
    }

    // Start MutationObserver
    initMutationObserver();

    // Schedule polling fallback after delay
    pollingStartTimeout = window.setTimeout(() => {
      if (!isDetected) {
        startPolling();
      }
    }, POLL_START_DELAY_MS);
  } catch (error) {
    console.error(`${LOG_PREFIX} Monaco detector initialization error:`, error);
  }
}

/**
 * Get the detected Monaco editor instance
 * @returns The Monaco editor instance or null if not yet detected
 */
export function getMonacoEditor(): MonacoEditorInstance | null {
  return detectedEditor;
}

/**
 * Register a callback to be called when Monaco is detected
 * If Monaco is already detected, callback is fired immediately
 * @param callback Function to call with the editor instance
 * @returns Disposal function to unregister the callback
 */
export function onMonacoDetected(callback: MonacoDetectionCallback): () => void {
  if (isDetected && detectedEditor) {
    // Monaco already detected, fire callback immediately
    try {
      callback(detectedEditor);
    } catch (error) {
      console.error(`${LOG_PREFIX} Callback error:`, error);
    }
  } else {
    // Store callback for later
    callbacks.push(callback);
  }

  // Return disposal function to remove callback
  return () => {
    const index = callbacks.indexOf(callback);
    if (index > -1) {
      callbacks.splice(index, 1);
    }
  };
}
