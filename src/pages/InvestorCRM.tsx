import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { investorSeedData } from "@/data/investorSeedData";
import { AuthGuard } from "@/components/AuthGuard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { 
  ArrowLeft, 
  Search, 
  Filter, 
  Plus, 
  Upload,
  Building2,
  MapPin,
  TrendingUp,
  Clock,
  Star,
  ChevronDown,
  LayoutGrid,
  Table as TableIcon
} from "lucide-react";
import { InvestorDialog } from "@/components/investor/InvestorDialog";
import { InvestorKanban } from "@/components/investor/InvestorKanban";
import { BulkImportDialog } from "@/components/investor/BulkImportDialog";
import { BulkActionsToolbar } from "@/components/investor/BulkActionsToolbar";
import { OutreachCampaignDialog } from "@/components/investor/OutreachCampaignDialog";
import { BulkUpdateDialog } from "@/components/investor/BulkUpdateDialog";
import { MultiSelectFilter } from "@/components/investor/MultiSelectFilter";

interface Investor {
  id: string;
  name: string;
  firm_name: string | null;
  email: string | null;
  website: string | null;
  linkedin_url: string | null;
  geographies: string[] | null;
  stage: string[] | null;
  industries: string[] | null;
  check_size_min: number | null;
  check_size_max: number | null;
  pipeline_stage: string;
  priority: string;
  tags: string[] | null;
  notes: string | null;
  last_contact_date: string | null;
  next_follow_up_date: string | null;
  contact_person: string | null;
  contact_email: string | null;
  warm_intro_path: string | null;
  fit_score: number | null;
  created_at: string;
}

