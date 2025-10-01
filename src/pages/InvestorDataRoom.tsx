import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { FileText, Download, FolderOpen, Eye, ArrowLeft, File, Image as ImageIcon, Lock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Document {
  id: string;
  file_name: string;
  file_path: string;
  file_size: number;
  file_type: string;
  folder: string;
  description: string | null;
  uploaded_at: string;
  view_count: number;
  user_id: string;
}

interface Share {
  id: string;
  share_token: string;
  title: string;
  expires_at: string | null;
  user_id: string;
}

const FOLDERS = [
  { 
    value: 'Corporate & Organizational', 
    label: 'Corporate & Organizational',
    description: 'Certificate of incorporation, bylaws, amendments, Cap Table (fully diluted), shareholder agreements, board & shareholder meeting minutes, organizational chart'
  },
  { 
    value: 'Securities & Financing', 
    label: 'Securities & Financing',
    description: 'Stock purchase agreements, SAFEs, convertible notes, equity incentive plans, option pool documents, vesting schedules, warrants, side letters, debt agreements'
  },
  { 
    value: 'Material Contracts', 
    label: 'Material Contracts',
    description: 'Top customer and vendor agreements, key partnerships, distribution/reseller/licensing deals, loan agreements, credit facilities, NDAs, non-competes'
  },
  { 
    value: 'Employment & HR', 
    label: 'Employment & HR',
    description: 'Executive employment agreements, offer letters, independent contractor agreements, equity grant agreements, benefits and compensation policies, immigration/work visa documentation'
  },
  { 
    value: 'Intellectual Property', 
    label: 'Intellectual Property',
    description: 'IP assignments from founders/employees/contractors, patents, trademarks, copyrights, key licenses (inbound/outbound), open-source software policy & compliance'
  },
  { 
    value: 'Litigation & Legal Compliance', 
    label: 'Litigation & Legal Compliance',
    description: 'Summary of pending/threatened litigation, regulatory approvals or licenses, settlement agreements, disputes with employees/customers'
  },
  { 
    value: 'Financial & Tax', 
    label: 'Financial & Tax',
    description: 'Historical financial statements, latest management accounts, KPIs and forecasts, tax filings, outstanding tax liabilities'
  },
  { 
    value: 'Insurance', 
    label: 'Insurance',
    description: 'D&O, E&O, general liability, cyber coverage, claims history'
  },
];

const InvestorDataRoom = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [share, setShare] = useState<Share | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (token) {
      loadDataRoom();
    }
  }, [token]);

  const loadDataRoom = async () => {
    try {
      // Verify share token
      const { data: shareData, error: shareError } = await supabase
        .from('data_room_shares')
        .select('*')
        .eq('share_token', token)
        .single();

      if (shareError || !shareData) {
        setError('Invalid or expired share link');
        setIsLoading(false);
        return;
      }

      // Check expiration
      if (shareData.expires_at && new Date(shareData.expires_at) < new Date()) {
        setError('This share link has expired');
        setIsLoading(false);
        return;
      }

      setShare(shareData);

      // Load documents for this user
      const { data: docsData, error: docsError } = await supabase
        .from('data_room_documents')
        .select('*')
        .eq('user_id', shareData.user_id)
        .order('uploaded_at', { ascending: false });

      if (docsError) throw docsError;
      setDocuments(docsData || []);

      // Update view count
      await supabase
        .from('data_room_shares')
        .update({ 
          view_count: shareData.view_count + 1,
          last_accessed_at: new Date().toISOString()
        })
        .eq('id', shareData.id);

    } catch (error) {
      console.error('Error loading data room:', error);
      setError('Failed to load data room');
    } finally {
      setIsLoading(false);
    }
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.includes('image')) return <ImageIcon className="h-4 w-4 text-blue-500" />;
    if (fileType.includes('pdf')) return <FileText className="h-4 w-4 text-red-500" />;
    if (fileType.includes('spreadsheet') || fileType.includes('excel')) return <FileText className="h-4 w-4 text-green-500" />;
    return <File className="h-4 w-4 text-muted-foreground" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const handleDownload = async (doc: Document) => {
    try {
      const { data, error } = await supabase.storage
        .from('data-room')
        .download(doc.file_path);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = doc.file_name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      // Update view count for document
      await supabase
        .from('data_room_documents')
        .update({ 
          view_count: doc.view_count + 1,
          last_viewed_at: new Date().toISOString()
        })
        .eq('id', doc.id);

      toast({
        title: 'Success',
        description: 'Document downloaded successfully',
      });
    } catch (error) {
      console.error('Error downloading file:', error);
      toast({
        title: 'Error',
        description: 'Failed to download document',
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Lock className="h-16 w-16 mx-auto mb-4 opacity-50" />
          <p className="text-muted-foreground">Loading data room...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Access Denied
            </CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate('/')} className="w-full">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const groupedDocuments = FOLDERS.reduce((acc, folder) => {
    acc[folder.value] = documents.filter(doc => doc.folder === folder.value);
    return acc;
  }, {} as Record<string, Document[]>);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <FolderOpen className="h-8 w-8" />
            <h1 className="text-3xl font-bold">{share?.title || 'Investor Data Room'}</h1>
          </div>
          <p className="text-muted-foreground">Secure access to due diligence documents</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardDescription className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Total Documents
              </CardDescription>
              <CardTitle className="text-3xl">{documents.length}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription className="flex items-center gap-2">
                <FolderOpen className="h-4 w-4" />
                Categories
              </CardDescription>
              <CardTitle className="text-3xl">{FOLDERS.length}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription className="flex items-center gap-2">
                <Eye className="h-4 w-4" />
                Your Access
              </CardDescription>
              <CardTitle className="text-sm">
                {share?.expires_at ? `Expires ${new Date(share.expires_at).toLocaleDateString()}` : 'No expiration'}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* Document Categories */}
        <Card>
          <CardHeader>
            <CardTitle>Document Categories</CardTitle>
            <CardDescription>Browse documents organized by category</CardDescription>
          </CardHeader>
          <CardContent>
            <Accordion type="multiple" className="w-full">
              {FOLDERS.map((folder) => {
                const folderDocs = groupedDocuments[folder.value] || [];
                return (
                  <AccordionItem key={folder.value} value={folder.value}>
                    <AccordionTrigger className="hover:no-underline">
                      <div className="flex items-center justify-between w-full pr-4">
                        <div className="flex items-center gap-3">
                          <FolderOpen className="h-5 w-5" />
                          <div className="text-left">
                            <div className="font-semibold">{folder.label}</div>
                            <div className="text-xs text-muted-foreground font-normal">
                              {folder.description}
                            </div>
                          </div>
                        </div>
                        <Badge variant={folderDocs.length > 0 ? "default" : "secondary"}>
                          {folderDocs.length}
                        </Badge>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      {folderDocs.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          No documents in this category yet
                        </div>
                      ) : (
                        <div className="space-y-2 pt-2">
                          {folderDocs.map((doc) => (
                            <Card key={doc.id} className="hover:shadow-md transition-shadow">
                              <CardContent className="py-4">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-3 flex-1 min-w-0">
                                    {getFileIcon(doc.file_type)}
                                    <div className="flex-1 min-w-0">
                                      <div className="font-medium truncate" title={doc.file_name}>
                                        {doc.file_name}
                                      </div>
                                      {doc.description && (
                                        <div className="text-xs text-muted-foreground line-clamp-1">
                                          {doc.description}
                                        </div>
                                      )}
                                      <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                                        <span>{formatFileSize(doc.file_size)}</span>
                                        <span>{new Date(doc.uploaded_at).toLocaleDateString()}</span>
                                      </div>
                                    </div>
                                  </div>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleDownload(doc)}
                                  >
                                    <Download className="h-4 w-4 mr-2" />
                                    Download
                                  </Button>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      )}
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default InvestorDataRoom;
