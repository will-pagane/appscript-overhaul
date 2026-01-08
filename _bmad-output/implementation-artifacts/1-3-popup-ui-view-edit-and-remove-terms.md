# Story 1.3: Popup UI - View, Edit, and Remove Terms

Status: done

## Story

As a user,
I want to view my configured terms and edit or remove them,
So that I can manage my highlight configuration over time.

## Acceptance Criteria

1. **View All Terms** (FR1)
   - **Given** I have saved terms in my configuration
   - **When** I open the popup
   - **Then** I see a list of all my term/color pairs
   - **And** each item shows the term text and a color indicator

2. **Edit Term Color** (FR4, FR9)
   - **Given** I see a term in the list
   - **When** I click the color picker for that term
   - **And** I select a new color
   - **Then** the color is updated immediately in storage
   - **And** the list reflects the new color instantly (no page refresh)

3. **Remove Term** (FR3)
   - **Given** I see a term in the list
   - **When** I click the remove/delete button for that term
   - **Then** the term is removed from storage
   - **And** the term disappears from the list immediately

4. **Immediate Feedback** (FR9)
   - **Given** I edit or remove a term
   - **When** the operation completes
   - **Then** visual feedback confirms the action
   - **And** the change is persisted without requiring popup close/reopen

## Tasks / Subtasks

