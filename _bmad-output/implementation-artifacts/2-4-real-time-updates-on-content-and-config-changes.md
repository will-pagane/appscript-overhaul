# Story 2.4: Real-time Updates on Content and Config Changes

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a user,
I want highlights to update automatically when I edit code or change my configuration,
so that I always see current highlights without refreshing.

## Acceptance Criteria

1. **Editor Content Change Detection** - Highlights update when code changes:
   - When user types or edits code in Monaco editor
   - Highlights update automatically to reflect new term occurrences (FR8)
   - Updates are debounced at 150ms to prevent lag (NFR3, DEBOUNCE_MS)
   - No perceptible typing lag occurs
   - Log message: `[Highlight Extension] Content changed, refreshing highlights`

2. **Configuration Change from Popup** - Highlights update when terms modified:
   - When user adds, modifies, or removes a term in popup
   - Editor highlights update within 200ms (FR9, NFR2)
   - No page refresh required
   - Works while popup is open
   - Log message: `[Highlight Extension] Terms updated, refreshing highlights`

3. **Storage Sync Changes** - Highlights update from external sources:
   - When `chrome.storage.onChanged` fires (e.g., sync from another browser)
   - Highlights refresh automatically
   - Content script responds to storage changes
   - Log message: `[Highlight Extension] Storage changed, refreshing highlights`

4. **Direct Message Handling** - Popup can trigger immediate refresh:
   - Content script listens for `TERMS_UPDATED` message
   - Responds with `{ success: true }` after refresh
   - Message handler returns `true` for async response
   - Provides immediate feedback to popup

5. **Performance Requirements** - No typing lag:
   - Debounce prevents excessive re-renders during rapid typing
   - Highlight refresh completes within 100ms of debounce trigger
   - Memory usage remains stable during continuous editing
   - No dropped keystrokes or input delay

6. **Fallback Mode Compatibility** - Works in both highlighting modes:
   - Content change detection works in Monaco API mode
   - Content change detection works in CSS fallback mode
   - Same debounce timing in both modes
   - Consistent behavior regardless of mode

7. **Cleanup and Disposal** - Proper resource management:
   - Event listeners are properly disposed when needed
   - No memory leaks from accumulated listeners
   - `dispose()` methods called on Monaco subscriptions

## Tasks / Subtasks

