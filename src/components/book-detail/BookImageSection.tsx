
import { Book } from "@/types";
import { formatDistanceToNow } from "date-fns";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useState } from "react";

interface BookImageSectionProps {
  book: Book;
}

export function BookImageSection({ book }: BookImageSectionProps) {
  const [showFullImage, setShowFullImage] = useState(false);

  return (
    <>
      <div className="flex flex-col md:flex-row md:gap-4">
        <div className="bg-white p-4 rounded-lg">
          <img
            src={book.imageUrl}
            alt={book.title}
            className="w-full md:w-48 h-64 md:h-64 object-contain cursor-zoom-in transition-transform hover:scale-105"
            onClick={() => setShowFullImage(true)}
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = "https://images.unsplash.com/photo-1488590528505-98d2b5aba04b";
            }}
          />
        </div>
        <div className="flex-1 space-y-4 mt-4 md:mt-0">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-muted-foreground">
              <span>📝</span>
              <span>{book.author}</span>
            </div>
            
            <div className="flex items-center gap-2 text-muted-foreground">
              <span>📚</span>
              <span className="capitalize">{book.bookType}</span>
            </div>

            <div className="text-sm text-muted-foreground/60 pl-6">
              Added by {book.addedBy || 'Unknown'}
              {book.createdAt && (
                <span className="ml-1">
                  ({formatDistanceToNow(new Date(book.createdAt), { addSuffix: true })})
                </span>
              )}
            </div>
          </div>

          <Accordion type="single" collapsible className="w-full">
            {book.bookDescription && (
              <AccordionItem value="book-description">
                <AccordionTrigger className="text-sm">
                  About the Book
                </AccordionTrigger>
                <AccordionContent>
                  <p className="text-sm text-muted-foreground">
                    {book.bookDescription}
                  </p>
                </AccordionContent>
              </AccordionItem>
            )}

            {book.authorDescription && (
              <AccordionItem value="author-description">
                <AccordionTrigger className="text-sm">
                  About the Author
                </AccordionTrigger>
                <AccordionContent>
                  <p className="text-sm text-muted-foreground">
                    {book.authorDescription}
                  </p>
                </AccordionContent>
              </AccordionItem>
            )}

            {book.aiSummary && (
              <AccordionItem value="ai-summary">
                <AccordionTrigger className="text-sm">
                  AI Summary
                </AccordionTrigger>
                <AccordionContent>
                  <p className="text-sm italic text-muted-foreground">
                    "{book.aiSummary}"
                  </p>
                </AccordionContent>
              </AccordionItem>
            )}
          </Accordion>

          {book.lentTo && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-muted-foreground">
                <span>👤</span>
                <span>
                  Borrowed by: {book.lentTo}
                  {book.loanDate && (
                    <span className="text-sm text-muted-foreground/60 ml-1">
                      ({formatDistanceToNow(new Date(book.loanDate), { addSuffix: true })})
                    </span>
                  )}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      <Dialog open={showFullImage} onOpenChange={setShowFullImage}>
        <DialogContent className="max-w-4xl max-h-[90vh] p-0">
          <img
            src={book.imageUrl}
            alt={book.title}
            className="w-full h-full object-contain"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = "https://images.unsplash.com/photo-1488590528505-98d2b5aba04b";
            }}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
