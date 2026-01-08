---
stepsCompleted: [1, 2, 3, 4]
inputDocuments:
  - '_bmad-output/planning-artifacts/prd.md'
  - '_bmad-output/planning-artifacts/architecture.md'
  - '_bmad-output/project-context.md'
status: complete
completedAt: '2026-01-08'
epicCount: 2
storyCount: 7
frCoverage: '14/14 (100%)'
---

# Apps Script Overhaul - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for Apps Script Overhaul, decomposing the requirements from the PRD, UX Design if it exists, and Architecture requirements into implementable stories.

## Requirements Inventory

### Functional Requirements

**Configuration Management:**
- FR1: User can view a list of all configured term/color pairs
- FR2: User can add a new term with an associated color
- FR3: User can remove an existing term from the list
- FR4: User can modify the color of an existing term
- FR5: User can access the configuration panel via the extension icon

**Highlighting Engine:**
- FR6: Extension can detect when Monaco Editor is present on the page
- FR7: Extension can apply color highlighting to all instances of configured terms in the editor
- FR8: Extension can update highlights when editor content changes
- FR9: Extension can apply highlights without requiring page refresh
- FR10: Extension can apply multiple different term/color highlights simultaneously

**Data Persistence:**
- FR11: Extension can save term/color configurations persistently
- FR12: Extension can load saved configurations on page load
- FR13: Extension can sync configurations across user's Chrome browsers

**Scope Control:**
- FR14: Extension only activates on script.google.com domain

### NonFunctional Requirements

**Performance:**
- NFR1: Highlights must be applied within 100ms of page/editor load completion
- NFR2: Adding/removing terms must reflect in the editor within 200ms
- NFR3: Extension must not cause perceptible lag when typing in the editor
- NFR4: Memory footprint must remain minimal (< 10MB)

**Integration:**
- NFR5: Extension must gracefully handle Monaco Editor API unavailability (fallback to CSS-only approach)
- NFR6: Extension must detect Monaco Editor regardless of page load timing variations
- NFR7: Extension must not interfere with native Monaco Editor functionality (autocomplete, syntax highlighting, etc.)

**Reliability:**
- NFR8: Highlights must persist correctly after page refresh
- NFR9: Configuration changes must be saved immediately to prevent data loss

### Additional Requirements

**From Architecture - Starter Template:**
- Project must be initialized with minimal TypeScript setup (no framework)
- Use TypeScript 5.x with strict mode enabled, target ES2020
- Install @types/chrome for Chrome Extension API types
- No bundler required - use tsc compiler only

**From Architecture - Project Structure:**
- Follow defined directory structure: src/popup/, src/content/, src/shared/, src/utils/
- All files must follow kebab-case naming convention
- Shared code (types, storage, constants) in src/shared/
- Utility functions (debounce) in src/utils/

**From Architecture - Monaco Integration:**
- Implement hybrid detection: MutationObserver (primary) + Polling fallback (500ms, 10s timeout)
- Implement hybrid highlighting: Monaco Decorators API (primary) + CSS injection fallback
- Debounce editor content changes at 150ms minimum

**From Architecture - Communication Patterns:**
- Use chrome.storage.sync as source of truth
- Implement storage.onChanged listener in content script
- Use chrome.tabs.sendMessage for immediate popup-to-content updates
- All message handlers must return true for async responses

**From Architecture - Code Quality:**
- All Chrome API calls must be wrapped in try-catch
- All console statements must use LOG_PREFIX: '[Highlight Extension]'
- Use STORAGE_KEY constant, never hardcode storage keys
- Follow defined naming conventions (PascalCase for types, camelCase for functions, UPPER_SNAKE_CASE for constants)

**From project-context.md - Critical Rules:**
- NEVER access storage directly without wrapper function
- ALWAYS implement Monaco fallback (CSS) alongside Decorators API
- ALWAYS test both with and without Monaco API availability

### FR Coverage Map

| FR | Epic | Description |
|----|------|-------------|
| FR1 | Epic 1 | View term/color list in popup |
| FR2 | Epic 1 | Add new term with color |
| FR3 | Epic 1 | Remove existing term |
| FR4 | Epic 1 | Modify term color |
| FR5 | Epic 1 | Access popup via extension icon |
| FR6 | Epic 2 | Detect Monaco Editor |
| FR7 | Epic 2 | Apply color highlights |
| FR8 | Epic 2 | Update on content changes |
| FR9 | Epic 2 | No refresh needed |
| FR10 | Epic 2 | Multiple simultaneous highlights |
| FR11 | Epic 1 | Persistent storage |
| FR12 | Epic 1 | Load configs on page load |
| FR13 | Epic 1 | Cross-browser sync |
| FR14 | Epic 1 | Scope to script.google.com |

## Epic List

### Epic 1: Complete Term Management System
User can fully manage highlight configurations via the extension popup, with persistent storage and cross-browser sync.

**FRs covered:** FR1, FR2, FR3, FR4, FR5, FR11, FR12, FR13, FR14

**User Outcome:** After this epic, user can install the extension, open the popup on script.google.com, add/edit/remove terms with colors, and configurations are saved and synced across browsers.

### Epic 2: Monaco Editor Highlighting Engine
User sees configured terms visually highlighted in the Monaco editor with real-time updates.

**FRs covered:** FR6, FR7, FR8, FR9, FR10

**User Outcome:** After this epic, configured terms appear colored in the Monaco editor automatically, updating in real-time as the user edits code.

---

