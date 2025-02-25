
import { supabase } from '@/integrations/supabase/client';

export async function checkApprovalStatus(userId: string) {
  try {
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();  // Changed from .single() to .maybeSingle()

    if (profileError) {
      console.error('Error fetching approval status:', profileError);
      return { approved: false, isAdmin: false };
    }

    // If no profile exists yet, return not approved
    if (!profile) {
      console.log('No profile found for user, creating one...');
      // Create a profile for the user if it doesn't exist
      const { error: insertError } = await supabase
        .from('profiles')
        .insert([
          {
            id: userId,
            is_approved: false,
            email: (await supabase.auth.getUser()).data.user?.email
          }
        ]);
      
      if (insertError) {
        console.error('Error creating profile:', insertError);
      }
      return { approved: false, isAdmin: false };
    }

    // Directly query admin_users table
    const { data: adminData, error: adminError } = await supabase
      .from('admin_users')
      .select('id')
      .eq('id', userId)
      .maybeSingle();

    if (adminError) {
      console.error('Error checking admin status:', adminError);
      return { approved: !!profile?.is_approved, isAdmin: false };
    }

    return {
      approved: !!profile?.is_approved,
      isAdmin: !!adminData
    };
  } catch (error) {
    console.error('Error in checkApprovalStatus:', error);
    return { approved: false, isAdmin: false };
  }
}
