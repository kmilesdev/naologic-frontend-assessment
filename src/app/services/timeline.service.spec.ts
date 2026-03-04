import { TestBed } from '@angular/core/testing';
import { TimelineService } from './timeline.service';
import { TimelineColumn } from '../models/timeline.model';
import {
  startOfDay, startOfWeek, startOfMonth, addDays, addWeeks, addMonths,
  differenceInCalendarDays, isSameDay, format,
} from 'date-fns';

describe('TimelineService', () => {
  let service: TimelineService;
  const refDate = new Date(2026, 2, 4);

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TimelineService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getColumnWidth', () => {
    it('should return 60 for day view', () => {
      expect(service.getColumnWidth('day')).toBe(60);
    });

    it('should return 120 for week view', () => {
      expect(service.getColumnWidth('week')).toBe(120);
    });

    it('should return 140 for month view', () => {
      expect(service.getColumnWidth('month')).toBe(140);
    });
  });

  describe('getDateRange', () => {
    it('should return ±14 days for day view', () => {
      const range = service.getDateRange('day', refDate);
      const daysBefore = differenceInCalendarDays(startOfDay(refDate), range.start);
      const daysAfter = differenceInCalendarDays(range.end, startOfDay(refDate));
      expect(daysBefore).toBe(14);
      expect(daysAfter).toBe(14);
    });

    it('should return ±8 weeks for week view', () => {
      const range = service.getDateRange('week', refDate);
      const weekStart = startOfWeek(refDate, { weekStartsOn: 1 });
      expect(range.start).toEqual(addWeeks(weekStart, -8));
      expect(range.end).toEqual(addWeeks(weekStart, 8));
    });

    it('should return -3/+8 months for month view', () => {
      const range = service.getDateRange('month', refDate);
      const monthStart = startOfMonth(refDate);
      expect(range.start).toEqual(addMonths(monthStart, -3));
      expect(range.end).toEqual(addMonths(monthStart, 8));
    });
  });

  describe('generateColumns', () => {
    it('should generate day columns with correct labels', () => {
      const start = new Date(2026, 2, 1);
      const end = new Date(2026, 2, 5);
      const cols = service.generateColumns('day', start, end, refDate);

      expect(cols.length).toBe(5);
      cols.forEach(col => {
        expect(col.label).toBeTruthy();
        expect(col.date).toBeTruthy();
      });
    });

    it('should mark today column as isCurrent in day view', () => {
      const range = service.getDateRange('day', refDate);
      const cols = service.generateColumns('day', range.start, range.end, refDate);
      const todayCol = cols.find(c => c.isCurrent);

      expect(todayCol).toBeTruthy();
      expect(isSameDay(todayCol!.date, startOfDay(refDate))).toBeTrue();
    });

    it('should generate week columns', () => {
      const range = service.getDateRange('week', refDate);
      const cols = service.generateColumns('week', range.start, range.end, refDate);

      expect(cols.length).toBeGreaterThan(0);
      cols.forEach(col => {
        expect(col.label).toContain('Week');
      });
    });

    it('should mark current week as isCurrent in week view', () => {
      const range = service.getDateRange('week', refDate);
      const cols = service.generateColumns('week', range.start, range.end, refDate);
      const currentCol = cols.find(c => c.isCurrent);
      expect(currentCol).toBeTruthy();
    });

    it('should generate month columns with year labels', () => {
      const range = service.getDateRange('month', refDate);
      const cols = service.generateColumns('month', range.start, range.end, refDate);

      expect(cols.length).toBeGreaterThan(0);
      cols.forEach(col => {
        expect(col.label).toMatch(/\w+ \d{4}/);
      });
    });

    it('should mark current month as isCurrent in month view', () => {
      const range = service.getDateRange('month', refDate);
      const cols = service.generateColumns('month', range.start, range.end, refDate);
      const currentCol = cols.find(c => c.isCurrent);
      expect(currentCol).toBeTruthy();
    });
  });

  describe('dateToPixelOffset', () => {
    it('should return 0 for the range start date in day view', () => {
      const range = service.getDateRange('day', refDate);
      const cols = service.generateColumns('day', range.start, range.end, refDate);
      const offset = service.dateToPixelOffset(range.start, range.start, 'day', cols);
      expect(offset).toBe(0);
    });

    it('should return correct offset for day view', () => {
      const start = new Date(2026, 2, 1);
      const end = new Date(2026, 2, 10);
      const cols = service.generateColumns('day', start, end, refDate);
      const colWidth = service.getColumnWidth('day');

      const testDate = new Date(2026, 2, 4);
      const offset = service.dateToPixelOffset(testDate, start, 'day', cols);
      expect(offset).toBe(3 * colWidth);
    });

    it('should handle string date input', () => {
      const start = new Date(2026, 2, 1);
      const end = new Date(2026, 2, 10);
      const cols = service.generateColumns('day', start, end, refDate);
      const colWidth = service.getColumnWidth('day');

      const offset = service.dateToPixelOffset('2026-03-04', start, 'day', cols);
      expect(offset).toBe(3 * colWidth);
    });

    it('should calculate fractional position within month columns', () => {
      const range = service.getDateRange('month', refDate);
      const cols = service.generateColumns('month', range.start, range.end, refDate);

      const midMonth = new Date(2026, 2, 15);
      const offset = service.dateToPixelOffset(midMonth, range.start, 'month', cols);

      expect(offset).toBeGreaterThan(0);
    });

    it('should produce increasing offsets for later dates', () => {
      const range = service.getDateRange('day', refDate);
      const cols = service.generateColumns('day', range.start, range.end, refDate);

      const offset1 = service.dateToPixelOffset('2026-03-01', range.start, 'day', cols);
      const offset2 = service.dateToPixelOffset('2026-03-05', range.start, 'day', cols);
      const offset3 = service.dateToPixelOffset('2026-03-10', range.start, 'day', cols);

      expect(offset2).toBeGreaterThan(offset1);
      expect(offset3).toBeGreaterThan(offset2);
    });
  });

  describe('pixelOffsetToDate', () => {
    it('should return range start for offset 0 in day view', () => {
      const start = new Date(2026, 2, 1);
      const end = new Date(2026, 2, 10);
      const cols = service.generateColumns('day', start, end, refDate);

      const date = service.pixelOffsetToDate(0, start, 'day', cols);
      expect(isSameDay(date, start)).toBeTrue();
    });

    it('should return correct date for known offset in day view', () => {
      const start = new Date(2026, 2, 1);
      const end = new Date(2026, 2, 10);
      const cols = service.generateColumns('day', start, end, refDate);
      const colWidth = service.getColumnWidth('day');

      const date = service.pixelOffsetToDate(3 * colWidth, start, 'day', cols);
      expect(isSameDay(date, new Date(2026, 2, 4))).toBeTrue();
    });

    it('should be inverse of dateToPixelOffset for day view', () => {
      const range = service.getDateRange('day', refDate);
      const cols = service.generateColumns('day', range.start, range.end, refDate);

      const testDate = new Date(2026, 2, 4);
      const px = service.dateToPixelOffset(testDate, range.start, 'day', cols);
      const recoveredDate = service.pixelOffsetToDate(px, range.start, 'day', cols);

      expect(isSameDay(recoveredDate, testDate)).toBeTrue();
    });
  });

  describe('getBarWidth', () => {
    it('should return positive width for valid date range', () => {
      const range = service.getDateRange('day', refDate);
      const cols = service.generateColumns('day', range.start, range.end, refDate);

      const width = service.getBarWidth('2026-03-01', '2026-03-10', 'day', range.start, cols);
      expect(width).toBeGreaterThan(0);
    });

    it('should enforce minimum width of 40px', () => {
      const range = service.getDateRange('month', refDate);
      const cols = service.generateColumns('month', range.start, range.end, refDate);

      const width = service.getBarWidth('2026-03-01', '2026-03-02', 'month', range.start, cols);
      expect(width).toBeGreaterThanOrEqual(40);
    });

    it('should return wider bar for longer date range', () => {
      const range = service.getDateRange('day', refDate);
      const cols = service.generateColumns('day', range.start, range.end, refDate);

      const shortWidth = service.getBarWidth('2026-03-01', '2026-03-03', 'day', range.start, cols);
      const longWidth = service.getBarWidth('2026-03-01', '2026-03-10', 'day', range.start, cols);
      expect(longWidth).toBeGreaterThan(shortWidth);
    });
  });

  describe('getCurrentColumnIndex', () => {
    it('should return the index of the current column', () => {
      const range = service.getDateRange('day', refDate);
      const cols = service.generateColumns('day', range.start, range.end, refDate);
      const index = service.getCurrentColumnIndex(cols);

      expect(index).toBeGreaterThanOrEqual(0);
      expect(cols[index].isCurrent).toBeTrue();
    });

    it('should return -1 if no current column exists', () => {
      const cols: TimelineColumn[] = [
        { date: new Date(2020, 0, 1), label: 'Old', isToday: false, isCurrent: false },
      ];
      expect(service.getCurrentColumnIndex(cols)).toBe(-1);
    });
  });

  describe('dateToPixelOffset edge cases', () => {
    it('should handle week view fractional positioning', () => {
      const range = service.getDateRange('week', refDate);
      const cols = service.generateColumns('week', range.start, range.end, refDate);

      const offset1 = service.dateToPixelOffset('2026-03-02', range.start, 'week', cols);
      const offset2 = service.dateToPixelOffset('2026-03-06', range.start, 'week', cols);
      expect(offset2).toBeGreaterThan(offset1);
    });

    it('should handle month view with February (28 days)', () => {
      const febDate = new Date(2026, 1, 15);
      const range = service.getDateRange('month', febDate);
      const cols = service.generateColumns('month', range.start, range.end, febDate);

      const offset = service.dateToPixelOffset('2026-02-15', range.start, 'month', cols);
      expect(offset).toBeGreaterThan(0);
    });

    it('should produce consistent round-trip in week view', () => {
      const range = service.getDateRange('week', refDate);
      const cols = service.generateColumns('week', range.start, range.end, refDate);

      const testDate = new Date(2026, 2, 4);
      const px = service.dateToPixelOffset(testDate, range.start, 'week', cols);
      const recovered = service.pixelOffsetToDate(px, range.start, 'week', cols);

      const daysDiff = Math.abs(differenceInCalendarDays(recovered, testDate));
      expect(daysDiff).toBeLessThanOrEqual(1);
    });

    it('should handle date at very start of range', () => {
      const range = service.getDateRange('day', refDate);
      const cols = service.generateColumns('day', range.start, range.end, refDate);

      const offset = service.dateToPixelOffset(range.start, range.start, 'day', cols);
      expect(offset).toBe(0);
    });
  });

  describe('extendRangeBack', () => {
    it('should extend range back by specified days', () => {
      const start = new Date(2026, 2, 1);
      const newStart = service.extendRangeBack(start, 'day', 7);
      expect(differenceInCalendarDays(start, newStart)).toBe(7);
    });

    it('should extend range back by specified weeks', () => {
      const start = new Date(2026, 2, 1);
      const newStart = service.extendRangeBack(start, 'week', 2);
      expect(differenceInCalendarDays(start, newStart)).toBe(14);
    });

    it('should extend range back by specified months', () => {
      const start = new Date(2026, 2, 1);
      const newStart = service.extendRangeBack(start, 'month', 3);
      expect(newStart).toEqual(addMonths(start, -3));
    });
  });

  describe('extendRangeForward', () => {
    it('should extend range forward by specified days', () => {
      const end = new Date(2026, 2, 1);
      const newEnd = service.extendRangeForward(end, 'day', 7);
      expect(differenceInCalendarDays(newEnd, end)).toBe(7);
    });

    it('should extend range forward by specified weeks', () => {
      const end = new Date(2026, 2, 1);
      const newEnd = service.extendRangeForward(end, 'week', 2);
      expect(differenceInCalendarDays(newEnd, end)).toBe(14);
    });

    it('should extend range forward by specified months', () => {
      const end = new Date(2026, 2, 1);
      const newEnd = service.extendRangeForward(end, 'month', 3);
      expect(newEnd).toEqual(addMonths(end, 3));
    });
  });
});
