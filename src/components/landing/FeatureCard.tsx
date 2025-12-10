import React from 'react';
import { LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ icon: Icon, title, description }) => {
  return (
    <Card className="group relative hover:shadow-2xl transition-all duration-500 hover:-translate-y-3 border-2 border-primary/20 hover:border-primary/40 animate-fade-in bg-gradient-to-br from-background to-muted/30 overflow-hidden">
      {/* Gradient Overlay on Hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      <CardContent className="p-8 relative z-10">
        {/* Icon Container */}
        <div className="relative mb-6">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/30 to-secondary/30 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-500 opacity-0 group-hover:opacity-100" />
          <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/25 to-secondary/25 flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 border-2 border-primary/30 shadow-lg">
            <Icon className="h-8 w-8 text-primary group-hover:scale-110 transition-transform duration-500" />
          </div>
        </div>

        {/* Content */}
        <h3 className="text-2xl font-bold mb-3 group-hover:text-primary transition-colors duration-300">
          {title}
        </h3>
        <p className="text-muted-foreground leading-relaxed text-base">
          {description}
        </p>

        {/* Decorative Element */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent scale-x-0 group-hover:scale-x-100 transition-transform duration-500" />
      </CardContent>
    </Card>
  );
};

export default FeatureCard;
