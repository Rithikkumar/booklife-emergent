import { formatDistanceToNow } from 'date-fns';

export interface ActivityInfo {
  level: 'Very High' | 'High' | 'Moderate' | 'Low';
  color: string;
  description: string;
}

export const calculateActivityLevel = (messageCount: number, memberCount: number): ActivityInfo => {
  // Calculate activity based on message count and member ratio
  const messageRatio = memberCount > 0 ? messageCount / memberCount : 0;
  
  if (messageCount > 100 || messageRatio > 50) {
    return {
      level: 'Very High',
      color: 'text-green-600',
      description: 'Very active community with frequent discussions'
    };
  } else if (messageCount > 25 || messageRatio > 10) {
    return {
      level: 'High', 
      color: 'text-yellow-600',
      description: 'Active community with regular participation'
    };
  } else if (messageCount > 5 || messageRatio > 2) {
    return {
      level: 'Moderate',
      color: 'text-blue-600', 
      description: 'Growing community with some activity'
    };
  } else {
    return {
      level: 'Low',
      color: 'text-gray-600',
      description: 'New or quiet community'
    };
  }
};

export const formatLastActivity = (dateString?: string): string => {
  if (!dateString) return 'No recent activity';
  return formatDistanceToNow(new Date(dateString), { addSuffix: true });
};

export const formatActivityTime = (dateString?: string): string => {
  if (!dateString) return 'Never';
  const distance = formatDistanceToNow(new Date(dateString), { addSuffix: true });
  return distance.replace(' ago', '');
};