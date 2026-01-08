# Story 2.3: CSS Fallback Highlighting

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a user,
I want highlighting to work even if Monaco API is unavailable,
so that the extension remains functional in all scenarios.

## Acceptance Criteria

1. **Monaco API Availability Detection** - Extension detects when API is not exposed:
   - Check if `window.monaco` exists but `editor.deltaDecorations` is unavailable
   - Check if Monaco DOM elements exist but no editor instance can be obtained
   - Log message: `[Highlight Extension] Monaco API not available, using CSS fallback`

2. **CSS Fallback Activation** - Fallback mode activates automatically:
   - When Monaco Decorators API is unavailable, CSS fallback is used (NFR5)
   - Terms are still visually highlighted with configured colors
   - Log message: `[Highlight Extension] Using CSS fallback`
   - Fallback is transparent to user - highlights look similar to API mode

3. **DOM-Based Text Highlighting** - Highlights applied via DOM manipulation:
   - Find text nodes within Monaco editor container (`.monaco-editor` or `.view-lines`)
   - Wrap matching text in `<span>` elements with highlight classes
   - Use TreeWalker for efficient DOM traversal
   - Preserve original text content and structure

4. **Highlight Styling** - Visual appearance matches API mode:
   - Same CSS classes used: `.highlight-term-{index}`
   - Same background colors from term configuration
   - Highlights are visually consistent with Monaco Decorators mode

5. **Re-application on Content Change** - Highlights persist during editing:
   - When CSS fallback is active and editor content changes
   - Previous highlight spans are removed (cleanup)
   - New highlights are re-applied to updated content
   - Use MutationObserver to detect content changes in fallback mode

