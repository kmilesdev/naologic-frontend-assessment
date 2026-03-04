# Work Order Schedule Timeline

An interactive timeline component for a manufacturing ERP system built with Angular 17+. Allows planners to visualize, create, and edit work orders across multiple work centers.

## Quick Start

```bash
npm install
ng serve
```

Open [http://localhost:4200](http://localhost:4200) in your browser.

No additional setup steps required — all data is hardcoded and the app runs entirely client-side.

## Features

- **Timeline Grid** with Day/Week/Month zoom levels (Day is default)
- **Fixed left panel** showing work center names with horizontally scrollable timeline
- **Work order bars** with status badges, color-coded by status (Open=Blue, In Progress=Blue/Purple, Complete=Green, Blocked=Yellow/Orange)
- **Click-to-create**: Click empty timeline area to open create panel with start date from click position, end date auto-set to start + 7 days
- **Three-dot actions menu** on each bar with Edit and Delete options
- **Overlap detection**: Prevents saving work orders that overlap on the same work center, shows error banner
- **Today indicator**: Vertical line marking the current date, with "Today"/"Current week"/"Current month" pill badge
- **Click-to-add tooltip**: Hovering over empty timeline areas shows "Click to add dates" tooltip
- **Row hover highlight**: Purple left border and light background on hovered work center row
- **Click outside to close**: Clicking outside the panel dismisses it
- **Responsive**: Narrower left panel on small screens, full-width panel on mobile

## Tech Stack

| Library | Why |
|---------|-----|
| **Angular 17+** | Framework requirement; standalone components for simpler module structure |
| **TypeScript (strict)** | Type safety with `strict: true` and additional strict flags |
| **SCSS** | Component-scoped styling with nesting, variables, and media queries |
| **Reactive Forms** | `FormGroup`/`FormControl`/`Validators` for type-safe form state and validation |
| **ng-select** | Rich dropdown for status selection with custom templates (badge rendering) |
| **@ng-bootstrap/ng-bootstrap** | `ngb-datepicker` for accessible, consistent date picking |
| **date-fns** | Tree-shakeable date math — interval calculations, formatting, day/week/month arithmetic |
| **Circular Std** | Font family loaded from Naologic CDN to match brand designs |

## Architecture

```
src/app/
  models/
    work-center.model.ts    - WorkCenterDocument interface
    work-order.model.ts     - WorkOrderDocument, WorkOrderStatus, status color maps
    timeline.model.ts       - ZoomLevel type, TimelineColumn interface
  data/
    sample-data.ts          - Hardcoded 5 work centers + 8 work orders
  services/
    work-order.service.ts   - CRUD via BehaviorSubjects, overlap validation
    timeline.service.ts     - Date-to-pixel math, column generation, zoom handling
  components/
    timeline/               - Main page: header, timescale control, grid layout
    work-order-bar/         - Bar with name, status badge, 3-dot menu
    work-order-panel/       - Slide-out create/edit form
```

### Components

- **TimelineComponent** — Main view with NAOLOGIC branding, "Work Orders" title, timescale dropdown (Day/Week/Month), fixed left panel with work center names, and horizontally scrollable timeline grid. Manages panel open/close state and passes click-derived dates to the panel.

- **WorkOrderBarComponent** — Individual bar positioned absolutely within its grid row. Shows work order name (truncated with ellipsis), status pill badge, and a three-dot actions button on hover. The actions dropdown offers Edit and Delete.

- **WorkOrderPanelComponent** — Slide-out panel from the right edge for creating/editing work orders. Uses Reactive Forms with a `FormGroup` containing Name, Status (ng-select), Start Date and End Date (ngb-datepicker). Validates required fields, date range (end > start), and overlap. A transparent overlay behind the panel handles click-outside-to-close.

### Services

- **WorkOrderService** — In-memory data store using `BehaviorSubject`. Exposes observables for work centers and work orders. `createWorkOrder()` and `updateWorkOrder()` both call `checkOverlap()` before mutating state; overlap check uses strict interval comparison and accepts an `excludeOrderId` parameter so editing an order doesn't conflict with itself.

- **TimelineService** — Pure calculation service with no state. Key methods:
  - `getDateRange(zoom)` — returns visible start/end (Day: ±14 days, Week: ±8 weeks, Month: -3/+8 months)
  - `generateColumns(zoom, start, end)` — produces column metadata with labels and current-period flags
  - `dateToPixelOffset(date, rangeStart, zoom)` — converts a date to a pixel X position
  - `pixelOffsetToDate(px, rangeStart, zoom)` — inverse: converts a click position back to a date
  - `getBarWidth(startDate, endDate, zoom)` — calculates bar width in pixels

## Sample Data

5 work centers with 8 work orders covering all 4 statuses:

| Work Center | Orders | Statuses |
|-------------|--------|----------|
| Genesis Hardware | Centrix Ltd, Apex Fabrication | Complete, Open |
| Rodriques Electrics | Rodriques Electrics | In Progress |
| Konsulting Inc | Konsulting Inc, Compleks Systems | In Progress, In Progress |
| McMarrow Distribution | Delta Components, McMarrow Distribution | Complete, Blocked |
| Spartan Manufacturing | Vertex Assembly | Open |

Three work centers (Genesis Hardware, Konsulting Inc, McMarrow Distribution) have multiple non-overlapping orders demonstrating back-to-back scheduling.

## Approach

1. **Timeline math**: Each zoom level has its own column width and date range centered on today. Day view maps 1 column = 1 day with direct pixel arithmetic. Week and Month views use calendar-aware positioning — the service iterates through actual column boundaries and calculates fractional position within each column based on real day counts (accounting for months with 28-31 days).

2. **Overlap detection**: Two orders overlap when `start_A < end_B AND start_B < end_A`. Back-to-back orders (one ending the same day another starts) are allowed. The check is scoped to the same work center and excludes the order being edited.

3. **Single panel for create/edit**: A `mode` flag (`'create' | 'edit'`) controls behavior. Create mode resets the form with the click-derived start date and auto-calculated end date (start + 7 days). Edit mode populates all fields from the existing order. The submit button text changes accordingly ("Create" vs "Save").

4. **Scroll sync**: The fixed left panel and scrollable timeline grid synchronize vertical scroll position via a scroll event listener on the grid container that mirrors `scrollTop` to the left panel.

5. **Today indicator**: A vertical line is positioned at today's date using the same `dateToPixelOffset` math used for bars, ensuring perfect alignment. The line renders behind bars (lower z-index) so it doesn't obscure content.

## Bonus Features

- **localStorage persistence**: Work orders survive page refresh. Falls back to sample data on first load or if storage is cleared.
- **Smooth animations**: Panel slide-in/out (CSS keyframes), bar hover box-shadow, tooltip fade-in, button transitions.
- **Keyboard navigation**: Tab through form fields, Escape to close panel and dropdown. Auto-focus on the name input when panel opens.
- **Infinite scroll**: Dynamically prepends/appends date columns as the user scrolls near the edges. Throttled at 100ms to avoid excessive recalculation.
- **"Today" button**: Positioned next to the timescale control, smoothly scrolls the viewport to center on today's date.
- **Tooltip on bar hover**: Shows work order name, status badge, and full date range in a styled tooltip above the bar.
- **OnPush change detection**: All three components use `ChangeDetectionStrategy.OnPush` for better performance.
- **trackBy functions**: All `@for` loops use `trackBy` to minimize DOM mutations.
- **ARIA labels**: Semantic roles (`role="dialog"`, `role="grid"`, `role="tooltip"`, `aria-label`, `aria-expanded`, `aria-required`, etc.) throughout all templates.
- **Focus management**: Panel auto-focuses the name input on open; Escape key closes panel from anywhere.

## Trade-offs & Decisions

| Decision | Rationale |
|----------|-----------|
| **In-memory BehaviorSubject vs. backend API** | Tech test scope is frontend-only. BehaviorSubjects give reactive updates without HTTP boilerplate. Swapping to HttpClient later only requires changing the service. |
| **localStorage for persistence** | Simplest option for surviving refresh without a backend. JSON serialization is acceptable for the small data volume. A production app would use a real database. |
| **date-fns over Moment/Luxon** | Tree-shakeable (only imported functions are bundled), no mutable date objects, and smaller bundle size than Moment. |
| **Absolute positioning for bars** | Bars are positioned with `left`/`width` in pixels calculated from date math. This avoids complex CSS Grid cell spanning and works naturally with variable-width columns (week/month zoom). |
| **OnPush + markForCheck** | Opted for OnPush across all components. Requires explicit `markForCheck()` calls when data changes via subscriptions, but avoids unnecessary change detection cycles. |
| **Infinite scroll with throttle** | Prepends/appends columns on scroll near edges. The 100ms throttle and `requestAnimationFrame` for scroll-left correction prevent jank. Trade-off: columns accumulate in memory over long scrolling sessions. |
| **Single panel for create/edit** | A `mode` input controls behavior rather than two separate components. Reduces duplication at the cost of a few conditional branches. |
| **Click-outside overlay** | A transparent fixed overlay intercepts clicks outside the panel. Simpler than a document-level click listener with `contains()` checks, and handles edge cases (iframes, dynamic content) better. |
| **No drag-and-drop** | Would significantly increase complexity (resize handles, snap-to-grid, optimistic updates). Omitted to focus on core requirements. Marked with `@upgrade` in code. |
