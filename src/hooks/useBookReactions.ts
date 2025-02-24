
import { useAuth } from '@/components/AuthProvider';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';

export function useBookReactions(bookId: number) {
  const { toast } = useToast();
  const { user } = useAuth();

  const handleReaction = async (reactionName: string) => {
    if (!user) return;
    
    try {
      const { data: existingReaction, error: fetchError } = await supabase
        .from('book_reactions')
        .select('id')
        .eq('book_id', bookId)
        .eq('user_id', user.id)
        .eq('reaction', reactionName)
        .maybeSingle();

      if (fetchError) throw fetchError;

      if (existingReaction) {
        const { error: deleteError } = await supabase
          .from('book_reactions')
          .delete()
          .eq('id', existingReaction.id);

        if (deleteError) throw deleteError;

        toast({
          title: "Success",
          description: "Reaction removed!",
        });
      } else {
        const { error: insertError } = await supabase
          .from('book_reactions')
          .insert([
            {
              book_id: bookId,
              user_id: user.id,
              reaction: reactionName
            }
          ]);

        if (insertError) throw insertError;

        toast({
          title: "Success",
          description: "Reaction added!",
        });
      }
    } catch (error) {
      console.error('Error toggling reaction:', error);
      toast({
        title: "Error",
        description: "Failed to update reaction. Please try again.",
        variant: "destructive",
      });
    }
  };

  return { handleReaction };
}
