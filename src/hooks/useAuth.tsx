
import { useState, useEffect, createContext, useContext } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signInWithAzure: () => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  userRole: string | null;
  userProfile: any;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    console.log('Setting up auth state listener...');
    
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email);
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Use setTimeout to avoid blocking the auth state change
          setTimeout(async () => {
            try {
              const { data: profile } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', session.user.id)
                .single();
              
              if (profile) {
                // Always set ahmualotaibi@flynas.com as admin
                const finalRole = session.user.email === 'ahmualotaibi@flynas.com' ? 'admin' : (profile.role || 'member');
                
                // Update role in database if needed
                if (session.user.email === 'ahmualotaibi@flynas.com' && profile.role !== 'admin') {
                  await supabase
                    .from('profiles')
                    .update({ role: 'admin' })
                    .eq('id', session.user.id);
                }
                
                setUserRole(finalRole);
                setUserProfile({ ...profile, role: finalRole });
              } else {
                // Create profile if it doesn't exist
                const newRole = session.user.email === 'ahmualotaibi@flynas.com' ? 'admin' : 'member';
                const { data: newProfile } = await supabase
                  .from('profiles')
                  .insert({
                    id: session.user.id,
                    email: session.user.email!,
                    full_name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0],
                    role: newRole
                  })
                  .select()
                  .single();
                
                if (newProfile) {
                  setUserRole(newRole);
                  setUserProfile(newProfile);
                }
              }
            } catch (error) {
              console.error('Error fetching/creating profile:', error);
              setUserRole('member');
            }
          }, 0);
        } else {
          setUserRole(null);
          setUserProfile(null);
        }
        
        // Always set loading to false after processing
        setLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('Initial session check:', session?.user?.email);
      if (!session) {
        setLoading(false);
      }
      // Don't set session here as it will be handled by the listener
    });

    return () => {
      console.log('Cleaning up auth subscription');
      subscription.unsubscribe();
    };
  }, []);

  const signInWithAzure = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'azure',
        options: {
          redirectTo: `${window.location.origin}/`
        }
      });

      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
        setLoading(false);
        return { error: error.message };
      }

      return {};
    } catch (error: any) {
      setLoading(false);
      return { error: error.message };
    }
  };

  const signOut = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Signed out successfully!",
      });
    }
    setLoading(false);
  };

  return (
    <AuthContext.Provider value={{
      user,
      session,
      loading,
      signInWithAzure,
      signOut,
      userRole,
      userProfile
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
