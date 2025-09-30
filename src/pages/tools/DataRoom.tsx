import { useState, useEffect } from 'react';
import { AuthGuard } from '@/components/AuthGuard';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Upload, FileText, Download, Trash2, FolderOpen, Eye } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

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
}

const FOLDERS = [
  'Corporate Documents',
  'Financial Documents',
  'Legal Documents',
  'Intellectual Property',
  'Product & Technology',
  'Customer & Market',
  'Team',
];

const DataRoom = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState<string>('Corporate Documents');
  const [filterFolder, setFilterFolder] = useState<string>('all');
  const [uploading, setUploading] = useState(false);

  // Upload form state
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadDescription, setUploadDescription] = useState('');

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
          folder: selectedFolder,
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

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const filteredDocuments = filterFolder === 'all' 
    ? documents 
    : documents.filter(doc => doc.folder === filterFolder);

  const totalSize = documents.reduce((acc, doc) => acc + doc.file_size, 0);
  const totalViews = documents.reduce((acc, doc) => acc + doc.view_count, 0);

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
              <h1 className="text-3xl font-bold">Data Room Manager</h1>
              <p className="text-muted-foreground">Organize and share due diligence documents</p>
            </div>
            <Button onClick={() => setUploadDialogOpen(true)}>
              <Upload className="h-4 w-4 mr-2" />
              Upload Document
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Total Documents</CardDescription>
                <CardTitle className="text-3xl">{documents.length}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Total Size</CardDescription>
                <CardTitle className="text-3xl">{formatFileSize(totalSize)}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Total Views</CardDescription>
                <CardTitle className="text-3xl">{totalViews}</CardTitle>
              </CardHeader>
            </Card>
          </div>

          {/* Filter */}
          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Documents</CardTitle>
                  <CardDescription>Filter by folder to organize your data room</CardDescription>
                </div>
                <Select value={filterFolder} onValueChange={setFilterFolder}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="All Folders" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Folders</SelectItem>
                    {FOLDERS.map(folder => (
                      <SelectItem key={folder} value={folder}>{folder}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">Loading documents...</div>
              ) : filteredDocuments.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No documents yet. Upload your first document to get started.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Folder</TableHead>
                      <TableHead>Size</TableHead>
                      <TableHead>Views</TableHead>
                      <TableHead>Uploaded</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredDocuments.map(doc => (
                      <TableRow key={doc.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            {doc.file_name}
                          </div>
                          {doc.description && (
                            <p className="text-xs text-muted-foreground mt-1">{doc.description}</p>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            <FolderOpen className="h-3 w-3 mr-1" />
                            {doc.folder}
                          </Badge>
                        </TableCell>
                        <TableCell>{formatFileSize(doc.file_size)}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">
                            <Eye className="h-3 w-3 mr-1" />
                            {doc.view_count}
                          </Badge>
                        </TableCell>
                        <TableCell>{new Date(doc.uploaded_at).toLocaleDateString()}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDownload(doc)}
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(doc)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
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
              />
            </div>
            <div>
              <Label htmlFor="folder">Folder</Label>
              <Select value={selectedFolder} onValueChange={setSelectedFolder}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FOLDERS.map(folder => (
                    <SelectItem key={folder} value={folder}>{folder}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                placeholder="Add a description for this document..."
                value={uploadDescription}
                onChange={(e) => setUploadDescription(e.target.value)}
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
