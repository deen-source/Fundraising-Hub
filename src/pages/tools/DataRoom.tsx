import { useState, useEffect } from 'react';
import { AuthGuard } from '@/components/AuthGuard';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Upload, FileText, Download, Trash2, FolderOpen, Eye, Clock, Share2, File, Image as ImageIcon, HelpCircle, FolderLock } from 'lucide-react';

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
  last_viewed_at: string | null;
}

const FOLDERS = [
  { 
    value: 'all', 
    label: 'All Documents', 
    icon: FolderOpen,
    description: 'View all uploaded documents'
  },
  { 
    value: 'Corporate Documents', 
    label: 'Corporate Documents', 
    icon: FileText,
    description: 'Articles of incorporation, bylaws, cap table, board minutes'
  },
  { 
    value: 'Financial Documents', 
    label: 'Financial Documents', 
    icon: FileText,
    description: 'Financial statements, revenue metrics, projections, budgets'
  },
  { 
    value: 'Legal Documents', 
    label: 'Legal Documents', 
    icon: File,
    description: 'Contracts, agreements, legal opinions, compliance docs'
  },
  { 
    value: 'Intellectual Property', 
    label: 'Intellectual Property', 
    icon: FileText,
    description: 'Patents, trademarks, copyright registrations, licenses'
  },
  { 
    value: 'Product & Technology', 
    label: 'Product & Technology', 
    icon: FileText,
    description: 'Product specs, tech stack, architecture, roadmap'
  },
  { 
    value: 'Customer & Market', 
    label: 'Customer & Market', 
    icon: FileText,
    description: 'Customer contracts, market research, competitive analysis'
  },
  { 
    value: 'Team', 
    label: 'Team', 
    icon: FileText,
    description: 'Employee contracts, org chart, team bios, compensation'
  },
];

