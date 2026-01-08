---
stepsCompleted: [1, 2, 3, 4, 5, 6, 7, 8]
inputDocuments:
  - '_bmad-output/planning-artifacts/prd.md'
  - '_bmad-output/planning-artifacts/produt-brief.md'
workflowType: 'architecture'
project_name: 'Apps Script Overhaul'
user_name: 'Will'
date: '2026-01-08'
lastStep: 8
status: 'complete'
completedAt: '2026-01-08'
---

# Architecture Decision Document

_This document builds collaboratively through step-by-step discovery. Sections are appended as we work through each architectural decision together._

## Project Context Analysis

### Requirements Overview

**Functional Requirements:**
14 functional requirements organized into 4 categories:
- Configuration Management (FR1-FR5): CRUD operations for term/color pairs via popup UI
- Highlighting Engine (FR6-FR10): Monaco detection, decorator application, live updates
- Data Persistence (FR11-FR13): Chrome storage sync for cross-device configuration
- Scope Control (FR14): Extension activates only on script.google.com

**Non-Functional Requirements:**
9 NFRs driving architectural decisions:
- Performance: <100ms highlight application, <200ms for config changes, no typing lag
- Memory: <10MB footprint
- Resilience: Graceful fallback if Monaco API unavailable _(Note: API not exposed; DOM-only approach satisfies this by having no API dependency)_
- Integration: Must not interfere with native Monaco functionality
- Reliability: Immediate config saves, persistent highlights across refreshes

**Scale & Complexity:**
- Primary domain: Browser Extension (Chrome Manifest V3)
- Complexity level: Low
- Estimated architectural components: 4 (Popup UI, Content Script, Background Worker, Storage Layer)

### Technical Constraints & Dependencies

- Chrome Extension Manifest V3 (required standard)
- Monaco Editor API is NOT exposed on script.google.com (DOM-only access)
- Content script injection timing dependent on page load
- Chrome Storage API limits (sync: 100KB total, 8KB per item)
- Host permissions limited to script.google.com

### Cross-Cutting Concerns Identified

1. **Popup-Content Communication:** Message passing between popup UI and content script
2. **Initialization Timing:** Robust DOM container detection regardless of page load sequence
3. **~~Fallback Strategy:~~ DOM-Only Approach:** Originally planned Decorators API with CSS fallback, but Monaco API is not exposed. DOM-based highlighting is the only viable approach. _(See Architecture Pivot section and ADR)_
4. **Performance Optimization:** Debounce highlight re-application during rapid content changes
5. **State Synchronization:** Keep popup UI in sync with actual applied highlights

## Starter Template Evaluation

### Primary Technology Domain

Browser Extension (Chrome Manifest V3) - based on project requirements analysis.

### Starter Options Considered

| Option | Complexity | TypeScript | Hot Reload | Maintenance |
|--------|------------|------------|------------|-------------|
| WXT | Medium | Yes | Yes | Active |
| Plasmo | High | Yes | Yes | Concerns |
| Minimal Setup | Low | Manual | No | N/A |

### Selected Starter: Minimal TypeScript Setup

**Rationale for Selection:**
- Project has low complexity with clear, bounded requirements
- PRD specifies minimal footprint (<10MB) as NFR
- Only 4 files needed: manifest, popup, content script, styles
- No framework overhead for a focused single-purpose tool
- TypeScript adds safety without significant complexity
- User preference for simplicity over developer experience features

**Initialization Command:**

```bash
mkdir apps-script-overhaul-extension
cd apps-script-overhaul-extension
npm init -y
npm install --save-dev typescript @types/chrome
npx tsc --init
```

**Architectural Decisions Provided by Starter:**

**Language & Runtime:**
- TypeScript 5.x with strict mode enabled
- Target: ES2020 (modern browser support)
- @types/chrome for Chrome Extension API types

**Project Structure:**
```
apps-script-overhaul-extension/
├── manifest.json
├── tsconfig.json
├── package.json
├── src/
│   ├── popup/
│   │   ├── popup.html
│   │   ├── popup.ts
│   │   └── popup.css
│   └── content/
│       └── content.ts
├── dist/           # Compiled output
└── icons/
    └── icon-*.png
```

**Build Tooling:**
- TypeScript compiler (tsc) only
- No bundler (Webpack/Vite) - unnecessary for this scope
- Simple npm scripts for build/watch

