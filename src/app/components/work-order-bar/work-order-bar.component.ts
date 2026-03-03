import { Component, EventEmitter, Input, Output, ElementRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WorkOrderDocument, STATUS_COLORS } from '../../models/work-order.model';

@Component({
  selector: 'app-work-order-bar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './work-order-bar.component.html',
  styleUrls: ['./work-order-bar.component.scss'],
})
export class WorkOrderBarComponent {
  @Input() order!: WorkOrderDocument;
  @Input() leftPx = 0;
  @Input() widthPx = 100;

  @Output() editOrder = new EventEmitter<WorkOrderDocument>();
  @Output() deleteOrder = new EventEmitter<string>();

  menuOpen = false;

  constructor(private elRef: ElementRef) {}

  get statusColor(): string {
    return STATUS_COLORS[this.order.data.status] || '#4A90D9';
  }

  get statusLabel(): string {
    switch (this.order.data.status) {
      case 'open': return 'Open';
      case 'in-progress': return 'In Progress';
      case 'complete': return 'Complete';
      case 'blocked': return 'Blocked';
      default: return '';
    }
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
