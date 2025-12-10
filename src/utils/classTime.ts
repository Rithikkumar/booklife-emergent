import { format, parseISO, isAfter, isBefore, addMinutes, subMinutes } from 'date-fns';

export interface ClassStatus {
  isUpcoming: boolean;
  isLive: boolean;
  isEnded: boolean;
  startsIn: number; // minutes
  endsIn: number; // minutes
}

export const getClassStatus = (scheduledDate: string, durationMinutes: number): ClassStatus => {
  const now = new Date();
  const startTime = parseISO(scheduledDate);
  const endTime = addMinutes(startTime, durationMinutes);
  
  // Allow joining 15 minutes before start
  const joinAllowedTime = subMinutes(startTime, 15);
  
  const startsIn = Math.floor((startTime.getTime() - now.getTime()) / (1000 * 60));
  const endsIn = Math.floor((endTime.getTime() - now.getTime()) / (1000 * 60));
  
  const isUpcoming = isBefore(now, joinAllowedTime);
  const isLive = !isBefore(now, joinAllowedTime) && isBefore(now, endTime);
  const isEnded = isAfter(now, endTime);
  
  return {
    isUpcoming,
    isLive,
    isEnded,
    startsIn,
    endsIn
  };
};

export const formatTimeUntilClass = (minutesUntil: number): string => {
  if (minutesUntil < 0) return 'Started';
  
  const hours = Math.floor(minutesUntil / 60);
  const minutes = minutesUntil % 60;
  
  if (hours >= 24) {
    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;
    return `${days}d ${remainingHours}h`;
  } else if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else {
    return `${minutes}m`;
  }
};

export const formatClassTime = (scheduledDate: string): string => {
  return format(parseISO(scheduledDate), 'MMM d, h:mm a');
};