export type WorkOrderStatus = 'open' | 'in-progress' | 'complete' | 'blocked';

export interface WorkOrderDocument {
  docId: string;
  docType: 'workOrder';
  data: {
    name: string;
    workCenterId: string;
    status: WorkOrderStatus;
    startDate: string;
    endDate: string;
  };
}

export const STATUS_OPTIONS: { value: WorkOrderStatus; label: string }[] = [
  { value: 'open', label: 'Open' },
  { value: 'in-progress', label: 'In progress' },
  { value: 'complete', label: 'Complete' },
  { value: 'blocked', label: 'Blocked' },
];

export const STATUS_BADGE_COLORS: Record<WorkOrderStatus, { bg: string; text: string }> = {
  'open': { bg: '#E8EAFF', text: '#5B5FC7' },
  'in-progress': { bg: '#FFF8E1', text: '#F9A825' },
  'complete': { bg: '#E8F5E9', text: '#43A047' },
  'blocked': { bg: '#FFF3E0', text: '#EF6C00' },
};

export const BAR_COLORS: Record<WorkOrderStatus, { bg: string; border: string }> = {
  'open': { bg: 'rgba(91, 95, 199, 0.06)', border: 'rgba(91, 95, 199, 0.15)' },
  'in-progress': { bg: 'rgba(91, 95, 199, 0.08)', border: 'rgba(91, 95, 199, 0.18)' },
  'complete': { bg: 'rgba(67, 160, 71, 0.06)', border: 'rgba(67, 160, 71, 0.15)' },
  'blocked': { bg: 'rgba(239, 108, 0, 0.06)', border: 'rgba(239, 108, 0, 0.15)' },
};
