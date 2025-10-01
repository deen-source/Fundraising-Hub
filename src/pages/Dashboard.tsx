import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { StarField } from '@/components/StarField';
import { AuthGuard } from '@/components/AuthGuard';
import { Badge } from '@/components/ui/badge';
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
  CheckCircle2,
  Target,
  Users,
  FolderOpen,
  FileStack,
  Mic,
} from 'lucide-react';

const toolsByStage = {
  preparation: [
    {
      id: 'valuation',
      title: 'Valuation Calculator',
      description: 'Determine your startup valuation',
      icon: DollarSign,
      path: '/tools/valuation',
      dataKey: 'hasValuation',
    },
    {
      id: 'benchmarks',
      title: 'Metric Benchmarks',
      description: 'Compare against industry standards',
      icon: TrendingUp,
      path: '/tools/benchmarks',
      dataKey: 'hasBenchmarks',
    },
    {
      id: 'pitch-deck',
      title: 'Pitch Deck Analyzer',
      description: 'Get AI feedback on your pitch deck',
      icon: FileText,
      path: '/tools/pitch-deck',
      dataKey: 'hasPitchDeck',
    },
    {
      id: 'document-templates',
      title: 'Document Templates',
      description: 'Legal & fundraising templates',
      icon: FileStack,
      path: '/tools/document-templates',
      dataKey: 'hasTemplates',
    },
    {
      id: 'practice-pitching',
      title: 'Practice Pitching',
      description: 'Practice your pitch with AI investor',
      icon: Mic,
      path: '/tools/practice-pitching',
      dataKey: 'hasPractice',
    },
  ],
  structuring: [
    {
      id: 'safe-calculator',
      title: 'SAFE Calculator',
      description: 'Calculate SAFE note conversions',
      icon: Calculator,
      path: '/tools/safe-calculator',
      dataKey: 'hasSafe',
    },
    {
      id: 'cap-table',
      title: 'Cap Table Manager',
      description: 'Visualize ownership and dilution',
      icon: PieChart,
      path: '/tools/cap-table',
      dataKey: 'hasCapTable',
    },
    {
      id: 'dilution',
      title: 'Dilution Calculator',
      description: 'Calculate ownership across rounds',
      icon: BarChart3,
      path: '/tools/dilution',
      dataKey: 'hasDilution',
    },
    {
      id: 'term-sheet',
      title: 'Term Sheet Checker',
      description: 'AI-powered analysis of terms',
      icon: FileCheck,
      path: '/tools/term-sheet',
      dataKey: 'hasTermSheet',
    },
  ],
  active: [
    {
      id: 'investor-crm',
      title: 'Investor CRM & Pipeline',
      description: 'Manage investors with kanban',
      icon: Users,
      path: '/investor-crm',
      dataKey: 'hasInvestors',
    },
    {
      id: 'data-room',
      title: 'Data Room',
      description: 'Share due diligence documents',
      icon: FolderOpen,
      path: '/tools/data-room',
      dataKey: 'hasDataRoom',
    },
  ],
};

const stages = [
  { id: 'preparation', name: 'Foundation & Planning', color: 'from-blue-500 to-cyan-500' },
  { id: 'structuring', name: 'Deal Terms & Structure', color: 'from-purple-500 to-pink-500' },
  { id: 'active', name: 'Active Outreach', color: 'from-green-500 to-emerald-500' },
];