6. **No Interference with Monaco Rendering** - Editor remains functional:
   - Syntax highlighting still works (Monaco's own styles preserved)
   - Text selection works normally
   - Scrolling and navigation unaffected
   - No visual glitches from span injection

7. **Graceful Degradation** - Handles edge cases:
   - If DOM structure is unexpected, log warning and skip highlighting
   - If text nodes can't be found, don't crash
   - Clean error handling throughout

## Tasks / Subtasks

- [x] Task 1: Create CSS fallback module (AC: #1, #2)
  - [x] 1.1: Create `src/content/css-fallback.ts`
  - [x] 1.2: Import `TermConfig` from shared/types
  - [x] 1.3: Import `LOG_PREFIX` from shared/constants
  - [x] 1.4: Export `isMonacoApiAvailable(editor: unknown): boolean` function

- [x] Task 2: Implement Monaco container detection (AC: #3)
  - [x] 2.1: Create `getMonacoContainer(): HTMLElement | null` function
  - [x] 2.2: Look for `.monaco-editor` container element
  - [x] 2.3: Find `.view-lines` container (where actual code lines are)
  - [x] 2.4: Return null if container not found

- [x] Task 3: Implement text node traversal (AC: #3)
  - [x] 3.1: Create `findTextNodes(container: HTMLElement): Text[]` function
  - [x] 3.2: Use `document.createTreeWalker()` with `NodeFilter.SHOW_TEXT`
  - [x] 3.3: Collect all text nodes within the container
  - [x] 3.4: Filter out empty text nodes

- [x] Task 4: Implement text wrapping (AC: #3, #4)
  - [x] 4.1: Create `wrapTextWithHighlight(textNode: Text, term: string, className: string): void` function
  - [x] 4.2: Find term occurrences within text node content
  - [x] 4.3: Split text node and wrap matches in `<span class="{className}">`
  - [x] 4.4: Preserve non-matching text

- [x] Task 5: Implement highlight cleanup (AC: #5)
  - [x] 5.1: Create `clearFallbackHighlights(): void` function
  - [x] 5.2: Find all `.highlight-term-*` span elements in container
  - [x] 5.3: Unwrap spans (move text content back, remove span)
  - [x] 5.4: Normalize text nodes (merge adjacent text nodes)

- [x] Task 6: Implement main fallback highlight function (AC: #2, #3, #4)
  - [x] 6.1: Export `applyFallbackHighlights(terms: TermConfig[]): boolean` function
  - [x] 6.2: Get Monaco container
  - [x] 6.3: Clear previous highlights
  - [x] 6.4: Inject CSS styles (reuse from highlighter.ts)
  - [x] 6.5: Traverse text nodes and apply highlights
  - [x] 6.6: Return true if successful, false if container not found

- [x] Task 7: Implement content change observer (AC: #5)
  - [x] 7.1: Create `observeContentChanges(callback: () => void): void` function
  - [x] 7.2: Set up MutationObserver on `.view-lines` container
  - [x] 7.3: Observe `childList` and `characterData` with `subtree: true`
  - [x] 7.4: Debounce callback to avoid excessive re-application
  - [x] 7.5: Export `disconnectContentObserver(): void` for cleanup

- [x] Task 8: Integrate fallback into main highlighter (AC: #1, #2)
  - [x] 8.1: In `highlighter.ts`, import CSS fallback functions
  - [x] 8.2: In `applyHighlights()`, check if Monaco API is available
  - [x] 8.3: If API unavailable, call `applyFallbackHighlights()` instead
  - [x] 8.4: Set up content change observer in fallback mode

- [x] Task 9: Test fallback scenarios (AC: #1, #2, #6, #7)
  - [x] 9.1: Simulate Monaco API unavailability
  - [x] 9.2: Verify highlights appear via CSS fallback
  - [x] 9.3: Verify highlights update on content change
  - [x] 9.4: Verify Monaco syntax highlighting still works
  - [x] 9.5: Verify no console errors in fallback mode

## Dev Notes

### Architecture Compliance Requirements

**CRITICAL - Follow these patterns exactly (established in previous stories):**

1. **Naming Conventions:**
   - Files: `kebab-case.ts` (e.g., `css-fallback.ts`)
   - Functions: `camelCase` (e.g., `applyFallbackHighlights`, `findTextNodes`)
   - Constants: `UPPER_SNAKE_CASE`

2. **Logging Pattern (MUST use LOG_PREFIX):**
   ```typescript
   import { LOG_PREFIX } from '../shared/constants';
   console.log(`${LOG_PREFIX} Using CSS fallback`);
   console.log(`${LOG_PREFIX} Monaco API not available, using CSS fallback`);
   console.warn(`${LOG_PREFIX} Monaco container not found, skipping highlights`);
   ```

3. **Error Handling:**
   ```typescript
   try {
     // DOM manipulation
   } catch (error) {
     console.error(`${LOG_PREFIX} CSS fallback error:`, error);
     return false;
   }
   ```

### Technical Implementation Details

**TreeWalker for Text Node Traversal:**
```typescript
function findTextNodes(container: HTMLElement): Text[] {
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
```

**Text Node Wrapping Pattern:**
```typescript
function wrapTextWithHighlight(
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

  // Create elements
  const span = document.createElement('span');
  span.className = className;
  span.textContent = match;

  // Replace text node
  const parent = textNode.parentNode;
  if (!parent) return;

  if (before) {
    parent.insertBefore(document.createTextNode(before), textNode);
  }
  parent.insertBefore(span, textNode);
  if (after) {
    // Recursively check for more occurrences
    const afterNode = document.createTextNode(after);
    parent.insertBefore(afterNode, textNode);
    wrapTextWithHighlight(afterNode, term, className);
  }
  parent.removeChild(textNode);
}
```

**Highlight Cleanup (Unwrap Spans):**
```typescript
function clearFallbackHighlights(): void {
  const container = getMonacoContainer();
  if (!container) return;

  // Find all highlight spans
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
}
```

**Monaco API Availability Check:**
```typescript
function isMonacoApiAvailable(editor: unknown): boolean {
  try {
    return (
      editor !== null &&
      typeof editor === 'object' &&
      'deltaDecorations' in editor &&
      typeof (editor as any).deltaDecorations === 'function'
    );
  } catch {
    return false;
  }
}
```

**MutationObserver for Content Changes:**
```typescript
let contentObserver: MutationObserver | null = null;

function observeContentChanges(callback: () => void): void {
  const container = document.querySelector('.view-lines');
  if (!container) return;

  const debouncedCallback = debounce(callback, DEBOUNCE_MS);

  contentObserver = new MutationObserver((mutations) => {
    // Only trigger on actual content changes
    const hasRelevantChange = mutations.some(
      (m) => m.type === 'childList' || m.type === 'characterData'
    );
    if (hasRelevantChange) {
      debouncedCallback();
    }
  });

  contentObserver.observe(container, {
    childList: true,
    characterData: true,
    subtree: true
  });
}

function disconnectContentObserver(): void {
  contentObserver?.disconnect();
  contentObserver = null;
}
```

### Monaco DOM Structure Reference

```html
<!-- Monaco Editor Container -->
<div class="monaco-editor">
  <div class="overflow-guard">
    <div class="monaco-scrollable-element">
      <!-- This is where code lines are rendered -->
      <div class="view-lines">
        <div class="view-line">
          <span class="mtk1">function</span>
          <span class="mtk2"> </span>
          <span class="mtk3">myFunction</span>
          <!-- Each token is a span with mtk* class -->
        </div>
        <!-- More lines... -->
      </div>
    </div>
  </div>
</div>
```

**Key Selectors:**
- `.monaco-editor` - Main container
- `.view-lines` - Container for all code lines
- `.view-line` - Individual line
- `.mtk*` - Monaco token classes (syntax highlighting)

### Dependencies from Previous Stories

**From Story 2.2 (highlighter.ts):**
- `injectHighlightStyles(terms)` - Reuse for CSS class injection
- `applyHighlights()` - Will be modified to check API availability

**From Story 2.1 (monaco-detector.ts):**
- `getMonacoEditor()` - Get editor instance to check API
- `onMonacoDetected()` - Callback system

**From Story 1.1:**
- `debounce()` utility in `src/utils/debounce.ts`
- `DEBOUNCE_MS` constant (150ms)

### Project Structure Notes

**Files to Create:**
```
src/content/
├── css-fallback.ts      # NEW - CSS fallback logic
```

**Files to Modify:**
- `src/content/highlighter.ts` - Add fallback integration

### Critical Don'ts

- DO NOT modify Monaco's own syntax highlighting spans (`.mtk*` classes)
- DO NOT add event listeners that interfere with Monaco's input handling
- DO NOT create memory leaks (always cleanup observers)
- DO NOT wrap text nodes that are inside highlight spans (infinite loop)
- DO NOT use innerHTML for text wrapping (security, breaks structure)
- DO NOT ignore the container check (crash if Monaco not found)

### Critical Dos

- DO use `document.createTreeWalker()` for efficient traversal
- DO call `container.normalize()` after unwrapping spans
- DO debounce content change handlers (DEBOUNCE_MS = 150ms)
- DO preserve Monaco's DOM structure as much as possible
- DO cleanup previous highlights before applying new ones
- DO log clearly which mode is active (API vs fallback)

### Performance Considerations

- TreeWalker is efficient for DOM traversal (O(n) for n nodes)
- Debounce content changes to avoid excessive re-rendering
- Clear highlights before re-applying to avoid duplicate spans
- Use `normalize()` to merge text nodes after cleanup
- MutationObserver is passive and efficient

### Web Research Sources

- [MDN - CSS Custom Highlight API](https://developer.mozilla.org/en-US/docs/Web/API/CSS_Custom_Highlight_API)
- [TreeWalker: A Practical Guide](https://dev.to/k_ivanow/treewalker-a-practical-guide-to-dom-traversal-hn6)
- [DOM TreeWalker - Paul Kinlan](https://paul.kinlan.me/dom-treewalker/)
- [Wrapping DOM Text Nodes with JavaScript](https://coryrylan.com/blog/wrapping-dom-text-nodes-with-javascript)

### Integration Flow

```
1. content.ts calls applyHighlights(editor, terms)
   ↓
2. highlighter.ts checks: isMonacoApiAvailable(editor)?
   ↓
   YES → Use deltaDecorations (Story 2.2)
   NO  → Use CSS fallback (Story 2.3)
   ↓
3. If fallback:
   a. Log "[Highlight Extension] Using CSS fallback"
   b. Get Monaco container (.view-lines)
   c. Clear previous fallback highlights
   d. Inject CSS styles
   e. Traverse text nodes with TreeWalker
   f. Wrap matching terms in spans
   g. Set up MutationObserver for content changes
   ↓
4. On content change (in fallback mode):
   a. Debounce (150ms)
   b. Clear and re-apply highlights
```

### References

- [Source: _bmad-output/planning-artifacts/architecture.md#Monaco-Integration-Architecture]
- [Source: _bmad-output/planning-artifacts/architecture.md#NFR5-Graceful-Fallback]
- [Source: _bmad-output/planning-artifacts/epics.md#Story-2.3]
- [Source: _bmad-output/planning-artifacts/project-context.md#Monaco-Integration-Rules]
- [Source: _bmad-output/implementation-artifacts/2-2-term-highlighting-with-monaco-decorators-api.md]

## Dev Agent Record

### Agent Model Used

Claude Sonnet 4.5 (claude-sonnet-4-5-20250929)

### Debug Log References

No blocking issues encountered during implementation.

### Completion Notes List

**Implementation Summary:**

1. **Created CSS Fallback Module** (`src/content/css-fallback.ts`)
   - Implemented `isMonacoApiAvailable()` to detect Monaco API availability
   - Created `getMonacoContainer()` for DOM container detection (supports both `.view-lines` and `.monaco-editor`)
   - Implemented `findTextNodes()` using TreeWalker for efficient DOM traversal
   - Built `wrapTextWithHighlight()` for recursive text node wrapping with highlight spans
   - Developed `clearFallbackHighlights()` for cleanup and normalization
   - Created `applyFallbackHighlights()` as main entry point for CSS fallback mode
   - Implemented `observeContentChanges()` with MutationObserver for automatic re-application
   - Added `disconnectContentObserver()` for proper cleanup

2. **Integrated Fallback into Highlighter** (`src/content/highlighter.ts`)
   - Modified `applyHighlights()` to check Monaco API availability
   - Added automatic fallback activation when API is unavailable
   - Implemented content change observer setup in fallback mode
   - Updated `clearHighlights()` to handle both API and fallback modes
   - Added module state tracking (`usingFallbackMode`, `storedTerms`)

3. **Architecture Compliance:**
   - Used `LOG_PREFIX` for all console statements
   - Followed naming conventions: `kebab-case.ts` files, `camelCase` functions
   - Implemented proper error handling with try-catch blocks
   - Used `DEBOUNCE_MS` constant for content change debouncing
   - Maintained ES2020 module imports with `.js` extensions

4. **Key Technical Decisions:**
   - TreeWalker provides O(n) DOM traversal efficiency
   - MutationObserver watches for `childList` and `characterData` changes
   - Debouncing prevents excessive re-application (150ms delay)
   - Recursive wrapping handles multiple term occurrences in single text node
   - Container.normalize() merges adjacent text nodes after cleanup
   - Skips text nodes inside highlight spans to prevent infinite loops

5. **Validation Against Acceptance Criteria:**
   - ✅ AC1: Monaco API availability detection implemented
   - ✅ AC2: CSS fallback activates automatically with proper logging
   - ✅ AC3: DOM-based highlighting using TreeWalker and text node wrapping
   - ✅ AC4: Highlight styling matches API mode (same CSS classes and colors)
   - ✅ AC5: MutationObserver re-applies highlights on content changes
   - ✅ AC6: Monaco's own rendering preserved (doesn't modify syntax highlighting)
   - ✅ AC7: Graceful degradation with error handling and warnings

### File List

**New Files:**
- src/content/css-fallback.ts

**Modified Files:**
- src/content/highlighter.ts

### Change Log

- 2026-01-08: Implemented CSS fallback highlighting system with Monaco API detection, DOM-based text wrapping, and automatic content change observation (Story 2.3)
