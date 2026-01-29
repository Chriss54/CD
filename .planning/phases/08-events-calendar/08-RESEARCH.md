# Phase 8: Events Calendar - Research

**Researched:** 2026-01-23
**Domain:** Calendar UI, Timezone Handling, Recurring Events
**Confidence:** HIGH

## Summary

This phase implements an events calendar where admins create events and users view them in calendar or list format with timezone conversion. Research focused on three key areas: calendar UI components, timezone handling, and simple recurrence.

The project already uses `date-fns` (v4.1.0), which has first-class timezone support via `@date-fns/tz`. For the calendar UI, two viable approaches exist: using `react-big-calendar` (established library with month/week/day views) or building a custom month-view grid with Tailwind CSS. Given the requirement for month-view only with no week drill-down, a custom Tailwind grid is simpler and avoids the bundle size overhead of react-big-calendar.

For recurrence, the `rrule` library is the industry standard for iCalendar RFC-compliant recurrence rules. However, since only weekly/monthly repeat is needed (no complex BYDAY rules), a simpler approach stores recurrence type as an enum and generates occurrences at query time.

**Primary recommendation:** Build a custom calendar grid with Tailwind CSS, use `@date-fns/tz` for timezone handling, and store simple recurrence as an enum rather than full RRULE strings.

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @date-fns/tz | ^1.2.0 | Timezone-aware date handling | First-class date-fns v4 support, TZDate class, lightweight (916B min) |
| date-fns | 4.1.0 (existing) | Date manipulation | Already in project, comprehensive API |
| Prisma @db.Timestamptz | - | UTC timestamp storage | PostgreSQL best practice for timezone-aware storage |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| rrule | 2.8.1 | Complex recurrence rules | Only if weekly/monthly isn't enough |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Custom calendar grid | react-big-calendar | Adds 50KB+ bundle, overkill for month-view only |
| @date-fns/tz | date-fns-tz (legacy) | Older API, less integrated with date-fns v4 |
| Enum recurrence | rrule library | rrule is more powerful but adds complexity for simple weekly/monthly |

**Installation:**
```bash
npm install @date-fns/tz
```

Note: `date-fns` is already installed in the project.

## Architecture Patterns

### Recommended Project Structure
```
src/
├── app/(main)/calendar/
│   └── page.tsx                    # Calendar page (Server Component)
├── app/(main)/events/
│   └── [id]/page.tsx               # Event detail page
├── app/(main)/admin/events/
│   ├── page.tsx                    # Admin event list
│   └── [id]/page.tsx               # Edit event page
├── components/calendar/
│   ├── calendar-grid.tsx           # Month view grid (Client Component)
│   ├── calendar-header.tsx         # Month navigation
│   ├── calendar-day-cell.tsx       # Day cell with events
│   ├── event-list.tsx              # List view of events
│   ├── event-card.tsx              # Event summary card
│   └── view-toggle.tsx             # Calendar/List toggle
├── components/admin/
│   └── event-form.tsx              # Admin event create/edit form
├── lib/
│   ├── event-actions.ts            # Server actions for events
│   └── timezone.ts                 # Timezone utilities
└── lib/validations/
    └── event.ts                    # Zod schemas for events
```

### Pattern 1: Timezone-Aware Date Display
**What:** Store all dates in UTC with `@db.Timestamptz`, convert to user's local timezone for display
**When to use:** Any time events are displayed to users
**Example:**
```typescript
// Source: https://github.com/date-fns/tz
import { TZDate } from '@date-fns/tz';
import { format } from 'date-fns';

// Detect user's timezone (client-side)
const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

// Convert UTC date to user's timezone for display
function formatEventTime(utcDate: Date, timezone: string): string {
  const tzDate = new TZDate(utcDate, timezone);
  return format(tzDate, 'MMM d, yyyy h:mm a');
}

// Example usage
const displayTime = formatEventTime(event.startTime, userTimezone);
// "Jan 25, 2026 2:00 PM" (in user's local time)
```

### Pattern 2: Calendar Grid with Tailwind CSS
**What:** 7-column grid for month view, cells contain event badges
**When to use:** Month calendar display
**Example:**
```typescript
// Source: https://dev.to/vivekalhat/building-a-calendar-component-with-tailwind-and-date-fns-2c0i
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isToday } from 'date-fns';

function getCalendarDays(currentMonth: Date): Date[] {
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);

  return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
}

// Calendar grid component
<div className="grid grid-cols-7 gap-px bg-gray-200">
  {days.map((day) => (
    <div
      key={day.toISOString()}
      className={cn(
        "min-h-24 bg-white p-2",
        !isSameMonth(day, currentMonth) && "bg-gray-50 text-gray-400",
        isToday(day) && "bg-blue-50"
      )}
    >
      <span className="text-sm font-medium">{format(day, 'd')}</span>
      {/* Event badges rendered here */}
    </div>
  ))}
</div>
```