- [x] Task 1: Extend term list item HTML with edit/remove controls (AC: #1, #2, #3)
  - [x] 1.1: Update `renderTermsList()` to include inline color picker per term
  - [x] 1.2: Add remove/delete button (X icon or trash) to each term item
  - [x] 1.3: Ensure color picker shows current term color as default value
  - [x] 1.4: Add data attributes to identify term for edit/remove actions

- [x] Task 2: Implement edit color functionality (AC: #2, #4)
  - [x] 2.1: Create `handleColorChange()` function
  - [x] 2.2: Add change event listener to inline color pickers
  - [x] 2.3: Update storage with new color value
  - [x] 2.4: Re-render list or update item in place
  - [x] 2.5: Show success feedback on color change

- [x] Task 3: Implement remove term functionality (AC: #3, #4)
  - [x] 3.1: Create `handleRemoveTerm()` function
  - [x] 3.2: Add click event listener to remove buttons
  - [x] 3.3: Filter out removed term from storage
  - [x] 3.4: Re-render list after removal
  - [x] 3.5: Show success feedback on removal
  - [x] 3.6: Handle edge case: removing last term shows empty state

- [x] Task 4: Update CSS for new controls (AC: #1, #2, #3)
  - [x] 4.1: Style inline color picker (smaller, integrated look)
  - [x] 4.2: Style remove button (subtle but visible, red on hover)
  - [x] 4.3: Ensure controls don't overflow term item layout
  - [x] 4.4: Add hover states for interactive elements

- [x] Task 5: Integration testing (AC: #1, #2, #3, #4)
  - [x] 5.1: Test viewing list with multiple terms
  - [x] 5.2: Test changing color of existing term
  - [x] 5.3: Test removing a term from middle of list
  - [x] 5.4: Test removing all terms (empty state appears)
  - [x] 5.5: Verify changes persist after closing/reopening popup

## Dev Notes

### Architecture Compliance Requirements

**CRITICAL - This story EXTENDS Story 1-2. Story 1-2 MUST be complete before starting.**

**Required Foundation from Story 1-2:**
- `src/popup/popup.html` - Complete popup structure with form and list
- `src/popup/popup.ts` - Working popup logic with add term functionality
- `src/popup/popup.css` - Styled popup with term list display
- Working `renderTermsList()` function (to be extended)
- Working `showFeedback()` function (reuse for edit/remove)

### Naming Conventions (MUST follow)

| Element | Convention | Example |
|---------|------------|---------|
| Files | kebab-case.ts | `popup.ts` |
| Functions | camelCase | `handleColorChange()`, `handleRemoveTerm()` |
| Variables | camelCase | `termIndex`, `newColor` |
| Constants | UPPER_SNAKE_CASE | `LOG_PREFIX` |
| CSS classes | kebab-case | `.remove-button`, `.term-color-picker` |
| Data attributes | kebab-case | `data-term-index` |

### Previous Story Intelligence (Story 1-2)

**Key patterns established in Story 1-2 that MUST be followed:**

1. **Storage Access Pattern:**
```typescript
// Always use wrapper functions, never direct chrome.storage
import { loadTerms, saveTerms } from '../shared/storage';
```

2. **Feedback Pattern:**
```typescript
showFeedback('Term removed', 'success');
showFeedback('Failed to remove term', 'error');
```

3. **Re-render Pattern:**
```typescript
// After any storage change, re-render the list
const updatedTerms = await loadTerms();
renderTermsList(updatedTerms);
```

4. **Logging Pattern:**
```typescript
console.log(`${LOG_PREFIX} Color updated for term: ${term}`);
```

### Updated HTML Structure

**Extend the term-item from Story 1-2:**
```html
<!-- BEFORE (Story 1-2): -->
<div class="term-item">
  <span class="term-color" style="background-color: ${term.color}"></span>
  <span class="term-text">${escapeHtml(term.term)}</span>
</div>

<!-- AFTER (Story 1-3): -->
<div class="term-item" data-term-index="${index}">
  <input
    type="color"
    class="term-color-picker"
    value="${term.color}"
    data-term-index="${index}"
    title="Change color"
  >
  <span class="term-text">${escapeHtml(term.term)}</span>
  <button
    type="button"
    class="remove-button"
    data-term-index="${index}"
    title="Remove term"
  >×</button>
</div>
```

### TypeScript Implementation Patterns

**Updated renderTermsList() with controls:**
```typescript
function renderTermsList(terms: TermConfig[]): void {
  const listContainer = document.getElementById('terms-list');
  if (!listContainer) return;

  if (terms.length === 0) {
    listContainer.innerHTML = '<p class="empty-message">No terms configured yet</p>';
    return;
  }

  listContainer.innerHTML = terms.map((term, index) => `
    <div class="term-item" data-term-index="${index}">
      <input
        type="color"
        class="term-color-picker"
        value="${term.color}"
        data-term-index="${index}"
        title="Change color"
      >
      <span class="term-text">${escapeHtml(term.term)}</span>
      <button
        type="button"
        class="remove-button"
        data-term-index="${index}"
        title="Remove term"
      >×</button>
    </div>
  `).join('');

  // Attach event listeners after rendering
  attachTermItemListeners();
}
```

**Event Listeners Setup:**
```typescript
function attachTermItemListeners(): void {
  // Color change listeners
  document.querySelectorAll('.term-color-picker').forEach(picker => {
    picker.addEventListener('change', handleColorChange);
  });

  // Remove button listeners
  document.querySelectorAll('.remove-button').forEach(button => {
    button.addEventListener('click', handleRemoveTerm);
  });
}
```

**Handle Color Change:**
```typescript
async function handleColorChange(event: Event): Promise<void> {
  const picker = event.target as HTMLInputElement;
  const index = parseInt(picker.dataset.termIndex || '-1', 10);

  if (index < 0) return;

  const terms = await loadTerms();
  if (index >= terms.length) return;

  const newColor = picker.value;
  const termName = terms[index].term;

  terms[index].color = newColor;

  const success = await saveTerms(terms);

  if (success) {
    console.log(`${LOG_PREFIX} Color updated for "${termName}" to ${newColor}`);
    showFeedback('Color updated', 'success');
    // No need to re-render - color picker already shows new value
  } else {
    showFeedback('Failed to update color', 'error');
    // Revert picker to old value
    picker.value = terms[index].color;
  }
}
```

**Handle Remove Term:**
```typescript
async function handleRemoveTerm(event: Event): Promise<void> {
  const button = event.target as HTMLButtonElement;
  const index = parseInt(button.dataset.termIndex || '-1', 10);

  if (index < 0) return;

  const terms = await loadTerms();
  if (index >= terms.length) return;

  const removedTerm = terms[index].term;

  // Remove term at index
  const updatedTerms = terms.filter((_, i) => i !== index);

  const success = await saveTerms(updatedTerms);

  if (success) {
    console.log(`${LOG_PREFIX} Term removed: "${removedTerm}"`);
    showFeedback('Term removed', 'success');
    renderTermsList(updatedTerms);
  } else {
    showFeedback('Failed to remove term', 'error');
  }
}
```

### CSS Additions for Story 1-3

**Add these styles to popup.css:**
```css
/* Term item with controls */
.term-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px;
  background-color: #f5f5f5;
  border-radius: 4px;
  margin-bottom: 4px;
}

/* Inline color picker (smaller than add form picker) */
.term-color-picker {
  width: 28px;
  height: 28px;
  padding: 0;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
  flex-shrink: 0;
}

.term-color-picker:hover {
  border-color: #999;
}

/* Term text takes remaining space */
.term-text {
  flex: 1;
  word-break: break-word;
  font-size: 14px;
}

/* Remove button */
.remove-button {
  width: 24px;
  height: 24px;
  padding: 0;
  border: none;
  background-color: transparent;
  color: #999;
  font-size: 18px;
  font-weight: bold;
  cursor: pointer;
  border-radius: 4px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.remove-button:hover {
  background-color: #ffebee;
  color: #c62828;
}

.remove-button:active {
  background-color: #ffcdd2;
}
```

### Project Structure Notes

**Files Modified in this Story:**
```
src/popup/
├── popup.html    # NO CHANGES (structure already supports list)
├── popup.ts      # MODIFY - add edit/remove handlers, update renderTermsList
└── popup.css     # MODIFY - add styles for color picker and remove button
```

**Dependencies on Previous Stories:**
- Story 1-1: `src/shared/storage.ts` (saveTerms, loadTerms)
- Story 1-1: `src/shared/constants.ts` (LOG_PREFIX)
- Story 1-2: `src/popup/popup.ts` (renderTermsList, showFeedback, escapeHtml)
- Story 1-2: `src/popup/popup.css` (base styles)

### Critical Don'ts

- DO NOT access chrome.storage directly - use storage.ts wrapper
- DO NOT forget to re-attach event listeners after re-rendering list
- DO NOT use inline onclick handlers - use addEventListener
- DO NOT forget data-term-index attributes for identifying terms
- DO NOT skip error handling on storage operations
- DO NOT remove a term without confirming storage save succeeded

### Critical Do's

- DO use event delegation OR re-attach listeners after each render
- DO provide immediate visual feedback for edit/remove actions
- DO handle the edge case of removing the last term (show empty state)
- DO log all edit/remove operations with LOG_PREFIX
- DO test that changes persist after closing/reopening popup
- DO use the existing showFeedback() function for consistency

### Alternative: Event Delegation Pattern

**Instead of re-attaching listeners, use event delegation:**
```typescript
function setupTermListDelegation(): void {
  const listContainer = document.getElementById('terms-list');
  if (!listContainer) return;

  // Single listener for all color changes
  listContainer.addEventListener('change', async (event) => {
    const target = event.target as HTMLElement;
    if (target.classList.contains('term-color-picker')) {
      await handleColorChange(event);
    }
  });

  // Single listener for all remove clicks
  listContainer.addEventListener('click', async (event) => {
    const target = event.target as HTMLElement;
    if (target.classList.contains('remove-button')) {
      await handleRemoveTerm(event);
    }
  });
}

// Call this ONCE in initializePopup(), not after each render
```

**Recommendation:** Use event delegation (above) to avoid re-attaching listeners after every render. This is cleaner and more performant.

### Testing Checklist

1. [ ] Existing "Add term" functionality still works (regression test)
2. [ ] Each term item displays: color picker, term text, remove button
3. [ ] Color picker shows current term color as default
4. [ ] Clicking color picker opens color selection dialog
5. [ ] Selecting new color updates storage immediately
6. [ ] Color change shows success feedback
7. [ ] Clicking remove button removes term from list
8. [ ] Remove shows success feedback
9. [ ] Removing last term shows empty state message
10. [ ] All changes persist after closing/reopening popup
11. [ ] Multiple rapid edits/removes don't cause errors
12. [ ] Layout remains clean with long term names

### Performance Considerations

- Color change does NOT require full list re-render (picker already updated)
- Remove DOES require re-render to update indices
- Event delegation preferred over per-item listeners
- Debouncing NOT needed for these operations (user-initiated, discrete)

### Previous Story Learnings (from Story 1-2 Code Review)

**Learnings to apply in this story:**

1. **Hex colors don't need escaping:** Color picker values are always valid hex format - no XSS risk. Don't wrap color values in escapeHtml().

2. **Add input constraints:** Use maxlength on text inputs to prevent UI issues. The term input has maxlength="100".

3. **Accessibility matters:** Always add aria-labels to inputs without visible labels. Color pickers need `aria-label="Select highlight color"` or similar.

4. **Pattern confirmed:** Using storage wrapper + LOG_PREFIX + escapeHtml (for user text only) works well. Continue this pattern.

**Code patterns established in 1-2:**
- `showFeedback(message, type)` - reuse for edit/remove feedback
- `escapeHtml(text)` - use for term text only, not for hex colors
- `renderTermsList(terms)` - will be extended with edit/remove controls
- Storage wrapper handles all Chrome API error handling

### References

- [Source: _bmad-output/planning-artifacts/architecture.md#Frontend-Architecture-(Popup-UI)]
- [Source: _bmad-output/planning-artifacts/architecture.md#Implementation-Patterns-&-Consistency-Rules]
- [Source: _bmad-output/planning-artifacts/project-context.md#Chrome-Extension-Rules]
- [Source: _bmad-output/planning-artifacts/epics.md#Story-1.3]
- [Source: _bmad-output/implementation-artifacts/1-2-popup-ui-add-new-terms.md] - Previous story patterns
- [Source: _bmad-output/implementation-artifacts/1-2-popup-ui-add-new-terms.md#Senior-Developer-Review] - Code review learnings

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

- Build completed successfully with `npm run build`
- All integration tests passed by user

### Completion Notes List

- Extended `renderTermsList()` to include inline color picker and remove button per term
- Implemented event delegation pattern via `setupTermListDelegation()` for better performance
- Created `handleColorChange()` function with storage update and feedback
- Created `handleRemoveTerm()` function with list re-render and empty state handling
- Added CSS styles for `.term-color-picker` (28x28px, hover states)
- Added CSS styles for `.remove-button` (24x24px, red hover effect)
- Removed unused `.term-color` class (replaced by interactive color picker)
- Added aria-labels for accessibility on color pickers and remove buttons
- All acceptance criteria satisfied and verified by user testing

### File List

**Modified Files:**
- src/popup/popup.ts (added handleColorChange, handleRemoveTerm, setupTermListDelegation, updated renderTermsList)
- src/popup/popup.css (added .term-color-picker and .remove-button styles, removed .term-color)

## Senior Developer Review (AI)

**Review Date:** 2026-01-08
**Reviewer:** Claude Opus 4.5
**Outcome:** Approved with Minor Fixes

### Issues Found & Resolved

| # | Severity | Issue | Resolution |
|---|----------|-------|------------|
| 1 | LOW | escapeHtml() used in aria-label - aria-label is text, not HTML | Fixed: Removed escapeHtml from aria-label attributes |
| 2 | LOW | Missing :focus styles for .term-color-picker and .remove-button | Fixed: Added :focus styles with blue outline |
| 3 | LOW | × character in button should have aria-hidden | Fixed: Wrapped × in span with aria-hidden="true" |

### Learnings for Future Stories

1. **aria-label is text, not HTML:** Don't use escapeHtml() for aria-label attributes - they're plain text and escaping causes literal `&lt;` to be read by screen readers
2. **Always add :focus styles:** For keyboard accessibility, interactive elements need visible focus indicators
3. **Use aria-hidden for decorative content:** Visual characters like × should be hidden from screen readers when aria-label provides the accessible name
4. **Event delegation pattern confirmed:** Using single event listeners on container instead of per-item listeners works well for dynamic content
