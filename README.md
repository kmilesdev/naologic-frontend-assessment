# Work Order Schedule Timeline

An interactive timeline component for a manufacturing ERP system built with Angular 17+. Allows planners to visualize, create, and edit work orders across multiple work centers.

## Quick Start

```bash
npm install
ng serve
```

Open [http://localhost:4200](http://localhost:4200) in your browser.

## Features

- **Timeline Grid** with Day/Week/Month zoom levels
- **Fixed left panel** showing work center names with horizontally scrollable timeline
- **Work order bars** with status badges, color-coded by status
- **Click-to-create**: Click empty timeline area to open create panel (end date auto-set to start + 7 days)
- **Three-dot actions menu** on each bar with Edit and Delete options
- **Overlap detection**: Prevents saving work orders that overlap on the same work center
- **Today indicator**: Vertical line marking the current date
- **Responsive**: Acceptable horizontal scroll on smaller screens

## Tech Stack

| Library | Purpose |
|---------|---------|
| Angular 17+ | Framework (standalone components) |
| TypeScript (strict) | Type safety |
| SCSS | Styling |
| Reactive Forms | Form management with validation |
| ng-select | Status dropdown in create/edit panel |
| @ng-bootstrap/ng-bootstrap | Date picker (ngb-datepicker) |
| date-fns | Date calculations and formatting |
| Circular Std | Font family (loaded from Naologic CDN) |

## Architecture

### Components

- **TimelineComponent** - Main view: toolbar with timescale selector, fixed left panel, scrollable grid with column headers and work order bars
- **WorkOrderBarComponent** - Individual bar rendered on the timeline with name, status badge, and three-dot actions menu
- **WorkOrderPanelComponent** - Slide-out panel from right for creating/editing work orders with reactive form validation

### Services

- **WorkOrderService** - Manages work center and work order data via BehaviorSubjects. Provides CRUD operations and overlap validation logic
- **TimelineService** - Handles all timeline math: date range calculation, column generation, date-to-pixel conversion, and pixel-to-date mapping for each zoom level

### Data

Sample data includes 6 work centers and 10 work orders demonstrating all 4 statuses (Open, In Progress, Complete, Blocked) with multiple non-overlapping orders on the same work center.

## Approach

1. **Timeline math**: Each zoom level (Day/Week/Month) has its own column width and date range. For Day view, 1 column = 1 day with a direct pixel mapping. For Week/Month views, calendar-aware positioning uses actual column boundaries to accurately place bars within week/month columns.

2. **Overlap detection**: Uses strict interval comparison - two orders overlap if one starts before the other ends AND vice versa. Back-to-back orders (where one ends on the same day another starts) are allowed.

3. **Single panel for create/edit**: A mode flag ('create' | 'edit') controls the panel behavior. Create mode resets the form with click-derived start date; edit mode populates from existing order data.

4. **Scroll sync**: Vertical scrolling between the fixed left panel and the scrollable right panel is synchronized via a scroll event listener.
