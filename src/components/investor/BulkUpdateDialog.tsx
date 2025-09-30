import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { TrendingUp } from "lucide-react";

interface BulkUpdateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedInvestorIds: string[];
  updateType: "pipeline" | "priority" | "tags";
  onSuccess: () => void;
}

export const BulkUpdateDialog = ({
  open,
  onOpenChange,
  selectedInvestorIds,
  updateType,
  onSuccess,
}: BulkUpdateDialogProps) => {
  const { toast } = useToast();
  const [pipelineStage, setPipelineStage] = useState("");
  const [priority, setPriority] = useState("");
  const [tags, setTags] = useState("");
  const [updating, setUpdating] = useState(false);

  const handleUpdate = async () => {
    setUpdating(true);
    try {
      let updateData: any = {};

      if (updateType === "pipeline" && pipelineStage) {
        updateData.pipeline_stage = pipelineStage;
      } else if (updateType === "priority" && priority) {
        updateData.priority = priority;
      } else if (updateType === "tags" && tags) {
        // Get current tags and append new ones
        const { data: investors } = await supabase
          .from("investors")
          .select("id, tags")
          .in("id", selectedInvestorIds);

        // Update each investor with their existing tags plus new ones
        const newTags = tags.split(",").map(t => t.trim()).filter(t => t);
        
        for (const id of selectedInvestorIds) {
          const investor = investors?.find(inv => inv.id === id);
          const existingTags = investor?.tags || [];
          const combinedTags = [...new Set([...existingTags, ...newTags])];
          
          await supabase
            .from("investors")
            .update({ tags: combinedTags })
            .eq("id", id);
        }

        toast({
          title: "Tags updated",
          description: `Tags added to ${selectedInvestorIds.length} investors`,
        });

        onSuccess();
        onOpenChange(false);
        setUpdating(false);
        return;
      }

      if (Object.keys(updateData).length === 0) {
        toast({
          title: "No changes",
          description: "Please select a value to update",
          variant: "destructive",
        });
        setUpdating(false);
        return;
      }

      const { error } = await supabase
        .from("investors")
        .update(updateData)
        .in("id", selectedInvestorIds);

      if (error) throw error;

      toast({
        title: "Bulk update complete",
        description: `Updated ${selectedInvestorIds.length} investors`,
      });

      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Error updating investors",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUpdating(false);
    }
  };

  const getTitle = () => {
    switch (updateType) {
      case "pipeline": return "Update Pipeline Stage";
      case "priority": return "Update Priority";
      case "tags": return "Add Tags";
      default: return "Bulk Update";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            {getTitle()}
          </DialogTitle>
          <DialogDescription>
            Update {selectedInvestorIds.length} selected investors
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {updateType === "pipeline" && (
            <div>
              <Label htmlFor="pipeline">New Pipeline Stage</Label>
              <Select value={pipelineStage} onValueChange={setPipelineStage}>
                <SelectTrigger id="pipeline">
                  <SelectValue placeholder="Select stage" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="research">Research</SelectItem>
                  <SelectItem value="target">Target</SelectItem>
                  <SelectItem value="outreach">Outreach</SelectItem>
                  <SelectItem value="engaged">Engaged</SelectItem>
                  <SelectItem value="meeting">Meeting</SelectItem>
                  <SelectItem value="due_diligence">Due Diligence</SelectItem>
                  <SelectItem value="term_sheet">Term Sheet</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                  <SelectItem value="passed">Passed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {updateType === "priority" && (
            <div>
              <Label htmlFor="priority">New Priority</Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger id="priority">
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {updateType === "tags" && (
            <div>
              <Label htmlFor="tags">Tags to Add</Label>
              <Input
                id="tags"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="Enter tags separated by commas"
              />
              <p className="text-xs text-muted-foreground mt-1">
                e.g., AI, Healthcare, Enterprise
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleUpdate} disabled={updating}>
            {updating ? "Updating..." : "Update All"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};