# Story 1.1: Project Initialization and Extension Foundation

Status: done

## Story

As a developer,
I want to initialize the Chrome extension project with TypeScript configuration and basic structure,
So that I have a working foundation that can be loaded in Chrome.

## Acceptance Criteria

1. **Project Structure Created** - The following directory structure exists after initialization:
   ```
   apps-script-overhaul-extension/
   ├── manifest.json
   ├── tsconfig.json
   ├── package.json
   ├── .gitignore
   ├── src/
   │   ├── popup/
   │   │   └── popup.html (placeholder)
   │   ├── content/
   │   ├── shared/
   │   │   ├── types.ts
   │   │   ├── constants.ts
   │   │   └── storage.ts
   │   └── utils/
   │       └── debounce.ts
   ├── dist/
   └── icons/
   ```

2. **Manifest V3 Configuration** - `manifest.json` contains:
   - `manifest_version: 3`
   - `host_permissions` restricted to `https://script.google.com/*`
   - Proper `permissions` for `storage` and `activeTab`
   - `action` for popup configuration

3. **TypeScript Configuration** - `tsconfig.json` includes:
   - `strict: true` mode enabled
   - `target: ES2020`
   - `module: ES2020`
   - `outDir: ./dist`
   - `rootDir: ./src`

4. **Dependencies Installed** - `package.json` contains:
   - `typescript` as devDependency
   - `@types/chrome` as devDependency
   - Build scripts defined

5. **Shared Types Defined** - `src/shared/types.ts` exports:
   - `TermConfig` interface with `term: string` and `color: string`
   - `StorageSchema` interface with `terms: TermConfig[]`
   - `ChromeMessage` interface with `type` union and optional `payload`
   - `ChromeResponse` interface with `success` and optional `error`

6. **Constants Defined** - `src/shared/constants.ts` exports:
   - `STORAGE_KEY = 'highlightTerms'`
   - `LOG_PREFIX = '[Highlight Extension]'`
   - `POLL_INTERVAL_MS = 500`
   - `POLL_TIMEOUT_MS = 10000`
   - `DEBOUNCE_MS = 150`

7. **Storage Wrapper Implemented** - `src/shared/storage.ts` exports:
   - `saveTerms(terms: TermConfig[]): Promise<boolean>` - saves to chrome.storage.sync
   - `loadTerms(): Promise<TermConfig[]>` - loads from chrome.storage.sync
   - All functions wrapped in try-catch with proper error logging

8. **Debounce Utility Created** - `src/utils/debounce.ts` exports:
   - Generic `debounce<T extends (...args: any[]) => any>(fn: T, delay: number): T` function

9. **Popup Placeholder** - `src/popup/popup.html` exists as basic HTML placeholder

10. **Build Successful** - Running `npm run build` compiles all TypeScript files to `dist/` without errors

11. **Extension Loadable** - The `dist/` folder can be loaded in Chrome as unpacked extension

12. **Scope Restriction Works** - Extension icon/action appears only on script.google.com pages (FR14)

## Tasks / Subtasks

