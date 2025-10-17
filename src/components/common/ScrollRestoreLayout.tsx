import React from 'react';
import PageLayout from './PageLayout';
import { useScrollRestoration } from '@/hooks/useScrollRestoration';

interface ScrollRestoreLayoutProps {
  children: React.ReactNode;
  className?: string;
  scrollKey?: string;
  ready?: boolean;
}

const ScrollRestoreLayout: React.FC<ScrollRestoreLayoutProps> = ({ children, className, scrollKey, ready = true }) => {
  useScrollRestoration({ key: scrollKey, ready });

  return (
    <PageLayout className={className}>
      {children}
    </PageLayout>
  );
};

export default ScrollRestoreLayout;