### Pattern 3: Simple Recurrence Storage
**What:** Store recurrence type as enum, generate occurrences at query time
**When to use:** Weekly/monthly recurring events without complex rules
**Example:**
```prisma
// schema.prisma
enum RecurrenceType {
  NONE
  WEEKLY
  MONTHLY
}

model Event {
  id            String         @id @default(cuid())
  title         String
  description   Json           // Tiptap JSON
  startTime     DateTime       @db.Timestamptz(3)
  endTime       DateTime       @db.Timestamptz(3)
  location      String?
  locationUrl   String?
  coverImage    String?
  recurrence    RecurrenceType @default(NONE)
  recurrenceEnd DateTime?      @db.Timestamptz(3)
  // ... other fields
}
```

```typescript
// Generate recurring event instances
import { addWeeks, addMonths, isBefore } from 'date-fns';

function getEventOccurrences(
  event: Event,
  rangeStart: Date,
  rangeEnd: Date
): Date[] {
  if (event.recurrence === 'NONE') {
    return [event.startTime];
  }

  const occurrences: Date[] = [];
  let current = event.startTime;
  const limit = event.recurrenceEnd || rangeEnd;

  while (isBefore(current, limit) && isBefore(current, rangeEnd)) {
    if (!isBefore(current, rangeStart)) {
      occurrences.push(current);
    }
    current = event.recurrence === 'WEEKLY'
      ? addWeeks(current, 1)
      : addMonths(current, 1);
  }

  return occurrences;
}
```

### Pattern 4: Admin Event Form with DateTime Inputs
**What:** Use native datetime-local inputs, convert to UTC on submit
**When to use:** Admin event creation/editing
**Example:**
```typescript
// Source: Project pattern from course-form.tsx
'use client';

import { TZDate } from '@date-fns/tz';

function EventForm({ event }: { event?: Event }) {
  const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  // Convert UTC to local for form display
  const toLocalString = (date: Date) => {
    const tz = new TZDate(date, userTimezone);
    return format(tz, "yyyy-MM-dd'T'HH:mm");
  };

  // Form uses native datetime-local input
  return (
    <input
      type="datetime-local"
      name="startTime"
      defaultValue={event ? toLocalString(event.startTime) : ''}
    />
  );
}

// Server action converts local to UTC
async function createEvent(formData: FormData) {
  const localStart = formData.get('startTime') as string;
  const timezone = formData.get('timezone') as string;

  // Parse as local time in user's timezone, stored as UTC
  const tzDate = new TZDate(localStart, timezone);
  const utcDate = new Date(tzDate.getTime());

  await db.event.create({
    data: {
      startTime: utcDate,
      // ...
    },
  });
}
```

### Pattern 5: Tiptap Editor Reuse
**What:** Reuse existing LessonEditor for event descriptions
**When to use:** Rich text event descriptions
**Example:**
```typescript
// Reuse existing LessonEditor component
import { LessonEditor } from '@/components/admin/lesson-editor';

function EventForm() {
  const [description, setDescription] = useState<object>({});

  return (
    <LessonEditor
      content={event?.description ? JSON.stringify(event.description) : undefined}
      onChange={setDescription}
    />
  );
}
```

### Anti-Patterns to Avoid
- **Storing local times in database:** Always store UTC, convert for display only
- **Using JavaScript Date constructor with timezone strings:** Use TZDate from @date-fns/tz instead
- **Fetching all events then filtering client-side:** Query only events in the visible date range
- **Building complex RRULE parser for simple recurrence:** Enum + date-fns is simpler for weekly/monthly

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Timezone conversion | Manual offset math | @date-fns/tz TZDate | DST handling, IANA timezone support, edge cases |
| Calendar month grid layout | Manual day counting | date-fns eachDayOfInterval + startOfWeek | Handles month boundaries, week starts correctly |
| Detect user timezone | User-selected dropdown | Intl.DateTimeFormat().resolvedOptions().timeZone | Browser knows better, automatic |
| Time format (12h/24h) | Configuration option | Intl.DateTimeFormat with hour12 option | Respects user's system preference |
| Cover image upload | New implementation | Existing Supabase pattern from avatar-upload.tsx | Already solved, consistent |

**Key insight:** Timezone handling is deceptively complex due to DST, historical timezone changes, and browser inconsistencies. The Intl API + @date-fns/tz handles these edge cases.

## Common Pitfalls

