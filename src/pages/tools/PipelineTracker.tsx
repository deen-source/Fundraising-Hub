import { useState, useEffect } from 'react';
import { AuthGuard } from '@/components/AuthGuard';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { ArrowLeft, Plus, TrendingUp, Mail, Linkedin, Building2, DollarSign, Calendar, Target, Info, HelpCircle, Users } from 'lucide-react';

interface Investor {
  id: string;
  name: string;
  firm_name: string;
  email: string;
  linkedin_url: string;
  pipeline_stage: string;
  priority: string;
  check_size_min: number | null;
  check_size_max: number | null;
  last_contact_date: string | null;
  next_follow_up_date: string | null;
  fit_score: number | null;
}

const PIPELINE_STAGES = [
  { 
    id: 'research', 
    name: 'Research', 
    color: 'bg-slate-500',
    description: 'Identify and research potential investors'
  },
  { 
    id: 'outreach', 
    name: 'Outreach', 
    color: 'bg-blue-500',
    description: 'Initial contact and introduction'
  },
  { 
    id: 'in_conversation', 
    name: 'In Conversation', 
    color: 'bg-purple-500',
    description: 'Active discussions with investor'
  },
  { 
    id: 'meeting_scheduled', 
    name: 'Meeting Scheduled', 
    color: 'bg-indigo-500',
    description: 'Formal meeting set up'
  },
  { 
    id: 'pitch_sent', 
    name: 'Pitch Sent', 
    color: 'bg-cyan-500',
    description: 'Pitch deck or proposal shared'
  },
  { 
    id: 'due_diligence', 
    name: 'Due Diligence', 
    color: 'bg-orange-500',
    description: 'Investor conducting detailed review'
  },
  { 
    id: 'committed', 
    name: 'Committed', 
    color: 'bg-green-500',
    description: 'Investment commitment received'
  },
  { 
    id: 'passed', 
    name: 'Passed', 
    color: 'bg-red-500',
    description: 'Investor declined to invest'
  },
];