**Testing Framework:**
- Manual testing via Chrome Developer Mode
- No automated testing framework (low complexity doesn't justify overhead)

**Development Workflow:**
1. Edit TypeScript files in `src/`
2. Run `npm run build` (tsc compiles to `dist/`)
3. Load `dist/` folder in Chrome as unpacked extension
4. Reload extension after changes

**Note:** Project initialization using these commands should be the first implementation story.

## Core Architectural Decisions

### Decision Priority Analysis

**Critical Decisions (Block Implementation):**
- Monaco Integration Strategy
- Monaco Detection Strategy
- Popup-Content Communication Pattern

**Important Decisions (Shape Architecture):**
- Popup UI Structure

**Deferred Decisions (Post-MVP):**
- Chrome Web Store publishing workflow
- Additional Monaco customizations

### Data Architecture

**Storage Strategy:** chrome.storage.sync
- Schema: `{ terms: Array<{ term: string, color: string }> }`
- Rationale: Simple, syncs across user's Chrome browsers, meets <8KB per item limit easily
- No database needed - extension-local storage is sufficient

### Authentication & Security

**Not Applicable** - Personal use extension with no user accounts or sensitive data.

**Permissions Minimization:**
- Only `storage` and `activeTab` permissions
- Host limited to `script.google.com/*`

### API & Communication Patterns

**Popup ↔ Content Script Communication:**
- Pattern: Hybrid (Storage as source of truth + direct message for immediate updates)
- Flow: Popup saves to storage → storage.onChanged triggers content script → sendMessage for instant feedback
- Rationale: Robust synchronization with responsive UX

**Message Format:**
```typescript
interface HighlightMessage {
  type: 'TERMS_UPDATED' | 'REFRESH_HIGHLIGHTS';
  terms?: TermConfig[];
}
```

### Frontend Architecture (Popup UI)

**UI Approach:** Pure HTML/CSS with vanilla TypeScript
- No framework dependencies
- Direct DOM manipulation
- Native `<input type="color">` for color picker
- Rationale: Minimal footprint, no build complexity, appropriate for simple UI

**Component Structure:**
- Term list (add/remove/edit)
- Color picker per term
- Save feedback indicator

### Monaco Integration Architecture

**Integration Strategy:** DOM-Based Highlighting
- Google Apps Script does NOT expose Monaco Editor APIs (`window.monaco` is undefined)
- Only DOM elements are accessible (`.monaco-editor`, `.view-lines`)
- Highlighting via TreeWalker + span injection with CSS classes
- Rationale: Monaco API is encapsulated by Google; DOM manipulation is the only viable approach

**Detection Strategy:** DOM Container Detection
- MutationObserver watches for `.view-lines` container appearance
- No API detection needed (API is not exposed by Google)
- Rationale: Efficient, reliable detection of when editor is ready

**Highlight Application Flow:**
1. Detect `.view-lines` container in DOM
2. Load terms from chrome.storage.sync
3. Use TreeWalker to find text nodes matching configured terms
4. Wrap matches in `<span>` elements with CSS classes
5. Listen for editor content changes via MutationObserver (debounced 150ms)
6. Re-apply highlights on content change

### Lessons Learned - Architecture Pivot

**Original Assumption:** Monaco Editor API would be exposed via `window.monaco.editor.getEditors()`, allowing use of native `deltaDecorations()` API for highlighting.

**Discovery:** Google Apps Script encapsulates Monaco internally without exposing global APIs. Only DOM elements (`.monaco-editor`, `.view-lines`) are accessible. Testing confirmed `window.monaco` is undefined on script.google.com.

**Pivot Decision:** Eliminated API detection and Monaco Decorators approach (Stories 2.1, 2.2). Promoted DOM-based highlighting (originally planned as "fallback") to primary and only implementation (Stories 2.4, 2.5, 2.6).

**Outcome:**
- Simpler architecture (~40% less code)
- Same functionality as originally planned
- Better alignment with reality
- No unnecessary API detection attempts

**Impact:** Stories 2.1 and 2.2 marked as DEPRECATED. Stories 2.4-2.6 complete the refactor to remove dual-mode complexity.

**See:** [ADR: Architecture Pivot to DOM-Only](./architecture-pivot-dom-only.md)

### Infrastructure & Deployment

**Development:** Load unpacked extension in Chrome Developer Mode
**Distribution:** Manual install (personal use) or Chrome Web Store (future)
**No CI/CD needed** - Single developer, manual testing sufficient

### Decision Impact Analysis

**Implementation Sequence:**
1. Project setup (TypeScript, manifest.json)
2. Storage layer (chrome.storage.sync wrapper)
3. Popup UI (term management)
4. Content script (DOM container detection)
5. Highlighting engine (DOM-based)
6. Integration testing

**Cross-Component Dependencies:**
- Content script depends on storage schema
- Popup depends on storage schema
- Highlighting engine depends on DOM container detection

## Implementation Patterns & Consistency Rules

### Pattern Categories Defined

**Critical Conflict Points Identified:**
4 areas where AI agents could make different choices in this Chrome Extension project.

### Naming Patterns

**File Naming:**
- All TypeScript files: `kebab-case.ts` (e.g., `content-script.ts`, `storage-utils.ts`)
- HTML/CSS files: `kebab-case` (e.g., `popup.html`, `popup.css`)
- Exception: `manifest.json` (Chrome requirement)

**Code Naming:**
| Element | Convention | Example |
|---------|------------|---------|
| Interfaces/Types | PascalCase | `TermConfig`, `HighlightMessage` |
| Functions | camelCase | `applyHighlights()`, `detectMonaco()` |
| Variables | camelCase | `editorInstance`, `termList` |
| Constants | UPPER_SNAKE_CASE | `STORAGE_KEY`, `POLL_INTERVAL_MS` |
| CSS classes | kebab-case | `.term-item`, `.color-picker` |

**Examples:**
```typescript
// Good
interface TermConfig {
  term: string;
  color: string;
}
const STORAGE_KEY = 'highlightTerms';
function applyHighlights(terms: TermConfig[]): void { }

// Bad
interface termConfig { }  // Should be PascalCase
const storageKey = 'highlightTerms';  // Should be UPPER_SNAKE_CASE for constants
function ApplyHighlights() { }  // Should be camelCase
```

### Structure Patterns

**Project Organization:**
```
src/
├── popup/
│   ├── popup.html      # Entry point for popup UI
│   ├── popup.ts        # Popup logic
│   └── popup.css       # Popup styles
├── content/
│   └── content.ts      # Content script (Monaco integration)
├── shared/
│   ├── types.ts        # Shared TypeScript interfaces
│   └── storage.ts      # Chrome storage wrapper
└── utils/
    └── debounce.ts     # Utility functions (if needed)
```

**Rule:** Shared code goes in `src/shared/`, utilities in `src/utils/`.

### Format Patterns

**Storage Schema:**
```typescript
// Single source of truth for storage structure
interface StorageSchema {
  terms: TermConfig[];
}

interface TermConfig {
  term: string;   // The text to highlight
  color: string;  // Hex color code (e.g., "#ff69b4")
}
```

**Message Format:**
```typescript
// All Chrome runtime messages follow this structure
interface ChromeMessage {
  type: 'TERMS_UPDATED' | 'REFRESH_HIGHLIGHTS' | 'PING';
  payload?: unknown;
}

// Response format
interface ChromeResponse {
  success: boolean;
  error?: string;
}
```

### Communication Patterns

**Storage Change Events:**
```typescript
// Content script listens to storage changes
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'sync' && changes.terms) {
    applyHighlights(changes.terms.newValue);
  }
});
```

**Message Passing:**
```typescript
// Popup sends message for immediate feedback
chrome.tabs.sendMessage(tabId, { type: 'TERMS_UPDATED' });

// Content script responds
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'TERMS_UPDATED') {
    refreshHighlights();
    sendResponse({ success: true });
  }
  return true; // Keep channel open for async response
});
```

### Process Patterns

**Error Handling:**
```typescript
// Always wrap Chrome API calls in try-catch
async function saveTerms(terms: TermConfig[]): Promise<boolean> {
  try {
    await chrome.storage.sync.set({ terms });
    return true;
  } catch (error) {
    console.error('[Highlight Extension] Storage error:', error);
    return false;
  }
}

// Log prefix for easy filtering
const LOG_PREFIX = '[Highlight Extension]';
console.log(`${LOG_PREFIX} Initialized`);
console.error(`${LOG_PREFIX} Error:`, error);
```

**DOM Highlighting Pattern:**
```typescript
// DOM-only approach (Monaco API not exposed by Google)
function applyHighlights(terms: TermConfig[]): void {
  const viewLines = document.querySelector('.view-lines');

  if (!viewLines) {
    console.error('[Highlight Extension] .view-lines container not found');
    return;
  }

  applyDomHighlights(viewLines, terms);
}
```

**Debounce Pattern:**
```typescript
// Debounce editor changes to avoid performance issues
const DEBOUNCE_MS = 150;

const debouncedApply = debounce(() => {
  applyHighlights(currentTerms);
}, DEBOUNCE_MS);
```

### Enforcement Guidelines

**All AI Agents MUST:**
1. Follow naming conventions exactly as specified above
2. Use the defined message and storage interfaces
3. Include `LOG_PREFIX` in all console statements
4. Implement DOM-based highlighting pattern (check for `.view-lines` container)
5. Debounce editor change handlers (150ms minimum)

**Anti-Patterns to Avoid:**
- Attempting to access `window.monaco` (API is NOT exposed by Google)
- Direct storage access without the wrapper function
- Hardcoded storage keys (use `STORAGE_KEY` constant)
- Missing error handling on Chrome API calls
- Synchronous message handlers without `return true`
- Assuming Monaco API is available (it is NOT)

## Project Structure & Boundaries

### Complete Project Directory Structure

```
apps-script-overhaul-extension/
├── manifest.json                 # Chrome extension manifest (MV3)
├── package.json                  # NPM dependencies and scripts
├── tsconfig.json                 # TypeScript configuration
├── .gitignore                    # Git ignore patterns
├── README.md                     # Project documentation
│
├── src/                          # Source code (TypeScript)
│   ├── popup/
│   │   ├── popup.html            # Popup entry point
│   │   ├── popup.ts              # Popup logic (term CRUD)
│   │   └── popup.css             # Popup styles
│   │
│   ├── content/
│   │   ├── content.ts            # Main content script entry
│   │   └── dom-highlighter.ts    # DOM-based highlighting engine (TreeWalker + span injection)
│   │
│   ├── shared/
│   │   ├── types.ts              # Shared TypeScript interfaces
│   │   ├── storage.ts            # Chrome storage wrapper
│   │   ├── constants.ts          # Shared constants (STORAGE_KEY, etc.)
│   │   └── messaging.ts          # Chrome messaging utilities
│   │
│   └── utils/
│       └── debounce.ts           # Debounce utility function
│
├── dist/                         # Compiled output (gitignored)
│   ├── manifest.json             # Copied from root
│   ├── popup/
│   │   ├── popup.html
│   │   ├── popup.js
│   │   └── popup.css
│   ├── content/
│   │   └── content.js            # Bundled content script
│   └── icons/
│       └── *.png
│
└── icons/                        # Extension icons (source)
    ├── icon-16.png
    ├── icon-32.png
    ├── icon-48.png
    └── icon-128.png
```

### Architectural Boundaries

**Extension Boundaries (Chrome-enforced):**

| Component | Execution Context | Can Access |
|-----------|-------------------|------------|
| Popup | Extension context | Chrome APIs, Storage |
| Content Script | Page context (isolated) | DOM, limited Chrome APIs |
| Background (if needed) | Service Worker | All Chrome APIs |

**Communication Boundaries:**

```
┌─────────────┐     chrome.storage     ┌─────────────────┐
│   Popup     │◄──────────────────────►│  Content Script │
│  (popup.ts) │     chrome.runtime     │  (content.ts)   │
└─────────────┘     .sendMessage       └─────────────────┘
       │                                       │
       ▼                                       ▼
┌─────────────┐                        ┌─────────────────┐
│   Storage   │                        │  Monaco Editor  │
│   (sync)    │                        │  (page DOM)     │
└─────────────┘                        └─────────────────┘
```

**Data Flow:**
1. User adds term in Popup → `storage.ts` saves to chrome.storage.sync
2. storage.onChanged fires → Content script receives update
3. Content script → `highlighter.ts` applies decorations
4. Monaco content changes → debounced re-application

### Requirements to Structure Mapping

**Configuration Management (FR1-FR5):**
- `src/popup/popup.html` - Term list UI
- `src/popup/popup.ts` - CRUD operations (add, remove, edit terms)
- `src/popup/popup.css` - Styling for popup
- `src/shared/storage.ts` - Storage abstraction

**Highlighting Engine (FR6-FR10):**
- `src/content/content.ts` - Entry point, orchestration
- `src/content/dom-highlighter.ts` - DOM-based highlighting (TreeWalker + span injection with CSS classes)

**Data Persistence (FR11-FR13):**
- `src/shared/storage.ts` - chrome.storage.sync wrapper
- `src/shared/types.ts` - TermConfig, StorageSchema interfaces

**Scope Control (FR14):**
- `manifest.json` - host_permissions: ["https://script.google.com/*"]

### Integration Points

**Internal Communication:**
- Popup → Content: `chrome.tabs.sendMessage()` for immediate updates
- Content → Popup: `sendResponse()` for confirmation
- Both → Storage: `chrome.storage.sync.get/set()`

**External Integration:**
- Google Apps Script DOM: Content script injection target (`.monaco-editor`, `.view-lines`)
- Note: Monaco Editor API is NOT exposed (`window.monaco` is undefined)

### File Responsibilities

| File | Single Responsibility |
|------|----------------------|
| `manifest.json` | Extension configuration and permissions |
| `popup.ts` | User interaction handling for term management |
| `content.ts` | Content script lifecycle and coordination |
| `dom-highlighter.ts` | DOM-based highlighting (TreeWalker + span injection) |
| `storage.ts` | All chrome.storage.sync operations |
| `types.ts` | TypeScript interface definitions |
| `constants.ts` | Shared constants and configuration |
| `messaging.ts` | Chrome message type guards and utilities |
| `debounce.ts` | Generic debounce utility |

### Build Configuration

**tsconfig.json key settings:**
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ES2020",
    "strict": true,
    "outDir": "./dist",
    "rootDir": "./src"
  }
}
```

**package.json scripts:**
```json
{
  "scripts": {
    "build": "tsc && npm run copy-static",
    "watch": "tsc --watch",
    "copy-static": "cp manifest.json dist/ && cp -r icons dist/ && cp src/popup/popup.html dist/popup/ && cp src/popup/popup.css dist/popup/"
  }
}
```

### Development Workflow

1. **Edit**: Modify files in `src/`
2. **Build**: `npm run build` compiles to `dist/`
3. **Load**: Chrome → Extensions → Load Unpacked → select `dist/`
4. **Test**: Open script.google.com, verify highlights
5. **Iterate**: After changes, click "Reload" on extension card

## Architecture Validation Results

### Coherence Validation ✅

**Decision Compatibility:**
All technology choices are fully compatible:
- TypeScript 5.x compiles to ES2020 for modern browser support
- @types/chrome provides type safety for Chrome Extension APIs
- Manifest V3 is the current standard and works with all chosen patterns

**Pattern Consistency:**
- Naming conventions (PascalCase for types, camelCase for functions) align with TypeScript best practices
- Structure patterns (src/popup, src/content, src/shared) follow Chrome Extension conventions
- Communication patterns (storage.onChanged, sendMessage) use standard Chrome APIs correctly

**Structure Alignment:**
- Project structure supports all architectural decisions
- Clear separation between popup, content script, and shared code
- Integration points (storage, messaging) properly located in shared modules

### Requirements Coverage Validation ✅

**Functional Requirements Coverage:**

| Category | FRs | Coverage | Implementation Location |
|----------|-----|----------|------------------------|
| Configuration Management | FR1-FR5 | 100% | src/popup/*, src/shared/storage.ts |
| Highlighting Engine | FR6-FR10 | 100% | src/content/* |
| Data Persistence | FR11-FR13 | 100% | src/shared/storage.ts |
| Scope Control | FR14 | 100% | manifest.json |

**Non-Functional Requirements Coverage:**

| NFR | Requirement | Architectural Support |
|-----|------------|----------------------|
| NFR1 | <100ms highlight | DOM-based highlighting + debounce |
| NFR2 | <200ms updates | Direct messaging + storage events |
| NFR3 | No typing lag | Debounced re-application (150ms) |
| NFR4 | <10MB footprint | Zero runtime dependencies |
| NFR5 | Graceful fallback | DOM-only approach (no API dependency) |
| NFR6 | Timing-independent detection | MutationObserver watching for `.view-lines` |
| NFR7 | Non-intrusive | DOM manipulation respects editor structure |
| NFR8 | Persistent after refresh | chrome.storage.sync |
| NFR9 | Immediate saves | Async storage with error handling |

### Implementation Readiness Validation ✅

**Decision Completeness:**
- All critical architectural decisions documented with rationale
- Technology versions specified (TypeScript 5.x, ES2020, Manifest V3)
- Integration patterns fully defined with code examples

**Structure Completeness:**
- Complete directory structure with all files listed
- File responsibilities clearly defined
- Build configuration (tsconfig.json, package.json scripts) specified

**Pattern Completeness:**
- Naming conventions cover all code elements
- Communication patterns include code examples
- Error handling patterns documented
- Fallback strategy fully specified

### Gap Analysis Results

**Critical Gaps:** None identified

**Important Gaps:** None identified

**Future Enhancements (Post-MVP):**
- Extension icons (currently placeholder paths)
- Popup dark mode support (if requested)
- Chrome Web Store publishing workflow

### Architecture Completeness Checklist

**✅ Requirements Analysis**
- [x] Project context thoroughly analyzed
- [x] Scale and complexity assessed (Low complexity)
- [x] Technical constraints identified (Manifest V3, Monaco API exposure)
- [x] Cross-cutting concerns mapped (5 concerns identified)

**✅ Architectural Decisions**
- [x] Critical decisions documented (Monaco integration, detection, communication)
- [x] Technology stack fully specified (TypeScript, Chrome APIs)
- [x] Integration patterns defined (storage + messaging hybrid)
- [x] Performance considerations addressed (debounce, efficient detection)

**✅ Implementation Patterns**
- [x] Naming conventions established (6 element types covered)
- [x] Structure patterns defined (4 source directories)
- [x] Communication patterns specified (storage events + messages)
- [x] Process patterns documented (error handling, fallback, debounce)

**✅ Project Structure**
- [x] Complete directory structure defined (11 source files mapped)
- [x] Component boundaries established (popup, content, shared)
- [x] Integration points mapped (storage, messaging, Monaco)
- [x] Requirements to structure mapping complete (all FRs mapped)

### Architecture Readiness Assessment

**Overall Status:** READY FOR IMPLEMENTATION

**Confidence Level:** HIGH

**Key Strengths:**
1. Simple, focused architecture appropriate for project scope
2. Clear patterns with code examples for AI agents
3. Robust fallback strategy for Monaco integration uncertainty
4. Minimal dependencies reduce complexity and maintenance

**Areas for Future Enhancement:**
1. Add automated testing if project grows
2. Consider publishing to Chrome Web Store
3. Expand to other code editors if needed

### Implementation Handoff

**AI Agent Guidelines:**
- Follow all architectural decisions exactly as documented
- Use implementation patterns consistently across all components
- Respect project structure and boundaries
- Refer to this document for all architectural questions
- Use the naming conventions table as reference for all code

**First Implementation Priority:**
```bash
mkdir apps-script-overhaul-extension
cd apps-script-overhaul-extension
npm init -y
npm install --save-dev typescript @types/chrome
npx tsc --init
```
Then create manifest.json and initial project structure.

## Architecture Completion Summary

### Workflow Completion

**Architecture Decision Workflow:** COMPLETED ✅
**Total Steps Completed:** 8
**Date Completed:** 2026-01-08
**Document Location:** _bmad-output/planning-artifacts/architecture.md

### Final Architecture Deliverables

**Complete Architecture Document**
- All architectural decisions documented with specific versions
- Implementation patterns ensuring AI agent consistency
- Complete project structure with all files and directories
- Requirements to architecture mapping
- Validation confirming coherence and completeness

**Implementation Ready Foundation**
- 4 critical architectural decisions made (Monaco integration, detection, communication, UI)
- 6 implementation pattern categories defined
- 4 architectural components specified (Popup, Content Script, Shared, Utils)
- 14 functional + 9 non-functional requirements fully supported

**AI Agent Implementation Guide**
- Technology stack with verified versions (TypeScript 5.x, Manifest V3, ES2020)
- Consistency rules that prevent implementation conflicts
- Project structure with clear boundaries
- Integration patterns and communication standards

### Development Sequence

1. Initialize project using documented starter template
2. Set up development environment per architecture
3. Implement core architectural foundations (storage, types)
4. Build features following established patterns
5. Maintain consistency with documented rules

### Quality Assurance Checklist

**✅ Architecture Coherence**
- [x] All decisions work together without conflicts
- [x] Technology choices are compatible
- [x] Patterns support the architectural decisions
- [x] Structure aligns with all choices

**✅ Requirements Coverage**
- [x] All 14 functional requirements are supported
- [x] All 9 non-functional requirements are addressed
- [x] 5 cross-cutting concerns are handled
- [x] Integration points are defined

**✅ Implementation Readiness**
- [x] Decisions are specific and actionable
- [x] Patterns prevent agent conflicts
- [x] Structure is complete and unambiguous
- [x] Code examples are provided for clarity

---

**Architecture Status:** READY FOR IMPLEMENTATION ✅

**Next Phase:** Begin implementation using the architectural decisions and patterns documented herein.

**Document Maintenance:** Update this architecture when major technical decisions are made during implementation.

