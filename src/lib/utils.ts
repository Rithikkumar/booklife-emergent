import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatGenreLabel(genre?: string | null): string {
  if (!genre) return '';
  const original = genre;
  const g = genre.toLowerCase().trim().replace(/\s+/g, ' ');

  const sciFiSynonyms = ['science-fiction', 'science fiction', 'sci-fi', 'sci fi', 'scifi'];
  const nonFictionSynonyms = ['non-fiction', 'non fiction', 'nonfiction'];

  if (sciFiSynonyms.includes(g)) return 'Sci-Fi';
  if (nonFictionSynonyms.includes(g)) return 'Non-Fiction';

  // Preserve hyphens for other genres if they exist
  if (original.includes('-')) {
    return original
      .split('-')
      .map(part => part.charAt(0).toUpperCase() + part.slice(1))
      .join('-');
  }

  // Default: title case with spaces
  return g
    .split(' ')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}
