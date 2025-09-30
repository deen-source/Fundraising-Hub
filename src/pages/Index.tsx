import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { StarField } from '@/components/StarField';
import { ArrowRight, Sparkles, FileText, BarChart3, Calculator, Users, TrendingUp, Calendar, PieChart, Target, CheckCircle2, Zap, Shield, Clock } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';


const tools = [
  {
    icon: FileText,
    title: 'Term Sheet Checker',
    description: 'AI-powered analysis of term sheets with detailed explanations of every clause and red flag detection.',
    path: '/tools/term-sheet',
    gradient: 'from-blue-500/10 to-cyan-500/10',
    iconGradient: 'from-blue-500 to-cyan-500',
    value: '98%',
    metric: 'accuracy rate',
    input: 'Upload term sheet',
    output: 'Detailed clause analysis, risk flags, market comparison'
  },
  {
    icon: BarChart3,
    title: 'Metric Benchmarks',
    description: 'Compare your startup metrics against industry standards and get actionable insights for improvement.',
    path: '/tools/benchmarks',
    gradient: 'from-purple-500/10 to-pink-500/10',
    iconGradient: 'from-purple-500 to-pink-500',
    value: '50K+',
    metric: 'startups benchmarked',
    input: 'Your metrics',
    output: 'Industry percentile, growth targets, competitor insights'
  },
  {
    icon: Calculator,
    title: 'SAFE Calculator',
    description: 'Calculate post-money valuation, dilution, and ownership after SAFE note conversions with multiple scenarios.',
    path: '/tools/safe-calculator',
    gradient: 'from-green-500/10 to-emerald-500/10',
    iconGradient: 'from-green-500 to-emerald-500',
    value: 'Instant',
    metric: 'calculations',
    input: 'SAFE terms',
    output: 'Post-money valuation, dilution %, ownership breakdown'
  },
  {
    icon: PieChart,
    title: 'Cap Table Manager',
    description: 'Visualize ownership structure, model new investments, and track dilution across funding rounds.',
    path: '/tools/cap-table',
    gradient: 'from-orange-500/10 to-red-500/10',
    iconGradient: 'from-orange-500 to-red-500',
    value: 'Live',
    metric: 'scenario modeling',
    input: 'Stakeholder data',
    output: 'Ownership charts, dilution forecasts, waterfall analysis'
  },
  {
    icon: TrendingUp,
    title: 'Valuation Calculator',
    description: 'Multiple valuation methods including DCF, Revenue Multiple, and VC Method with detailed analysis.',
    path: '/tools/valuation',
    gradient: 'from-indigo-500/10 to-blue-500/10',
    iconGradient: 'from-indigo-500 to-blue-500',
    value: '3',
    metric: 'valuation methods',
    input: 'Financial data',
    output: 'DCF analysis, revenue multiples, VC method results'
  },
  {
    icon: Target,
    title: 'Pitch Deck Analyzer',
    description: 'Get comprehensive AI feedback on your pitch deck with slide-by-slide analysis and recommendations.',
    path: '/tools/pitch-deck',
    gradient: 'from-pink-500/10 to-rose-500/10',
    iconGradient: 'from-pink-500 to-rose-500',
    value: 'AI',
    metric: 'powered insights',
    input: 'Upload deck',
    output: 'Slide ratings, improvement tips, investor perspective'
  },
  {
    icon: Users,
    title: 'Dilution Calculator',
    description: 'Model ownership dilution across multiple funding rounds with option pool scenarios and waterfall analysis.',
    path: '/tools/dilution',
    gradient: 'from-teal-500/10 to-cyan-500/10',
    iconGradient: 'from-teal-500 to-cyan-500',
    value: '10+',
    metric: 'rounds supported',
    input: 'Funding rounds',
    output: 'Round-by-round dilution, option pool impact, exit scenarios'
  },
  {
    icon: Calendar,
    title: 'Fundraising Timeline',
    description: 'Plan your fundraising journey with detailed week-by-week timelines and milestone tracking.',
    path: '/tools/timeline',
    gradient: 'from-violet-500/10 to-purple-500/10',
    iconGradient: 'from-violet-500 to-purple-500',
    value: '12-16',
    metric: 'week timeline',
    input: 'Target amount & stage',
    output: 'Week-by-week plan, milestones, investor outreach schedule'
  },
];

