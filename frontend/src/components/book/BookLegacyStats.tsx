import React from 'react';
import { motion } from 'framer-motion';
import { Globe, Users, MessageCircle, Heart, MapPin, Clock, Eye } from 'lucide-react';
import StatCard from '@/components/common/StatCard';
import { JourneyPoint } from '@/hooks/useBookJourney';

interface BookLegacyStatsProps {
  journeyPoints: JourneyPoint[];
  followersCount: number;
  totalComments: number;
  totalReactions: number;
}

const BookLegacyStats: React.FC<BookLegacyStatsProps> = ({
  journeyPoints,
  followersCount,
  totalComments,
  totalReactions,
}) => {
  // Calculate statistics
  const uniqueCountries = [...new Set(journeyPoints.map(point => point.country))].length;
  const uniqueOwners = [...new Set(journeyPoints.map(point => point.owner.username))].length;
  const journeyStartDate = journeyPoints.length > 0 
    ? new Date(Math.min(...journeyPoints.map(p => new Date(p.date).getTime())))
    : null;
  
  const journeyDays = journeyStartDate 
    ? Math.ceil((Date.now() - journeyStartDate.getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  // Calculate total distance (simplified)
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const totalDistance = journeyPoints.reduce((total, point, index) => {
    if (index === 0) return 0;
    const prevPoint = journeyPoints[index - 1];
    return total + calculateDistance(
      prevPoint.coordinates[1],
      prevPoint.coordinates[0],
      point.coordinates[1],
      point.coordinates[0]
    );
  }, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <Globe className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold">Book Legacy & Impact</h3>
      </div>

      {/* Journey Statistics */}
      <div>
        <h4 className="font-medium mb-4 text-foreground">Journey Statistics</h4>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <StatCard
              title="Countries Visited"
              value={uniqueCountries}
              icon={Globe}
              description="Different countries this book has traveled to"
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <StatCard
              title="Unique Owners"
              value={uniqueOwners}
              icon={Users}
              description="People who have owned this book"
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <StatCard
              title="Journey Days"
              value={journeyDays}
              icon={Clock}
              description="Days since the journey began"
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <StatCard
              title="Distance Traveled"
              value={`${Math.round(totalDistance).toLocaleString()} km`}
              icon={MapPin}
              description="Approximate total distance"
            />
          </motion.div>
        </div>
      </div>

      {/* Community Engagement */}
      <div>
        <h4 className="font-medium mb-4 text-foreground">Community Engagement</h4>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <StatCard
              title="Journey Followers"
              value={followersCount}
              icon={Eye}
              description="People following this book's journey"
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <StatCard
              title="Story Comments"
              value={totalComments}
              icon={MessageCircle}
              description="Comments on journey stories"
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
          >
            <StatCard
              title="Story Reactions"
              value={totalReactions}
              icon={Heart}
              description="Reactions to journey stories"
            />
          </motion.div>
        </div>
      </div>

      {/* Journey Insights */}
      {journeyPoints.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="bg-gradient-to-r from-primary/5 to-secondary/5 rounded-lg p-6 border border-primary/10"
        >
          <h4 className="font-medium mb-3 text-foreground">Journey Insights</h4>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>• This book has created connections across {uniqueCountries} countries</p>
            <p>• {uniqueOwners} different people have shared their stories with this book</p>
            {totalDistance > 0 && (
              <p>• The book has traveled approximately {Math.round(totalDistance).toLocaleString()} kilometers</p>
            )}
            <p>• {followersCount} people are following this book's ongoing journey</p>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default BookLegacyStats;