'use client';

import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameDay,
} from 'date-fns';
import { CalendarDayCell } from './calendar-day-cell';
import type { EventOccurrence } from '@/lib/event-actions';

interface CalendarGridProps {
  events: EventOccurrence[];
  currentMonth: Date;
}

export function CalendarGrid({ events, currentMonth }: CalendarGridProps) {
  // Generate calendar grid days
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  // Helper to get events for a specific day
  const getEventsForDay = (day: Date): EventOccurrence[] => {
    return events.filter((occurrence) =>
      isSameDay(occurrence.occurrenceDate, day)
    );
  };

  // Day of week headers
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <div className="grid grid-cols-7 gap-px bg-gray-200">
        {/* Header row */}
        {weekDays.map((day) => (
          <div
            key={day}
            className="bg-gray-50 p-2 text-center text-sm font-medium text-gray-500"
          >
            {day}
          </div>
        ))}

        {/* Day cells */}
        {days.map((day) => (
          <CalendarDayCell
            key={day.toISOString()}
            day={day}
            events={getEventsForDay(day)}
            currentMonth={currentMonth}
          />
        ))}
      </div>
    </div>
  );
}
