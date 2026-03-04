import { Injectable } from '@angular/core';
import { ZoomLevel, TimelineColumn } from '../models/timeline.model';
import {
  addDays, addWeeks, addMonths,
  startOfDay, startOfWeek, startOfMonth,
  endOfWeek,
  format, eachDayOfInterval, eachWeekOfInterval, eachMonthOfInterval,
  differenceInCalendarDays,
  isSameDay, isSameMonth, parseISO, isWithinInterval, isBefore, getDaysInMonth
} from 'date-fns';

/**
 * Pure calculation service for timeline positioning and column generation.
 * Handles all date-to-pixel and pixel-to-date math for Day/Week/Month zoom levels.
 * Stateless — all methods are deterministic given their inputs.
 */
@Injectable({ providedIn: 'root' })
export class TimelineService {

  /** Column width in pixels for each zoom level. Wider columns for coarser zoom. */
  getColumnWidth(zoom: ZoomLevel): number {
    switch (zoom) {
      case 'day': return 60;
      case 'week': return 120;
      case 'month': return 140;
      default: return 60;
    }
  }

  /**
   * Visible date range centered around referenceDate (typically today).
   * Day: ±14 days (~1 month visible). Week: ±8 weeks. Month: -3 to +8 months.
   */
  getDateRange(zoom: ZoomLevel, referenceDate: Date): { start: Date; end: Date } {
    switch (zoom) {
      case 'day':
        return {
          start: addDays(startOfDay(referenceDate), -14),
          end: addDays(startOfDay(referenceDate), 14),
        };
      case 'week':
        return {
          start: addWeeks(startOfWeek(referenceDate, { weekStartsOn: 1 }), -8),
          end: addWeeks(startOfWeek(referenceDate, { weekStartsOn: 1 }), 8),
        };
      case 'month':
      default:
        return {
          start: addMonths(startOfMonth(referenceDate), -3),
          end: addMonths(startOfMonth(referenceDate), 8),
        };
    }
  }

  /**
   * Generate column metadata for the header row.
   * Each column gets a label, optional subLabel, and flags for whether it
   * contains today (isToday) or is the "current" period (isCurrent) for the pill badge.
   */
  generateColumns(zoom: ZoomLevel, start: Date, end: Date, referenceDate?: Date): TimelineColumn[] {
    const ref = referenceDate || new Date();
    const today = startOfDay(ref);
    const currentMonth = startOfMonth(ref);

    switch (zoom) {
      case 'day':
        return eachDayOfInterval({ start, end }).map(date => ({
          date,
          label: format(date, 'EEE d'),
          subLabel: format(date, 'MMM'),
          isToday: isSameDay(date, today),
          isCurrent: isSameDay(date, today),
        }));
      case 'week':
        return eachWeekOfInterval({ start, end }, { weekStartsOn: 1 }).map(date => ({
          date,
          label: `Week ${format(date, 'w')}`,
          subLabel: format(date, 'MMM d'),
          isToday: isWithinInterval(today, {
            start: startOfWeek(date, { weekStartsOn: 1 }),
            end: endOfWeek(date, { weekStartsOn: 1 }),
          }),
          isCurrent: isWithinInterval(today, {
            start: startOfWeek(date, { weekStartsOn: 1 }),
            end: endOfWeek(date, { weekStartsOn: 1 }),
          }),
        }));
      case 'month':
      default:
        return eachMonthOfInterval({ start, end }).map(date => ({
          date,
          label: format(date, 'MMM yyyy'),
          subLabel: '',
          isToday: isSameMonth(date, today),
          isCurrent: isSameMonth(date, today),
        }));
    }
  }

