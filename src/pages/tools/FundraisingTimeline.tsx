import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { StarField } from '@/components/StarField';
import { AuthGuard } from '@/components/AuthGuard';
import { ArrowLeft, Calendar, CheckCircle2, Clock, TrendingUp, Target, Users, FileText, Sparkles, BookOpen, Lightbulb, AlertCircle, AlertTriangle, MapPin, BarChart3 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';


interface TimelinePhase {
  phase: string;
  duration: string;
  weeks: number;
  tasks: string[];
  keyMilestones: string[];
}

const FundraisingTimeline = () => {
  const navigate = useNavigate();
  const [roundType, setRoundType] = useState('seed');
  const [targetAmount, setTargetAmount] = useState('');
  const [startDate, setStartDate] = useState('');

  const timelineTemplates: Record<string, TimelinePhase[]> = {
    'pre-seed': [
      {
        phase: 'Preparation',
        duration: '4-6 weeks',
        weeks: 5,
        keyMilestones: ['Pitch deck finalized', 'Investor list created', 'Data room set up'],
        tasks: [
          'Finalize pitch deck (10-12 slides) with clear problem-solution-traction',
          'Build financial model showing 18-month runway post-raise',
          'Create investor target list (50-100 angels and micro-VCs)',
          'Set up basic data room (incorporation docs, cap table, financials)',
          'Practice pitch with mentors and advisors',
          'Draft investor update template for weekly progress',
        ],
      },
      {
        phase: 'Outreach',
        duration: '2-3 weeks',
        weeks: 2.5,
        keyMilestones: ['First 20 meetings booked', 'Initial feedback collected'],
        tasks: [
          'Send warm intros via network (aim for 50+ connections)',
          'Schedule initial investor meetings (15-30 min intro calls)',
          'Gather feedback and iterate deck based on investor questions',
          'Build momentum with weekly traction updates to interested investors',
          'Track investor interest in CRM or spreadsheet',
        ],
      },
      {
        phase: 'Active Fundraising',
        duration: '4-6 weeks',
        weeks: 5,
        keyMilestones: ['Verbal commitments received', 'Lead investor identified'],
        tasks: [
          'Run parallel processes with 10-15 investors simultaneously',
          'Conduct deep-dive meetings with interested investors',
          'Share weekly traction updates to maintain urgency',
          'Negotiate terms with interested parties',
          'Get verbal commitments and gauge interest levels',
          'Select lead investor who will set terms',
        ],
      },
      {
        phase: 'Closing',
        duration: '2-3 weeks',
        weeks: 2.5,
        keyMilestones: ['SAFE/Note signed', 'Funds wired'],
        tasks: [
          'Finalize SAFE or convertible note terms with lead',
          'Send final documents to all committed investors',
          'Legal review and documentation (use standard templates to save time)',
          'Collect signatures and wire instructions',
          'Wire transfers and closing',
          'Send thank you notes and onboarding updates',
        ],
      },
    ],
    'seed': [
      {
        phase: 'Preparation',
        duration: '6-8 weeks',
        weeks: 7,
        keyMilestones: ['Comprehensive deck ready', 'Target list vetted', 'Data room complete'],
        tasks: [
          'Complete pitch deck (15-18 slides) with strong traction metrics',
          'Build detailed financial projections (3-5 years) with unit economics',
          'Create comprehensive data room (legal, financial, product, customers)',
          'Identify 30-50 target seed funds aligned with your stage/vertical',
          'Secure warm introductions from founders, angels, or LPs',
          'Prepare term sheet comparison framework',
          'Draft weekly investor update template',
        ],
      },
      {
        phase: 'First Meetings',
        duration: '3-4 weeks',
        weeks: 3.5,
        keyMilestones: ['20+ partner meetings held', 'Interest signals received'],
        tasks: [
          'Initial partner meetings (30-45 min) at target funds',
          'Present company story, traction, and vision',
          'Gather feedback and iterate deck based on recurring questions',
          'Schedule follow-up meetings with interested partners',
          'Send weekly update emails to maintain engagement',
          'Track investor pipeline in CRM',
        ],
      },
      {
        phase: 'Deep Dives',
        duration: '4-6 weeks',
        weeks: 5,
        keyMilestones: ['Partner presentations delivered', 'Due diligence started', '3-5 strong interests'],
        tasks: [
          'Partner presentations to full investment teams',
          'Due diligence calls with investors',
          'Customer reference calls (prepare 5-10 happy customers)',
          'Team deep-dives and capability assessments',
          'Create competitive tension between interested funds',
          'Continue sharing weekly momentum updates',
        ],
      },
      {
        phase: 'Term Sheets',
        duration: '2-3 weeks',
        weeks: 2.5,
        keyMilestones: ['Term sheets received', 'Lead selected'],
        tasks: [
          'Receive and compare multiple term sheets',
          'Negotiate key terms (valuation, board seats, pro-rata, preferences)',
          'Select lead investor based on value-add and terms',
          'Finalize pro-rata rights for existing angel investors',
          'Sign term sheet with lead',
        ],
      },
      {
        phase: 'Legal & Closing',
        duration: '3-4 weeks',
        weeks: 3.5,
        keyMilestones: ['Legal docs signed', 'Funds received', 'Round announced'],
        tasks: [
          'Complete legal due diligence process',
          'Finalize and negotiate legal documents (stock purchase agreement, etc.)',
          'Get board and shareholder approvals if required',
          'Coordinate wire transfers from all investors',
          'Close round and update cap table',
          'Announce round and prepare PR/social media',
        ],
      },
    ],
    'series-a': [
      {
        phase: 'Preparation',
        duration: '8-12 weeks',
        weeks: 10,
        keyMilestones: ['Institutional-grade deck ready', 'Full data room', 'Warm intros secured'],
        tasks: [
          'Build comprehensive pitch deck (20-25 slides) with deep market analysis',
          'Create detailed financial model with cohort analysis and unit economics',
          'Compile extensive data room (legal, financials, product, team, customers)',
          'Identify 20-30 Series A funds with thesis alignment',
          'Secure multiple warm introductions from portfolio CEOs or LPs',
          'Consider hiring fundraising advisor or investment banker',
          'Prepare for extensive technical and business due diligence',
          'Get financials audit-ready',
        ],
      },
      {
        phase: 'Initial Meetings',
        duration: '4-6 weeks',
        weeks: 5,
        keyMilestones: ['Partner meetings at 15+ funds', 'Qualified interest from 5-8 funds'],
        tasks: [
          'Partner meetings (45-60 min) at top-tier funds',
          'Present company metrics, traction, and strategic vision',
          'Field detailed questions about business model and market',
          'Schedule follow-ups with interested funds',
          'Begin sharing weekly investor updates',
          'Maintain relationship with existing investors',
        ],
      },
      {
        phase: 'Partner Meetings',
        duration: '6-8 weeks',
        weeks: 7,
        keyMilestones: ['Full partnership presentations', 'Deep diligence in progress', 'Hot interest from 3-5 funds'],
        tasks: [
          'Present to full partnerships (1-2 hour presentations)',
          'Extensive diligence: customer calls, tech review, market analysis',
          'Multiple meetings with different members of investment team',
          'Manage competitive process between interested funds',
          'Continue weekly updates to maintain momentum and urgency',
          'Handle detailed questions about go-to-market and competition',
        ],
      },
      {
        phase: 'Term Sheet Negotiation',
        duration: '3-4 weeks',
        weeks: 3.5,
        keyMilestones: ['Multiple term sheets', 'Lead selected', 'Terms finalized'],
        tasks: [
          'Review multiple term sheets from interested funds',
          'Negotiate valuation, liquidation preferences, and anti-dilution',
          'Finalize board composition and governance structure',
          'Agree on information rights and protective provisions',
          'Select lead investor and syndicate co-investors',
          'Sign term sheet and begin exclusivity period',
        ],
      },
      {
        phase: 'Due Diligence & Legal',
        duration: '4-6 weeks',
        weeks: 5,
        keyMilestones: ['DD completed', 'Legal docs drafted'],
        tasks: [
          'Complete full legal due diligence process',
          'Technical and product due diligence deep-dives',
          'Extensive customer reference calls (10-20 customers)',
          'Negotiate and finalize all legal documents',
          'Get board and shareholder approvals',
          'Coordinate with existing investor pro-rata participation',
        ],
      },
      {
        phase: 'Closing',
        duration: '2-3 weeks',
        weeks: 2.5,
        keyMilestones: ['All docs signed', 'Wires complete', 'Public announcement'],
        tasks: [
          'Sign all legal documents',
          'Complete wire transfers from all investors',
          'Update and file new cap table',
          'Coordinate public announcement timing',
          'Prepare and execute press release',
          'Announce on social media and company blog',
        ],
      },
    ],
  };

  const timeline = timelineTemplates[roundType];
  
  const totalWeeks = useMemo(() => {
    return timeline.reduce((sum, phase) => sum + phase.weeks, 0);
  }, [timeline]);

  const calculatePhaseDate = (phaseIndex: number) => {
    if (!startDate) return null;
    const start = new Date(startDate);
    const weeksElapsed = timeline.slice(0, phaseIndex).reduce((sum, phase) => sum + phase.weeks, 0);
    const phaseStart = new Date(start);
    phaseStart.setDate(phaseStart.getDate() + weeksElapsed * 7);
    return phaseStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getProgressForPhase = (phaseIndex: number) => {
    return ((phaseIndex) / timeline.length) * 100;
  };


  return (
    <AuthGuard>
      <div className="min-h-screen relative bg-background">
        <StarField />

        <div className="relative z-10 container mx-auto px-4 py-8 max-w-7xl">
          <Button variant="ghost" onClick={() => navigate('/dashboard')} className="mb-6 gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Button>

          <div className="space-y-8">
            {/* Header */}
            <div className="text-center space-y-4">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
                <Calendar className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-primary">Strategic Fundraising Planning</span>
              </div>
              <h1 className="text-5xl font-bold tracking-tight">Fundraising Timeline</h1>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Build a realistic, actionable timeline for your fundraising journey with week-by-week guidance
              </p>
            </div>

            {/* Tabs Interface */}
            <Tabs defaultValue="planner" className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-8">
                <TabsTrigger value="planner" className="gap-2">
                  <Target className="w-4 h-4" />
                  Timeline Builder
                </TabsTrigger>
                <TabsTrigger value="understanding" className="gap-2">
                  <BookOpen className="w-4 h-4" />
                  Understanding Timelines
                </TabsTrigger>
                <TabsTrigger value="best-practices" className="gap-2">
                  <Lightbulb className="w-4 h-4" />
                  Best Practices
                </TabsTrigger>
              </TabsList>

              {/* Planner Tab */}
              <TabsContent value="planner" className="space-y-8">
                {/* Configuration Card */}
                <Card className="border-2 border-dashed border-primary/20 bg-card/50 backdrop-blur">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-primary" />
                      Configure Your Timeline
                    </CardTitle>
                    <CardDescription>
                      Set your fundraising parameters to generate a customized timeline
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label>Round Type</Label>
                        <Select value={roundType} onValueChange={setRoundType}>
                          <SelectTrigger className="mt-2 bg-background">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pre-seed">Pre-Seed Round</SelectItem>
                            <SelectItem value="seed">Seed Round</SelectItem>
                            <SelectItem value="series-a">Series A</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label>Target Amount ($)</Label>
                        <Input
                          type="number"
                          placeholder="e.g., 2,000,000"
                          value={targetAmount}
                          onChange={(e) => setTargetAmount(e.target.value)}
                          className="mt-2 bg-background"
                        />
                      </div>

                      <div>
                        <Label>Target Start Date</Label>
                        <Input
                          type="date"
                          value={startDate}
                          onChange={(e) => setStartDate(e.target.value)}
                          className="mt-2 bg-background"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Executive Summary */}
                <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-primary/20 via-primary/10 to-background border-2 border-primary/30 p-8">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
                  <div className="relative space-y-4">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-background/80 border border-primary/20">
                      <BarChart3 className="w-3 h-3 text-primary" />
                      <span className="text-xs font-medium text-primary uppercase tracking-wider">Timeline Overview</span>
                    </div>
                    
                    <div className="flex items-start justify-between gap-8">
                      <div className="flex-1 space-y-2">
                        <h2 className="text-3xl font-bold">
                          {roundType === 'pre-seed' ? 'Pre-Seed' : roundType === 'seed' ? 'Seed' : 'Series A'} Fundraising Journey
                        </h2>
                        <p className="text-lg text-muted-foreground leading-relaxed">
                          {roundType === 'pre-seed' && "Fast-paced process focused on angel investors and micro-VCs. Expect simpler diligence but need strong momentum."}
                          {roundType === 'seed' && "Structured process with institutional seed funds. Requires strong traction and a clear go-to-market strategy."}
                          {roundType === 'series-a' && "Intensive, institutional process. Expect extensive diligence, multiple stakeholders, and detailed negotiations."}
                        </p>
                      </div>
                      
                      <div className="flex gap-6">
                        <div className="text-center space-y-1">
                          <div className="text-5xl font-bold text-primary">
                            {totalWeeks}
                          </div>
                          <div className="text-sm text-muted-foreground">Total Weeks</div>
                        </div>
                        <div className="text-center space-y-1">
                          <div className="text-5xl font-bold text-primary">
                            {timeline.length}
                          </div>
                          <div className="text-sm text-muted-foreground">Key Phases</div>
                        </div>
                      </div>
                    </div>

                    {startDate && (
                      <div className="flex items-center gap-4 pt-4 border-t border-primary/20">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-primary" />
                          <span className="text-sm font-medium">Start Date:</span>
                          <span className="text-sm text-muted-foreground">{new Date(startDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Target className="w-4 h-4 text-primary" />
                          <span className="text-sm font-medium">Expected Close:</span>
                          <span className="text-sm text-muted-foreground">
                            {(() => {
                              const closeDate = new Date(startDate);
                              closeDate.setDate(closeDate.getDate() + totalWeeks * 7);
                              return closeDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
                            })()}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Timeline Phases */}
                <div className="space-y-6">
                  {timeline.map((phase, idx) => (
                    <Card key={idx} className="border-2 border-primary/10 overflow-hidden">
                      <div className="h-2 bg-muted">
                        <div 
                          className="h-full bg-gradient-to-r from-primary to-primary/60 transition-all duration-500"
                          style={{ width: `${getProgressForPhase(idx + 1)}%` }}
                        />
                      </div>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <Badge variant="outline" className="text-lg px-3 py-1">
                                Phase {idx + 1}
                              </Badge>
                              {startDate && (
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                  <Calendar className="w-3 h-3" />
                                  Start: {calculatePhaseDate(idx)}
                                </div>
                              )}
                            </div>
                            <CardTitle className="text-2xl">{phase.phase}</CardTitle>
                            <div className="flex items-center gap-4 mt-2">
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <Clock className="w-4 h-4" />
                                <span className="text-sm">{phase.duration}</span>
                              </div>
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <Target className="w-4 h-4" />
                                <span className="text-sm">{phase.tasks.length} key tasks</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {/* Key Milestones */}
                        <div>
                          <h4 className="font-semibold mb-3 flex items-center gap-2">
                            <TrendingUp className="w-4 h-4 text-primary" />
                            Key Milestones
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {phase.keyMilestones.map((milestone, mIdx) => (
                              <Badge key={mIdx} variant="secondary" className="gap-1">
                                <CheckCircle2 className="w-3 h-3" />
                                {milestone}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        <Separator />

                        {/* Tasks */}
                        <div>
                          <h4 className="font-semibold mb-3 flex items-center gap-2">
                            <FileText className="w-4 h-4 text-primary" />
                            Action Items
                          </h4>
                          <div className="space-y-2">
                            {phase.tasks.map((task, taskIdx) => (
                              <div 
                                key={taskIdx} 
                                className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors group"
                              >
                                <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
                                <span className="text-sm flex-1">{task}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Success Tips */}
                <Card className="border-2 border-success/20 bg-success/5">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-success">
                      <Lightbulb className="w-5 h-5" />
                      Critical Success Factors
                    </CardTitle>
                    <CardDescription>
                      Keep these principles in mind throughout your fundraising journey
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="grid md:grid-cols-2 gap-4">
                    <div className="p-4 rounded-lg bg-background border border-success/30">
                      <h4 className="font-semibold mb-2 flex items-center gap-2">
                        <Clock className="w-4 h-4 text-success" />
                        Start Early
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        Begin preparation 3-6 months before you need the capital. Fundraising always takes longer than expected, and rushing creates weak positioning.
                      </p>
                    </div>
                    <div className="p-4 rounded-lg bg-background border border-success/30">
                      <h4 className="font-semibold mb-2 flex items-center gap-2">
                        <Users className="w-4 h-4 text-success" />
                        Build Relationships
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        Start meeting investors 6-12 months before raising. Regular updates keep you top of mind and warm up the relationship.
                      </p>
                    </div>
                    <div className="p-4 rounded-lg bg-background border border-success/30">
                      <h4 className="font-semibold mb-2 flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-success" />
                        Create Momentum
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        Run a tight, parallel process with multiple investors. FOMO is real in fundraising - show that others are interested and moving fast.
                      </p>
                    </div>
                    <div className="p-4 rounded-lg bg-background border border-success/30">
                      <h4 className="font-semibold mb-2 flex items-center gap-2">
                        <Target className="w-4 h-4 text-success" />
                        Choose Wisely
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        Don't rush the closing. Take time to pick the right partner - a bad investor can hurt more than they help with future rounds.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Understanding Timelines Tab */}
              <TabsContent value="understanding" className="space-y-6">
                <Card className="border-2 border-primary/10">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BookOpen className="w-5 h-5 text-primary" />
                      Understanding Fundraising Timelines
                    </CardTitle>
                    <CardDescription>
                      Learn why timelines matter and what to expect at each stage
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Accordion type="single" collapsible className="w-full">
                      <AccordionItem value="why-timelines">
                        <AccordionTrigger className="text-left">
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-primary" />
                            Why Timelines Matter
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="space-y-4 text-muted-foreground">
                          <p>
                            Having a realistic timeline is crucial for successful fundraising. Most founders underestimate 
                            how long the process takes, which can lead to running out of runway or appearing desperate to investors.
                          </p>
                          <div className="space-y-3">
                            <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                              <div className="font-medium text-foreground mb-2">Strategic Planning</div>
                              <p className="text-sm">A timeline helps you coordinate your fundraising activities with product launches, hiring, and business milestones to maximize traction.</p>
                            </div>
                            <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                              <div className="font-medium text-foreground mb-2">Runway Management</div>
                              <p className="text-sm">Understanding the timeline ensures you start fundraising with 6-9 months of runway remaining, avoiding desperate positioning.</p>
                            </div>
                            <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                              <div className="font-medium text-foreground mb-2">Team Coordination</div>
                              <p className="text-sm">Your team needs to know when you'll be distracted by fundraising so they can plan accordingly and maintain momentum.</p>
                            </div>
                          </div>
                        </AccordionContent>
                      </AccordionItem>

                      <AccordionItem value="stage-differences">
                        <AccordionTrigger className="text-left">
                          <div className="flex items-center gap-2">
                            <TrendingUp className="w-4 h-4 text-primary" />
                            How Timelines Differ by Stage
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="space-y-4 text-muted-foreground">
                          <div className="space-y-4">
                            <div className="p-4 rounded-lg border">
                              <div className="flex items-center justify-between mb-2">
                                <div className="font-medium text-foreground">Pre-Seed (12-15 weeks)</div>
                                <Badge variant="secondary">Fastest</Badge>
                              </div>
                              <p className="text-sm mb-2">
                                Angels and micro-VCs move quickly. Simpler diligence, faster decisions. Focus is on team and vision more than traction.
                              </p>
                              <p className="text-sm text-primary">Best for: First-time founders, very early stage, pre-revenue</p>
                            </div>
                            <div className="p-4 rounded-lg border">
                              <div className="flex items-center justify-between mb-2">
                                <div className="font-medium text-foreground">Seed (18-22 weeks)</div>
                                <Badge variant="secondary">Moderate</Badge>
                              </div>
                              <p className="text-sm mb-2">
                                Institutional seed funds have more process. Expect partner meetings, investment committee, and basic diligence on product and customers.
                              </p>
                              <p className="text-sm text-primary">Best for: Post-MVP, early traction, clear PMF signals</p>
                            </div>
                            <div className="p-4 rounded-lg border">
                              <div className="flex items-center justify-between mb-2">
                                <div className="font-medium text-foreground">Series A (25-35 weeks)</div>
                                <Badge variant="secondary">Longest</Badge>
                              </div>
                              <p className="text-sm mb-2">
                                Top-tier VCs have extensive process. Multiple meetings, deep diligence on everything, customer calls, and complex negotiations.
                              </p>
                              <p className="text-sm text-primary">Best for: Clear PMF, $1M+ ARR, strong growth metrics</p>
                            </div>
                          </div>
                        </AccordionContent>
                      </AccordionItem>

                      <AccordionItem value="what-impacts">
                        <AccordionTrigger className="text-left">
                          <div className="flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 text-primary" />
                            What Can Impact Your Timeline
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="space-y-4 text-muted-foreground">
                          <p>Several factors can accelerate or delay your fundraising timeline:</p>
                          <div className="space-y-3">
                            <div className="flex items-start gap-3">
                              <CheckCircle2 className="w-5 h-5 text-success mt-0.5 flex-shrink-0" />
                              <div>
                                <div className="font-medium text-foreground">Accelerators</div>
                                <ul className="text-sm space-y-1 mt-1">
                                  <li>• Strong traction and growth metrics</li>
                                  <li>• Warm introductions from trusted sources</li>
                                  <li>• Multiple interested investors (FOMO)</li>
                                  <li>• Clean cap table and organized data room</li>
                                  <li>• Second-time founder with good reputation</li>
                                </ul>
                              </div>
                            </div>
                            <Separator />
                            <div className="flex items-start gap-3">
                              <AlertTriangle className="w-5 h-5 text-destructive mt-0.5 flex-shrink-0" />
                              <div>
                                <div className="font-medium text-foreground">Potential Delays</div>
                                <ul className="text-sm space-y-1 mt-1">
                                  <li>• Complex cap table or legal issues</li>
                                  <li>• Weak or declining metrics</li>
                                  <li>• Cold outreach without warm intros</li>
                                  <li>• Unfavorable market conditions</li>
                                  <li>• Missing key team members</li>
                                  <li>• Regulatory or compliance issues</li>
                                </ul>
                              </div>
                            </div>
                          </div>
                        </AccordionContent>
                      </AccordionItem>

                      <AccordionItem value="parallel-process">
                        <AccordionTrigger className="text-left">
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4 text-primary" />
                            Running a Parallel Process
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="space-y-4 text-muted-foreground">
                          <p>
                            The key to efficient fundraising is running a parallel, not sequential, process. Talk to many investors simultaneously rather than one at a time.
                          </p>
                          <div className="space-y-3">
                            <div className="p-4 rounded-lg bg-success/5 border border-success/20">
                              <div className="font-medium text-foreground mb-2">Why Parallel Matters</div>
                              <ul className="text-sm space-y-1">
                                <li>• Creates competitive tension and urgency</li>
                                <li>• Gives you multiple options to choose from</li>
                                <li>• Prevents timeline from dragging on</li>
                                <li>• Strengthens your negotiating position</li>
                              </ul>
                            </div>
                            <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                              <div className="font-medium text-foreground mb-2">How to Execute</div>
                              <ol className="text-sm space-y-1 list-decimal list-inside">
                                <li>Group investors into "cohorts" by stage of conversation</li>
                                <li>Launch each cohort within a 1-2 week window</li>
                                <li>Send weekly updates to all active investors</li>
                                <li>Aim to have 5-10 investors at similar stages simultaneously</li>
                                <li>Be transparent that you're running a process</li>
                              </ol>
                            </div>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Best Practices Tab */}
              <TabsContent value="best-practices" className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Best Practices */}
                  <Card className="border-2 border-success/20 bg-success/5">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-success">
                        <Lightbulb className="w-5 h-5" />
                        Timeline Best Practices
                      </CardTitle>
                      <CardDescription>
                        Proven strategies to optimize your fundraising timeline
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-3">
                        <div className="flex items-start gap-3">
                          <CheckCircle2 className="w-5 h-5 text-success mt-0.5 flex-shrink-0" />
                          <div>
                            <div className="font-medium text-foreground">Build Before You Need</div>
                            <p className="text-sm text-muted-foreground">
                              Start investor relationships 6-12 months early. Send monthly updates even when not raising. When you're ready, they're warm.
                            </p>
                          </div>
                        </div>
                        <Separator />
                        <div className="flex items-start gap-3">
                          <CheckCircle2 className="w-5 h-5 text-success mt-0.5 flex-shrink-0" />
                          <div>
                            <div className="font-medium text-foreground">Time Around Milestones</div>
                            <p className="text-sm text-muted-foreground">
                              Launch your fundraise right after hitting a major milestone (revenue target, key hire, product launch) to maximize momentum.
                            </p>
                          </div>
                        </div>
                        <Separator />
                        <div className="flex items-start gap-3">
                          <CheckCircle2 className="w-5 h-5 text-success mt-0.5 flex-shrink-0" />
                          <div>
                            <div className="font-medium text-foreground">Set Internal Deadlines</div>
                            <p className="text-sm text-muted-foreground">
                              Create your own deadlines for decision-making to keep the process moving. Don't wait for investors to dictate pace.
                            </p>
                          </div>
                        </div>
                        <Separator />
                        <div className="flex items-start gap-3">
                          <CheckCircle2 className="w-5 h-5 text-success mt-0.5 flex-shrink-0" />
                          <div>
                            <div className="font-medium text-foreground">Batch Communications</div>
                            <p className="text-sm text-muted-foreground">
                              Send weekly updates to all investors at once. It's efficient for you and creates urgency for them.
                            </p>
                          </div>
                        </div>
                        <Separator />
                        <div className="flex items-start gap-3">
                          <CheckCircle2 className="w-5 h-5 text-success mt-0.5 flex-shrink-0" />
                          <div>
                            <div className="font-medium text-foreground">Prepare for Delays</div>
                            <p className="text-sm text-muted-foreground">
                              Add 20-30% buffer to timeline estimates. Holidays, investor vacations, and unexpected diligence will cause delays.
                            </p>
                          </div>
                        </div>
                        <Separator />
                        <div className="flex items-start gap-3">
                          <CheckCircle2 className="w-5 h-5 text-success mt-0.5 flex-shrink-0" />
                          <div>
                            <div className="font-medium text-foreground">Keep Building</div>
                            <p className="text-sm text-muted-foreground">
                              Don't stop operating. Investors want to see continued progress during the fundraise, not stagnation.
                            </p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Common Mistakes */}
                  <Card className="border-2 border-destructive/20 bg-destructive/5">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-destructive">
                        <AlertCircle className="w-5 h-5" />
                        Timeline Mistakes to Avoid
                      </CardTitle>
                      <CardDescription>
                        Common pitfalls that can derail your fundraising timeline
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-3">
                        <div className="flex items-start gap-3">
                          <AlertTriangle className="w-5 h-5 text-destructive mt-0.5 flex-shrink-0" />
                          <div>
                            <div className="font-medium text-foreground">Starting Too Late</div>
                            <p className="text-sm text-muted-foreground">
                              Waiting until you have 3 months of runway. This creates desperation, weak positioning, and rushed decisions.
                            </p>
                          </div>
                        </div>
                        <Separator />
                        <div className="flex items-start gap-3">
                          <AlertTriangle className="w-5 h-5 text-destructive mt-0.5 flex-shrink-0" />
                          <div>
                            <div className="font-medium text-foreground">Sequential Conversations</div>
                            <p className="text-sm text-muted-foreground">
                              Talking to investors one at a time. This makes fundraising take 2-3x longer and eliminates competitive tension.
                            </p>
                          </div>
                        </div>
                        <Separator />
                        <div className="flex items-start gap-3">
                          <AlertTriangle className="w-5 h-5 text-destructive mt-0.5 flex-shrink-0" />
                          <div>
                            <div className="font-medium text-foreground">Poor Preparation</div>
                            <p className="text-sm text-muted-foreground">
                              Pitching before materials are ready. First impressions matter - you rarely get a second chance with an investor.
                            </p>
                          </div>
                        </div>
                        <Separator />
                        <div className="flex items-start gap-3">
                          <AlertTriangle className="w-5 h-5 text-destructive mt-0.5 flex-shrink-0" />
                          <div>
                            <div className="font-medium text-foreground">Losing Momentum</div>
                            <p className="text-sm text-muted-foreground">
                              Letting conversations go cold. Once momentum dies, it's hard to restart without looking desperate.
                            </p>
                          </div>
                        </div>
                        <Separator />
                        <div className="flex items-start gap-3">
                          <AlertTriangle className="w-5 h-5 text-destructive mt-0.5 flex-shrink-0" />
                          <div>
                            <div className="font-medium text-foreground">Ignoring Market Timing</div>
                            <p className="text-sm text-muted-foreground">
                              Fundraising during August, December holidays, or market downturns. These periods extend timelines by 30-50%.
                            </p>
                          </div>
                        </div>
                        <Separator />
                        <div className="flex items-start gap-3">
                          <AlertTriangle className="w-5 h-5 text-destructive mt-0.5 flex-shrink-0" />
                          <div>
                            <div className="font-medium text-foreground">Neglecting Operations</div>
                            <p className="text-sm text-muted-foreground">
                              Stopping all work to focus on fundraising. Metrics decline, making the raise harder and timeline longer.
                            </p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
};

export default FundraisingTimeline;
