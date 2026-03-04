import { Component, EventEmitter, Input, Output, ElementRef, HostListener, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WorkOrderDocument, STATUS_BADGE_COLORS, BAR_COLORS, STATUS_OPTIONS } from '../../models/work-order.model';
import { format, parseISO } from 'date-fns';

@Component({
  selector: 'app-work-order-bar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './work-order-bar.component.html',
  styleUrls: ['./work-order-bar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WorkOrderBarComponent {
  @Input() order!: WorkOrderDocument;
  @Input() leftPx = 0;
  @Input() widthPx = 100;

  @Output() editOrder = new EventEmitter<WorkOrderDocument>();
  @Output() deleteOrder = new EventEmitter<string>();

  isHovered = false;
  menuOpen = false;
  barTooltipVisible = false;

  constructor(private elRef: ElementRef) {}

  get barBg(): string {
    return BAR_COLORS[this.order.data.status]?.bg || BAR_COLORS['open'].bg;
  }

  get barBorder(): string {
    return BAR_COLORS[this.order.data.status]?.border || BAR_COLORS['open'].border;
  }

  get badgeBg(): string {
    return STATUS_BADGE_COLORS[this.order.data.status]?.bg || '#E8EAFF';
  }

  get badgeText(): string {
    return STATUS_BADGE_COLORS[this.order.data.status]?.text || '#5B5FC7';
  }

  get statusLabel(): string {
    return STATUS_OPTIONS.find(s => s.value === this.order.data.status)?.label || 'Open';
  }

  get tooltipDateRange(): string {
    try {
      const start = format(parseISO(this.order.data.startDate), 'MMM d, yyyy');
      const end = format(parseISO(this.order.data.endDate), 'MMM d, yyyy');
      return `${start} – ${end}`;
    } catch {
      return `${this.order.data.startDate} – ${this.order.data.endDate}`;
    }
  }

  // @upgrade: add drag-and-drop resizing for bar start/end dates
  onBarClick(event: MouseEvent): void {
    event.stopPropagation();
  }

  onBarEnter(): void {
    this.isHovered = true;
    this.barTooltipVisible = true;
  }

  onBarLeave(): void {
    this.isHovered = false;
    this.menuOpen = false;
    this.barTooltipVisible = false;
  }

  toggleMenu(event: MouseEvent): void {
    event.stopPropagation();
    this.menuOpen = !this.menuOpen;
  }

  onEdit(event: MouseEvent): void {
    event.stopPropagation();
    this.menuOpen = false;
    this.editOrder.emit(this.order);
  }

  onDelete(event: MouseEvent): void {
    event.stopPropagation();
    this.menuOpen = false;
    this.deleteOrder.emit(this.order.docId);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (this.menuOpen && !this.elRef.nativeElement.contains(event.target)) {
      this.menuOpen = false;
    }
  }
}
