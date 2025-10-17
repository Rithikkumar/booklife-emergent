
export interface Community {
  id: string;
  name: string;
  members: number;
  description: string;
  tags: string[];
  recentActivity: string;
  isJoined: boolean;
  createdBy: string;
  isCreatedByUser: boolean;
  isRecommended: boolean;
  recommendationScore?: number;
  recommendationReason?: string;
  is_public: boolean;
  restrict_messaging?: boolean;
}

export interface Book {
  id: string;
  title: string;
  author: string;
  code?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
  acquisitionMethod?: 'bookstore' | 'friend' | 'online' | 'gift';
  previousOwner?: string;
  notes?: string;
}

export interface BookClass {
  id: string;
  title: string;
  instructor: string;
  duration: string;
  participants: number;
  maxParticipants: number;
  schedule: string;
  description: string;
  tags: string[];
  isEnrolled: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  joinedCommunities: number;
  booksShared: number;
}

export interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ComponentType<any>;
  description?: string;
  gradient?: boolean;
}

export interface ActionButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ComponentType<any>;
  disabled?: boolean;
  className?: string;
}
