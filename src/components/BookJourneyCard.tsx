import React from 'react';
import { motion } from 'framer-motion';
import { MapPin, Users, Clock } from 'lucide-react';
import { BookCover } from '@/utils/bookCovers';

interface BookJourneyCardProps {
  book: {
    id: string;
    title: string;
    author: string;
    owners: number;
    countries: number;
    journeyYears: number;
    latestCity: string;
    coverColor?: string;
  };
}

const BookJourneyCard: React.FC<BookJourneyCardProps> = ({ book }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-lg shadow-card hover:shadow-elegant transition-all duration-300 p-6"
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
          <h3 className="font-serif font-medium text-lg text-foreground mb-1 line-clamp-1">
            {book.title}
          </h3>
          <p className="text-muted-foreground mb-3">{book.author}</p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin size={14} />
              <span>{book.countries} countries</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Users size={14} />
              <span>{book.owners} owners</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock size={14} />
              <span>{book.journeyYears} years</span>
            </div>
          </div>
          
          <div className="mt-3 text-sm text-muted-foreground">
            <span>Latest: </span>
            <span className="text-foreground font-medium">{book.latestCity}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default BookJourneyCard;