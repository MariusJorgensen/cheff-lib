
export interface Book {
  id: number;
  title: string;
  author: string;
  lentTo: string | null;
  imageUrl: string;
  averageRating: number | null;
  aiSummary: string | null;
  userRating?: number | null;
  reactions?: { [key: string]: number };
  userReactions?: string[];
  location: 'Stockholm 🇸🇪' | 'Oslo 🇧🇻';
}

export interface Comment {
  id: number;
  comment: string;
  createdAt: string;
  user: {
    fullName: string | null;
    email: string;
  };
}