### Pitfall 1: datetime-local Input Timezone Ambiguity
**What goes wrong:** `<input type="datetime-local">` returns a string without timezone info. If you parse it as UTC, times shift.
**Why it happens:** The input represents local time but JavaScript Date constructor assumes UTC for ISO strings.
**How to avoid:** Always pass the user's timezone alongside the datetime string, use TZDate to parse.
**Warning signs:** Events appearing at wrong times, especially across DST boundaries.

### Pitfall 2: Calendar Grid Off-by-One Month
**What goes wrong:** Days from previous/next month not rendering correctly in the grid.
**Why it happens:** Using startOfMonth without accounting for the week the month starts on.
**How to avoid:** Use startOfWeek(startOfMonth(date)) for the grid start, endOfWeek(endOfMonth(date)) for the grid end.
**Warning signs:** Calendar grid has 28 or 35 cells instead of ~42.

### Pitfall 3: Recurring Event Query Explosion
**What goes wrong:** Generating infinite occurrences for events without end date.
**Why it happens:** No limit on recurrence generation.
**How to avoid:** Always pass rangeEnd to occurrence generator, set sensible default (e.g., 1 year from now).
**Warning signs:** Slow queries, memory issues when viewing far-future dates.

### Pitfall 4: Prisma DateTime vs @db.Timestamptz
**What goes wrong:** DateTime stored without timezone info, causing inconsistent results.
**Why it happens:** Prisma DateTime default doesn't store timezone.
**How to avoid:** Always use `@db.Timestamptz(3)` for event times in Prisma schema.
**Warning signs:** Dates shifting when server is in different timezone than database.

### Pitfall 5: SSR Hydration Mismatch with Dates
**What goes wrong:** Server renders UTC time, client renders local time, React hydration error.
**Why it happens:** Server doesn't know user's timezone during SSR.
**How to avoid:** Either suppress hydration for date displays or pass timezone as a cookie/header. For this project, use client components for calendar rendering.
**Warning signs:** "Hydration failed" errors, flickering date displays.

## Code Examples

### Timezone Detection and Storage (Client Component)
```typescript
// Source: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat
'use client';

import { useEffect, useState } from 'react';

export function useUserTimezone(): string {
  const [timezone, setTimezone] = useState('UTC');

  useEffect(() => {
    setTimezone(Intl.DateTimeFormat().resolvedOptions().timeZone);
  }, []);

  return timezone;
}

// Get 12h vs 24h preference
export function useTimeFormat(): '12' | '24' {
  const [format, setFormat] = useState<'12' | '24'>('12');

  useEffect(() => {
    const resolved = Intl.DateTimeFormat(undefined, { hour: 'numeric' }).resolvedOptions();
    setFormat(resolved.hour12 ? '12' : '24');
  }, []);

  return format;
}
```

### Event Time Display Component
```typescript
// Source: https://github.com/date-fns/tz
'use client';

import { TZDate } from '@date-fns/tz';
import { format } from 'date-fns';
import { useUserTimezone, useTimeFormat } from '@/lib/timezone';

interface EventTimeProps {
  start: Date;
  end: Date;
}

export function EventTime({ start, end }: EventTimeProps) {
  const timezone = useUserTimezone();
  const timeFormat = useTimeFormat();

  const startTz = new TZDate(start, timezone);
  const endTz = new TZDate(end, timezone);

  const dateStr = format(startTz, 'EEEE, MMMM d, yyyy');
  const timePattern = timeFormat === '12' ? 'h:mm a' : 'HH:mm';
  const startTimeStr = format(startTz, timePattern);
  const endTimeStr = format(endTz, timePattern);

  return (
    <div>
      <p className="font-medium">{dateStr}</p>
      <p className="text-muted-foreground">{startTimeStr} - {endTimeStr}</p>
    </div>
  );
}
```

### Prisma Schema for Events
```prisma
// Source: Best practices from Prisma discussions
enum RecurrenceType {
  NONE
  WEEKLY
  MONTHLY
}

model Event {
  id            String         @id @default(cuid())
  title         String         @db.VarChar(200)
  description   Json           // Tiptap JSON document
  startTime     DateTime       @db.Timestamptz(3)
  endTime       DateTime       @db.Timestamptz(3)
  location      String?        @db.VarChar(200)
  locationUrl   String?        @db.VarChar(500)
  coverImage    String?        // Supabase storage URL
  recurrence    RecurrenceType @default(NONE)
  recurrenceEnd DateTime?      @db.Timestamptz(3)

  createdById   String
  createdBy     User           @relation(fields: [createdById], references: [id])

  createdAt     DateTime       @default(now())
  updatedAt     DateTime       @updatedAt

  @@index([startTime])
  @@index([createdById])
}
```

