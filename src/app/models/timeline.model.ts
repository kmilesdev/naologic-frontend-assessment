export type ZoomLevel = 'hour' | 'day' | 'week' | 'month';

export interface TimelineConfig {
  zoomLevel: ZoomLevel;
  startDate: Date;
  endDate: Date;
  columnWidth: number;
}

export interface TimelineColumn {
  date: Date;
  label: string;
  subLabel?: string;
  isToday: boolean;
  isCurrent: boolean;
}
