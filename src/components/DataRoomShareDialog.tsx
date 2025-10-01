import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Copy, ExternalLink, Share2, Trash2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface Share {
  id: string;
  share_token: string;
  title: string;
  expires_at: string | null;
  view_count: number;
  created_at: string;
}

interface DataRoomShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const DataRoomShareDialog = ({ open, onOpenChange }: DataRoomShareDialogProps) => {
  const { toast } = useToast();
  const [shares, setShares] = useState<Share[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [title, setTitle] = useState('Investor Data Room');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (open) {
      loadShares();
    }
  }, [open]);

  const loadShares = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('data_room_shares')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setShares(data || []);
    } catch (error) {
      console.error('Error loading shares:', error);
      toast({
        title: 'Error',
        description: 'Failed to load share links',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const createShare = async () => {
    setIsCreating(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Generate token
      const { data: tokenData, error: tokenError } = await supabase
        .rpc('generate_share_token');

      if (tokenError) throw tokenError;

      // Create share
      const { error: insertError } = await supabase
        .from('data_room_shares')
        .insert({
          user_id: user.id,
          share_token: tokenData,
          title: title || 'Investor Data Room',
        });

      if (insertError) throw insertError;

      toast({
        title: 'Success',
        description: 'Share link created successfully',
      });

      setTitle('Investor Data Room');
      await loadShares();
    } catch (error) {
      console.error('Error creating share:', error);
      toast({
        title: 'Error',
        description: 'Failed to create share link',
        variant: 'destructive',
      });
    } finally {
      setIsCreating(false);
    }
  };

  const deleteShare = async (shareId: string) => {
    try {
      const { error } = await supabase
        .from('data_room_shares')
        .delete()
        .eq('id', shareId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Share link deleted',
      });

      await loadShares();
    } catch (error) {
      console.error('Error deleting share:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete share link',
        variant: 'destructive',
      });
    }
  };

  const copyToClipboard = (token: string) => {
    const url = `${window.location.origin}/investor/${token}`;
    navigator.clipboard.writeText(url);
    toast({
      title: 'Copied!',
      description: 'Share link copied to clipboard',
    });
  };

  const openInNewTab = (token: string) => {
    const url = `${window.location.origin}/investor/${token}`;
    window.open(url, '_blank');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            Share Data Room
          </DialogTitle>
          <DialogDescription>
            Create secure links to share your data room with investors
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Create New Share */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Share Link Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Investor Data Room, Series A Due Diligence"
              />
            </div>
            <Button onClick={createShare} disabled={isCreating} className="w-full">
              {isCreating ? 'Creating...' : 'Create New Share Link'}
            </Button>
          </div>

          {/* Existing Shares */}
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading shares...
            </div>
          ) : shares.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No share links yet. Create one to get started.
            </div>
          ) : (
            <div className="space-y-3">
              <h3 className="font-semibold text-sm">Active Share Links</h3>
              {shares.map((share) => {
                const url = `${window.location.origin}/investor/${share.share_token}`;
                return (
                  <Card key={share.id}>
                    <CardContent className="py-4">
                      <div className="space-y-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="font-medium">{share.title}</div>
                            <div className="text-xs text-muted-foreground mt-1">
                              Created {new Date(share.created_at).toLocaleDateString()} • 
                              {share.view_count} views
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteShare(share.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="flex items-center gap-2">
                          <Input
                            value={url}
                            readOnly
                            className="text-xs font-mono"
                          />
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => copyToClipboard(share.share_token)}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => openInNewTab(share.share_token)}
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
