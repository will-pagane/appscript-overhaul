# Story 2.6: Update Architecture Documentation

Status: completed

<!-- REFACTOR STORY - Align documentation with DOM-only reality -->

## Story

As a developer,
I want architecture and planning documents updated to reflect the DOM-only approach,
So that future development is guided by accurate information about what works.

## Context

**Dependency:** This story completes the architecture pivot started in Stories 2.4 and 2.5.

**Current State:**
- `architecture.md` describes Monaco API approach as "primary" with CSS as "fallback"
- `project-context.md` has rules about Monaco API that don't apply
- `epics.md` has Stories 2.1, 2.2 that were based on incorrect assumptions

**Reality:**
- Google Apps Script does NOT expose Monaco Editor APIs
- DOM-based highlighting is the ONLY working approach
- What was called "CSS fallback" is actually the primary (and only) implementation

**Goal:** Update documentation to match reality and guide future development correctly.

## Acceptance Criteria

1. **Update architecture.md** - Reflect DOM-only approach:
   - Update "Monaco Integration Architecture" section
   - Change from "Hybrid (Decorators API with CSS fallback)" to "DOM-Based Highlighting"
   - Remove references to `window.monaco.editor.getEditors()`
   - Remove references to `editor.deltaDecorations()` API
   - Update "Integration Strategy" to describe DOM approach
   - Keep performance characteristics section (still accurate)
   - Add "Lessons Learned" section documenting the pivot

2. **Update project-context.md** - Update critical rules:
   - Remove "Monaco Integration Rules" section (API not available)
   - Add "DOM Highlighting Rules" section
   - Update "Critical Don't-Miss Rules" to remove Monaco API checks
   - Add rule: "Google Apps Script does NOT expose window.monaco"
   - Keep performance requirements (still relevant)

3. **Update epics.md** - Mark deprecated stories:
   - Add DEPRECATED tag to Story 2.1 description
   - Add DEPRECATED tag to Story 2.2 description
   - Update Story 2.3 description: remove "fallback" terminology
   - Add Stories 2.4, 2.5, 2.6 to epic breakdown
   - Update Epic 2 title: "Monaco Editor Highlighting Engine" → "DOM-Based Highlighting Engine"
   - Add note explaining the architecture pivot

4. **Add ADR (Architecture Decision Record)** - Document the pivot:
   - Create new file: `architecture-pivot-dom-only.md`
   - Document: Original assumption, Discovery, Decision, Consequences
   - Reference from architecture.md
   - Serve as lesson learned for future projects

5. **Verify Documentation Accuracy** - No misleading information remains:
   - Search for all mentions of "monaco.editor.getEditors()"
   - Search for all mentions of "deltaDecorations"
   - Search for "fallback" used incorrectly (should be "primary" or "DOM-based")
   - Update or remove all findings

## Tasks / Subtasks

