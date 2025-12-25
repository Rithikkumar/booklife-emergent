import React from 'react';
import { Skeleton } from "@/components/ui/skeleton";

interface ClassStatsCardProps {
  stats: {
    classesJoined: number;
    hoursLearned: number;
    hostedClasses: number;
    completedClasses: number;
  };
  loading: boolean;
}

const ClassStatsCard: React.FC<ClassStatsCardProps> = ({ stats, loading }) => {
  return (
    <div className="p-4 bg-card rounded-lg shadow-card">
      <h3 className="font-semibold mb-3">Your Learning</h3>
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Classes Joined</span>
          {loading ? (
            <Skeleton className="h-4 w-8" />
          ) : (
            <span className="font-medium">{stats.classesJoined}</span>
          )}
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Hours Learned</span>
          {loading ? (
            <Skeleton className="h-4 w-8" />
          ) : (
            <span className="font-medium">{stats.hoursLearned}</span>
          )}
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Classes Hosted</span>
          {loading ? (
            <Skeleton className="h-4 w-8" />
          ) : (
            <span className="font-medium">{stats.hostedClasses}</span>
          )}
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Completed</span>
          {loading ? (
            <Skeleton className="h-4 w-8" />
          ) : (
            <span className="font-medium">{stats.completedClasses}</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default ClassStatsCard;
