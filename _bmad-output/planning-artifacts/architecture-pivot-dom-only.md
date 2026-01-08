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

**New Implementation:**
- Detect `.view-lines` container using MutationObserver
- Use TreeWalker to traverse text nodes
- Wrap matching terms in `<span>` elements with CSS classes
- Apply custom styles for highlighting
- Re-apply on content changes (debounced 150ms)

## Consequences

**Positive:**
- Simpler codebase (~40% less code)
- No unnecessary API detection attempts
- Clearer architecture (single approach)
- Same functionality as planned
- No dependency on Monaco API availability
- More maintainable and easier to understand

**Negative:**
- Cannot leverage Monaco's native decoration system
- Slightly lower performance for very large files (acceptable trade-off)
- Must maintain DOM-based approach if Google changes editor structure
- Need to handle edge cases in text node manipulation

**Neutral:**
- Stories 2.1, 2.2 marked as DEPRECATED (learning experience)
- Additional stories created for refactor (2.4, 2.5, 2.6)
- Timeline impact minimal (refactor completed quickly)

## Lessons Learned

1. **Validate API availability early:** Test on actual target site before extensive planning. A quick console check (`console.log(window.monaco)`) would have revealed the issue immediately.

2. **DOM-first approach is safer:** When API access is uncertain, DOM manipulation is more reliable for browser extensions interacting with third-party sites.

3. **"Fallback" can become primary:** What we planned as fallback turned out to be the only option. Good architecture planning made this pivot straightforward.

4. **Document assumptions:** Explicitly documenting assumptions (e.g., "Monaco API will be exposed") makes it easier to identify and correct them when proven wrong.

5. **Keep deprecated work:** Stories 2.1 and 2.2 serve as valuable reference and demonstrate the discovery process.

## References

- [Epic 2: DOM-Based Highlighting Engine](./epics.md#epic-2-dom-based-highlighting-engine)
- [Story 2.3: DOM-Based Highlighting (now primary)](../implementation-artifacts/2-3-css-fallback-highlighting.md)
- [Story 2.4: Remove Monaco API Detection Logic](../implementation-artifacts/2-4-remove-monaco-api-detection-logic.md)
- [Story 2.5: Refactor to DOM-Only Highlighter](../implementation-artifacts/2-5-refactor-to-dom-only-highlighter.md)
- [Story 2.6: Update Architecture Documentation](../implementation-artifacts/2-6-update-architecture-documentation.md)
- [Updated Architecture Document](./architecture.md#monaco-integration-architecture)
- [Updated Project Context](./project-context.md#dom-highlighting-rules)

## Implementation Status

**Completed Stories:**
- ✅ Story 2.1: Monaco API detection (deprecated, but working as discovery step)
- ✅ Story 2.2: Monaco Decorators attempt (deprecated, API not available)
- ✅ Story 2.3: DOM-based highlighting (working, now primary implementation)
- ✅ Story 2.4: Remove Monaco API detection logic
- ✅ Story 2.5: Refactor to DOM-only highlighter
- ✅ Story 2.6: Update architecture documentation

**Current Status:** Architecture pivot complete. Extension fully functional with DOM-only approach.

---

_This ADR documents a successful pivot that improved the codebase while maintaining full functionality. The discovery process, though unplanned, resulted in a simpler and more maintainable solution._
