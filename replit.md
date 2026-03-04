# Work Order Schedule Timeline

## Overview
An Angular 17+ interactive timeline application for Naologic's manufacturing ERP tech test. Implements a "Work Orders" schedule/timeline screen with fixed left Work Center column and horizontally scrollable timeline area. UI matches provided design screenshots.

## Architecture
- **Framework**: Angular 17+ with standalone components, OnPush change detection
- **Styling**: SCSS + Circular Std font (from Naologic CDN)
- **Forms**: Reactive Forms with FormGroup/FormControl/Validators
- **Status Dropdown**: ng-select for status field in drawer panel
- **Datepickers**: @ng-bootstrap/ng-bootstrap ngb-datepicker for date fields
- **Timescale Dropdown**: Custom dropdown component (not ng-select) for pixel-perfect match
- **Date math**: date-fns for all date calculations
- **Persistence**: localStorage for work order data survival across page refreshes
- **Builder**: @angular-devkit/build-angular:browser (webpack-based for Replit host compatibility)

## Project Structure
```
src/app/
  models/           - TypeScript interfaces (WorkCenterDocument, WorkOrderDocument, TimelineColumn)
  data/             - Hardcoded sample data (5 work centers, 8 work orders)
  services/
    work-order.service.ts  - CRUD operations, overlap validation, localStorage persistence
    timeline.service.ts    - Date-to-pixel math, column generation, zoom level handling, infinite scroll
  components/
    timeline/              - Main page layout (NAOLOGIC branding, title, timescale control, grid, Today button)
    work-order-bar/        - Work order bar with light pastel bg, status badge, hover 3-dot menu, tooltip
    work-order-panel/      - Right-side drawer panel with create/edit form, slide-in/out animation
```

## Key Features
- Day/Week/Month zoom levels via custom timescale dropdown (Day default)
- NAOLOGIC branding in top-left, "Work Orders" title
- Fixed left column with 5 work center names, horizontally scrollable timeline grid
- Dynamic date range based on current date (referenceDate = new Date())
- Day view: ±14 days, columns show "EEE d" + month sublabel; Week view: ±8 weeks; Month view: -3/+8 months
- Dynamic "current" pill indicator: "Today" (day view), "Current week" (week view), "Current month" (month view)
- "Today" vertical indicator line (purple, semi-transparent) behind bars
- "Today" button next to timescale control — smoothly scrolls viewport to center on today
- "Click to add dates" tooltip on hover over empty timeline areas
- Tooltip on bar hover showing name, status badge, and full date range
- Light pastel work order bars with colored status pill badges
- Three-dot menu (···) appears on bar hover with Edit/Delete dropdown
- Right-side drawer panel with slide-in/out animation, Cancel/Create buttons
- Form field order: Name → Status → End date → Start date
- Auto-focus on name input when panel opens
- Escape key closes panel and dropdowns
- Date format: MM.DD.YYYY
- Status options: Open (blue), In progress (blue/purple), Complete (green), Blocked (yellow/orange)
- Strict overlap validation per work center
- Infinite scroll: dynamically loads more date columns on scroll near edges
- localStorage persistence: work orders survive page refresh
- OnPush change detection on all components
- trackBy functions on all @for loops
- ARIA labels and semantic roles throughout (dialog, grid, tooltip, etc.)

## Work Centers
1. Genesis Hardware
2. Rodriques Electrics
3. Konsulting Inc
4. McMarrow Distribution
5. Spartan Manufacturing

## Sample Work Orders (8 orders, all 4 statuses, dates relative to present - Mar 2026)
- Centrix Ltd (Genesis Hardware) - Complete: Dec 15, 2025 → Mar 1, 2026
- Apex Fabrication (Genesis Hardware) - Open: Mar 15 → May 20, 2026
- Rodriques Electrics (Rodriques Electrics) - In progress: Jan 5 → Apr 20, 2026
- Konsulting Inc (Konsulting Inc) - In progress: Jan 20 → Apr 10, 2026
- Compleks Systems (Konsulting Inc) - In progress: Apr 10 → Jul 15, 2026
- Delta Components (McMarrow Distribution) - Complete: Nov 10, 2025 → Jan 25, 2026
- McMarrow Distribution (McMarrow Distribution) - Blocked: Feb 10 → May 25, 2026
- Vertex Assembly (Spartan Manufacturing) - Open: Feb 1 → Apr 15, 2026
- Multiple non-overlapping orders on wc-1, wc-3, wc-4; no overlaps within any work center

## Running
```bash
npm install
npm start   # or: npx ng serve --host 0.0.0.0 --port 5000 --disable-host-check
```

## Dependencies
- @angular/* 17.3.x
- @ng-bootstrap/ng-bootstrap ^16
- @ng-select/ng-select ^12
- date-fns ^4
- @popperjs/core ^2