const Dashboard = () => {
  const navigate = useNavigate();
  const [userName, setUserName] = useState('');
  const [savedCalculations, setSavedCalculations] = useState<any[]>([]);
  const [termSheetAnalyses, setTermSheetAnalyses] = useState<any[]>([]);
  const [investorCount, setInvestorCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [currentStage, setCurrentStage] = useState('preparation');

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .single();
    
    setUserName(profile?.full_name || user.email?.split('@')[0] || 'Founder');

    const { data: calculations } = await supabase
      .from('saved_calculations')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (calculations) setSavedCalculations(calculations);

    const { data: analyses } = await supabase
      .from('term_sheet_analyses')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (analyses) setTermSheetAnalyses(analyses);

    // Load investor count
    const { count: investorCount } = await supabase
      .from('investors')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    // Store investor count in state if needed
    if (investorCount && investorCount > 0) {
      setInvestorCount(investorCount);
    }

    setLoading(false);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/auth');
  };

  // Calculate completion status
  const completionStatus = {
    hasInvestors: investorCount > 0,
    hasDataRoom: savedCalculations.some(c => c.tool_type === 'data_room'),
    hasTemplates: true, // Templates are always available
    hasPitchDeck: termSheetAnalyses.length > 0,
    hasValuation: savedCalculations.some(c => c.tool_type === 'valuation'),
    hasBenchmarks: savedCalculations.some(c => c.tool_type === 'benchmarks'),
    hasCapTable: savedCalculations.some(c => c.tool_type === 'cap_table'),
    hasDilution: savedCalculations.some(c => c.tool_type === 'dilution'),
    hasSafe: savedCalculations.some(c => c.tool_type === 'safe'),
    hasTermSheet: termSheetAnalyses.length > 0,
    hasPractice: savedCalculations.some(c => c.tool_type === 'practice_pitching'),
  };

  const stageCompletion = {
    preparation: toolsByStage.preparation.filter(t => completionStatus[t.dataKey]).length / toolsByStage.preparation.length * 100,
    structuring: toolsByStage.structuring.filter(t => completionStatus[t.dataKey]).length / toolsByStage.structuring.length * 100,
    active: toolsByStage.active.filter(t => completionStatus[t.dataKey]).length / toolsByStage.active.length * 100,
  };

  const overallCompletion = Math.round(
    (stageCompletion.preparation + stageCompletion.structuring + stageCompletion.active) / 3
  );


  return (
    <AuthGuard>
      <div className="min-h-screen relative">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-semibold mb-2">
                Welcome back, {userName}
              </h1>
              <p className="text-muted-foreground">
                Your fundraising journey at a glance
              </p>
            </div>
            <Button variant="outline" onClick={handleSignOut} className="gap-2">
              <LogOut className="w-4 h-4" />
              Sign Out
            </Button>
          </div>

          {/* Overall Progress */}
          <Card className="border mb-8">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    Fundraising Readiness
                  </CardTitle>
                  <CardDescription className="mt-1">Track your progress across all stages</CardDescription>
                </div>
                <div className="text-right">
                  <div className="text-4xl font-bold">
                    {overallCompletion}%
                  </div>
                  <div className="text-sm text-muted-foreground">Complete</div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stages.map((stage, idx) => (
                  <div key={stage.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-6 h-6 flex items-center justify-center bg-foreground text-background font-semibold text-xs">
                          {idx + 1}
                        </div>
                        <span className="font-medium">{stage.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">
                          {Math.round(stageCompletion[stage.id])}%
                        </span>
                        {stageCompletion[stage.id] === 100 && (
                          <span className="text-xs">✓</span>
                        )}
                      </div>
                    </div>
                    <div className="h-2 bg-muted overflow-hidden">
                      <div
                        className="h-full bg-foreground transition-all duration-500"
                        style={{ width: `${stageCompletion[stage.id]}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>


          {/* Stage-Based Tools */}
          <div className="space-y-8">
            {stages.map((stage) => (
              <div key={stage.id}>
                <div className="flex items-center gap-3 mb-4">
                  <h2 className="text-xl font-semibold">{stage.name}</h2>
                  <span className="ml-auto text-sm text-muted-foreground">
                    {Math.round(stageCompletion[stage.id])}% Complete
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {toolsByStage[stage.id].map((tool) => {
                    const Icon = tool.icon;
                    const isComplete = completionStatus[tool.dataKey];
                    
                    return (
                      <Card
                        key={tool.id}
                        className="group hover:shadow-md transition-all duration-300 border-2 cursor-pointer relative"
                        onClick={() => navigate(tool.path)}
                      >
                        {isComplete && (
                          <div className="absolute top-3 right-3">
                            <span className="text-sm">✓</span>
                          </div>
                        )}
                        
                        <CardHeader>
                          <CardTitle className="text-base">{tool.title}</CardTitle>
                          <CardDescription className="mt-2">{tool.description}</CardDescription>
                        </CardHeader>
                      </Card>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

        </div>
      </div>
    </AuthGuard>
  );
};

export default Dashboard;
