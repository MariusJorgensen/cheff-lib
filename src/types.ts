
export interface Book {
  id: number;
  title: string;
  author: string;
  lentTo: string | null;
  imageUrl: string;
  averageRating: number | null;
  aiSummary: string | null;
  addedBy?: string | null;
  userRating?: number | null;
  reactions?: { [key: string]: number };
  userReactions?: string[];
  location: 'Stockholm 🇸🇪' | 'Oslo 🇧🇻';
  loanDate?: string | null;
  loans?: Array<{
    user_id: string;
    returned_at: string | null;
    lent_to: string | null;
    created_at: string;
  }>;
  bookDescription?: string | null;
  authorDescription?: string | null;
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
