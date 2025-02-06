export interface Book {
  id: number;
  title: string;
  author: string;
  lentTo: string | null;
  imageUrl: string;
}