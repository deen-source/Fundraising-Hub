import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { StarField } from '@/components/StarField';
import { ArrowRight, Sparkles } from 'lucide-react';

const Index = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate('/dashboard');
      }
    };
    checkAuth();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      <StarField />
      
      <div className="absolute inset-0 bg-gradient-hero pointer-events-none" />

      <div className="relative z-10 text-center max-w-4xl mx-auto px-4">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-8">
          <Sparkles className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium">AI-Powered Investment Tools</span>
        </div>

        <h1 className="text-6xl md:text-7xl font-bold mb-6 leading-tight">
          The Complete{' '}
          <span className="bg-gradient-to-r from-primary via-primary-glow to-primary bg-clip-text text-transparent animate-glow">
            Founder Toolkit
          </span>{' '}
          for Raising Investment
        </h1>

        <p className="text-xl text-muted-foreground mb-12 max-w-2xl mx-auto">
          Term sheet analysis, metric benchmarks, SAFE calculators, and more—all powered by AI
          to help you make smarter fundraising decisions.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            size="lg"
            onClick={() => navigate('/auth')}
            className="text-lg px-8 py-6 shadow-glow hover:shadow-glow/80 transition-all"
          >
            Get Started
            <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
          <Button
            size="lg"
            variant="outline"
            onClick={() => navigate('/dashboard')}
            className="text-lg px-8 py-6"
          >
            View Tools
          </Button>
        </div>

        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
          <div className="p-6 rounded-lg glass-card border-primary/20">
            <div className="text-4xl font-bold text-primary mb-2">8+</div>
            <div className="text-sm text-muted-foreground">Professional Tools</div>
          </div>
          <div className="p-6 rounded-lg glass-card border-primary/20">
            <div className="text-4xl font-bold text-primary mb-2">AI</div>
            <div className="text-sm text-muted-foreground">Powered Analysis</div>
          </div>
          <div className="p-6 rounded-lg glass-card border-primary/20">
            <div className="text-4xl font-bold text-primary mb-2">24/7</div>
            <div className="text-sm text-muted-foreground">Available Access</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
