import {
  Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewInit,
  ChangeDetectorRef, ChangeDetectionStrategy, HostListener,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil, combineLatest } from 'rxjs';
import { format } from 'date-fns';

import { WorkOrderService } from '../../services/work-order.service';
import { TimelineService } from '../../services/timeline.service';
import { WorkCenterDocument } from '../../models/work-center.model';
import { WorkOrderDocument } from '../../models/work-order.model';
import { ZoomLevel, TimelineColumn } from '../../models/timeline.model';

import { WorkOrderBarComponent } from '../work-order-bar/work-order-bar.component';
import { WorkOrderPanelComponent } from '../work-order-panel/work-order-panel.component';

@Component({
  selector: 'app-timeline',
  standalone: true,
  imports: [CommonModule, FormsModule, WorkOrderBarComponent, WorkOrderPanelComponent],
  templateUrl: './timeline.component.html',
  styleUrls: ['./timeline.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TimelineComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('timelineGrid') timelineGrid!: ElementRef<HTMLDivElement>;
  @ViewChild('leftRows') leftRows!: ElementRef<HTMLDivElement>;

  workCenters: WorkCenterDocument[] = [];
  workOrders: WorkOrderDocument[] = [];

  zoomLevel: ZoomLevel = 'day';
  zoomOptions: { value: ZoomLevel; label: string }[] = [
    { value: 'day', label: 'Day' },
    { value: 'week', label: 'Week' },
    { value: 'month', label: 'Month' },
  ];
  zoomDropdownOpen = false;

  columns: TimelineColumn[] = [];
  rangeStart!: Date;
  rangeEnd!: Date;
  totalWidth = 0;
  columnWidth = 140;
  currentMonthIndex = -1;
  todayOffsetPx = 0;
  referenceDate = new Date();

  panelOpen = false;
  panelMode: 'create' | 'edit' = 'create';
  panelWorkCenterId = '';
  panelStartDate = '';
  panelEditOrder: WorkOrderDocument | null = null;

  tooltipVisible = false;
  tooltipX = 0;
  tooltipY = 0;

  hoveredRowId = '';
  activeMenuRowId = '';

  private destroy$ = new Subject<void>();
  private scrollThrottleTimer: any = null;

  constructor(
    private workOrderService: WorkOrderService,
    private timelineService: TimelineService,
    private cdr: ChangeDetectorRef,
  ) {}

  @ViewChild('workOrderPanel') workOrderPanel?: WorkOrderPanelComponent;

  @HostListener('document:keydown.escape')
  onEscapeKey(): void {
    if (this.panelOpen && this.workOrderPanel) {
      this.workOrderPanel.close();
      return;
    }
    if (this.zoomDropdownOpen) {
      this.zoomDropdownOpen = false;
      this.cdr.markForCheck();
    }
  }

  ngOnInit(): void {
    combineLatest([
      this.workOrderService.getWorkCenters(),
      this.workOrderService.getWorkOrders(),
    ])
      .pipe(takeUntil(this.destroy$))
      .subscribe(([centers, orders]) => {
        this.workCenters = centers;
        this.workOrders = orders;
        this.cdr.markForCheck();
      });

    this.buildTimeline();
  }

  ngAfterViewInit(): void {
    this.scrollToCurrentMonth();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get selectedZoomLabel(): string {
    return this.zoomOptions.find(o => o.value === this.zoomLevel)?.label || 'Day';
  }

  get currentPillLabel(): string {
    switch (this.zoomLevel) {
      case 'day': return 'Today';
      case 'week': return 'Current week';
      case 'month': return 'Current month';
      default: return 'Current';
    }
  }

  toggleZoomDropdown(): void {
    this.zoomDropdownOpen = !this.zoomDropdownOpen;
  }

  selectZoom(zoom: ZoomLevel): void {
    this.zoomLevel = zoom;
    this.zoomDropdownOpen = false;
    this.buildTimeline();
    setTimeout(() => this.scrollToCurrentMonth(), 0);
  }

  closeZoomDropdown(): void {
    this.zoomDropdownOpen = false;
  }

  scrollToToday(): void {
    if (!this.timelineGrid) return;
    const container = this.timelineGrid.nativeElement;
    const scrollLeft = this.todayOffsetPx - container.clientWidth / 2;
    container.scrollTo({ left: Math.max(0, scrollLeft), behavior: 'smooth' });
  }

  private buildTimeline(): void {
    const range = this.timelineService.getDateRange(this.zoomLevel, this.referenceDate);
    this.rangeStart = range.start;
    this.rangeEnd = range.end;
    this.columnWidth = this.timelineService.getColumnWidth(this.zoomLevel);
    this.columns = this.timelineService.generateColumns(this.zoomLevel, this.rangeStart, this.rangeEnd, this.referenceDate);
    this.totalWidth = this.columns.length * this.columnWidth;
    this.currentMonthIndex = this.timelineService.getCurrentColumnIndex(this.columns);
    this.todayOffsetPx = this.timelineService.dateToPixelOffset(new Date(), this.rangeStart, this.zoomLevel, this.columns);
  }

  private scrollToCurrentMonth(): void {
    if (!this.timelineGrid) return;
    const container = this.timelineGrid.nativeElement;
    if (this.currentMonthIndex >= 0) {
      const scrollLeft = this.currentMonthIndex * this.columnWidth - container.clientWidth / 3;
      container.scrollLeft = Math.max(0, scrollLeft);
    }
  }

  // @upgrade: memoize or use a Map for O(1) lookup instead of filtering on every CD cycle
  getOrdersForCenter(centerId: string): WorkOrderDocument[] {
    return this.workOrders.filter(o => o.data.workCenterId === centerId);
  }

  getBarLeft(order: WorkOrderDocument): number {
    return this.timelineService.dateToPixelOffset(order.data.startDate, this.rangeStart, this.zoomLevel, this.columns);
  }

  getBarWidth(order: WorkOrderDocument): number {
    return this.timelineService.getBarWidth(order.data.startDate, order.data.endDate, this.zoomLevel, this.rangeStart, this.columns);
  }

  onTimelineClick(event: MouseEvent, workCenterId: string): void {
    const target = event.target as HTMLElement;
    if (target.closest('app-work-order-bar') || target.closest('.work-order-bar')) {
      return;
    }

    const gridEl = this.timelineGrid.nativeElement;
    const rect = gridEl.getBoundingClientRect();
    const scrollLeft = gridEl.scrollLeft;
    const clickX = event.clientX - rect.left + scrollLeft;

    const clickDate = this.timelineService.pixelOffsetToDate(clickX, this.rangeStart, this.zoomLevel, this.columns);

    this.panelMode = 'create';
    this.panelWorkCenterId = workCenterId;
    this.panelStartDate = format(clickDate, 'yyyy-MM-dd');
    this.panelEditOrder = null;
    this.panelOpen = true;
    this.tooltipVisible = false;
  }

  onRowMouseMove(event: MouseEvent, workCenterId: string): void {
    const target = event.target as HTMLElement;
    if (target.closest('app-work-order-bar') || target.closest('.work-order-bar')) {
      this.tooltipVisible = false;
      return;
    }
    this.hoveredRowId = workCenterId;
    const gridEl = this.timelineGrid.nativeElement;
    const rect = gridEl.getBoundingClientRect();
    this.tooltipX = event.clientX - rect.left + gridEl.scrollLeft;
    this.tooltipY = event.clientY - rect.top + gridEl.scrollTop;
    this.tooltipVisible = true;
  }

  onRowMouseLeave(): void {
    this.tooltipVisible = false;
    this.hoveredRowId = '';
  }

  onEditOrder(order: WorkOrderDocument): void {
    this.panelMode = 'edit';
    this.panelWorkCenterId = order.data.workCenterId;
    this.panelStartDate = order.data.startDate;
    this.panelEditOrder = order;
    this.panelOpen = true;
  }

  onDeleteOrder(docId: string): void {
    this.workOrderService.deleteWorkOrder(docId);
  }

  onBarMenuToggled(isOpen: boolean, centerId: string): void {
    this.activeMenuRowId = isOpen ? centerId : '';
  }

  onPanelClosed(): void {
    this.panelOpen = false;
    this.panelEditOrder = null;
  }

  onPanelSaved(): void {
    this.panelOpen = false;
    this.panelEditOrder = null;
  }

  trackByColumn(_: number, col: TimelineColumn): string {
    return col.date.toISOString();
  }

  trackByCenter(_: number, center: WorkCenterDocument): string {
    return center.docId;
  }

  trackByOrder(_: number, order: WorkOrderDocument): string {
    return order.docId;
  }

  onGridScroll(): void {
    if (this.leftRows && this.timelineGrid) {
      this.leftRows.nativeElement.scrollTop = this.timelineGrid.nativeElement.scrollTop;
    }
    this.checkInfiniteScroll();
  }

  private checkInfiniteScroll(): void {
    if (this.scrollThrottleTimer) return;
    this.scrollThrottleTimer = setTimeout(() => {
      this.scrollThrottleTimer = null;
      if (!this.timelineGrid) return;
      const el = this.timelineGrid.nativeElement;
      const threshold = 200;

      if (el.scrollLeft < threshold) {
        this.prependColumns();
      }
      if (el.scrollLeft + el.clientWidth > el.scrollWidth - threshold) {
        this.appendColumns();
      }
    }, 100);
  }

  private prependColumns(): void {
    const count = this.zoomLevel === 'day' ? 14 : this.zoomLevel === 'week' ? 4 : 3;
    const newStart = this.timelineService.extendRangeBack(this.rangeStart, this.zoomLevel, count);
    const exclusiveEnd = this.timelineService.extendRangeBack(this.rangeStart, this.zoomLevel, 1);
    const newCols = this.timelineService.generateColumns(this.zoomLevel, newStart, exclusiveEnd, this.referenceDate);

    if (newCols.length === 0) return;

    const existingKeys = new Set(this.columns.map(c => c.date.toISOString()));
    const uniqueCols = newCols.filter(c => !existingKeys.has(c.date.toISOString()));
    if (uniqueCols.length === 0) return;

    const addedWidth = uniqueCols.length * this.columnWidth;
    this.columns = [...uniqueCols, ...this.columns];
    this.rangeStart = newStart;
    this.totalWidth = this.columns.length * this.columnWidth;
    this.todayOffsetPx = this.timelineService.dateToPixelOffset(new Date(), this.rangeStart, this.zoomLevel, this.columns);
    this.cdr.markForCheck();

    requestAnimationFrame(() => {
      if (this.timelineGrid) {
        this.timelineGrid.nativeElement.scrollLeft += addedWidth;
      }
    });
  }

  private appendColumns(): void {
    const count = this.zoomLevel === 'day' ? 14 : this.zoomLevel === 'week' ? 4 : 3;
    const exclusiveStart = this.timelineService.extendRangeForward(this.rangeEnd, this.zoomLevel, 1);
    const newEnd = this.timelineService.extendRangeForward(this.rangeEnd, this.zoomLevel, count);
    const newCols = this.timelineService.generateColumns(this.zoomLevel, exclusiveStart, newEnd, this.referenceDate);

    if (newCols.length === 0) return;

    const existingKeys = new Set(this.columns.map(c => c.date.toISOString()));
    const uniqueCols = newCols.filter(c => !existingKeys.has(c.date.toISOString()));
    if (uniqueCols.length === 0) return;

    this.columns = [...this.columns, ...uniqueCols];
    this.rangeEnd = newEnd;
    this.totalWidth = this.columns.length * this.columnWidth;
    this.cdr.markForCheck();
  }

  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.timescale-control')) {
      this.zoomDropdownOpen = false;
    }
  }
}
