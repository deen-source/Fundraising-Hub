import { useState, useEffect } from 'react';
import { AuthGuard } from '@/components/AuthGuard';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, FileText, Download, Copy, Check, HelpCircle, Sparkles, Settings } from 'lucide-react';
import { StartupProfileForm } from '@/components/StartupProfileForm';

interface Template {
  id: string;
  name: string;
  category: string;
  description: string | null;
  template_type: string;
  content: string | null;
  file_url: string | null;
}

const DocumentTemplates = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    loadTemplates();
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  const populateTemplate = (content: string): string => {
    if (!content || !profile) return content;

    const today = new Date().toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });

    const replacements: Record<string, string> = {
      '{{COMPANY_NAME}}': profile.company_name || '[Company Name]',
      '{{FOUNDER_NAME}}': profile.full_name || '[Founder Name]',
      '{{FOUNDER_EMAIL}}': profile.email || '[Email]',
      '{{COMPANY_INDUSTRY}}': profile.industry || '[Industry]',
      '{{COMPANY_WEBSITE}}': profile.website || '[Website]',
      '{{COMPANY_DESCRIPTION}}': profile.business_description || '[Business Description]',
      '{{COMPANY_ADDRESS}}': profile.address || '[Address]',
      '{{COMPANY_CITY}}': profile.city || '[City]',
      '{{COMPANY_STATE}}': profile.state || '[State]',
      '{{COMPANY_ZIP}}': profile.zip_code || '[ZIP Code]',
      '{{COMPANY_COUNTRY}}': profile.country || '[Country]',
      '{{COMPANY_PHONE}}': profile.phone || '[Phone]',
      '{{INCORPORATION_DATE}}': profile.incorporation_date ? new Date(profile.incorporation_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '[Incorporation Date]',
      '{{EIN}}': profile.ein || '[EIN]',
      '{{CURRENT_DATE}}': today,
      '{{CURRENT_YEAR}}': new Date().getFullYear().toString(),
    };

    let populatedContent = content;
    Object.entries(replacements).forEach(([placeholder, value]) => {
      populatedContent = populatedContent.replace(new RegExp(placeholder, 'g'), value);
    });

    return populatedContent;
  };

  const loadTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('document_templates')
        .select('*')
        .order('category', { ascending: true });

      if (error) throw error;
      setTemplates(data || []);
    } catch (error) {
      console.error('Error loading templates:', error);
      toast({
        title: 'Error',
        description: 'Failed to load templates',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewTemplate = (template: Template) => {
    const populatedTemplate = {
      ...template,
      content: template.content ? populateTemplate(template.content) : null
    };
    setSelectedTemplate(populatedTemplate);
    setViewDialogOpen(true);
    setCopied(false);
  };

  const handleCopyTemplate = async () => {
    if (selectedTemplate?.content) {
      navigator.clipboard.writeText(selectedTemplate.content);
      setCopied(true);
      toast({
        title: 'Copied',
        description: 'Template copied to clipboard',
      });
      setTimeout(() => setCopied(false), 2000);

      // Track template usage
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase.from('saved_calculations').insert({
            user_id: user.id,
            tool_type: 'document_templates',
            title: `Copied: ${selectedTemplate.name}`,
            calculation_data: {
              template_id: selectedTemplate.id,
              template_name: selectedTemplate.name,
              action: 'copy',
            },
          });
        }
      } catch (error) {
        console.error('Error tracking template usage:', error);
      }
    }
  };

  const handleDownloadTemplate = async () => {
    if (selectedTemplate?.content) {
      const blob = new Blob([selectedTemplate.content], { type: 'text/plain' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${selectedTemplate.name.toLowerCase().replace(/\s+/g, '_')}.txt`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: 'Downloaded',
        description: 'Template downloaded successfully',
      });

      // Track template usage
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase.from('saved_calculations').insert({
            user_id: user.id,
            tool_type: 'document_templates',
            title: `Downloaded: ${selectedTemplate.name}`,
            calculation_data: {
              template_id: selectedTemplate.id,
              template_name: selectedTemplate.name,
              action: 'download',
            },
          });
        }
      } catch (error) {
        console.error('Error tracking template usage:', error);
      }
    }
  };

  const categories = ['all', ...Array.from(new Set(templates.map(t => t.category)))];
  
  const filteredTemplates = selectedCategory === 'all' 
    ? templates 
    : templates.filter(t => t.category === selectedCategory);

  const getTemplateIcon = (type: string) => {
    return <FileText className="h-5 w-5" />;
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Legal': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'Fundraising': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'Communication': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'Due Diligence': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Legal': return '⚖️';
      case 'Fundraising': return '💰';
      case 'Communication': return '📧';
      case 'Due Diligence': return '🔍';
      default: return '📄';
    }
  };

  const getCategoryDescription = (category: string) => {
    switch (category) {
      case 'Legal': return 'Legally binding documents for investor protection';
      case 'Fundraising': return 'Essential templates for raising capital';
      case 'Communication': return 'Keep investors informed and engaged';
      case 'Due Diligence': return 'Organize information for investor review';
      default: return 'Professional document templates';
    }
  };

  // Empty state
  if (!isLoading && templates.length === 0) {
    return (
      <AuthGuard>
        <div className="min-h-screen bg-background">
          <div className="container mx-auto py-8 px-4">
            <div className="flex items-center gap-4 mb-6">
              <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="flex-1">
                <h1 className="text-3xl font-bold">Document Templates</h1>
                <p className="text-muted-foreground">Pre-built templates for fundraising and legal documents</p>
              </div>
            </div>

            <div className="max-w-2xl mx-auto text-center py-12">
              <FileText className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <p className="text-muted-foreground">No templates available</p>
            </div>
          </div>
        </div>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-background">
        <div className="container mx-auto py-8 px-4">
          {/* Header */}
          <div className="flex items-center gap-4 mb-6">
            <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h1 className="text-3xl font-bold">Document Templates</h1>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <HelpCircle className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p className="text-sm">
                        Ready-to-use templates for common fundraising documents. 
                        Copy and customize them for your specific needs or download for offline editing.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <p className="text-muted-foreground">Pre-built templates for fundraising and legal documents</p>
            </div>
            <Button onClick={() => setProfileDialogOpen(true)} variant="outline">
              <Settings className="h-4 w-4 mr-2" />
              Startup Profile
            </Button>
          </div>

          {/* Info Banner */}
          <Card className="mb-6 bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
            <CardContent className="py-4">
              <div className="flex items-start gap-3">
                <Sparkles className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold mb-1">Templates Auto-Populate with Your Information</p>
                  <p className="text-sm text-muted-foreground">
                    Fill out your startup profile to automatically populate templates with your company information.
                    Click "Startup Profile" above to add your details, then templates will be ready to use.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Category Tabs */}
          <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="mb-6">
            <TabsList className="w-full justify-start overflow-x-auto flex-wrap h-auto">
              {categories.map(category => {
                const count = category === 'all' ? templates.length : templates.filter(t => t.category === category).length;
                return (
                  <TooltipProvider key={category}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <TabsTrigger value={category} className="flex items-center gap-2">
                          {category !== 'all' && <span>{getCategoryIcon(category)}</span>}
                          {category === 'all' ? 'All Templates' : category}
                          <Badge variant="secondary" className="ml-1">{count}</Badge>
                        </TabsTrigger>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-sm">
                          {category === 'all' ? 'View all available templates' : getCategoryDescription(category)}
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                );
              })}
            </TabsList>
          </Tabs>

          {/* Current Category Description */}
          {selectedCategory !== 'all' && (
            <Card className="mb-6 bg-muted/50">
              <CardContent className="py-3">
                <p className="text-sm text-muted-foreground">
                  <strong>{selectedCategory}:</strong> {getCategoryDescription(selectedCategory)}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Templates Grid */}
          {isLoading ? (
            <div className="text-center py-12">Loading templates...</div>
          ) : filteredTemplates.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <p className="text-muted-foreground">No templates in this category</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTemplates.map(template => (
                <Card
                  key={template.id}
                  className="cursor-pointer hover:shadow-lg transition-all hover:-translate-y-1"
                  onClick={() => handleViewTemplate(template)}
                >
                  <CardHeader>
                    <div className="flex items-start gap-3">
                      <div className="text-3xl">
                        {getCategoryIcon(template.category)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-lg mb-2 line-clamp-2">{template.name}</CardTitle>
                        <Badge variant="outline" className={getCategoryColor(template.category)}>
                          {template.category}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="line-clamp-3 mb-4">
                      {template.description}
                    </CardDescription>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="flex-1"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewTemplate(template);
                        }}
                      >
                        <FileText className="h-3 w-3 mr-2" />
                        View Template
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* View Template Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span>{getCategoryIcon(selectedTemplate?.category || '')}</span>
                <span>{selectedTemplate?.name}</span>
              </div>
              <div className="flex gap-2">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleCopyTemplate}
                        disabled={!selectedTemplate?.content}
                      >
                        {copied ? (
                          <>
                            <Check className="h-4 w-4 mr-2" />
                            Copied
                          </>
                        ) : (
                          <>
                            <Copy className="h-4 w-4 mr-2" />
                            Copy
                          </>
                        )}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Copy template to clipboard</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleDownloadTemplate}
                        disabled={!selectedTemplate?.content}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Download as text file</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </DialogTitle>
            <DialogDescription>
              {selectedTemplate?.description}
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-[500px] w-full rounded-md border p-4">
            <pre className="text-sm whitespace-pre-wrap font-mono">
              {selectedTemplate?.content}
            </pre>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Startup Profile Dialog */}
      <Dialog open={profileDialogOpen} onOpenChange={setProfileDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Startup Profile Settings</DialogTitle>
            <DialogDescription>
              Update your startup information to auto-populate document templates
            </DialogDescription>
          </DialogHeader>
          <StartupProfileForm />
        </DialogContent>
      </Dialog>
    </AuthGuard>
  );
};

export default DocumentTemplates;
