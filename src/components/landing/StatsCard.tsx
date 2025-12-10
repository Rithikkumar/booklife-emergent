import React, { useEffect, useState } from 'react';
import { LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface StatsCardProps {
  number: number;
  label: string;
  icon: LucideIcon;
}

const StatsCard: React.FC<StatsCardProps> = ({ number, label, icon: Icon }) => {
  const [displayNumber, setDisplayNumber] = useState(0);

  useEffect(() => {
    const duration = 2000; // 2 seconds
    const steps = 60;
    const increment = number / steps;
    let current = 0;

    const timer = setInterval(() => {
      current += increment;
      if (current >= number) {
        setDisplayNumber(number);
        clearInterval(timer);
      } else {
        setDisplayNumber(Math.floor(current));
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [number]);

  return (
    <Card className="group relative hover:shadow-2xl transition-all duration-500 hover:-translate-y-3 border-2 border-primary/30 hover:border-primary/50 animate-fade-in bg-gradient-to-br from-background via-muted/20 to-background overflow-hidden">
      {/* Background Glow */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-secondary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-lg blur opacity-0 group-hover:opacity-75 transition-opacity duration-500" />
      
      <CardContent className="p-10 text-center relative z-10">
        {/* Icon with Glow Effect */}
        <div className="relative mb-6">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/40 to-secondary/40 rounded-full blur-2xl group-hover:blur-3xl transition-all duration-500" />
          <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-primary/30 to-secondary/30 flex items-center justify-center mx-auto group-hover:scale-110 group-hover:rotate-12 transition-all duration-500 border-2 border-primary/40 shadow-xl">
            <Icon className="h-10 w-10 text-primary group-hover:scale-110 transition-transform duration-500" />
          </div>
        </div>

        {/* Number */}
        <div className="text-5xl md:text-6xl font-extrabold mb-3 bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent drop-shadow-sm">
          {displayNumber.toLocaleString()}+
        </div>

        {/* Label */}
        <div className="text-base font-semibold text-muted-foreground uppercase tracking-wider">
          {label}
        </div>

        {/* Decorative Line */}
        <div className="mt-6 h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent scale-x-0 group-hover:scale-x-100 transition-transform duration-500 rounded-full" />
      </CardContent>
    </Card>
  );
};

export default StatsCard;
