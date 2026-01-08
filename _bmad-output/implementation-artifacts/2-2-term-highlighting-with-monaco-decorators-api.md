# Story 2.2: Term Highlighting with Monaco Decorators API

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a user,
I want my configured terms to appear highlighted in the editor,
so that I can visually track important objects in my code.

## Acceptance Criteria

1. **Highlights Applied on Monaco Detection** - Terms are highlighted when editor loads:
   - When Monaco is detected (via Story 2.1's `onMonacoDetected` callback), load terms from storage
   - Apply highlights to all instances of each configured term (FR7)
   - Highlights appear within 100ms of editor load completion (NFR1)
   - Log message: `[Highlight Extension] Applied highlights for X terms`

2. **Multiple Simultaneous Highlights** - Different terms show different colors:
   - Each term displays with its configured color (FR10)
   - Multiple terms can be highlighted simultaneously in the same view
   - Colors are visually distinct and don't interfere with each other
   - Example: "resources" in pink, "Logger" in yellow, "SpreadsheetApp" in green

3. **Monaco Decorators API Usage** - Uses native Monaco API for clean integration:
   - `editor.deltaDecorations()` is used to apply highlights
   - Each term gets its own CSS class with background color
   - Decoration IDs are stored for later removal/update
   - Decorations use `inlineClassName` option for inline text highlighting

4. **Text Search and Range Calculation** - Finds all term occurrences:
   - Search is case-sensitive (exact match)
   - All occurrences of each term in the editor are found
   - Correct `IRange` objects created: `{ startLineNumber, startColumn, endLineNumber, endColumn }`
   - Handles terms spanning single lines only (no multi-line terms)

5. **No Interference with Monaco Features** - Native functionality preserved:
   - Autocomplete works normally (NFR7)
   - Syntax highlighting from Monaco is preserved
   - Find/Replace functionality works
   - Code folding, minimap, and other features unaffected
   - No console errors from highlighting logic

6. **Dynamic CSS Class Generation** - Colors applied via injected styles:
   - CSS classes generated dynamically for each term's color
   - Format: `.highlight-term-{index}` with background-color
   - Styles injected into page `<head>` once
   - Supports any hex color from user configuration

## Tasks / Subtasks

- [ ] Task 1: Create highlighter module (AC: #3, #6)
  - [ ] 1.1: Create `src/content/highlighter.ts`
  - [ ] 1.2: Import `MonacoEditorInstance` type and `TermConfig` from shared/types
  - [ ] 1.3: Import `LOG_PREFIX` from shared/constants
  - [ ] 1.4: Create module-level variable to store current decoration IDs

- [ ] Task 2: Implement CSS class injection (AC: #6)
  - [ ] 2.1: Create `injectHighlightStyles(terms: TermConfig[])` function
  - [ ] 2.2: Generate CSS class for each term: `.highlight-term-{index} { background-color: {color}; }`
  - [ ] 2.3: Create or update `<style id="highlight-extension-styles">` in document head
  - [ ] 2.4: Clear old styles before injecting new ones

- [ ] Task 3: Implement term search in editor content (AC: #4)
  - [ ] 3.1: Create `findTermOccurrences(content: string, term: string): IRange[]` function
  - [ ] 3.2: Use string indexOf or regex to find all occurrences
  - [ ] 3.3: Convert character positions to line/column positions
  - [ ] 3.4: Return array of Monaco IRange objects

- [ ] Task 4: Implement decoration creation (AC: #3, #4)
  - [ ] 4.1: Create `createDecorations(terms: TermConfig[], content: string): IModelDeltaDecoration[]` function
  - [ ] 4.2: For each term, find all occurrences
  - [ ] 4.3: Create decoration object with range and inlineClassName option
  - [ ] 4.4: Return flat array of all decorations

- [ ] Task 5: Implement main highlight function (AC: #1, #2, #3)
  - [ ] 5.1: Export `applyHighlights(editor: MonacoEditorInstance, terms: TermConfig[]): void` function
  - [ ] 5.2: Get editor content via `editor.getModel().getValue()`
  - [ ] 5.3: Inject CSS styles for term colors
  - [ ] 5.4: Create decorations for all terms
  - [ ] 5.5: Call `editor.deltaDecorations(oldIds, newDecorations)`
  - [ ] 5.6: Store returned decoration IDs for future updates
  - [ ] 5.7: Log success message with term count

- [ ] Task 6: Implement highlight clearing (AC: #3)
  - [ ] 6.1: Export `clearHighlights(editor: MonacoEditorInstance): void` function
  - [ ] 6.2: Call `editor.deltaDecorations(currentIds, [])` to remove all
  - [ ] 6.3: Reset stored decoration IDs array

- [ ] Task 7: Integrate with Monaco detection (AC: #1)
  - [ ] 7.1: In `content.ts`, import `onMonacoDetected` from monaco-detector
  - [ ] 7.2: Import `applyHighlights` from highlighter
  - [ ] 7.3: Import `loadTerms` from shared/storage
  - [ ] 7.4: Register callback: when Monaco detected, load terms and apply highlights

- [ ] Task 8: Add Monaco decoration types (AC: #3, #4)
  - [ ] 8.1: Add `IRange` interface to shared/types.ts
  - [ ] 8.2: Add `IModelDeltaDecoration` interface to shared/types.ts
  - [ ] 8.3: Add `IModelDecorationOptions` interface to shared/types.ts

- [ ] Task 9: Test highlighting scenarios (AC: #1, #2, #5)
  - [ ] 9.1: Test with single term configured
  - [ ] 9.2: Test with multiple terms (3+) simultaneously
  - [ ] 9.3: Test with term appearing multiple times in code
  - [ ] 9.4: Verify Monaco autocomplete still works
  - [ ] 9.5: Verify syntax highlighting preserved
  - [ ] 9.6: Measure highlight application time (<100ms)

## Dev Notes

### Architecture Compliance Requirements

**CRITICAL - Follow these patterns exactly (established in Stories 1.1 and 2.1):**

1. **Naming Conventions:**
   - Files: `kebab-case.ts` (e.g., `highlighter.ts`)
   - Interfaces/Types: `PascalCase` (e.g., `IRange`, `IModelDeltaDecoration`)
   - Functions: `camelCase` (e.g., `applyHighlights`, `findTermOccurrences`)
   - Constants: `UPPER_SNAKE_CASE`

2. **Logging Pattern (MUST use LOG_PREFIX):**
   ```typescript
   import { LOG_PREFIX } from '../shared/constants';
   console.log(`${LOG_PREFIX} Applied highlights for ${terms.length} terms`);
   console.log(`${LOG_PREFIX} Found ${occurrences.length} occurrences of "${term}"`);
   ```

3. **Error Handling:**
   ```typescript
   try {
     const content = editor.getModel()?.getValue() ?? '';
     // highlighting logic
   } catch (error) {
     console.error(`${LOG_PREFIX} Highlighting error:`, error);
   }
   ```

### Technical Implementation Details

**Monaco deltaDecorations API (from Web Research):**

```typescript
// Apply decorations - returns array of decoration IDs
const decorationIds = editor.deltaDecorations(
  oldDecorationIds,  // IDs to remove (empty on first call)
  newDecorations     // Array of IModelDeltaDecoration
);

// IModelDeltaDecoration structure
interface IModelDeltaDecoration {
  range: IRange;
  options: IModelDecorationOptions;
}

// IRange structure (1-based line/column numbers)
interface IRange {
  startLineNumber: number;
  startColumn: number;
  endLineNumber: number;
  endColumn: number;
}

// IModelDecorationOptions (key properties)
interface IModelDecorationOptions {
  inlineClassName?: string;      // CSS class for inline text
  className?: string;            // CSS class for the range
  isWholeLine?: boolean;         // Highlight entire line
  overviewRuler?: { color: string; position: number }; // Minimap marker
}
```

**Example Usage:**
```typescript
// Create decorations for a term
const decorations: IModelDeltaDecoration[] = [
  {
    range: { startLineNumber: 3, startColumn: 10, endLineNumber: 3, endColumn: 19 },
    options: { inlineClassName: 'highlight-term-0' }
  }
];

// Apply (first call - empty oldIds)
const ids = editor.deltaDecorations([], decorations);

// Update (subsequent calls - pass previous ids)
const newIds = editor.deltaDecorations(ids, newDecorations);
```

**CSS Injection Pattern:**
```typescript
function injectHighlightStyles(terms: TermConfig[]): void {
  const styleId = 'highlight-extension-styles';
  let styleEl = document.getElementById(styleId) as HTMLStyleElement;

  if (!styleEl) {
    styleEl = document.createElement('style');
    styleEl.id = styleId;
    document.head.appendChild(styleEl);
  }

  const css = terms.map((term, index) =>
    `.highlight-term-${index} { background-color: ${term.color}; }`
  ).join('\n');

  styleEl.textContent = css;
}
```

**Position Conversion (Character Index to Line/Column):**
```typescript
function charIndexToPosition(content: string, index: number): { line: number; column: number } {
  const lines = content.substring(0, index).split('\n');
  return {
    line: lines.length,                          // 1-based
    column: lines[lines.length - 1].length + 1   // 1-based
  };
}
```

### Dependencies from Story 2.1

**Required from monaco-detector.ts:**
- `onMonacoDetected(callback)` - Register callback for when Monaco is ready
- `getMonacoEditor()` - Get the detected editor instance (if needed later)

**MonacoEditorInstance interface (defined in 2.1):**
```typescript
interface MonacoEditorInstance {
  getModel(): { getValue(): string } | null;
  deltaDecorations(oldDecorations: string[], newDecorations: IModelDeltaDecoration[]): string[];
  onDidChangeModelContent(listener: () => void): { dispose(): void };
}
```

### Previous Story Learnings

**From Story 1.1 (Foundation):**
- Storage wrapper: `loadTerms()` returns `Promise<TermConfig[]>`
- Constants: `LOG_PREFIX`, `DEBOUNCE_MS`
- All patterns established for naming, logging, error handling

**From Story 2.1 (Monaco Detection):**
- Monaco instance available via callback system
- Detection handles all timing edge cases
- Editor instance provides required methods

**Code Review Learnings (Story 2.1):**

1. **Avoid dual timeout mechanisms:** When using setInterval with a timeout condition, DON'T also use a separate setTimeout for the same purpose. This creates race conditions where both can fire and log duplicate messages. Use a single mechanism - either poll count or setTimeout, not both.

2. **All timing constants in constants.ts:** Any timing-related constant (POLL_START_DELAY_MS, etc.) MUST go in `src/shared/constants.ts` alongside POLL_INTERVAL_MS and POLL_TIMEOUT_MS for consistency.

3. **Callback subscriptions need disposal:** Functions that register callbacks (like `onMonacoDetected`) MUST return a disposal/unsubscribe function to prevent memory leaks. Pattern:
   ```typescript
   export function onSomething(callback: Callback): () => void {
     callbacks.push(callback);
     return () => {
       const index = callbacks.indexOf(callback);
       if (index > -1) callbacks.splice(index, 1);
     };
   }
   ```

4. **Don't duplicate logic hoping for different results:** If check A and check B both depend on the same underlying condition (e.g., `window.monaco.editor.getEditors()`), having both is redundant. If A fails, B will also fail. Keep code DRY.

5. **Document idempotent functions:** If a cleanup function is safe to call multiple times, add a JSDoc comment noting this - helps future developers understand the safety guarantees.

### Project Structure Notes

**Files to Create:**
```
src/content/
├── content.ts           # Entry point (already exists from 2.1)
├── monaco-detector.ts   # Detection logic (already exists from 2.1)
└── highlighter.ts       # NEW - All highlighting logic
```

**Files to Modify:**
- `src/content/content.ts` - Add highlighting initialization
- `src/shared/types.ts` - Add Monaco decoration interfaces

### Critical Don'ts

- DO NOT modify editor content - decorations only
- DO NOT use deprecated decoration methods
- DO NOT assume Monaco model is always available (check for null)
- DO NOT forget to store decoration IDs for updates
- DO NOT inject duplicate style elements (check if exists)
- DO NOT use synchronous operations that block the editor

### Critical Dos

- DO use `inlineClassName` for text highlighting (not `className`)
- DO store returned decoration IDs after each deltaDecorations call
- DO handle empty terms array gracefully
- DO clear old decorations before applying new ones
- DO use try-catch around Monaco API calls
- DO use LOG_PREFIX for all console statements

### Performance Considerations

- Highlights must appear within 100ms of editor load (NFR1)
- Use efficient string search (indexOf with loop, not regex for simple terms)
- Minimize DOM operations (single style injection)
- deltaDecorations is efficient - Monaco optimizes internally
- Don't re-apply highlights if terms haven't changed

### Web Research Sources

- [Monaco Editor IModelDeltaDecoration API](https://microsoft.github.io/monaco-editor/typedoc/interfaces/editor.IModelDeltaDecoration.html)
- [Monaco Editor IModelDecorationOptions API](https://microsoft.github.io/monaco-editor/typedoc/interfaces/editor.IModelDecorationOptions.html)
- [Medium - Monaco Editor Decorator Guide](https://medium.com/@lyuda.dzyubinska/monaco-editor-decorator-385ba6aa90b8)

### Integration Flow

```
1. content.ts loads
   ↓
2. Calls initMonacoDetector() from monaco-detector.ts
   ↓
3. Registers onMonacoDetected callback
   ↓
4. When Monaco detected:
   a. loadTerms() from storage
   b. applyHighlights(editor, terms)
   ↓
5. highlighter.ts:
   a. Inject CSS styles for term colors
   b. Get editor content
   c. Find all term occurrences
   d. Create decorations array
   e. Call editor.deltaDecorations()
   f. Store decoration IDs
```

### References

- [Source: _bmad-output/planning-artifacts/architecture.md#Monaco-Integration-Architecture]
- [Source: _bmad-output/planning-artifacts/architecture.md#Highlight-Application-Flow]
- [Source: _bmad-output/planning-artifacts/epics.md#Story-2.2]
- [Source: _bmad-output/planning-artifacts/project-context.md#Monaco-Integration-Rules]
- [Source: _bmad-output/implementation-artifacts/2-1-content-script-foundation-and-monaco-detection.md]

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List
