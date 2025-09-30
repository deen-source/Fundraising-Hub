import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { StarField } from '@/components/StarField';
import { AuthGuard } from '@/components/AuthGuard';
import { ArrowLeft, Loader2, FileText, TrendingUp, AlertTriangle, CheckCircle, Target, BarChart3, Sparkles, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

const PitchDeckAnalyzer = () => {
  const navigate = useNavigate();
  const [deckContent, setDeckContent] = useState('');
  const [analysis, setAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleAnalyze = async () => {
    if (!deckContent.trim()) {
      toast.error('Please enter your pitch deck content');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('analyze-pitch-deck', {
        body: { deckContent },
      });

      if (error) throw error;

      setAnalysis(data.analysis);
      toast.success('Analysis complete!');
    } catch (error: any) {
      console.error('Analysis error:', error);
      toast.error(error.message || 'Failed to analyze pitch deck');
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 8) return 'hsl(var(--success))';
    if (score >= 6) return 'hsl(var(--warning))';
    return 'hsl(var(--destructive))';
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'destructive';
      case 'high':
        return 'default';
      case 'medium':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'destructive';
      case 'medium':
        return 'default';
      case 'low':
        return 'secondary';
      default:
        return 'outline';
    }
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
                <Sparkles className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-primary">AI-Powered Pitch Analysis</span>
              </div>
              <h1 className="text-5xl font-bold tracking-tight">Pitch Deck Analyzer</h1>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Get comprehensive, investor-grade feedback on your pitch deck with detailed analysis across all key dimensions
              </p>
            </div>

            {/* Input Card */}
            <Card className="border-2 border-dashed border-primary/20 bg-card/50 backdrop-blur">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary" />
                  Your Pitch Deck Content
                </CardTitle>
                <CardDescription>
                  Paste your pitch deck content slide by slide. Include all key information: problem, solution, market, traction, team, and financials.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  placeholder="Slide 1: Problem
We're solving the $X billion problem of...

Slide 2: Solution
Our platform provides...

Slide 3: Market Opportunity
TAM: $X billion
SAM: $X billion
SOM: $X billion

Slide 4: Traction
- X customers
- $X MRR
- X% MoM growth

(Continue with all slides: Business Model, Competition, Team, Financials, Ask)"
                  value={deckContent}
                  onChange={(e) => setDeckContent(e.target.value)}
                  rows={20}
                  className="font-mono text-sm"
                />

                <Button 
                  onClick={handleAnalyze} 
                  disabled={loading || !deckContent.trim()} 
                  className="w-full" 
                  size="lg"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Analyzing Your Pitch Deck...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Analyze Pitch Deck
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {analysis && (
              <div className="space-y-6">
                {/* Executive Summary Banner */}
                <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-primary/20 via-primary/10 to-background border-2 border-primary/30 p-8">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
                  <div className="relative space-y-4">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-background/80 border border-primary/20">
                      <BarChart3 className="w-3 h-3 text-primary" />
                      <span className="text-xs font-medium text-primary uppercase tracking-wider">Executive Summary</span>
                    </div>
                    
                    <div className="flex items-start justify-between gap-8">
                      <div className="flex-1 space-y-2">
                        <h2 className="text-3xl font-bold">Deck Analysis Complete</h2>
                        <p className="text-lg text-muted-foreground leading-relaxed">
                          {analysis.executive_summary}
                        </p>
                      </div>
                      
                      <div className="flex gap-6">
                        <div className="text-center space-y-1">
                          <div className="text-5xl font-bold" style={{ color: getScoreColor(analysis.overall_score) }}>
                            {analysis.overall_score}
                          </div>
                          <div className="text-sm text-muted-foreground">Overall Score</div>
                        </div>
                        <div className="text-center space-y-1">
                          <div className="text-5xl font-bold" style={{ color: getScoreColor(analysis.investor_readiness) }}>
                            {analysis.investor_readiness}
                          </div>
                          <div className="text-sm text-muted-foreground">Investor Ready</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Category Scores */}
                {analysis.category_scores && (
                  <Card className="border-2 border-primary/10">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <BarChart3 className="w-5 h-5 text-primary" />
                        Performance by Category
                      </CardTitle>
                      <CardDescription>
                        Detailed breakdown of your deck's performance across key investment criteria
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {Object.entries(analysis.category_scores).map(([category, score]: [string, any]) => (
                        <div key={category} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium capitalize">
                              {category.replace(/_/g, ' ')}
                            </span>
                            <span className="text-sm font-bold" style={{ color: getScoreColor(score) }}>
                              {score}/10
                            </span>
                          </div>
                          <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <div 
                              className="h-full rounded-full transition-all duration-500"
                              style={{ 
                                width: `${score * 10}%`,
                                backgroundColor: getScoreColor(score)
                              }}
                            />
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}

                {/* Key Strengths */}
                {analysis.strengths && analysis.strengths.length > 0 && (
                  <Card className="border-2 border-success/20 bg-success/5">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-success">
                        <CheckCircle className="w-5 h-5" />
                        Key Strengths
                      </CardTitle>
                      <CardDescription>
                        What your pitch deck does exceptionally well
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {analysis.strengths.map((strength: any, idx: number) => (
                        <div key={idx} className="p-4 rounded-lg bg-background border border-success/30">
                          <div className="flex items-start gap-3">
                            <div className="mt-0.5">
                              <CheckCircle className="w-4 h-4 text-success" />
                            </div>
                            <div className="flex-1 space-y-1">
                              <div className="font-semibold text-success">{strength.title}</div>
                              <div className="text-sm text-muted-foreground">{strength.description}</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}

                {/* Critical Issues */}
                {analysis.weaknesses && analysis.weaknesses.length > 0 && (
                  <Card className="border-2 border-destructive/20 bg-destructive/5">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-destructive">
                        <AlertTriangle className="w-5 h-5" />
                        Areas for Improvement
                      </CardTitle>
                      <CardDescription>
                        Critical issues and weaknesses that need attention
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {analysis.weaknesses.map((weakness: any, idx: number) => (
                        <div key={idx} className="p-4 rounded-lg bg-background border border-destructive/30">
                          <div className="flex items-start gap-3">
                            <div className="mt-0.5">
                              <AlertTriangle className="w-4 h-4 text-destructive" />
                            </div>
                            <div className="flex-1 space-y-2">
                              <div className="flex items-center gap-2">
                                <div className="font-semibold">{weakness.title}</div>
                                <Badge variant={getSeverityColor(weakness.severity)} className="text-xs">
                                  {weakness.severity}
                                </Badge>
                              </div>
                              <div className="text-sm text-muted-foreground">{weakness.description}</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}

                {/* Slide-by-Slide Analysis */}
                {analysis.slide_feedback && analysis.slide_feedback.length > 0 && (
                  <Card className="border-2 border-primary/10">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <FileText className="w-5 h-5 text-primary" />
                        Slide-by-Slide Analysis
                      </CardTitle>
                      <CardDescription>
                        Detailed feedback on each slide in your deck
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Accordion type="single" collapsible className="w-full">
                        {analysis.slide_feedback.map((slide: any, idx: number) => (
                          <AccordionItem key={idx} value={`slide-${idx}`}>
                            <AccordionTrigger className="hover:no-underline">
                              <div className="flex items-center justify-between w-full pr-4">
                                <span className="font-semibold">{slide.slide}</span>
                                <div className="flex items-center gap-3">
                                  <span className="text-sm font-bold" style={{ color: getScoreColor(slide.score) }}>
                                    {slide.score}/10
                                  </span>
                                </div>
                              </div>
                            </AccordionTrigger>
                            <AccordionContent>
                              <div className="space-y-3 pt-2">
                                <p className="text-sm text-muted-foreground">{slide.feedback}</p>
                                {slide.suggestions && slide.suggestions.length > 0 && (
                                  <div className="space-y-2">
                                    <div className="text-sm font-medium">Suggestions:</div>
                                    <ul className="space-y-1">
                                      {slide.suggestions.map((suggestion: string, sIdx: number) => (
                                        <li key={sIdx} className="text-sm text-muted-foreground flex items-start gap-2">
                                          <ArrowRight className="w-3 h-3 text-primary mt-0.5 flex-shrink-0" />
                                          <span>{suggestion}</span>
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                              </div>
                            </AccordionContent>
                          </AccordionItem>
                        ))}
                      </Accordion>
                    </CardContent>
                  </Card>
                )}

                {/* Action Plan */}
                {analysis.recommendations && analysis.recommendations.length > 0 && (
                  <Card className="border-2 border-primary/20 bg-primary/5">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-primary">
                        <Target className="w-5 h-5" />
                        Prioritized Action Plan
                      </CardTitle>
                      <CardDescription>
                        Specific recommendations to improve your deck, ranked by priority
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {analysis.recommendations.map((rec: any, idx: number) => (
                        <div key={idx} className="p-4 rounded-lg bg-background border border-primary/30">
                          <div className="flex items-start gap-3">
                            <div className="mt-0.5">
                              <Target className="w-4 h-4 text-primary" />
                            </div>
                            <div className="flex-1 space-y-2">
                              <div className="flex items-center gap-2">
                                <Badge variant={getPriorityColor(rec.priority)} className="text-xs">
                                  {rec.priority} priority
                                </Badge>
                              </div>
                              <div className="font-semibold">{rec.action}</div>
                              <div className="text-sm text-muted-foreground">
                                <span className="font-medium">Expected Impact:</span> {rec.impact}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}

                {/* Next Steps */}
                {analysis.next_steps && analysis.next_steps.length > 0 && (
                  <Card className="border-2 border-primary/20">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-primary" />
                        Immediate Next Steps
                      </CardTitle>
                      <CardDescription>
                        Start with these high-impact improvements
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ol className="space-y-3">
                        {analysis.next_steps.map((step: string, idx: number) => (
                          <li key={idx} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm font-bold flex items-center justify-center">
                              {idx + 1}
                            </span>
                            <span className="text-sm flex-1 pt-0.5">{step}</span>
                          </li>
                        ))}
                      </ol>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </AuthGuard>
  );
};

export default PitchDeckAnalyzer;
