import type { Event, User } from '@/generated/prisma/client';

// Re-export RecurrenceType enum for use in client code
export type RecurrenceType = 'NONE' | 'WEEKLY' | 'MONTHLY';

// Event with creator relation
export type EventWithCreator = Event & {
  createdBy: Pick<User, 'id' | 'name' | 'image'>;
};

// Re-export Event type
export type { Event };
