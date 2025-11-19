import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
  const [stage, setStage] = useState<'Pre-Seed' | 'Seed' | 'Series A'>('Seed');
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
        .eq('tool_type', 'pitch_deck')
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

    const validTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.presentationml.presentation', 'application/vnd.ms-powerpoint'];
    if (!validTypes.includes(file.type)) {
      toast.error('Please upload a PDF or PPTX file');
      return;
    }

    // Handle PPTX files
    if (file.type.includes('presentation') || file.type.includes('powerpoint')) {
      toast.error('PPTX extraction is not yet supported. Please export your deck as PDF or paste the content manually below.');
      setUploadedFile(null);
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

  const handleAnalyse = async () => {
    if (!deckContent.trim()) {
      toast.error('Please upload a pitch deck or enter content');
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Please sign in to analyse your deck');
        return;
      }

      const { data, error } = await supabase.functions.invoke('analyze-pitch-deck', {
        body: { deckContent, stage },
      });

      if (error) throw error;

      setAnalysis(data.analysis);

      // Save to database
      const { error: saveError } = await supabase
        .from('term_sheet_analyses')
        .insert({
          user_id: user.id,
          term_sheet_text: deckContent.substring(0, 1000), // Store preview
          analysis_result: data.analysis,
          tool_type: 'pitch_deck',
          stage: stage,
          investment_grade: data.analysis.investment_grade,
          flagged_for_review: data.analysis.investment_grade === 'Strong Investment Candidate'
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
      toast.error(error.message || 'Failed to analyse pitch deck');
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
      <div className="min-h-screen relative bg-slate-50">
        <div className="container mx-auto px-4 py-12 max-w-7xl">
          {/* Back Button and Logo Row */}
          <div className="flex justify-between items-center mb-6">
            <Button variant="ghost" onClick={() => navigate('/dashboard')} className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </Button>

            {/* Arconic Logo aligned to right with same spacing */}
            <img src="/arconic-logo.svg" alt="Arconic Capital" className="h-10 w-10" />
          </div>

          <div className="space-y-16">
            {/* Header */}
            <div className="text-center space-y-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-muted border shadow-sm">
                <FileText className="w-4 h-4" />
                <span className="text-sm font-medium">Pitch Deck Analyser</span>
              </div>
              <h1 className="text-6xl md:text-7xl font-bold tracking-wide leading-tight">
                Get Investor-Ready Feedback on Your Deck
              </h1>
            </div>

            {/* How It Works */}
            <Card className="border-0 shadow-lg rounded-3xl bg-white">
              <CardContent className="p-16">
                <div className="grid md:grid-cols-3 gap-16">
                  <div className="text-center space-y-6">
                    <div className="mx-auto w-20 h-20 rounded-full bg-gray-800 flex items-center justify-center text-white text-3xl font-bold">
                      1
                    </div>
                    <div className="space-y-3">
                      <div className="font-bold text-2xl">Upload Your Deck</div>
                      <p className="text-base text-muted-foreground">
                        Upload a PDF or paste your pitch deck content
                      </p>
                    </div>
                  </div>

                  <div className="text-center space-y-6">
                    <div className="mx-auto w-20 h-20 rounded-full bg-gray-800 flex items-center justify-center text-white text-3xl font-bold">
                      2
                    </div>
                    <div className="space-y-3">
                      <div className="font-bold text-2xl">AI Analyses</div>
                      <p className="text-base text-muted-foreground">
                        Our AI evaluates your deck across 10+ criteria
                      </p>
                    </div>
                  </div>

                  <div className="text-center space-y-6">
                    <div className="mx-auto w-20 h-20 rounded-full bg-gray-800 flex items-center justify-center text-white text-3xl font-bold">
                      3
                    </div>
                    <div className="space-y-3">
                      <div className="font-bold text-2xl">Get Insights</div>
                      <p className="text-base text-muted-foreground">
                        Receive detailed feedback and recommendations
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tabs Interface */}
            <Tabs defaultValue="analyzer" className="w-full">
              <TabsList className="grid w-full grid-cols-4 mb-8 bg-muted p-1 h-auto border-2 rounded-2xl">
                <TabsTrigger value="analyzer" className="gap-2 border rounded-xl data-[state=active]:bg-background data-[state=active]:border-foreground data-[state=active]:shadow-sm">
                  <Sparkles className="w-4 h-4" />
                  Analyser
                </TabsTrigger>
                <TabsTrigger value="pre-deck-exercise" className="gap-2 border rounded-xl data-[state=active]:bg-background data-[state=active]:border-foreground data-[state=active]:shadow-sm">
                  <Target className="w-4 h-4" />
                  Pre-Deck Exercise
                </TabsTrigger>
                <TabsTrigger value="understanding" className="gap-2 border rounded-xl data-[state=active]:bg-background data-[state=active]:border-foreground data-[state=active]:shadow-sm">
                  <BookOpen className="w-4 h-4" />
                  Understanding Pitch Decks
                </TabsTrigger>
                <TabsTrigger value="best-practices" className="gap-2 border rounded-xl data-[state=active]:bg-background data-[state=active]:border-foreground data-[state=active]:shadow-sm">
                  <Lightbulb className="w-4 h-4" />
                  Best Practices
                </TabsTrigger>
              </TabsList>

              {/* Analyser Tab */}
              <TabsContent value="analyzer" className="space-y-12">
                {/* Past Analyses */}
                {pastAnalyses.length > 0 && (
                  <Card className="border-0 shadow-lg rounded-3xl bg-white">
                    <CardHeader className="p-8">
                      <CardTitle className="flex items-center gap-3 text-2xl font-bold">
                        <Clock className="w-6 h-6" />
                        Recent Analyses
                      </CardTitle>
                      <CardDescription className="text-base mt-2">
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
                <Card className="border-2 border-dashed shadow-md rounded-3xl">
                  <CardHeader className="p-8">
                    <CardTitle className="flex items-center gap-3 text-2xl font-bold">
                      <FileText className="w-6 h-6" />
                      Your Pitch Deck
                    </CardTitle>
                    <CardDescription className="text-base mt-2">
                      Upload your pitch deck (PDF recommended) or paste the content manually
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-8 p-8">
                    {/* Stage Selector */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Target className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Fundraising Stage</span>
                      </div>
                      <Select value={stage} onValueChange={(value) => setStage(value as 'Pre-Seed' | 'Seed' | 'Series A')}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select your fundraising stage" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Pre-Seed">Pre-Seed</SelectItem>
                          <SelectItem value="Seed">Seed</SelectItem>
                          <SelectItem value="Series A">Series A</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">
                        Our AI will evaluate your deck based on stage-specific expectations
                      </p>
                    </div>

                    {/* File Upload Section */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Upload className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Upload PDF</span>
                      </div>
                      
                      {uploadedFile ? (
                        <div className="flex items-center justify-between p-4 rounded-lg border bg-background">
                          <div className="flex items-center gap-3">
                            <FileText className="w-5 h-5" />
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
                            accept=".pdf,.pptx"
                            onChange={handleFileUpload}
                            disabled={extracting || loading}
                            className="cursor-pointer"
                          />
                          {extracting && (
                            <div className="absolute inset-0 flex items-center justify-center bg-background/80 rounded-md">
                              <Loader2 className="w-4 h-4 animate-spin" />
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
TAM: $X billion..."
                      value={deckContent}
                      onChange={(e) => setDeckContent(e.target.value)}
                      rows={8}
                      className="font-mono text-sm"
                      disabled={extracting}
                    />

                    <Button
                      onClick={handleAnalyse}
                      disabled={loading || extracting || !deckContent.trim()}
                      className="w-full text-lg font-bold py-6"
                      size="lg"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                          Analysing Your Pitch Deck...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-5 h-5 mr-2" />
                          Analyse Pitch Deck
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>

                {analysis && (
              <div className="space-y-6">
                {/* Two Verdicts Side-by-Side */}
                <div className="grid md:grid-cols-2 gap-8">
                  {/* Pitch Deck Quality */}
                  <Card className={`border-2 ${
                    analysis.pitch_deck_quality === 'Ready' ? 'border-success/50 bg-success/5' :
                    analysis.pitch_deck_quality === 'Close' ? 'border-warning/50 bg-warning/5' :
                    'border-destructive/50 bg-destructive/5'
                  }`}>
                    <CardHeader className="p-6">
                      <CardTitle className="flex items-center gap-2 text-sm uppercase tracking-wider text-muted-foreground">
                        <FileText className="w-4 h-4" />
                        Pitch Deck Quality
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 pt-0">
                      <div className="space-y-6">
                        <div className={`text-5xl font-bold ${
                          analysis.pitch_deck_quality === 'Ready' ? 'text-success' :
                          analysis.pitch_deck_quality === 'Close' ? 'text-warning' :
                          'text-destructive'
                        }`}>
                          {analysis.pitch_deck_quality}
                        </div>
                        <div className="flex gap-8">
                          <div>
                            <div className="text-3xl font-bold mb-1" style={{ color: getScoreColor(analysis.overall_score) }}>
                              {analysis.overall_score}
                            </div>
                            <div className="text-sm text-muted-foreground">Overall</div>
                          </div>
                          <div>
                            <div className="text-3xl font-bold mb-1" style={{ color: getScoreColor(analysis.investor_readiness) }}>
                              {analysis.investor_readiness}
                            </div>
                            <div className="text-sm text-muted-foreground">Readiness</div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Investment Grade */}
                  <Card className={`border-2 ${
                    analysis.investment_grade === 'Strong Investment Candidate' ? 'border-success/50 bg-success/5' :
                    analysis.investment_grade === 'Promising Opportunity' ? 'border-primary/50 bg-primary/5' :
                    analysis.investment_grade === 'Early Stage Potential' ? 'border-warning/50 bg-warning/5' :
                    'border-muted/50 bg-muted/5'
                  }`}>
                    <CardHeader className="p-6">
                      <CardTitle className="flex items-center gap-2 text-sm uppercase tracking-wider text-muted-foreground">
                        <TrendingUp className="w-4 h-4" />
                        Investment Grade
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 pt-0">
                      <div className="space-y-4">
                        <div className={`text-3xl font-bold ${
                          analysis.investment_grade === 'Strong Investment Candidate' ? 'text-success' :
                          analysis.investment_grade === 'Promising Opportunity' ? 'text-primary' :
                          analysis.investment_grade === 'Early Stage Potential' ? 'text-warning' :
                          'text-muted-foreground'
                        }`}>
                          {analysis.investment_grade || 'Not Assessed'}
                        </div>
                        <p className="text-base text-muted-foreground leading-relaxed">
                          {analysis.investment_grade_reasoning || 'Investment grade analysis not available.'}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* First Impression Score */}
                {analysis.first_impression && (
                  <Card className={`border-2 ${
                    analysis.first_impression.verdict === 'CONTINUE' ? 'border-success/30 bg-success/5' : 'border-destructive/30 bg-destructive/5'
                  }`}>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Clock className="w-5 h-5" />
                        First Impression (The 3-Minute Test)
                      </CardTitle>
                      <CardDescription>
                        Investors often decide in the first 3 minutes of reading a deck if it's a pass or a deeper look
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-center gap-4">
                          <div className={`text-3xl font-bold ${
                            analysis.first_impression.verdict === 'CONTINUE' ? 'text-success' : 'text-destructive'
                          }`}>
                            {analysis.first_impression.verdict === 'CONTINUE' ? '✓ CONTINUE READING' : '✗ LIKELY PASS'}
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold" style={{ color: getScoreColor(analysis.first_impression.score) }}>
                              {analysis.first_impression.score}/10
                            </div>
                            <div className="text-xs text-muted-foreground">Impact Score</div>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {analysis.first_impression.reasoning}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Executive Summary */}
                <Card className="border-0 shadow-lg rounded-3xl bg-white">
                  <CardHeader className="p-8">
                    <CardTitle className="flex items-center gap-3 text-2xl font-bold">
                      <BarChart3 className="w-6 h-6" />
                      Executive Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-8 pt-0">
                    <p className="text-base text-muted-foreground leading-relaxed">
                      {analysis.executive_summary}
                    </p>
                  </CardContent>
                </Card>

                {/* Category Scores */}
                {analysis.category_scores && (
                  <Card className="border-0 shadow-lg rounded-3xl bg-white">
                    <CardHeader className="p-8">
                      <CardTitle className="flex items-center gap-3 text-2xl font-bold">
                        <BarChart3 className="w-6 h-6" />
                        Performance by Category
                      </CardTitle>
                      <CardDescription className="text-base mt-2">
                        Detailed breakdown of your deck's performance across key investment criteria
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-8 p-8 pt-0">
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
                  <Card className="border-0 shadow-lg rounded-3xl bg-white">
                    <CardHeader className="p-8">
                      <CardTitle className="flex items-center gap-3 text-2xl font-bold">
                        <CheckCircle className="w-6 h-6" />
                        Key Strengths
                      </CardTitle>
                      <CardDescription className="text-base mt-2">
                        What your pitch deck does exceptionally well
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 p-8 pt-0">
                      {analysis.strengths.map((strength: any, idx: number) => (
                        <div key={idx} className="p-5 rounded-2xl bg-muted border-2">
                          <div className="flex items-start gap-3">
                            <div className="mt-0.5">
                              <CheckCircle className="w-5 h-5 text-foreground" />
                            </div>
                            <div className="flex-1 space-y-2">
                              <div className="font-bold text-lg text-foreground">{strength.title}</div>
                              <div className="text-base text-muted-foreground">{strength.description}</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}

                {/* Critical Issues */}
                {analysis.weaknesses && analysis.weaknesses.length > 0 && (
                  <Card className="border-0 shadow-lg rounded-3xl bg-white">
                    <CardHeader className="p-8">
                      <CardTitle className="flex items-center gap-3 text-2xl font-bold text-destructive">
                        <AlertTriangle className="w-6 h-6" />
                        Areas for Improvement
                      </CardTitle>
                      <CardDescription className="text-base mt-2">
                        Critical issues and weaknesses that need attention
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 p-8 pt-0">
                      {analysis.weaknesses.map((weakness: any, idx: number) => (
                        <div key={idx} className="p-5 rounded-2xl bg-background border border-destructive/30">
                          <div className="flex items-start gap-3">
                            <div className="mt-0.5">
                              <AlertTriangle className="w-5 h-5 text-destructive" />
                            </div>
                            <div className="flex-1 space-y-2">
                              <div className="flex items-center gap-2">
                                <div className="font-bold text-lg">{weakness.title}</div>
                                <Badge variant={getSeverityColor(weakness.severity)} className="text-xs">
                                  {weakness.severity}
                                </Badge>
                              </div>
                              <div className="text-base text-muted-foreground">{weakness.description}</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}

                {/* Investor Questions */}
                {analysis.investor_questions && analysis.investor_questions.length > 0 && (
                  <Card className="border-0 shadow-lg rounded-3xl bg-white">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Users className="w-5 h-5" />
                        Questions Investors Will Ask
                      </CardTitle>
                      <CardDescription>
                        Based on gaps in your deck, be prepared to answer these questions
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {analysis.investor_questions.map((question: string, idx: number) => (
                        <div key={idx} className="p-4 rounded-2xl bg-background border border-primary/30">
                          <div className="flex items-start gap-3">
                            <div className="mt-0.5">
                              <AlertCircle className="w-4 h-4" />
                            </div>
                            <div className="flex-1">
                              <div className="text-sm font-medium">{question}</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}

                {/* Slide Ordering Suggestions */}
                {analysis.slide_ordering_suggestions && analysis.slide_ordering_suggestions.length > 0 && (
                  <Card className="border-0 shadow-lg rounded-3xl bg-white">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-warning">
                        <ArrowRight className="w-5 h-5" />
                        Deck Structure Suggestions
                      </CardTitle>
                      <CardDescription>
                        Reorder these slides to maximize impact
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {analysis.slide_ordering_suggestions.map((suggestion: any, idx: number) => (
                        <div key={idx} className="p-4 rounded-2xl bg-background border border-warning/30">
                          <div className="flex items-start gap-3">
                            <div className="mt-0.5">
                              <ArrowRight className="w-4 h-4 text-warning" />
                            </div>
                            <div className="flex-1 space-y-1">
                              <div className="font-semibold">
                                Move Slide {suggestion.slide_number} ({suggestion.slide_type}) to position {suggestion.suggested_position}
                              </div>
                              <div className="text-sm text-muted-foreground">{suggestion.reasoning}</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}

                {/* Missing Slides */}
                {analysis.missing_slides && analysis.missing_slides.length > 0 && (
                  <Card className="border-0 shadow-lg rounded-3xl bg-white">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-destructive">
                        <AlertTriangle className="w-5 h-5" />
                        Missing Essential Slides
                      </CardTitle>
                      <CardDescription>
                        Your deck is missing these slides expected at the {stage} stage
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {analysis.missing_slides.map((slide: string, idx: number) => (
                        <div key={idx} className="flex items-center gap-2 p-3 rounded-lg bg-background border border-destructive/30">
                          <AlertTriangle className="w-4 h-4 text-destructive" />
                          <span className="text-sm font-medium">{slide}</span>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}

                {/* Slide-by-Slide Analysis */}
                {analysis.slide_feedback && analysis.slide_feedback.length > 0 && (
                  <Card className="border-0 shadow-lg rounded-3xl bg-white">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <FileText className="w-5 h-5" />
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
                                <div className="flex items-center gap-3">
                                  <span className="font-semibold">Slide {slide.slide_number || idx + 1}</span>
                                  <Badge variant={slide.is_essential ? "default" : "outline"} className="text-xs">
                                    {slide.slide_type || 'Unidentified'}
                                  </Badge>
                                  {slide.word_count && slide.word_count > 50 && (
                                    <Badge variant="destructive" className="text-xs">
                                      {slide.word_count} words
                                    </Badge>
                                  )}
                                </div>
                                <div className="flex items-center gap-3">
                                  <span className="text-sm font-bold" style={{ color: getScoreColor(slide.score) }}>
                                    {slide.score}/10
                                  </span>
                                </div>
                              </div>
                            </AccordionTrigger>
                            <AccordionContent>
                              <div className="space-y-3 pt-2">
                                {slide.slide_title && (
                                  <div className="text-sm font-medium text-foreground">"{slide.slide_title}"</div>
                                )}
                                <p className="text-sm text-muted-foreground">{slide.feedback}</p>
                                {!slide.stage_appropriate && (
                                  <div className="p-3 rounded-lg bg-warning/10 border border-warning/30">
                                    <div className="flex items-start gap-2">
                                      <AlertTriangle className="w-4 h-4 text-warning mt-0.5" />
                                      <span className="text-sm text-warning">Content may not be appropriate for {stage} stage</span>
                                    </div>
                                  </div>
                                )}
                                {slide.suggestions && slide.suggestions.length > 0 && (
                                  <div className="space-y-2">
                                    <div className="text-sm font-medium">Suggestions:</div>
                                    <ul className="space-y-1">
                                      {slide.suggestions.map((suggestion: string, sIdx: number) => (
                                        <li key={sIdx} className="text-sm text-muted-foreground flex items-start gap-2">
                                          <ArrowRight className="w-3 h-3 mt-0.5 flex-shrink-0" />
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
                  <Card className="border-0 shadow-lg rounded-3xl bg-white">
                    <CardHeader className="p-8">
                      <CardTitle className="flex items-center gap-3 text-2xl font-bold">
                        <Target className="w-6 h-6" />
                        Prioritized Action Plan
                      </CardTitle>
                      <CardDescription className="text-base mt-2">
                        Specific recommendations to improve your deck, ranked by priority
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 p-8 pt-0">
                      {analysis.recommendations.map((rec: any, idx: number) => (
                        <div key={idx} className="p-4 rounded-2xl bg-background border border-primary/30">
                          <div className="flex items-start gap-3">
                            <div className="mt-0.5">
                              <Target className="w-4 h-4" />
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
                  <Card className="border-0 shadow-lg rounded-3xl bg-white">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="w-5 h-5" />
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
                            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary-foreground text-sm font-bold flex items-center justify-center">
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

              {/* Pre-Deck Exercise Tab */}
              <TabsContent value="pre-deck-exercise" className="space-y-6">
                <Card className="border-2 border-primary/10">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="w-5 h-5" />
                      Before You Build Your Deck
                    </CardTitle>
                    <CardDescription>
                      A strategic exercise to clarify your narrative before creating slides
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="p-4 rounded-2xl bg-primary/5 border border-primary/20">
                      <p className="text-sm text-muted-foreground">
                        <strong>Why this matters:</strong> Investors often decide in the first 3 minutes of reading a deck if it's a pass or a deeper look.
                        Before designing slides, crystallize your story.
                      </p>
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">The Exercise</h3>
                      <div className="space-y-3">
                        <div className="p-4 rounded-2xl border bg-card">
                          <div className="font-medium mb-2">Step 1: Write Your Narrative in 10-15 Bullets</div>
                          <p className="text-sm text-muted-foreground mb-3">
                            Each bullet should be a key point you need investors to understand. Don't think in slides yet—just capture the story.
                          </p>
                          <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                            <li>• What problem are you solving?</li>
                            <li>• Why is this urgent for customers?</li>
                            <li>• What's your solution?</li>
                            <li>• Why hasn't this been built before (Why now)?</li>
                            <li>• How big is the market opportunity?</li>
                            <li>• What traction have you achieved?</li>
                            <li>• How do you make money?</li>
                            <li>• Who are your competitors and why will you win?</li>
                            <li>• Why is your team uniquely positioned to execute?</li>
                            <li>• How much are you raising and what will you achieve with it?</li>
                          </ul>
                        </div>

                        <div className="p-4 rounded-2xl border bg-card">
                          <div className="font-medium mb-2">Step 2: Under Each Bullet, List Your Evidence</div>
                          <p className="text-sm text-muted-foreground mb-3">
                            For each narrative point, write down the data, metrics, customer quotes, or facts that prove it.
                          </p>
                          <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded mt-2">
                            <strong>Example:</strong><br/>
                            <em>Bullet:</em> "Our product solves X problem"<br/>
                            <em>Evidence:</em> "150 customers, 95% retention rate, NPS of 72, customer quote: 'This saved us 20 hours/week'"
                          </div>
                        </div>

                        <div className="p-4 rounded-2xl border bg-card">
                          <div className="font-medium mb-2">Step 3: Build One Slide Per Bullet</div>
                          <p className="text-sm text-muted-foreground">
                            Now translate each bullet + evidence into a single slide. The bullet becomes your slide title (make it a takeaway, not generic).
                            The evidence becomes the content.
                          </p>
                        </div>

                        <div className="p-4 rounded-2xl border bg-card">
                          <div className="font-medium mb-2">Step 4: Anticipate Investor Questions</div>
                          <p className="text-sm text-muted-foreground mb-3">
                            Write down every question you expect investors to ask. Then prepare clear, concise answers.
                          </p>
                          <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                            <li>• What questions would YOU ask if you were investing?</li>
                            <li>• What are the obvious risks or challenges?</li>
                            <li>• What might investors be skeptical about?</li>
                          </ul>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-muted/50">
                      <div className="font-medium mb-2">Remember: Think like your audience</div>
                      <p className="text-sm text-muted-foreground">
                        Investors are smart people who know nothing about your business or industry. Every slide should be immediately clear,
                        every claim should be backed by evidence, and every chart should be understandable at a glance.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Understanding Pitch Decks Tab */}
              <TabsContent value="understanding" className="space-y-6">
                <Card className="border-2 border-primary/10">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BookOpen className="w-5 h-5" />
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
                            <Presentation className="w-4 h-4" />
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
                            <FileText className="w-4 h-4" />
                            Essential Slides Every Deck Needs
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="space-y-4 text-muted-foreground">
                          <div className="grid gap-4">
                            <div className="p-4 rounded-2xl bg-muted/50">
                              <div className="font-medium text-foreground mb-2">1. Problem</div>
                              <p className="text-sm">Clearly articulate the pain point you're solving. Make it relatable and urgent.</p>
                            </div>
                            <div className="p-4 rounded-2xl bg-muted/50">
                              <div className="font-medium text-foreground mb-2">2. Solution</div>
                              <p className="text-sm">Show your product/service and how it elegantly solves the problem.</p>
                            </div>
                            <div className="p-4 rounded-2xl bg-muted/50">
                              <div className="font-medium text-foreground mb-2">3. Market Opportunity</div>
                              <p className="text-sm">Demonstrate TAM, SAM, SOM with credible data sources. Show you're in a large, growing market.</p>
                            </div>
                            <div className="p-4 rounded-2xl bg-muted/50">
                              <div className="font-medium text-foreground mb-2">4. Traction</div>
                              <p className="text-sm">Prove momentum with metrics: revenue, users, growth rate, partnerships, etc.</p>
                            </div>
                            <div className="p-4 rounded-2xl bg-muted/50">
                              <div className="font-medium text-foreground mb-2">5. Business Model</div>
                              <p className="text-sm">Show how you make money. Include pricing, unit economics, and path to profitability.</p>
                            </div>
                            <div className="p-4 rounded-2xl bg-muted/50">
                              <div className="font-medium text-foreground mb-2">6. Competition</div>
                              <p className="text-sm">Position yourself honestly against competitors. Show your unique advantages.</p>
                            </div>
                            <div className="p-4 rounded-2xl bg-muted/50">
                              <div className="font-medium text-foreground mb-2">7. Team</div>
                              <p className="text-sm">Highlight relevant experience, domain expertise, and complementary skills.</p>
                            </div>
                            <div className="p-4 rounded-2xl bg-muted/50">
                              <div className="font-medium text-foreground mb-2">8. Financials</div>
                              <p className="text-sm">3-5 year projections with key metrics. Show understanding of your unit economics.</p>
                            </div>
                            <div className="p-4 rounded-2xl bg-muted/50">
                              <div className="font-medium text-foreground mb-2">9. The Ask</div>
                              <p className="text-sm">Specific amount raising, use of funds, and what milestones you'll achieve.</p>
                            </div>
                          </div>
                        </AccordionContent>
                      </AccordionItem>

                      <AccordionItem value="investor-perspective">
                        <AccordionTrigger className="text-left">
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4" />
                            What Investors Look For
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="space-y-4 text-muted-foreground">
                          <div className="space-y-3">
                            <div className="flex items-start gap-3">
                              <Target className="w-5 h-5 mt-0.5 flex-shrink-0" />
                              <div>
                                <div className="font-medium text-foreground">Large Market Opportunity</div>
                                <p className="text-sm">They want to see you're addressing a $1B+ market with strong growth potential.</p>
                              </div>
                            </div>
                            <Separator />
                            <div className="flex items-start gap-3">
                              <TrendingUp className="w-5 h-5 mt-0.5 flex-shrink-0" />
                              <div>
                                <div className="font-medium text-foreground">Traction & Momentum</div>
                                <p className="text-sm">Evidence you can execute: growing revenue, user base, partnerships, or engagement.</p>
                              </div>
                            </div>
                            <Separator />
                            <div className="flex items-start gap-3">
                              <Users className="w-5 h-5 mt-0.5 flex-shrink-0" />
                              <div>
                                <div className="font-medium text-foreground">Strong Team</div>
                                <p className="text-sm">Domain expertise, complementary skills, and ability to execute on the vision.</p>
                              </div>
                            </div>
                            <Separator />
                            <div className="flex items-start gap-3">
                              <CheckCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                              <div>
                                <div className="font-medium text-foreground">Differentiation</div>
                                <p className="text-sm">Clear competitive advantage and defensibility. Why you'll win.</p>
                              </div>
                            </div>
                            <Separator />
                            <div className="flex items-start gap-3">
                              <DollarSign className="w-5 h-5 mt-0.5 flex-shrink-0" />
                              <div>
                                <div className="font-medium text-foreground">Business Model Clarity</div>
                                <p className="text-sm">Proven or credible path to profitability with attractive unit economics.</p>
                              </div>
                            </div>
                            <Separator />
                            <div className="flex items-start gap-3">
                              <LineChart className="w-5 h-5 mt-0.5 flex-shrink-0" />
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
                            <Sparkles className="w-4 h-4" />
                            The Art of Storytelling
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="space-y-4 text-muted-foreground">
                          <p>
                            Great pitch decks tell a compelling story, not just present facts. Here's how to craft your narrative:
                          </p>
                          <div className="space-y-3">
                            <div className="p-4 rounded-2xl bg-primary/5 border border-primary/20">
                              <div className="font-medium text-foreground mb-2">Start with Why</div>
                              <p className="text-sm">Begin with the problem and why it matters. Make investors feel the pain.</p>
                            </div>
                            <div className="p-4 rounded-2xl bg-primary/5 border border-primary/20">
                              <div className="font-medium text-foreground mb-2">Show, Don't Tell</div>
                              <p className="text-sm">Use visuals, customer quotes, and data instead of bullet points where possible.</p>
                            </div>
                            <div className="p-4 rounded-2xl bg-primary/5 border border-primary/20">
                              <div className="font-medium text-foreground mb-2">Build Momentum</div>
                              <p className="text-sm">Structure slides to build excitement. Each slide should lead naturally to the next.</p>
                            </div>
                            <div className="p-4 rounded-2xl bg-primary/5 border border-primary/20">
                              <div className="font-medium text-foreground mb-2">End Strong</div>
                              <p className="text-sm">Close with a clear ask and compelling vision of what success looks like.</p>
                            </div>
                          </div>
                        </AccordionContent>
                      </AccordionItem>

                      <AccordionItem value="common-formats">
                        <AccordionTrigger className="text-left">
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4" />
                            Different Deck Formats
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="space-y-4 text-muted-foreground">
                          <div className="space-y-4">
                            <div className="p-4 rounded-2xl border">
                              <div className="font-medium text-foreground mb-2">Presentation Deck (10-15 slides)</div>
                              <p className="text-sm mb-2">
                                Designed to be presented in person or over video call. Visual, concise, meant to guide 
                                conversation.
                              </p>
                              <p className="text-sm">Best for: Initial meetings, pitch competitions</p>
                            </div>
                            <div className="p-4 rounded-2xl border">
                              <div className="font-medium text-foreground mb-2">Reading Deck (15-25 slides)</div>
                              <p className="text-sm mb-2">
                                More detailed, can stand alone. Includes more context and explanation for someone 
                                reading without you present.
                              </p>
                              <p className="text-sm">Best for: Cold outreach, email follow-ups</p>
                            </div>
                            <div className="p-4 rounded-2xl border">
                              <div className="font-medium text-foreground mb-2">One-Pager</div>
                              <p className="text-sm mb-2">
                                Ultra-condensed version on a single page. All key information at a glance.
                              </p>
                              <p className="text-sm">Best for: Quick overviews, leaving behind after meetings</p>
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
                  <Card className="border-0 shadow-lg rounded-3xl bg-white">
                    <CardHeader className="p-8">
                      <CardTitle className="flex items-center gap-3 text-2xl font-bold">
                        <Lightbulb className="w-6 h-6" />
                        Tips for Founders
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-8 pt-0">
                      <div className="space-y-6">
                        <div>
                          <div className="font-bold text-lg text-foreground">Lead with Traction</div>
                          <p className="text-base text-muted-foreground mt-1">Put your best metrics early on slide 2-3 if you have strong numbers.</p>
                        </div>
                        <div>
                          <div className="font-bold text-lg text-foreground">Use Customer Quotes</div>
                          <p className="text-base text-muted-foreground mt-1">Include real testimonials and use cases to validate your solution.</p>
                        </div>
                        <div>
                          <div className="font-bold text-lg text-foreground">Keep Design Clean</div>
                          <p className="text-base text-muted-foreground mt-1">One main point per slide with visuals over text.</p>
                        </div>
                        <div>
                          <div className="font-bold text-lg text-foreground">Show Unit Economics</div>
                          <p className="text-base text-muted-foreground mt-1">Include CAC, LTV, and payback period to prove business model understanding.</p>
                        </div>
                        <div>
                          <div className="font-bold text-lg text-foreground">Be Specific in The Ask</div>
                          <p className="text-base text-muted-foreground mt-1">"$2M to achieve $10M ARR in 18 months" beats "Raising Series A".</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Common Mistakes */}
                  <Card className="border-0 shadow-lg rounded-3xl bg-white">
                    <CardHeader className="p-8">
                      <CardTitle className="flex items-center gap-3 text-2xl font-bold">
                        <AlertCircle className="w-6 h-6" />
                        Common Mistakes to Avoid
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-8 pt-0">
                      <div className="space-y-6">
                        <div>
                          <div className="font-bold text-lg text-foreground">Too Much Text</div>
                          <p className="text-base text-muted-foreground mt-1">Dense slides lose attention—investors should be listening, not reading.</p>
                        </div>
                        <div>
                          <div className="font-bold text-lg text-foreground">Burying the Lead</div>
                          <p className="text-base text-muted-foreground mt-1">Put your strongest metrics and achievements early and prominently.</p>
                        </div>
                        <div>
                          <div className="font-bold text-lg text-foreground">Unrealistic Projections</div>
                          <p className="text-base text-muted-foreground mt-1">"Hockey stick" growth with no justification destroys credibility.</p>
                        </div>
                        <div>
                          <div className="font-bold text-lg text-foreground">Ignoring Competition</div>
                          <p className="text-base text-muted-foreground mt-1">"We have no competitors" is a red flag—show you understand the landscape.</p>
                        </div>
                        <div>
                          <div className="font-bold text-lg text-foreground">Vague Value Proposition</div>
                          <p className="text-base text-muted-foreground mt-1">Be specific about what you do and for whom, not just buzzwords.</p>
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
