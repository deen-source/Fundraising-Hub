import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Save, FolderOpen, Trash2 } from 'lucide-react';

interface SaveLoadButtonsProps {
  saveDialogOpen: boolean;
  setSaveDialogOpen: (open: boolean) => void;
  loadDialogOpen: boolean;
  setLoadDialogOpen: (open: boolean) => void;
  saveTitle: string;
  setSaveTitle: (title: string) => void;
  onSave: () => void;
  onLoad: (calc: any) => void;
  onDelete: (id: string) => void;
  savedCalculations: any[];
  disabled?: boolean;
}

export const SaveLoadButtons = ({
  saveDialogOpen,
  setSaveDialogOpen,
  loadDialogOpen,
  setLoadDialogOpen,
  saveTitle,
  setSaveTitle,
  onSave,
  onLoad,
  onDelete,
  savedCalculations,
  disabled = false
}: SaveLoadButtonsProps) => {
  return (
    <div className="flex gap-2">
      <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" disabled={disabled} className="gap-2">
            <Save className="w-4 h-4" />
            Save
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Calculation</DialogTitle>
            <DialogDescription>
              Give your calculation a name to save it for later
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Title</Label>
              <Input
                value={saveTitle}
                onChange={(e) => setSaveTitle(e.target.value)}
                placeholder="e.g., Q4 2024 Valuation"
                className="mt-2"
              />
            </div>
            <Button onClick={onSave} className="w-full">
              Save Calculation
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={loadDialogOpen} onOpenChange={setLoadDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <FolderOpen className="w-4 h-4" />
            Load
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Load Saved Calculation</DialogTitle>
            <DialogDescription>
              Select a previously saved calculation to load
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            {savedCalculations.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No saved calculations yet
              </p>
            ) : (
              savedCalculations.map((calc) => (
                <div
                  key={calc.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent"
                >
                  <div className="flex-1 cursor-pointer" onClick={() => onLoad(calc)}>
                    <div className="font-medium">{calc.title}</div>
                    <div className="text-sm text-muted-foreground">
                      {new Date(calc.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDelete(calc.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