  /**
   * Convert a date to a pixel X offset from the left edge of the timeline.
   *
   * For Day zoom: simple — each day is one column width.
   * For Week/Month zoom: calendar-aware. We iterate through columns to find
   * which column the date falls into, then calculate the fractional position
   * within that column. This handles variable-length months (28-31 days)
   * accurately instead of assuming a fixed 30-day month.
   */
  dateToPixelOffset(date: Date | string, rangeStart: Date, zoom: ZoomLevel, columns?: TimelineColumn[]): number {
    const d = typeof date === 'string' ? parseISO(date) : date;
    const colWidth = this.getColumnWidth(zoom);

    switch (zoom) {
      case 'day': {
        // Day view: 1 column = 1 day, direct multiplication
        const days = differenceInCalendarDays(d, rangeStart);
        return days * colWidth;
      }
      case 'week': {
        if (!columns?.length) {
          const days = differenceInCalendarDays(d, rangeStart);
          return (days / 7) * colWidth;
        }
        // Find which week column contains this date, then calculate
        // fractional position (0-6 days) within that week
        for (let i = 0; i < columns.length; i++) {
          const colStart = columns[i].date;
          const colEnd = i + 1 < columns.length ? columns[i + 1].date : addWeeks(colStart, 1);
          if (isBefore(d, colEnd) || i === columns.length - 1) {
            const daysIntoWeek = differenceInCalendarDays(d, colStart);
            const fraction = Math.max(0, daysIntoWeek) / 7;
            return i * colWidth + fraction * colWidth;
          }
        }
        return 0;
      }
      case 'month': {
        if (!columns?.length) {
          const days = differenceInCalendarDays(d, rangeStart);
          return (days / 30) * colWidth;
        }
        // Find which month column contains this date, then calculate
        // fractional position using actual days in that month (28-31)
        for (let i = 0; i < columns.length; i++) {
          const colStart = columns[i].date;
          const colEnd = i + 1 < columns.length ? columns[i + 1].date : addMonths(colStart, 1);
          if (isBefore(d, colEnd) || i === columns.length - 1) {
            const daysIntoMonth = differenceInCalendarDays(d, colStart);
            const totalDays = getDaysInMonth(colStart);
            const fraction = Math.max(0, daysIntoMonth) / totalDays;
            return i * colWidth + fraction * colWidth;
          }
        }
        return 0;
      }
      default:
        return 0;
    }
  }

  /**
   * Inverse of dateToPixelOffset: convert a pixel X position back to a date.
   * Used when the user clicks on the timeline to determine the start date
   * for a new work order.
   */
  pixelOffsetToDate(px: number, rangeStart: Date, zoom: ZoomLevel, columns?: TimelineColumn[]): Date {
    const colWidth = this.getColumnWidth(zoom);

    switch (zoom) {
      case 'day': {
        const days = Math.floor(px / colWidth);
        return addDays(rangeStart, days);
      }
      case 'week': {
        if (!columns?.length) {
          return addDays(rangeStart, Math.floor((px / colWidth) * 7));
        }
        // Determine which column was clicked, then how far into it
        const colIndex = Math.floor(px / colWidth);
        const fraction = (px % colWidth) / colWidth;
        const safeIndex = Math.min(colIndex, columns.length - 1);
        const colStart = columns[Math.max(0, safeIndex)].date;
        const daysIntoWeek = Math.floor(fraction * 7);
        return addDays(colStart, daysIntoWeek);
      }
      case 'month': {
        if (!columns?.length) {
          return addDays(rangeStart, Math.floor((px / colWidth) * 30));
        }
        // Use actual days-in-month for accurate click-to-date mapping
        const colIndex = Math.floor(px / colWidth);
        const fraction = (px % colWidth) / colWidth;
        const safeIndex = Math.min(colIndex, columns.length - 1);
        const colStart = columns[Math.max(0, safeIndex)].date;
        const totalDays = getDaysInMonth(colStart);
        const daysIntoMonth = Math.floor(fraction * totalDays);
        return addDays(colStart, daysIntoMonth);
      }
      default:
        return rangeStart;
    }
  }

  /**
   * Calculate bar width by computing pixel positions of both endpoints.
   * Minimum width of 40px ensures very short orders remain clickable.
   */
  getBarWidth(startDate: string, endDate: string, zoom: ZoomLevel, rangeStart: Date, columns?: TimelineColumn[]): number {
    const colWidth = this.getColumnWidth(zoom);
    if (rangeStart && columns?.length) {
      const startPx = this.dateToPixelOffset(startDate, rangeStart, zoom, columns);
      const endPx = this.dateToPixelOffset(endDate, rangeStart, zoom, columns);
      return Math.max(endPx - startPx, 40);
    }
    const start = parseISO(startDate);
    const end = parseISO(endDate);
    const days = differenceInCalendarDays(end, start);
    return Math.max((days / 30) * colWidth, 40);
  }

  /** Find the index of the column containing today, used for initial scroll position. */
  getCurrentColumnIndex(columns: TimelineColumn[]): number {
    return columns.findIndex(c => c.isCurrent);
  }

  extendRangeBack(currentStart: Date, zoom: ZoomLevel, count: number): Date {
    switch (zoom) {
      case 'day': return addDays(currentStart, -count);
      case 'week': return addWeeks(currentStart, -count);
      case 'month': return addMonths(currentStart, -count);
      default: return currentStart;
    }
  }

  extendRangeForward(currentEnd: Date, zoom: ZoomLevel, count: number): Date {
    switch (zoom) {
      case 'day': return addDays(currentEnd, count);
      case 'week': return addWeeks(currentEnd, count);
      case 'month': return addMonths(currentEnd, count);
      default: return currentEnd;
    }
  }
}
