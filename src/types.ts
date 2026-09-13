export interface DiaryEntry {
  id: string;
  text: string;
  imageUrls: string[];
  authorId: string;
  authorName: string;
  mood: string;
  isFavorite: boolean;
  stickers: string[];
  createdAt: any; // Firestore Timestamp
}

export const STICKERS = [
  { id: 'flower-1', emoji: '🌸' },
  { id: 'flower-2', emoji: '🌷' },
  { id: 'flower-3', emoji: '🌻' },
  { id: 'flower-4', emoji: '🌼' },
  { id: 'sparkles', emoji: '✨' },
  { id: 'butterfly', emoji: '🦋' },
  { id: 'star', emoji: '⭐' },
  { id: 'heart', emoji: '💖' },
  { id: 'camera', emoji: '📸' },
  { id: 'letter', emoji: '✉️' },
];

export const MOODS = [
  { emoji: '❤️', label: 'In Love' },
  { emoji: '😊', label: 'Happy' },
  { emoji: '🥺', label: 'Missing You' },
  { emoji: '🥰', label: 'Grateful' },
  { emoji: '🤔', label: 'Thoughtful' },
  { emoji: '😂', label: 'Laughing' },
  { emoji: '💤', label: 'Sleepy' },
];
