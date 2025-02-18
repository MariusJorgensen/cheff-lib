
import { supabase } from '@/integrations/supabase/client';

export async function checkApprovalStatus(userId: string) {
  try {
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (profileError) {
      console.error('Error fetching approval status:', profileError);
      return { approved: false, isAdmin: false };
    }

    const { data: adminStatus, error: adminError } = await supabase
      .rpc('is_admin', { user_id: userId });

    if (adminError) {
      console.error('Error checking admin status:', adminError);
    }

    return {
      approved: !!profile?.is_approved,
      isAdmin: !!adminStatus
    };
  } catch (error) {
    console.error('Error in checkApprovalStatus:', error);
    return { approved: false, isAdmin: false };
  }
}
