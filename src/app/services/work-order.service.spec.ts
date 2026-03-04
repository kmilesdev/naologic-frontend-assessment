import { TestBed } from '@angular/core/testing';
import { WorkOrderService } from './work-order.service';
import { WorkOrderDocument } from '../models/work-order.model';

describe('WorkOrderService', () => {
  let service: WorkOrderService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
    service = TestBed.inject(WorkOrderService);
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getWorkCenters', () => {
    it('should return at least 5 work centers', (done) => {
      service.getWorkCenters().subscribe(centers => {
        expect(centers.length).toBeGreaterThanOrEqual(5);
        done();
      });
    });

    it('should have work centers with required fields', (done) => {
      service.getWorkCenters().subscribe(centers => {
        centers.forEach(center => {
          expect(center.docId).toBeTruthy();
          expect(center.docType).toBe('workCenter');
          expect(center.data.name).toBeTruthy();
        });
        done();
      });
    });
  });

  describe('getWorkOrders', () => {
    it('should return at least 8 work orders on first load', (done) => {
      service.getWorkOrders().subscribe(orders => {
        expect(orders.length).toBeGreaterThanOrEqual(8);
        done();
      });
    });

    it('should have work orders with required fields', (done) => {
      service.getWorkOrders().subscribe(orders => {
        orders.forEach(order => {
          expect(order.docId).toBeTruthy();
          expect(order.docType).toBe('workOrder');
          expect(order.data.name).toBeTruthy();
          expect(order.data.workCenterId).toBeTruthy();
          expect(['open', 'in-progress', 'complete', 'blocked']).toContain(order.data.status);
          expect(order.data.startDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
          expect(order.data.endDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        });
        done();
      });
    });

    it('should include all 4 statuses in sample data', (done) => {
      service.getWorkOrders().subscribe(orders => {
        const statuses = new Set(orders.map(o => o.data.status));
        expect(statuses.has('open')).toBeTrue();
        expect(statuses.has('in-progress')).toBeTrue();
        expect(statuses.has('complete')).toBeTrue();
        expect(statuses.has('blocked')).toBeTrue();
        done();
      });
    });
  });

  describe('createWorkOrder', () => {
    it('should create a work order successfully', (done) => {
      const result = service.createWorkOrder({
        name: 'Test Order',
        workCenterId: 'wc-5',
        status: 'open',
        startDate: '2027-01-01',
        endDate: '2027-01-15',
      });

      expect(result.success).toBeTrue();
      expect(result.error).toBeUndefined();

      service.getWorkOrders().subscribe(orders => {
        const created = orders.find(o => o.data.name === 'Test Order');
        expect(created).toBeTruthy();
        expect(created!.data.status).toBe('open');
        expect(created!.data.startDate).toBe('2027-01-01');
        expect(created!.data.endDate).toBe('2027-01-15');
        done();
      });
    });

    it('should reject overlapping work orders on the same work center', () => {
      service.createWorkOrder({
        name: 'First Order',
        workCenterId: 'wc-5',
        status: 'open',
        startDate: '2027-06-01',
        endDate: '2027-06-15',
      });

      const result = service.createWorkOrder({
        name: 'Overlapping Order',
        workCenterId: 'wc-5',
        status: 'open',
        startDate: '2027-06-10',
        endDate: '2027-06-20',
      });

      expect(result.success).toBeFalse();
      expect(result.error).toContain('overlaps');
    });

    it('should allow back-to-back orders (end date = start date)', () => {
      service.createWorkOrder({
        name: 'First Order',
        workCenterId: 'wc-5',
        status: 'open',
        startDate: '2027-07-01',
        endDate: '2027-07-10',
      });

      const result = service.createWorkOrder({
        name: 'Back to Back Order',
        workCenterId: 'wc-5',
        status: 'open',
        startDate: '2027-07-10',
        endDate: '2027-07-20',
      });

      expect(result.success).toBeTrue();
    });

    it('should allow overlapping orders on different work centers', () => {
      service.createWorkOrder({
        name: 'Order on WC-5',
        workCenterId: 'wc-5',
        status: 'open',
        startDate: '2027-08-01',
        endDate: '2027-08-15',
      });

      const result = service.createWorkOrder({
        name: 'Order on WC-4',
        workCenterId: 'wc-4',
        status: 'open',
        startDate: '2027-08-05',
        endDate: '2027-08-20',
      });

      expect(result.success).toBeTrue();
    });

    it('should assign unique docIds', () => {
      service.createWorkOrder({
        name: 'Order A',
        workCenterId: 'wc-5',
        status: 'open',
        startDate: '2027-09-01',
        endDate: '2027-09-05',
      });

      service.createWorkOrder({
        name: 'Order B',
        workCenterId: 'wc-5',
        status: 'open',
        startDate: '2027-09-10',
        endDate: '2027-09-15',
      });

      let orders: WorkOrderDocument[] = [];
      service.getWorkOrders().subscribe(o => orders = o);

      const orderA = orders.find(o => o.data.name === 'Order A');
      const orderB = orders.find(o => o.data.name === 'Order B');
      expect(orderA!.docId).not.toBe(orderB!.docId);
    });
  });

  describe('updateWorkOrder', () => {
    it('should update an existing work order', (done) => {
      let orders: WorkOrderDocument[] = [];
      service.getWorkOrders().subscribe(o => orders = o);

      const target = orders[0];
      const result = service.updateWorkOrder(target.docId, {
        name: 'Updated Name',
        workCenterId: target.data.workCenterId,
        status: 'complete',
        startDate: target.data.startDate,
        endDate: target.data.endDate,
      });

      expect(result.success).toBeTrue();

      service.getWorkOrders().subscribe(updated => {
        const found = updated.find(o => o.docId === target.docId);
        expect(found!.data.name).toBe('Updated Name');
        expect(found!.data.status).toBe('complete');
        done();
      });
    });

    it('should not conflict with itself during edit', () => {
      let orders: WorkOrderDocument[] = [];
      service.getWorkOrders().subscribe(o => orders = o);

      const target = orders[0];
      const result = service.updateWorkOrder(target.docId, {
        name: 'Same Dates Different Name',
        workCenterId: target.data.workCenterId,
        status: target.data.status,
        startDate: target.data.startDate,
        endDate: target.data.endDate,
      });

      expect(result.success).toBeTrue();
    });

    it('should reject update that overlaps with another order', () => {
      service.createWorkOrder({
        name: 'Anchor Order',
        workCenterId: 'wc-5',
        status: 'open',
        startDate: '2027-10-01',
        endDate: '2027-10-15',
      });

      const createResult = service.createWorkOrder({
        name: 'Movable Order',
        workCenterId: 'wc-5',
        status: 'open',
        startDate: '2027-10-20',
        endDate: '2027-10-30',
      });
      expect(createResult.success).toBeTrue();

      let orders: WorkOrderDocument[] = [];
      service.getWorkOrders().subscribe(o => orders = o);
      const movable = orders.find(o => o.data.name === 'Movable Order')!;

      const result = service.updateWorkOrder(movable.docId, {
        name: 'Movable Order',
        workCenterId: 'wc-5',
        status: 'open',
        startDate: '2027-10-05',
        endDate: '2027-10-25',
      });

      expect(result.success).toBeFalse();
      expect(result.error).toContain('overlaps');
    });
  });

  describe('deleteWorkOrder', () => {
    it('should remove a work order', (done) => {
      let orders: WorkOrderDocument[] = [];
      service.getWorkOrders().subscribe(o => orders = o);

      const countBefore = orders.length;
      const target = orders[0];
      service.deleteWorkOrder(target.docId);

      service.getWorkOrders().subscribe(updated => {
        expect(updated.length).toBe(countBefore - 1);
        expect(updated.find(o => o.docId === target.docId)).toBeUndefined();
        done();
      });
    });
  });

  describe('localStorage persistence', () => {
    it('should persist work orders to localStorage after create', () => {
      service.createWorkOrder({
        name: 'Persisted Order',
        workCenterId: 'wc-5',
        status: 'open',
        startDate: '2027-11-01',
        endDate: '2027-11-10',
      });

      const stored = localStorage.getItem('naologic_work_orders');
      expect(stored).toBeTruthy();
      const parsed = JSON.parse(stored!);
      expect(parsed.find((o: any) => o.data.name === 'Persisted Order')).toBeTruthy();
    });

    it('should persist work orders to localStorage after delete', () => {
      let orders: WorkOrderDocument[] = [];
      service.getWorkOrders().subscribe(o => orders = o);
      const target = orders[0];

      service.deleteWorkOrder(target.docId);

      const stored = localStorage.getItem('naologic_work_orders');
      const parsed = JSON.parse(stored!);
      expect(parsed.find((o: any) => o.docId === target.docId)).toBeUndefined();
    });

    it('should persist empty array when all orders are deleted', () => {
      let orders: WorkOrderDocument[] = [];
      service.getWorkOrders().subscribe(o => orders = o);

      const allIds = orders.map(o => o.docId);
      allIds.forEach(id => service.deleteWorkOrder(id));

      const stored = localStorage.getItem('naologic_work_orders');
      expect(stored).toBe('[]');
    });

    it('should load from localStorage on service creation', () => {
      const testOrders = [{
        docId: 'test-1',
        docType: 'workOrder' as const,
        data: {
          name: 'From Storage',
          workCenterId: 'wc-1',
          status: 'open' as const,
          startDate: '2027-12-01',
          endDate: '2027-12-10',
        },
      }];
      localStorage.setItem('naologic_work_orders', JSON.stringify(testOrders));

      const freshService = new WorkOrderService();
      let orders: WorkOrderDocument[] = [];
      freshService.getWorkOrders().subscribe(o => orders = o);

      expect(orders.length).toBe(1);
      expect(orders[0].data.name).toBe('From Storage');
    });

    it('should fallback to sample data on corrupted localStorage', () => {
      localStorage.setItem('naologic_work_orders', 'not-valid-json');

      const freshService = new WorkOrderService();
      let orders: WorkOrderDocument[] = [];
      freshService.getWorkOrders().subscribe(o => orders = o);

      expect(orders.length).toBeGreaterThanOrEqual(8);
    });
  });

  describe('edge cases', () => {
    it('should handle update on nonexistent docId without error', () => {
      const result = service.updateWorkOrder('nonexistent-id', {
        name: 'Ghost',
        workCenterId: 'wc-5',
        status: 'open',
        startDate: '2027-12-01',
        endDate: '2027-12-10',
      });
      expect(result.success).toBeTrue();
    });

    it('should handle delete on nonexistent docId without error', () => {
      let orders: WorkOrderDocument[] = [];
      service.getWorkOrders().subscribe(o => orders = o);
      const countBefore = orders.length;

      service.deleteWorkOrder('nonexistent-id');

      service.getWorkOrders().subscribe(o => orders = o);
      expect(orders.length).toBe(countBefore);
    });

    it('should detect overlap when new range fully contains existing', () => {
      expect(service.checkOverlap('wc-1', '2025-11-01', '2026-04-01')).toBeTrue();
    });

    it('should detect overlap when new range is fully inside existing', () => {
      expect(service.checkOverlap('wc-1', '2026-01-01', '2026-02-01')).toBeTrue();
    });

    it('should persist after update', () => {
      let orders: WorkOrderDocument[] = [];
      service.getWorkOrders().subscribe(o => orders = o);
      const target = orders[0];

      service.updateWorkOrder(target.docId, {
        name: 'Updated for Persist Test',
        workCenterId: target.data.workCenterId,
        status: target.data.status,
        startDate: target.data.startDate,
        endDate: target.data.endDate,
      });

      const stored = localStorage.getItem('naologic_work_orders');
      const parsed = JSON.parse(stored!);
      expect(parsed.find((o: any) => o.data.name === 'Updated for Persist Test')).toBeTruthy();
    });
  });

  describe('checkOverlap', () => {
    it('should detect full overlap', () => {
      expect(service.checkOverlap('wc-1', '2025-12-20', '2026-02-15')).toBeTrue();
    });

    it('should detect partial overlap at start', () => {
      expect(service.checkOverlap('wc-1', '2025-12-01', '2025-12-20')).toBeTrue();
    });

    it('should detect partial overlap at end', () => {
      expect(service.checkOverlap('wc-1', '2026-02-20', '2026-03-10')).toBeTrue();
    });

    it('should not detect overlap for non-overlapping dates', () => {
      expect(service.checkOverlap('wc-1', '2027-01-01', '2027-02-01')).toBeFalse();
    });

    it('should exclude specified order from overlap check', () => {
      expect(service.checkOverlap('wc-1', '2025-12-20', '2026-02-15', 'wo-1')).toBeFalse();
    });

    it('should not find overlap on empty work center', () => {
      expect(service.checkOverlap('nonexistent-wc', '2026-01-01', '2026-12-31')).toBeFalse();
    });
  });
});
