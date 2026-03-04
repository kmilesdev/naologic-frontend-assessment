import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { WorkOrderDocument, WorkOrderStatus } from '../models/work-order.model';
import { WorkCenterDocument } from '../models/work-center.model';
import { WORK_CENTERS, WORK_ORDERS } from '../data/sample-data';
import { parseISO, isBefore } from 'date-fns';

/**
 * In-memory data store for work centers and work orders.
 * Uses BehaviorSubjects so components receive updates reactively.
 * All mutations go through service methods that enforce overlap validation.
 */
@Injectable({ providedIn: 'root' })
export class WorkOrderService {
  private workCenters$ = new BehaviorSubject<WorkCenterDocument[]>([...WORK_CENTERS]);
  private workOrders$ = new BehaviorSubject<WorkOrderDocument[]>([...WORK_ORDERS]);
  private nextId = 100;

  getWorkCenters() {
    return this.workCenters$.asObservable();
  }

  getWorkOrders() {
    return this.workOrders$.asObservable();
  }

  /**
   * Strict interval overlap check: two orders overlap when
   * newStart < existingEnd AND existingStart < newEnd.
   *
   * This means back-to-back orders (one ending the same day another starts)
   * are NOT considered overlapping, since isBefore is strict (not <=).
   *
   * @param excludeOrderId - Omit this order from the check (used during edit
   *   so an order doesn't conflict with itself)
   */
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
    return { success: true };
  }

  /** Update an existing order. Overlap check excludes the order being edited. */
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
    return { success: true };
  }

  deleteWorkOrder(docId: string): void {
    const orders = this.workOrders$.value.filter(wo => wo.docId !== docId);
    this.workOrders$.next(orders);
  }
}
