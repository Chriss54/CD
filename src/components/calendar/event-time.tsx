'use client';

import { useUserTimezone, useTimeFormat, formatEventTime } from '@/lib/timezone';

interface EventTimeProps {
  start: Date;
  end: Date;
}

export function EventTime({ start, end }: EventTimeProps) {
  const timezone = useUserTimezone();
  const timeFormat = useTimeFormat();

  // Date pattern - always consistent
  const datePattern = 'EEEE, MMMM d, yyyy';

  // Time pattern based on user preference
  const timePatternStart = timeFormat === '12' ? 'h:mm a' : 'HH:mm';
  const timePatternEnd = timeFormat === '12' ? 'h:mm a' : 'HH:mm';

  const formattedDate = formatEventTime(start, timezone, datePattern);
  const formattedStartTime = formatEventTime(start, timezone, timePatternStart);
  const formattedEndTime = formatEventTime(end, timezone, timePatternEnd);

  return (
    <div className="text-gray-600">
      <div className="font-medium text-gray-900">{formattedDate}</div>
      <div className="text-sm">
        {formattedStartTime} - {formattedEndTime}
      </div>
    </div>
  );
}