const PipelineTracker = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [investors, setInvestors] = useState<Investor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');

  useEffect(() => {
    loadInvestors();
  }, []);

  const loadInvestors = async () => {
    try {
      const { data, error } = await supabase
        .from('investors')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setInvestors(data || []);
    } catch (error) {
      console.error('Error loading investors:', error);
      toast({
        title: 'Error',
        description: 'Failed to load investors',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination) return;

    const investorId = result.draggableId;
    const newStage = result.destination.droppableId;

    try {
      const { error } = await supabase
        .from('investors')
        .update({ pipeline_stage: newStage })
        .eq('id', investorId);

      if (error) throw error;

      setInvestors(prevInvestors =>
        prevInvestors.map(inv =>
          inv.id === investorId ? { ...inv, pipeline_stage: newStage } : inv
        )
      );

      toast({
        title: 'Pipeline Updated',
        description: 'Investor moved successfully',
      });
    } catch (error) {
      console.error('Error updating pipeline:', error);
      toast({
        title: 'Error',
        description: 'Failed to update pipeline',
        variant: 'destructive',
      });
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'border-red-300 text-red-700 bg-red-50 dark:bg-red-950 dark:text-red-300';
      case 'medium': return 'border-yellow-300 text-yellow-700 bg-yellow-50 dark:bg-yellow-950 dark:text-yellow-300';
      case 'low': return 'border-green-300 text-green-700 bg-green-50 dark:bg-green-950 dark:text-green-300';
      default: return 'border-gray-300 text-gray-700 bg-gray-50 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  const formatCheckSize = (min: number | null, max: number | null) => {
    if (!min && !max) return 'N/A';
    if (min && max) return `$${(min / 1000).toFixed(0)}K - $${(max / 1000).toFixed(0)}K`;
    if (min) return `$${(min / 1000).toFixed(0)}K+`;
    if (max) return `Up to $${(max / 1000).toFixed(0)}K`;
    return 'N/A';
  };

  const filteredInvestors = investors.filter(investor => {
    const matchesSearch = searchQuery === '' || 
      investor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      investor.firm_name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPriority = priorityFilter === 'all' || investor.priority === priorityFilter;
    return matchesSearch && matchesPriority;
  });

  const totalInvestors = investors.length;
  const activeConversations = investors.filter(i => i.pipeline_stage === 'in_conversation').length;
  const committed = investors.filter(i => i.pipeline_stage === 'committed').length;

  // Empty state
  if (!isLoading && investors.length === 0) {
    return (
      <AuthGuard>
        <div className="min-h-screen bg-background">
          <div className="container mx-auto py-8 px-4">
            <div className="flex items-center gap-4 mb-6">
              <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="flex-1">
                <h1 className="text-3xl font-bold">Investor Pipeline</h1>
                <p className="text-muted-foreground">Track and manage your fundraising process</p>
              </div>
            </div>

            <div className="max-w-3xl mx-auto">
              <Card className="border-dashed">
                <CardHeader className="text-center pb-4">
                  <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                    <Users className="h-8 w-8 text-primary" />
                  </div>
                  <CardTitle className="text-2xl">Welcome to Your Investor Pipeline!</CardTitle>
                  <CardDescription className="text-base mt-2">
                    Organize and track your fundraising journey from research to commitment
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center flex-shrink-0">
                        <span className="text-blue-600 dark:text-blue-300 font-semibold text-sm">1</span>
                      </div>
                      <div>
                        <h3 className="font-semibold mb-1">Add Your First Investor</h3>
                        <p className="text-sm text-muted-foreground">
                          Start by adding investors you want to connect with. Include their contact info, firm details, and investment preferences.
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center flex-shrink-0">
                        <span className="text-purple-600 dark:text-purple-300 font-semibold text-sm">2</span>
                      </div>
                      <div>
                        <h3 className="font-semibold mb-1">Track Progress with Drag & Drop</h3>
                        <p className="text-sm text-muted-foreground">
                          Simply drag investor cards between stages as your conversations progress—from initial research to commitment.
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center flex-shrink-0">
                        <span className="text-green-600 dark:text-green-300 font-semibold text-sm">3</span>
                      </div>
                      <div>
                        <h3 className="font-semibold mb-1">Stay Organized</h3>
                        <p className="text-sm text-muted-foreground">
                          Set priorities, track follow-up dates, and monitor your entire fundraising pipeline in one visual board.
                        </p>
                      </div>
                    </div>
                  </div>

                  <Button 
                    className="w-full" 
                    size="lg"
                    onClick={() => navigate('/investor-crm')}
                  >
                    <Plus className="h-5 w-5 mr-2" />
                    Add Your First Investor
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
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
                  <h1 className="text-3xl font-bold">Investor Pipeline</h1>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <HelpCircle className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p className="text-sm">
                          Drag and drop investor cards between stages to track your fundraising progress. 
                          Click on investors to edit details or contact them directly.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <p className="text-muted-foreground">Track and manage your fundraising process</p>
              </div>
              <Button onClick={() => navigate('/investor-crm')}>
                <Plus className="h-4 w-4 mr-2" />
                Add Investor
              </Button>
            </div>

            {/* Filters */}
            <div className="flex gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Search investors by name or firm..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priorities</SelectItem>
                  <SelectItem value="high">High Priority</SelectItem>
                  <SelectItem value="medium">Medium Priority</SelectItem>
                  <SelectItem value="low">Low Priority</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card>
              <CardHeader className="pb-3">
                <CardDescription className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Total Investors
                </CardDescription>
                <CardTitle className="text-3xl">{totalInvestors}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardDescription className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Active Conversations
                </CardDescription>
                <CardTitle className="text-3xl">{activeConversations}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardDescription className="flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Committed
                </CardDescription>
                <CardTitle className="text-3xl text-green-600 dark:text-green-400">{committed}</CardTitle>
              </CardHeader>
            </Card>
          </div>

          {/* Pipeline Board */}
          {isLoading ? (
            <div className="text-center py-12">Loading pipeline...</div>
          ) : (
            <DragDropContext onDragEnd={handleDragEnd}>
              <div className="flex gap-4 overflow-x-auto pb-4">
                {PIPELINE_STAGES.map(stage => {
                  const stageInvestors = filteredInvestors.filter(inv => inv.pipeline_stage === stage.id);
                  return (
                    <div key={stage.id} className="flex flex-col min-w-[320px]">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className={`${stage.color} text-white p-3 rounded-t-lg font-semibold flex items-center justify-between cursor-help`}>
                              <span>{stage.name}</span>
                              <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                                {stageInvestors.length}
                              </Badge>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="text-sm">{stage.description}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      <Droppable droppableId={stage.id}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.droppableProps}
                            className={`flex-1 p-3 border-x border-b rounded-b-lg min-h-[500px] space-y-3 transition-colors ${
                              snapshot.isDraggingOver ? 'bg-accent' : 'bg-card'
                            }`}
                          >
                            {stageInvestors.length === 0 ? (
                              <div className="text-center py-8 text-sm text-muted-foreground">
                                <div className="mb-2 opacity-50">
                                  <Users className="h-8 w-8 mx-auto" />
                                </div>
                                Drop investors here
                              </div>
                            ) : (
                              stageInvestors.map((investor, index) => (
                                <Draggable
                                  key={investor.id}
                                  draggableId={investor.id}
                                  index={index}
                                >
                                  {(provided, snapshot) => (
                                    <Card
                                      ref={provided.innerRef}
                                      {...provided.draggableProps}
                                      {...provided.dragHandleProps}
                                      className={`p-4 cursor-move transition-all ${
                                        snapshot.isDragging ? 'shadow-lg ring-2 ring-primary rotate-2' : 'hover:shadow-md'
                                      }`}
                                    >
                                      <div className="space-y-3">
                                        <div>
                                          <p className="font-semibold text-sm mb-1">{investor.name}</p>
                                          {investor.firm_name && (
                                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                              <Building2 className="h-3 w-3" />
                                              {investor.firm_name}
                                            </div>
                                          )}
                                        </div>

                                        {investor.priority && (
                                          <Badge variant="outline" className={getPriorityColor(investor.priority)}>
                                            {investor.priority}
                                          </Badge>
                                        )}

                                        <div className="space-y-2 text-xs">
                                          {(investor.check_size_min || investor.check_size_max) && (
                                            <div className="flex items-center gap-1 text-muted-foreground">
                                              <DollarSign className="h-3 w-3" />
                                              {formatCheckSize(investor.check_size_min, investor.check_size_max)}
                                            </div>
                                          )}
                                          
                                          {investor.fit_score && (
                                            <div className="flex items-center gap-1 text-muted-foreground">
                                              <Target className="h-3 w-3" />
                                              Fit Score: {investor.fit_score}%
                                            </div>
                                          )}

                                          {investor.next_follow_up_date && (
                                            <div className="flex items-center gap-1 text-muted-foreground">
                                              <Calendar className="h-3 w-3" />
                                              Follow up: {new Date(investor.next_follow_up_date).toLocaleDateString()}
                                            </div>
                                          )}
                                        </div>

                                        <div className="flex gap-2 pt-2 border-t">
                                          {investor.email && (
                                            <TooltipProvider>
                                              <Tooltip>
                                                <TooltipTrigger asChild>
                                                  <Button variant="ghost" size="sm" className="h-7 px-2" asChild>
                                                    <a href={`mailto:${investor.email}`}>
                                                      <Mail className="h-3 w-3" />
                                                    </a>
                                                  </Button>
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                  <p>Send email</p>
                                                </TooltipContent>
                                              </Tooltip>
                                            </TooltipProvider>
                                          )}
                                          {investor.linkedin_url && (
                                            <TooltipProvider>
                                              <Tooltip>
                                                <TooltipTrigger asChild>
                                                  <Button variant="ghost" size="sm" className="h-7 px-2" asChild>
                                                    <a href={investor.linkedin_url} target="_blank" rel="noopener noreferrer">
                                                      <Linkedin className="h-3 w-3" />
                                                    </a>
                                                  </Button>
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                  <p>View LinkedIn</p>
                                                </TooltipContent>
                                              </Tooltip>
                                            </TooltipProvider>
                                          )}
                                        </div>
                                      </div>
                                    </Card>
                                  )}
                                </Draggable>
                              ))
                            )}
                            {provided.placeholder}
                          </div>
                        )}
                      </Droppable>
                    </div>
                  );
                })}
              </div>
            </DragDropContext>
          )}
        </div>
      </div>
    </AuthGuard>
  );
};

export default PipelineTracker;
