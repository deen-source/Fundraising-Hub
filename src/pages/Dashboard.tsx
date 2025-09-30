import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { StarField } from '@/components/StarField';
import { AuthGuard } from '@/components/AuthGuard';
import {
  FileCheck,
  TrendingUp,
  Calculator,
  PieChart,
  DollarSign,
  FileText,
  BarChart3,
  Calendar,
  LogOut,
} from 'lucide-react';

const tools = [
  {
    id: 'term-sheet',
    title: 'Term Sheet Checker',
    description: 'AI-powered analysis of investment terms',
    icon: FileCheck,
    path: '/tools/term-sheet',
    gradient: 'from-cyan-500 to-blue-500',
  },
  {
    id: 'benchmarks',
    title: 'Metric Benchmarks',
    description: 'Compare your metrics against industry standards',
    icon: TrendingUp,
    path: '/tools/benchmarks',
    gradient: 'from-emerald-500 to-teal-500',
  },
  {
    id: 'safe-calculator',
    title: 'SAFE Note Calculator',
    description: 'Calculate SAFE note conversions and dilution',
    icon: Calculator,
    path: '/tools/safe-calculator',
    gradient: 'from-violet-500 to-purple-500',
  },
  {
    id: 'cap-table',
    title: 'Cap Table Simulator',
    description: 'Visualize ownership and dilution scenarios',
    icon: PieChart,
    path: '/tools/cap-table',
    gradient: 'from-pink-500 to-rose-500',
  },
  {
    id: 'valuation',
    title: 'Valuation Calculator',
    description: 'Determine your startup valuation',
    icon: DollarSign,
    path: '/tools/valuation',
    gradient: 'from-amber-500 to-orange-500',
  },
  {
    id: 'pitch-deck',
    title: 'Pitch Deck Analyzer',
    description: 'Get AI feedback on your pitch deck',
    icon: FileText,
    path: '/tools/pitch-deck',
    gradient: 'from-indigo-500 to-blue-500',
  },
  {
    id: 'dilution',
    title: 'Dilution Calculator',
    description: 'Calculate ownership dilution across rounds',
    icon: BarChart3,
    path: '/tools/dilution',
    gradient: 'from-cyan-500 to-teal-500',
  },
  {
    id: 'timeline',
    title: 'Fundraising Timeline',
    description: 'Plan your fundraising journey',
    icon: Calendar,
    path: '/tools/timeline',
    gradient: 'from-green-500 to-emerald-500',
  },
];

const Dashboard = () => {
  const navigate = useNavigate();
  const [userName, setUserName] = useState('');

  useEffect(() => {
    const getUserName = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', user.id)
          .single();
        
        setUserName(profile?.full_name || user.email?.split('@')[0] || 'Founder');
      }
    };

    getUserName();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/auth');
  };

  return (
    <AuthGuard>
      <div className="min-h-screen relative">
        <StarField />
        
        <div className="absolute inset-0 bg-gradient-hero pointer-events-none" />

        <div className="relative z-10 container mx-auto px-4 py-8">
          <div className="flex justify-between items-center mb-12">
            <div>
              <h1 className="text-4xl font-bold mb-2">
                Welcome back, <span className="bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">{userName}</span>
              </h1>
              <p className="text-muted-foreground">
                Choose a tool to get started with your fundraising journey
              </p>
            </div>
            <Button variant="outline" onClick={handleSignOut} className="gap-2">
              <LogOut className="w-4 h-4" />
              Sign Out
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {tools.map((tool) => {
              const Icon = tool.icon;
              return (
                <Card
                  key={tool.id}
                  className="glass-card border-primary/20 hover:border-primary/40 transition-all duration-300 cursor-pointer group hover:shadow-glow"
                  onClick={() => navigate(tool.path)}
                >
                  <CardHeader>
                    <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${tool.gradient} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <CardTitle className="group-hover:text-primary transition-colors">
                      {tool.title}
                    </CardTitle>
                    <CardDescription>{tool.description}</CardDescription>
                  </CardHeader>
                </Card>
              );
            })}
          </div>

          <div className="mt-12">
            <Card className="glass-card border-primary/20">
              <CardHeader>
                <CardTitle>Quick Stats</CardTitle>
                <CardDescription>Your activity overview</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary mb-1">0</div>
                  <div className="text-sm text-muted-foreground">Saved Calculations</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary mb-1">0</div>
                  <div className="text-sm text-muted-foreground">Term Sheets Analyzed</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary mb-1">8</div>
                  <div className="text-sm text-muted-foreground">Tools Available</div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
};

export default Dashboard;
