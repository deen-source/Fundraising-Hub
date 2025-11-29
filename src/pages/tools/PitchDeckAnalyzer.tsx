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
  const [deckImages, setDeckImages] = useState<string[]>([]);
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
      const images: string[] = [];

      // Convert each page to image
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 2.0 }); // Higher scale for better quality

        // Create canvas
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        if (!context) throw new Error('Could not get canvas context');

        canvas.height = viewport.height;
        canvas.width = viewport.width;

        // Render PDF page to canvas
        await page.render({
          canvasContext: context,
          viewport: viewport
        }).promise;

        // Convert canvas to base64 PNG
        const imageData = canvas.toDataURL('image/png').split(',')[1]; // Remove data:image/png;base64, prefix
        images.push(imageData);
      }

      setDeckImages(images);
      toast.success(`Converted ${pdf.numPages} slides to images`);
    } catch (error) {
      console.error('PDF conversion error:', error);
      toast.error('Failed to convert PDF to images');
      setUploadedFile(null);
    } finally {
      setExtracting(false);
    }
  };

  const handleRemoveFile = () => {
    setUploadedFile(null);
    setDeckImages([]);
  };

  const handleAnalyse = async () => {
    if (!deckImages || deckImages.length === 0) {
      toast.error('Please upload a PDF pitch deck');
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
        body: { images: deckImages, stage },
      });

      if (error) throw error;

      setAnalysis(data.analysis);

      // Save to database
      const { error: saveError } = await supabase
        .from('term_sheet_analyses')
        .insert({
          user_id: user.id,
          term_sheet_text: `${uploadedFile?.name || 'Pitch Deck'} (${deckImages.length} slides)`, // Store filename and slide count
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
    // Can't reload images from past analysis, just show results
    setAnalysis(analysis.analysis_result);
    toast.success('Loaded past analysis');
  };


  // Helper function to determine score color - grayscale (darker = better)
  const getScoreColor = (score: number) => {
    if (score >= 8) return '#171717'; // Near-black for high scores
    if (score >= 6) return '#424242'; // Medium gray for medium scores
    return '#6b7280'; // Light gray for low scores
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'default'; // Neutral dark badge
      case 'high':
        return 'secondary'; // Neutral medium badge
      case 'medium':
        return 'outline'; // Neutral light badge
      default:
        return 'outline';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'default'; // Neutral dark badge
      case 'medium':
        return 'secondary'; // Neutral medium badge
      case 'low':
        return 'outline'; // Neutral light badge
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
              <h1 className="text-3xl md:text-4xl font-bold tracking-wide leading-tight">
                See your deck the way investors will, before they do.
              </h1>
            </div>

            {/* Upload Form */}
            <Card className="border-2 shadow-md rounded-3xl">
              <CardContent className="space-y-10 p-8">
                {/* Stage Selector */}
                <div className="space-y-4">
                  <h2 className="text-xl font-bold flex items-center gap-2">
                    <Target className="w-5 h-5" />
                    Select Your Fundraising Stage
                  </h2>
                  <Select value={stage} onValueChange={(value) => setStage(value as 'Pre-Seed' | 'Seed' | 'Series A')}>
                    <SelectTrigger className="w-full h-12 border-2 text-base font-medium">
                      <SelectValue placeholder="Select your fundraising stage" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Pre-Seed">Pre-Seed</SelectItem>
                      <SelectItem value="Seed">Seed</SelectItem>
                      <SelectItem value="Series A">Series A</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-muted-foreground">
                    Our AI will evaluate your deck based on stage-specific expectations
                  </p>
                </div>

                {/* File Upload Section */}
                <div className="space-y-4">
                  <h2 className="text-xl font-bold flex items-center gap-2">
                    <Upload className="w-5 h-5" />
                    Upload Your Deck
                  </h2>

                  {uploadedFile ? (
                    <div className="flex items-center justify-between p-4 rounded-lg border-2 bg-background">
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
                        className="cursor-pointer h-12 border-2"
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

                <Button
                  onClick={handleAnalyse}
                  disabled={loading || extracting || deckImages.length === 0}
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

            {/* Tabs Interface */}
            <Tabs defaultValue="analyzer" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-8 bg-muted p-1 h-auto border-2 rounded-2xl">
                <TabsTrigger value="analyzer" className="gap-2 border rounded-xl data-[state=active]:bg-background data-[state=active]:border-foreground data-[state=active]:shadow-sm">
                  <Sparkles className="w-4 h-4" />
                  Analyser
                </TabsTrigger>
                <TabsTrigger value="pre-deck-exercise" className="gap-2 border rounded-xl data-[state=active]:bg-background data-[state=active]:border-foreground data-[state=active]:shadow-sm">
                  <Target className="w-4 h-4" />
                  Pre-Deck Exercise
                </TabsTrigger>
              </TabsList>

              {/* Analyser Tab */}
              <TabsContent value="analyzer" className="space-y-12">
                {analysis && (
              <div className="space-y-8">
                {/* Dual Score Display - Deck & Startup */}
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Deck Score */}
                  <Card className="border shadow-sm">
                    <CardContent className="p-8">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Deck Score</span>
                          <span className="text-4xl font-bold text-[#171717]">
                            {analysis.deck_score_overall?.toFixed(1)}<span className="text-2xl text-muted-foreground">/10</span>
                          </span>
                        </div>
                        <div className="relative h-3 rounded-full overflow-hidden bg-gray-100">
                          <div
                            className="absolute inset-0 rounded-full transition-all duration-500"
                            style={{
                              width: `${(analysis.deck_score_overall / 10) * 100}%`,
                              background: 'linear-gradient(to right, #ff9a76, #ff6b9d)'
                            }}
                          />
                        </div>
                        <p className="text-xs text-muted-foreground">Presentation quality & communication</p>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Startup Score */}
                  <Card className="border shadow-sm">
                    <CardContent className="p-8">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Startup Score</span>
                          <span className="text-4xl font-bold text-[#171717]">
                            {analysis.startup_score_overall?.toFixed(1)}<span className="text-2xl text-muted-foreground">/10</span>
                          </span>
                        </div>
                        <div className="relative h-3 rounded-full overflow-hidden bg-gray-100">
                          <div
                            className="absolute inset-0 rounded-full transition-all duration-500"
                            style={{
                              width: `${(analysis.startup_score_overall / 10) * 100}%`,
                              background: 'linear-gradient(to right, #4ade80, #3b82f6)'
                            }}
                          />
                        </div>
                        <p className="text-xs text-muted-foreground">Business quality & investment readiness</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* First Impression Score */}
                {analysis.first_impression && (
                  <Card className="border">
                    <CardContent className="p-6">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">First Impression (Slides 1-3)</div>
                            <div className="text-xl font-semibold text-[#171717]">
                              {analysis.first_impression.verdict === 'CONTINUE' ? 'Continue Reading' : 'Likely Pass'}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-[#171717]">
                              {analysis.first_impression.score}{analysis.first_impression.score <= 10 ? '/10' : '/100'}
                            </div>
                            <div className="text-xs text-muted-foreground">Impact</div>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {analysis.first_impression.reasoning}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Deck Categories - Clean Table */}
                {analysis.deck_categories && (
                  <Card className="border">
                    <CardContent className="p-6">
                      <div className="space-y-4">
                        <div className="text-xs uppercase tracking-wider text-muted-foreground mb-4">Deck Breakdown</div>
                        <div className="space-y-3">
                          {Object.entries(analysis.deck_categories).map(([category, data]: [string, any]) => (
                            <div key={category} className="space-y-1">
                              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                                <span className="text-sm font-medium capitalize">
                                  {category.replace(/_/g, ' ')}
                                </span>
                                <span className="text-sm font-semibold text-[#171717]">
                                  {data.score?.toFixed(1)}/10
                                </span>
                              </div>
                              {data.reasoning && (
                                <p className="text-xs text-muted-foreground pl-2">{data.reasoning}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Startup Categories */}
                {analysis.startup_categories && (
                  <Card className="border">
                    <CardContent className="p-6">
                      <div className="space-y-4">
                        <div className="text-xs uppercase tracking-wider text-muted-foreground mb-4">Startup Breakdown</div>
                        <div className="space-y-3">
                          {Object.entries(analysis.startup_categories).map(([category, data]: [string, any]) => (
                            <div key={category} className="space-y-1">
                              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                                <span className="text-sm font-medium capitalize">
                                  {category.replace(/_/g, ' ')}
                                </span>
                                <span className="text-sm font-semibold text-[#171717]">
                                  {data.score?.toFixed(1)}/10
                                </span>
                              </div>
                              {data.reasoning && (
                                <p className="text-xs text-muted-foreground pl-2">{data.reasoning}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Deck Feedback */}
                {analysis.deck_feedback && (
                  <Card className="border">
                    <CardContent className="p-6">
                      <div className="space-y-6">
                        <div className="text-xs uppercase tracking-wider text-muted-foreground">Deck Evaluation</div>

                        {/* Executive Summary */}
                        {analysis.deck_feedback.executive_summary && (
                          <div className="space-y-2">
                            <div className="font-semibold text-sm text-[#171717]">Executive Summary</div>
                            <p className="text-sm text-muted-foreground leading-relaxed">
                              {analysis.deck_feedback.executive_summary}
                            </p>
                          </div>
                        )}

                        {/* Strengths */}
                        {analysis.deck_feedback.strengths && analysis.deck_feedback.strengths.length > 0 && (
                          <div className="space-y-3">
                            <div className="font-semibold text-sm text-[#171717]">Strengths</div>
                            <div className="space-y-2">
                              {analysis.deck_feedback.strengths.map((strength: any, idx: number) => (
                                <div key={idx} className="pb-2 border-b border-gray-100 last:border-0 last:pb-0">
                                  <div className="font-medium text-sm text-[#171717]">{strength.title}</div>
                                  <div className="text-sm text-muted-foreground">{strength.description}</div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Weaknesses */}
                        {analysis.deck_feedback.weaknesses && analysis.deck_feedback.weaknesses.length > 0 && (
                          <div className="space-y-3">
                            <div className="font-semibold text-sm text-[#171717]">Weaknesses</div>
                            <div className="space-y-2">
                              {analysis.deck_feedback.weaknesses.map((weakness: any, idx: number) => (
                                <div key={idx} className="pb-2 border-b border-gray-100 last:border-0 last:pb-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="font-medium text-sm text-[#171717]">{weakness.title}</span>
                                    <Badge variant={getSeverityColor(weakness.severity)} className="text-xs h-5">
                                      {weakness.severity}
                                    </Badge>
                                  </div>
                                  <div className="text-sm text-muted-foreground">{weakness.description}</div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Priority Actions */}
                        {analysis.deck_feedback.priority_actions && analysis.deck_feedback.priority_actions.length > 0 && (
                          <div className="space-y-3">
                            <div className="font-semibold text-sm text-[#171717]">Priority Actions</div>
                            <div className="space-y-2">
                              {analysis.deck_feedback.priority_actions.map((action: string, idx: number) => (
                                <div key={idx} className="text-sm text-muted-foreground py-1 border-b border-gray-100 last:border-0">
                                  {idx + 1}. {action}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Startup Feedback */}
                {analysis.startup_feedback && (
                  <Card className="border">
                    <CardContent className="p-6">
                      <div className="space-y-6">
                        <div className="text-xs uppercase tracking-wider text-muted-foreground">Startup Evaluation</div>

                        {/* Executive Summary */}
                        {analysis.startup_feedback.executive_summary && (
                          <div className="space-y-2">
                            <div className="font-semibold text-sm text-[#171717]">Executive Summary</div>
                            <p className="text-sm text-muted-foreground leading-relaxed">
                              {analysis.startup_feedback.executive_summary}
                            </p>
                          </div>
                        )}

                        {/* Strengths */}
                        {analysis.startup_feedback.strengths && analysis.startup_feedback.strengths.length > 0 && (
                          <div className="space-y-3">
                            <div className="font-semibold text-sm text-[#171717]">Strengths</div>
                            <div className="space-y-2">
                              {analysis.startup_feedback.strengths.map((strength: any, idx: number) => (
                                <div key={idx} className="pb-2 border-b border-gray-100 last:border-0 last:pb-0">
                                  <div className="font-medium text-sm text-[#171717]">{strength.title}</div>
                                  <div className="text-sm text-muted-foreground">{strength.description}</div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Concerns */}
                        {analysis.startup_feedback.concerns && analysis.startup_feedback.concerns.length > 0 && (
                          <div className="space-y-3">
                            <div className="font-semibold text-sm text-[#171717]">Concerns</div>
                            <div className="space-y-2">
                              {analysis.startup_feedback.concerns.map((concern: any, idx: number) => (
                                <div key={idx} className="pb-2 border-b border-gray-100 last:border-0 last:pb-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="font-medium text-sm text-[#171717]">{concern.title}</span>
                                    <Badge variant={getSeverityColor(concern.severity)} className="text-xs h-5">
                                      {concern.severity}
                                    </Badge>
                                  </div>
                                  <div className="text-sm text-muted-foreground">{concern.description}</div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Investor Questions */}
                {analysis.investor_questions && analysis.investor_questions.length > 0 && (
                  <Card className="border">
                    <CardContent className="p-6">
                      <div className="space-y-4">
                        <div className="text-xs uppercase tracking-wider text-muted-foreground">Questions Investors Will Ask</div>
                        <div className="space-y-2">
                          {analysis.investor_questions.map((question: string, idx: number) => (
                            <div key={idx} className="text-sm text-muted-foreground py-2 border-b border-gray-100 last:border-0">
                              {idx + 1}. {question}
                            </div>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Missing Slides */}
                {analysis.missing_slides && analysis.missing_slides.length > 0 && (
                  <Card className="border">
                    <CardContent className="p-6">
                      <div className="space-y-4">
                        <div className="text-xs uppercase tracking-wider text-muted-foreground">Missing Essential Slides</div>
                        <div className="space-y-2">
                          {analysis.missing_slides.map((slide: string, idx: number) => (
                            <div key={idx} className="text-sm font-medium text-[#171717] py-2 border-b border-gray-100 last:border-0">
                              • {slide}
                            </div>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
                  </div>
                )}

                {/* Recent Analyses */}
                {pastAnalyses.length > 0 && (
                  <Card className="border">
                    <CardContent className="p-6">
                      <div className="space-y-4">
                        <div className="text-xs uppercase tracking-wider text-muted-foreground">Recent Analyses</div>
                        <div className="space-y-2">
                          {pastAnalyses.map((item) => (
                            <div
                              key={item.id}
                              onClick={() => loadPastAnalysis(item)}
                              className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer group"
                            >
                              <div className="flex-1">
                                <div className="text-sm font-medium">
                                  {item.term_sheet_text.substring(0, 60)}...
                                </div>
                                <div className="text-xs text-muted-foreground mt-1">
                                  {new Date(item.created_at).toLocaleDateString()} at {new Date(item.created_at).toLocaleTimeString()}
                                </div>
                              </div>
                              <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                            </div>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
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
            </Tabs>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
};

export default PitchDeckAnalyser;
