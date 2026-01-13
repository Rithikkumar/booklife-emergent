import React from 'react';
import { motion } from 'framer-motion';
import { Users } from 'lucide-react';
import { BookCover } from '@/utils/bookCovers';

interface BookJourneyCardProps {
  book: {
    id: string;
    title: string;
    author: string;
    owners: number;  // This is the journey_count - number of times this book has been registered
  };
}

const BookJourneyCard: React.FC<BookJourneyCardProps> = ({ book }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-lg shadow-card hover:shadow-elegant transition-all duration-300 p-4"
    >
      <div className="flex gap-4">
        {/* Book Cover */}
        <div className="relative w-16 h-24 rounded-md flex-shrink-0 overflow-hidden">
          <BookCover 
            title={book.title}
            author={book.author}
            size="M"
            className="w-full h-full"
          />
        </div>
        
        {/* Book Info */}
        <div className="flex-1 min-w-0">
          <h3 className="font-serif font-medium text-lg text-foreground mb-1 line-clamp-2">
            {book.title}
          </h3>
          <p className="text-muted-foreground text-sm mb-3 line-clamp-1">{book.author}</p>
          
          {book.owners > 1 && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Users size={14} className="text-primary" />
              <span>{book.owners} {book.owners === 1 ? 'owner' : 'owners'} in journey</span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default BookJourneyCard;
