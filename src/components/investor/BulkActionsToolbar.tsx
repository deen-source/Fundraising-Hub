import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Mail, 
  Tag, 
  TrendingUp, 
  X,
  CheckCircle,
  Clock
} from "lucide-react";

interface BulkActionsToolbarProps {
  selectedCount: number;
  onCreateCampaign: () => void;
  onBulkUpdatePipeline: () => void;
  onBulkUpdatePriority: () => void;
  onBulkAddTags: () => void;
  onClearSelection: () => void;
}

export const BulkActionsToolbar = ({
  selectedCount,
  onCreateCampaign,
  onBulkUpdatePipeline,
  onBulkUpdatePriority,
  onBulkAddTags,
  onClearSelection,
}: BulkActionsToolbarProps) => {
  if (selectedCount === 0) return null;

  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 bg-primary text-primary-foreground shadow-lg rounded-lg p-4 flex items-center gap-4 animate-in slide-in-from-bottom-5">
      <Badge variant="secondary" className="text-lg px-3 py-1">
        {selectedCount} selected
      </Badge>
      
      <div className="flex gap-2">
        <Button 
          variant="secondary" 
          size="sm"
          onClick={onCreateCampaign}
          className="gap-2"
        >
          <Mail className="h-4 w-4" />
          Create Campaign
        </Button>
        
        <Button 
          variant="secondary" 
          size="sm"
          onClick={onBulkUpdatePipeline}
          className="gap-2"
        >
          <TrendingUp className="h-4 w-4" />
          Update Stage
        </Button>
        
        <Button 
          variant="secondary" 
          size="sm"
          onClick={onBulkUpdatePriority}
          className="gap-2"
        >
          <CheckCircle className="h-4 w-4" />
          Set Priority
        </Button>
        
        <Button 
          variant="secondary" 
          size="sm"
          onClick={onBulkAddTags}
          className="gap-2"
        >
          <Tag className="h-4 w-4" />
          Add Tags
        </Button>
      </div>

      <Button
        variant="ghost"
        size="icon"
        onClick={onClearSelection}
        className="ml-2"
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
};