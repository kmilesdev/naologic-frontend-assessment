import { WorkCenterDocument } from '../models/work-center.model';
import { WorkOrderDocument } from '../models/work-order.model';
import { format, addDays } from 'date-fns';

const today = new Date();
const fmt = (d: Date): string => format(d, 'yyyy-MM-dd');

export const WORK_CENTERS: WorkCenterDocument[] = [
  { docId: 'wc-1', docType: 'workCenter', data: { name: 'Extrusion Line A' } },
  { docId: 'wc-2', docType: 'workCenter', data: { name: 'CNC Machine 1' } },
  { docId: 'wc-3', docType: 'workCenter', data: { name: 'Assembly Station' } },
  { docId: 'wc-4', docType: 'workCenter', data: { name: 'Quality Control' } },
  { docId: 'wc-5', docType: 'workCenter', data: { name: 'Packaging Line' } },
  { docId: 'wc-6', docType: 'workCenter', data: { name: 'Welding Bay B' } },
];

export const WORK_ORDERS: WorkOrderDocument[] = [
  {
    docId: 'wo-1',
    docType: 'workOrder',
    data: {
      name: 'Aluminum Profile Run',
      workCenterId: 'wc-1',
      status: 'complete',
      startDate: fmt(addDays(today, -10)),
      endDate: fmt(addDays(today, -3)),
    },
  },
  {
    docId: 'wo-2',
    docType: 'workOrder',
    data: {
      name: 'Steel Extrusion Batch',
      workCenterId: 'wc-1',
      status: 'in-progress',
      startDate: fmt(addDays(today, -1)),
      endDate: fmt(addDays(today, 6)),
    },
  },
  {
    docId: 'wo-3',
    docType: 'workOrder',
    data: {
      name: 'Gear Housing Machining',
      workCenterId: 'wc-2',
      status: 'open',
      startDate: fmt(addDays(today, 2)),
      endDate: fmt(addDays(today, 9)),
    },
  },
  {
    docId: 'wo-4',
    docType: 'workOrder',
    data: {
      name: 'Motor Assembly A',
      workCenterId: 'wc-3',
      status: 'in-progress',
      startDate: fmt(addDays(today, -5)),
      endDate: fmt(addDays(today, 2)),
    },
  },
  {
    docId: 'wo-5',
    docType: 'workOrder',
    data: {
      name: 'Motor Assembly B',
      workCenterId: 'wc-3',
      status: 'open',
      startDate: fmt(addDays(today, 4)),
      endDate: fmt(addDays(today, 11)),
    },
  },
  {
    docId: 'wo-6',
    docType: 'workOrder',
    data: {
      name: 'Final Inspection Lot 47',
      workCenterId: 'wc-4',
      status: 'blocked',
      startDate: fmt(addDays(today, -3)),
      endDate: fmt(addDays(today, 4)),
    },
  },
  {
    docId: 'wo-7',
    docType: 'workOrder',
    data: {
      name: 'Product Packaging Run',
      workCenterId: 'wc-5',
      status: 'open',
      startDate: fmt(addDays(today, 1)),
      endDate: fmt(addDays(today, 8)),
    },
  },
  {
    docId: 'wo-8',
    docType: 'workOrder',
    data: {
      name: 'Frame Welding Order',
      workCenterId: 'wc-6',
      status: 'complete',
      startDate: fmt(addDays(today, -14)),
      endDate: fmt(addDays(today, -7)),
    },
  },
  {
    docId: 'wo-9',
    docType: 'workOrder',
    data: {
      name: 'Bracket Welding Batch',
      workCenterId: 'wc-6',
      status: 'open',
      startDate: fmt(addDays(today, -4)),
      endDate: fmt(addDays(today, 3)),
    },
  },
  {
    docId: 'wo-10',
    docType: 'workOrder',
    data: {
      name: 'CNC Shaft Turning',
      workCenterId: 'wc-2',
      status: 'complete',
      startDate: fmt(addDays(today, -12)),
      endDate: fmt(addDays(today, -5)),
    },
  },
];
