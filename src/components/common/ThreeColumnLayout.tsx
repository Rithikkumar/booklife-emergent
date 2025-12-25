
import React from 'react';

interface ThreeColumnLayoutProps {
  leftSidebar: React.ReactNode;
  centerContent: React.ReactNode;
  rightSidebar: React.ReactNode;
  leftColSpan?: number;
  centerColSpan?: number;
  rightColSpan?: number;
  hideLeftOnMobile?: boolean;
}

const ThreeColumnLayout: React.FC<ThreeColumnLayoutProps> = ({
  leftSidebar,
  centerContent,
  rightSidebar,
  leftColSpan = 3,
  centerColSpan = 6,
  rightColSpan = 3,
  hideLeftOnMobile = false
}) => {
  // Use fixed classes instead of dynamic ones for Tailwind CSS
  const getLeftColClass = () => {
    switch(leftColSpan) {
      case 2: return 'lg:col-span-2';
      case 3: return 'lg:col-span-3';
      case 4: return 'lg:col-span-4';
      default: return 'lg:col-span-3';
    }
  };

  const getCenterColClass = () => {
    switch(centerColSpan) {
      case 4: return 'lg:col-span-4';
      case 5: return 'lg:col-span-5';
      case 6: return 'lg:col-span-6';
      case 7: return 'lg:col-span-7';
      case 8: return 'lg:col-span-8';
      default: return 'lg:col-span-6';
    }
  };

  const getRightColClass = () => {
    switch(rightColSpan) {
      case 2: return 'lg:col-span-2';
      case 3: return 'lg:col-span-3';
      case 4: return 'lg:col-span-4';
      default: return 'lg:col-span-3';
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-4 md:gap-6 lg:gap-8">
      {/* Center content first on mobile & tablet */}
      <div className={`order-1 lg:order-2 min-w-0 ${getCenterColClass()}`}>
        {centerContent}
      </div>
      
      {/* Left sidebar - hidden on mobile if hideLeftOnMobile is true */}
      <div className={`${hideLeftOnMobile ? 'hidden lg:block' : ''} order-2 lg:order-1 min-w-0 ${getLeftColClass()} max-w-full lg:max-w-sm`}>
        <div className="lg:sticky lg:top-24 pb-2 lg:pb-0">
          {leftSidebar}
        </div>
      </div>
      
      {/* Right sidebar visible and stacked on mobile/tablet; sticky on desktop */}
      <div className={`order-3 lg:order-3 min-w-0 ${getRightColClass()} max-w-full lg:max-w-sm`}>
        <div className="lg:sticky lg:top-24 space-y-3 sm:space-y-4 lg:space-y-6 pb-2 lg:pb-0">
          {rightSidebar}
        </div>
      </div>
    </div>
  );
};

export default ThreeColumnLayout;
