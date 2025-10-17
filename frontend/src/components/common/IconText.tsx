
import React from 'react';

interface IconTextProps {
  icon: React.ComponentType<any>;
  text: string | number;
  className?: string;
  iconClassName?: string;
  textClassName?: string;
}

const IconText: React.FC<IconTextProps> = ({
  icon: Icon,
  text,
  className = "",
  iconClassName = "h-4 w-4 mr-1",
  textClassName = ""
}) => {
  return (
    <div className={`flex items-center ${className}`}>
      <Icon className={iconClassName} />
      <span className={textClassName}>{text}</span>
    </div>
  );
};

export default IconText;
