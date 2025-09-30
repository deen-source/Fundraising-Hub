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
    gradient: 'from-blue-500/10 to-cyan-500/10',
    iconGradient: 'from-blue-500 to-cyan-500',
    value: '98%',
    metric: 'accuracy',
  },
  {
    id: 'benchmarks',
    title: 'Metric Benchmarks',
    description: 'Compare your metrics against industry standards',
    icon: TrendingUp,
    path: '/tools/benchmarks',
    gradient: 'from-purple-500/10 to-pink-500/10',
    iconGradient: 'from-purple-500 to-pink-500',
    value: '50K+',
    metric: 'startups',
  },
  {
    id: 'safe-calculator',
    title: 'SAFE Note Calculator',
    description: 'Calculate SAFE note conversions and dilution',
    icon: Calculator,
    path: '/tools/safe-calculator',
    gradient: 'from-green-500/10 to-emerald-500/10',
    iconGradient: 'from-green-500 to-emerald-500',
    value: 'Instant',
    metric: 'results',
  },
  {
    id: 'cap-table',
    title: 'Cap Table Simulator',
    description: 'Visualize ownership and dilution scenarios',
    icon: PieChart,
    path: '/tools/cap-table',
    gradient: 'from-orange-500/10 to-red-500/10',
    iconGradient: 'from-orange-500 to-red-500',
    value: 'Live',
    metric: 'modeling',
  },
  {
    id: 'valuation',
    title: 'Valuation Calculator',
    description: 'Determine your startup valuation',
    icon: DollarSign,
    path: '/tools/valuation',
    gradient: 'from-indigo-500/10 to-blue-500/10',
    iconGradient: 'from-indigo-500 to-blue-500',
    value: '3',
    metric: 'methods',
  },
  {
    id: 'pitch-deck',
    title: 'Pitch Deck Analyzer',
    description: 'Get AI feedback on your pitch deck',
    icon: FileText,
    path: '/tools/pitch-deck',
    gradient: 'from-pink-500/10 to-rose-500/10',
    iconGradient: 'from-pink-500 to-rose-500',
    value: 'AI',
    metric: 'powered',
  },
  {
    id: 'dilution',
    title: 'Dilution Calculator',
    description: 'Calculate ownership dilution across rounds',
    icon: BarChart3,
    path: '/tools/dilution',
    gradient: 'from-teal-500/10 to-cyan-500/10',
    iconGradient: 'from-teal-500 to-cyan-500',
    value: '10+',
    metric: 'rounds',
  },
  {
    id: 'timeline',
    title: 'Fundraising Timeline',
    description: 'Plan your fundraising journey',
    icon: Calendar,
    path: '/tools/timeline',
    gradient: 'from-violet-500/10 to-purple-500/10',
    iconGradient: 'from-violet-500 to-purple-500',
    value: '12-16',
    metric: 'weeks',
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
                  className={`group hover:shadow-xl transition-all duration-300 hover:scale-[1.02] bg-gradient-to-br ${tool.gradient} border-2 hover:border-primary/20 overflow-hidden relative cursor-pointer`}
                  onClick={() => navigate(tool.path)}
                >
                  {/* Background decoration */}
                  <div className="absolute top-0 right-0 w-32 h-32 opacity-20 group-hover:opacity-30 transition-opacity">
                    <div className={`w-full h-full bg-gradient-to-br ${tool.iconGradient} blur-3xl`} />
                  </div>

                  <CardHeader className="relative">
                    <div className="flex items-start justify-between">
                      {/* Icon */}
                      <div className={`inline-flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br ${tool.iconGradient} shadow-lg`}>
                        <Icon className="h-7 w-7 text-white" />
                      </div>

                      {/* Stat */}
                      <div className="text-right">
                        <div className={`text-3xl font-bold bg-gradient-to-br ${tool.iconGradient} bg-clip-text text-transparent`}>
                          {tool.value}
                        </div>
                        <div className="text-xs text-muted-foreground font-medium mt-1">
                          {tool.metric}
                        </div>
                      </div>
                    </div>

                    <CardTitle className="text-lg mt-4">{tool.title}</CardTitle>
                    <CardDescription className="mt-2">{tool.description}</CardDescription>
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
