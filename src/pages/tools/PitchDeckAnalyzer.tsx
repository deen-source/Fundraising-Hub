import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { StarField } from '@/components/StarField';
import { AuthGuard } from '@/components/AuthGuard';
import { ArrowLeft, Loader2, FileText, ThumbsUp, ThumbsDown, Target } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

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
    if (score >= 8) return 'text-green-500';
    if (score >= 6) return 'text-yellow-500';
    return 'text-red-500';
  };

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
                  <FileText className="w-8 h-8 text-primary" />
                  Pitch Deck Analyzer
                </CardTitle>
                <CardDescription>
                  Get AI-powered feedback on your pitch deck
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Paste your pitch deck content (slide by slide)
                  </label>
                  <Textarea
                    placeholder="Slide 1: Problem
We're solving...

Slide 2: Solution
Our platform...

(Continue with all slides)"
                    value={deckContent}
                    onChange={(e) => setDeckContent(e.target.value)}
                    rows={15}
                    className="bg-background/50"
                  />
                </div>

                <Button onClick={handleAnalyze} disabled={loading || !deckContent.trim()} className="w-full" size="lg">
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    'Analyze Pitch Deck'
                  )}
                </Button>
              </CardContent>
            </Card>

            {analysis && (
              <>
                <Card className="glass-card border-primary/20">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-2xl">Overall Assessment</CardTitle>
                      <div className="text-center">
                        <div className={`text-4xl font-bold ${getScoreColor(analysis.overall_score)}`}>
                          {analysis.overall_score}/10
                        </div>
                        <div className="text-sm text-muted-foreground">Overall Score</div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Investor Readiness</span>
                        <span className={`font-semibold ${getScoreColor(analysis.investor_readiness)}`}>
                          {analysis.investor_readiness}/10
                        </span>
                      </div>
                      <Progress value={analysis.investor_readiness * 10} className="h-3" />
                    </div>
                  </CardContent>
                </Card>

                {analysis.strengths && analysis.strengths.length > 0 && (
                  <Card className="glass-card border-primary/20">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-green-500">
                        <ThumbsUp className="w-5 h-5" />
                        Strengths
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {analysis.strengths.map((strength: string, idx: number) => (
                        <div key={idx} className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                          <p className="text-sm">{strength}</p>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}

                {analysis.weaknesses && analysis.weaknesses.length > 0 && (
                  <Card className="glass-card border-primary/20">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-orange-500">
                        <ThumbsDown className="w-5 h-5" />
                        Areas for Improvement
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {analysis.weaknesses.map((weakness: string, idx: number) => (
                        <div key={idx} className="p-3 rounded-lg bg-orange-500/10 border border-orange-500/20">
                          <p className="text-sm">{weakness}</p>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}

                {analysis.slide_feedback && analysis.slide_feedback.length > 0 && (
                  <Card className="glass-card border-primary/20">
                    <CardHeader>
                      <CardTitle>Slide-by-Slide Feedback</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {analysis.slide_feedback.map((slide: any, idx: number) => (
                        <div key={idx} className="p-4 rounded-lg bg-background/50 border border-border">
                          <div className="flex items-start justify-between mb-2">
                            <span className="font-medium">{slide.slide}</span>
                            <Badge variant={slide.score >= 7 ? 'default' : 'destructive'}>
                              {slide.score}/10
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{slide.feedback}</p>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}

                {analysis.recommendations && analysis.recommendations.length > 0 && (
                  <Card className="glass-card border-primary/20">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Target className="w-5 h-5 text-primary" />
                        Action Items
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {analysis.recommendations.map((rec: string, idx: number) => (
                        <div key={idx} className="p-3 rounded-lg bg-primary/10 border border-primary/20">
                          <p className="text-sm">{rec}</p>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </AuthGuard>
  );
};

export default PitchDeckAnalyzer;
