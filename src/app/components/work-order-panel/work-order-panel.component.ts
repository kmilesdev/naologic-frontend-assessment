import {
  Component, EventEmitter, Input, OnChanges, Output, SimpleChanges,
  ChangeDetectionStrategy, ChangeDetectorRef, ElementRef, ViewChild, AfterViewInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormControl, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';
import { NgbDatepickerModule, NgbDateStruct, NgbDateParserFormatter } from '@ng-bootstrap/ng-bootstrap';
import { WorkOrderDocument, WorkOrderStatus, STATUS_OPTIONS, STATUS_BADGE_COLORS } from '../../models/work-order.model';
import { WorkOrderService } from '../../services/work-order.service';
import { format, parseISO, addDays } from 'date-fns';

@Component({
  selector: 'app-work-order-panel',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NgSelectModule, NgbDatepickerModule],
  templateUrl: './work-order-panel.component.html',
  styleUrls: ['./work-order-panel.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WorkOrderPanelComponent implements OnChanges {
  @Input() isOpen = false;
  @Input() mode: 'create' | 'edit' = 'create';
  @Input() workCenterId = '';
  @Input() initialStartDate = '';
  @Input() editOrder: WorkOrderDocument | null = null;

  @Output() closed = new EventEmitter<void>();
  @Output() saved = new EventEmitter<void>();

  @ViewChild('nameInput') nameInput!: ElementRef<HTMLInputElement>;

  statusOptions = STATUS_OPTIONS;
  overlapError = '';
  statusBadgeColors = STATUS_BADGE_COLORS;
  isClosing = false;

  form = new FormGroup({
    name: new FormControl('', [Validators.required]),
    status: new FormControl<WorkOrderStatus>('open', [Validators.required]),
    endDate: new FormControl<NgbDateStruct | null>(null, [Validators.required]),
    startDate: new FormControl<NgbDateStruct | null>(null, [Validators.required]),
  }, { validators: this.dateRangeValidator });

  constructor(
    private workOrderService: WorkOrderService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isOpen'] && this.isOpen) {
      this.overlapError = '';
      this.isClosing = false;
      if (this.mode === 'create') {
        const start = this.initialStartDate
          ? parseISO(this.initialStartDate)
          : new Date();
        const end = addDays(start, 7);

        this.form.reset({
          name: '',
          status: 'open',
          startDate: this.dateToNgb(start),
          endDate: this.dateToNgb(end),
        });
      } else if (this.mode === 'edit' && this.editOrder) {
        const d = this.editOrder.data;
        this.form.patchValue({
          name: d.name,
          status: d.status,
          startDate: this.dateToNgb(parseISO(d.startDate)),
          endDate: this.dateToNgb(parseISO(d.endDate)),
        });
      }

      setTimeout(() => {
        if (this.nameInput) {
          this.nameInput.nativeElement.focus();
        }
      }, 250);
    }
  }

  dateRangeValidator(group: AbstractControl): ValidationErrors | null {
    const start = group.get('startDate')?.value as NgbDateStruct | null;
    const end = group.get('endDate')?.value as NgbDateStruct | null;
    if (!start || !end) return null;
    const s = new Date(start.year, start.month - 1, start.day);
    const e = new Date(end.year, end.month - 1, end.day);
    return e > s ? null : { dateRange: true };
  }

  getStatusBadgeBg(status: WorkOrderStatus): string {
    return STATUS_BADGE_COLORS[status]?.bg || '#E8EAFF';
  }

  getStatusBadgeText(status: WorkOrderStatus): string {
    return STATUS_BADGE_COLORS[status]?.text || '#5B5FC7';
  }

  getSelectedStatusLabel(): string {
    const val = this.form.get('status')?.value;
    return STATUS_OPTIONS.find(s => s.value === val)?.label || 'Open';
  }

  formatNgbDate(d: NgbDateStruct | null): string {
    if (!d) return '';
    const month = String(d.month).padStart(2, '0');
    const day = String(d.day).padStart(2, '0');
    return `${month}.${day}.${d.year}`;
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const val = this.form.value;
    const startDate = this.ngbToIso(val.startDate!);
    const endDate = this.ngbToIso(val.endDate!);

    const data = {
      name: val.name!,
      workCenterId: this.workCenterId,
      status: val.status!,
      startDate,
      endDate,
    };

    let result: { success: boolean; error?: string };

    if (this.mode === 'create') {
      result = this.workOrderService.createWorkOrder(data);
    } else {
      result = this.workOrderService.updateWorkOrder(this.editOrder!.docId, data);
    }

    if (!result.success) {
      this.overlapError = '';
      this.cdr.detectChanges();
      this.overlapError = result.error || 'Overlap detected.';
      this.cdr.markForCheck();
      return;
    }

    this.overlapError = '';
    this.closeWithCallback(() => this.saved.emit());
  }

  close(): void {
    this.closeWithCallback(() => this.closed.emit());
  }

  private closeWithCallback(callback: () => void): void {
    this.isClosing = true;
    this.cdr.markForCheck();
    setTimeout(() => {
      this.isOpen = false;
      this.isClosing = false;
      this.overlapError = '';
      callback();
    }, 200);
  }

  private dateToNgb(d: Date): NgbDateStruct {
    return { year: d.getFullYear(), month: d.getMonth() + 1, day: d.getDate() };
  }

  private ngbToIso(d: NgbDateStruct): string {
    return format(new Date(d.year, d.month - 1, d.day), 'yyyy-MM-dd');
  }
}
