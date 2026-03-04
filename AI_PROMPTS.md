# AI Prompts Used During Development

This document captures the key AI prompts and decision processes used while building the Work Order Schedule Timeline application.

---

## 1. Initial Project Scaffolding

**Prompt:**
> Build a pixel-perfect "Work Orders" schedule/timeline Angular 17+ application for Naologic's manufacturing ERP tech test. Must match provided PNG screenshots: NAOLOGIC branding, light/pastel work order bars with status pill badges, fixed left Work Center column, horizontally scrollable timeline, Day/Week/Month zoom levels, create/edit slide-out panel, overlap detection, and all interactions.

**Result:** Generated the base project structure with standalone components, service layer, and model definitions. Established the three-component architecture (Timeline, WorkOrderBar, WorkOrderPanel) early on.

---

## 2. Timeline Date-to-Pixel Math

**Prompt:**
> Implement date-to-pixel offset conversion for a timeline component. Day view: 1 column = 1 day. Week/Month views need calendar-aware positioning that accounts for variable month lengths (28-31 days). Also need the inverse function (pixel-to-date) for click-to-create.

**Key Decision:** Used `date-fns` functions (`eachDayOfInterval`, `eachWeekOfInterval`, `eachMonthOfInterval`) to generate columns, then iterate through columns to find fractional position. This handles variable-length months accurately instead of assuming 30 days.

**Trade-off:** Iterating through columns for each bar position is O(n) per bar. For large datasets, a binary search or precomputed lookup would be faster (`@upgrade` comment added).

---

## 3. Overlap Detection Algorithm

**Prompt:**
> Implement overlap detection for work orders on the same work center. Two date intervals overlap when start_A < end_B AND start_B < end_A. Back-to-back orders (ending same day one starts) should NOT overlap. During edit, exclude the order being edited from the check.

**Key Decision:** Used `date-fns/isBefore` for strict comparison (not `<=`), so back-to-back scheduling is allowed. The `excludeOrderId` parameter in `checkOverlap()` prevents an order from conflicting with itself during edit.

---

## 4. Status Colors & Design Matching

**Prompt:**
> Match the exact status colors from the Sketch designs. Need both bar background colors (very light/pastel) and badge colors (pill text + background). Statuses: Open, In Progress, Complete, Blocked.

**Result:** Extracted color values and created two separate color maps — `STATUS_BADGE_COLORS` for the pill badges and `BAR_COLORS` for the bar backgrounds. Bar colors use rgba with low opacity for the pastel effect.

| Status | Badge BG | Badge Text | Bar BG |
|--------|----------|------------|--------|
| Open | #E8EAFF | #5B5FC7 | rgba(91,95,199,0.06) |
| In Progress | #EDEDFC | #6366F1 | rgba(99,102,241,0.08) |
| Complete | #E8F5E9 | #43A047 | rgba(67,160,71,0.06) |
| Blocked | #FFF8E1 | #F9A825 | rgba(249,168,37,0.08) |

---

## 5. Panel Slide-In/Out Animation

**Prompt:**
> Add smooth slide-in and slide-out CSS animations to the right-side panel. The panel should slide in from the right when opened and slide out when closed. Need to handle the timing so the DOM element isn't removed before the animation completes.

**Key Decision:** Used CSS `@keyframes` for both `slideIn` and `slideOut`. Added an `isClosing` state flag that triggers the slide-out animation class. A `setTimeout` matching the animation duration (200ms) delays the actual DOM removal, ensuring the animation plays fully before the `@if` condition removes the element.

---

## 6. Infinite Scroll Implementation

**Prompt:**
> Implement infinite horizontal scroll that dynamically loads more date columns when the user scrolls near the left or right edge. When prepending columns on the left, adjust the scroll position to maintain the current view. Throttle scroll checks to avoid excessive recalculation.

**Key Decision:** Used a 100ms throttle timer and 200px edge threshold. When prepending columns, used `requestAnimationFrame` to adjust `scrollLeft` by the added width after the DOM updates. Added deduplication via a `Set` of existing column ISO dates to prevent duplicate columns at boundaries.

**Trade-off:** Columns accumulate in memory during long scrolling sessions. A production version would implement windowed/virtual scrolling to cap the DOM element count (`@upgrade`).

---

## 7. localStorage Persistence

**Prompt:**
> Add localStorage persistence so work orders survive page refresh. Fall back to sample data on first load. Handle edge cases: empty arrays should persist (user deleted all orders), corrupted data should fallback gracefully.

**Key Decision:** Store the full work orders array as JSON under a single key. On load, check for valid JSON array (including empty arrays). Only fall back to sample data when the key doesn't exist or the value isn't a valid array. Wrap both read and write in try/catch for storage quota or parse errors.

---

## 8. Accessibility & ARIA Labels

**Prompt:**
> Add ARIA labels throughout the application for accessibility. The panel should be role="dialog", the timeline grid should be role="grid", tooltips should be role="tooltip", and interactive elements need aria-label, aria-expanded, and aria-required attributes.

**Key Decision:** Used `[attr.aria-label]` binding syntax (not `aria-label="{{ }}"`) for dynamic values, as Angular template interpolation in static attribute bindings causes compilation errors with the strict template checker.

---

## 9. OnPush Change Detection Strategy

**Prompt:**
> Switch all components to OnPush change detection for better performance. Ensure data updates still propagate correctly since we use BehaviorSubject observables.

**Key Decision:** Added `ChangeDetectionStrategy.OnPush` to all three components. In `TimelineComponent`, added explicit `cdr.markForCheck()` calls in the subscription callback and after infinite scroll mutations, since OnPush won't detect changes from async operations without explicit notification.

---

## 10. Unit Test Strategy

**Prompt:**
> Write unit tests for the two services (WorkOrderService, TimelineService) covering: CRUD operations, overlap detection edge cases, date-to-pixel math accuracy, column generation for all zoom levels, infinite scroll range extension, and localStorage persistence.

**Key Decision:** Focused tests on the service layer (pure logic, no DOM dependencies) for maximum value with minimal setup complexity. Tests cover the critical business rules: overlap detection, date positioning accuracy, and data persistence.