const DataRoom = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState<string>('all');
  const [uploading, setUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Upload form state
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadDescription, setUploadDescription] = useState('');
  const [uploadFolderSelection, setUploadFolderSelection] = useState('Corporate Documents');

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    try {
      const { data, error } = await supabase
        .from('data_room_documents')
        .select('*')
        .order('uploaded_at', { ascending: false });

      if (error) throw error;
      setDocuments(data || []);
    } catch (error) {
      console.error('Error loading documents:', error);
      toast({
        title: 'Error',
        description: 'Failed to load documents',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.includes('image')) return <ImageIcon className="h-5 w-5 text-blue-500" />;
    if (fileType.includes('pdf')) return <FileText className="h-5 w-5 text-red-500" />;
    if (fileType.includes('spreadsheet') || fileType.includes('excel')) return <FileText className="h-5 w-5 text-green-500" />;
    return <File className="h-5 w-5 text-gray-500" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const filteredDocuments = documents.filter(doc => {
    const matchesFolder = selectedFolder === 'all' || doc.folder === selectedFolder;
    const matchesSearch = searchQuery === '' || 
      doc.file_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.description?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFolder && matchesSearch;
  });

  const handleFileUpload = async () => {
    if (!uploadFile) {
      toast({
        title: 'Error',
        description: 'Please select a file',
        variant: 'destructive',
      });
      return;
    }

    setUploading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Upload file to storage
      const filePath = `${user.id}/${Date.now()}_${uploadFile.name}`;
      const { error: uploadError } = await supabase.storage
        .from('data-room')
        .upload(filePath, uploadFile);

      if (uploadError) throw uploadError;

      // Save metadata to database
      const { error: dbError } = await supabase
        .from('data_room_documents')
        .insert({
          user_id: user.id,
          file_name: uploadFile.name,
          file_path: filePath,
          file_size: uploadFile.size,
          file_type: uploadFile.type,
          folder: uploadFolderSelection,
          description: uploadDescription || null,
        });

      if (dbError) throw dbError;

      toast({
        title: 'Success',
        description: 'Document uploaded successfully',
      });

      setUploadDialogOpen(false);
      setUploadFile(null);
      setUploadDescription('');
      loadDocuments();
    } catch (error) {
      console.error('Error uploading file:', error);
      toast({
        title: 'Error',
        description: 'Failed to upload document',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (doc: Document) => {
    try {
      const { data, error } = await supabase.storage
        .from('data-room')
        .download(doc.file_path);

      if (error) throw error;

      // Create download link
      const url = window.URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = doc.file_name;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      // Increment view count
      await supabase
        .from('data_room_documents')
        .update({ view_count: doc.view_count + 1, last_viewed_at: new Date().toISOString() })
        .eq('id', doc.id);

      loadDocuments();
    } catch (error) {
      console.error('Error downloading file:', error);
      toast({
        title: 'Error',
        description: 'Failed to download document',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (doc: Document) => {
    if (!confirm(`Are you sure you want to delete ${doc.file_name}?`)) return;

    try {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('data-room')
        .remove([doc.file_path]);

      if (storageError) throw storageError;

      // Delete from database
      const { error: dbError } = await supabase
        .from('data_room_documents')
        .delete()
        .eq('id', doc.id);

      if (dbError) throw dbError;

      toast({
        title: 'Success',
        description: 'Document deleted successfully',
      });

      loadDocuments();
    } catch (error) {
      console.error('Error deleting file:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete document',
        variant: 'destructive',
      });
    }
  };

  const totalSize = documents.reduce((acc, doc) => acc + doc.file_size, 0);
  const totalViews = documents.reduce((acc, doc) => acc + doc.view_count, 0);
  const currentFolderInfo = FOLDERS.find(f => f.value === selectedFolder);

  // Empty state
  if (!isLoading && documents.length === 0) {
    return (
      <AuthGuard>
        <div className="min-h-screen bg-background">
          <div className="container mx-auto py-8 px-4">
            <div className="flex items-center gap-4 mb-6">
              <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="flex-1">
                <h1 className="text-3xl font-bold">Data Room</h1>
                <p className="text-muted-foreground">Organize and share due diligence documents</p>
              </div>
            </div>

            <div className="max-w-3xl mx-auto">
              <Card className="border-dashed">
                <CardHeader className="text-center pb-4">
                  <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                    <FolderLock className="h-8 w-8 text-primary" />
                  </div>
                  <CardTitle className="text-2xl">Build Your Due Diligence Data Room</CardTitle>
                  <CardDescription className="text-base mt-2">
                    Organize critical documents investors need to review before making investment decisions
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="bg-muted/50 rounded-lg p-4">
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Organize documents by category:
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-muted-foreground">
                      <div>• Corporate Documents</div>
                      <div>• Financial Documents</div>
                      <div>• Legal Documents</div>
                      <div>• Intellectual Property</div>
                      <div>• Product & Technology</div>
                      <div>• Customer & Market</div>
                      <div>• Team</div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center flex-shrink-0">
                        <span className="text-blue-600 dark:text-blue-300 font-semibold text-sm">1</span>
                      </div>
                      <div>
                        <h3 className="font-semibold mb-1">Upload Your Documents</h3>
                        <p className="text-sm text-muted-foreground">
                          Upload files to organized folders. Add descriptions to help investors understand each document.
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center flex-shrink-0">
                        <span className="text-purple-600 dark:text-purple-300 font-semibold text-sm">2</span>
                      </div>
                      <div>
                        <h3 className="font-semibold mb-1">Track Access & Views</h3>
                        <p className="text-sm text-muted-foreground">
                          Monitor which documents investors are viewing and when they accessed them.
                        </p>
                      </div>
                    </div>
                  </div>

                  <Button 
                    className="w-full" 
                    size="lg"
                    onClick={() => setUploadDialogOpen(true)}
                  >
                    <Upload className="h-5 w-5 mr-2" />
                    Upload Your First Document
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Upload Dialog */}
        <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Upload Document</DialogTitle>
              <DialogDescription>
                Add a document to your data room
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="file">File</Label>
                <Input
                  id="file"
                  type="file"
                  onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                  className="cursor-pointer"
                />
              </div>
              <div>
                <Label htmlFor="folder">
                  Folder
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="h-3 w-3 inline ml-1" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p className="text-sm">Choose the appropriate category for your document to keep your data room organized</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </Label>
                <Select value={uploadFolderSelection} onValueChange={setUploadFolderSelection}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FOLDERS.filter(f => f.value !== 'all').map(folder => (
                      <SelectItem key={folder.value} value={folder.value}>
                        {folder.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {uploadFolderSelection && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {FOLDERS.find(f => f.value === uploadFolderSelection)?.description}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  placeholder="Add context about this document for investors..."
                  value={uploadDescription}
                  onChange={(e) => setUploadDescription(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setUploadDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleFileUpload} disabled={uploading || !uploadFile}>
                {uploading ? 'Uploading...' : 'Upload'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-background">
        <div className="container mx-auto py-8 px-4">
          {/* Header */}
          <div className="flex flex-col gap-4 mb-6">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h1 className="text-3xl font-bold">Data Room</h1>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <HelpCircle className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p className="text-sm">
                          Your data room is a secure space for organizing documents investors need during due diligence. 
                          Keep files organized by category and track who views what.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <p className="text-muted-foreground">Organize and share due diligence documents</p>
              </div>
              <Button onClick={() => setUploadDialogOpen(true)}>
                <Upload className="h-4 w-4 mr-2" />
                Upload Document
              </Button>
            </div>

            {/* Search */}
            <Input
              placeholder="Search documents by name or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-md"
            />
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
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
                  Total Size
                </CardDescription>
                <CardTitle className="text-3xl">{formatFileSize(totalSize)}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardDescription className="flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  Total Views
                </CardDescription>
                <CardTitle className="text-3xl">{totalViews}</CardTitle>
              </CardHeader>
            </Card>
          </div>

          {/* Info about current folder */}
          {currentFolderInfo && currentFolderInfo.value !== 'all' && (
            <Card className="mb-4 bg-muted/50">
              <CardContent className="py-3">
                <p className="text-sm text-muted-foreground">
                  <strong>{currentFolderInfo.label}:</strong> {currentFolderInfo.description}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Folders and Documents */}
          <Tabs value={selectedFolder} onValueChange={setSelectedFolder} className="w-full">
            <TabsList className="w-full justify-start overflow-x-auto flex-wrap h-auto">
              {FOLDERS.map((folder) => {
                const Icon = folder.icon;
                const count = documents.filter(d => folder.value === 'all' || d.folder === folder.value).length;
                return (
                  <TooltipProvider key={folder.value}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <TabsTrigger value={folder.value} className="flex items-center gap-2">
                          <Icon className="h-4 w-4" />
                          {folder.label}
                          <Badge variant="secondary" className="ml-1">{count}</Badge>
                        </TabsTrigger>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-sm max-w-xs">{folder.description}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                );
              })}
            </TabsList>

            <TabsContent value={selectedFolder} className="mt-6">
              {isLoading ? (
                <div className="text-center py-12">Loading documents...</div>
              ) : filteredDocuments.length === 0 ? (
                <div className="text-center py-12">
                  <FolderOpen className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <p className="text-muted-foreground mb-4">
                    {searchQuery ? 'No documents match your search' : 'No documents in this folder yet'}
                  </p>
                  {!searchQuery && (
                    <Button onClick={() => setUploadDialogOpen(true)}>
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Document
                    </Button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredDocuments.map((doc) => (
                    <Card key={doc.id} className="hover:shadow-lg transition-shadow">
                      <CardHeader className="pb-3">
                        <div className="flex items-start gap-3">
                          {getFileIcon(doc.file_type)}
                          <div className="flex-1 min-w-0">
                            <CardTitle className="text-sm truncate" title={doc.file_name}>{doc.file_name}</CardTitle>
                            <CardDescription className="text-xs mt-1">
                              {doc.folder}
                            </CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>{formatFileSize(doc.file_size)}</span>
                          <span>{new Date(doc.uploaded_at).toLocaleDateString()}</span>
                        </div>

                        {doc.description && (
                          <p className="text-xs text-muted-foreground line-clamp-2" title={doc.description}>
                            {doc.description}
                          </p>
                        )}

                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Eye className="h-3 w-3" />
                          <span>{doc.view_count || 0} views</span>
                          {doc.last_viewed_at && (
                            <>
                              <Clock className="h-3 w-3 ml-2" />
                              <span>Last: {new Date(doc.last_viewed_at).toLocaleDateString()}</span>
                            </>
                          )}
                        </div>

                        <div className="flex gap-2 pt-2 border-t">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            onClick={() => handleDownload(doc)}
                          >
                            <Download className="h-4 w-4 mr-2" />
                            Download
                          </Button>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    toast({
                                      title: 'Coming Soon',
                                      description: 'Sharing functionality will be available soon',
                                    });
                                  }}
                                >
                                  <Share2 className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Share with investors</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDelete(doc)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Delete document</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Upload Dialog */}
      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload Document</DialogTitle>
            <DialogDescription>
              Add a document to your data room
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="file">File</Label>
              <Input
                id="file"
                type="file"
                onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                className="cursor-pointer"
              />
            </div>
            <div>
              <Label htmlFor="folder">
                Folder
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-3 w-3 inline ml-1" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p className="text-sm">Choose the appropriate category for your document to keep your data room organized</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </Label>
              <Select value={uploadFolderSelection} onValueChange={setUploadFolderSelection}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FOLDERS.filter(f => f.value !== 'all').map(folder => (
                    <SelectItem key={folder.value} value={folder.value}>
                      {folder.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {uploadFolderSelection && (
                <p className="text-xs text-muted-foreground mt-1">
                  {FOLDERS.find(f => f.value === uploadFolderSelection)?.description}
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                placeholder="Add context about this document for investors..."
                value={uploadDescription}
                onChange={(e) => setUploadDescription(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUploadDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleFileUpload} disabled={uploading || !uploadFile}>
              {uploading ? 'Uploading...' : 'Upload'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AuthGuard>
  );
};

export default DataRoom;