## Epic 1: Complete Term Management System

User can fully manage highlight configurations via the extension popup, with persistent storage and cross-browser sync.

### Story 1.1: Project Initialization and Extension Foundation

As a developer,
I want to initialize the Chrome extension project with TypeScript configuration and basic structure,
So that I have a working foundation that can be loaded in Chrome.

**Acceptance Criteria:**

**Given** no project exists
**When** the initialization is complete
**Then** the following structure exists:
- `manifest.json` with Manifest V3, host_permissions for script.google.com
- `tsconfig.json` with strict mode, ES2020 target
- `package.json` with typescript and @types/chrome
- `src/shared/types.ts` with TermConfig, StorageSchema, ChromeMessage interfaces
- `src/shared/constants.ts` with STORAGE_KEY, LOG_PREFIX constants
- `src/shared/storage.ts` with save/load/sync wrapper functions
- `src/utils/debounce.ts` with debounce utility
- Basic `src/popup/popup.html` placeholder

**And** running `npm run build` compiles successfully
**And** the extension can be loaded in Chrome as unpacked
**And** the extension icon appears only on script.google.com (FR14)

### Story 1.2: Popup UI - Add New Terms

As a user,
I want to open the extension popup and add a term with a color,
So that I can configure my first highlight.

**Acceptance Criteria:**

**Given** the extension is installed and I'm on script.google.com
**When** I click the extension icon
**Then** a popup opens with a form to add a term (FR5)

**Given** the popup is open
**When** I enter a term (e.g., "resources") and select a color (e.g., pink)
**And** I click "Add"
**Then** the term/color pair is saved to chrome.storage.sync (FR2, FR11, FR13)
**And** a success indicator appears
**And** the term appears in the list below the form (FR1)

**Given** I have just added a term
**When** I close and reopen the popup
**Then** my saved term appears in the list (FR12)

### Story 1.3: Popup UI - View, Edit, and Remove Terms

As a user,
I want to view my configured terms and edit or remove them,
So that I can manage my highlight configuration over time.

**Acceptance Criteria:**

**Given** I have saved terms in my configuration
**When** I open the popup
**Then** I see a list of all my term/color pairs (FR1)
**And** each item shows the term text and a color indicator

**Given** I see a term in the list
**When** I click the color picker for that term
**And** I select a new color
**Then** the color is updated immediately in storage (FR4, FR9)
**And** the list reflects the new color

**Given** I see a term in the list
**When** I click the remove/delete button for that term
**Then** the term is removed from storage (FR3)
**And** the term disappears from the list immediately

---

## Epic 2: Monaco Editor Highlighting Engine

User sees configured terms visually highlighted in the Monaco editor with real-time updates.

### Story 2.1: Content Script Foundation and Monaco Detection

As a user,
I want the extension to automatically detect when the Monaco editor loads,
So that highlighting can be applied without manual intervention.

**Acceptance Criteria:**

**Given** I navigate to script.google.com with an Apps Script project
**When** the Monaco editor loads on the page
**Then** the content script detects the editor instance (FR6)
**And** detection works regardless of page load timing (NFR6)

**Given** Monaco loads slowly or asynchronously
**When** MutationObserver doesn't catch it immediately
**Then** the polling fallback (500ms interval, 10s timeout) detects it

**Given** detection is complete
**When** Monaco instance is found
**Then** a log message appears: "[Highlight Extension] Monaco editor detected"
**And** the extension is ready to apply highlights

### Story 2.2: Term Highlighting with Monaco Decorators API

As a user,
I want my configured terms to appear highlighted in the editor,
So that I can visually track important objects in my code.

**Acceptance Criteria:**

**Given** Monaco editor is detected and I have saved terms
**When** the editor content is visible
**Then** all instances of each configured term are highlighted with their color (FR7)
**And** multiple different terms show their respective colors simultaneously (FR10)
**And** highlights appear within 100ms of editor load (NFR1)

**Given** highlights are applied
**When** I use Monaco features (autocomplete, find, etc.)
**Then** native Monaco functionality works normally (NFR7)

**Given** the Monaco Decorators API is available
**When** highlights are applied
**Then** `editor.deltaDecorations()` is used for clean integration

### Story 2.3: CSS Fallback Highlighting

As a user,
I want highlighting to work even if Monaco API is unavailable,
So that the extension remains functional in all scenarios.

**Acceptance Criteria:**

**Given** Monaco editor is present but API is not exposed
**When** the extension attempts to apply highlights
**Then** the CSS fallback is used instead (NFR5)
**And** terms are still visually highlighted
**And** a log message indicates fallback mode: "[Highlight Extension] Using CSS fallback"

**Given** CSS fallback is active
**When** I edit code in the editor
**Then** highlights continue to work (may need re-application on content change)

### Story 2.4: Real-time Updates on Content and Config Changes

As a user,
I want highlights to update automatically when I edit code or change my configuration,
So that I always see current highlights without refreshing.

**Acceptance Criteria:**

**Given** highlights are applied in the editor
**When** I type or edit code that adds/removes instances of configured terms
**Then** highlights update automatically (FR8)
**And** updates are debounced at 150ms to prevent lag (NFR3)
**And** no perceptible typing lag occurs

**Given** the popup is open
**When** I add, modify, or remove a term configuration
**Then** the editor highlights update within 200ms (FR9, NFR2)
**And** no page refresh is required

**Given** storage.onChanged fires
**When** terms are updated from another source (e.g., sync from another browser)
**Then** highlights refresh automatically

