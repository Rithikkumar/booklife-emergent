import React from 'react';
import { LucideIcon } from 'lucide-react';

interface TimelineStepProps {
  stepNumber: number;
  title: string;
  description: string;
  icon: LucideIcon;
}

const TimelineStep: React.FC<TimelineStepProps> = ({ stepNumber, title, description, icon: Icon }) => {
  return (
    <div className="relative flex flex-col items-center text-center group animate-fade-in p-8 rounded-2xl bg-gradient-to-br from-background to-muted/30 border-2 border-primary/20 hover:border-primary/40 transition-all duration-500 hover:shadow-2xl hover:-translate-y-2">
      {/* Background Glow */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-secondary/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      <div className="relative z-10 space-y-4">
        {/* Step Number Circle with Glow */}
        <div className="relative mx-auto">
          <div className="absolute inset-0 bg-gradient-to-br from-primary to-secondary rounded-full blur-xl group-hover:blur-2xl transition-all duration-500 opacity-75" />
          <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-2xl group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 border-4 border-background">
            <span className="text-4xl font-extrabold text-primary-foreground">{stepNumber}</span>
          </div>
        </div>

        {/* Icon Badge */}
        <div className="inline-flex w-14 h-14 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 items-center justify-center group-hover:scale-110 group-hover:-rotate-3 transition-all duration-500 border-2 border-primary/30 shadow-lg">
          <Icon className="h-7 w-7 text-primary" />
        </div>

        {/* Content */}
        <h3 className="text-2xl font-bold group-hover:text-primary transition-colors duration-300 pt-2">
          {title}
        </h3>
        <p className="text-muted-foreground leading-relaxed max-w-xs mx-auto text-base">
          {description}
        </p>
      </div>

      {/* Connector Arrow (hidden on mobile, shown on desktop between steps) */}
      {stepNumber < 3 && (
        <div className="hidden lg:block absolute top-12 left-[calc(100%+0.5rem)] w-[calc(100%-4rem)]">
          <div className="h-0.5 bg-gradient-to-r from-primary via-secondary to-primary/20 relative">
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 rotate-45 border-r-2 border-t-2 border-primary" />
          </div>
        </div>
      )}
    </div>
  );
};

export default TimelineStep;
