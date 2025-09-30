import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";

interface InvestorDialogProps {
  investor: any | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export const InvestorDialog = ({ investor, open, onOpenChange, onSuccess }: InvestorDialogProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    firm_name: "",
    email: "",
    website: "",
    linkedin_url: "",
    contact_person: "",
    contact_email: "",
    contact_phone: "",
    pipeline_stage: "research",
    priority: "medium",
    notes: "",
    research_notes: "",
    warm_intro_path: "",
    investment_thesis: "",
    fit_score: "",
  });
  
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState("");
  const [geographies, setGeographies] = useState<string[]>([]);
  const [newGeography, setNewGeography] = useState("");
  const [stages, setStages] = useState<string[]>([]);
  const [newStage, setNewStage] = useState("");
  const [industries, setIndustries] = useState<string[]>([]);
  const [newIndustry, setNewIndustry] = useState("");

  useEffect(() => {
    if (investor) {
      setFormData({
        name: investor.name || "",
        firm_name: investor.firm_name || "",
        email: investor.email || "",
        website: investor.website || "",
        linkedin_url: investor.linkedin_url || "",
        contact_person: investor.contact_person || "",
        contact_email: investor.contact_email || "",
        contact_phone: investor.contact_phone || "",
        pipeline_stage: investor.pipeline_stage || "research",
        priority: investor.priority || "medium",
        notes: investor.notes || "",
        research_notes: investor.research_notes || "",
        warm_intro_path: investor.warm_intro_path || "",
        investment_thesis: investor.investment_thesis || "",
        fit_score: investor.fit_score?.toString() || "",
      });
      setTags(investor.tags || []);
      setGeographies(investor.geographies || []);
      setStages(investor.stage || []);
      setIndustries(investor.industries || []);
    } else {
      resetForm();
    }
  }, [investor, open]);

  const resetForm = () => {
    setFormData({
      name: "",
      firm_name: "",
      email: "",
      website: "",
      linkedin_url: "",
      contact_person: "",
      contact_email: "",
      contact_phone: "",
      pipeline_stage: "research",
      priority: "medium",
      notes: "",
      research_notes: "",
      warm_intro_path: "",
      investment_thesis: "",
      fit_score: "",
    });
    setTags([]);
    setGeographies([]);
    setStages([]);
    setIndustries([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const investorData = {
        ...formData,
        fit_score: formData.fit_score ? parseInt(formData.fit_score) : null,
        tags: tags.length > 0 ? tags : null,
        geographies: geographies.length > 0 ? geographies : null,
        stage: stages.length > 0 ? stages : null,
        industries: industries.length > 0 ? industries : null,
        user_id: user.id,
      };

      if (investor) {
        const { error } = await supabase
          .from("investors")
          .update(investorData)
          .eq("id", investor.id);

        if (error) throw error;

        toast({
          title: "Investor updated",
          description: "The investor has been updated successfully.",
        });
      } else {
        const { error } = await supabase
          .from("investors")
          .insert([investorData]);

        if (error) throw error;

        toast({
          title: "Investor added",
          description: "The investor has been added successfully.",
        });
      }

      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag("");
    }
  };

  const removeTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag));
  };

  const addGeography = () => {
    if (newGeography.trim() && !geographies.includes(newGeography.trim())) {
      setGeographies([...geographies, newGeography.trim()]);
      setNewGeography("");
    }
  };

  const removeGeography = (geo: string) => {
    setGeographies(geographies.filter(g => g !== geo));
  };

  const addStage = () => {
    if (newStage.trim() && !stages.includes(newStage.trim())) {
      setStages([...stages, newStage.trim()]);
      setNewStage("");
    }
  };

  const removeStage = (stage: string) => {
    setStages(stages.filter(s => s !== stage));
  };

  const addIndustry = () => {
    if (newIndustry.trim() && !industries.includes(newIndustry.trim())) {
      setIndustries([...industries, newIndustry.trim()]);
      setNewIndustry("");
    }
  };

  const removeIndustry = (industry: string) => {
    setIndustries(industries.filter(i => i !== industry));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {investor ? "Edit Investor" : "Add New Investor"}
          </DialogTitle>
          <DialogDescription>
            {investor ? "Update investor information and track your relationship" : "Add a new investor to your CRM"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="basic">Basic</TabsTrigger>
              <TabsTrigger value="criteria">Criteria</TabsTrigger>
              <TabsTrigger value="research">Research</TabsTrigger>
              <TabsTrigger value="pipeline">Pipeline</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="firm_name">Firm Name</Label>
                  <Input
                    id="firm_name"
                    value={formData.firm_name}
                    onChange={(e) => setFormData({ ...formData, firm_name: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    value={formData.website}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="linkedin_url">LinkedIn URL</Label>
                  <Input
                    id="linkedin_url"
                    value={formData.linkedin_url}
                    onChange={(e) => setFormData({ ...formData, linkedin_url: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="contact_person">Contact Person</Label>
                  <Input
                    id="contact_person"
                    value={formData.contact_person}
                    onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="contact_email">Contact Email</Label>
                  <Input
                    id="contact_email"
                    type="email"
                    value={formData.contact_email}
                    onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="contact_phone">Contact Phone</Label>
                  <Input
                    id="contact_phone"
                    value={formData.contact_phone}
                    onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="criteria" className="space-y-4">
              <div>
                <Label>Geographies</Label>
                <div className="flex gap-2 mb-2">
                  <Input
                    placeholder="Add geography"
                    value={newGeography}
                    onChange={(e) => setNewGeography(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addGeography())}
                  />
                  <Button type="button" onClick={addGeography}>Add</Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {geographies.map(geo => (
                    <Badge key={geo} variant="secondary">
                      {geo}
                      <X className="h-3 w-3 ml-1 cursor-pointer" onClick={() => removeGeography(geo)} />
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <Label>Investment Stages</Label>
                <div className="flex gap-2 mb-2">
                  <Input
                    placeholder="Add stage"
                    value={newStage}
                    onChange={(e) => setNewStage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addStage())}
                  />
                  <Button type="button" onClick={addStage}>Add</Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {stages.map(stage => (
                    <Badge key={stage} variant="secondary">
                      {stage}
                      <X className="h-3 w-3 ml-1 cursor-pointer" onClick={() => removeStage(stage)} />
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <Label>Industries</Label>
                <div className="flex gap-2 mb-2">
                  <Input
                    placeholder="Add industry"
                    value={newIndustry}
                    onChange={(e) => setNewIndustry(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addIndustry())}
                  />
                  <Button type="button" onClick={addIndustry}>Add</Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {industries.map(industry => (
                    <Badge key={industry} variant="secondary">
                      {industry}
                      <X className="h-3 w-3 ml-1 cursor-pointer" onClick={() => removeIndustry(industry)} />
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <Label>Tags</Label>
                <div className="flex gap-2 mb-2">
                  <Input
                    placeholder="Add tag"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                  />
                  <Button type="button" onClick={addTag}>Add</Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {tags.map(tag => (
                    <Badge key={tag} variant="secondary">
                      {tag}
                      <X className="h-3 w-3 ml-1 cursor-pointer" onClick={() => removeTag(tag)} />
                    </Badge>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="research" className="space-y-4">
              <div>
                <Label htmlFor="investment_thesis">Investment Thesis</Label>
                <Textarea
                  id="investment_thesis"
                  rows={3}
                  value={formData.investment_thesis}
                  onChange={(e) => setFormData({ ...formData, investment_thesis: e.target.value })}
                  placeholder="What does this investor typically look for?"
                />
              </div>
              <div>
                <Label htmlFor="research_notes">Research Notes</Label>
                <Textarea
                  id="research_notes"
                  rows={4}
                  value={formData.research_notes}
                  onChange={(e) => setFormData({ ...formData, research_notes: e.target.value })}
                  placeholder="Key insights about this investor..."
                />
              </div>
              <div>
                <Label htmlFor="warm_intro_path">Warm Introduction Path</Label>
                <Textarea
                  id="warm_intro_path"
                  rows={2}
                  value={formData.warm_intro_path}
                  onChange={(e) => setFormData({ ...formData, warm_intro_path: e.target.value })}
                  placeholder="Who can introduce you to this investor?"
                />
              </div>
              <div>
                <Label htmlFor="notes">General Notes</Label>
                <Textarea
                  id="notes"
                  rows={3}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Additional notes..."
                />
              </div>
            </TabsContent>

            <TabsContent value="pipeline" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="pipeline_stage">Pipeline Stage</Label>
                  <Select
                    value={formData.pipeline_stage}
                    onValueChange={(value) => setFormData({ ...formData, pipeline_stage: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
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
                <div>
                  <Label htmlFor="priority">Priority</Label>
                  <Select
                    value={formData.priority}
                    onValueChange={(value) => setFormData({ ...formData, priority: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="fit_score">Fit Score (0-100)</Label>
                  <Input
                    id="fit_score"
                    type="number"
                    min="0"
                    max="100"
                    value={formData.fit_score}
                    onChange={(e) => setFormData({ ...formData, fit_score: e.target.value })}
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end gap-2 mt-6">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : investor ? "Update" : "Add"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
