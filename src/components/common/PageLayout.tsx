
import React from 'react';
import Navigation from "@/components/ui/navigation";

interface PageLayoutProps {
  children: React.ReactNode;
  className?: string;
}

const PageLayout: React.FC<PageLayoutProps> = ({ children, className = "" }) => {
  return (
    <div className="min-h-screen bg-background w-full">
      <Navigation />
      <div className={`pt-24 md:pt-28 pb-8 lg:pb-12 ${className}`}>
        <div className="container mx-auto px-1 sm:px-2 md:px-4 lg:px-6 max-w-7xl">
          {children}
        </div>
      </div>
    </div>
  );
};

export default PageLayout;
