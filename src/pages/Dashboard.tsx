import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { StarField } from '@/components/StarField';
import { AuthGuard } from '@/components/AuthGuard';
import { Badge } from '@/components/ui/badge';
import {
  TrendingUp,
  Calculator,
  FileText,
  Target,
  BarChart3,
  Users,
  FolderOpen,
  FileCheck,
  DollarSign,
  Presentation,
  Percent,
  PieChart,
  Mic,
  LogOut,
  MessageSquare,
  FileStack,
} from "lucide-react";

const toolsByStage = {
  preparation: [
    {
      id: 'practice-pitching',
      title: 'Practice Pitching',
      description: 'Practice your pitch with AI investor',
      icon: Mic,
      path: '/tools/practice-pitching',
      dataKey: 'hasPractice',
      available: true,
    },
    {
      id: 'valuation',
      title: 'Valuation Calculator',
      description: 'Determine your startup valuation',
      icon: DollarSign,
      path: '/tools/valuation',
      dataKey: 'hasValuation',
      available: false,
    },
    {
      id: 'benchmarks',
      title: 'Metric Benchmarks',
      description: 'Compare against industry standards',
      icon: TrendingUp,
      path: '/tools/benchmarks',
      dataKey: 'hasBenchmarks',
      available: false,
    },
    {
      id: 'pitch-deck',
      title: 'Pitch Deck Analyser',
      description: 'Get AI feedback on your pitch deck',
      icon: FileText,
      path: '/tools/pitch-deck',
      dataKey: 'hasPitchDeck',
      available: false,
    },
    {
      id: 'document-templates',
      title: 'Document Templates',
      description: 'Legal & fundraising templates',
      icon: FileStack,
      path: '/tools/document-templates',
      dataKey: 'hasTemplates',
      available: false,
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
      available: false,
    },
    {
      id: 'cap-table',
      title: 'Cap Table Manager',
      description: 'Visualize ownership and dilution',
      icon: PieChart,
      path: '/tools/cap-table',
      dataKey: 'hasCapTable',
      available: false,
    },
    {
      id: 'dilution',
      title: 'Dilution Calculator',
      description: 'Calculate ownership across rounds',
      icon: BarChart3,
      path: '/tools/dilution',
      dataKey: 'hasDilution',
      available: false,
    },
    {
      id: 'term-sheet',
      title: 'Term Sheet Checker',
      description: 'AI-powered analysis of terms',
      icon: FileCheck,
      path: '/tools/term-sheet',
      dataKey: 'hasTermSheet',
      available: false,
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
      available: false,
    },
    {
      id: 'data-room',
      title: 'Data Room',
      description: 'Share due diligence documents',
      icon: FolderOpen,
      path: '/tools/data-room',
      dataKey: 'hasDataRoom',
      available: false,
    },
    {
      id: 'forum',
      title: 'Founder Forum',
      description: 'Connect with fellow founders',
      icon: MessageSquare,
      path: '/forum',
      dataKey: 'hasForum',
      available: false,
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
  const [forumActivityCount, setForumActivityCount] = useState(0);
  const [practiceSessionCount, setPracticeSessionCount] = useState(0);
  const [dataRoomDocCount, setDataRoomDocCount] = useState(0);
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

    // Load all analyses (both pitch deck and term sheet)
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

    // Load forum activity (posts + votes)
    const { count: postsCount } = await supabase
      .from('forum_posts')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    const { count: votesCount } = await supabase
      .from('forum_votes')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    const totalForumActivity = (postsCount || 0) + (votesCount || 0);
    setForumActivityCount(totalForumActivity);

    // Load practice sessions count
    const { count: practiceCount } = await supabase
      .from('practice_sessions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    if (practiceCount && practiceCount > 0) {
      setPracticeSessionCount(practiceCount);
    }

    // Load data room documents count
    const { count: dataRoomCount } = await supabase
      .from('data_room_documents')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    if (dataRoomCount && dataRoomCount > 0) {
      setDataRoomDocCount(dataRoomCount);
    }

    setLoading(false);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  // Calculate completion status
  const completionStatus = {
    hasInvestors: investorCount > 0,
    hasDataRoom: dataRoomDocCount > 0,
    hasTemplates: savedCalculations.some(c => c.tool_type === 'document_templates'),
    hasPitchDeck: termSheetAnalyses.some((a: any) => a.tool_type === 'pitch_deck'),
    hasValuation: savedCalculations.some(c => c.tool_type === 'valuation'),
    hasBenchmarks: savedCalculations.some(c => c.tool_type === 'benchmarks'),
    hasCapTable: savedCalculations.some(c => c.tool_type === 'cap_table'),
    hasDilution: savedCalculations.some(c => c.tool_type === 'dilution'),
    hasSafe: savedCalculations.some(c => c.tool_type === 'safe'),
    hasTermSheet: termSheetAnalyses.some((a: any) => a.tool_type === 'term_sheet'),
    hasPractice: practiceSessionCount > 0,
    hasForum: forumActivityCount > 0,
  };

  // Count ALL tools (including unavailable ones) in completion calculation
  const stageCompletion = {
    preparation: (() => {
      const allTools = toolsByStage.preparation;
      const completed = allTools.filter(t => completionStatus[t.dataKey]).length;
      return allTools.length > 0 ? (completed / allTools.length * 100) : 0;
    })(),
    structuring: (() => {
      const allTools = toolsByStage.structuring;
      const completed = allTools.filter(t => completionStatus[t.dataKey]).length;
      return allTools.length > 0 ? (completed / allTools.length * 100) : 0;
    })(),
    active: (() => {
      const allTools = toolsByStage.active;
      const completed = allTools.filter(t => completionStatus[t.dataKey]).length;
      return allTools.length > 0 ? (completed / allTools.length * 100) : 0;
    })(),
  };

  // Calculate overall completion based on total tools completed / total tools
  const totalTools = toolsByStage.preparation.length + toolsByStage.structuring.length + toolsByStage.active.length;
  const totalCompleted =
    toolsByStage.preparation.filter(t => completionStatus[t.dataKey]).length +
    toolsByStage.structuring.filter(t => completionStatus[t.dataKey]).length +
    toolsByStage.active.filter(t => completionStatus[t.dataKey]).length;
  const overallCompletion = totalTools > 0 ? Math.round((totalCompleted / totalTools) * 100) : 0;


  return (
    <AuthGuard>
      <div className="min-h-screen relative">
        <div className="container mx-auto px-4 md:px-8 lg:px-12 py-12 md:py-16">
          {/* Header */}
          <div className="flex justify-between items-start mb-8">
            <div>
              <div className="flex items-center gap-4 mb-4">
                <img
                  src="/arconic-logo.svg"
                  alt="Arconic Logo"
                  className="h-12 w-12"
                />
                <h1 className="text-4xl font-semibold">
                  Fundraising Hub
                </h1>
              </div>
              <div>
                <p className="text-xl font-medium mb-1">
                  Welcome back, {userName}
                </p>
                <p className="text-muted-foreground">
                  Your fundraising journey at a glance
                </p>
              </div>
            </div>
            <Button variant="outline" onClick={handleSignOut} className="gap-2">
              <LogOut className="w-4 h-4" />
              Sign Out
            </Button>
          </div>

          {/* Overall Progress */}
          <Card className="border mb-12">
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
                        <div className="w-6 h-6 flex items-center justify-center bg-primary text-primary-foreground font-semibold text-xs">
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
                        className="h-full bg-primary transition-all duration-500"
                        style={{ width: `${stageCompletion[stage.id]}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>


          {/* Stage-Based Tools */}
          <div className="space-y-16">
            {stages.map((stage) => (
              <div key={stage.id}>
                <div className="flex items-center gap-3 mb-6">
                  <h2 className="text-xl font-semibold">{stage.name}</h2>
                  <span className="ml-auto text-sm text-muted-foreground">
                    {Math.round(stageCompletion[stage.id])}% Complete
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-10">
                  {toolsByStage[stage.id].map((tool) => {
                    const Icon = tool.icon;
                    const isComplete = completionStatus[tool.dataKey];
                    const isAvailable = tool.available !== false;
                    const isLive = tool.available === true;

                    return (
                      <Card
                        key={tool.id}
                        className={`group transition-all duration-300 border-2 relative ${
                          isLive
                            ? 'border-green-500 bg-green-50/50 hover:shadow-lg hover:border-green-600 cursor-pointer'
                            : isAvailable
                            ? 'hover:shadow-md cursor-pointer'
                            : 'opacity-60 cursor-not-allowed'
                        }`}
                        onClick={() => isAvailable && navigate(tool.path)}
                      >
                        {isLive && (
                          <div className="absolute -top-3 right-2 z-10">
                            <Badge className="text-xs bg-green-600 hover:bg-green-700">LIVE</Badge>
                          </div>
                        )}
                        {!isAvailable && (
                          <div className="absolute -top-3 right-2 z-10">
                            <Badge variant="secondary" className="text-xs">Coming Soon</Badge>
                          </div>
                        )}
                        {isComplete && isAvailable && (
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
