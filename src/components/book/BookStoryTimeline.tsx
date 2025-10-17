import React from 'react';
import { motion } from 'framer-motion';
import { Clock, MapPin, User } from 'lucide-react';
import { Link } from 'react-router-dom';
import StoryCard from './StoryCard';

interface TimelineEntry {
  id: string;
  title: string;
  author: string;
  city: string;
  notes: string;
  created_at: string;
  profile: {
    username: string;
    display_name: string | null;
  };
}

interface BookStoryTimelineProps {
  entries: TimelineEntry[];
  loading?: boolean;
}

const BookStoryTimeline: React.FC<BookStoryTimelineProps> = ({ entries, loading = false }) => {
  if (loading) {
    return (
      <div className="space-y-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="animate-pulse">
            <div className="flex gap-4">
              <div className="w-12 h-12 bg-muted rounded-full" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-muted rounded w-1/4" />
                <div className="h-20 bg-muted rounded" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="text-center py-12">
        <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">No stories in this book's journey yet.</p>
        <p className="text-sm text-muted-foreground mt-2">
          Stories appear when owners share their experiences with this book.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-2 mb-6">
        <Clock className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold">Story Timeline</h3>
        <span className="text-sm text-muted-foreground">({entries.length} stories)</span>
      </div>
      
      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-5 sm:left-6 top-0 bottom-0 w-0.5 bg-border" />
        
        {entries.map((entry, index) => (
          <motion.div
            key={entry.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            className="relative flex gap-3 sm:gap-4 lg:gap-6 pb-6 sm:pb-8"
          >
            {/* Timeline dot */}
            <div className="relative z-10 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-primary flex items-center justify-center text-primary-foreground font-semibold text-sm sm:text-base shadow-md flex-shrink-0">
              {index + 1}
            </div>
            
            {/* Content */}
            <div className="flex-1 min-w-0 -mt-1 sm:-mt-2">
              <StoryCard
                bookId={entry.id}
                entry={entry}
                showComments={true}
              />
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default BookStoryTimeline;