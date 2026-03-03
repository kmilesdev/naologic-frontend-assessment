import { Injectable } from '@angular/core';
import { ZoomLevel, TimelineColumn } from '../models/timeline.model';
import {
  addDays, addWeeks, addMonths,
  startOfDay, startOfWeek, startOfMonth,
  endOfWeek, endOfMonth,
  format, eachDayOfInterval, eachWeekOfInterval, eachMonthOfInterval,
  differenceInCalendarDays,
  isSameDay, parseISO, isWithinInterval, isBefore, getDaysInMonth
} from 'date-fns';

@Injectable({ providedIn: 'root' })
export class TimelineService {
  getColumnWidth(zoom: ZoomLevel): number {
    switch (zoom) {
      case 'day': return 60;
      case 'week': return 120;
      case 'month': return 180;
    }
  }

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
        return {
          start: addMonths(startOfMonth(referenceDate), -6),
          end: addMonths(startOfMonth(referenceDate), 6),
        };
    }
  }

  generateColumns(zoom: ZoomLevel, start: Date, end: Date): TimelineColumn[] {
    const today = startOfDay(new Date());

    switch (zoom) {
      case 'day':
        return eachDayOfInterval({ start, end }).map(date => ({
          date,
          label: format(date, 'd'),
          subLabel: format(date, 'EEE'),
          isToday: isSameDay(date, today),
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
        }));
      case 'month':
        return eachMonthOfInterval({ start, end }).map(date => ({
          date,
          label: format(date, 'MMMM'),
          subLabel: format(date, 'yyyy'),
          isToday: isWithinInterval(today, {
            start: startOfMonth(date),
            end: endOfMonth(date),
          }),
        }));
    }
  }

  dateToPixelOffset(date: Date | string, rangeStart: Date, zoom: ZoomLevel, columns?: TimelineColumn[]): number {
    const d = typeof date === 'string' ? parseISO(date) : date;
    const colWidth = this.getColumnWidth(zoom);

    switch (zoom) {
      case 'day': {
        const days = differenceInCalendarDays(d, rangeStart);
        return days * colWidth;
      }
      case 'week': {
        if (!columns?.length) {
          const days = differenceInCalendarDays(d, rangeStart);
          return (days / 7) * colWidth;
        }
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
    }
  }

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
        const colIndex = Math.floor(px / colWidth);
        const fraction = (px % colWidth) / colWidth;
        const safeIndex = Math.min(colIndex, columns.length - 1);
        const colStart = columns[Math.max(0, safeIndex)].date;
        const totalDays = getDaysInMonth(colStart);
        const daysIntoMonth = Math.floor(fraction * totalDays);
        return addDays(colStart, daysIntoMonth);
      }
    }
  }

  getTodayOffset(rangeStart: Date, zoom: ZoomLevel, columns?: TimelineColumn[]): number {
    return this.dateToPixelOffset(startOfDay(new Date()), rangeStart, zoom, columns);
  }

  getBarWidth(startDate: string, endDate: string, zoom: ZoomLevel, rangeStart?: Date, columns?: TimelineColumn[]): number {
    const colWidth = this.getColumnWidth(zoom);

    if (rangeStart && columns?.length) {
      const startPx = this.dateToPixelOffset(startDate, rangeStart, zoom, columns);
      const endPx = this.dateToPixelOffset(endDate, rangeStart, zoom, columns);
      return Math.max(endPx - startPx, colWidth / 3);
    }

    const start = parseISO(startDate);
    const end = parseISO(endDate);
    const days = differenceInCalendarDays(end, start);

    switch (zoom) {
      case 'day': return Math.max(days * colWidth, colWidth);
      case 'week': return Math.max((days / 7) * colWidth, colWidth / 2);
      case 'month': return Math.max((days / 30) * colWidth, colWidth / 4);
    }
  }

  getMonthHeaders(zoom: ZoomLevel, columns: TimelineColumn[]): { label: string; span: number }[] {
    if (zoom !== 'day') return [];
    const headers: { label: string; span: number }[] = [];
    let currentMonth = '';
    columns.forEach(col => {
      const monthLabel = format(col.date, 'MMMM yyyy');
      if (monthLabel !== currentMonth) {
        currentMonth = monthLabel;
        headers.push({ label: monthLabel, span: 1 });
      } else {
        headers[headers.length - 1].span++;
      }
    });
    return headers;
  }
}
