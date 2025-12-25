import React from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

interface TabOption {
  key: string;
  label: string;
  icon?: React.ReactNode;
  count?: number;
  requiresAuth?: boolean;
}

interface MobileSectionTabsProps {
  tabs: TabOption[];
  activeTab: string;
  onTabChange: (tab: string) => void;
  isAuthenticated?: boolean;
}

const MobileSectionTabs: React.FC<MobileSectionTabsProps> = ({
  tabs,
  activeTab,
  onTabChange,
  isAuthenticated = false
}) => {
  const visibleTabs = tabs.filter(tab => !tab.requiresAuth || isAuthenticated);

  return (
    <div className="lg:hidden mb-4">
      <ScrollArea className="w-full whitespace-nowrap">
        <div className="flex gap-2 pb-2">
          {visibleTabs.map((tab) => (
            <Button
              key={tab.key}
              variant={activeTab === tab.key ? "default" : "outline"}
              size="sm"
              className={cn(
                "flex-shrink-0 transition-all duration-200",
                activeTab === tab.key 
                  ? "bg-primary text-primary-foreground shadow-md" 
                  : "hover:bg-primary/10 hover:border-primary hover:text-primary"
              )}
              onClick={() => onTabChange(tab.key)}
            >
              {tab.icon && <span className="mr-1.5">{tab.icon}</span>}
              {tab.label}
              {tab.count !== undefined && tab.count > 0 && (
                <span className={cn(
                  "ml-1.5 text-xs px-1.5 py-0.5 rounded-full",
                  activeTab === tab.key 
                    ? "bg-primary-foreground/20" 
                    : "bg-primary/10"
                )}>
                  {tab.count}
                </span>
              )}
            </Button>
          ))}
        </div>
        <ScrollBar orientation="horizontal" className="invisible" />
      </ScrollArea>
    </div>
  );
};

export default MobileSectionTabs;
