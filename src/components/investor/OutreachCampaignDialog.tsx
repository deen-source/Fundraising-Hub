import { useState, useEffect } from "react";
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Mail, Sparkles, Save } from "lucide-react";

interface Template {
  id: string;
  name: string;
  subject: string;
  body: string;
}

interface OutreachCampaignDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedInvestorIds: string[];
  onSuccess: () => void;
}

export const OutreachCampaignDialog = ({
  open,
  onOpenChange,
  selectedInvestorIds,
  onSuccess,
}: OutreachCampaignDialogProps) => {
  const { toast } = useToast();
  const [campaignName, setCampaignName] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      loadTemplates();
    }
  }, [open]);

  const loadTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from("email_templates")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setTemplates(data || []);
    } catch (error: any) {
      console.error("Error loading templates:", error);
    }
  };

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplate(templateId);
    const template = templates.find(t => t.id === templateId);
    if (template) {
      setSubject(template.subject);
      setBody(template.body);
    }
  };

  const handleSave = async () => {
    if (!campaignName || !subject || !body) {
      toast({
        title: "Missing fields",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("email_campaigns")
        .insert([{
          user_id: user.id,
          name: campaignName,
          subject,
          body,
          template_id: selectedTemplate || null,
          target_investor_ids: selectedInvestorIds,
          total_recipients: selectedInvestorIds.length,
          status: 'draft'
        }]);

      if (error) throw error;

      toast({
        title: "Campaign created",
        description: `Campaign "${campaignName}" has been saved as a draft. You can send it later.`,
      });

      onSuccess();
      onOpenChange(false);
      
      // Reset form
      setCampaignName("");
      setSubject("");
      setBody("");
      setSelectedTemplate("");
    } catch (error: any) {
      toast({
        title: "Error creating campaign",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Create Outreach Campaign
          </DialogTitle>
          <DialogDescription>
            Create an email campaign for {selectedInvestorIds.length} selected investors
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="campaign-name">Campaign Name</Label>
            <Input
              id="campaign-name"
              value={campaignName}
              onChange={(e) => setCampaignName(e.target.value)}
              placeholder="e.g., Series A Outreach - Q1 2024"
            />
          </div>

          <div>
            <Label htmlFor="template">Use Template (Optional)</Label>
            <Select value={selectedTemplate} onValueChange={handleTemplateSelect}>
              <SelectTrigger id="template">
                <SelectValue placeholder="Select a template or write from scratch" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No template</SelectItem>
                {templates.map(template => (
                  <SelectItem key={template.id} value={template.id}>
                    {template.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="subject">Email Subject</Label>
            <Input
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g., Introduction to [Your Company]"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Tip: Use [Investor Name], [Firm Name] for personalization
            </p>
          </div>

          <div>
            <Label htmlFor="body">Email Body</Label>
            <Textarea
              id="body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={12}
              placeholder="Dear [Investor Name],

I hope this email finds you well. I'm reaching out to introduce [Your Company]...

Best regards,
[Your Name]"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Available tokens: [Investor Name], [Firm Name], [Your Company], [Your Name]
            </p>
          </div>

          <div className="bg-muted p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <p className="text-sm font-medium">Campaign Preview</p>
            </div>
            <p className="text-sm text-muted-foreground">
              This campaign will be saved as a draft. You can review and send it later
              or set up email integration to send automatically.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? "Saving..." : "Save Campaign"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};