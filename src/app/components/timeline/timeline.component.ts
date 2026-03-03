import {
  Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewInit, ChangeDetectorRef,
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

  columns: TimelineColumn[] = [];
  monthHeaders: { label: string; span: number }[] = [];
  rangeStart!: Date;
  rangeEnd!: Date;
  totalWidth = 0;
  todayOffset = 0;
  columnWidth = 60;

  panelOpen = false;
  panelMode: 'create' | 'edit' = 'create';
  panelWorkCenterId = '';
  panelStartDate = '';
  panelEditOrder: WorkOrderDocument | null = null;

  private destroy$ = new Subject<void>();

  constructor(
    private workOrderService: WorkOrderService,
    private timelineService: TimelineService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    combineLatest([
      this.workOrderService.getWorkCenters(),
      this.workOrderService.getWorkOrders(),
    ])
      .pipe(takeUntil(this.destroy$))
      .subscribe(([centers, orders]) => {
        this.workCenters = centers;
        this.workOrders = orders;
      });

    this.buildTimeline();
  }

  ngAfterViewInit(): void {
    this.scrollToToday();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onZoomChange(): void {
    this.buildTimeline();
    setTimeout(() => this.scrollToToday(), 0);
  }

  private buildTimeline(): void {
    const range = this.timelineService.getDateRange(this.zoomLevel, new Date());
    this.rangeStart = range.start;
    this.rangeEnd = range.end;
    this.columnWidth = this.timelineService.getColumnWidth(this.zoomLevel);
    this.columns = this.timelineService.generateColumns(this.zoomLevel, this.rangeStart, this.rangeEnd);
    this.totalWidth = this.columns.length * this.columnWidth;
    this.todayOffset = this.timelineService.getTodayOffset(this.rangeStart, this.zoomLevel, this.columns);
    this.monthHeaders = this.timelineService.getMonthHeaders(this.zoomLevel, this.columns);
  }

  private scrollToToday(): void {
    if (!this.timelineGrid) return;
    const container = this.timelineGrid.nativeElement;
    const scrollLeft = this.todayOffset - container.clientWidth / 2;
    container.scrollLeft = Math.max(0, scrollLeft);
  }

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
  }
}
