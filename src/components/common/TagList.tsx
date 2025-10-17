
import React from 'react';
import { Badge } from "@/components/ui/badge";

interface TagListProps {
  tags: string[];
  variant?: 'default' | 'secondary' | 'outline';
  className?: string;
}

const TagList: React.FC<TagListProps> = ({ 
  tags, 
  variant = 'secondary', 
  className = "" 
}) => {
  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {tags.map((tag, index) => (
        <Badge key={index} variant={variant} className="text-xs">
          {tag}
        </Badge>
      ))}
    </div>
  );
};

export default TagList;
