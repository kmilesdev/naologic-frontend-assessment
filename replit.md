# Work Order Schedule Timeline

## Overview
An Angular 17+ interactive timeline application for Naologic's manufacturing ERP tech test. Implements a "Work Orders" schedule/timeline screen with fixed left Work Center column and horizontally scrollable timeline area. UI matches 8 provided design screenshots.

## Architecture
- **Framework**: Angular 17+ with standalone components
- **Styling**: SCSS + Circular Std font (from Naologic CDN)
- **Forms**: Reactive Forms with FormGroup/FormControl/Validators
- **Status Dropdown**: ng-select for status field in drawer panel
- **Datepickers**: @ng-bootstrap/ng-bootstrap ngb-datepicker for date fields
- **Timescale Dropdown**: Custom dropdown component (not ng-select) for pixel-perfect match
- **Date math**: date-fns for all date calculations
- **Builder**: @angular-devkit/build-angular:browser (webpack-based for Replit host compatibility)

## Project Structure
```
src/app/
  models/           - TypeScript interfaces (WorkCenterDocument, WorkOrderDocument, TimelineColumn)
  data/             - Hardcoded sample data (5 work centers, 5 work orders)
  services/
    work-order.service.ts  - CRUD operations, overlap validation
    timeline.service.ts    - Date-to-pixel math, column generation, zoom level handling
  components/
    timeline/              - Main page layout (NAOLOGIC branding, title, timescale control, grid)
    work-order-bar/        - Work order bar with light pastel bg, status badge, hover 3-dot menu
    work-order-panel/      - Right-side drawer panel with create/edit form
```

## Key Features
- Hour/Day/Week/Month zoom levels via custom timescale dropdown (Month default)
- NAOLOGIC branding in top-left, "Work Orders" title
- Fixed left column with 5 work center names, horizontally scrollable timeline grid
- Dynamic date range based on current date (referenceDate = new Date())
- "Current month" yellow pill indicator in timeline header (positioned below month label)
- "Today" vertical indicator line (purple, semi-transparent) runs through entire grid at current date position (z-index behind bars)
- "Click to add dates" tooltip on hover over empty timeline areas
- Light pastel work order bars with colored status pill badges
- Three-dot menu (···) appears on bar hover with Edit/Delete dropdown
- Right-side drawer panel (no backdrop) with Cancel/Create buttons at top-right
- Form field order: Name → Status → End date → Start date
- Date format: MM.DD.YYYY
- Status options: Open, In progress, Complete, Blocked
- Strict overlap validation per work center

## Work Centers
1. Genesis Hardware
2. Rodriques Electrics
3. Konsulting Inc
4. McMarrow Distribution
5. Spartan Manufacturing

## Sample Work Orders (dates relative to present - Mar 2026)
- Centrix Ltd (Genesis Hardware) - Complete: Dec 15, 2025 → Mar 1, 2026
- Rodriques Electrics (Rodriques Electrics) - In progress: Jan 5 → Apr 20, 2026
- Konsulting Inc (Konsulting Inc) - In progress: Jan 20 → Apr 10, 2026
- Compleks Systems (Konsulting Inc) - In progress: Apr 10 → Jul 15, 2026
- McMarrow Distribution (McMarrow Distribution) - Blocked: Feb 10 → May 25, 2026
- No overlaps within any work center

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
