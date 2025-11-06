import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { StarField } from '@/components/StarField';
import { AuthGuard } from '@/components/AuthGuard';
import { ArrowLeft, Loader2, FileText, TrendingUp, AlertTriangle, CheckCircle, Target, BarChart3, Sparkles, ArrowRight, BookOpen, Lightbulb, AlertCircle, Users, DollarSign, LineChart, Presentation, Upload, X, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import * as pdfjsLib from 'pdfjs-dist';

// Set up PDF.js worker with proper path
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

const PitchDeckAnalyser = () => {
  const navigate = useNavigate();
  const [deckContent, setDeckContent] = useState('');
  const [analysis, setAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [extracting, setExtracting] = useState(false);
  const [pastAnalyses, setPastAnalyses] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  useEffect(() => {
    loadPastAnalyses();
  }, []);

  const loadPastAnalyses = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('term_sheet_analyses')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      setPastAnalyses(data || []);
    } catch (error) {
      console.error('Error loading past analyses:', error);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      toast.error('Please upload a PDF file');
      return;
    }

    setUploadedFile(file);
    setExtracting(true);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      let extractedText = '';

      // Extract text from each page
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map((item: any) => item.str)
          .join(' ');
        extractedText += `\n\nSlide ${i}:\n${pageText}`;
      }

      setDeckContent(extractedText.trim());
      toast.success(`Extracted content from ${pdf.numPages} slides`);
    } catch (error) {
      console.error('PDF extraction error:', error);
      toast.error('Failed to extract text from PDF');
      setUploadedFile(null);
    } finally {
      setExtracting(false);
    }
  };

  const handleRemoveFile = () => {
    setUploadedFile(null);
    setDeckContent('');
  };

  const handleAnalyze = async () => {
    if (!deckContent.trim()) {
      toast.error('Please upload a pitch deck or enter content');
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Please sign in to analyze your deck');
        return;
      }

      const { data, error } = await supabase.functions.invoke('analyze-pitch-deck', {
        body: { deckContent },
      });

      if (error) throw error;

      setAnalysis(data.analysis);

      // Save to database
      const { error: saveError } = await supabase
        .from('term_sheet_analyses')
        .insert({
          user_id: user.id,
          term_sheet_text: deckContent.substring(0, 1000), // Store preview
          analysis_result: data.analysis
        });

      if (saveError) {
        console.error('Error saving analysis:', saveError);
        toast.error('Analysis complete but failed to save');
      } else {
        toast.success('Analysis complete and saved!');
        loadPastAnalyses(); // Refresh history
      }
    } catch (error: any) {
      console.error('Analysis error:', error);
      toast.error(error.message || 'Failed to analyze pitch deck');
    } finally {
      setLoading(false);
    }
  };

  const loadPastAnalysis = (analysis: any) => {
    setDeckContent(analysis.term_sheet_text);
    setAnalysis(analysis.analysis_result);
    toast.success('Loaded past analysis');
  };


  // Helper function to determine score color
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
        <div className="container mx-auto px-4 py-8 max-w-7xl">
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
              <h1 className="text-5xl font-bold tracking-tight">Pitch Deck Analyser</h1>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Get comprehensive, investor-grade feedback on your pitch deck with detailed analysis across all key dimensions
              </p>
            </div>

            {/* How It Works */}
            <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-background">
              <CardContent className="pt-8">
                <div className="grid md:grid-cols-3 gap-8">
                  <div className="text-center space-y-3">
                    <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white text-2xl font-bold">
                      1
                    </div>
                    <div className="space-y-1">
                      <div className="font-semibold text-lg">Upload Your Deck</div>
                      <p className="text-sm text-muted-foreground">
                        Upload a PDF or paste your pitch deck content
                      </p>
                    </div>
                  </div>
                  
                  <div className="text-center space-y-3">
                    <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-2xl font-bold">
                      2
                    </div>
                    <div className="space-y-1">
                      <div className="font-semibold text-lg">AI Analyzes</div>
                      <p className="text-sm text-muted-foreground">
                        Our AI evaluates your deck across 10+ criteria
                      </p>
                    </div>
                  </div>
                  
                  <div className="text-center space-y-3">
                    <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center text-white text-2xl font-bold">
                      3
                    </div>
                    <div className="space-y-1">
                      <div className="font-semibold text-lg">Get Insights</div>
                      <p className="text-sm text-muted-foreground">
                        Receive detailed feedback and recommendations
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tabs Interface */}
            <Tabs defaultValue="analyzer" className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-8">
                <TabsTrigger value="analyzer" className="gap-2">
                  <Sparkles className="w-4 h-4" />
                  Analyser
                </TabsTrigger>
                <TabsTrigger value="understanding" className="gap-2">
                  <BookOpen className="w-4 h-4" />
                  Understanding Pitch Decks
                </TabsTrigger>
                <TabsTrigger value="best-practices" className="gap-2">
                  <Lightbulb className="w-4 h-4" />
                  Best Practices
                </TabsTrigger>
              </TabsList>

              {/* Analyser Tab */}
              <TabsContent value="analyzer" className="space-y-8">
                {/* Past Analyses */}
                {pastAnalyses.length > 0 && (
                  <Card className="border-2 border-primary/20">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Clock className="w-5 h-5 text-primary" />
                        Recent Analyses
                      </CardTitle>
                      <CardDescription>
                        Load a previous pitch deck analysis
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {pastAnalyses.map((item) => (
                          <div
                            key={item.id}
                            onClick={() => loadPastAnalysis(item)}
                            className="flex items-center justify-between p-4 rounded-lg border border-primary/20 bg-card/50 hover:bg-card/70 transition-colors cursor-pointer group"
                          >
                            <div className="flex-1">
                              <div className="text-sm font-medium">
                                {item.term_sheet_text.substring(0, 60)}...
                              </div>
                              <div className="text-xs text-muted-foreground mt-1">
                                {new Date(item.created_at).toLocaleDateString()} at {new Date(item.created_at).toLocaleTimeString()}
                              </div>
                            </div>
                            <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Input Card */}
                <Card className="border-2 border-dashed border-primary/20 bg-card/50 backdrop-blur">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="w-5 h-5 text-primary" />
                      Your Pitch Deck
                    </CardTitle>
                    <CardDescription>
                      Upload your pitch deck PDF or paste the content manually
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* File Upload Section */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Upload className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Upload PDF</span>
                      </div>
                      
                      {uploadedFile ? (
                        <div className="flex items-center justify-between p-4 rounded-lg border bg-background">
                          <div className="flex items-center gap-3">
                            <FileText className="w-5 h-5 text-primary" />
                            <div>
                              <div className="text-sm font-medium">{uploadedFile.name}</div>
                              <div className="text-xs text-muted-foreground">
                                {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                              </div>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleRemoveFile}
                            disabled={extracting || loading}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ) : (
                        <div className="relative">
                          <Input
                            type="file"
                            accept=".pdf"
                            onChange={handleFileUpload}
                            disabled={extracting || loading}
                            className="cursor-pointer"
                          />
                          {extracting && (
                            <div className="absolute inset-0 flex items-center justify-center bg-background/80 rounded-md">
                              <Loader2 className="w-4 h-4 animate-spin text-primary" />
                              <span className="ml-2 text-sm">Extracting text...</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t" />
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-card px-2 text-muted-foreground">Or paste content</span>
                      </div>
                    </div>

                    {/* Manual Input Section */}
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
                      rows={15}
                      className="font-mono text-sm"
                      disabled={extracting}
                    />

                    <Button 
                      onClick={handleAnalyze} 
                      disabled={loading || extracting || !deckContent.trim()} 
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
              </TabsContent>

              {/* Understanding Pitch Decks Tab */}
              <TabsContent value="understanding" className="space-y-6">
                <Card className="border-2 border-primary/10">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BookOpen className="w-5 h-5 text-primary" />
                      Understanding Pitch Decks
                    </CardTitle>
                    <CardDescription>
                      Learn what makes a pitch deck effective and how investors evaluate them
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Accordion type="single" collapsible className="w-full">
                      <AccordionItem value="what-is">
                        <AccordionTrigger className="text-left">
                          <div className="flex items-center gap-2">
                            <Presentation className="w-4 h-4 text-primary" />
                            What is a Pitch Deck?
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="space-y-4 text-muted-foreground">
                          <p>
                            A pitch deck is a brief presentation that provides investors with an overview of your business. 
                            It's typically 10-20 slides and is used during face-to-face or online meetings with potential 
                            investors, customers, partners, and co-founders.
                          </p>
                          <div className="space-y-2">
                            <p className="font-medium text-foreground">Purpose:</p>
                            <ul className="space-y-1 ml-4">
                              <li>• Tell a compelling story about your company</li>
                              <li>• Demonstrate market opportunity and business viability</li>
                              <li>• Show traction and momentum</li>
                              <li>• Generate investor interest for a follow-up meeting</li>
                            </ul>
                          </div>
                        </AccordionContent>
                      </AccordionItem>

                      <AccordionItem value="essential-slides">
                        <AccordionTrigger className="text-left">
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-primary" />
                            Essential Slides Every Deck Needs
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="space-y-4 text-muted-foreground">
                          <div className="grid gap-4">
                            <div className="p-4 rounded-lg bg-muted/50">
                              <div className="font-medium text-foreground mb-2">1. Problem</div>
                              <p className="text-sm">Clearly articulate the pain point you're solving. Make it relatable and urgent.</p>
                            </div>
                            <div className="p-4 rounded-lg bg-muted/50">
                              <div className="font-medium text-foreground mb-2">2. Solution</div>
                              <p className="text-sm">Show your product/service and how it elegantly solves the problem.</p>
                            </div>
                            <div className="p-4 rounded-lg bg-muted/50">
                              <div className="font-medium text-foreground mb-2">3. Market Opportunity</div>
                              <p className="text-sm">Demonstrate TAM, SAM, SOM with credible data sources. Show you're in a large, growing market.</p>
                            </div>
                            <div className="p-4 rounded-lg bg-muted/50">
                              <div className="font-medium text-foreground mb-2">4. Traction</div>
                              <p className="text-sm">Prove momentum with metrics: revenue, users, growth rate, partnerships, etc.</p>
                            </div>
                            <div className="p-4 rounded-lg bg-muted/50">
                              <div className="font-medium text-foreground mb-2">5. Business Model</div>
                              <p className="text-sm">Show how you make money. Include pricing, unit economics, and path to profitability.</p>
                            </div>
                            <div className="p-4 rounded-lg bg-muted/50">
                              <div className="font-medium text-foreground mb-2">6. Competition</div>
                              <p className="text-sm">Position yourself honestly against competitors. Show your unique advantages.</p>
                            </div>
                            <div className="p-4 rounded-lg bg-muted/50">
                              <div className="font-medium text-foreground mb-2">7. Team</div>
                              <p className="text-sm">Highlight relevant experience, domain expertise, and complementary skills.</p>
                            </div>
                            <div className="p-4 rounded-lg bg-muted/50">
                              <div className="font-medium text-foreground mb-2">8. Financials</div>
                              <p className="text-sm">3-5 year projections with key metrics. Show understanding of your unit economics.</p>
                            </div>
                            <div className="p-4 rounded-lg bg-muted/50">
                              <div className="font-medium text-foreground mb-2">9. The Ask</div>
                              <p className="text-sm">Specific amount raising, use of funds, and what milestones you'll achieve.</p>
                            </div>
                          </div>
                        </AccordionContent>
                      </AccordionItem>

                      <AccordionItem value="investor-perspective">
                        <AccordionTrigger className="text-left">
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4 text-primary" />
                            What Investors Look For
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="space-y-4 text-muted-foreground">
                          <div className="space-y-3">
                            <div className="flex items-start gap-3">
                              <Target className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                              <div>
                                <div className="font-medium text-foreground">Large Market Opportunity</div>
                                <p className="text-sm">They want to see you're addressing a $1B+ market with strong growth potential.</p>
                              </div>
                            </div>
                            <Separator />
                            <div className="flex items-start gap-3">
                              <TrendingUp className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                              <div>
                                <div className="font-medium text-foreground">Traction & Momentum</div>
                                <p className="text-sm">Evidence you can execute: growing revenue, user base, partnerships, or engagement.</p>
                              </div>
                            </div>
                            <Separator />
                            <div className="flex items-start gap-3">
                              <Users className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                              <div>
                                <div className="font-medium text-foreground">Strong Team</div>
                                <p className="text-sm">Domain expertise, complementary skills, and ability to execute on the vision.</p>
                              </div>
                            </div>
                            <Separator />
                            <div className="flex items-start gap-3">
                              <CheckCircle className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                              <div>
                                <div className="font-medium text-foreground">Differentiation</div>
                                <p className="text-sm">Clear competitive advantage and defensibility. Why you'll win.</p>
                              </div>
                            </div>
                            <Separator />
                            <div className="flex items-start gap-3">
                              <DollarSign className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                              <div>
                                <div className="font-medium text-foreground">Business Model Clarity</div>
                                <p className="text-sm">Proven or credible path to profitability with attractive unit economics.</p>
                              </div>
                            </div>
                            <Separator />
                            <div className="flex items-start gap-3">
                              <LineChart className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                              <div>
                                <div className="font-medium text-foreground">Realistic Yet Ambitious</div>
                                <p className="text-sm">Projections that are aggressive but grounded in reality and clear assumptions.</p>
                              </div>
                            </div>
                          </div>
                        </AccordionContent>
                      </AccordionItem>

                      <AccordionItem value="storytelling">
                        <AccordionTrigger className="text-left">
                          <div className="flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-primary" />
                            The Art of Storytelling
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="space-y-4 text-muted-foreground">
                          <p>
                            Great pitch decks tell a compelling story, not just present facts. Here's how to craft your narrative:
                          </p>
                          <div className="space-y-3">
                            <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                              <div className="font-medium text-foreground mb-2">Start with Why</div>
                              <p className="text-sm">Begin with the problem and why it matters. Make investors feel the pain.</p>
                            </div>
                            <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                              <div className="font-medium text-foreground mb-2">Show, Don't Tell</div>
                              <p className="text-sm">Use visuals, customer quotes, and data instead of bullet points where possible.</p>
                            </div>
                            <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                              <div className="font-medium text-foreground mb-2">Build Momentum</div>
                              <p className="text-sm">Structure slides to build excitement. Each slide should lead naturally to the next.</p>
                            </div>
                            <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                              <div className="font-medium text-foreground mb-2">End Strong</div>
                              <p className="text-sm">Close with a clear ask and compelling vision of what success looks like.</p>
                            </div>
                          </div>
                        </AccordionContent>
                      </AccordionItem>

                      <AccordionItem value="common-formats">
                        <AccordionTrigger className="text-left">
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-primary" />
                            Different Deck Formats
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="space-y-4 text-muted-foreground">
                          <div className="space-y-4">
                            <div className="p-4 rounded-lg border">
                              <div className="font-medium text-foreground mb-2">Presentation Deck (10-15 slides)</div>
                              <p className="text-sm mb-2">
                                Designed to be presented in person or over video call. Visual, concise, meant to guide 
                                conversation.
                              </p>
                              <p className="text-sm text-primary">Best for: Initial meetings, pitch competitions</p>
                            </div>
                            <div className="p-4 rounded-lg border">
                              <div className="font-medium text-foreground mb-2">Reading Deck (15-25 slides)</div>
                              <p className="text-sm mb-2">
                                More detailed, can stand alone. Includes more context and explanation for someone 
                                reading without you present.
                              </p>
                              <p className="text-sm text-primary">Best for: Cold outreach, email follow-ups</p>
                            </div>
                            <div className="p-4 rounded-lg border">
                              <div className="font-medium text-foreground mb-2">One-Pager</div>
                              <p className="text-sm mb-2">
                                Ultra-condensed version on a single page. All key information at a glance.
                              </p>
                              <p className="text-sm text-primary">Best for: Quick overviews, leaving behind after meetings</p>
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
                  {/* Tips for Founders */}
                  <Card className="border-2 border-success/20 bg-success/5">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-success">
                        <Lightbulb className="w-5 h-5" />
                        Tips for Founders
                      </CardTitle>
                      <CardDescription>
                        Best practices to make your pitch deck stand out
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-3">
                        <div className="flex items-start gap-3">
                          <CheckCircle className="w-5 h-5 text-success mt-0.5 flex-shrink-0" />
                          <div>
                            <div className="font-medium text-foreground">Lead with Traction</div>
                            <p className="text-sm text-muted-foreground">
                              Put your best metrics early. Show traction on slide 2-3 if you have strong numbers.
                            </p>
                          </div>
                        </div>
                        <Separator />
                        <div className="flex items-start gap-3">
                          <CheckCircle className="w-5 h-5 text-success mt-0.5 flex-shrink-0" />
                          <div>
                            <div className="font-medium text-foreground">Use Customer Quotes</div>
                            <p className="text-sm text-muted-foreground">
                              Include real testimonials and use cases. Let customers tell your story.
                            </p>
                          </div>
                        </div>
                        <Separator />
                        <div className="flex items-start gap-3">
                          <CheckCircle className="w-5 h-5 text-success mt-0.5 flex-shrink-0" />
                          <div>
                            <div className="font-medium text-foreground">Keep Design Clean</div>
                            <p className="text-sm text-muted-foreground">
                              One main point per slide. Use visuals over text. Professional but not overdone.
                            </p>
                          </div>
                        </div>
                        <Separator />
                        <div className="flex items-start gap-3">
                          <CheckCircle className="w-5 h-5 text-success mt-0.5 flex-shrink-0" />
                          <div>
                            <div className="font-medium text-foreground">Show Unit Economics</div>
                            <p className="text-sm text-muted-foreground">
                              Include CAC, LTV, payback period. Prove you understand your business model.
                            </p>
                          </div>
                        </div>
                        <Separator />
                        <div className="flex items-start gap-3">
                          <CheckCircle className="w-5 h-5 text-success mt-0.5 flex-shrink-0" />
                          <div>
                            <div className="font-medium text-foreground">Be Specific in The Ask</div>
                            <p className="text-sm text-muted-foreground">
                              "$2M to achieve $10M ARR in 18 months" beats "Raising Series A".
                            </p>
                          </div>
                        </div>
                        <Separator />
                        <div className="flex items-start gap-3">
                          <CheckCircle className="w-5 h-5 text-success mt-0.5 flex-shrink-0" />
                          <div>
                            <div className="font-medium text-foreground">Acknowledge Risks</div>
                            <p className="text-sm text-muted-foreground">
                              Address obvious concerns proactively. Show you've thought through challenges.
                            </p>
                          </div>
                        </div>
                        <Separator />
                        <div className="flex items-start gap-3">
                          <CheckCircle className="w-5 h-5 text-success mt-0.5 flex-shrink-0" />
                          <div>
                            <div className="font-medium text-foreground">Practice Your Delivery</div>
                            <p className="text-sm text-muted-foreground">
                              Know your deck cold. Be ready to skip slides or go deep based on interest.
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
                        Common Mistakes to Avoid
                      </CardTitle>
                      <CardDescription>
                        Pitfalls that can hurt your fundraising efforts
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-3">
                        <div className="flex items-start gap-3">
                          <AlertTriangle className="w-5 h-5 text-destructive mt-0.5 flex-shrink-0" />
                          <div>
                            <div className="font-medium text-foreground">Too Much Text</div>
                            <p className="text-sm text-muted-foreground">
                              Dense slides lose attention. If investors are reading, they're not listening to you.
                            </p>
                          </div>
                        </div>
                        <Separator />
                        <div className="flex items-start gap-3">
                          <AlertTriangle className="w-5 h-5 text-destructive mt-0.5 flex-shrink-0" />
                          <div>
                            <div className="font-medium text-foreground">Burying the Lead</div>
                            <p className="text-sm text-muted-foreground">
                              Don't hide your best stuff. If you have $5M ARR, say it early and prominently.
                            </p>
                          </div>
                        </div>
                        <Separator />
                        <div className="flex items-start gap-3">
                          <AlertTriangle className="w-5 h-5 text-destructive mt-0.5 flex-shrink-0" />
                          <div>
                            <div className="font-medium text-foreground">Unrealistic Projections</div>
                            <p className="text-sm text-muted-foreground">
                              "Hockey stick" growth with no justification destroys credibility instantly.
                            </p>
                          </div>
                        </div>
                        <Separator />
                        <div className="flex items-start gap-3">
                          <AlertTriangle className="w-5 h-5 text-destructive mt-0.5 flex-shrink-0" />
                          <div>
                            <div className="font-medium text-foreground">Ignoring Competition</div>
                            <p className="text-sm text-muted-foreground">
                              "We have no competitors" is a red flag. Show you understand the landscape.
                            </p>
                          </div>
                        </div>
                        <Separator />
                        <div className="flex items-start gap-3">
                          <AlertTriangle className="w-5 h-5 text-destructive mt-0.5 flex-shrink-0" />
                          <div>
                            <div className="font-medium text-foreground">Vague Value Proposition</div>
                            <p className="text-sm text-muted-foreground">
                              "AI-powered platform" says nothing. Be specific about what you do and for whom.
                            </p>
                          </div>
                        </div>
                        <Separator />
                        <div className="flex items-start gap-3">
                          <AlertTriangle className="w-5 h-5 text-destructive mt-0.5 flex-shrink-0" />
                          <div>
                            <div className="font-medium text-foreground">Missing Financials</div>
                            <p className="text-sm text-muted-foreground">
                              No revenue model or unit economics raises serious questions about business viability.
                            </p>
                          </div>
                        </div>
                        <Separator />
                        <div className="flex items-start gap-3">
                          <AlertTriangle className="w-5 h-5 text-destructive mt-0.5 flex-shrink-0" />
                          <div>
                            <div className="font-medium text-foreground">One-Size-Fits-All</div>
                            <p className="text-sm text-muted-foreground">
                              Tailor your deck to your audience. A seed deck is different from Series A.
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

export default PitchDeckAnalyser;
