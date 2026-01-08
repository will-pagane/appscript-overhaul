# Story 2.1: Content Script Foundation and Monaco Detection

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a user,
I want the extension to automatically detect when the Monaco editor loads,
so that highlighting can be applied without manual intervention.

## Acceptance Criteria

1. **Content Script Injection** - Content script is injected on script.google.com pages:
   - manifest.json has `content_scripts` configuration pointing to content script
   - Content script runs automatically when navigating to script.google.com
   - Log message appears: `[Highlight Extension] Content script loaded`

2. **Monaco Detection via MutationObserver (Primary)** - Detects Monaco editor when DOM changes:
   - MutationObserver watches `document.body` for added nodes
   - Detection triggers when `.monaco-editor` container appears in DOM
   - Or when `window.monaco` global becomes available
   - Detection works regardless of page load timing (NFR6)
   - Log message: `[Highlight Extension] Monaco editor detected (MutationObserver)`

3. **Monaco Detection via Polling (Fallback)** - Fallback when MutationObserver misses:
   - If MutationObserver hasn't detected Monaco within 2 seconds, start polling
   - Polling checks every 500ms (POLL_INTERVAL_MS constant)
   - Timeout after 10 seconds (POLL_TIMEOUT_MS constant)
   - Log message on success: `[Highlight Extension] Monaco editor detected (polling)`
   - Log message on timeout: `[Highlight Extension] Monaco editor not found (timeout)`

4. **Monaco Instance Access** - Captured Monaco instance is usable:
   - Function `getMonacoEditor()` returns the detected Monaco editor instance
   - Returns `null` if not yet detected
   - Instance provides access to `editor.getModel()` and `editor.deltaDecorations()`

5. **Detection Event Callback** - External code can respond to detection:
   - `onMonacoDetected(callback: (editor: MonacoEditorInstance) => void)` function
   - Callback fires immediately if Monaco already detected
   - Callback fires when Monaco is detected for the first time

6. **No Interference with Monaco** - Extension doesn't break editor functionality:
   - Native Monaco features work normally (autocomplete, syntax highlighting, etc.) (NFR7)
   - No console errors caused by detection logic
   - Detection is passive (observation only, no DOM modifications)

## Tasks / Subtasks