const benefits = [
  {
    icon: Zap,
    title: 'Instant Results',
    description: 'Get comprehensive analysis in seconds, not hours of manual research.',
  },
  {
    icon: Shield,
    title: 'Founder-Friendly',
    description: 'Built by founders for founders, with real-world scenarios and practical advice.',
  },
  {
    icon: CheckCircle2,
    title: 'Data-Driven',
    description: 'Leverage industry benchmarks and real market data for informed decisions.',
  },
  {
    icon: Clock,
    title: 'Save Time',
    description: 'Automate complex calculations and analysis that would take days manually.',
  },
];

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
    <div className="min-h-screen relative bg-background">
      <StarField />
      
      <div className="absolute inset-0 bg-gradient-hero pointer-events-none" />

      <div className="relative z-10">
        {/* Hero Section */}
        <section className="container mx-auto px-4 py-20 md:py-32">
          <div className="text-center max-w-5xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-8 animate-fade-in">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium">AI-Powered Investment Tools for Founders</span>
            </div>

            <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight animate-fade-in">
              The Complete{' '}
              <span className="bg-gradient-to-r from-primary via-primary-glow to-primary bg-clip-text text-transparent">
                Founder Toolkit
              </span>{' '}
              for Raising Capital
            </h1>

            <p className="text-xl text-muted-foreground mb-12 max-w-3xl mx-auto animate-fade-in">
              Professional-grade tools for term sheet analysis, cap table management, valuation modeling, 
              and fundraising planning—all in one place, powered by AI.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in">
              <Button
                size="lg"
                onClick={() => navigate('/auth')}
                className="text-lg px-8 py-6 shadow-glow hover:shadow-glow/80 transition-all group"
              >
                Get Started Free
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => navigate('/dashboard')}
                className="text-lg px-8 py-6"
              >
                Explore Tools
              </Button>
            </div>

            {/* Stats */}
            <div className="mt-20 grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card className="border-2 border-primary/20 bg-card/50 backdrop-blur">
                <CardContent className="pt-6 text-center">
                  <div className="text-4xl font-bold text-primary mb-2">8+</div>
                  <div className="text-sm text-muted-foreground">Professional Tools</div>
                </CardContent>
              </Card>
              <Card className="border-2 border-primary/20 bg-card/50 backdrop-blur">
                <CardContent className="pt-6 text-center">
                  <div className="text-4xl font-bold text-primary mb-2">AI</div>
                  <div className="text-sm text-muted-foreground">Powered Analysis</div>
                </CardContent>
              </Card>
              <Card className="border-2 border-primary/20 bg-card/50 backdrop-blur">
                <CardContent className="pt-6 text-center">
                  <div className="text-4xl font-bold text-primary mb-2">24/7</div>
                  <div className="text-sm text-muted-foreground">Available Access</div>
                </CardContent>
              </Card>
              <Card className="border-2 border-primary/20 bg-card/50 backdrop-blur">
                <CardContent className="pt-6 text-center">
                  <div className="text-4xl font-bold text-primary mb-2">Free</div>
                  <div className="text-sm text-muted-foreground">To Get Started</div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Tools Showcase */}
        <section className="container mx-auto px-4 py-20">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4">
              All-in-One Platform
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Every Tool You Need to Raise Capital
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              From term sheet analysis to cap table management, we've built everything founders 
              need to navigate the fundraising process with confidence.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {tools.map((tool, idx) => {
              const Icon = tool.icon;
              return (
                <Card 
                  key={idx}
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
                  </CardHeader>

                  <CardContent className="space-y-4 relative">
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {tool.description}
                    </p>

                    {/* Input/Output Flow */}
                    <div className="space-y-3 pt-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs font-normal border-primary/30">
                          Input
                        </Badge>
                        <span className="text-xs text-muted-foreground">{tool.input}</span>
                      </div>

                      <div className="flex items-center gap-2 pl-2">
                        <ArrowRight className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                        <span className="text-xs text-muted-foreground leading-tight">{tool.output}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>

        {/* Benefits Section */}
        <section className="container mx-auto px-4 py-20">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4">
              Why Choose Us
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Built for Founders, By Founders
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              We understand the challenges of fundraising because we've been there. Our tools 
              are designed to save you time and help you make better decisions.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {benefits.map((benefit, idx) => (
              <div key={idx} className="text-center space-y-4">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 border border-primary/20">
                  <benefit.icon className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold">{benefit.title}</h3>
                <p className="text-muted-foreground">{benefit.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Use Cases */}
        <section className="container mx-auto px-4 py-20">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4">
              Use Cases
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Perfect for Every Stage of Fundraising
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <Card className="border-2 border-primary/10 bg-card/50 backdrop-blur">
              <CardHeader>
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <Target className="w-6 h-6 text-primary" />
                </div>
                <CardTitle className="text-2xl">Pre-Fundraising</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-muted-foreground">Plan your fundraising timeline</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-muted-foreground">Calculate target valuation</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-muted-foreground">Model dilution scenarios</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-muted-foreground">Benchmark your metrics</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-primary/10 bg-card/50 backdrop-blur">
              <CardHeader>
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <Users className="w-6 h-6 text-primary" />
                </div>
                <CardTitle className="text-2xl">Active Fundraising</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-muted-foreground">Analyze term sheets in real-time</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-muted-foreground">Compare multiple offers</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-muted-foreground">Calculate SAFE conversions</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-muted-foreground">Optimize your pitch deck</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-primary/10 bg-card/50 backdrop-blur">
              <CardHeader>
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <TrendingUp className="w-6 h-6 text-primary" />
                </div>
                <CardTitle className="text-2xl">Post-Investment</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-muted-foreground">Manage your cap table</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-muted-foreground">Track ownership changes</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-muted-foreground">Plan next funding round</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-muted-foreground">Monitor key metrics</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* CTA Section */}
        <section className="container mx-auto px-4 py-20">
          <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/10 via-primary/5 to-background overflow-hidden relative">
            <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
            <CardContent className="relative py-16 px-8 text-center">
              <Badge variant="outline" className="mb-4">
                Ready to Get Started?
              </Badge>
              <h2 className="text-4xl md:text-5xl font-bold mb-4">
                Start Making Smarter Fundraising Decisions Today
              </h2>
              <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                Join founders who are using our tools to navigate fundraising with confidence
              </p>
              <Button
                size="lg"
                onClick={() => navigate('/auth')}
                className="text-lg px-8 py-6 shadow-glow hover:shadow-glow/80 transition-all group"
              >
                Get Started Free
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </CardContent>
          </Card>
        </section>

        {/* Footer */}
        <footer className="container mx-auto px-4 py-12 border-t border-border/50">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              <span className="font-semibold text-lg">Founder Toolkit</span>
            </div>
            <div className="text-sm text-muted-foreground">
              © 2025 Founder Toolkit. Built for founders, by founders.
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default Index;
