# Work Order Schedule Timeline

## Overview
An Angular 17+ interactive timeline component for manufacturing ERP work order scheduling. Visualize, create, and edit work orders across multiple work centers with Day/Week/Month zoom levels.

## Architecture
- **Framework**: Angular 17+ with standalone components
- **Styling**: SCSS + Circular Std font (from Naologic CDN)
- **Forms**: Reactive Forms with FormGroup/FormControl/Validators
- **Dropdowns**: ng-select for status selection
- **Datepickers**: @ng-bootstrap/ng-bootstrap ngb-datepicker
- **Date math**: date-fns for all date calculations
- **Builder**: @angular-devkit/build-angular:browser (webpack-based for Replit host compatibility)

## Project Structure
```
src/app/
  models/           - TypeScript interfaces (WorkCenterDocument, WorkOrderDocument, TimelineColumn)
  data/             - Hardcoded sample data (6 work centers, 10 work orders)
  services/
    work-order.service.ts  - CRUD operations, overlap validation
    timeline.service.ts    - Date-to-pixel math, column generation, zoom level handling
  components/
    timeline/              - Main timeline grid (toolbar, left panel, scrollable grid)
    work-order-bar/        - Individual work order bar with three-dot menu
    work-order-panel/      - Slide-out create/edit panel with reactive form
```

## Key Features
- Day/Week/Month zoom levels via timescale dropdown
- Fixed left column with work center names, horizontally scrollable timeline grid
- Today indicator line
- Click empty timeline area to create work order (end = start + 7 days)
- Three-dot menu on each bar with Edit/Delete options
- Strict overlap validation per work center (blocks save with error message)
- Calendar-aware positioning for week/month views
- Status colors: Open (blue), In Progress (purple), Complete (green), Blocked (orange)

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
