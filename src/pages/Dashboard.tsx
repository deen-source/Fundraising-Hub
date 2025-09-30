import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { StarField } from '@/components/StarField';
import { AuthGuard } from '@/components/AuthGuard';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  Clock,
  Trash2,
  ExternalLink,
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
  const [savedCalculations, setSavedCalculations] = useState<any[]>([]);
  const [termSheetAnalyses, setTermSheetAnalyses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Load user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .single();
    
    setUserName(profile?.full_name || user.email?.split('@')[0] || 'Founder');

    // Load saved calculations
    const { data: calculations } = await supabase
      .from('saved_calculations')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10);

    if (calculations) setSavedCalculations(calculations);

    // Load term sheet analyses
    const { data: analyses } = await supabase
      .from('term_sheet_analyses')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10);

    if (analyses) setTermSheetAnalyses(analyses);

    setLoading(false);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/auth');
  };

  const handleDeleteCalculation = async (id: string) => {
    await supabase.from('saved_calculations').delete().eq('id', id);
    loadUserData();
  };

  const handleDeleteAnalysis = async (id: string) => {
    await supabase.from('term_sheet_analyses').delete().eq('id', id);
    loadUserData();
  };

  const getToolInfo = (toolType: string) => {
    const toolMap: any = {
      'cap_table': { name: 'Cap Table', icon: PieChart, path: '/tools/cap-table' },
      'valuation': { name: 'Valuation', icon: DollarSign, path: '/tools/valuation' },
      'safe': { name: 'SAFE Calculator', icon: Calculator, path: '/tools/safe-calculator' },
      'dilution': { name: 'Dilution', icon: BarChart3, path: '/tools/dilution' },
      'timeline': { name: 'Timeline', icon: Calendar, path: '/tools/timeline' },
      'benchmarks': { name: 'Benchmarks', icon: TrendingUp, path: '/tools/benchmarks' },
    };
    return toolMap[toolType] || { name: toolType, icon: FileText, path: '/dashboard' };
  };

  const totalActivity = savedCalculations.length + termSheetAnalyses.length;

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

          {/* Stats Overview */}
          <div className="mt-12 grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card className="glass-card border-primary/20">
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-4xl font-bold text-primary mb-2">{totalActivity}</div>
                  <div className="text-sm text-muted-foreground">Total Activities</div>
                </div>
              </CardContent>
            </Card>
            <Card className="glass-card border-primary/20">
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-4xl font-bold text-primary mb-2">{savedCalculations.length}</div>
                  <div className="text-sm text-muted-foreground">Saved Calculations</div>
                </div>
              </CardContent>
            </Card>
            <Card className="glass-card border-primary/20">
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-4xl font-bold text-primary mb-2">{termSheetAnalyses.length}</div>
                  <div className="text-sm text-muted-foreground">Term Sheet Analyses</div>
                </div>
              </CardContent>
            </Card>
            <Card className="glass-card border-primary/20">
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-4xl font-bold text-primary mb-2">8</div>
                  <div className="text-sm text-muted-foreground">Tools Available</div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <div className="mt-12">
            <Card className="glass-card border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-primary" />
                  Recent Activity
                </CardTitle>
                <CardDescription>Your latest calculations and analyses</CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="all" className="w-full">
                  <TabsList className="grid w-full grid-cols-3 mb-6">
                    <TabsTrigger value="all">All ({totalActivity})</TabsTrigger>
                    <TabsTrigger value="calculations">Calculations ({savedCalculations.length})</TabsTrigger>
                    <TabsTrigger value="analyses">Analyses ({termSheetAnalyses.length})</TabsTrigger>
                  </TabsList>

                  <TabsContent value="all" className="space-y-4">
                    {totalActivity === 0 ? (
                      <div className="text-center py-12 text-muted-foreground">
                        <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>No activity yet. Start using the tools to see your work here.</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {[...savedCalculations, ...termSheetAnalyses]
                          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                          .slice(0, 10)
                          .map((item) => {
                            const isCalculation = 'tool_type' in item;
                            const toolInfo = isCalculation ? getToolInfo(item.tool_type) : { name: 'Term Sheet', icon: FileCheck, path: '/tools/term-sheet' };
                            const Icon = toolInfo.icon;
                            
                            return (
                              <div
                                key={item.id}
                                className="flex items-center justify-between p-4 rounded-lg border hover:border-primary/50 transition-colors bg-card/50"
                              >
                                <div className="flex items-center gap-4 flex-1">
                                  <div className="p-2 rounded-lg bg-primary/10">
                                    <Icon className="w-5 h-5 text-primary" />
                                  </div>
                                  <div className="flex-1">
                                    <div className="font-medium">
                                      {isCalculation ? item.title : 'Term Sheet Analysis'}
                                    </div>
                                    <div className="flex items-center gap-3 mt-1">
                                      <Badge variant="secondary" className="text-xs">
                                        {toolInfo.name}
                                      </Badge>
                                      <span className="text-xs text-muted-foreground">
                                        {new Date(item.created_at).toLocaleDateString()} at {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => navigate(toolInfo.path)}
                                    className="gap-2"
                                  >
                                    <ExternalLink className="w-4 h-4" />
                                    Open
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => isCalculation ? handleDeleteCalculation(item.id) : handleDeleteAnalysis(item.id)}
                                    className="text-destructive hover:text-destructive"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="calculations" className="space-y-4">
                    {savedCalculations.length === 0 ? (
                      <div className="text-center py-12 text-muted-foreground">
                        <Calculator className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>No saved calculations yet.</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {savedCalculations.map((calc) => {
                          const toolInfo = getToolInfo(calc.tool_type);
                          const Icon = toolInfo.icon;
                          
                          return (
                            <div
                              key={calc.id}
                              className="flex items-center justify-between p-4 rounded-lg border hover:border-primary/50 transition-colors bg-card/50"
                            >
                              <div className="flex items-center gap-4 flex-1">
                                <div className="p-2 rounded-lg bg-primary/10">
                                  <Icon className="w-5 h-5 text-primary" />
                                </div>
                                <div className="flex-1">
                                  <div className="font-medium">{calc.title}</div>
                                  <div className="flex items-center gap-3 mt-1">
                                    <Badge variant="secondary" className="text-xs">
                                      {toolInfo.name}
                                    </Badge>
                                    <span className="text-xs text-muted-foreground">
                                      {new Date(calc.created_at).toLocaleDateString()} at {new Date(calc.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => navigate(toolInfo.path)}
                                  className="gap-2"
                                >
                                  <ExternalLink className="w-4 h-4" />
                                  Open
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteCalculation(calc.id)}
                                  className="text-destructive hover:text-destructive"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="analyses" className="space-y-4">
                    {termSheetAnalyses.length === 0 ? (
                      <div className="text-center py-12 text-muted-foreground">
                        <FileCheck className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>No term sheet analyses yet.</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {termSheetAnalyses.map((analysis) => (
                          <div
                            key={analysis.id}
                            className="flex items-center justify-between p-4 rounded-lg border hover:border-primary/50 transition-colors bg-card/50"
                          >
                            <div className="flex items-center gap-4 flex-1">
                              <div className="p-2 rounded-lg bg-primary/10">
                                <FileCheck className="w-5 h-5 text-primary" />
                              </div>
                              <div className="flex-1">
                                <div className="font-medium">Term Sheet Analysis</div>
                                <div className="flex items-center gap-3 mt-1">
                                  <Badge variant="secondary" className="text-xs">
                                    Score: {analysis.analysis_result?.overall_score || 'N/A'}/10
                                  </Badge>
                                  <span className="text-xs text-muted-foreground">
                                    {new Date(analysis.created_at).toLocaleDateString()} at {new Date(analysis.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => navigate('/tools/term-sheet')}
                                className="gap-2"
                              >
                                <ExternalLink className="w-4 h-4" />
                                Open
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteAnalysis(analysis.id)}
                                className="text-destructive hover:text-destructive"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
};

export default Dashboard;