### Server Action for Event Creation
```typescript
// Source: Project pattern from profile-actions.ts
'use server';

import { getServerSession } from 'next-auth';
import { revalidatePath } from 'next/cache';
import { authOptions } from '@/lib/auth';
import db from '@/lib/db';
import { eventSchema } from '@/lib/validations/event';
import { TZDate } from '@date-fns/tz';

export async function createEvent(formData: FormData) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return { error: 'Not authenticated' };
  }

  // Check admin role (accepts admin or owner)
  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  if (!user || !['admin', 'owner'].includes(user.role)) {
    return { error: 'Not authorized' };
  }

  const timezone = formData.get('timezone') as string;

  const validatedFields = eventSchema.safeParse({
    title: formData.get('title'),
    description: formData.get('description'),
    startTime: formData.get('startTime'),
    endTime: formData.get('endTime'),
    location: formData.get('location'),
    locationUrl: formData.get('locationUrl'),
    recurrence: formData.get('recurrence'),
  });

  if (!validatedFields.success) {
    return { error: validatedFields.error.flatten().fieldErrors };
  }

  const { title, description, startTime, endTime, location, locationUrl, recurrence } = validatedFields.data;

  // Parse local time strings as TZDate, then convert to UTC
  const startTz = new TZDate(startTime, timezone);
  const endTz = new TZDate(endTime, timezone);

  await db.event.create({
    data: {
      title,
      description: description as unknown as Prisma.InputJsonValue,
      startTime: new Date(startTz.getTime()),
      endTime: new Date(endTz.getTime()),
      location,
      locationUrl,
      recurrence,
      createdById: session.user.id,
    },
  });

  revalidatePath('/calendar');
  revalidatePath('/admin/events');

  return { success: true };
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| date-fns-tz (separate package) | @date-fns/tz + TZDate | date-fns v4 (2024) | Cleaner API, first-class timezone support |
| moment-timezone | date-fns + @date-fns/tz | 2020+ | Smaller bundle, tree-shakeable, modern ESM |
| Storing timezone offset | Storing IANA timezone name | Best practice | Handles DST changes correctly |
| react-big-calendar for all calendars | Custom Tailwind grid for simple views | 2024+ | Smaller bundle when views are limited |

**Deprecated/outdated:**
- `date-fns-tz` (legacy): Still works but @date-fns/tz is the modern replacement integrated with date-fns v4
- `moment.js` / `moment-timezone`: In maintenance mode, not recommended for new projects
- Storing timezone as UTC offset: Doesn't handle DST correctly

## Open Questions

1. **Cover Image Upload Size Limit**
   - What we know: Avatar uploads use 5MB limit per STATE.md decision
   - What's unclear: Should event cover images have same limit?
   - Recommendation: Use same 5MB limit for consistency, can increase later if needed

2. **Recurrence End Date Required?**
   - What we know: Weekly/monthly recurrence requested, no mention of "forever" option
   - What's unclear: Should recurrenceEnd be required for recurring events?
   - Recommendation: Make recurrenceEnd optional but default query to 1 year ahead to prevent infinite generation

## Sources

### Primary (HIGH confidence)
- [@date-fns/tz npm package](https://www.npmjs.com/package/@date-fns/tz) - TZDate API documentation
- [date-fns v4 timezone blog post](https://blog.date-fns.org/v40-with-time-zone-support/) - Official announcement of timezone support
- [MDN Intl.DateTimeFormat](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat) - Timezone detection API
- [Prisma timestamp with timezone discussions](https://github.com/prisma/prisma/discussions/11915) - @db.Timestamptz best practices

### Secondary (MEDIUM confidence)
- [DEV Community calendar with Tailwind and date-fns](https://dev.to/vivekalhat/building-a-calendar-component-with-tailwind-and-date-fns-2c0i) - Calendar grid implementation pattern
- [react-big-calendar README](https://github.com/jquense/react-big-calendar/blob/master/README.md) - date-fns localizer setup (if needed)
- [Medium: Prisma DateTime and Timezone Issues](https://medium.com/@basem.deiaa/how-to-fix-prisma-datetime-and-timezone-issues-with-postgresql-1c778aa2d122) - PostgreSQL timezone handling

### Tertiary (LOW confidence)
- [rrule npm package](https://www.npmjs.com/package/rrule) - Complex recurrence (likely not needed for simple weekly/monthly)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - @date-fns/tz is official, documented
- Architecture: HIGH - Based on existing project patterns
- Pitfalls: HIGH - Well-documented timezone issues
- Calendar UI: MEDIUM - Custom grid vs library is a judgment call, went with simpler approach

**Research date:** 2026-01-23
**Valid until:** 60 days (stable domain, no rapid changes expected)
