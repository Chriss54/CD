import { Suspense } from 'react';
import { getEventsForMonth, getUpcomingEvents } from '@/lib/event-actions';
import { CalendarClient } from './calendar-client';

async function CalendarData({
  year,
  month,
}: {
  year: number;
  month: number;
}) {
  const [monthEvents, upcomingEvents] = await Promise.all([
    getEventsForMonth(year, month),
    getUpcomingEvents(90),
  ]);

  return (
    <CalendarClient
      initialMonthEvents={monthEvents}
      initialUpcomingEvents={upcomingEvents}
      initialYear={year}
      initialMonth={month}
    />
  );
}

function CalendarSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="h-7 w-40 bg-gray-200 rounded animate-pulse" />
        <div className="flex items-center gap-2">
          <div className="h-9 w-20 bg-gray-200 rounded animate-pulse" />
          <div className="h-9 w-24 bg-gray-200 rounded animate-pulse" />
        </div>
      </div>
      <div className="border rounded-lg overflow-hidden">
        <div className="grid grid-cols-7 gap-px bg-gray-200">
          {[...Array(7)].map((_, i) => (
            <div key={i} className="bg-gray-50 p-2 h-10" />
          ))}
          {[...Array(35)].map((_, i) => (
            <div key={i} className="bg-white min-h-[100px] p-1" />
          ))}
        </div>
      </div>
    </div>
  );
}

export default async function CalendarPage() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Calendar</h1>

      <Suspense fallback={<CalendarSkeleton />}>
        <CalendarData year={year} month={month} />
      </Suspense>
    </div>
  );
}