- [x] Task 1: Initialize NPM project and install dependencies (AC: #3, #4)
  - [x] 1.1: Run `npm init -y` in project root
  - [x] 1.2: Install `typescript` and `@types/chrome` as devDependencies
  - [x] 1.3: Run `npx tsc --init` to generate base tsconfig.json
  - [x] 1.4: Configure tsconfig.json with strict mode, ES2020 target, outDir/rootDir

- [x] Task 2: Create manifest.json with Manifest V3 configuration (AC: #2, #12)
  - [x] 2.1: Create manifest.json with manifest_version 3
  - [x] 2.2: Configure host_permissions for script.google.com only
  - [x] 2.3: Set permissions array with storage and activeTab
  - [x] 2.4: Configure action for popup

- [x] Task 3: Create directory structure (AC: #1)
  - [x] 3.1: Create src/popup/ directory
  - [x] 3.2: Create src/content/ directory
  - [x] 3.3: Create src/shared/ directory
  - [x] 3.4: Create src/utils/ directory
  - [x] 3.5: Create dist/ directory (or ensure it's created by build)
  - [x] 3.6: Create icons/ directory

- [x] Task 4: Implement shared types (AC: #5)
  - [x] 4.1: Create src/shared/types.ts
  - [x] 4.2: Define and export TermConfig interface
  - [x] 4.3: Define and export StorageSchema interface
  - [x] 4.4: Define and export ChromeMessage interface with type union
  - [x] 4.5: Define and export ChromeResponse interface

- [x] Task 5: Implement constants (AC: #6)
  - [x] 5.1: Create src/shared/constants.ts
  - [x] 5.2: Export STORAGE_KEY constant
  - [x] 5.3: Export LOG_PREFIX constant
  - [x] 5.4: Export timing constants (POLL_INTERVAL_MS, POLL_TIMEOUT_MS, DEBOUNCE_MS)

- [x] Task 6: Implement storage wrapper (AC: #7)
  - [x] 6.1: Create src/shared/storage.ts
  - [x] 6.2: Import types and constants
  - [x] 6.3: Implement saveTerms() with try-catch and LOG_PREFIX logging
  - [x] 6.4: Implement loadTerms() with try-catch and LOG_PREFIX logging

- [x] Task 7: Implement debounce utility (AC: #8)
  - [x] 7.1: Create src/utils/debounce.ts
  - [x] 7.2: Implement generic debounce function with proper TypeScript typing

- [x] Task 8: Create popup placeholder (AC: #9)
  - [x] 8.1: Create src/popup/popup.html with minimal valid HTML
  - [x] 8.2: Include basic structure (html, head, body)

- [x] Task 9: Configure build scripts (AC: #4, #10)
  - [x] 9.1: Add "build" script to package.json (tsc + copy static files)
  - [x] 9.2: Add "watch" script for development
  - [x] 9.3: Add "copy-static" script for manifest, icons, HTML, CSS

- [x] Task 10: Create .gitignore (AC: #1)
  - [x] 10.1: Add node_modules/ to .gitignore
  - [x] 10.2: Add dist/ to .gitignore (compiled output)

- [x] Task 11: Verify build and extension loading (AC: #10, #11, #12)
  - [x] 11.1: Run npm run build and verify no errors
  - [x] 11.2: Load dist/ folder in Chrome as unpacked extension
  - [x] 11.3: Verify extension appears/activates only on script.google.com

## Dev Notes

### Architecture Compliance Requirements

**CRITICAL - Follow these patterns exactly:**

1. **Naming Conventions (MUST follow):**
   - Files: `kebab-case.ts` (e.g., `types.ts`, `storage.ts`, `debounce.ts`)
   - Interfaces/Types: `PascalCase` (e.g., `TermConfig`, `StorageSchema`)
   - Functions: `camelCase` (e.g., `saveTerms`, `loadTerms`)
   - Constants: `UPPER_SNAKE_CASE` (e.g., `STORAGE_KEY`, `LOG_PREFIX`)

2. **Error Handling Pattern (MUST implement):**
   ```typescript
   async function saveTerms(terms: TermConfig[]): Promise<boolean> {
     try {
       await chrome.storage.sync.set({ [STORAGE_KEY]: terms });
       console.log(`${LOG_PREFIX} Terms saved successfully`);
       return true;
     } catch (error) {
       console.error(`${LOG_PREFIX} Storage error:`, error);
       return false;
     }
   }
   ```

3. **Logging Pattern (MUST use LOG_PREFIX):**
   - ALL console.log/error/warn MUST use `LOG_PREFIX`
   - Example: `console.log(\`${LOG_PREFIX} Initialized\`)`

### Technical Requirements

**TypeScript Configuration (exact values):**
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ES2020",
    "strict": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "moduleResolution": "node",
    "esModuleInterop": true,
    "skipLibCheck": true
  },
  "include": ["src/**/*"]
}
```

**Manifest V3 Required Fields:**
```json
{
  "manifest_version": 3,
  "name": "Apps Script Highlight Extension",
  "version": "1.0.0",
  "description": "Highlight configured terms in Monaco editor on script.google.com",
  "permissions": ["storage", "activeTab"],
  "host_permissions": ["https://script.google.com/*"],
  "action": {
    "default_popup": "popup/popup.html",
    "default_title": "Highlight Terms"
  }
}
```

**Package.json Scripts (cross-platform):**
```json
{
  "scripts": {
    "build": "tsc && npm run copy-static",
    "watch": "tsc --watch",
    "copy-static": "node scripts/copy-static.js"
  }
}
```
Note: Uses Node.js script (`scripts/copy-static.js`) for cross-platform compatibility.

### Interface Definitions (exact structure)

**TermConfig:**
```typescript
export interface TermConfig {
  term: string;   // The text to highlight
  color: string;  // Hex color code (e.g., "#ff69b4")
}
```

**StorageSchema:**
```typescript
export interface StorageSchema {
  terms: TermConfig[];
}
```

**ChromeMessage:**
```typescript
export interface ChromeMessage {
  type: 'TERMS_UPDATED' | 'REFRESH_HIGHLIGHTS' | 'PING';
  payload?: unknown;
}
```

**ChromeResponse:**
```typescript
export interface ChromeResponse {
  success: boolean;
  error?: string;
}
```

### Project Structure Notes

- This is the FOUNDATION story - everything built here will be used by subsequent stories
- Storage wrapper MUST use the `STORAGE_KEY` constant, never hardcode
- All Chrome API calls MUST be in try-catch blocks
- The debounce utility will be used by Epic 2 for Monaco content change handling
- Popup HTML is placeholder only - full UI comes in Story 1.2

### Critical Don'ts

- DO NOT install any bundler (Webpack, Vite, etc.) - use tsc only
- DO NOT add any runtime dependencies - only devDependencies
- DO NOT hardcode storage keys - use STORAGE_KEY constant
- DO NOT create console statements without LOG_PREFIX
- DO NOT skip error handling on any Chrome API call

### References

- [Source: _bmad-output/planning-artifacts/architecture.md#Starter-Template-Evaluation]
- [Source: _bmad-output/planning-artifacts/architecture.md#Implementation-Patterns-&-Consistency-Rules]
- [Source: _bmad-output/planning-artifacts/architecture.md#Project-Structure-&-Boundaries]
- [Source: _bmad-output/planning-artifacts/project-context.md#Critical-Implementation-Rules]
- [Source: _bmad-output/planning-artifacts/epics.md#Story-1.1]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

- Build completed successfully with `npm run build`
- Extension loaded in Chrome without errors

### Completion Notes List

- Initialized NPM project with TypeScript 5.9.3 and @types/chrome
- Configured tsconfig.json with strict mode, ES2020 target, proper outDir/rootDir
- Created manifest.json with Manifest V3, host_permissions for script.google.com only
- Implemented all shared types: TermConfig, StorageSchema, ChromeMessage, ChromeResponse
- Implemented all constants: STORAGE_KEY, LOG_PREFIX, POLL_INTERVAL_MS, POLL_TIMEOUT_MS, DEBOUNCE_MS
- Implemented storage wrapper with saveTerms() and loadTerms() functions with proper error handling
- Implemented generic debounce utility with TypeScript typing
- Created popup placeholder with HTML, CSS, and minimal TS
- Created cross-platform build script using Node.js (scripts/copy-static.js)
- All acceptance criteria satisfied

### File List

**New Files Created:**
- manifest.json
- tsconfig.json
- package.json
- .gitignore
- scripts/copy-static.js
- src/shared/types.ts
- src/shared/constants.ts
- src/shared/storage.ts
- src/utils/debounce.ts
- src/popup/popup.html
- src/popup/popup.css
- src/popup/popup.ts
- src/content/content.ts (placeholder for Epic 2)

**Directories Created:**
- src/
- src/popup/
- src/content/
- src/shared/
- src/utils/
- icons/
- dist/ (generated by build)

## Senior Developer Review (AI)

**Review Date:** 2026-01-08
**Reviewer:** Claude Opus 4.5
**Outcome:** Approved with Fixes

### Issues Found & Resolved

| # | Severity | Issue | Resolution |
|---|----------|-------|------------|
| 1 | MEDIUM | StorageSchema interface unused | Fixed: Now imported and used in storage.ts |
| 2 | LOW | Debounce missing cancel() method | Fixed: Added DebouncedFunction interface with cancel() |
| 3 | LOW | Dev Notes outdated (Windows commands) | Fixed: Updated to reflect cross-platform Node.js script |
| 4 | LOW | Empty src/content/ directory | Fixed: Added content.ts placeholder |

### Action Items
- [x] Update storage.ts to use StorageSchema interface
- [x] Add cancel() method to debounce utility
- [x] Update Dev Notes with correct build script info
- [x] Add content.ts placeholder file

### Learnings for Future Stories
1. **StorageSchema usage:** Always use the defined schema interfaces for type safety
2. **Debounce cancel:** Include cancel() method for proper cleanup in content scripts
3. **Cross-platform scripts:** Use Node.js scripts instead of OS-specific commands
4. **Placeholder files:** Create placeholder files in all directories that will be used later

