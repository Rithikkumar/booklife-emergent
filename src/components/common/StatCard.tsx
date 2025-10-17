
import React from 'react';
import { StatCardProps } from '@/types';

const StatCard: React.FC<StatCardProps> = ({ 
  title, 
  value, 
  icon: Icon, 
  description, 
  gradient = false 
}) => {
  return (
    <div className="p-6 text-center">
      <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 ${
        gradient ? 'bg-gradient-primary' : 'bg-primary/10'
      }`}>
        <Icon className={`h-6 w-6 ${gradient ? 'text-primary-foreground' : 'text-primary'}`} />
      </div>
      <h3 className="text-2xl font-bold mb-2">{value}</h3>
      <p className="text-muted-foreground">{description || title}</p>
    </div>
  );
};

export default StatCard;
