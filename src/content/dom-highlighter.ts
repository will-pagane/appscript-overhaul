import { LOG_PREFIX, DEBOUNCE_MS } from '../shared/constants.js';
import { TermConfig } from '../shared/types.js';
import { debounce } from '../utils/debounce.js';

/**
 * Module state: MutationObserver for content changes
 */
let contentObserver: MutationObserver | null = null;

/**
 * Module state: track if observer is active
 */
let observerActive = false;

/**
 * Module state: stored terms for re-application on content changes
 */
let storedTerms: TermConfig[] = [];


/**
 * Get the Monaco editor container element
 * Looks for .view-lines (primary) or .monaco-editor (fallback)
 *
 * @returns Monaco container element or null if not found
 */
export function getMonacoContainer(): HTMLElement | null {
  // Try .view-lines first (where actual code lines are rendered)
  let container = document.querySelector('.view-lines') as HTMLElement;

  if (container) {
    return container;
  }

  // Fallback to .monaco-editor container
  container = document.querySelector('.monaco-editor') as HTMLElement;

  if (!container) {
    console.warn(`${LOG_PREFIX} Monaco container not found, skipping highlights`);
    return null;
  }

  return container;
}

/**
 * Find all text nodes within a container element
 * Uses TreeWalker for efficient DOM traversal
 *
 * @param container Container element to search within
 * @returns Array of text nodes
 */
export function findTextNodes(container: HTMLElement): Text[] {
  const textNodes: Text[] = [];
  const walker = document.createTreeWalker(
    container,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode: (node) => {
        // Skip empty text nodes
        return node.textContent?.trim()
          ? NodeFilter.FILTER_ACCEPT
          : NodeFilter.FILTER_REJECT;
      }
    }
  );

  let node: Text | null;
  while ((node = walker.nextNode() as Text)) {
    textNodes.push(node);
  }

  return textNodes;
}

/**
 * Wrap text with highlight span
 * Recursively processes all occurrences of term in text node
 *
 * @param textNode Text node to process
 * @param term Term to search for
 * @param className CSS class to apply
 */
export function wrapTextWithHighlight(
  textNode: Text,
  term: string,
  className: string
): void {
  const content = textNode.textContent || '';
  const index = content.indexOf(term);

  if (index === -1) return;

  // Split: before | match | after
  const before = content.substring(0, index);
  const match = content.substring(index, index + term.length);
  const after = content.substring(index + term.length);

  // Create highlight span
  const span = document.createElement('span');
  span.className = className;
  span.textContent = match;

  // Replace text node with fragments
  const parent = textNode.parentNode;
  if (!parent) return;

  if (before) {
    parent.insertBefore(document.createTextNode(before), textNode);
  }
  parent.insertBefore(span, textNode);
  if (after) {
    // Recursively check for more occurrences in remaining text
    const afterNode = document.createTextNode(after);
    parent.insertBefore(afterNode, textNode);
    wrapTextWithHighlight(afterNode, term, className);
  }
  parent.removeChild(textNode);
}

/**
 * Clear all highlights from the container
 * Unwraps all highlight spans and normalizes text nodes
 * Does NOT disconnect observer or clear stored terms (managed by applyHighlights)
 */
export function clearHighlights(): void {
  try {
    const container = getMonacoContainer();
    if (!container) return;

    // Find all highlight spans (class starts with "highlight-term-")
    const spans = container.querySelectorAll('[class^="highlight-term-"]');

    spans.forEach((span) => {
      const parent = span.parentNode;
      if (!parent) return;

      // Move text content out of span
      while (span.firstChild) {
        parent.insertBefore(span.firstChild, span);
      }
      parent.removeChild(span);
    });

    // Normalize to merge adjacent text nodes
    container.normalize();

    console.log(`${LOG_PREFIX} Cleared all highlights`);
  } catch (error) {
    console.error(`${LOG_PREFIX} Error clearing highlights:`, error);
  }
}

/**
 * Inject CSS styles for term highlighting
 * Creates or updates a <style> element in document head
 *
 * @param terms Array of terms with their colors
 */
function injectHighlightStyles(terms: TermConfig[]): void {
  const styleId = 'highlight-extension-styles';
  let styleEl = document.getElementById(styleId) as HTMLStyleElement;

  if (!styleEl) {
    styleEl = document.createElement('style');
    styleEl.id = styleId;
    document.head.appendChild(styleEl);
  }

  // Generate CSS for each term
  const css = terms.map((term, index) => {
    // Basic hex color validation
    const color = /^#[0-9A-Fa-f]{6}$/.test(term.color) ? term.color : '#ffff00';
    return `.highlight-term-${index} { color: ${color}; font-weight: bold; }`;
  }).join('\n');

  styleEl.textContent = css;
}

/**
 * Apply highlights using DOM manipulation
 * Main entry point for DOM-based highlighting
 *
 * @param terms Array of terms to highlight
 * @returns True if successful, false if container not found
 */
