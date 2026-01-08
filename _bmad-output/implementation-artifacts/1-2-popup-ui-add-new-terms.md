# Story 1.2: Popup UI - Add New Terms

Status: done

## Story

As a user,
I want to open the extension popup and add a term with a color,
So that I can configure my first highlight.

## Acceptance Criteria

1. **Popup Opens on Extension Click** (FR5)
   - **Given** the extension is installed and I'm on script.google.com
   - **When** I click the extension icon
   - **Then** a popup opens with a form to add a term

2. **Add Term with Color** (FR2, FR11, FR13)
   - **Given** the popup is open
   - **When** I enter a term (e.g., "resources") and select a color (e.g., pink)
   - **And** I click "Add"
   - **Then** the term/color pair is saved to chrome.storage.sync
   - **And** a success indicator appears
   - **And** the term appears in the list below the form (FR1)

3. **Persistence Across Sessions** (FR12)
   - **Given** I have just added a term
   - **When** I close and reopen the popup
   - **Then** my saved term appears in the list

4. **View Term List** (FR1)
   - **Given** I have saved terms in my configuration
   - **When** I open the popup
   - **Then** I see a list of all my term/color pairs
   - **And** each item shows the term text and a color indicator

## Tasks / Subtasks

- [x] Task 1: Create popup HTML structure (AC: #1, #4)
  - [x] 1.1: Create `src/popup/popup.html` with complete structure
  - [x] 1.2: Add form section with term input and color picker
  - [x] 1.3: Add "Add" button with appropriate styling
  - [x] 1.4: Add terms list container section
  - [x] 1.5: Add success/feedback indicator element
  - [x] 1.6: Link popup.css and popup.js in HTML

- [x] Task 2: Create popup CSS styling (AC: #1, #4)
  - [x] 2.1: Create `src/popup/popup.css`
  - [x] 2.2: Style the form layout (input + color picker + button)
  - [x] 2.3: Style the terms list display
  - [x] 2.4: Style success/error feedback indicators
  - [x] 2.5: Ensure popup has appropriate dimensions (300-400px width)

- [x] Task 3: Implement popup TypeScript logic (AC: #2, #3, #4)
  - [x] 3.1: Create `src/popup/popup.ts`
  - [x] 3.2: Import types and storage functions from shared/
  - [x] 3.3: Implement `initializePopup()` - load existing terms on popup open
  - [x] 3.4: Implement `renderTermsList()` - display all terms with colors
  - [x] 3.5: Implement `handleAddTerm()` - validate and save new term
  - [x] 3.6: Implement `showFeedback()` - display success/error messages
  - [x] 3.7: Add event listeners for form submission

- [x] Task 4: Update build configuration (AC: #1)
  - [x] 4.1: Ensure popup.css is copied to dist/popup/
  - [x] 4.2: Verify popup.html references correct JS/CSS paths
  - [x] 4.3: Test build completes without errors

- [x] Task 5: Integration testing (AC: #1, #2, #3, #4)
  - [x] 5.1: Build extension and load in Chrome
  - [x] 5.2: Verify popup opens on script.google.com
  - [x] 5.3: Test adding a term with color
  - [x] 5.4: Verify term persists after closing/reopening popup
  - [x] 5.5: Test adding multiple terms

## Dev Notes

### Architecture Compliance Requirements

**CRITICAL - This story builds on Story 1-1 foundation. Ensure Story 1-1 is complete before starting.**

**Required Foundation from Story 1-1:**
- `src/shared/types.ts` - TermConfig, StorageSchema, ChromeMessage interfaces
- `src/shared/constants.ts` - STORAGE_KEY, LOG_PREFIX constants
- `src/shared/storage.ts` - saveTerms(), loadTerms() functions
- `manifest.json` - Properly configured for popup

### Naming Conventions (MUST follow)

| Element | Convention | Example |
|---------|------------|---------|
| Files | kebab-case.ts | `popup.ts`, `popup.css` |
| Interfaces/Types | PascalCase | `TermConfig` |
| Functions | camelCase | `handleAddTerm()`, `renderTermsList()` |
| Variables | camelCase | `termInput`, `colorPicker` |
| Constants | UPPER_SNAKE_CASE | `LOG_PREFIX` |
| CSS classes | kebab-case | `.term-item`, `.add-form` |

### HTML Structure (Reference Implementation)

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Highlight Terms</title>
  <link rel="stylesheet" href="popup.css">
</head>
<body>
  <div class="popup-container">
    <h1 class="popup-title">Highlight Terms</h1>

    <!-- Add Term Form -->
    <form id="add-term-form" class="add-form">
      <div class="form-row">
        <input
          type="text"
          id="term-input"
          class="term-input"
          placeholder="Enter term..."
          required
        >
        <input
          type="color"
          id="color-picker"
          class="color-picker"
          value="#ff69b4"
        >
      </div>
      <button type="submit" class="add-button">Add</button>
    </form>

    <!-- Feedback Message -->
    <div id="feedback" class="feedback hidden"></div>

    <!-- Terms List -->
    <div id="terms-list" class="terms-list">
      <!-- Terms will be rendered here -->
    </div>
  </div>

  <script src="popup.js"></script>
</body>
</html>
```

### TypeScript Implementation Patterns

**Popup Initialization Pattern:**
```typescript
import { TermConfig } from '../shared/types';
import { loadTerms, saveTerms } from '../shared/storage';
import { LOG_PREFIX } from '../shared/constants';

document.addEventListener('DOMContentLoaded', () => {
  initializePopup();
});

async function initializePopup(): Promise<void> {
  console.log(`${LOG_PREFIX} Popup initialized`);
  const terms = await loadTerms();
  renderTermsList(terms);
  setupEventListeners();
}
```

**Add Term Handler Pattern:**
```typescript
async function handleAddTerm(event: Event): Promise<void> {
  event.preventDefault();

  const termInput = document.getElementById('term-input') as HTMLInputElement;
  const colorPicker = document.getElementById('color-picker') as HTMLInputElement;

  const term = termInput.value.trim();
  const color = colorPicker.value;

  if (!term) {
    showFeedback('Please enter a term', 'error');
    return;
  }

  const currentTerms = await loadTerms();

  // Check for duplicates
  if (currentTerms.some(t => t.term.toLowerCase() === term.toLowerCase())) {
    showFeedback('Term already exists', 'error');
    return;
  }

  const newTerm: TermConfig = { term, color };
  const updatedTerms = [...currentTerms, newTerm];

  const success = await saveTerms(updatedTerms);

  if (success) {
    showFeedback('Term added successfully', 'success');
    termInput.value = '';
    renderTermsList(updatedTerms);
  } else {
    showFeedback('Failed to save term', 'error');
  }
}
```

**Render Terms List Pattern:**
```typescript
function renderTermsList(terms: TermConfig[]): void {
  const listContainer = document.getElementById('terms-list');
  if (!listContainer) return;

  if (terms.length === 0) {
    listContainer.innerHTML = '<p class="empty-message">No terms configured yet</p>';
    return;
  }

  listContainer.innerHTML = terms.map(term => `
    <div class="term-item">
      <span class="term-color" style="background-color: ${term.color}"></span>
      <span class="term-text">${escapeHtml(term.term)}</span>
    </div>
  `).join('');
}

function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
```

**Feedback Display Pattern:**
```typescript
function showFeedback(message: string, type: 'success' | 'error'): void {
  const feedback = document.getElementById('feedback');
  if (!feedback) return;

  feedback.textContent = message;
  feedback.className = `feedback ${type}`;
  feedback.classList.remove('hidden');

  setTimeout(() => {
    feedback.classList.add('hidden');
  }, 3000);
}
```

### CSS Styling Guidelines

**Popup Dimensions:**
- Width: 320px (appropriate for extension popup)
- Max-height: 400px (with overflow scroll for terms list)
- Padding: 16px

**Color Scheme:**
- Use neutral colors for background (#f5f5f5, #ffffff)
- Success feedback: green (#4caf50)
- Error feedback: red (#f44336)
- Primary button: blue (#2196f3)

**CSS Structure:**
```css
.popup-container {
  width: 320px;
  padding: 16px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.add-form {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 16px;
}

.form-row {
  display: flex;
  gap: 8px;
}

.term-input {
  flex: 1;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.color-picker {
  width: 40px;
  height: 34px;
  padding: 0;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
}

.add-button {
  padding: 8px 16px;
  background-color: #2196f3;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.add-button:hover {
  background-color: #1976d2;
}

.feedback {
  padding: 8px;
  border-radius: 4px;
  margin-bottom: 16px;
  text-align: center;
}

.feedback.success {
  background-color: #e8f5e9;
  color: #2e7d32;
}

.feedback.error {
  background-color: #ffebee;
  color: #c62828;
}

.feedback.hidden {
  display: none;
}

.terms-list {
  max-height: 200px;
  overflow-y: auto;
}

.term-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px;
  background-color: #f5f5f5;
  border-radius: 4px;
  margin-bottom: 4px;
}

.term-color {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  flex-shrink: 0;
}

.term-text {
  flex: 1;
  word-break: break-word;
}

.empty-message {
  color: #666;
  text-align: center;
  font-style: italic;
}
```

### Build Configuration Update

**Ensure copy-static includes popup.css:**
```json
{
  "scripts": {
    "build": "tsc && npm run copy-static",
    "copy-static": "copy manifest.json dist\\ && xcopy /E /I /Y icons dist\\icons && copy src\\popup\\popup.html dist\\popup\\ && copy src\\popup\\popup.css dist\\popup\\"
  }
}
```

### Project Structure Notes

**Files to Create/Modify in this Story:**
```
src/popup/
├── popup.html    # REPLACE placeholder with full UI
├── popup.ts      # CREATE - popup logic
└── popup.css     # CREATE - popup styles
```

**Dependencies on Story 1-1:**
- `src/shared/types.ts` - Must have TermConfig interface
- `src/shared/storage.ts` - Must have saveTerms(), loadTerms()
- `src/shared/constants.ts` - Must have LOG_PREFIX
- `manifest.json` - Must have popup action configured

### Critical Don'ts

- DO NOT access chrome.storage directly - use storage.ts wrapper functions
- DO NOT create console statements without LOG_PREFIX
- DO NOT skip input validation (empty term, duplicate check)
- DO NOT forget to escape HTML when rendering user input
- DO NOT use inline styles - use CSS classes
- DO NOT hardcode storage keys - use STORAGE_KEY constant from shared/constants

### Critical Do's

- DO use async/await for all storage operations
- DO wrap Chrome API calls in try-catch (handled by storage wrapper)
- DO provide visual feedback for user actions (success/error)
- DO handle edge cases (empty list, duplicate terms)
- DO ensure popup works when opened multiple times
- DO test persistence by closing and reopening popup

### Testing Checklist

1. [ ] Popup opens when clicking extension icon on script.google.com
2. [ ] Form displays correctly (input, color picker, button)
3. [ ] Can add a term with default color
4. [ ] Can add a term with custom color
5. [ ] Success message appears after adding term
6. [ ] Added term appears in list immediately
7. [ ] Term persists after closing and reopening popup
8. [ ] Cannot add empty term (validation error)
9. [ ] Cannot add duplicate term (validation error)
10. [ ] Multiple terms can be added
11. [ ] Empty state message shows when no terms configured

### Previous Story Learnings (from Story 1-1 Code Review)

**Learnings to apply in this story:**

1. **Use StorageSchema for type safety:** When working with storage, use `StorageSchema['terms']` type annotation instead of raw `TermConfig[]` for better type safety.

2. **Debounce has cancel() method:** The debounce utility now includes a `.cancel()` method for cleanup. Use it when component unmounts or when you need to cancel pending operations.

3. **Cross-platform build scripts:** The build uses `node scripts/copy-static.js` for cross-platform compatibility. If you need to modify copy behavior, edit the Node.js script, not package.json directly.

4. **Content script placeholder exists:** `src/content/content.ts` was added as placeholder - be aware it exists and logs to console on script.google.com.

**Code patterns established:**
- All console statements use `LOG_PREFIX` from constants
- All Chrome API calls wrapped in try-catch (via storage wrapper)
- Interfaces use PascalCase, functions use camelCase, constants use UPPER_SNAKE_CASE

### References

- [Source: _bmad-output/planning-artifacts/architecture.md#Frontend-Architecture-(Popup-UI)]
- [Source: _bmad-output/planning-artifacts/architecture.md#Implementation-Patterns-&-Consistency-Rules]
- [Source: _bmad-output/planning-artifacts/architecture.md#Project-Structure-&-Boundaries]
- [Source: _bmad-output/planning-artifacts/project-context.md#Chrome-Extension-Rules]
- [Source: _bmad-output/planning-artifacts/project-context.md#Critical-Implementation-Rules]
- [Source: _bmad-output/planning-artifacts/epics.md#Story-1.2]
- [Source: _bmad-output/implementation-artifacts/1-1-project-initialization-and-extension-foundation.md#Senior-Developer-Review]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

- Build completed successfully with `npm run build`
- Extension popup tested on script.google.com
- Term "resources" added with pink color successfully

### Completion Notes List

- Replaced placeholder popup.html with full UI structure (form, feedback, terms list)
- Created comprehensive popup.css with 320px width, form styling, feedback states, terms list
- Implemented popup.ts with all required functions:
  - `initializePopup()` - loads terms on popup open
  - `setupEventListeners()` - form submit handler
  - `handleAddTerm()` - validates and saves new terms with duplicate check
  - `renderTermsList()` - displays terms with color indicators
  - `showFeedback()` - shows success/error messages with auto-hide
  - `escapeHtml()` - XSS prevention
- Build configuration already supported popup.css copying
- All acceptance criteria satisfied and tested

### File List

**Modified Files:**
- src/popup/popup.html (replaced placeholder with full UI)
- src/popup/popup.css (replaced minimal styles with full styling)
- src/popup/popup.ts (replaced placeholder with full logic)

## Senior Developer Review (AI)

**Review Date:** 2026-01-08
**Reviewer:** Claude Opus 4.5
**Outcome:** Approved with Minor Fixes

### Issues Found & Resolved

| # | Severity | Issue | Resolution |
|---|----------|-------|------------|
| 1 | LOW | escapeHtml unnecessary for color value | Fixed: Removed escapeHtml from term.color |
| 2 | LOW | Missing maxlength on term input | Fixed: Added maxlength="100" |
| 3 | LOW | Missing aria-label on color picker | Fixed: Added aria-label for accessibility |

### Learnings for Future Stories
1. **Hex colors don't need escaping:** Color picker values are always valid hex - no XSS risk
2. **Add input constraints:** Use maxlength to prevent UI issues with very long inputs
3. **Accessibility matters:** Always add aria-labels to inputs without visible labels
4. **Pattern confirmed:** Using storage wrapper + LOG_PREFIX + escapeHtml works well