- [x] Task 1: Update architecture.md (AC: #1)
  - [x] 1.1: Read current "Monaco Integration Architecture" section
  - [x] 1.2: Rewrite to describe DOM-based approach as primary
  - [x] 1.3: Remove references to Monaco API (getEditors, deltaDecorations)
  - [x] 1.4: Update "Detection Strategy" section (detect .view-lines, not API)
  - [x] 1.5: Update "Highlight Application Flow" diagram
  - [x] 1.6: Add "Lessons Learned - Architecture Pivot" section

- [x] Task 2: Update project-context.md (AC: #2)
  - [x] 2.1: Remove "Monaco Integration Rules" section
  - [x] 2.2: Add "DOM Highlighting Rules" section with correct patterns
  - [x] 2.3: Update "Critical Don't-Miss Rules" - remove API assumptions
  - [x] 2.4: Add explicit rule: "window.monaco is NOT exposed by Google"
  - [x] 2.5: Update "Anti-Patterns" to remove Monaco API references

- [x] Task 3: Update epics.md (AC: #3)
  - [x] 3.1: Update Epic 2 title and description
  - [x] 3.2: Mark Story 2.1 as DEPRECATED with explanation
  - [x] 3.3: Mark Story 2.2 as DEPRECATED with explanation
  - [x] 3.4: Update Story 2.3 description (remove "fallback" terminology)
  - [x] 3.5: Add Story 2.4 to epic breakdown
  - [x] 3.6: Add Story 2.5 to epic breakdown
  - [x] 3.7: Add Story 2.6 to epic breakdown
  - [x] 3.8: Add architecture pivot note to Epic 2 introduction

- [x] Task 4: Create ADR document (AC: #4)
  - [x] 4.1: Create `architecture-pivot-dom-only.md` in planning-artifacts
  - [x] 4.2: Document original assumption (Monaco API available)
  - [x] 4.3: Document discovery (API not exposed by Google)
  - [x] 4.4: Document decision (pivot to DOM-only)
  - [x] 4.5: Document consequences (simpler code, same functionality)
  - [x] 4.6: Reference ADR from architecture.md

- [x] Task 5: Search and verify (AC: #5)
  - [x] 5.1: Search all .md files for "monaco.editor.getEditors"
  - [x] 5.2: Search all .md files for "deltaDecorations"
  - [x] 5.3: Search all .md files for incorrect "fallback" usage
  - [x] 5.4: Update or remove all misleading references
  - [x] 5.5: Verify no documentation contradicts the DOM-only approach

- [x] Task 6: Review and validate (AC: #1-5)
  - [x] 6.1: Read updated architecture.md - verify accuracy
  - [x] 6.2: Read updated project-context.md - verify rules are correct
  - [x] 6.3: Read updated epics.md - verify story descriptions are clear
  - [x] 6.4: Read ADR - verify it tells the complete story
  - [x] 6.5: Confirm all documentation is internally consistent

## Dev Notes

### Documents to Update

**Primary targets:**
```
_bmad-output/planning-artifacts/
├── architecture.md          ✏️ MAJOR UPDATE (remove Monaco API approach)
├── epics.md                 ✏️ UPDATE (mark stories deprecated, add new ones)
├── project-context.md       ✏️ UPDATE (change rules)
└── architecture-pivot-dom-only.md  📝 CREATE (ADR document)
```

### Architecture.md Changes

**Sections to Rewrite:**

1. **"Monaco Integration Architecture" (Current):**
```markdown
**Integration Strategy:** Hybrid (Decorators API with CSS fallback)
- Primary: Monaco `editor.deltaDecorations()` API
- Fallback: CSS class injection if Monaco API unavailable
```

**Replace with:**
```markdown
**Integration Strategy:** DOM-Based Highlighting
- Google Apps Script does NOT expose Monaco Editor APIs
- Only DOM elements are accessible (.monaco-editor, .view-lines)
- Highlighting via TreeWalker + span injection with CSS classes
```

2. **"Detection Strategy" (Current):**
```markdown
**Detection Strategy:** Combined (MutationObserver + Polling safety net)
- Primary: MutationObserver watching for Monaco container
- Backup: Polling every 500ms with 10s timeout
```

**Replace with:**
```markdown
**Detection Strategy:** DOM Container Detection
- MutationObserver watches for .view-lines container appearance
- No API detection needed (API is not exposed)
```

3. **Add New Section:**
```markdown
### Lessons Learned - Architecture Pivot

**Original Assumption:** Monaco Editor API would be exposed via `window.monaco.editor.getEditors()`, allowing use of native `deltaDecorations()` API.

**Discovery:** Google Apps Script encapsulates Monaco internally without exposing global APIs. Only DOM elements are accessible.

**Pivot Decision:** Eliminated API detection and Monaco Decorators approach. Promoted DOM-based highlighting (originally planned as "fallback") to primary implementation.

**Outcome:** Simpler architecture, same functionality, better alignment with reality.

**See:** [ADR: Architecture Pivot to DOM-Only](./architecture-pivot-dom-only.md)
```

### Project-Context.md Changes

**Remove this section:**
```markdown
### Monaco Integration Rules

**Detection Strategy:**
- Primary: MutationObserver watching for Monaco container
- Fallback: Polling every 500ms with 10s timeout
- NEVER assume Monaco is immediately available

**Highlighting Strategy:**
- Primary: `editor.deltaDecorations()` API
- Fallback: CSS class injection if API unavailable
- ALWAYS implement both strategies
```

**Replace with:**
```markdown
### DOM Highlighting Rules

**Container Detection:**
- Wait for .view-lines element to appear in DOM
- Use MutationObserver for detection (efficient, non-blocking)
- Google Apps Script does NOT expose window.monaco global

**Highlighting Strategy:**
- DOM-based only: TreeWalker + span wrapping + CSS classes
- Apply highlights after .view-lines container detected
- Re-apply on content changes (MutationObserver, debounced 150ms)
```

### Epics.md Changes

**Update Epic 2 Header:**
```markdown
## Epic 2: DOM-Based Highlighting Engine

User sees configured terms visually highlighted in the editor via DOM manipulation.

**Architecture Note:** This epic was originally planned to use Monaco Editor APIs (Stories 2.1, 2.2), but during implementation we discovered Google Apps Script does NOT expose these APIs. We pivoted to a DOM-only approach, which works correctly. Stories 2.1 and 2.2 are marked DEPRECATED. Stories 2.4-2.6 complete the refactor to simplify the codebase.
```

**Update Story Descriptions:**

Story 2.1: Add `**[DEPRECATED]**` prefix and note
Story 2.2: Add `**[DEPRECATED]**` prefix and note
Story 2.3: Remove "fallback" terminology, rename to "DOM-Based Highlighting"

Add new stories:
- Story 2.4: Remove Monaco API Detection Logic
- Story 2.5: Refactor to DOM-Only Highlighter
- Story 2.6: Update Architecture Documentation

### ADR Template

```markdown
# ADR: Architecture Pivot to DOM-Only Highlighting

**Status:** Accepted
**Date:** 2026-01-08
**Decision Makers:** Will (Product Owner), Dev Agent (Implementation)

## Context

When planning the Chrome extension for Apps Script term highlighting, we analyzed Monaco Editor and assumed Google would expose the editor API for extensions to access.

**Original Plan:**
- Detect Monaco via `window.monaco.editor.getEditors()`
- Use `editor.deltaDecorations()` API for highlighting
- Fall back to CSS injection if API unavailable

## Discovery

During Story 2.1 implementation, we discovered:
- `window.monaco` is **undefined** on script.google.com
- No global editor instances are exposed
- Only DOM elements are accessible (`.monaco-editor`, `.view-lines`)

**Testing confirmed:** The Monaco Editor is encapsulated by Google with no external API access.

## Decision

**Pivot to DOM-Only Architecture:**
1. Eliminate Monaco API detection logic (Story 2.4)
2. Promote DOM-based highlighting as primary approach (Story 2.5)
3. Update documentation to reflect reality (Story 2.6)

## Consequences

**Positive:**
- Simpler codebase (~40% less code)
- No unnecessary API detection attempts
- Clearer architecture (single approach)
- Same functionality as planned

**Negative:**
- Cannot leverage Monaco's native decoration system
- Slightly lower performance for very large files (acceptable)
- Must maintain DOM-based approach if Google changes editor structure

**Neutral:**
- Stories 2.1, 2.2 marked as DEPRECATED (learning experience)
- Additional stories created for refactor (2.4, 2.5, 2.6)

## Lessons Learned

1. **Validate API availability early:** Test on actual target site before extensive planning
2. **DOM-first approach is safer:** When API access is uncertain, DOM manipulation is more reliable
3. **"Fallback" can become primary:** What we planned as fallback turned out to be the only option

## References

- [Epic 2: DOM-Based Highlighting Engine](./epics.md#epic-2)
- [Implementation: Story 2.3 - CSS Fallback (now primary)](../_bmad-output/implementation-artifacts/2-3-css-fallback-highlighting.md)
```

### Search Terms for Verification (Task 5)

Run these searches across all .md files:
```bash
grep -r "monaco.editor.getEditors" *.md
grep -r "deltaDecorations" *.md
grep -r "window.monaco" *.md
grep -r "Monaco API" *.md
grep -r "Decorators API" *.md
```

Update or remove all matches that imply these APIs are available.

### Critical Don'ts

- DO NOT delete historical story files (2.1, 2.2) - keep as reference
- DO NOT remove all Monaco references (context matters)
- DO NOT claim the approach was "wrong" (it was based on reasonable assumption)
- DO NOT make documentation overly technical

### Critical Dos

- DO explain the pivot clearly (assumption → discovery → decision)
- DO preserve all working code documentation
- DO make future developers aware of what doesn't work
- DO frame as learning experience, not failure

### Validation Checklist

After completing all updates:
- [ ] No document claims Monaco API is available
- [ ] All mentions of "fallback" are contextually correct
- [ ] Stories 2.1, 2.2 clearly marked DEPRECATED
- [ ] Stories 2.4, 2.5, 2.6 documented in epics.md
- [ ] ADR exists and is referenced from architecture.md
- [ ] project-context.md rules match actual implementation

### References

- [Current: architecture.md] (needs major updates)
- [Current: project-context.md] (needs rule changes)
- [Current: epics.md] (needs story updates)
- [Implementation: All Story 2.x files] (context for documentation)

## Dev Agent Record

**Completed:** 2026-01-08
**Agent:** Claude Sonnet 4.5

### Implementation Summary

Successfully updated all architecture and planning documentation to reflect the DOM-only highlighting approach, eliminating references to Monaco Editor APIs that are not exposed by Google Apps Script.

### Changes Made

**1. architecture.md Updates:**
- ✅ Rewrote "Monaco Integration Architecture" section to describe DOM-based approach
- ✅ Updated Integration Strategy: Removed hybrid approach, documented DOM-only reality
- ✅ Updated Detection Strategy: Changed from API detection to `.view-lines` container detection
- ✅ Updated Highlight Application Flow: Documented TreeWalker + span injection process
- ✅ Added "Lessons Learned - Architecture Pivot" section with ADR reference
- ✅ Updated Process Patterns: Changed Monaco Fallback Pattern to DOM Highlighting Pattern
- ✅ Updated Enforcement Guidelines: Removed Monaco API assumptions, added anti-patterns
- ✅ Updated File Structure: Simplified to reflect single DOM-based approach
- ✅ Updated File Responsibilities: Removed deprecated files, documented dom-highlighter.ts
- ✅ Updated NFR Coverage: Changed from "Monaco Decorators API" to "DOM-based highlighting"
- ✅ Updated Technical Constraints: Clarified Monaco API is NOT exposed
- ✅ Updated Cross-Cutting Concerns: Noted fallback strategy became DOM-only approach
- ✅ Updated Implementation Sequence: Changed to reflect DOM-based implementation

**2. project-context.md Updates:**
- ✅ Replaced "Monaco Integration Rules" with "DOM Highlighting Rules"
- ✅ Added explicit rule: "Google Apps Script does NOT expose window.monaco global"
- ✅ Updated Anti-Patterns: Added warnings against attempting to access Monaco APIs
- ✅ Updated Required Patterns: Changed to DOM-only highlighting approach
- ✅ Documented correct patterns: TreeWalker, span wrapping, CSS classes

**3. epics.md Verification:**
- ✅ Verified Epic 2 title is "DOM-Based Highlighting Engine"
- ✅ Verified architecture pivot note is present in Epic 2 introduction
- ✅ Verified Stories 2.1 and 2.2 are marked DEPRECATED with explanations
- ✅ Verified Story 2.3 correctly describes DOM-based approach as primary
- ✅ Verified Stories 2.4, 2.5, 2.6 are documented

**4. ADR Document Created:**
- ✅ Created `architecture-pivot-dom-only.md` in planning-artifacts directory
- ✅ Documented original assumption (Monaco API would be exposed)
- ✅ Documented discovery (API is undefined on script.google.com)
- ✅ Documented decision (pivot to DOM-only approach)
- ✅ Documented consequences (simpler code, same functionality)
- ✅ Documented lessons learned for future projects
- ✅ Referenced from architecture.md Lessons Learned section

**5. Search and Verification:**
- ✅ Searched for "monaco.editor.getEditors" - all references are in appropriate contexts (ADR, deprecated stories, anti-patterns)
- ✅ Searched for "deltaDecorations" - all references correctly indicate API is NOT available
- ✅ Searched for "window.monaco" - all references clarify it's undefined on script.google.com
- ✅ Searched for "fallback" - updated misleading references, added contextual notes
- ✅ Updated outdated sections in architecture.md (Implementation Sequence, Cross-Cutting Concerns)

### Validation Results

**Documentation Accuracy:**
- ✅ No document claims Monaco API is available
- ✅ All mentions of Monaco APIs are in historical/deprecation contexts
- ✅ All mentions of "fallback" are contextually correct with clarifying notes
- ✅ Stories 2.1, 2.2 clearly marked DEPRECATED
- ✅ Stories 2.4, 2.5, 2.6 documented in epics.md
- ✅ ADR exists (4453 bytes) and is referenced from architecture.md:231
- ✅ project-context.md rules match actual DOM-only implementation
- ✅ All documentation is internally consistent

**Files Modified:**
1. `_bmad-output/planning-artifacts/architecture.md` - Comprehensive updates throughout
2. `_bmad-output/planning-artifacts/project-context.md` - Rules updated for DOM approach
3. `_bmad-output/planning-artifacts/epics.md` - Already had correct updates (verified)

**Files Created:**
1. `_bmad-output/planning-artifacts/architecture-pivot-dom-only.md` - Complete ADR documenting the pivot

### Notes

- epics.md was already up-to-date with deprecated story markers and architecture pivot notes
- All remaining references to Monaco API are in appropriate contexts (historical documentation, lessons learned, deprecated stories)
- The documentation now accurately reflects that DOM-based highlighting is the only viable approach
- Future developers will have clear guidance about what works and what doesn't on script.google.com

### Story Complete

All acceptance criteria met. Documentation now accurately reflects the DOM-only approach and provides clear guidance for future development.