const InvestorCRM = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [investors, setInvestors] = useState<Investor[]>([]);
  const [filteredInvestors, setFilteredInvestors] = useState<Investor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [pipelineFilter, setPipelineFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [stageFilter, setStageFilter] = useState<string>("all");
  const [locationFilter, setLocationFilter] = useState<string>("all");
  const [tagsFilter, setTagsFilter] = useState<string[]>([]);
  const [industriesFilter, setIndustriesFilter] = useState<string[]>([]);
  const [checkSizeMin, setCheckSizeMin] = useState<string>("");
  const [checkSizeMax, setCheckSizeMax] = useState<string>("");
  const [fitScoreMin, setFitScoreMin] = useState<string>("");
  const [selectedInvestor, setSelectedInvestor] = useState<Investor | null>(null);
  const [selectedInvestorIds, setSelectedInvestorIds] = useState<string[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [isCampaignDialogOpen, setIsCampaignDialogOpen] = useState(false);
  const [isBulkUpdateDialogOpen, setIsBulkUpdateDialogOpen] = useState(false);
  const [bulkUpdateType, setBulkUpdateType] = useState<"pipeline" | "priority" | "tags">("pipeline");
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"table" | "kanban">("kanban");

  const pipelineStages = [
    { value: "research", label: "Research", color: "bg-slate-500" },
    { value: "target", label: "Target", color: "bg-blue-500" },
    { value: "outreach", label: "Outreach", color: "bg-purple-500" },
    { value: "engaged", label: "Engaged", color: "bg-yellow-500" },
    { value: "meeting", label: "Meeting", color: "bg-orange-500" },
    { value: "due_diligence", label: "Due Diligence", color: "bg-green-500" },
    { value: "term_sheet", label: "Term Sheet", color: "bg-emerald-500" },
    { value: "closed", label: "Closed", color: "bg-green-600" },
    { value: "passed", label: "Passed", color: "bg-red-500" }
  ];

  useEffect(() => {
    loadInvestors();
  }, []);

  useEffect(() => {
    filterInvestors();
  }, [investors, searchQuery, pipelineFilter, priorityFilter, stageFilter, locationFilter, tagsFilter, industriesFilter, checkSizeMin, checkSizeMax, fitScoreMin]);

  const loadInvestors = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("investors")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      // If user has no investors, preload the default list
      if (!data || data.length === 0) {
        await preloadDefaultInvestors();
        // Reload after preloading
        const { data: newData, error: newError } = await supabase
          .from("investors")
          .select("*")
          .order("created_at", { ascending: false });
        
        if (newError) throw newError;
        setInvestors(newData || []);
      } else {
        setInvestors(data || []);
      }
    } catch (error: any) {
      toast({
        title: "Error loading investors",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const preloadDefaultInvestors = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const investorsWithUserId = investorSeedData.map(inv => ({
      ...inv,
      user_id: user.id,
      pipeline_stage: "research",
      priority: "medium"
    }));

    const { error } = await supabase
      .from("investors")
      .insert(investorsWithUserId);

    if (error) {
      console.error("Error preloading investors:", error);
    }
  };

  const filterInvestors = () => {
    let filtered = [...investors];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(inv => 
        inv.name.toLowerCase().includes(query) ||
        inv.firm_name?.toLowerCase().includes(query) ||
        inv.email?.toLowerCase().includes(query) ||
        inv.contact_person?.toLowerCase().includes(query)
      );
    }

    // Pipeline filter
    if (pipelineFilter !== "all") {
      filtered = filtered.filter(inv => inv.pipeline_stage === pipelineFilter);
    }

    // Priority filter
    if (priorityFilter !== "all") {
      filtered = filtered.filter(inv => inv.priority === priorityFilter);
    }

    // Stage filter
    if (stageFilter !== "all") {
      filtered = filtered.filter(inv => 
        inv.stage?.includes(stageFilter)
      );
    }

    // Location filter
    if (locationFilter !== "all") {
      filtered = filtered.filter(inv => 
        inv.geographies?.some(geo => geo.toLowerCase().includes(locationFilter.toLowerCase()))
      );
    }

    // Tags filter
    if (tagsFilter.length > 0) {
      filtered = filtered.filter(inv =>
        inv.tags?.some(tag => tagsFilter.includes(tag))
      );
    }

    // Industries filter
    if (industriesFilter.length > 0) {
      filtered = filtered.filter(inv =>
        inv.industries?.some(industry => industriesFilter.includes(industry))
      );
    }

    // Check size filter
    if (checkSizeMin) {
      const minValue = parseFloat(checkSizeMin);
      filtered = filtered.filter(inv =>
        inv.check_size_max && inv.check_size_max >= minValue
      );
    }
    if (checkSizeMax) {
      const maxValue = parseFloat(checkSizeMax);
      filtered = filtered.filter(inv =>
        inv.check_size_min && inv.check_size_min <= maxValue
      );
    }

    // Fit score filter
    if (fitScoreMin) {
      const minScore = parseInt(fitScoreMin);
      filtered = filtered.filter(inv =>
        inv.fit_score && inv.fit_score >= minScore
      );
    }

    setFilteredInvestors(filtered);
  };

  const getPipelineColor = (stage: string) => {
    return pipelineStages.find(s => s.value === stage)?.color || "bg-gray-500";
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "bg-red-500";
      case "medium": return "bg-yellow-500";
      case "low": return "bg-green-500";
      default: return "bg-gray-500";
    }
  };

  const handleAddInvestor = () => {
    setSelectedInvestor(null);
    setIsDialogOpen(true);
  };

  const handleEditInvestor = (investor: Investor) => {
    setSelectedInvestor(investor);
    setIsDialogOpen(true);
  };

  const handleImportComplete = () => {
    loadInvestors();
    setIsImportDialogOpen(false);
  };

  const handleSelectAll = () => {
    if (selectedInvestorIds.length === filteredInvestors.length) {
      setSelectedInvestorIds([]);
    } else {
      setSelectedInvestorIds(filteredInvestors.map(inv => inv.id));
    }
  };

  const handleSelectInvestor = (investorId: string) => {
    setSelectedInvestorIds(prev =>
      prev.includes(investorId)
        ? prev.filter(id => id !== investorId)
        : [...prev, investorId]
    );
  };

  const handleBulkAction = (type: "pipeline" | "priority" | "tags") => {
    setBulkUpdateType(type);
    setIsBulkUpdateDialogOpen(true);
  };

  const handleBulkUpdateSuccess = () => {
    loadInvestors();
    setSelectedInvestorIds([]);
  };

  // Get unique values for filters
  const uniqueLocations = Array.from(new Set(
    investors.flatMap(inv => inv.geographies || [])
  )).sort();

  const uniqueStages = Array.from(new Set(
    investors.flatMap(inv => inv.stage || [])
  )).sort();

  const uniqueTags = Array.from(new Set(
    investors.flatMap(inv => inv.tags || [])
  )).sort();

  const uniqueIndustries = Array.from(new Set(
    investors.flatMap(inv => inv.industries || [])
  )).sort();

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate("/dashboard")}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                  Investor CRM
                </h1>
                <p className="text-muted-foreground mt-1">
                  Manage your investor pipeline and relationships
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <div className="flex border rounded-lg p-1">
                <Button 
                  variant={viewMode === "kanban" ? "default" : "ghost"} 
                  size="sm"
                  onClick={() => setViewMode("kanban")}
                >
                  <LayoutGrid className="h-4 w-4 mr-2" />
                  Kanban
                </Button>
                <Button 
                  variant={viewMode === "table" ? "default" : "ghost"} 
                  size="sm"
                  onClick={() => setViewMode("table")}
                >
                  <TableIcon className="h-4 w-4 mr-2" />
                  Table
                </Button>
              </div>
              <Button onClick={() => setIsImportDialogOpen(true)} variant="outline">
                <Upload className="h-4 w-4 mr-2" />
                Bulk Import
              </Button>
              <Button onClick={handleAddInvestor}>
                <Plus className="h-4 w-4 mr-2" />
                Add Investor
              </Button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Investors
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{investors.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Active Pipeline
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {investors.filter(inv => 
                    ["outreach", "engaged", "meeting", "due_diligence"].includes(inv.pipeline_stage)
                  ).length}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  High Priority
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {investors.filter(inv => inv.priority === "high").length}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Follow-ups Due
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {investors.filter(inv => 
                    inv.next_follow_up_date && new Date(inv.next_follow_up_date) <= new Date()
                  ).length}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Collapsible open={isFiltersOpen} onOpenChange={setIsFiltersOpen}>
            <Card className="mb-6">
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-accent/50 transition-colors">
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Filter className="h-5 w-5" />
                      Advanced Filters
                      {(searchQuery || pipelineFilter !== "all" || priorityFilter !== "all" || 
                        stageFilter !== "all" || locationFilter !== "all" || tagsFilter.length > 0 || 
                        industriesFilter.length > 0 || checkSizeMin || checkSizeMax || fitScoreMin) && (
                        <Badge variant="secondary" className="ml-2">Active</Badge>
                      )}
                    </div>
                    <ChevronDown className={`h-5 w-5 transition-transform ${isFiltersOpen ? 'rotate-180' : ''}`} />
                  </CardTitle>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="relative md:col-span-3">
                        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Search investors..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-9"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Select value={pipelineFilter} onValueChange={setPipelineFilter}>
                        <SelectTrigger>
                          <SelectValue placeholder="Pipeline Stage" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Stages</SelectItem>
                          {pipelineStages.map(stage => (
                            <SelectItem key={stage.value} value={stage.value}>
                              {stage.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                        <SelectTrigger>
                          <SelectValue placeholder="Priority" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Priorities</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="low">Low</SelectItem>
                        </SelectContent>
                      </Select>
                      <Select value={stageFilter} onValueChange={setStageFilter}>
                        <SelectTrigger>
                          <SelectValue placeholder="Investment Stage" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Investment Stages</SelectItem>
                          {uniqueStages.map(stage => (
                            <SelectItem key={stage} value={stage}>{stage}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Select value={locationFilter} onValueChange={setLocationFilter}>
                        <SelectTrigger>
                          <SelectValue placeholder="Location" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Locations</SelectItem>
                          {uniqueLocations.map(location => (
                            <SelectItem key={location} value={location}>{location}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <MultiSelectFilter
                        options={uniqueTags}
                        selectedValues={tagsFilter}
                        onChange={setTagsFilter}
                        placeholder="Tags"
                      />

                      <MultiSelectFilter
                        options={uniqueIndustries}
                        selectedValues={industriesFilter}
                        onChange={setIndustriesFilter}
                        placeholder="Industries"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="flex gap-2 md:col-span-2">
                        <Input
                          type="number"
                          placeholder="Min check ($M)"
                          value={checkSizeMin}
                          onChange={(e) => setCheckSizeMin(e.target.value)}
                        />
                        <Input
                          type="number"
                          placeholder="Max check ($M)"
                          value={checkSizeMax}
                          onChange={(e) => setCheckSizeMax(e.target.value)}
                        />
                      </div>

                      <Input
                        type="number"
                        placeholder="Min fit score (0-100)"
                        value={fitScoreMin}
                        onChange={(e) => setFitScoreMin(e.target.value)}
                        min="0"
                        max="100"
                      />
                    </div>

                    {(tagsFilter.length > 0 || industriesFilter.length > 0) && (
                      <div className="flex flex-wrap gap-2 pt-2">
                        {tagsFilter.map(tag => (
                          <Badge key={tag} variant="secondary">
                            {tag}
                          </Badge>
                        ))}
                        {industriesFilter.map(industry => (
                          <Badge key={industry} variant="secondary">
                            {industry}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>

          {/* Investors Table or Kanban */}
          {viewMode === "kanban" ? (
            <Card>
              <CardHeader>
                <CardTitle>Pipeline ({filteredInvestors.length} investors)</CardTitle>
                <CardDescription>
                  Drag and drop investors between stages to track your fundraising progress
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8">Loading investors...</div>
                ) : filteredInvestors.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No investors found. Add your first investor or import a database.
                  </div>
                ) : (
                  <InvestorKanban 
                    investors={filteredInvestors}
                    onInvestorClick={handleEditInvestor}
                    onRefresh={loadInvestors}
                  />
                )}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Investors ({filteredInvestors.length})</CardTitle>
                <CardDescription>
                  Click on an investor to view details and track interactions
                </CardDescription>
              </CardHeader>
              <CardContent>
              {loading ? (
                <div className="text-center py-8">Loading investors...</div>
              ) : filteredInvestors.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No investors found. Add your first investor or import a database.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">
                          <Checkbox
                            checked={selectedInvestorIds.length === filteredInvestors.length && filteredInvestors.length > 0}
                            onCheckedChange={handleSelectAll}
                          />
                        </TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Firm</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead>Stage Focus</TableHead>
                        <TableHead>Pipeline</TableHead>
                        <TableHead>Priority</TableHead>
                        <TableHead>Fit Score</TableHead>
                        <TableHead>Last Contact</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredInvestors.map((investor) => (
                        <TableRow 
                          key={investor.id}
                          className="hover:bg-muted/50"
                        >
                          <TableCell onClick={(e) => e.stopPropagation()}>
                            <Checkbox
                              checked={selectedInvestorIds.includes(investor.id)}
                              onCheckedChange={() => handleSelectInvestor(investor.id)}
                            />
                          </TableCell>
                          <TableCell 
                            className="font-medium cursor-pointer"
                            onClick={() => handleEditInvestor(investor)}
                          >
                            {investor.name}
                          </TableCell>
                          <TableCell
                            className="cursor-pointer"
                            onClick={() => handleEditInvestor(investor)}
                          >
                            <div className="flex items-center gap-2">
                              <Building2 className="h-4 w-4 text-muted-foreground" />
                              {investor.firm_name || "-"}
                            </div>
                          </TableCell>
                          <TableCell
                            className="cursor-pointer"
                            onClick={() => handleEditInvestor(investor)}
                          >
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4 text-muted-foreground" />
                              {investor.geographies?.[0] || "-"}
                            </div>
                          </TableCell>
                          <TableCell
                            className="cursor-pointer"
                            onClick={() => handleEditInvestor(investor)}
                          >
                            <div className="flex flex-wrap gap-1">
                              {investor.stage?.slice(0, 2).map(stage => (
                                <Badge key={stage} variant="secondary" className="text-xs">
                                  {stage}
                                </Badge>
                              ))}
                            </div>
                          </TableCell>
                          <TableCell
                            className="cursor-pointer"
                            onClick={() => handleEditInvestor(investor)}
                          >
                            <Badge className={getPipelineColor(investor.pipeline_stage)}>
                              {pipelineStages.find(s => s.value === investor.pipeline_stage)?.label}
                            </Badge>
                          </TableCell>
                          <TableCell
                            className="cursor-pointer"
                            onClick={() => handleEditInvestor(investor)}
                          >
                            <Badge className={getPriorityColor(investor.priority)}>
                              {investor.priority}
                            </Badge>
                          </TableCell>
                          <TableCell
                            className="cursor-pointer"
                            onClick={() => handleEditInvestor(investor)}
                          >
                            {investor.fit_score ? (
                              <div className="flex items-center gap-1">
                                <Star className="h-4 w-4 text-yellow-500" />
                                {investor.fit_score}
                              </div>
                            ) : (
                              "-"
                            )}
                          </TableCell>
                          <TableCell
                            className="cursor-pointer"
                            onClick={() => handleEditInvestor(investor)}
                          >
                            {investor.last_contact_date ? (
                              <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4 text-muted-foreground" />
                                {new Date(investor.last_contact_date).toLocaleDateString()}
                              </div>
                            ) : (
                              "-"
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
          )}
        </div>
      </div>

      <InvestorDialog
        investor={selectedInvestor}
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSuccess={loadInvestors}
      />

      <BulkImportDialog
        open={isImportDialogOpen}
        onOpenChange={setIsImportDialogOpen}
        onSuccess={handleImportComplete}
      />

      <BulkActionsToolbar
        selectedCount={selectedInvestorIds.length}
        onCreateCampaign={() => setIsCampaignDialogOpen(true)}
        onBulkUpdatePipeline={() => handleBulkAction("pipeline")}
        onBulkUpdatePriority={() => handleBulkAction("priority")}
        onBulkAddTags={() => handleBulkAction("tags")}
        onClearSelection={() => setSelectedInvestorIds([])}
      />

      <OutreachCampaignDialog
        open={isCampaignDialogOpen}
        onOpenChange={setIsCampaignDialogOpen}
        selectedInvestorIds={selectedInvestorIds}
        onSuccess={() => {
          setSelectedInvestorIds([]);
          setIsCampaignDialogOpen(false);
        }}
      />

      <BulkUpdateDialog
        open={isBulkUpdateDialogOpen}
        onOpenChange={setIsBulkUpdateDialogOpen}
        selectedInvestorIds={selectedInvestorIds}
        updateType={bulkUpdateType}
        onSuccess={handleBulkUpdateSuccess}
      />
    </AuthGuard>
  );
};

export default InvestorCRM;