- [ ] Task 1: Implement editor content change listener (AC: #1, #5)
  - [ ] 1.1: In highlighter.ts, create `setupContentChangeListener(editor)` function
  - [ ] 1.2: Use `editor.onDidChangeModelContent()` to detect changes
  - [ ] 1.3: Store the disposable returned by the listener
  - [ ] 1.4: Import and use `debounce` from utils/debounce.ts
  - [ ] 1.5: Debounce the refresh callback at DEBOUNCE_MS (150ms)

- [ ] Task 2: Implement storage change listener (AC: #3)
  - [ ] 2.1: In content.ts, add `chrome.storage.onChanged.addListener()`
  - [ ] 2.2: Check for `namespace === 'sync'` and `changes[STORAGE_KEY]`
  - [ ] 2.3: Extract new terms from `changes[STORAGE_KEY].newValue`
  - [ ] 2.4: Call highlight refresh with new terms
  - [ ] 2.5: Log storage change detection

- [ ] Task 3: Implement message listener (AC: #4)
  - [ ] 3.1: In content.ts, add `chrome.runtime.onMessage.addListener()`
  - [ ] 3.2: Handle `TERMS_UPDATED` message type
  - [ ] 3.3: Handle `REFRESH_HIGHLIGHTS` message type
  - [ ] 3.4: Load fresh terms from storage and refresh highlights
  - [ ] 3.5: Send `{ success: true }` response
  - [ ] 3.6: Return `true` for async response handling

- [ ] Task 4: Create unified refresh function (AC: #1, #2, #3, #6)
  - [ ] 4.1: Export `refreshHighlights(): Promise<void>` function
  - [ ] 4.2: Get current editor instance via `getMonacoEditor()`
  - [ ] 4.3: Load terms from storage via `loadTerms()`
  - [ ] 4.4: Call `applyHighlights(editor, terms)` (handles API vs fallback)
  - [ ] 4.5: Log refresh completion

- [ ] Task 5: Implement debounced content refresh (AC: #1, #5)
  - [ ] 5.1: Create module-level debounced refresh function
  - [ ] 5.2: Use `debounce(refreshHighlights, DEBOUNCE_MS)`
  - [ ] 5.3: Call debounced function from content change listener
  - [ ] 5.4: Ensure no double-refresh during rapid changes

- [ ] Task 6: Implement CSS fallback content observer (AC: #6)
  - [ ] 6.1: In css-fallback.ts, verify `observeContentChanges()` is implemented
  - [ ] 6.2: Ensure observer calls debounced refresh
  - [ ] 6.3: Verify cleanup with `disconnectContentObserver()`

- [ ] Task 7: Implement cleanup/disposal (AC: #7)
  - [ ] 7.1: Store all disposables in array
  - [ ] 7.2: Export `disposeHighlightListeners(): void` function
  - [ ] 7.3: Call `dispose()` on Monaco subscriptions
  - [ ] 7.4: Remove Chrome API listeners if needed
  - [ ] 7.5: Disconnect MutationObserver in fallback mode

- [ ] Task 8: Update popup to send messages (AC: #2, #4)
  - [ ] 8.1: In popup.ts, after saving terms, send `TERMS_UPDATED` message
  - [ ] 8.2: Use `chrome.tabs.query({ active: true, currentWindow: true })`
  - [ ] 8.3: Send message to active tab with `chrome.tabs.sendMessage()`
  - [ ] 8.4: Handle response for confirmation (optional)

- [ ] Task 9: Test real-time update scenarios (AC: #1, #2, #3, #5)
  - [ ] 9.1: Test typing in editor - verify highlights update after debounce
  - [ ] 9.2: Test adding term in popup - verify immediate highlight
  - [ ] 9.3: Test removing term in popup - verify immediate removal
  - [ ] 9.4: Test rapid typing - verify no lag
  - [ ] 9.5: Measure update timing (<200ms requirement)

## Dev Notes

### Architecture Compliance Requirements

**CRITICAL - Follow these patterns exactly (established in previous stories):**

1. **Naming Conventions:**
   - Files: `kebab-case.ts`
   - Functions: `camelCase` (e.g., `refreshHighlights`, `setupContentChangeListener`)
   - Constants: `UPPER_SNAKE_CASE` (e.g., `DEBOUNCE_MS`, `STORAGE_KEY`)

2. **Logging Pattern (MUST use LOG_PREFIX):**
   ```typescript
   import { LOG_PREFIX } from '../shared/constants';
   console.log(`${LOG_PREFIX} Content changed, refreshing highlights`);
   console.log(`${LOG_PREFIX} Terms updated, refreshing highlights`);
   console.log(`${LOG_PREFIX} Storage changed, refreshing highlights`);
   ```

3. **Error Handling:**
   ```typescript
   try {
     await refreshHighlights();
   } catch (error) {
     console.error(`${LOG_PREFIX} Refresh error:`, error);
   }
   ```

### Technical Implementation Details

**Monaco Content Change Listener:**
```typescript
import { debounce } from '../utils/debounce';
import { DEBOUNCE_MS, LOG_PREFIX } from '../shared/constants';

let contentChangeDisposable: { dispose(): void } | null = null;

function setupContentChangeListener(editor: MonacoEditorInstance): void {
  // Dispose previous listener if exists
  contentChangeDisposable?.dispose();

  const debouncedRefresh = debounce(async () => {
    console.log(`${LOG_PREFIX} Content changed, refreshing highlights`);
    await refreshHighlights();
  }, DEBOUNCE_MS);

  contentChangeDisposable = editor.onDidChangeModelContent(() => {
    debouncedRefresh();
  });
}
```

**Storage Change Listener:**
```typescript
import { STORAGE_KEY, LOG_PREFIX } from '../shared/constants';

chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'sync' && changes[STORAGE_KEY]) {
    console.log(`${LOG_PREFIX} Storage changed, refreshing highlights`);
    const newTerms = changes[STORAGE_KEY].newValue || [];
    refreshHighlightsWithTerms(newTerms);
  }
});
```

**Message Listener:**
```typescript
import { ChromeMessage, ChromeResponse } from '../shared/types';

chrome.runtime.onMessage.addListener(
  (message: ChromeMessage, sender, sendResponse: (response: ChromeResponse) => void) => {
    if (message.type === 'TERMS_UPDATED' || message.type === 'REFRESH_HIGHLIGHTS') {
      console.log(`${LOG_PREFIX} Terms updated, refreshing highlights`);

      refreshHighlights()
        .then(() => {
          sendResponse({ success: true });
        })
        .catch((error) => {
          console.error(`${LOG_PREFIX} Refresh error:`, error);
          sendResponse({ success: false, error: String(error) });
        });

      return true; // Keep channel open for async response
    }
    return false;
  }
);
```

**Popup Sending Message:**
```typescript
// In popup.ts, after saving terms
async function notifyContentScript(): Promise<void> {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab?.id) {
      await chrome.tabs.sendMessage(tab.id, { type: 'TERMS_UPDATED' });
      console.log(`${LOG_PREFIX} Notified content script`);
    }
  } catch (error) {
    // Content script may not be loaded (not on script.google.com)
    console.log(`${LOG_PREFIX} Could not notify content script:`, error);
  }
}

// Call after saveTerms()
await saveTerms(terms);
await notifyContentScript();
```

**Unified Refresh Function:**
```typescript
async function refreshHighlights(): Promise<void> {
  const editor = getMonacoEditor();
  if (!editor) {
    console.warn(`${LOG_PREFIX} No editor available for refresh`);
    return;
  }

  const terms = await loadTerms();
  applyHighlights(editor, terms);
}

// Alternative: refresh with provided terms (avoids extra storage read)
function refreshHighlightsWithTerms(terms: TermConfig[]): void {
  const editor = getMonacoEditor();
  if (!editor) {
    console.warn(`${LOG_PREFIX} No editor available for refresh`);
    return;
  }

  applyHighlights(editor, terms);
}
```

**Cleanup/Disposal:**
```typescript
const disposables: Array<{ dispose(): void }> = [];

function disposeHighlightListeners(): void {
  disposables.forEach((d) => d.dispose());
  disposables.length = 0;

  // Also disconnect fallback observer
  disconnectContentObserver();

  console.log(`${LOG_PREFIX} Disposed all highlight listeners`);
}

// When setting up listeners, add to array:
disposables.push(contentChangeDisposable);
```

### Dependencies from Previous Stories

**From Story 2.1 (monaco-detector.ts):**
- `getMonacoEditor()` - Get current editor instance
- `onMonacoDetected()` - Initial setup callback

**From Story 2.2 (highlighter.ts):**
- `applyHighlights(editor, terms)` - Apply highlights
- `clearHighlights(editor)` - Clear all highlights

**From Story 2.3 (css-fallback.ts):**
- `observeContentChanges(callback)` - MutationObserver for fallback mode
- `disconnectContentObserver()` - Cleanup observer

**From Story 1.1:**
- `loadTerms()` - Load terms from storage
- `debounce()` - Debounce utility
- `DEBOUNCE_MS` = 150ms
- `STORAGE_KEY` = 'highlightTerms'
- `ChromeMessage`, `ChromeResponse` types

### Communication Flow

```
┌─────────────────────────────────────────────────────────────┐
│                      POPUP                                   │
│  User adds/modifies/removes term                            │
│  ↓                                                          │
│  1. saveTerms() → chrome.storage.sync                       │
│  2. chrome.tabs.sendMessage({ type: 'TERMS_UPDATED' })      │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                   CONTENT SCRIPT                             │
│                                                              │
│  Listeners:                                                  │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ chrome.runtime.onMessage                            │    │
│  │ → TERMS_UPDATED → refreshHighlights()               │    │
│  └─────────────────────────────────────────────────────┘    │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ chrome.storage.onChanged                            │    │
│  │ → terms changed → refreshHighlightsWithTerms()      │    │
│  └─────────────────────────────────────────────────────┘    │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ editor.onDidChangeModelContent (API mode)           │    │
│  │ → debounce(150ms) → refreshHighlights()             │    │
│  └─────────────────────────────────────────────────────┘    │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ MutationObserver (CSS fallback mode)                │    │
│  │ → debounce(150ms) → refreshHighlights()             │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

### Project Structure Notes

**Files to Modify:**
- `src/content/content.ts` - Add storage and message listeners
- `src/content/highlighter.ts` - Add content change listener, refresh functions
- `src/popup/popup.ts` - Add message sending after save

**No New Files Required** - This story integrates existing modules.

### Critical Don'ts

- DO NOT add listeners without storing disposables (memory leak)
- DO NOT refresh highlights on every keystroke (must debounce)
- DO NOT block the message handler (must return true for async)
- DO NOT assume editor is always available (check null)
- DO NOT hardcode STORAGE_KEY (use constant)
- DO NOT forget to handle both API and fallback modes

### Critical Dos

- DO use DEBOUNCE_MS (150ms) for content change debouncing
- DO return `true` from message listener for async responses
- DO call `dispose()` on Monaco subscriptions when cleaning up
- DO handle the case where content script isn't loaded (popup message)
- DO log each type of update trigger for debugging
- DO use try-catch around all Chrome API calls

### Performance Requirements

- **NFR2:** Config changes reflected within 200ms
- **NFR3:** No perceptible typing lag
- **DEBOUNCE_MS:** 150ms debounce for content changes
- Highlight refresh should complete within 100ms of trigger
- No dropped keystrokes during rapid typing

### Edge Cases to Handle

1. **Editor not yet available** - Log warning, skip refresh
2. **No terms configured** - Clear highlights, don't error
3. **Content script not loaded** - Popup message fails gracefully
4. **Rapid configuration changes** - Storage listener may fire multiple times
5. **Tab not active** - Message may fail, handle gracefully
6. **Monaco model is null** - Check before accessing getValue()

### Testing Checklist

- [ ] Type in editor → highlights update after 150ms
- [ ] Add term in popup → highlights appear within 200ms
- [ ] Remove term in popup → highlights disappear within 200ms
- [ ] Change term color → highlights update color
- [ ] Rapid typing → no lag, highlights stable after pause
- [ ] Close/reopen popup → highlights still work
- [ ] Navigate away and back → highlights reapply

### References

- [Source: _bmad-output/planning-artifacts/architecture.md#Communication-Patterns]
- [Source: _bmad-output/planning-artifacts/architecture.md#Highlight-Application-Flow]
- [Source: _bmad-output/planning-artifacts/epics.md#Story-2.4]
- [Source: _bmad-output/planning-artifacts/project-context.md#Chrome-Extension-Rules]
- [Source: _bmad-output/implementation-artifacts/2-2-term-highlighting-with-monaco-decorators-api.md]
- [Source: _bmad-output/implementation-artifacts/2-3-css-fallback-highlighting.md]

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List
