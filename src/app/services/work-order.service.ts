import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { WorkOrderDocument, WorkOrderStatus } from '../models/work-order.model';
import { WorkCenterDocument } from '../models/work-center.model';
import { WORK_CENTERS, WORK_ORDERS } from '../data/sample-data';
import { parseISO, isBefore } from 'date-fns';

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
