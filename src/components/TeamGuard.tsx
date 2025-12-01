import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, ArrowLeft } from 'lucide-react';

interface TeamGuardProps {
  children: React.ReactNode;
  allowedDomains?: string[]; // e.g., ['@arconic.com', '@example.com']
}

export const TeamGuard = ({ children, allowedDomains = ['@arconic.com'] }: TeamGuardProps) => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);

  useEffect(() => {
    const checkAccess = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        navigate('/');
        return;
      }

      const currentUser = session.user;
      setUser(currentUser);

      // Check if user's email domain is in the allowed list
      const userEmail = currentUser.email || '';
      const isAllowed = allowedDomains.some(domain => userEmail.endsWith(domain));

      setHasAccess(isAllowed);
      setLoading(false);
    };

    checkAccess();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        navigate('/');
      } else {
        const currentUser = session.user;
        setUser(currentUser);

        const userEmail = currentUser.email || '';
        const isAllowed = allowedDomains.some(domain => userEmail.endsWith(domain));
        setHasAccess(isAllowed);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate, allowedDomains]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full border-2">
          <CardHeader>
            <div className="flex items-center gap-2 text-amber-600 mb-2">
              <AlertCircle className="w-5 h-5" />
              <CardTitle>Access Restricted</CardTitle>
            </div>
            <CardDescription>
              This feature is currently available to team members only.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              The Pitch Deck Analyzer is currently in beta and only available to Arconic team members.
              {user?.email && (
                <span className="block mt-2">
                  Your account: <span className="font-medium">{user.email}</span>
                </span>
              )}
            </p>
            <Button
              onClick={() => navigate('/dashboard')}
              className="w-full gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
};