- [x] Task 1: Add content script to manifest.json (AC: #1)
  - [x] 1.1: Add `content_scripts` section to manifest.json
  - [x] 1.2: Configure `matches` for `https://script.google.com/*`
  - [x] 1.3: Point `js` to `content/content.js`
  - [x] 1.4: Set `run_at` to `document_idle`

- [x] Task 2: Create content script entry point (AC: #1)
  - [x] 2.1: Create `src/content/content.ts`
  - [x] 2.2: Add initialization log with LOG_PREFIX
  - [x] 2.3: Import and call Monaco detector initialization

- [x] Task 3: Create Monaco detector types (AC: #4)
  - [x] 3.1: Add `MonacoEditorInstance` interface to `src/shared/types.ts`
  - [x] 3.2: Interface should include: `getModel()`, `deltaDecorations()`, `onDidChangeModelContent()`
  - [x] 3.3: Add `MonacoDetectionCallback` type alias

- [x] Task 4: Implement MutationObserver detection (AC: #2, #6)
  - [x] 4.1: Create `src/content/monaco-detector.ts`
  - [x] 4.2: Implement `initMonacoDetector()` function
  - [x] 4.3: Create MutationObserver on `document.body` with `childList: true, subtree: true`
  - [x] 4.4: Check for `.monaco-editor` elements in mutations
  - [x] 4.5: Check for `window.monaco.editor.getEditors()` availability
  - [x] 4.6: Disconnect observer once Monaco is found

- [x] Task 5: Implement polling fallback (AC: #3)
  - [x] 5.1: Start polling timer 2 seconds after MutationObserver setup
  - [x] 5.2: Poll every POLL_INTERVAL_MS (500ms)
  - [x] 5.3: Stop polling after POLL_TIMEOUT_MS (10s) if not found
  - [x] 5.4: Clear polling interval when Monaco is detected
  - [x] 5.5: Log appropriate messages for success/timeout

- [x] Task 6: Implement Monaco instance access (AC: #4)
  - [x] 6.1: Export `getMonacoEditor()` function from monaco-detector.ts
  - [x] 6.2: Store detected editor instance in module-level variable
  - [x] 6.3: Return null if not yet detected

- [x] Task 7: Implement detection callback system (AC: #5)
  - [x] 7.1: Export `onMonacoDetected(callback)` function
  - [x] 7.2: Store callbacks in array for multiple listeners
  - [x] 7.3: Fire callback immediately if Monaco already detected
  - [x] 7.4: Fire all stored callbacks when detection occurs

- [x] Task 8: Update build script for content script (AC: #1)
  - [x] 8.1: Verify tsc compiles content script to dist/content/
  - [x] 8.2: Test build with `npm run build`

- [x] Task 9: Test detection scenarios (AC: #2, #3, #6)
  - [x] 9.1: Test detection on fresh page load
  - [x] 9.2: Test detection on page with slow Monaco load
  - [x] 9.3: Verify Monaco autocomplete/syntax highlighting still works
  - [x] 9.4: Verify no console errors from extension

## Dev Notes

### Architecture Compliance Requirements

**CRITICAL - Follow these patterns exactly (established in Story 1.1):**

1. **Naming Conventions:**
   - Files: `kebab-case.ts` (e.g., `content.ts`, `monaco-detector.ts`)
   - Interfaces/Types: `PascalCase` (e.g., `MonacoEditorInstance`)
   - Functions: `camelCase` (e.g., `initMonacoDetector`, `getMonacoEditor`)
   - Constants: `UPPER_SNAKE_CASE` (already defined: `LOG_PREFIX`, `POLL_INTERVAL_MS`, `POLL_TIMEOUT_MS`)

2. **Logging Pattern (MUST use LOG_PREFIX):**
   ```typescript
   import { LOG_PREFIX } from '../shared/constants';
   console.log(`${LOG_PREFIX} Content script loaded`);
   console.log(`${LOG_PREFIX} Monaco editor detected (MutationObserver)`);
   console.error(`${LOG_PREFIX} Error:`, error);
   ```

3. **Error Handling Pattern:**
   ```typescript
   try {
     // Monaco detection logic
   } catch (error) {
     console.error(`${LOG_PREFIX} Detection error:`, error);
   }
   ```

### Technical Implementation Details

**Monaco Detection Strategy (from Architecture):**

The Monaco Editor on script.google.com may expose:
- `window.monaco` global object
- `window.monaco.editor.getEditors()` array of active editors
- DOM elements with `.monaco-editor` class

**Detection Priority:**
1. Check `window.monaco.editor.getEditors()[0]` - returns editor instance directly
2. Fallback to finding `.monaco-editor` DOM element and accessing internal editor

**MutationObserver Configuration:**
```typescript
const observer = new MutationObserver((mutations) => {
  for (const mutation of mutations) {
    if (mutation.addedNodes.length > 0) {
      checkForMonaco();
    }
  }
});

observer.observe(document.body, {
  childList: true,
  subtree: true
});
```

**Monaco Interface (minimal for detection):**
```typescript
export interface MonacoEditorInstance {
  getModel(): unknown;
  deltaDecorations(oldDecorations: string[], newDecorations: unknown[]): string[];
  onDidChangeModelContent(listener: () => void): { dispose(): void };
  getValue(): string;
}
```

**Manifest Content Script Configuration:**
```json
{
  "content_scripts": [
    {
      "matches": ["https://script.google.com/*"],
      "js": ["content/content.js"],
      "run_at": "document_idle"
    }
  ]
}
```

### Previous Story Learnings (from Stories 1.1, 1.2, 1.3)

**Established Infrastructure (Story 1.1):**
- TypeScript 5.9.3 configured with strict mode
- Constants already defined in `src/shared/constants.ts`:
  - `LOG_PREFIX = '[Highlight Extension]'`
  - `POLL_INTERVAL_MS = 500`
  - `POLL_TIMEOUT_MS = 10000`
- Types exist in `src/shared/types.ts` (add Monaco types here)
- Cross-platform build script in `scripts/copy-static.js`

**Build Command:** `npm run build` compiles TypeScript and copies static files

**Key Pattern:** All Chrome API calls and detection logic must be in try-catch blocks

**Code Review Learnings (Stories 1.2, 1.3):**

1. **aria-label is text, not HTML:** Don't use escapeHtml() for aria-label attributes - they're plain text and escaping causes literal `&lt;` to be read by screen readers

2. **Always add :focus styles:** For keyboard accessibility, interactive elements need visible focus indicators (use `outline: 2px solid #2196f3; outline-offset: 1px;`)

3. **Use aria-hidden for decorative content:** Visual characters like × should be hidden from screen readers when aria-label provides the accessible name

4. **Event delegation pattern:** Using single event listeners on container instead of per-item listeners works well for dynamic content and avoids memory leaks

5. **Hex colors don't need escaping:** Color picker values are always valid hex format - no XSS risk, don't wrap in escapeHtml()

6. **Add input constraints:** Use maxlength on text inputs to prevent UI issues with very long inputs

### Project Structure Notes

**Files to Create:**
```
src/content/
├── content.ts           # Entry point (imports and initializes)
└── monaco-detector.ts   # All detection logic
```

**Files to Modify:**
- `manifest.json` - Add content_scripts configuration
- `src/shared/types.ts` - Add Monaco-related interfaces

### Critical Don'ts

- DO NOT modify DOM elements during detection - observation only
- DO NOT assume Monaco is immediately available
- DO NOT skip the polling fallback - it's required for edge cases
- DO NOT create console statements without LOG_PREFIX
- DO NOT use deprecated DOM Mutation Events (use MutationObserver)
- DO NOT interfere with Monaco's native functionality

### Critical Dos

- DO disconnect MutationObserver once Monaco is detected (cleanup)
- DO clear polling interval when Monaco is found
- DO handle the case where Monaco never appears (timeout)
- DO store editor reference for later use by highlighting engine
- DO fire callbacks for any registered listeners

### Web Research Insights

**Monaco Editor Detection Best Practices:**
- Use `MutationObserver` (modern, efficient) not `DOMNodeInserted` (deprecated)
- Chrome extensions should use `document_idle` for content scripts on dynamic pages
- Monaco typically exposes `window.monaco` global when loaded
- The `.monaco-editor` class appears on the main container element

Sources:
- [Chrome Developer Blog - MutationObserver](https://developer.chrome.com/blog/detect-dom-changes-with-mutation-observers)
- [MDN - MutationObserver API](https://developer.mozilla.org/en-US/docs/Web/API/MutationObserver)

### Performance Considerations

- MutationObserver is efficient and passive (NFR3: no typing lag)
- Polling only activates if MutationObserver fails after 2s delay
- Detection should complete within 100ms of Monaco appearing (NFR1)
- Memory footprint remains minimal with cleanup (NFR4: <10MB)

### References

- [Source: _bmad-output/planning-artifacts/architecture.md#Monaco-Integration-Architecture]
- [Source: _bmad-output/planning-artifacts/architecture.md#Project-Structure-&-Boundaries]
- [Source: _bmad-output/planning-artifacts/epics.md#Story-2.1]
- [Source: _bmad-output/planning-artifacts/project-context.md#Monaco-Integration-Rules]
- [Source: _bmad-output/implementation-artifacts/1-1-project-initialization-and-extension-foundation.md#Completion-Notes]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

- Build successful: `npm run build` completed without errors
- TypeScript compilation: All files compiled to dist/ directory

### Completion Notes List

1. **Content Script Configuration (AC #1)**: Added `content_scripts` section to manifest.json with correct matches pattern for script.google.com, pointing to content/content.js with document_idle timing

2. **Monaco Detection via MutationObserver (AC #2)**: Implemented MutationObserver on document.body with childList and subtree options. Detects Monaco when .monaco-editor container appears or window.monaco.editor.getEditors() becomes available

3. **Polling Fallback (AC #3)**: Implemented 2-second delayed polling fallback that checks every 500ms (POLL_INTERVAL_MS) with 10-second timeout (POLL_TIMEOUT_MS). Logs appropriate messages for success/timeout

4. **Monaco Instance Access (AC #4)**: Added MonacoEditorInstance interface with getModel(), deltaDecorations(), onDidChangeModelContent(), and getValue() methods. Exported getMonacoEditor() function returns instance or null

5. **Detection Callback System (AC #5)**: Implemented onMonacoDetected(callback) function supporting multiple listeners, with immediate callback firing if Monaco already detected

6. **No Interference (AC #6)**: Implementation is entirely passive - uses observation only, no DOM modifications, proper cleanup of observers and timers

### File List

**Created:**
- src/content/monaco-detector.ts

**Modified:**
- manifest.json (added content_scripts configuration)
- src/content/content.ts (added monaco detector import and initialization)
- src/shared/types.ts (added MonacoEditorInstance interface and MonacoDetectionCallback type)
- src/shared/constants.ts (added POLL_START_DELAY_MS constant - code review fix)

**Build Output:**
- dist/content/content.js
- dist/content/monaco-detector.js
- dist/shared/types.js
- dist/manifest.json

## Senior Developer Review (AI)

**Review Date:** 2026-01-08
**Review Outcome:** Approved (after fixes)
**Reviewer:** Claude Opus 4.5 (Adversarial Code Review)

### Issues Found and Fixed

| Severity | Issue | Resolution |
|----------|-------|------------|
| HIGH | Race condition: dual timeout mechanisms could log "Monaco not found" twice | Refactored to use single poll-count based timeout |
| HIGH | Redundant code: secondary check in checkForMonaco() identical to primary | Removed redundant block, kept single clean check |
| MEDIUM | Magic number POLL_START_DELAY_MS not in constants.ts | Moved to src/shared/constants.ts |
| MEDIUM | No unsubscribe mechanism for onMonacoDetected callbacks | Added return disposal function |
| LOW | Missing idempotent documentation on cleanup() | Added JSDoc comment |

### Action Items

- [x] HIGH: Fix timeout race condition in startPolling()
- [x] HIGH: Remove redundant code in checkForMonaco()
- [x] MEDIUM: Move POLL_START_DELAY_MS to constants.ts
- [x] MEDIUM: Add disposal function to onMonacoDetected()

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2026-01-08 | Initial implementation of content script foundation and Monaco detection | Claude Opus 4.5 |
| 2026-01-08 | Code review fixes: race condition, redundant code, constants, callback disposal | Claude Opus 4.5 (Review) |
