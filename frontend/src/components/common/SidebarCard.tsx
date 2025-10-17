
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
      <CardHeader>
        <CardTitle className="flex items-center text-lg">
          {Icon && <Icon className="h-5 w-5 mr-2 text-primary" />}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {children}
      </CardContent>
    </Card>
  );
};

export default SidebarCard;
