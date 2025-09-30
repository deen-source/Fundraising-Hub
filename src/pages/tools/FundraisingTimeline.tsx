import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { StarField } from '@/components/StarField';
import { AuthGuard } from '@/components/AuthGuard';
import { ArrowLeft, Calendar, CheckCircle2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

const FundraisingTimeline = () => {
  const navigate = useNavigate();
  const [roundType, setRoundType] = useState('seed');
  const [targetAmount, setTargetAmount] = useState('');
  const [startDate, setStartDate] = useState('');

  const timelineTemplates: Record<string, Array<{ phase: string; duration: string; tasks: string[] }>> = {
    'pre-seed': [
      {
        phase: 'Preparation (4-6 weeks)',
        duration: '4-6 weeks',
        tasks: [
          'Finalize pitch deck and one-pager',
          'Build financial model',
          'Create investor target list (50-100 angels)',
          'Set up data room basics',
          'Practice pitch',
        ],
      },
      {
        phase: 'Outreach (2-3 weeks)',
        duration: '2-3 weeks',
        tasks: [
          'Send warm intros via network',
          'Initial investor meetings',
          'Gather feedback and iterate',
          'Build momentum with updates',
        ],
      },
      {
        phase: 'Active Fundraising (4-6 weeks)',
        duration: '4-6 weeks',
        tasks: [
          'Run parallel processes with multiple investors',
          'Conduct deep-dive meetings',
          'Share traction updates',
          'Negotiate terms with interested parties',
        ],
      },
      {
        phase: 'Closing (2-3 weeks)',
        duration: '2-3 weeks',
        tasks: [
          'Select lead investor',
          'Finalize SAFE/convertible note terms',
          'Legal documentation',
          'Wire transfers and closing',
        ],
      },
    ],
    'seed': [
      {
        phase: 'Preparation (6-8 weeks)',
        duration: '6-8 weeks',
        tasks: [
          'Complete pitch deck with traction metrics',
          'Build detailed financial projections (3-5 years)',
          'Create comprehensive data room',
          'Identify 30-50 target seed funds',
          'Secure warm introductions',
          'Prepare term sheet comparison framework',
        ],
      },
      {
        phase: 'First Meetings (3-4 weeks)',
        duration: '3-4 weeks',
        tasks: [
          'Initial partner meetings',
          'Gather feedback and iterate deck',
          'Schedule follow-up meetings',
          'Send weekly update emails',
        ],
      },
      {
        phase: 'Deep Dives (4-6 weeks)',
        duration: '4-6 weeks',
        tasks: [
          'Partner presentations to full investment team',
          'Due diligence calls',
          'Customer reference calls',
          'Team deep-dives',
          'Create competitive tension',
        ],
      },
      {
        phase: 'Term Sheets (2-3 weeks)',
        duration: '2-3 weeks',
        tasks: [
          'Receive and compare term sheets',
          'Negotiate key terms',
          'Select lead investor',
          'Finalize pro-rata rights for existing investors',
        ],
      },
      {
        phase: 'Legal & Closing (3-4 weeks)',
        duration: '3-4 weeks',
        tasks: [
          'Legal due diligence',
          'Finalize legal documents',
          'Board approval',
          'Wire transfers',
          'Announce round',
        ],
      },
    ],
    'series-a': [
      {
        phase: 'Preparation (8-12 weeks)',
        duration: '8-12 weeks',
        tasks: [
          'Build comprehensive pitch deck (20-25 slides)',
          'Create detailed financial model with unit economics',
          'Compile extensive data room',
          'Identify 20-30 Series A funds',
          'Secure multiple warm introductions',
          'Hire fundraising advisor (optional)',
          'Prepare for extensive due diligence',
        ],
      },
      {
        phase: 'Initial Meetings (4-6 weeks)',
        duration: '4-6 weeks',
        tasks: [
          'Partner meetings at target funds',
          'Present company metrics and vision',
          'Field technical questions',
          'Schedule follow-ups with interested funds',
        ],
      },
      {
        phase: 'Partner Meetings (6-8 weeks)',
        duration: '6-8 weeks',
        tasks: [
          'Present to full partnership',
          'Extensive diligence (customers, tech, market)',
          'Multiple meetings with investment team',
          'Competitive process management',
          'Weekly updates to maintain momentum',
        ],
      },
      {
        phase: 'Term Sheet Negotiation (3-4 weeks)',
        duration: '3-4 weeks',
        tasks: [
          'Review multiple term sheets',
          'Negotiate valuation and terms',
          'Finalize board composition',
          'Agree on governance terms',
          'Select lead and syndicate',
        ],
      },
      {
        phase: 'Due Diligence & Legal (4-6 weeks)',
        duration: '4-6 weeks',
        tasks: [
          'Complete full legal due diligence',
          'Technical/product due diligence',
          'Customer reference calls',
          'Negotiate and finalize legal documents',
          'Get board and shareholder approvals',
        ],
      },
      {
        phase: 'Closing (2-3 weeks)',
        duration: '2-3 weeks',
        tasks: [
          'Sign all legal documents',
          'Complete wire transfers',
          'Announce funding round',
          'Press and PR',
          'Update cap table',
        ],
      },
    ],
  };

  const timeline = timelineTemplates[roundType];
  const totalWeeks = timeline.reduce((sum, phase) => {
    const weeks = parseInt(phase.duration.split('-')[1] || phase.duration.split('-')[0]);
    return sum + weeks;
  }, 0);

  return (
    <AuthGuard>
      <div className="min-h-screen relative">
        <StarField />
        <div className="absolute inset-0 bg-gradient-hero pointer-events-none" />

        <div className="relative z-10 container mx-auto px-4 py-8">
          <Button variant="outline" onClick={() => navigate('/dashboard')} className="mb-6 gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Button>

          <div className="max-w-4xl mx-auto space-y-6">
            <Card className="glass-card border-primary/20">
              <CardHeader>
                <CardTitle className="text-3xl flex items-center gap-2">
                  <Calendar className="w-8 h-8 text-primary" />
                  Fundraising Timeline Planner
                </CardTitle>
                <CardDescription>
                  Plan your fundraising journey with a detailed timeline
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Round Type</Label>
                    <Select value={roundType} onValueChange={setRoundType}>
                      <SelectTrigger className="mt-2 bg-background/50">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pre-seed">Pre-Seed</SelectItem>
                        <SelectItem value="seed">Seed</SelectItem>
                        <SelectItem value="series-a">Series A</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Target Amount ($)</Label>
                    <Input
                      type="number"
                      placeholder="1,000,000"
                      value={targetAmount}
                      onChange={(e) => setTargetAmount(e.target.value)}
                      className="mt-2 bg-background/50"
                    />
                  </div>

                  <div>
                    <Label>Target Start Date</Label>
                    <Input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="mt-2 bg-background/50"
                    />
                  </div>

                  <div className="flex items-end">
                    <div className="p-4 rounded-lg bg-primary/10 border border-primary/20 w-full">
                      <div className="text-sm text-muted-foreground">Expected Duration</div>
                      <div className="text-2xl font-bold text-primary">{totalWeeks} weeks</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-4">
              {timeline.map((phase, idx) => (
                <Card key={idx} className="glass-card border-primary/20">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-xl">{phase.phase}</CardTitle>
                        <CardDescription className="mt-1">Duration: {phase.duration}</CardDescription>
                      </div>
                      <Badge variant="outline">{idx + 1} of {timeline.length}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {phase.tasks.map((task, taskIdx) => (
                        <div key={taskIdx} className="flex items-start gap-3 p-3 rounded-lg bg-background/50 border border-border hover:border-primary/30 transition-colors">
                          <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                          <span className="text-sm">{task}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card className="glass-card border-primary/20">
              <CardHeader>
                <CardTitle>Key Tips for Success</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                  <h4 className="font-semibold mb-2">Start Early</h4>
                  <p className="text-sm text-muted-foreground">
                    Begin preparation 3-6 months before you actually need the money. Fundraising always takes longer than expected.
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                  <h4 className="font-semibold mb-2">Build Relationships</h4>
                  <p className="text-sm text-muted-foreground">
                    Start meeting investors 6-12 months before raising. Regular updates keep you top of mind.
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                  <h4 className="font-semibold mb-2">Create Momentum</h4>
                  <p className="text-sm text-muted-foreground">
                    Run a tight process with multiple conversations in parallel. FOMO is real in fundraising.
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                  <h4 className="font-semibold mb-2">Don't Rush Closing</h4>
                  <p className="text-sm text-muted-foreground">
                    Take time to pick the right partner. A bad investor can hurt more than help.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
};

export default FundraisingTimeline;
