
import React from 'react';
import { Users, Globe, UserPlus, Crown, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import SidebarCard from '@/components/common/SidebarCard';

interface CommunitySidebarProps {
  activeSection?: string;
  onSectionChange?: (section: string) => void;
  recommendedSection?: React.ReactNode;
  isAuthenticated?: boolean;
}

const CommunitySidebar: React.FC<CommunitySidebarProps> = ({
  activeSection = 'all',
  onSectionChange,
  recommendedSection,
  isAuthenticated = false
}) => {
  const allMenuItems = [
    { id: 'all', label: 'All Communities', icon: Globe, color: 'text-primary' },
    { id: 'joined', label: 'Joined Communities', icon: UserPlus, color: 'text-green-600', requiresAuth: true },
    { id: 'created', label: 'Created Communities', icon: Crown, color: 'text-yellow-600', requiresAuth: true },
    { id: 'recommended', label: 'Recommended', icon: Heart, color: 'text-pink-600', requiresAuth: true }
  ];

  const menuItems = allMenuItems.filter(item => !item.requiresAuth || isAuthenticated);

  return (
    <div className="space-y-4">
      <SidebarCard title="Communities" icon={Users}>
        <div className="space-y-3">
          {menuItems.map((item) => (
            <Button
              key={item.id}
              variant="ghost"
              className={`w-full justify-start hover:bg-primary/10 whitespace-normal text-left min-h-[44px] py-5 px-3 sm:py-6 sm:px-4 mx-0 my-1 text-sm sm:text-base rounded-lg leading-relaxed ${
                activeSection === item.id ? 'bg-primary/10 text-primary' : ''
              }`}
              onClick={() => onSectionChange?.(item.id)}
            >
              <item.icon className={`h-4 w-4 mr-3 sm:mr-3 flex-shrink-0 ${item.color}`} />
              <span className="flex-1">{item.label}</span>
            </Button>
          ))}
        </div>
      </SidebarCard>
      
      {isAuthenticated && recommendedSection && recommendedSection}
    </div>
  );
};

export default CommunitySidebar;
