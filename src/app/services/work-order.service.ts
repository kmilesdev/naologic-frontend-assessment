import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { WorkOrderDocument, WorkOrderStatus } from '../models/work-order.model';
import { WorkCenterDocument } from '../models/work-center.model';
import { WORK_CENTERS, WORK_ORDERS } from '../data/sample-data';
import { parseISO, isBefore } from 'date-fns';

const STORAGE_KEY = 'naologic_work_orders';

@Injectable({ providedIn: 'root' })
export class WorkOrderService {
  private workCenters$ = new BehaviorSubject<WorkCenterDocument[]>([...WORK_CENTERS]);
  private workOrders$ = new BehaviorSubject<WorkOrderDocument[]>(this.loadFromStorage());
  private nextId = this.computeNextId();

  getWorkCenters() {
    return this.workCenters$.asObservable();
  }

  getWorkOrders() {
    return this.workOrders$.asObservable();
  }

  private loadFromStorage(): WorkOrderDocument[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
    } catch {
      // @upgrade: add structured logging for parse failures
    }
    return [...WORK_ORDERS];
  }

  private persistToStorage(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.workOrders$.value));
    } catch {
      // @upgrade: notify user when storage quota exceeded
    }
  }

  private computeNextId(): number {
    const maxId = this.workOrders$.value.reduce((max, wo) => {
      const num = parseInt(wo.docId.replace('wo-', ''), 10);
      return isNaN(num) ? max : Math.max(max, num);
    }, 0);
    return maxId + 1;
  }

  // @upgrade: replace BehaviorSubject with NgRx or signal-based state management for larger datasets
  checkOverlap(
    workCenterId: string,
    startDate: string,
    endDate: string,
    excludeOrderId?: string
  ): boolean {
    const orders = this.workOrders$.value.filter(
      wo => wo.data.workCenterId === workCenterId && wo.docId !== excludeOrderId
    );
    const newStart = parseISO(startDate);
    const newEnd = parseISO(endDate);

    return orders.some(order => {
      const orderStart = parseISO(order.data.startDate);
      const orderEnd = parseISO(order.data.endDate);
      return isBefore(newStart, orderEnd) && isBefore(orderStart, newEnd);
    });
  }

  createWorkOrder(data: {
    name: string;
    workCenterId: string;
    status: WorkOrderStatus;
    startDate: string;
    endDate: string;
  }): { success: boolean; error?: string } {
    if (this.checkOverlap(data.workCenterId, data.startDate, data.endDate)) {
      return { success: false, error: 'This work order overlaps with an existing order on the same work center.' };
    }

    const newOrder: WorkOrderDocument = {
      docId: `wo-${this.nextId++}`,
      docType: 'workOrder',
      data: { ...data },
    };

    this.workOrders$.next([...this.workOrders$.value, newOrder]);
    this.persistToStorage();
    return { success: true };
  }

  updateWorkOrder(
    docId: string,
    data: {
      name: string;
      workCenterId: string;
      status: WorkOrderStatus;
      startDate: string;
      endDate: string;
    }
  ): { success: boolean; error?: string } {
    if (this.checkOverlap(data.workCenterId, data.startDate, data.endDate, docId)) {
      return { success: false, error: 'This work order overlaps with an existing order on the same work center.' };
    }

    const orders = this.workOrders$.value.map(wo =>
      wo.docId === docId ? { ...wo, data: { ...data } } : wo
    );
    this.workOrders$.next(orders);
    this.persistToStorage();
    return { success: true };
  }

  deleteWorkOrder(docId: string): void {
    const orders = this.workOrders$.value.filter(wo => wo.docId !== docId);
    this.workOrders$.next(orders);
    this.persistToStorage();
  }
}
