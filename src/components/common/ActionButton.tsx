
import React from 'react';
import { Button } from "@/components/ui/button";
import { ActionButtonProps } from '@/types';

const ActionButton: React.FC<ActionButtonProps> = ({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  icon: Icon,
  disabled = false,
  className = ""
}) => {
  const getVariant = () => {
    switch (variant) {
      case 'primary':
        return 'default';
      case 'secondary':
        return 'secondary';
      case 'outline':
        return 'outline';
      default:
        return 'default';
    }
  };

  const getSize = () => {
    switch (size) {
      case 'sm':
        return 'sm';
      case 'lg':
        return 'lg';
      default:
        return 'default';
    }
  };

  return (
    <Button
      variant={getVariant()}
      size={getSize()}
      onClick={onClick}
      disabled={disabled}
      className={`${variant === 'primary' ? 'bg-gradient-primary hover:shadow-glow' : ''} ${className}`}
    >
      {Icon && <Icon className="h-4 w-4 mr-2" />}
      {children}
    </Button>
  );
};

export default ActionButton;
