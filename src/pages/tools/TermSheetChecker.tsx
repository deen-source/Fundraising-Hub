import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { StarField } from '@/components/StarField';
import { AuthGuard } from '@/components/AuthGuard';
import { ArrowLeft, Loader2, CheckCircle, AlertTriangle, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';

const TermSheetChecker = () => {
  const navigate = useNavigate();
  const [termSheetText, setTermSheetText] = useState('');
  const [analysis, setAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleAnalyze = async () => {
    if (!termSheetText.trim()) {
      toast.error('Please enter your term sheet text');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('analyze-term-sheet', {
        body: { termSheetText },
      });

      if (error) throw error;

      setAnalysis(data.analysis);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('term_sheet_analyses').insert({
          user_id: user.id,
          term_sheet_text: termSheetText,
          analysis_result: data.analysis,
        });
      }

      toast.success('Analysis complete!');
    } catch (error: any) {
      console.error('Analysis error:', error);
      toast.error(error.message || 'Failed to analyze term sheet');
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
          <Button
            variant="outline"
            onClick={() => navigate('/dashboard')}
            className="mb-6 gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Button>

          <div className="max-w-4xl mx-auto space-y-6">
            <Card className="glass-card border-primary/20">
              <CardHeader>
                <CardTitle className="text-3xl">Term Sheet Checker</CardTitle>
                <CardDescription>
                  Get AI-powered analysis of your investment terms in seconds
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Paste your term sheet text below
                  </label>
                  <Textarea
                    placeholder="Paste your term sheet here..."
                    value={termSheetText}
                    onChange={(e) => setTermSheetText(e.target.value)}
                    rows={12}
                    className="bg-background/50 font-mono text-sm"
                  />
                </div>

                <Button
                  onClick={handleAnalyze}
                  disabled={loading || !termSheetText.trim()}
                  className="w-full"
                  size="lg"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    'Analyze Term Sheet'
                  )}
                </Button>
              </CardContent>
            </Card>

            {analysis && (
              <Card className="glass-card border-primary/20">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-2xl">Analysis Results</CardTitle>
                    <div className="text-center">
                      <div className={`text-4xl font-bold ${getScoreColor(analysis.overall_score)}`}>
                        {analysis.overall_score}/10
                      </div>
                      <div className="text-sm text-muted-foreground">Overall Score</div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {analysis.summary && (
                    <div>
                      <h3 className="font-semibold mb-2 flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-primary" />
                        Summary
                      </h3>
                      <p className="text-muted-foreground">{analysis.summary}</p>
                    </div>
                  )}

                  {analysis.key_terms && analysis.key_terms.length > 0 && (
                    <div>
                      <h3 className="font-semibold mb-3 flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 text-primary" />
                        Key Terms
                      </h3>
                      <div className="space-y-3">
                        {analysis.key_terms.map((term: any, idx: number) => (
                          <div key={idx} className="p-4 rounded-lg bg-background/50 border border-border">
                            <div className="flex items-start justify-between mb-2">
                              <span className="font-medium">{term.term}</span>
                              {term.value && <Badge variant="outline">{term.value}</Badge>}
                            </div>
                            {term.assessment && (
                              <p className="text-sm text-muted-foreground">{term.assessment}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {analysis.red_flags && analysis.red_flags.length > 0 && (
                    <div>
                      <h3 className="font-semibold mb-3 flex items-center gap-2 text-destructive">
                        <AlertTriangle className="w-5 h-5" />
                        Red Flags
                      </h3>
                      <div className="space-y-2">
                        {analysis.red_flags.map((flag: string, idx: number) => (
                          <div key={idx} className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                            <p className="text-sm">{flag}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {analysis.recommendations && analysis.recommendations.length > 0 && (
                    <div>
                      <h3 className="font-semibold mb-3 flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 text-green-500" />
                        Recommendations
                      </h3>
                      <div className="space-y-2">
                        {analysis.recommendations.map((rec: string, idx: number) => (
                          <div key={idx} className="p-3 rounded-lg bg-primary/10 border border-primary/20">
                            <p className="text-sm">{rec}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </AuthGuard>
  );
};

export default TermSheetChecker;
