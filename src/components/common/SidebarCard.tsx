
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface SidebarCardProps {
  title: string;
  icon?: React.ComponentType<any>;
  children: React.ReactNode;
  className?: string;
}

const SidebarCard: React.FC<SidebarCardProps> = ({ 
  title, 
  icon: Icon, 
  children, 
  className = "" 
}) => {
  return (
    <Card className={`shadow-card w-full ${className}`}>
      <CardHeader className="px-3 py-3 sm:px-4 sm:py-4 md:px-6 md:py-6">
        <CardTitle className="flex items-center text-base sm:text-lg">
          {Icon && <Icon className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-primary flex-shrink-0" />}
          <span className="flex-1">{title}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="px-3 py-3 sm:px-4 sm:py-4 md:px-6 md:pt-0">
        {children}
      </CardContent>
    </Card>
  );
};

export default SidebarCard;
