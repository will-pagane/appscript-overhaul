---
project_name: 'Apps Script Overhaul'
user_name: 'Will'
date: '2026-01-08'
sections_completed: ['technology_stack', 'language_rules', 'framework_rules', 'code_quality', 'critical_rules']
status: 'complete'
rule_count: 28
optimized_for_llm: true
---

# Project Context for AI Agents

_This file contains critical rules and patterns that AI agents must follow when implementing code in this project. Focus on unobvious details that agents might otherwise miss._

---

## Technology Stack & Versions

| Technology | Version | Notes |
|------------|---------|-------|
| TypeScript | 5.x | Strict mode enabled |
| Target | ES2020 | Modern browser support |
| Chrome Extension | Manifest V3 | Current standard |
| @types/chrome | Latest | Chrome API typings |

**Build Requirements:**
- TypeScript compiler only (no bundler)
- Output to `dist/` folder
- Static files copied via npm scripts

## Critical Implementation Rules

### TypeScript Rules

**Configuration:**
- Strict mode must be enabled
- Target ES2020, Module ES2020
- No bundler - direct tsc compilation

**Async/Error Handling:**
- ALWAYS wrap Chrome API calls in try-catch
- Return `boolean` or `{ success: boolean, error?: string }` from async operations
- Use async/await, not raw Promises

**Logging:**
- ALL console statements must use prefix: `[Highlight Extension]`
- Example: `console.log('[Highlight Extension] Initialized')`
- Example: `console.error('[Highlight Extension] Error:', error)`

### Chrome Extension Rules

**Communication Pattern:**
- Storage as source of truth + direct message for immediate updates
- Content script listens to `chrome.storage.onChanged`
- Popup uses `chrome.tabs.sendMessage()` for instant feedback
- Message handlers MUST `return true` for async responses

**Message Format:**
```typescript
interface ChromeMessage {
  type: 'TERMS_UPDATED' | 'REFRESH_HIGHLIGHTS' | 'PING';
  payload?: unknown;
}
```

**Storage:**
- Use constant `STORAGE_KEY = 'highlightTerms'` - never hardcode
- Schema: `{ terms: Array<{ term: string, color: string }> }`

### DOM Highlighting Rules

**Container Detection:**
- Wait for `.view-lines` element to appear in DOM
- Use MutationObserver for detection (efficient, non-blocking)
- Google Apps Script does NOT expose `window.monaco` global
- NEVER attempt to access Monaco Editor APIs (they are NOT available)

**Highlighting Strategy:**
- DOM-based only: TreeWalker + span wrapping + CSS classes
- Apply highlights after `.view-lines` container detected
- Re-apply on content changes (MutationObserver, debounced 150ms)
- No Monaco API calls - API is encapsulated by Google

**Performance:**
- Debounce editor content changes: 150ms minimum
- Re-apply decorations on content change, not on every keystroke

### Code Quality & Naming Conventions

**File Naming:**
- All TypeScript files: `kebab-case.ts` (e.g., `content-script.ts`)
- HTML/CSS files: `kebab-case`
- Exception: `manifest.json` (Chrome requirement)

**Code Naming:**
| Element | Convention | Example |
|---------|------------|---------|
| Interfaces/Types | PascalCase | `TermConfig`, `HighlightMessage` |
| Functions | camelCase | `applyHighlights()`, `detectMonaco()` |
| Variables | camelCase | `editorInstance`, `termList` |
| Constants | UPPER_SNAKE_CASE | `STORAGE_KEY`, `POLL_INTERVAL_MS` |
| CSS classes | kebab-case | `.term-item`, `.color-picker` |

**Project Structure:**
```
src/
├── popup/          # Popup UI (popup.html, popup.ts, popup.css)
├── content/        # Content script (Monaco integration)
├── shared/         # Shared code (types.ts, storage.ts, constants.ts)
└── utils/          # Utilities (debounce.ts)
```

### Critical Don't-Miss Rules

**Anti-Patterns - NEVER DO:**
- Attempting to access `window.monaco` (API is NOT exposed by Google Apps Script)
- Attempting to use `editor.deltaDecorations()` or other Monaco APIs (NOT available)
- Direct storage access without wrapper function
- Hardcoded storage keys (use `STORAGE_KEY` constant)
- Missing error handling on Chrome API calls
- Synchronous message handlers without `return true`

**Required Patterns - ALWAYS DO:**
- Use DOM-only highlighting approach (TreeWalker + span wrapping)
- Detect `.view-lines` container before applying highlights
- Debounce editor change handlers (150ms)
- Include `LOG_PREFIX` in all console statements
- Use defined interfaces for messages and storage
- Remember: Google Apps Script does NOT expose Monaco Editor APIs

**Performance Requirements:**
- Highlights applied within 100ms of page load
- Config changes reflected within 200ms
- No perceptible typing lag
- Memory footprint < 10MB

---

## Usage Guidelines

**For AI Agents:**
- Read this file before implementing any code
- Follow ALL rules exactly as documented
- When in doubt, prefer the more restrictive option
- Update this file if new patterns emerge

**For Humans:**
- Keep this file lean and focused on agent needs
- Update when technology stack changes
- Review periodically for outdated rules
- Remove rules that become obvious over time

---

_Generated by BMAD generate-project-context workflow_
_Last Updated: 2026-01-08_
