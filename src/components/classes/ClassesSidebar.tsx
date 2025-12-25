import React from 'react';
import { Video, Globe, UserPlus, Crown, Clock, Radio } from "lucide-react";
import { Button } from "@/components/ui/button";
import SidebarCard from '@/components/common/SidebarCard';

export type ClassSection = 'all' | 'joined' | 'hosted' | 'live' | 'upcoming';

interface ClassesSidebarProps {
  activeSection: ClassSection;
  onSectionChange: (section: ClassSection) => void;
  isAuthenticated: boolean;
  isCheckingAuth?: boolean;
  liveCount?: number;
  hostedCount?: number;
  joinedCount?: number;
}

const ClassesSidebar: React.FC<ClassesSidebarProps> = ({
  activeSection,
  onSectionChange,
  isAuthenticated,
  isCheckingAuth = false,
  liveCount = 0,
  hostedCount = 0,
  joinedCount = 0
}) => {
  const allMenuItems = [
    { id: 'all' as ClassSection, label: 'All Classes', icon: Globe, color: 'text-primary', requiresAuth: false },
    { id: 'live' as ClassSection, label: 'Live Now', icon: Radio, color: 'text-red-500', requiresAuth: false, count: liveCount },
    { id: 'upcoming' as ClassSection, label: 'Upcoming', icon: Clock, color: 'text-blue-500', requiresAuth: false },
    { id: 'joined' as ClassSection, label: 'Joined Classes', icon: UserPlus, color: 'text-green-600', requiresAuth: true, count: joinedCount },
    { id: 'hosted' as ClassSection, label: 'My Hosted Classes', icon: Crown, color: 'text-yellow-600', requiresAuth: true, count: hostedCount },
  ];

  // Show all items while checking auth to prevent layout shift, hide auth items only after check completes
  const menuItems = isCheckingAuth 
    ? allMenuItems 
    : allMenuItems.filter(item => !item.requiresAuth || isAuthenticated);

  return (
    <div className="space-y-4">
      <SidebarCard title="Classes" icon={Video}>
        <div className="space-y-3">
          {menuItems.map((item) => (
            <Button
              key={item.id}
              variant="ghost"
              className={`w-full justify-start hover:bg-primary/10 whitespace-normal text-left min-h-[44px] py-5 px-3 sm:py-6 sm:px-4 mx-0 my-1 text-sm sm:text-base rounded-lg leading-relaxed ${
                activeSection === item.id ? 'bg-primary/10 text-primary' : ''
              }`}
              onClick={() => onSectionChange(item.id)}
            >
              <item.icon className={`h-4 w-4 mr-3 sm:mr-3 flex-shrink-0 ${item.color}`} />
              <span className="flex-1">{item.label}</span>
              {item.id === 'live' && liveCount > 0 && (
                <span className="ml-2 flex items-center">
                  <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse mr-1" />
                  <span className="text-xs text-muted-foreground">{liveCount}</span>
                </span>
              )}
              {item.id === 'hosted' && hostedCount > 0 && (
                <span className="text-xs text-muted-foreground ml-2">{hostedCount}</span>
              )}
              {item.id === 'joined' && joinedCount > 0 && (
                <span className="text-xs text-muted-foreground ml-2">{joinedCount}</span>
              )}
            </Button>
          ))}
        </div>
      </SidebarCard>
    </div>
  );
};

export default ClassesSidebar;