export function applyHighlights(terms: TermConfig[]): boolean {
  const startTime = performance.now();

  // Disconnect observer temporarily to avoid detecting our own changes
  const wasObserverActive = observerActive;
  if (observerActive) {
    disconnectContentObserver();
  }

  try {
    console.log(`${LOG_PREFIX} Using CSS/DOM highlighting`);

    // Get Monaco container
    const container = getMonacoContainer();
    if (!container) {
      return false;
    }

    // Clear previous highlights (without disconnecting observer - already done)
    const spans = container.querySelectorAll('[class^="highlight-term-"]');
    spans.forEach((span) => {
      const parent = span.parentNode;
      if (!parent) return;
      while (span.firstChild) {
        parent.insertBefore(span.firstChild, span);
      }
      parent.removeChild(span);
    });
    container.normalize();

    // Store terms for re-application on content changes
    storedTerms = terms;

    if (terms.length === 0) {
      console.log(`${LOG_PREFIX} No terms to highlight`);
      return true;
    }

    // Inject CSS styles
    injectHighlightStyles(terms);

    // Find all text nodes in the container
    const textNodes = findTextNodes(container);

    // Apply highlights for each term
    terms.forEach((termConfig, index) => {
      const className = `highlight-term-${index}`;
      let occurrenceCount = 0;

      // Process each text node
      // Note: We collect nodes first because wrapping modifies the DOM
      const nodesToProcess = [...textNodes];

      nodesToProcess.forEach(textNode => {
        // Skip if node is no longer in the document (already processed)
        if (!textNode.parentNode || !document.contains(textNode)) {
          return;
        }

        // Skip if node is inside a highlight span (avoid infinite loop)
        let parent = textNode.parentNode;
        while (parent && parent !== container) {
          if (parent instanceof HTMLElement && parent.className.startsWith('highlight-term-')) {
            return;
          }
          parent = parent.parentNode;
        }

        const content = textNode.textContent || '';
        const termCount = (content.match(new RegExp(termConfig.term, 'g')) || []).length;
        if (termCount > 0) {
          occurrenceCount += termCount;
          wrapTextWithHighlight(textNode, termConfig.term, className);
        }
      });

      if (occurrenceCount > 0) {
        console.log(`${LOG_PREFIX} Found ${occurrenceCount} occurrences of "${termConfig.term}"`);
      }
    });

    // Measure performance (NFR1: must be < 100ms)
    const endTime = performance.now();
    const duration = endTime - startTime;

    console.log(`${LOG_PREFIX} Applied highlights for ${terms.length} terms (${duration.toFixed(2)}ms)`);

    if (duration > 100) {
      console.warn(`${LOG_PREFIX} Performance warning: highlighting took ${duration.toFixed(2)}ms (target: <100ms)`);
    }

    // Re-connect content change observer (always reconnect, even if it wasn't active before)
    if (!observerActive) {
      observeContentChanges(() => {
        // Re-apply highlights when content changes
        applyHighlights(storedTerms);
      });
      observerActive = true;
    }

    return true;
  } catch (error) {
    console.error(`${LOG_PREFIX} DOM highlighting error:`, error);

    // Re-connect observer even on error
    if (wasObserverActive && !observerActive) {
      observeContentChanges(() => {
        applyHighlights(storedTerms);
      });
      observerActive = true;
    }

    return false;
  }
}

/**
 * Set up MutationObserver to watch for content changes
 * Observes at document.body level to detect file switches
 * Debounces callback to avoid excessive re-application
 *
 * @param callback Function to call when content changes
 */
export function observeContentChanges(callback: () => void): void {
  const debouncedCallback = debounce(callback, DEBOUNCE_MS);

  contentObserver = new MutationObserver((mutations) => {
    // Check if .view-lines container exists and has relevant changes
    const container = document.querySelector('.view-lines');
    if (!container) {
      return; // Container not found, skip
    }

    // Only trigger on actual content changes within .view-lines or its replacement
    const hasRelevantChange = mutations.some((m) => {
      // Check if mutation is within or affects .view-lines
      if (m.type === 'childList') {
        // Check if .view-lines was added/removed (file switch)
        const viewLinesAdded = Array.from(m.addedNodes).some(
          (node) => node instanceof HTMLElement &&
                   (node.classList?.contains('view-lines') || node.querySelector('.view-lines'))
        );
        const viewLinesRemoved = Array.from(m.removedNodes).some(
          (node) => node instanceof HTMLElement &&
                   (node.classList?.contains('view-lines') || node.querySelector('.view-lines'))
        );

        if (viewLinesAdded || viewLinesRemoved) {
          return true;
        }

        // Check if mutation is inside .view-lines
        if (container.contains(m.target as Node)) {
          return true;
        }
      }

      // Character data changes within .view-lines
      if (m.type === 'characterData' && container.contains(m.target as Node)) {
        return true;
      }

      return false;
    });

    if (hasRelevantChange) {
      debouncedCallback();
    }
  });

  // CRITICAL: Observe at BODY level (not .view-lines container) because:
  // 1. Monaco Editor completely REPLACES .view-lines when switching between .gs files
  // 2. Observing the container directly would miss these replacements (orphaned observer)
  // 3. Body-level monitoring catches both:
  //    - User typing/editing (characterData changes within .view-lines)
  //    - File switches (childList changes that add/remove .view-lines)
  // 4. Intelligent filtering above prevents false triggers from unrelated DOM changes
  contentObserver.observe(document.body, {
    childList: true,
    characterData: true,
    subtree: true
  });

  console.log(`${LOG_PREFIX} Content change observer activated (body-level monitoring)`);
}

/**
 * Disconnect the content change observer
 * Safe to call multiple times (idempotent)
 */
export function disconnectContentObserver(): void {
  if (contentObserver) {
    contentObserver.disconnect();
    contentObserver = null;
    observerActive = false;
    console.log(`${LOG_PREFIX} Content change observer disconnected`);
  }
}
