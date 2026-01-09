import { LOG_PREFIX } from '../shared/constants.js';
import { TermConfig } from '../shared/types.js';
import { applyHighlights, clearHighlights } from './dom-highlighter.js';
import { loadTerms } from '../shared/storage.js';

/**
 * Content script entry point
 * Waits for Monaco container and applies CSS/DOM highlighting
 */

// Content script initialization
console.log(`${LOG_PREFIX} Content script loaded`);

/**
 * Wait for Monaco container (.view-lines) to appear in DOM
 * Uses MutationObserver to detect when container is added
 */
function waitForMonacoContainer(): Promise<HTMLElement> {
  return new Promise((resolve) => {
    // Check if container already exists
    const existing = document.querySelector('.view-lines') as HTMLElement;
    if (existing) {
      resolve(existing);
      return;
    }

    // Set up observer to wait for container
    const observer = new MutationObserver(() => {
      const container = document.querySelector('.view-lines') as HTMLElement;
      if (container) {
        observer.disconnect();
        resolve(container);
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  });
}

/**
 * Initialize highlighting when container is ready
 */
async function initializeHighlighting(): Promise<void> {
  try {
    // Wait for Monaco container
    console.log(`${LOG_PREFIX} Waiting for Monaco container...`);
    await waitForMonacoContainer();
    console.log(`${LOG_PREFIX} Monaco container detected`);

    // Load terms from storage
    const terms = await loadTerms();

    if (terms.length === 0) {
      console.log(`${LOG_PREFIX} No terms configured, skipping highlights`);
      return;
    }

    // Apply highlights using CSS/DOM approach
    applyHighlights(terms);
  } catch (error) {
    console.error(`${LOG_PREFIX} Initialization error:`, error);
  }
}

// Start initialization
initializeHighlighting();

/**
 * Listen for storage changes to update highlights in real-time
 * When user updates terms in popup, automatically re-apply highlights
 */
chrome.storage.onChanged.addListener(async (changes, areaName) => {
  try {
    if (areaName === 'sync' && changes.highlightTerms) {
      const newTerms: TermConfig[] = changes.highlightTerms.newValue || [];

      if (newTerms.length === 0) {
        console.log(`${LOG_PREFIX} Terms updated, clearing all highlights`);
        clearHighlights();
        return;
      }

      // Re-apply highlights with new terms
      console.log(`${LOG_PREFIX} Terms updated, re-applying ${newTerms.length} highlights...`);
      applyHighlights(newTerms);
    }
  } catch (error) {
    console.error(`${LOG_PREFIX} Storage change handler error:`, error);
  }
});
